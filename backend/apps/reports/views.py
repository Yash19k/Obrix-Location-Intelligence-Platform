"""Views for the reports app — supports list, retrieve, destroy, and regenerate."""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from core.permissions import IsOwner
from .models import Report
from .serializers import ReportSerializer
from apps.ai.services.report_generator import ReportGenerator


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwner)
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return Report.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["post"], url_path="regenerate")
    def regenerate(self, request, pk=None):
        """Regenerate an existing AI report with updated spatial analytics."""
        report = self.get_object()
        analysis_data = report.analysis_json or {
            "latitude": float(report.latitude or 23.0225),
            "longitude": float(report.longitude or 72.5714),
            "business_type": report.business_type,
            "site_readiness_score": report.score or 65.0,
        }

        ai_output = ReportGenerator.generate_full_report(analysis_data)
        report.ai_report_json = ai_output
        report.save(update_fields=["ai_report_json"])

        return Response(ReportSerializer(report).data, status=status.HTTP_200_OK)
