import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class AIConversation(models.Model):
    """
    Persistent conversational session between a user and Obrix AI.
    Optionally stores compact analysis or comparison context.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ai_conversations")
    title = models.CharField(max_length=255, default="New Conversation")
    context_type = models.CharField(max_length=50, default="general")  # 'general' | 'single_analysis' | 'comparison'
    analysis_context = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"


class AIMessage(models.Model):
    """
    Individual message turn within an AIConversation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=[("user", "User"), ("assistant", "Assistant")])
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:30]}"

