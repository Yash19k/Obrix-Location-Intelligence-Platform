"""Serializers for the analysis app.

Phase 3.2: AnalysisResultSerializer exposes feature_counts and feature_details
as top-level read-only fields extracted from osm_data_snapshot.
This keeps the API backwards-compatible — all existing fields are unchanged.
"""

from rest_framework import serializers
from .models import AnalysisRequest, AnalysisResult, WeightConfig


class AnalysisResultSerializer(serializers.ModelSerializer):
    """
    Serialiser for AnalysisResult.

    Phase 3.2 additions (read-only, extracted from osm_data_snapshot):
      - feature_counts   : {roads: 84, hospitals: 2, ...}
      - feature_details  : {roads: ["Inner Circle", ...], ...}
      - osm_query_meta   : {source, query_time_ms, total_features, osm_error}
    """

    # ── Derived fields from osm_data_snapshot ─────────────────────────────────

    feature_counts = serializers.SerializerMethodField()
    feature_details = serializers.SerializerMethodField()
    osm_query_meta  = serializers.SerializerMethodField()

    def get_feature_counts(self, obj) -> dict:
        """
        Return per-category feature counts as a flat dict.
        Returns {} if osm_data_snapshot is empty or OSM call failed.
        """
        return obj.osm_data_snapshot.get("feature_counts", {})

    def get_feature_details(self, obj) -> dict:
        """Return top named features per category (list of strings)."""
        return obj.osm_data_snapshot.get("feature_details", {})

    def get_osm_query_meta(self, obj) -> dict:
        """
        Return OSM collection metadata for debugging/transparency.
        """
        snap = obj.osm_data_snapshot
        return {
            "source":         snap.get("source"),
            "query_time_ms":  snap.get("query_time_ms"),
            "total_features": snap.get("total_features", 0),
            "radius_m":       snap.get("radius_m"),
            "osm_error":      snap.get("osm_error"),
        }

    class Meta:
        model  = AnalysisResult
        fields = (
            # Original fields (unchanged)
            "id",
            "site_readiness_score",
            "score_breakdown",
            "osm_data_snapshot",
            "ai_insights",
            "recommendations",
            "raw_factors",
            "created_at",
            # Phase 3.2 additions
            "feature_counts",
            "feature_details",
            "osm_query_meta",
        )
        read_only_fields = fields


class AnalysisRequestSerializer(serializers.ModelSerializer):
    """
    Handles creation of an AnalysisRequest.
    The result is nested and read-only — populated synchronously in Phase 3.2.
    """

    result = AnalysisResultSerializer(read_only=True)

    class Meta:
        model  = AnalysisRequest
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
        model  = WeightConfig
        fields = ("id", "business_type", "weights", "is_default", "created_at")
        read_only_fields = ("id", "created_at")
