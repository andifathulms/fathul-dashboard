from django.db import models


class Project(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('done', 'Done'),
        ('archived', 'Archived'),
    ]
    CATEGORY_CHOICES = [
        ('oikn', 'OIKN'),
        ('freelance', 'Freelance'),
        ('personal', 'Personal'),
        ('side', 'Side Project'),
    ]
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    # Optional brand assets (absolute URL, app-relative path, or uploaded media).
    icon_url = models.CharField(max_length=500, blank=True)
    lockup_horizontal_url = models.CharField(max_length=500, blank=True)
    lockup_vertical_url = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='personal')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    tech_stack = models.JSONField(default=list, blank=True)
    # List of {"label": str, "url": str} — a project may have several repos
    # (e.g. frontend + backend). repo_url is kept for backward compatibility.
    repos = models.JSONField(default=list, blank=True)
    repo_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    # Absolute path on this machine — used to open the project in VS Code.
    local_path = models.CharField(max_length=500, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.name


class Task(models.Model):
    REPEAT_CHOICES = [
        ('daily', 'Every day'),
        ('weekdays', 'Every weekday'),
        ('weekly', 'Every week'),
        ('monthly', 'Every month'),
    ]

    title = models.CharField(max_length=500)
    is_done = models.BooleanField(default=False)
    project = models.ForeignKey(
        Project, null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks'
    )
    due_date = models.DateField(null=True, blank=True)
    # How many pomodoros this is expected to take. Null = not estimated, which
    # is the normal case — only tasks you plan to sit down with get a number.
    estimate_pomodoros = models.IntegerField(null=True, blank=True)
    # Blocked on somebody else. Kept apart from is_done because "I am stuck"
    # and "I am avoiding this" look identical otherwise, and only one of them
    # is your problem to solve today.
    is_waiting = models.BooleanField(default=False)
    waiting_on = models.CharField(max_length=200, blank=True)
    waiting_since = models.DateField(null=True, blank=True)
    # The day you chose to do this, which is not the same as the day it is due.
    # Stored as the date rather than a boolean so the flag clears itself at
    # midnight — a star you set on Monday must not still be lit on Thursday,
    # and that should not depend on a nightly job having run.
    today_on = models.DateField(null=True, blank=True)
    # Recurrence. An empty `repeat` is a one-off, which is most tasks.
    repeat = models.CharField(max_length=20, choices=REPEAT_CHOICES, blank=True)
    repeat_interval = models.IntegerField(default=1)
    # The task this one was spawned from, so a series can be traced back.
    repeat_parent = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL, related_name='repeat_children'
    )
    # Stamped when is_done flips true — without it there is no way to ask what
    # you finished last week. Null on tasks completed before this field existed.
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # nulls_last matters: SQLite sorts NULL first ascending, which put every
        # undated carry-over above the tasks actually due today — so a task you
        # just added for today landed at the bottom of the list.
        ordering = [
            'is_done',
            models.F('due_date').asc(nulls_last=True),
            '-created_at',
        ]

    def __str__(self):
        return self.title

    def next_due_date(self, from_date):
        """When the next instance of a repeating task falls due."""
        import calendar
        from datetime import timedelta

        step = max(1, self.repeat_interval or 1)
        if self.repeat == 'daily':
            return from_date + timedelta(days=step)
        if self.repeat == 'weekdays':
            # Step one working day at a time, so Friday rolls to Monday.
            date = from_date
            for _ in range(step):
                date += timedelta(days=1)
                while date.weekday() >= 5:
                    date += timedelta(days=1)
            return date
        if self.repeat == 'weekly':
            return from_date + timedelta(weeks=step)
        if self.repeat == 'monthly':
            month = from_date.month - 1 + step
            year = from_date.year + month // 12
            month = month % 12 + 1
            # Clamp so the 31st does not fall off the end of a short month.
            day = min(from_date.day, calendar.monthrange(year, month)[1])
            return from_date.replace(year=year, month=month, day=day)
        return None

    def spawn_next(self):
        """Create the next occurrence of a repeating task, or return None.

        Called when the task is ticked off. Anchors on the due date when there
        is one so a weekly task keeps its day, and on today when there is not.
        """
        from django.utils import timezone

        if not self.repeat:
            return None
        anchor = self.due_date or timezone.localdate()
        due = self.next_due_date(anchor)
        if due is None:
            return None

        series = self.repeat_parent or self
        # Ticking a task twice, or re-opening and re-closing it, must not stack
        # up duplicates for the same day.
        exists = Task.objects.filter(
            due_date=due, is_done=False, title=self.title
        ).filter(models.Q(repeat_parent=series) | models.Q(pk=series.pk)).exists()
        if exists:
            return None

        return Task.objects.create(
            title=self.title,
            project=self.project,
            due_date=due,
            estimate_pomodoros=self.estimate_pomodoros,
            repeat=self.repeat,
            repeat_interval=self.repeat_interval,
            repeat_parent=series,
        )


