"""
tests/geo/test_overpass.py

Unit tests for intelligence.geo.overpass.

All HTTP requests are mocked — no real network calls are made.
Tests cover:
  - Valid query returns parsed GeoFeature list
  - 429 rate-limit triggers one retry then returns empty result
  - Network timeout returns FeatureResult with error
  - Malformed JSON returns FeatureResult with error
  - Input validation raises ValueError for bad lat/lon/radius
  - Tag categorisation (every category mapped correctly)
  - Elements without recognized tags are dropped (not added to any bucket)
  - way/relation elements use center lat/lon, not direct lat/lon
"""

from __future__ import annotations

import json
import unittest
from unittest.mock import MagicMock, patch, call

import django
from django.conf import settings

# Minimal Django settings so imports work without a full project
if not settings.configured:
    settings.configure(
        DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
        CACHES={"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}},
        INSTALLED_APPS=["django.contrib.contenttypes", "django.contrib.auth"],
    )
    django.setup()

from intelligence.geo.overpass import (
    OverpassClient,
    _build_query,
    _categorise,
    _parse_element,
    OVERPASS_URL,
)
from intelligence.geo.types import ALL_CATEGORIES


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _make_node(osm_id: int, tags: dict, lat: float = 28.6, lon: float = 77.2) -> dict:
    return {"type": "node", "id": osm_id, "lat": lat, "lon": lon, "tags": tags}


def _make_way(osm_id: int, tags: dict, clat: float = 28.6, clon: float = 77.2) -> dict:
    return {"type": "way", "id": osm_id, "center": {"lat": clat, "lon": clon}, "tags": tags}


SAMPLE_ELEMENTS = [
    _make_node(1,  {"highway": "primary"}),
    _make_node(2,  {"amenity": "hospital", "name": "Apollo Hospital"}),
    _make_node(3,  {"amenity": "school"}),
    _make_node(4,  {"highway": "bus_stop", "name": "Main Bus Stop"}),
    _make_node(5,  {"leisure": "park", "name": "Central Park"}),
    _make_node(6,  {"amenity": "fuel"}),
    _make_node(7,  {"amenity": "restaurant", "name": "Dosa Corner"}),
    _make_node(8,  {"amenity": "bank"}),
    _make_way(9,   {"highway": "secondary"}, clat=28.62, clon=77.21),
    _make_node(10, {"amenity": "some_unknown_thing"}),   # should be dropped
]

SAMPLE_RESPONSE = {"elements": SAMPLE_ELEMENTS, "version": 0.6}


def _mock_response(data: dict, status_code: int = 200):
    mock = MagicMock()
    mock.status_code = status_code
    mock.json.return_value = data
    mock.raise_for_status = MagicMock()
    if status_code >= 400:
        import requests
        mock.raise_for_status.side_effect = requests.exceptions.HTTPError(
            response=mock
        )
    return mock


# ── Test: tag categorisation ──────────────────────────────────────────────────

class TestCategorise(unittest.TestCase):

    def test_road_highway_primary(self):
        self.assertEqual(_categorise({"highway": "primary"}), "roads")

    def test_road_highway_residential(self):
        self.assertEqual(_categorise({"highway": "residential"}), "roads")

    def test_bus_stop_highway(self):
        self.assertEqual(_categorise({"highway": "bus_stop"}), "bus_stops")

    def test_bus_stop_public_transport(self):
        tags = {"public_transport": "stop_position", "bus": "yes"}
        self.assertEqual(_categorise(tags), "bus_stops")

    def test_hospital(self):
        self.assertEqual(_categorise({"amenity": "hospital"}), "hospitals")

    def test_clinic(self):
        self.assertEqual(_categorise({"amenity": "clinic"}), "hospitals")

    def test_school(self):
        self.assertEqual(_categorise({"amenity": "school"}), "schools")

    def test_university(self):
        self.assertEqual(_categorise({"amenity": "university"}), "schools")

    def test_fuel_station(self):
        self.assertEqual(_categorise({"amenity": "fuel"}), "fuel_stations")

    def test_restaurant(self):
        self.assertEqual(_categorise({"amenity": "restaurant"}), "restaurants")

    def test_cafe(self):
        self.assertEqual(_categorise({"amenity": "cafe"}), "restaurants")

    def test_bank(self):
        self.assertEqual(_categorise({"amenity": "bank"}), "banks")

    def test_atm(self):
        self.assertEqual(_categorise({"amenity": "atm"}), "banks")

    def test_park_leisure(self):
        self.assertEqual(_categorise({"leisure": "park"}), "parks")

    def test_park_landuse(self):
        self.assertEqual(_categorise({"landuse": "recreation_ground"}), "parks")

    def test_unknown_returns_none(self):
        self.assertIsNone(_categorise({"amenity": "post_office"}))

    def test_empty_tags_returns_none(self):
        self.assertIsNone(_categorise({}))


# ── Test: element parsing ─────────────────────────────────────────────────────

class TestParseElement(unittest.TestCase):

    def test_node_has_direct_lat_lon(self):
        elem = _make_node(42, {"highway": "primary"}, lat=12.34, lon=56.78)
        feature = _parse_element(elem)
        self.assertIsNotNone(feature)
        self.assertEqual(feature.lat, 12.34)
        self.assertEqual(feature.lon, 56.78)
        self.assertEqual(feature.osm_type, "node")
        self.assertEqual(feature.osm_id, "node/42")

    def test_way_uses_center_lat_lon(self):
        elem = _make_way(99, {"highway": "secondary"}, clat=19.07, clon=72.87)
        feature = _parse_element(elem)
        self.assertIsNotNone(feature)
        self.assertEqual(feature.lat, 19.07)
        self.assertEqual(feature.lon, 72.87)
        self.assertEqual(feature.osm_type, "way")

    def test_name_extracted(self):
        elem = _make_node(1, {"amenity": "hospital", "name": "AIIMS Delhi"})
        feature = _parse_element(elem)
        self.assertEqual(feature.name, "AIIMS Delhi")

    def test_name_none_when_absent(self):
        elem = _make_node(2, {"amenity": "fuel"})
        feature = _parse_element(elem)
        self.assertIsNone(feature.name)

    def test_unknown_tag_returns_none(self):
        elem = _make_node(3, {"amenity": "toilets"})
        self.assertIsNone(_parse_element(elem))

    def test_no_tags_returns_none(self):
        elem = {"type": "node", "id": 999, "lat": 0, "lon": 0}
        self.assertIsNone(_parse_element(elem))


# ── Test: query builder ───────────────────────────────────────────────────────

class TestBuildQuery(unittest.TestCase):

    def test_query_contains_lat_lon(self):
        q = _build_query(28.6139, 77.2090, 1000)
        self.assertIn("28.613900", q)
        self.assertIn("77.209000", q)
        self.assertIn("1000", q)

    def test_query_has_all_categories(self):
        q = _build_query(0, 0, 500)
        for keyword in ("highway", "amenity", "leisure", "bus_stop", "fuel", "bank"):
            self.assertIn(keyword, q)

    def test_query_uses_out_center(self):
        q = _build_query(0, 0, 500)
        self.assertIn("out center", q)


# ── Test: OverpassClient.fetch ────────────────────────────────────────────────

class TestOverpassClientFetch(unittest.TestCase):

    def _make_client(self) -> OverpassClient:
        return OverpassClient(url=OVERPASS_URL)

    @patch("intelligence.geo.overpass.requests.Session")
    def test_successful_fetch_returns_all_categories(self, MockSession):
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        mock_session.post.return_value = _mock_response(SAMPLE_RESPONSE)

        client = self._make_client()
        result = client.fetch(lat=28.6139, lon=77.2090, radius_m=1000)

        self.assertTrue(result.ok)
        self.assertEqual(result.source, "overpass")
        self.assertIsNone(result.error)
        # All 8 categories present
        for cat in ALL_CATEGORIES:
            self.assertIn(cat, result.features)

    @patch("intelligence.geo.overpass.requests.Session")
    def test_roads_contains_highway_primary(self, MockSession):
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        mock_session.post.return_value = _mock_response(SAMPLE_RESPONSE)

        client = self._make_client()
        result = client.fetch(28.6139, 77.2090, 1000)

        roads = result.features["roads"]
        self.assertGreaterEqual(len(roads), 1)
        self.assertTrue(any(r.tags.get("highway") == "primary" for r in roads))

    @patch("intelligence.geo.overpass.requests.Session")
    def test_unknown_elements_dropped(self, MockSession):
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        mock_session.post.return_value = _mock_response(SAMPLE_RESPONSE)

        client = self._make_client()
        result = client.fetch(28.6139, 77.2090, 1000)

        # Element 10 (unknown amenity) should not appear in any category
        all_ids = [
            f.osm_id
            for feats in result.features.values()
            for f in feats
        ]
        self.assertNotIn("node/10", all_ids)

    @patch("intelligence.geo.overpass.requests.Session")
    @patch("intelligence.geo.overpass.time.sleep")
    def test_429_retries_once_then_returns_empty(self, mock_sleep, MockSession):
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        rate_limited = _mock_response({}, 429)
        mock_session.post.return_value = rate_limited

        client = self._make_client()
        result = client.fetch(28.6139, 77.2090, 1000)

        # Should have attempted exactly 2 POST requests
        self.assertEqual(mock_session.post.call_count, 2)
        # Should have slept once
        mock_sleep.assert_called_once()
        # Result is empty but does not raise
        self.assertFalse(result.ok)
        self.assertIsNotNone(result.error)
        for cat in ALL_CATEGORIES:
            self.assertEqual(result.features[cat], [])

    @patch("intelligence.geo.overpass.requests.Session")
    def test_timeout_returns_error_result(self, MockSession):
        import requests as req_lib
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        mock_session.post.side_effect = req_lib.exceptions.Timeout()

        client = self._make_client()
        result = client.fetch(28.6139, 77.2090, 1000)

        self.assertFalse(result.ok)
        self.assertIsNotNone(result.error)

    @patch("intelligence.geo.overpass.requests.Session")
    def test_connection_error_returns_error_result(self, MockSession):
        import requests as req_lib
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        mock_session.post.side_effect = req_lib.exceptions.ConnectionError("refused")

        client = self._make_client()
        result = client.fetch(28.6139, 77.2090, 1000)

        self.assertFalse(result.ok)

    @patch("intelligence.geo.overpass.requests.Session")
    def test_malformed_json_returns_error_result(self, MockSession):
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.raise_for_status = MagicMock()
        mock_resp.json.side_effect = ValueError("No JSON object could be decoded")
        mock_session.post.return_value = mock_resp

        client = self._make_client()
        result = client.fetch(28.6139, 77.2090, 1000)

        self.assertFalse(result.ok)

    def test_invalid_latitude_raises_value_error(self):
        client = self._make_client()
        with self.assertRaises(ValueError):
            client.fetch(lat=91.0, lon=77.0, radius_m=1000)

    def test_invalid_longitude_raises_value_error(self):
        client = self._make_client()
        with self.assertRaises(ValueError):
            client.fetch(lat=28.0, lon=181.0, radius_m=1000)

    def test_invalid_radius_raises_value_error(self):
        client = self._make_client()
        with self.assertRaises(ValueError):
            client.fetch(lat=28.0, lon=77.0, radius_m=10)   # below 50m minimum

    @patch("intelligence.geo.overpass.requests.Session")
    def test_hospital_name_captured(self, MockSession):
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        mock_session.post.return_value = _mock_response(SAMPLE_RESPONSE)

        client = self._make_client()
        result = client.fetch(28.6139, 77.2090, 1000)

        hospitals = result.features["hospitals"]
        names = [h.name for h in hospitals]
        self.assertIn("Apollo Hospital", names)

    @patch("intelligence.geo.overpass.requests.Session")
    def test_result_metadata(self, MockSession):
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        mock_session.post.return_value = _mock_response(SAMPLE_RESPONSE)

        client = self._make_client()
        result = client.fetch(28.6139, 77.2090, 1000)

        self.assertEqual(result.latitude,  28.6139)
        self.assertEqual(result.longitude, 77.2090)
        self.assertEqual(result.radius_m,  1000)
        self.assertGreater(result.query_time_ms, 0)
        self.assertGreater(result.total, 0)

    @patch("intelligence.geo.overpass.requests.Session")
    def test_to_dict_serialises_correctly(self, MockSession):
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        mock_session.post.return_value = _mock_response(SAMPLE_RESPONSE)

        client = self._make_client()
        result = client.fetch(28.6139, 77.2090, 1000)
        d = result.to_dict()

        self.assertIn("features", d)
        self.assertIn("total_features", d)
        self.assertIn("source", d)
        for cat in ALL_CATEGORIES:
            self.assertIn(cat, d["features"])


if __name__ == "__main__":
    unittest.main()
