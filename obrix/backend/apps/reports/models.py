"""
Report model — aggregates multiple analyses into a saved comparison report.
PDF export is a Phase 8 feature.

Uses PostgreSQL ArrayField for request_ids (native array type,
more efficient than JSONField for UUID lists).
"""

import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField


class Report(models.Model):
    """A user-created comparison report across multiple AnalysisRequest objects."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="reports"
    )
    title = models.CharField(max_length=255)

    # PostgreSQL native array of UUIDs — efficient for membership queries
    request_ids = ArrayField(
        base_field=models.UUIDField(),
        default=list,
        blank=True,
        help_text="UUIDs of included AnalysisRequest objects.",
    )

    # Path or URL to generated PDF (populated in Phase 8)
    pdf_url = models.CharField(max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "reports_report"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report: {self.title} ({self.user.email})"