class Credential(models.Model):
    label = models.CharField(max_length=200)
    username = models.CharField(max_length=200, blank=True)
    password = models.TextField(blank=True)
    url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    project = models.ForeignKey(
        Project, null=True, blank=True, on_delete=models.SET_NULL, related_name='credentials'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['label']

    def __str__(self):
        return self.label


class EnvVar(models.Model):
    key = models.CharField(max_length=200)
    value = models.TextField()
    project = models.ForeignKey(
        Project, null=True, blank=True, on_delete=models.SET_NULL, related_name='envvars'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['key']

    def __str__(self):
        return self.key


class Command(models.Model):
    CATEGORY_CHOICES = [
        ('docker', 'Docker'),
        ('git', 'Git'),
        ('pm2', 'PM2'),
        ('django', 'Django'),
        ('nginx', 'Nginx'),
        ('ssh', 'SSH'),
        ('python', 'Python'),
        ('general', 'General'),
    ]

    title = models.CharField(max_length=200)
    command = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    projects = models.ManyToManyField(Project, blank=True, related_name='commands')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'title']

    def __str__(self):
        return self.title


class Server(models.Model):
    """A VM / host. Runs one or more projects; accessed via SSH alias or user@ip.

    GCP hosts can carry project/zone/instance to deep-link the console SSH; a
    login/sudo password is linked from Credentials rather than duplicated.
    """
    PROVIDER_CHOICES = [
        ('gcp', 'GCP'),
        ('pdns', 'PDNS'),
        ('other', 'Lainnya'),
    ]

    name = models.CharField(max_length=200)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default='other')
    # Access: an SSH config alias (e.g. "vm-ekiosk") OR user@ip:port.
    ssh_alias = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    ssh_user = models.CharField(max_length=100, blank=True)
    ssh_port = models.IntegerField(default=22)
    requires_vpn = models.BooleanField(default=False)
    # GCP console browser-SSH deep link parts.
    gcp_project = models.CharField(max_length=200, blank=True)
    gcp_zone = models.CharField(max_length=100, blank=True)
    gcp_instance = models.CharField(max_length=200, blank=True)
    # Login / sudo password, linked from the vault (single source of truth).
    credential = models.ForeignKey(
        Credential, null=True, blank=True, on_delete=models.SET_NULL, related_name='servers'
    )
    description = models.TextField(blank=True)
    projects = models.ManyToManyField(Project, blank=True, related_name='servers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class DailyLog(models.Model):
    date = models.DateField(unique=True)
    journal = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f'Log {self.date}'


class UptimeCheck(models.Model):
    """A single web availability check for a project's live_url (history)."""
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name='uptime_checks'
    )
    url = models.URLField()
    checked_at = models.DateTimeField(auto_now_add=True)
    is_up = models.BooleanField(default=False)
    status_code = models.IntegerField(null=True, blank=True)
    response_ms = models.IntegerField(null=True, blank=True)
    error = models.CharField(max_length=300, blank=True)
    server = models.CharField(max_length=200, blank=True)
    content_type = models.CharField(max_length=200, blank=True)
    final_url = models.URLField(blank=True)
    ssl_days_left = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['-checked_at']

    def __str__(self):
        return f'{self.url} @ {self.checked_at:%Y-%m-%d %H:%M} ({"up" if self.is_up else "down"})'


class GithubCache(models.Model):
    """Cached GitHub analytics payload per project (refreshed on demand / TTL)."""
    project = models.OneToOneField(
        Project, on_delete=models.CASCADE, related_name='github_cache'
    )
    payload = models.JSONField(default=dict)
    fetched_at = models.DateTimeField()

    def __str__(self):
        return f'GitHub cache for {self.project_id}'


class IbadahLog(models.Model):
    """One record per day tracking prayers and their rawatib sunnah.

    `data` holds a per-prayer map, e.g.
    {"Subuh": {"fardhu": true, "jamaah": false, "qabliyah": true, "badiyah": false}}
    The exact keys are defined by the frontend; the backend just persists JSON.
    """
    date = models.DateField(unique=True)
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f'Ibadah {self.date}'


class FocusSession(models.Model):
    """One run of the focus timer — a pomodoro or the break that follows it.

    A session is opened when the timer starts and closed when it stops, so the
    row with `ended_at` null is the one currently running (there is at most
    one). `actual_sec` is tracked apart from `planned_min` because an abandoned
    session still represents real time spent and must not be counted as a full
    pomodoro in the stats.
    """
    KIND_CHOICES = [
        ('focus', 'Focus'),
        ('short_break', 'Short Break'),
        ('long_break', 'Long Break'),
    ]

    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default='focus')
    # A session may hang off a task, a project, both, or neither ("just work").
    # project is kept alongside task so per-project totals survive the task
    # being deleted, and so a session can name a project with no task at all.
    task = models.ForeignKey(
        Task, null=True, blank=True, on_delete=models.SET_NULL, related_name='focus_sessions'
    )
    project = models.ForeignKey(
        Project, null=True, blank=True, on_delete=models.SET_NULL, related_name='focus_sessions'
    )
    # Free text for when neither a task nor a project fits.
    label = models.CharField(max_length=300, blank=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    planned_min = models.IntegerField(default=25)
    actual_sec = models.IntegerField(default=0)
    # True only when the session ran to the bell — the unit the stats count.
    completed = models.BooleanField(default=False)
    # "prayer", "manual", or whatever pulled you away. Empty when it finished.
    interrupted_by = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.get_kind_display()} {self.started_at:%Y-%m-%d %H:%M} ({self.actual_sec}s)'


class FocusSettings(models.Model):
    """Singleton (pk=1) holding the timer preferences. Use load()."""
    focus_min = models.IntegerField(default=25)
    short_break_min = models.IntegerField(default=5)
    long_break_min = models.IntegerField(default=15)
    # A long break replaces the short one after this many focus sessions.
    long_break_every = models.IntegerField(default=4)
    auto_start_breaks = models.BooleanField(default=True)
    sound_enabled = models.BooleanField(default=True)
    daily_target_sessions = models.IntegerField(default=8)
    # Offer a shortened session when the next adzan falls inside it.
    pause_for_prayer = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Focus settings'

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return 'Focus settings'


class WeeklyReview(models.Model):
    """Your written reflection on a week. The numbers around it are computed
    from tasks, focus sessions, and daily logs — only the prose is stored."""
    week_start = models.DateField(unique=True)  # the Monday
    reflection = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-week_start']

    def __str__(self):
        return f'Review week of {self.week_start}'
