from rest_framework import serializers

from .models import (
    Command,
    Credential,
    DailyLog,
    EnvVar,
    Project,
    Server,
    Task,
)


class ProjectSerializer(serializers.ModelSerializer):
    tasks_count = serializers.SerializerMethodField()
    credentials_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'status', 'category', 'tech_stack',
            'repo_url', 'live_url', 'notes', 'tasks_count', 'credentials_count',
            'created_at', 'updated_at',
        ]

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_credentials_count(self, obj):
        return obj.credentials.count()


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True, default=None)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'is_done', 'project', 'project_name',
            'due_date', 'created_at',
        ]


class CredentialSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True, default=None)

    class Meta:
        model = Credential
        fields = [
            'id', 'label', 'username', 'password', 'url', 'notes',
            'category', 'project', 'project_name', 'created_at',
        ]


class EnvVarSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True, default=None)

    class Meta:
        model = EnvVar
        fields = ['id', 'key', 'value', 'project', 'project_name', 'created_at']


class CommandSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True, default=None)

    class Meta:
        model = Command
        fields = [
            'id', 'title', 'command', 'category', 'project',
            'project_name', 'created_at',
        ]


class ServerSerializer(serializers.ModelSerializer):
    project_names = serializers.SerializerMethodField()

    class Meta:
        model = Server
        fields = [
            'id', 'name', 'ip_address', 'ssh_user', 'ssh_port', 'description',
            'projects', 'project_names', 'created_at',
        ]

    def get_project_names(self, obj):
        return [{'id': p.id, 'name': p.name} for p in obj.projects.all()]


class DailyLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLog
        fields = ['id', 'date', 'journal', 'updated_at']
