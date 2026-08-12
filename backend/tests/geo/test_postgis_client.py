"""
tests/geo/test_postgis_client.py

Unit and integration tests for PostGISClient, mapper, and get_osm_backend factory.
"""

from unittest.mock import MagicMock, patch
import pytest
import django
from django.test import TestCase, override_settings

django.setup()

from intelligence.spatial.osm.client import PostGISClient
from intelligence.spatial.osm.mapper import map_row_to_geofeature
from intelligence.spatial.osm import get_osm_backend
from intelligence.geo.overpass import OverpassClient
from intelligence.geo.types import FeatureResult


class TestPostGISClientUnit(TestCase):
    """Unit tests for PostGISClient using mocked DB cursor."""

    def test_postgis_client_validate_invalid_lat(self):
        client = PostGISClient()
        with pytest.raises(ValueError, match="Invalid latitude"):
            client.fetch(lat=95.0, lon=72.5, radius_m=1000)

    def test_postgis_client_validate_invalid_lon(self):
        client = PostGISClient()
        with pytest.raises(ValueError, match="Invalid longitude"):
            client.fetch(lat=23.0, lon=200.0, radius_m=1000)

    def test_postgis_client_validate_invalid_radius(self):
        client = PostGISClient()
        with pytest.raises(ValueError, match="radius_m must be between"):
            client.fetch(lat=23.0, lon=72.5, radius_m=10)

    def test_mapper_row_conversion(self):
        row = {
            "osm_id": 12345,
            "name": "Test Hospital",
            "lat": 23.0225,
            "lon": 72.5714,
            "amenity": "hospital",
            "distance_m": 150.5,
        }
        feat = map_row_to_geofeature(row, category="hospitals", osm_type="node")
        self.assertEqual(feat.osm_id, 12345)
        self.assertEqual(feat.category, "hospitals")
        self.assertEqual(feat.name, "Test Hospital")
        self.assertEqual(feat.lat, 23.0225)
        self.assertEqual(feat.lon, 72.5714)
        self.assertEqual(feat.tags.get("amenity"), "hospital")

    @override_settings(OSM_DATA_SOURCE="local")
    def test_get_osm_backend_returns_postgis(self):
        backend = get_osm_backend()
        self.assertIsInstance(backend, PostGISClient)

    @override_settings(OSM_DATA_SOURCE="overpass")
    def test_get_osm_backend_returns_overpass(self):
        backend = get_osm_backend()
        self.assertIsInstance(backend, OverpassClient)


class TestPostGISClientIntegration(TestCase):
    """Integration test executing against local PostGIS database (Ahmedabad dataset)."""

    def test_postgis_client_real_fetch(self):
        from django.db import connection
        if connection.vendor != "postgresql":
            self.skipTest("Integration test requires PostgreSQL connection vendor")

        with connection.cursor() as cursor:
            tables = connection.introspection.table_names(cursor)
            if "planet_osm_line" not in tables:
                self.skipTest("Integration test requires imported planet_osm_* tables in PostGIS database")

        client = PostGISClient()

        res = client.fetch(lat=23.0225, lon=72.5714, radius_m=1000)

        self.assertIsInstance(res, FeatureResult)
        self.assertEqual(res.source, "postgis")
        self.assertIsNone(res.error)
        self.assertGreater(res.total, 0)
        self.assertIn("roads", res.features)
        self.assertIn("hospitals", res.features)
