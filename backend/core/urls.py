from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register('projects', views.ProjectViewSet)
router.register('tasks', views.TaskViewSet)
router.register('credentials', views.CredentialViewSet)
router.register('envvars', views.EnvVarViewSet)
router.register('commands', views.CommandViewSet)
router.register('servers', views.ServerViewSet)
router.register('logs', views.DailyLogViewSet)
router.register('ibadah', views.IbadahLogViewSet)
router.register('focus', views.FocusSessionViewSet)
router.register('reviews', views.WeeklyReviewViewSet)

urlpatterns = [
    path('ayat/today/', views.AyatTodayView.as_view(), name='ayat-today'),
    path('upload/', views.UploadView.as_view(), name='upload'),
    path('github/activity/', views.GithubActivityView.as_view(), name='github-activity'),
    path('github/unlinked/', views.GithubUnlinkedView.as_view(), name='github-unlinked'),
    path('', include(router.urls)),
]
