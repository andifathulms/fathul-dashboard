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

urlpatterns = [
    path('ayat/today/', views.AyatTodayView.as_view(), name='ayat-today'),
    path('', include(router.urls)),
]
