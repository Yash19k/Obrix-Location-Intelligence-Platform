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


@pytest.mark.django_db
@patch('apps.ai.services.groq_service.GroqService.chat_completion')
def test_ai_chat_flow(mock_chat):
    mock_chat.return_value = "The location benefits from high accessibility and strong commercial activity."

    email = f"test_ai_chat_{uuid.uuid4().hex[:6]}@obrix.ai"
    user = User.objects.create_user(email=email, password="Testpass123!")
    client = APIClient()

    # 1. Unauthenticated request -> 401
    res_unauth = client.post("/api/v1/ai/chat/", {"message": "Why this score?"}, format="json")
    assert res_unauth.status_code == 401

    client.force_authenticate(user=user)

    # 2. Missing payload fields -> 400
    res_bad = client.post("/api/v1/ai/chat/", {"message": ""}, format="json")
    assert res_bad.status_code == 400

    # 3. Single location chat success -> 200
    single_payload = {
        "message": "Why did this location score 76?",
        "context_type": "single_analysis",
        "analysis_context": {
            "latitude": 23.0225,
            "longitude": 72.5714,
            "business_type": "pharmacy",
            "site_readiness_score": 76.5,
            "score_breakdown": {"accessibility": 85.0, "competition": 60.0},
        },
        "conversation_history": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Ready to discuss your analysis."}
        ]
    }
    res_single = client.post("/api/v1/ai/chat/", single_payload, format="json")
    assert res_single.status_code == 200
    assert "answer" in res_single.data
    assert "high accessibility" in res_single.data["answer"]

    # 4. Comparison chat success -> 200
    comp_payload = {
        "message": "Why did Location A win?",
        "context_type": "comparison",
        "analysis_context": {
            "primaryResult": {
                "latitude": 23.0225, "longitude": 72.5714, "business_type": "pharmacy",
                "result": {"site_readiness_score": 76.5, "recommendation": "Location A recommended"}
            },
            "secondaryResult": {
                "latitude": 23.0300, "longitude": 72.5800, "business_type": "pharmacy",
                "result": {"site_readiness_score": 68.0, "recommendation": "Location B has higher competition"}
            }
        }
    }
    res_comp = client.post("/api/v1/ai/chat/", comp_payload, format="json")
    assert res_comp.status_code == 200
    assert "answer" in res_comp.data

    # 5. AI Service failure -> 503 graceful failure
    mock_chat.side_effect = RuntimeError("Groq rate limit exceeded")
    res_err = client.post("/api/v1/ai/chat/", single_payload, format="json")
    assert res_err.status_code == 503
    assert "temporarily unavailable" in res_err.data["error"]


@pytest.mark.django_db
@patch('apps.ai.services.groq_service.GroqService.chat_completion')
def test_domain_guard_and_conversation_persistence(mock_chat):
    mock_chat.return_value = "Pharmacy locations benefit from healthcare proximity."

    email = f"test_domain_{uuid.uuid4().hex[:6]}@obrix.ai"
    user = User.objects.create_user(email=email, password="Testpass123!")
    client = APIClient()
    client.force_authenticate(user=user)

    # 1. Relevant question -> LLM invoked, conversation created in DB
    res1 = client.post("/api/v1/ai/chat/", {"message": "What makes a good pharmacy location?"}, format="json")
    assert res1.status_code == 200
    assert "conversation_id" in res1.data
    conv_id = res1.data["conversation_id"]

    # 2. Verify conversation list & detail endpoint
    res_list = client.get("/api/v1/ai/conversations/")
    assert res_list.status_code == 200
    assert len(res_list.data) >= 1

    res_msgs = client.get(f"/api/v1/ai/conversations/{conv_id}/messages/")
    assert res_msgs.status_code == 200
    msgs_list = res_msgs.data.get('results', res_msgs.data)
    assert len(msgs_list) == 2  # user + assistant


    # 3. Off-topic question -> Rejected by DomainGuard without LLM call
    res_off = client.post("/api/v1/ai/chat/", {
        "conversation_id": conv_id,
        "message": "Write bubble sort in Python code"
    }, format="json")
    assert res_off.status_code == 200
    assert "specialize in location intelligence" in res_off.data["answer"]

    # 4. Follow-up question in existing conversation -> Accepted
    res_follow = client.post("/api/v1/ai/chat/", {
        "conversation_id": conv_id,
        "message": "Why?"
    }, format="json")
    assert res_follow.status_code == 200

    # 5. Rename conversation
    res_rename = client.patch(f"/api/v1/ai/conversations/{conv_id}/", {"title": "My Pharmacy Chat"}, format="json")
    assert res_rename.status_code == 200
    assert res_rename.data["title"] == "My Pharmacy Chat"

    # 6. Delete conversation
    res_del = client.delete(f"/api/v1/ai/conversations/{conv_id}/")
    assert res_del.status_code == 204


