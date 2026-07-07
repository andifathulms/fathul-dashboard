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
    title = models.CharField(max_length=500)
    is_done = models.BooleanField(default=False)
    project = models.ForeignKey(
        Project, null=True, blank=True, on_delete=models.SET_NULL, related_name='tasks'
    )
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['is_done', 'due_date', '-created_at']

    def __str__(self):
        return self.title


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
