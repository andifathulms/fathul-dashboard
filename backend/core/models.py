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

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='personal')
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
    project = models.ForeignKey(
        Project, null=True, blank=True, on_delete=models.SET_NULL, related_name='commands'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'title']

    def __str__(self):
        return self.title


class Server(models.Model):
    name = models.CharField(max_length=200)
    ip_address = models.GenericIPAddressField()
    ssh_user = models.CharField(max_length=100, default='ubuntu')
    ssh_port = models.IntegerField(default=22)
    description = models.TextField(blank=True)
    projects = models.ManyToManyField(Project, blank=True, related_name='servers')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.ip_address})'


class DailyLog(models.Model):
    date = models.DateField(unique=True)
    journal = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f'Log {self.date}'


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
