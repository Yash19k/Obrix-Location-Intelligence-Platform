"""
Views for the analysis app.

Phase 4 note: The scoring engine runs synchronously inline for now.
Phase 5+ will dispatch to a Celery task instead.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from core.permissions import IsOwner
from .models import AnalysisRequest, AnalysisResult, WeightConfig
from .serializers import AnalysisRequestSerializer, AnalysisResultSerializer, WeightConfigSerializer


class AnalysisViewSet(viewsets.ModelViewSet):
    """
    ViewSet for analysis requests.
    Supports: list, create, retrieve, destroy.
    Update is not supported — analysis results are immutable once computed.
    """

    serializer_class = AnalysisRequestSerializer
    permission_classes = (permissions.IsAuthenticated, IsOwner)
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        """Always scoped to the current user."""
        return (
            AnalysisRequest.objects
            .filter(user=self.request.user)
            .select_related("result")
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        """
        Submit a new analysis request.
        Phase 4: Runs mock scoring synchronously.
        Phase 5+: Will dispatch to Celery.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        analysis_request = serializer.save()

        # Phase 4: Run mock scoring inline
        self._run_mock_analysis(analysis_request)

        # Re-serialize with result included
        return Response(
            self.get_serializer(analysis_request).data,
            status=status.HTTP_201_CREATED,
        )

    def _run_mock_analysis(self, analysis_request: AnalysisRequest) -> None:
        """
        Mock scoring engine — returns plausible placeholder data.
        Replace with real engine call in Phase 5.
        """
        import random
        score = round(random.uniform(40, 90), 2)

        AnalysisResult.objects.create(
            request=analysis_request,
            site_readiness_score=score,
            score_breakdown={
                "accessibility": round(random.uniform(30, 100), 1),
                "population": round(random.uniform(30, 100), 1),
                "competition": round(random.uniform(30, 100), 1),
                "infrastructure": round(random.uniform(30, 100), 1),
                "land_use": round(random.uniform(30, 100), 1),
            },
            ai_insights=[
                {
                    "type": "info",
                    "title": "Mock Analysis Active",
                    "description": "This is a placeholder result. Real OSM data will be used from Phase 5.",
                    "priority": 1,
                }
            ],
            recommendations=[
                {
                    "action": "Review when real analysis is available",
                    "rationale": "Phase 4 uses mock data only",
                    "impact": "high",
                }
            ],
        )
        analysis_request.status = AnalysisRequest.Status.COMPLETED
        analysis_request.completed_at = timezone.now()
        analysis_request.save(update_fields=["status", "completed_at"])

    @action(detail=True, methods=["get"], url_path="result")
    def result(self, request, pk=None):
        """GET /analysis/{id}/result/ — Return only the result object."""
        analysis_request = self.get_object()
        if not hasattr(analysis_request, "result"):
            return Response(
                {"message": "Analysis result not yet available."},
                status=status.HTTP_202_ACCEPTED,
            )
        return Response(AnalysisResultSerializer(analysis_request.result).data)


class WeightConfigViewSet(viewsets.ModelViewSet):
    """CRUD for custom weight configurations."""

    serializer_class = WeightConfigSerializer
    permission_classes = (permissions.IsAuthenticated,)
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return WeightConfig.objects.filter(is_default=True) | WeightConfig.objects.filter(
            created_by=self.request.user
        )
