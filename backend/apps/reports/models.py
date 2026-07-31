"""
Report model — aggregates analysis & AI generated consulting reports.
"""

import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField


class Report(models.Model):
    """A user-created AI consulting report based on spatial AnalysisRequest objects."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="reports"
    )
    title = models.CharField(max_length=255)
    business_type = models.CharField(max_length=100, blank=True, default="retail")

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    score = models.FloatField(null=True, blank=True, default=65.0)

    # Raw analysis snapshot & structured AI report JSON
    analysis_json = models.JSONField(default=dict, blank=True)
    ai_report_json = models.JSONField(default=dict, blank=True)

    # PostgreSQL native array of UUIDs
    request_ids = ArrayField(
        base_field=models.UUIDField(),
        default=list,
        blank=True,
        help_text="UUIDs of included AnalysisRequest objects.",
    )

    pdf_url = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reports_report"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report: {self.title} ({self.user.email})"
