from django.contrib import admin

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
    WeeklyReview,
)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'status', 'updated_at')
    list_filter = ('category', 'status')
    search_fields = ('name', 'description')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_done', 'is_waiting', 'repeat', 'project', 'due_date', 'completed_at')
    list_filter = ('is_done', 'is_waiting', 'repeat', 'project')
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
    list_display = ('title', 'category')
    list_filter = ('category', 'projects')
    search_fields = ('title', 'command')


@admin.register(Server)
class ServerAdmin(admin.ModelAdmin):
    list_display = ('name', 'ip_address', 'ssh_user', 'ssh_port')
    search_fields = ('name', 'ip_address')


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ('date', 'updated_at')


@admin.register(IbadahLog)
class IbadahLogAdmin(admin.ModelAdmin):
    list_display = ('date', 'updated_at')


@admin.register(UptimeCheck)
class UptimeCheckAdmin(admin.ModelAdmin):
    list_display = ('project', 'url', 'is_up', 'status_code', 'response_ms', 'checked_at')
    list_filter = ('is_up', 'project')


@admin.register(FocusSession)
class FocusSessionAdmin(admin.ModelAdmin):
    list_display = ('started_at', 'kind', 'task', 'project', 'planned_min', 'actual_sec', 'completed')
    list_filter = ('kind', 'completed', 'project')
    search_fields = ('label', 'note')


@admin.register(FocusSettings)
class FocusSettingsAdmin(admin.ModelAdmin):
    list_display = ('focus_min', 'short_break_min', 'long_break_min', 'daily_target_sessions')


@admin.register(WeeklyReview)
class WeeklyReviewAdmin(admin.ModelAdmin):
    list_display = ('week_start', 'updated_at')
