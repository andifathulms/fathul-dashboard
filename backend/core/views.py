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
    IbadahLog,
    Project,
    Server,
    Task,
)
from .serializers import (
    CommandSerializer,
    CredentialSerializer,
    DailyLogSerializer,
    EnvVarSerializer,
    IbadahLogSerializer,
    ProjectSerializer,
    ServerSerializer,
    TaskSerializer,
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
        GithubCache.objects.update_or_create(
            project=project, defaults={'payload': payload, 'fetched_at': now}
        )
        payload['fetched_at'] = now.isoformat()
        payload['cached'] = False
        return Response(payload)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        date = self.request.query_params.get('date')
        project = self.request.query_params.get('project')
        is_done = self.request.query_params.get('is_done')
        if date:
            qs = qs.filter(due_date=date)
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
            qs = qs.filter(project=project)
        if search:
            from django.db.models import Q
            qs = qs.filter(Q(title__icontains=search) | Q(command__icontains=search))
        return qs


class ServerViewSet(viewsets.ModelViewSet):
    queryset = Server.objects.all()
    serializer_class = ServerSerializer

    @action(detail=True, methods=['get'])
    def ping(self, request, pk=None):
        server = self.get_object()
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
