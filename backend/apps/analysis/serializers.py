"""Serializers for the analysis app — Phase 3 Final.

Backward-compatible: all existing fields are unchanged.
Phase 3 Final additions (read-only, extracted from raw_factors._meta):
  - confidence        : {score, label, penalties}
  - distance_metrics  : {category: {nearest_distance, avg_distance}}
  - density_metrics   : {category: features/km²}
  - road_hierarchy    : road type breakdown + quality score
  - competition_metrics : competitor count + breakdown
"""

from rest_framework import serializers
from .models import AnalysisRequest, AnalysisResult, WeightConfig


class AnalysisResultSerializer(serializers.ModelSerializer):
    """
    Serialiser for AnalysisResult.

    Phase 3.2 additions (from osm_data_snapshot):
      feature_counts, feature_details, osm_query_meta

    Phase 3 Final additions (from raw_factors._meta):
      confidence, distance_metrics, density_metrics, road_hierarchy, competition_metrics
    """

    # ── From osm_data_snapshot ──────────────────────────────────────────────

    feature_counts  = serializers.SerializerMethodField()
    feature_details = serializers.SerializerMethodField()
    osm_query_meta  = serializers.SerializerMethodField()

    def get_feature_counts(self, obj) -> dict:
        return obj.osm_data_snapshot.get("feature_counts", {})

    def get_feature_details(self, obj) -> dict:
        return obj.osm_data_snapshot.get("feature_details", {})

    def get_osm_query_meta(self, obj) -> dict:
        snap = obj.osm_data_snapshot
        return {
            "source":         snap.get("source"),
            "query_time_ms":  snap.get("query_time_ms"),
            "total_features": snap.get("total_features", 0),
            "radius_m":       snap.get("radius_m"),
            "osm_error":      snap.get("osm_error"),
        }

    # ── Phase 3 Final: from raw_factors._meta ─────────────────────────────

    confidence         = serializers.SerializerMethodField()
    distance_metrics   = serializers.SerializerMethodField()
    density_metrics    = serializers.SerializerMethodField()
    road_hierarchy     = serializers.SerializerMethodField()
    competition_metrics = serializers.SerializerMethodField()

    def _meta(self, obj) -> dict:
        """Helper: extract _meta from raw_factors."""
        return obj.raw_factors.get("_meta", {})

    def get_confidence(self, obj) -> dict:
        return self._meta(obj).get("confidence", {})

    def get_distance_metrics(self, obj) -> dict:
        return self._meta(obj).get("distance_metrics", {})

    def get_density_metrics(self, obj) -> dict:
        return self._meta(obj).get("density_metrics", {})

    def get_road_hierarchy(self, obj) -> dict:
        return self._meta(obj).get("road_hierarchy", {})

    def get_competition_metrics(self, obj) -> dict:
        return self._meta(obj).get("competition_metrics", {})

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
            # Phase 3.2
            "feature_counts",
            "feature_details",
            "osm_query_meta",
            # Phase 3 Final
            "confidence",
            "distance_metrics",
            "density_metrics",
            "road_hierarchy",
            "competition_metrics",
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
