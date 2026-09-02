import json
import socket
import time

from django.conf import settings
from django.http import Http404
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Command,
    Credential,
    DailyLog,
    EnvVar,
    FocusSession,
    FocusSettings,
    IbadahLog,
    Project,
    Server,
    Task,
    UptimeCheck,
)
from .serializers import (
    CommandSerializer,
    CredentialSerializer,
    DailyLogSerializer,
    EnvVarSerializer,
    FocusSessionSerializer,
    FocusSettingsSerializer,
    IbadahLogSerializer,
    ProjectSerializer,
    ServerSerializer,
    TaskSerializer,
    UptimeCheckSerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        if status_param:
            qs = qs.filter(status=status_param)
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    # GitHub analytics are cached for an hour so opening a project is instant.
    GITHUB_CACHE_TTL = 3600

    @action(detail=True, methods=['get'])
    def github(self, request, pk=None):
        """Proxy GitHub analytics for every GitHub repo linked to the project.

        Served from a per-project cache (TTL 1h). Pass ?refresh=true to force a
        fresh fetch and update the cache. The response includes `fetched_at`.
        """
        from django.utils import timezone

        from . import github as gh
        from .models import GithubCache

        project = self.get_object()
        entries = list(project.repos or [])
        if project.repo_url and not entries:
            entries = [{'label': 'Repo', 'url': project.repo_url}]

        # Keep only GitHub repos, cap at 4 to bound API calls.
        gh_repos = [e for e in entries if e.get('url') and gh.parse_repo(e['url'])][:4]
        if not gh_repos:
            return Response({'ok': False, 'error': 'no_github_repo', 'repos': []})

        refresh = request.query_params.get('refresh') in ('1', 'true', 'True')
        cache = GithubCache.objects.filter(project=project).first()
        if cache and not refresh:
            age = (timezone.now() - cache.fetched_at).total_seconds()
            if age < self.GITHUB_CACHE_TTL:
                data = dict(cache.payload)
                data['fetched_at'] = cache.fetched_at.isoformat()
                data['cached'] = True
                return Response(data)

        token = settings.GITHUB_TOKEN or None
        repos = []
        for e in gh_repos:
            result = gh.fetch(e['url'], token=token)
            result['label'] = e.get('label') or 'Repo'
            repos.append(result)
        payload = {'ok': True, 'repos': repos}

        now = timezone.now()
        # Only cache a settled result. Never cache while GitHub is still computing
        # stats (202) or when a repo hit a transient error — otherwise that bad
        # state would stick for the whole TTL. (not_found is stable → cacheable.)
        def settled(r):
            if r.get('computing'):
                return False
            if not r.get('ok') and r.get('error') in ('unavailable', 'rate_limited'):
                return False
            return True

        if all(settled(r) for r in repos):
            GithubCache.objects.update_or_create(
                project=project, defaults={'payload': payload, 'fetched_at': now}
            )
        payload['fetched_at'] = now.isoformat()
        payload['cached'] = False
        return Response(payload)

    @action(detail=True, methods=['get', 'post'], url_path='uptime')
    def uptime(self, request, pk=None):
        """GET → recent check history; POST → run a check now and save it."""
        project = self.get_object()

        if request.method == 'POST':
            if not project.live_url:
                return Response({'detail': 'no_live_url'}, status=400)
            from .uptime import check_url

            data = check_url(project.live_url)
            check = UptimeCheck.objects.create(project=project, url=project.live_url, **data)
            # Keep only the most recent 200 checks per project.
            old_ids = project.uptime_checks.values_list('id', flat=True)[200:]
            if old_ids:
                UptimeCheck.objects.filter(id__in=list(old_ids)).delete()
            return Response(UptimeCheckSerializer(check).data)

        from datetime import timedelta

        from django.utils import timezone

        now = timezone.now()

        def sla(delta):
            qs = project.uptime_checks.filter(checked_at__gte=now - delta)
            total = qs.count()
            up = qs.filter(is_up=True).count()
            return {'up': up, 'total': total, 'pct': round(up / total * 100, 1) if total else None}

        recent = list(project.uptime_checks.all()[:60])

        # Downtime incidents over the last 30 days (consecutive down checks).
        month = list(
            project.uptime_checks.filter(checked_at__gte=now - timedelta(days=30)).order_by('checked_at')
        )
        incidents = []
        cur = None
        for c in month:
            if not c.is_up and cur is None:
                cur = {'start': c.checked_at, 'status_code': c.status_code, 'error': c.error}
            elif c.is_up and cur is not None:
                cur['end'] = c.checked_at
                incidents.append(cur)
                cur = None
        if cur is not None:
            cur['end'] = None
            incidents.append(cur)

        def incident_dict(inc):
            end = inc['end']
            end_ref = end or now
            return {
                'start': inc['start'].isoformat(),
                'end': end.isoformat() if end else None,
                'duration_min': round((end_ref - inc['start']).total_seconds() / 60),
                'status_code': inc.get('status_code'),
                'error': inc.get('error', ''),
                'ongoing': end is None,
            }

        incidents = [incident_dict(i) for i in reversed(incidents)][:10]

        return Response({
            'has_url': bool(project.live_url),
            'url': project.live_url,
            'latest': UptimeCheckSerializer(recent[0]).data if recent else None,
            'checks': UptimeCheckSerializer(recent, many=True).data,
            'sla': {
                'h24': sla(timedelta(hours=24)),
                'd7': sla(timedelta(days=7)),
                'd30': sla(timedelta(days=30)),
            },
            'incidents': incidents,
        })


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        from django.db.models import Q

        qs = super().get_queryset()
        date = self.request.query_params.get('date')
        agenda = self.request.query_params.get('agenda')
        project = self.request.query_params.get('project')
        is_done = self.request.query_params.get('is_done')
        if date:
            qs = qs.filter(due_date=date)
        # A day's agenda = everything actionable on that day:
        #   - due that day
        #   - overdue but still open (so nothing slips silently)
        #   - undated: created that day, OR still open (carries over until done,
        #     so a project task with no due date keeps showing as a reminder)
        if agenda:
            qs = qs.filter(
                Q(due_date=agenda)
                | Q(due_date__lt=agenda, is_done=False)
                | (Q(due_date__isnull=True) & (Q(created_at__date=agenda) | Q(is_done=False)))
            )
        if project:
            qs = qs.filter(project=project)
        if is_done is not None:
            qs = qs.filter(is_done=is_done.lower() == 'true')
        return qs


class CredentialViewSet(viewsets.ModelViewSet):
    queryset = Credential.objects.all()
    serializer_class = CredentialSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        project = self.request.query_params.get('project')
        category = self.request.query_params.get('category')
        if project:
            qs = qs.filter(project=project)
        if category:
            qs = qs.filter(category=category)
        return qs


class EnvVarViewSet(viewsets.ModelViewSet):
    queryset = EnvVar.objects.all()
    serializer_class = EnvVarSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        project = self.request.query_params.get('project')
        if project:
            qs = qs.filter(project=project)
        return qs

    @action(detail=False, methods=['post'])
    def bulk(self, request):
        """Parse a pasted .env block and persist each KEY=VALUE line."""
        content = request.data.get('content', '')
        project_id = request.data.get('project') or None
        created = []
        for raw in content.splitlines():
            line = raw.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if not key:
                continue
            env = EnvVar.objects.create(key=key, value=value, project_id=project_id)
            created.append(env)
        serializer = self.get_serializer(created, many=True)
        return Response({'created': len(created), 'envvars': serializer.data})


class CommandViewSet(viewsets.ModelViewSet):
    queryset = Command.objects.all()
    serializer_class = CommandSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        project = self.request.query_params.get('project')
        search = self.request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if project:
            qs = qs.filter(projects=project)
        if search:
            from django.db.models import Q
            qs = qs.filter(Q(title__icontains=search) | Q(command__icontains=search))
        return qs.distinct()


class ServerViewSet(viewsets.ModelViewSet):
    queryset = Server.objects.all()
    serializer_class = ServerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        project = self.request.query_params.get('project')
        if project:
            qs = qs.filter(projects=project)
        return qs

    @action(detail=True, methods=['get'])
    def ping(self, request, pk=None):
        server = self.get_object()
        if not server.ip_address:
            return Response({'status': 'unknown', 'latency_ms': None})
        try:
            start = time.time()
            sock = socket.create_connection((server.ip_address, server.ssh_port), timeout=3)
            sock.close()
            latency = round((time.time() - start) * 1000)
            return Response({'status': 'up', 'latency_ms': latency})
        except Exception:
            return Response({'status': 'down', 'latency_ms': None})


class DailyLogViewSet(viewsets.ModelViewSet):
    queryset = DailyLog.objects.all()
    serializer_class = DailyLogSerializer

    def list(self, request, *args, **kwargs):
        """If ?date= is given, return the single log for that date (or 404)."""
        date = request.query_params.get('date')
        if date:
            try:
                log = DailyLog.objects.get(date=date)
            except DailyLog.DoesNotExist:
                raise Http404('No log for that date')
            return Response(self.get_serializer(log).data)
        return super().list(request, *args, **kwargs)


class IbadahLogViewSet(viewsets.ModelViewSet):
    queryset = IbadahLog.objects.all()
    serializer_class = IbadahLogSerializer

    def list(self, request, *args, **kwargs):
        """?date= → single log (get_or_create); ?start=&end= → logs in range."""
        date = request.query_params.get('date')
        if date:
            log, _ = IbadahLog.objects.get_or_create(date=date, defaults={'data': {}})
            return Response(self.get_serializer(log).data)

        start = request.query_params.get('start')
        end = request.query_params.get('end')
        if start and end:
            qs = IbadahLog.objects.filter(date__range=[start, end])
            return Response(self.get_serializer(qs, many=True).data)
        return super().list(request, *args, **kwargs)


class UploadView(APIView):
    """Save an uploaded file to MEDIA and return its absolute URL."""

    from rest_framework.parsers import FormParser, MultiPartParser

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        import os
        import uuid

        f = request.FILES.get('file')
        if not f:
            return Response({'detail': 'no file'}, status=400)
        ext = os.path.splitext(f.name)[1].lower() or '.png'
        if len(ext) > 8:
            ext = '.png'
        fname = f'{uuid.uuid4().hex}{ext}'
        subdir = os.path.join(settings.MEDIA_ROOT, 'uploads')
        os.makedirs(subdir, exist_ok=True)
        with open(os.path.join(subdir, fname), 'wb') as out:
            for chunk in f.chunks():
                out.write(chunk)
        url = request.build_absolute_uri(f'{settings.MEDIA_URL}uploads/{fname}')
        return Response({'url': url})


class AyatTodayView(APIView):
    """Return today's ayat, rotating by day-of-month over the curated JSON."""

    def get(self, request):
        from datetime import date as date_cls
        path = settings.DATA_DIR / 'ayat.json'
        with open(path, encoding='utf-8') as f:
            ayat_list = json.load(f)
        if not ayat_list:
            return Response({'detail': 'No ayat available'}, status=404)
        day = date_cls.today().day
        index = (day - 1) % len(ayat_list)
        return Response(ayat_list[index])


class FocusSessionViewSet(viewsets.ModelViewSet):
    """The focus timer's session log, plus the endpoints that drive the timer.

    The timer is server-owned: the client asks for the running session rather
    than holding it, so a refresh, a second tab, or a closed laptop all pick
    the same session back up.
    """
    queryset = FocusSession.objects.all()
    serializer_class = FocusSessionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        date = params.get('date')
        if date:
            qs = qs.filter(started_at__date=date)
        start, end = params.get('from'), params.get('to')
        if start:
            qs = qs.filter(started_at__date__gte=start)
        if end:
            qs = qs.filter(started_at__date__lte=end)
        if params.get('project'):
            qs = qs.filter(project=params['project'])
        if params.get('task'):
            qs = qs.filter(task=params['task'])
        if params.get('kind'):
            qs = qs.filter(kind=params['kind'])
        return qs

    @staticmethod
    def _close(session, *, completed=False, interrupted_by='', actual_sec=None):
        """End a running session, deriving elapsed time from the clock."""
        from django.utils import timezone

        now = timezone.now()
        if actual_sec is None:
            actual_sec = int((now - session.started_at).total_seconds())
        # Guard against a clock skew or a bad client value producing a negative
        # or absurd duration that would poison the totals.
        session.actual_sec = max(0, min(int(actual_sec), session.planned_min * 60 + 3600))
        session.ended_at = now
        session.completed = completed
        session.interrupted_by = interrupted_by
        session.save()
        return session

    @action(detail=False, methods=['get'])
    def active(self, request):
        """The session currently running, or 204 when the timer is idle."""
        session = FocusSession.objects.filter(ended_at__isnull=True).order_by('-started_at').first()
        if not session:
            return Response(status=204)
        return Response(self.get_serializer(session).data)

    @action(detail=False, methods=['post'])
    def start(self, request):
        """Open a session. Any session left running is abandoned first."""
        from django.utils import timezone

        for orphan in FocusSession.objects.filter(ended_at__isnull=True):
            self._close(orphan, interrupted_by='abandoned')

        settings_obj = FocusSettings.load()
        kind = request.data.get('kind', 'focus')
        default_min = {
            'focus': settings_obj.focus_min,
            'short_break': settings_obj.short_break_min,
            'long_break': settings_obj.long_break_min,
        }.get(kind, settings_obj.focus_min)

        task_id = request.data.get('task') or None
        project_id = request.data.get('project') or None
        # A task always implies its project, so per-project totals stay right
        # even when the picker only named the task.
        if task_id and not project_id:
            task = Task.objects.filter(pk=task_id).first()
            if task:
                project_id = task.project_id

        session = FocusSession.objects.create(
            kind=kind,
            task_id=task_id,
            project_id=project_id,
            label=request.data.get('label', ''),
            started_at=timezone.now(),
            planned_min=int(request.data.get('planned_min') or default_min),
        )
        return Response(self.get_serializer(session).data, status=201)

    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        """Close a session — `completed` says whether it ran to the bell."""
        session = self.get_object()
        if session.ended_at:
            return Response(self.get_serializer(session).data)
        session = self._close(
            session,
            completed=bool(request.data.get('completed')),
            interrupted_by=request.data.get('interrupted_by', ''),
            actual_sec=request.data.get('actual_sec'),
        )
        if request.data.get('note'):
            session.note = request.data['note']
            session.save(update_fields=['note'])
        return Response(self.get_serializer(session).data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Aggregates for the stats tab: totals, per-project, per-day, per-hour.

        Bucketed in Python against local time — SQLite has no timezone-aware
        date functions, and a pomodoro at 23:30 belongs to the day you felt it.
        """
        from datetime import timedelta

        from django.utils import timezone

        rng = request.query_params.get('range', 'week')
        today = timezone.localdate()
        span = {'today': 1, 'week': 7, 'month': 30, 'quarter': 90}.get(rng)
        start = today - timedelta(days=span - 1) if span else None

        qs = FocusSession.objects.filter(kind='focus', ended_at__isnull=False)
        window = qs.filter(started_at__date__gte=start) if start else qs

        by_project, by_day, by_hour = {}, {}, [0] * 24
        total_sec = sessions_done = 0
        for s in window.select_related('project'):
            local = timezone.localtime(s.started_at)
            day = local.date().isoformat()
            total_sec += s.actual_sec
            if s.completed:
                sessions_done += 1
            by_hour[local.hour] += s.actual_sec

            bucket = by_day.setdefault(day, {'date': day, 'sec': 0, 'sessions': 0})
            bucket['sec'] += s.actual_sec
            bucket['sessions'] += 1 if s.completed else 0

            key = s.project_id
            entry = by_project.setdefault(
                key,
                {
                    'project': key,
                    'name': s.project.name if s.project else 'No project',
                    'category': s.project.category if s.project else None,
                    'sec': 0,
                    'sessions': 0,
                },
            )
            entry['sec'] += s.actual_sec
            entry['sessions'] += 1 if s.completed else 0

        # Fill the gaps so the chart shows quiet days rather than skipping them.
        days = []
        if start:
            for i in range(span):
                d = (start + timedelta(days=i)).isoformat()
                days.append(by_day.get(d, {'date': d, 'sec': 0, 'sessions': 0}))
        else:
            days = sorted(by_day.values(), key=lambda x: x['date'])

        # Streak: consecutive days back from today with a completed session.
        done_days = {
            timezone.localtime(s.started_at).date()
            for s in qs.filter(completed=True).only('started_at')
        }
        streak, cursor = 0, today
        while cursor in done_days:
            streak += 1
            cursor -= timedelta(days=1)

        today_qs = qs.filter(started_at__date__gte=today - timedelta(days=1))
        today_sessions = [
            s for s in today_qs if timezone.localtime(s.started_at).date() == today
        ]
        settings_obj = FocusSettings.load()

        return Response({
            'range': rng,
            'total_sec': total_sec,
            'sessions': sessions_done,
            'by_project': sorted(by_project.values(), key=lambda x: -x['sec']),
            'by_day': days,
            'by_hour': by_hour,
            'streak': streak,
            'today_sec': sum(s.actual_sec for s in today_sessions),
            'today_sessions': sum(1 for s in today_sessions if s.completed),
            'target': settings_obj.daily_target_sessions,
        })

    @action(detail=False, methods=['get', 'patch'], url_path='settings')
    def settings_(self, request):
        """The singleton timer preferences — GET to read, PATCH to change."""
        obj = FocusSettings.load()
        if request.method == 'PATCH':
            serializer = FocusSettingsSerializer(obj, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        return Response(FocusSettingsSerializer(obj).data)
