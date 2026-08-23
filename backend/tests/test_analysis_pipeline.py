"""
tests/test_analysis_pipeline.py

Integration and unit tests for the analysis pipeline error handling.
Verifies that:
- When OSM data collection fails, HTTP 503 is returned.
- ScoringEngine is NEVER called when OSM fails.
- No fake/default AnalysisResult is created.
- AnalysisRequest status is marked FAILED.
- Successful OSM collection computes valid scores and returns HTTP 201.
"""

from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from apps.analysis.models import AnalysisRequest, AnalysisResult
from intelligence.geo.types import empty_features, FeatureResult, GeoFeature

User = get_user_model()


class AnalysisPipelineErrorHandlingTests(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            email="testuser@example.com",
            password="StrongPassword123!",
            full_name="Test Analyst",
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/analysis/"
        self.payload = {
            "latitude": "28.6139000",
            "longitude": "77.2090000",
            "radius_m": 1000,
            "business_type": "pharmacy",
        }

    @patch("apps.analysis.views.AnalysisViewSet._score")
    @patch("intelligence.geo.feature_collector.FeatureCollector.collect")
    def test_osm_failure_returns_503_and_never_scores(self, mock_collect, mock_score):
        """When Overpass fails, endpoint returns 503, scoring is skipped, and no fake result is created."""
        # Simulate all Overpass mirrors failing
        mock_collect.return_value = FeatureResult(
            latitude=28.6139,
            longitude=77.2090,
            radius_m=1000,
            features=empty_features(),
            source="overpass",
            query_time_ms=1500.0,
            error="All Overpass API endpoints failed or timed out.",
        )

        response = self.client.post(self.url, self.payload, format="json")

        # 1. Must return HTTP 503
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)

        # 2. Must return standardized machine-readable error
        data = response.json()
        self.assertTrue(data.get("error"))
        self.assertEqual(data.get("code"), "osm_data_unavailable")
        self.assertIn("Live OpenStreetMap data is temporarily unavailable", data.get("message"))

        # 3. ScoringEngine must NEVER be called
        mock_score.assert_not_called()

        # 4. No fake AnalysisResult record created
        self.assertEqual(AnalysisResult.objects.count(), 0)

        # 5. AnalysisRequest marked as FAILED
        req = AnalysisRequest.objects.first()
        self.assertIsNotNone(req)
        self.assertEqual(req.status, AnalysisRequest.Status.FAILED)

    @patch("intelligence.geo.feature_collector.FeatureCollector.collect")
    def test_osm_success_returns_201_and_computes_score(self, mock_collect):
        """When Overpass succeeds, endpoint returns 201 with real scores."""
        feats = empty_features()
        feats["hospitals"] = [
            GeoFeature(
                osm_id="node/1",
                osm_type="node",
                category="hospitals",
                name="Metro Hospital",
                lat=28.6139,
                lon=77.2090,
                tags={"amenity": "hospital"},
            )
        ]
        feats["roads"] = [
            GeoFeature(
                osm_id="way/2",
                osm_type="way",
                category="roads",
                name="Main Road",
                lat=28.6140,
                lon=77.2091,
                tags={"highway": "primary"},
            )
        ]

        mock_collect.return_value = FeatureResult(
            latitude=28.6139,
            longitude=77.2090,
            radius_m=1000,
            features=feats,
            source="overpass",
            query_time_ms=450.0,
            error=None,
        )

        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data.get("status"), "completed")
        self.assertIn("result", data)
        self.assertIsNotNone(data["result"]["site_readiness_score"])

        req = AnalysisRequest.objects.first()
        self.assertEqual(req.status, AnalysisRequest.Status.COMPLETED)
        self.assertEqual(AnalysisResult.objects.count(), 1)
