from rest_framework import serializers
from .models import AIConversation, AIMessage

class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']


class AIConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIConversation
        fields = [
            'id', 'title', 'context_type',
            'analysis_context', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class GenerateReportRequestSerializer(serializers.Serializer):
    analysis_request_id = serializers.UUIDField(required=False, allow_null=True)
    analysis_data = serializers.JSONField(required=False, allow_null=True)

    def validate(self, attrs):
        if not attrs.get("analysis_request_id") and not attrs.get("analysis_data"):
            raise serializers.ValidationError("Either analysis_request_id or analysis_data must be provided.")
        return attrs


class AIChatRequestSerializer(serializers.Serializer):
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
    message = serializers.CharField(required=True, min_length=1, max_length=3000)
    context_type = serializers.ChoiceField(
        choices=["general", "single_analysis", "comparison"],
        required=False,
        default="general"
    )
    analysis_context = serializers.JSONField(required=False, allow_null=True, default=dict)
    conversation_history = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )


