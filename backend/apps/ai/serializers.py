"""Serializers for the AI application."""

from rest_framework import serializers

class GenerateReportRequestSerializer(serializers.Serializer):
    analysis_request_id = serializers.UUIDField(required=False, allow_null=True)
    analysis_data = serializers.JSONField(required=False, allow_null=True)

    def validate(self, attrs):
        if not attrs.get("analysis_request_id") and not attrs.get("analysis_data"):
            raise serializers.ValidationError("Either analysis_request_id or analysis_data must be provided.")
        return attrs
