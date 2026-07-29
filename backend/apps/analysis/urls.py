"""URL patterns for the analysis app."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AnalysisViewSet, WeightConfigViewSet

app_name = "analysis"

router = DefaultRouter()
router.register(r"weights", WeightConfigViewSet, basename="weight-config")
router.register(r"", AnalysisViewSet, basename="analysis")

urlpatterns = [
    path("", include(router.urls)),
]
