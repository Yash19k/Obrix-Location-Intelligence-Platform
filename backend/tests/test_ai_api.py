import django
import pytest
from unittest.mock import patch

django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.reports.models import Report

import uuid

User = get_user_model()

@pytest.mark.django_db
@patch('apps.ai.services.groq_service.GroqService.generate_content')
def test_ai_report_flow(mock_generate):
    # Mock Groq response
    mock_generate.return_value = '{"executive_summary": "Test consulting summary", "location_overview": "Test context"}'

    # Setup test user with unique email
    email = f"test_ai_{uuid.uuid4().hex[:6]}@obrix.ai"
    user = User.objects.create_user(email=email, password="Testpass123!")
    client = APIClient()
    client.force_authenticate(user=user)

    # 1. Generate Report
    payload = {
        "analysis_data": {
            "latitude": "23.0225",  # Send as string to test type-safety conversion
            "longitude": "72.5714", # Send as string to test type-safety conversion
            "business_type": "cafe",
            "site_readiness_score": "75.0", # Send as string to test type-safety conversion
            "result": {
                "score_breakdown": {
                    "accessibility": "80.0", # Send as string to test type-safety conversion
                    "infrastructure": "75.0",
                    "commercial": "70.0",
                    "competition": "85.0",
                    "environment": "65.0"
                },
                "feature_counts": {
                    "roads": "42", # Send as string to test type-safety conversion
                    "hospitals": 3,
                    "schools": 2,
                    "restaurants": 8,
                    "banks": 4,
                    "parks": 2,
                    "fuel_stations": 1,
                    "bus_stops": 5
                }
            }
        }
    }

    res = client.post("/api/v1/ai/report/", payload, format="json")
    assert res.status_code == 201
    assert "ai_report_json" in res.data
    report_id = res.data["id"]

    # 2. List Reports
    res_list = client.get("/api/v1/reports/")
    assert res_list.status_code == 200
    assert len(res_list.data) >= 1

    # 3. View Report Detail
    res_detail = client.get(f"/api/v1/reports/{report_id}/")
    assert res_detail.status_code == 200
    assert res_detail.data["title"].startswith("AI Consulting Report")

    # 4. Regenerate Report
    res_regen = client.post(f"/api/v1/reports/{report_id}/regenerate/")
    assert res_regen.status_code == 200

    # 5. Delete Report
    res_delete = client.delete(f"/api/v1/reports/{report_id}/")
    assert res_delete.status_code == 204
    assert Report.objects.filter(id=report_id).count() == 0
