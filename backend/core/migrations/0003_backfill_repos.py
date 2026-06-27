from django.db import migrations


def backfill_repos(apps, schema_editor):
    Project = apps.get_model('core', 'Project')
    for project in Project.objects.all():
        if project.repo_url and not project.repos:
            project.repos = [{'label': 'Repo', 'url': project.repo_url}]
            project.save(update_fields=['repos'])


def reverse(apps, schema_editor):
    # Best-effort: drop the first repo back into repo_url.
    Project = apps.get_model('core', 'Project')
    for project in Project.objects.all():
        if project.repos and not project.repo_url:
            project.repo_url = project.repos[0].get('url', '')
            project.save(update_fields=['repo_url'])


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_project_repos'),
    ]

    operations = [
        migrations.RunPython(backfill_repos, reverse),
    ]
