"""Serializer for the reports app."""

from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = (
            "id", "title", "business_type", "latitude", "longitude",
            "score", "analysis_json", "ai_report_json", "request_ids",
            "pdf_url", "created_at",
        )
        read_only_fields = ("id", "pdf_url", "created_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
