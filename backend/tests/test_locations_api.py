import django
import pytest

django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.locations.models import SavedLocation

import uuid

User = get_user_model()

@pytest.mark.django_db
def test_create_and_list_saved_location():
    email = f"test_{uuid.uuid4().hex[:6]}@obrix.ai"
    user = User.objects.create_user(email=email, password="TestPassword123!")
    client = APIClient()
    client.force_authenticate(user=user)

    payload = {
        "name": "Ahmedabad Test Site",
        "description": "Readiness score 74.5/100",
        "address": "Radius 1000m",
        "latitude": 23.0225,
        "longitude": 72.5714,
    }

    response = client.post("/api/v1/locations/", payload, format="json")
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Ahmedabad Test Site"
    assert data["latitude"] == 23.0225
    assert data["longitude"] == 72.5714
    assert "id" in data

    # Verify listing returns the created location
    list_res = client.get("/api/v1/locations/")
    assert list_res.status_code == 200
    list_data = list_res.json()
    items = list_data if isinstance(list_data, list) else list_data.get("results", [])
    assert len(items) == 1
    assert items[0]["name"] == "Ahmedabad Test Site"
