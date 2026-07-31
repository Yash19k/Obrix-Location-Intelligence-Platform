"""URL configuration for the AI application."""

from django.urls import path
from .views import GenerateReportView

app_name = "ai"

urlpatterns = [
    path("report/", GenerateReportView.as_view(), name="generate-report"),
]
