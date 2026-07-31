"""Views for the AI application module."""

import logging
import traceback
from rest_framework import permissions, status, views
from rest_framework.response import Response

from apps.reports.models import Report
from apps.reports.serializers import ReportSerializer
from apps.analysis.models import AnalysisRequest
from .serializers import GenerateReportRequestSerializer
from .services.report_generator import ReportGenerator

logger = logging.getLogger(__name__)

class GenerateReportView(views.APIView):
    """
    POST /api/v1/ai/report/
    Generates a 13-section business consulting report, persists it to DB,
    and returns full report payload.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        logger.info("[AI View] Received POST /api/v1/ai/report/ request.")
        
        serializer = GenerateReportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        req_id = serializer.validated_data.get("analysis_request_id")
        analysis_data = serializer.validated_data.get("analysis_data")

        if req_id:
            logger.info(f"[AI View] Loading analysis data from request ID: {req_id}")
            try:
                analysis_obj = AnalysisRequest.objects.get(id=req_id, user=request.user)
                res_obj = getattr(analysis_obj, "result", None)
                score = res_obj.site_readiness_score if res_obj else 65.0
                analysis_data = {
                    "latitude": float(analysis_obj.latitude),
                    "longitude": float(analysis_obj.longitude),
                    "business_type": analysis_obj.business_type,
                    "radius_m": analysis_obj.radius_m,
                    "result": res_obj.raw_factors if res_obj else {},
                    "site_readiness_score": score,
                }
            except AnalysisRequest.DoesNotExist:
                logger.error(f"[AI View] Analysis request {req_id} not found.")
                return Response({"error": "Analysis request not found."}, status=status.HTTP_404_NOT_FOUND)

        # Generate full 13-section report
        try:
            logger.info("[AI View] Invoking ReportGenerator...")
            ai_report_json = ReportGenerator.generate_full_report(analysis_data)
            logger.info("[AI View] ReportGenerator completed successfully.")
        except ValueError as ve:
            # Catch specific ValueErrors (e.g. Groq key not configured)
            err_msg = str(ve)
            logger.error(f"[AI View] Validation error during report generation: {err_msg}")
            return Response({"error": err_msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            err_msg = str(e)
            logger.error(f"[AI View] Exception occurred during Groq API consulting: {err_msg}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": f"Failed to generate report from Groq API. Reason: {err_msg}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Extract meta for Report model
        lat = float(analysis_data.get("latitude") or 23.0225)
        lon = float(analysis_data.get("longitude") or 72.5714)
        biz_type = analysis_data.get("business_type") or "retail"
        res_data = analysis_data.get("result") or analysis_data
        score = float(res_data.get("site_readiness_score") or analysis_data.get("site_readiness_score") or 65.0)

        # Create persistent Report record in DB
        try:
            logger.info(f"[AI View] Saving generated report to database: {biz_type} at ({lat}, {lon})")
            report_obj = Report.objects.create(
                user=request.user,
                title=f"AI Consulting Report: {biz_type.upper()} ({lat:.3f}, {lon:.3f})",
                business_type=biz_type,
                latitude=lat,
                longitude=lon,
                score=score,
                analysis_json=analysis_data,
                ai_report_json=ai_report_json,
            )
            logger.info(f"[AI View] Saved Report ID {report_obj.id} to DB successfully.")
        except Exception as e:
            logger.error(f"[AI View] Failed to save Report to database: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": f"Failed to save generated report. Reason: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(ReportSerializer(report_obj).data, status=status.HTTP_201_CREATED)
