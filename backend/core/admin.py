from django.contrib import admin

from .models import (
    Command,
    Credential,
    DailyLog,
    EnvVar,
    Project,
    Server,
    Task,
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'status', 'updated_at')
    list_filter = ('category', 'status')
    search_fields = ('name', 'description')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_done', 'project', 'due_date', 'created_at')
    list_filter = ('is_done', 'project')
    search_fields = ('title',)


@admin.register(Credential)
class CredentialAdmin(admin.ModelAdmin):
    list_display = ('label', 'username', 'category', 'project')
    list_filter = ('category', 'project')
    search_fields = ('label', 'username')


@admin.register(EnvVar)
class EnvVarAdmin(admin.ModelAdmin):
    list_display = ('key', 'project', 'created_at')
    list_filter = ('project',)
    search_fields = ('key',)


@admin.register(Command)
class CommandAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'project')
    list_filter = ('category', 'project')
    search_fields = ('title', 'command')


@admin.register(Server)
class ServerAdmin(admin.ModelAdmin):
    list_display = ('name', 'ip_address', 'ssh_user', 'ssh_port')
    search_fields = ('name', 'ip_address')


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ('date', 'updated_at')
