"""URL configuration for the AI application."""

from django.urls import path
from .views import (
    GenerateReportView,
    ChatView,
    ConversationListCreateView,
    ConversationDetailView,
    ConversationMessagesView,
)

app_name = "ai"

urlpatterns = [
    path("report/", GenerateReportView.as_view(), name="generate-report"),
    path("chat/", ChatView.as_view(), name="ai-chat"),
    path("conversations/", ConversationListCreateView.as_view(), name="conversation-list-create"),
    path("conversations/<uuid:id>/", ConversationDetailView.as_view(), name="conversation-detail"),
    path("conversations/<uuid:id>/messages/", ConversationMessagesView.as_view(), name="conversation-messages"),
]


