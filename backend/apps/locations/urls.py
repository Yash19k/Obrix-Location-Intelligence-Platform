"""URL patterns for the locations app."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import SavedLocationViewSet

app_name = "locations"

router = DefaultRouter()
router.register(r"", SavedLocationViewSet, basename="saved-location")

urlpatterns = [
    path("", include(router.urls)),
]
