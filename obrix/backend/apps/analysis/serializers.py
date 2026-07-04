"""Serializers for the analysis app."""

from rest_framework import serializers
from .models import AnalysisRequest, AnalysisResult, WeightConfig


class AnalysisResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = (
            "id", "site_readiness_score", "score_breakdown",
            "osm_data_snapshot", "ai_insights", "recommendations",
            "raw_factors", "created_at",
        )
        read_only_fields = fields


class AnalysisRequestSerializer(serializers.ModelSerializer):
    """
    Handles creation of an AnalysisRequest.
    The result is nested and read-only — populated asynchronously.
    """

    result = AnalysisResultSerializer(read_only=True)

    class Meta:
        model = AnalysisRequest
        fields = (
            "id", "latitude", "longitude", "radius_m", "business_type",
            "location", "status", "created_at", "completed_at", "result",
        )
        read_only_fields = ("id", "status", "created_at", "completed_at", "result")

    def validate_latitude(self, value):
        if not (-90 <= float(value) <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_longitude(self, value):
        if not (-180 <= float(value) <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value

    def validate_radius_m(self, value):
        if not (100 <= value <= 50000):
            raise serializers.ValidationError("Radius must be between 100m and 50km.")
        return value

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class WeightConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightConfig
        fields = ("id", "business_type", "weights", "is_default", "created_at")
        read_only_fields = ("id", "created_at")
