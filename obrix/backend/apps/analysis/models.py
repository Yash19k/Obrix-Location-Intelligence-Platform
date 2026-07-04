"""
Models for the analysis app.

AnalysisRequest:  Stores the user's input (coordinates, radius, type).
AnalysisResult:   Stores the computed output (score, insights, raw data).
WeightConfig:     Configurable factor weights per business type.
"""

import uuid
from django.db import models


class AnalysisRequest(models.Model):
    """A user-submitted location analysis job."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    class BusinessType(models.TextChoices):
        RETAIL = "retail", "Retail Store"
        HOSPITAL = "hospital", "Hospital / Clinic"
        EV_STATION = "ev_station", "EV Charging Station"
        WAREHOUSE = "warehouse", "Warehouse / Logistics"
        TELECOM = "telecom", "Telecom Tower"
        RENEWABLE = "renewable", "Renewable Energy Project"
        GENERIC = "generic", "Generic"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="analysis_requests"
    )
    location = models.ForeignKey(
        "locations.SavedLocation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="analysis_requests",
    )
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    radius_m = models.IntegerField(default=1000, help_text="Analysis radius in meters")
    business_type = models.CharField(
        max_length=100, choices=BusinessType.choices, default=BusinessType.GENERIC
    )
    status = models.CharField(
        max_length=50, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "analysis_analysisrequest"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Analysis {self.id} — {self.business_type} @ ({self.latitude}, {self.longitude})"


class AnalysisResult(models.Model):
    """
    The computed output for an AnalysisRequest.
    All complex data stored as JSONB for flexibility.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    request = models.OneToOneField(
        AnalysisRequest, on_delete=models.CASCADE, related_name="result"
    )
    site_readiness_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )

    # Factor-level scores: {"accessibility": 82.5, "population": 70.0, ...}
    score_breakdown = models.JSONField(default=dict)

    # Raw OSM data snapshot at analysis time
    osm_data_snapshot = models.JSONField(default=dict)

    # AI-generated insights: [{type, title, description, priority}]
    ai_insights = models.JSONField(default=list)

    # Actionable recommendations: [{action, rationale, impact}]
    recommendations = models.JSONField(default=list)

    # Intermediate computed values for debugging/ML training
    raw_factors = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analysis_analysisresult"

    def __str__(self):
        return f"Result for {self.request_id} — Score: {self.site_readiness_score}"


class WeightConfig(models.Model):
    """
    Stores configurable factor weights per business type.
    Users can create custom weight profiles (Pro plan feature).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    business_type = models.CharField(max_length=100, unique=True)
    # Example: {"accessibility": 0.30, "population": 0.25, ...}
    weights = models.JSONField()
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True
    )
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analysis_weightconfig"

    def __str__(self):
        return f"WeightConfig: {self.business_type} (default={self.is_default})"
