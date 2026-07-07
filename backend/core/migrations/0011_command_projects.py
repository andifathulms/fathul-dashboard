from django.db import migrations, models


def copy_project_to_projects(apps, schema_editor):
    Command = apps.get_model('core', 'Command')
    for cmd in Command.objects.exclude(project__isnull=True):
        cmd.projects.add(cmd.project_id)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_project_lockup_horizontal_url_and_more'),
    ]

    operations = [
        # Temporary related_name to avoid clashing with the old `project` FK
        # (which also uses related_name='commands') while both fields exist.
        migrations.AddField(
            model_name='command',
            name='projects',
            field=models.ManyToManyField(blank=True, related_name='commands_new', to='core.project'),
        ),
        migrations.RunPython(copy_project_to_projects, noop_reverse),
        migrations.RemoveField(
            model_name='command',
            name='project',
        ),
        migrations.AlterField(
            model_name='command',
            name='projects',
            field=models.ManyToManyField(blank=True, related_name='commands', to='core.project'),
        ),
    ]
