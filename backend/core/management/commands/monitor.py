"""Background uptime monitor — checks every project's live_url on an interval.

Run as its own long-lived process (see the `monitor` service in docker-compose).
Configure the interval with MONITOR_INTERVAL (seconds, default 300).
"""
import time

from decouple import config
from django.core.management.base import BaseCommand
from django.db import connection

from core.models import Project, UptimeCheck
from core.uptime import check_url

KEEP_PER_PROJECT = 500


class Command(BaseCommand):
    help = 'Continuously check uptime for all projects that have a live_url.'

    def handle(self, *args, **options):
        interval = int(config('MONITOR_INTERVAL', default=300))

        # Wait for the DB/migrations (the web service applies them on startup).
        for _ in range(40):
            try:
                with connection.cursor() as c:
                    c.execute('SELECT 1 FROM core_project LIMIT 1')
                break
            except Exception:
                time.sleep(3)

        self.stdout.write(self.style.SUCCESS(f'Uptime monitor started (every {interval}s)'))
        while True:
            for project in Project.objects.exclude(live_url=''):
                try:
                    data = check_url(project.live_url)
                    UptimeCheck.objects.create(project=project, url=project.live_url, **data)
                    old_ids = list(project.uptime_checks.values_list('id', flat=True)[KEEP_PER_PROJECT:])
                    if old_ids:
                        UptimeCheck.objects.filter(id__in=old_ids).delete()
                    state = 'up' if data['is_up'] else 'down'
                    self.stdout.write(f'  {project.name}: {state} ({data.get("response_ms")}ms)')
                except Exception as e:  # noqa: BLE001 — keep the loop alive
                    self.stderr.write(f'  {project.name}: error {e}')
            time.sleep(interval)
