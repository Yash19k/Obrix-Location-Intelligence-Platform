"""Views for the locations app — full CRUD via ModelViewSet."""

from rest_framework import viewsets, permissions
from rest_framework.response import Response

from core.permissions import IsOwner
from .models import SavedLocation
from .serializers import SavedLocationSerializer


class SavedLocationViewSet(viewsets.ModelViewSet):
    """
    CRUD for user-saved locations.
    All queries are automatically scoped to the authenticated user.
    """

    serializer_class = SavedLocationSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwner)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        """
        Return only the locations belonging to the current user.
        This is a critical security boundary — never return all locations.
        """
        return SavedLocation.objects.filter(user=self.request.user).order_by("-created_at")
