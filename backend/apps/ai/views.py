"""Views for the AI application module."""

import logging
import traceback
from rest_framework import permissions, status, views, generics
from rest_framework.response import Response

from apps.reports.models import Report
from apps.reports.serializers import ReportSerializer
from apps.analysis.models import AnalysisRequest
from .models import AIConversation, AIMessage
from .serializers import (
    GenerateReportRequestSerializer,
    AIChatRequestSerializer,
    AIConversationSerializer,
    AIMessageSerializer,
)
from .services.report_generator import ReportGenerator
from .services.groq_service import GroqService
from .services.prompt_builder import PromptBuilder
from .services.domain_guard_service import DomainGuardService

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


class ConversationListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/ai/conversations/
    POST /api/v1/ai/conversations/
    """
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = AIConversationSerializer

    def get_queryset(self):
        return AIConversation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/ai/conversations/{id}/
    PATCH /api/v1/ai/conversations/{id}/
    DELETE /api/v1/ai/conversations/{id}/
    """
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = AIConversationSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return AIConversation.objects.filter(user=self.request.user)


class ConversationMessagesView(generics.ListAPIView):
    """
    GET /api/v1/ai/conversations/{id}/messages/
    """
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = AIMessageSerializer

    def get_queryset(self):
        conv_id = self.kwargs.get('id')
        return AIMessage.objects.filter(conversation_id=conv_id, conversation__user=self.request.user)


class ChatView(views.APIView):
    """
    POST /api/v1/ai/chat/
    Conversational AI Location Consultant endpoint.
    Maintains persistent AIConversation/AIMessage records in PostgreSQL if conversation_id is supplied or created.
    Runs DomainGuardService to strictly reject off-topic questions.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        logger.info("[AI Chat View] Received POST /api/v1/ai/chat/ request.")
        
        serializer = AIChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = serializer.validated_data["message"].strip()
        conv_id = serializer.validated_data.get("conversation_id")
        context_type = serializer.validated_data.get("context_type", "general")
        analysis_context = serializer.validated_data.get("analysis_context") or {}
        incoming_history = serializer.validated_data.get("conversation_history") or []

        # Find or create conversation record
        conversation = None
        if conv_id:
            try:
                conversation = AIConversation.objects.get(id=conv_id, user=request.user)
                if analysis_context and not conversation.analysis_context:
                    conversation.analysis_context = analysis_context
                    conversation.save(update_fields=['analysis_context', 'updated_at'])
                context_type = conversation.context_type or context_type
                analysis_context = conversation.analysis_context or analysis_context
            except AIConversation.DoesNotExist:
                return Response({"error": "Conversation not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            title = PromptBuilder.generate_auto_title(user_message)
            conversation = AIConversation.objects.create(
                user=request.user,
                title=title,
                context_type=context_type,
                analysis_context=analysis_context or {},
            )

        # Retrieve existing DB messages for history context
        existing_msgs = list(conversation.messages.all().order_by('created_at'))
        history_list = []
        for m in existing_msgs:
            history_list.append({"role": m.role, "content": m.content})
        
        if not history_list and incoming_history:
            history_list = incoming_history

        # 1. Run DomainGuard check
        is_relevant, refusal_text = DomainGuardService.check_relevance(
            message=user_message,
            history=history_list,
            context_type=context_type,
            analysis_context=analysis_context,
        )

        if not is_relevant:
            # Save off-topic turn to conversation history
            AIMessage.objects.create(conversation=conversation, role="user", content=user_message)
            AIMessage.objects.create(conversation=conversation, role="assistant", content=refusal_text)
            conversation.save(update_fields=['updated_at'])

            return Response({
                "answer": refusal_text,
                "conversation_id": str(conversation.id),
                "title": conversation.title,
            }, status=status.HTTP_200_OK)

        # 2. Format LLM conversation prompt
        formatted_messages = []
        context_prompt = PromptBuilder.build_chat_context_prompt(context_type, analysis_context) if analysis_context else ""

        # Limit recent history to last 10 turns
        recent_history = history_list[-10:] if len(history_list) > 10 else history_list
        for item in recent_history:
            role = item.get("role") or ("user" if item.get("isUser") else "assistant")
            content = item.get("content") or item.get("text") or ""
            if role in ("user", "assistant") and content:
                formatted_messages.append({"role": role, "content": content})

        if not formatted_messages:
            first_turn_text = f"{context_prompt}\n\nUSER QUESTION: {user_message}" if context_prompt else user_message
            formatted_messages.append({"role": "user", "content": first_turn_text})
        else:
            if context_prompt:
                formatted_messages[0]["content"] = f"{context_prompt}\n\n{formatted_messages[0]['content']}"
            formatted_messages.append({"role": "user", "content": user_message})

        system_prompt = PromptBuilder.build_chat_system_prompt()

        try:
            answer = GroqService.chat_completion(
                messages=formatted_messages,
                system_prompt=system_prompt,
                timeout_sec=20,
            )

            # Update conversation title if still generic
            if conversation.title in ["New Conversation", "Location Intelligence Chat"] and len(history_list) == 0:
                conversation.title = PromptBuilder.generate_auto_title(user_message)

            # Persist messages to DB
            AIMessage.objects.create(conversation=conversation, role="user", content=user_message)
            AIMessage.objects.create(conversation=conversation, role="assistant", content=answer)
            conversation.save(update_fields=['title', 'updated_at'])

            return Response({
                "answer": answer,
                "conversation_id": str(conversation.id),
                "title": conversation.title,
            }, status=status.HTTP_200_OK)

        except ValueError as ve:
            logger.error(f"[AI Chat View] Validation / Config Error: {str(ve)}")
            return Response(
                {"error": "Obrix AI is temporarily unavailable. Your location analysis is still available."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            logger.error(f"[AI Chat View] Chat completion error: {str(e)}", exc_info=True)
            return Response(
                {"error": "Obrix AI is temporarily unavailable. Your location analysis is still available."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
