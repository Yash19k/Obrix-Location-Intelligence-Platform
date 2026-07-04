"""Admin registration for the analysis app."""

from django.contrib import admin
from .models import AnalysisRequest, AnalysisResult, WeightConfig


@admin.register(AnalysisRequest)
class AnalysisRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "business_type", "status", "latitude", "longitude", "created_at")
    list_filter = ("status", "business_type")
    search_fields = ("user__email",)
    readonly_fields = ("id", "created_at", "completed_at")


@admin.register(AnalysisResult)
class AnalysisResultAdmin(admin.ModelAdmin):
    list_display = ("id", "request", "site_readiness_score", "created_at")
    readonly_fields = ("id", "created_at")


@admin.register(WeightConfig)
class WeightConfigAdmin(admin.ModelAdmin):
    list_display = ("business_type", "is_default", "created_by", "created_at")
    list_filter = ("is_default",)
