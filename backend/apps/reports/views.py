"""Views for the reports app — Phase 8 will add PDF export action."""

from rest_framework import viewsets, permissions
from core.permissions import IsOwner
from .models import Report
from .serializers import ReportSerializer


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwner)
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return Report.objects.filter(user=self.request.user).order_by("-created_at")
