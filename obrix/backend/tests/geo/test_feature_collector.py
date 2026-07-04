"""
tests/geo/test_feature_collector.py

Unit tests for intelligence.geo.feature_collector.FeatureCollector.

Tests cover:
  - Successful collect() returns FeatureResult with all 8 categories
  - Cache hit avoids calling the backend
  - Cache miss calls the backend and stores result in cache
  - Backend error propagates into result.error without raising
  - collect_summary() returns counts dict
  - Cache disabled (cache=None) always calls backend
  - ValueError propagates immediately for bad input
  - collect() result is correct on second call (from cache)
"""

from __future__ import annotations

import unittest
from unittest.mock import MagicMock, call, patch

import django
from django.conf import settings

if not settings.configured:
    settings.configure(
        DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
        CACHES={"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}},
        INSTALLED_APPS=["django.contrib.contenttypes", "django.contrib.auth"],
    )
    django.setup()

from intelligence.geo.feature_collector import FeatureCollector
from intelligence.geo.types import (
    ALL_CATEGORIES,
    GeoFeature,
    FeatureResult,
    empty_features,
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_geo_feature(category: str, osm_id: str = "node/1") -> GeoFeature:
    return GeoFeature(
        osm_id=osm_id,
        osm_type="node",
        category=category,
        name="Test Feature",
        lat=28.6139,
        lon=77.2090,
        tags={},
    )


def _make_ok_result(lat=28.6139, lon=77.2090, radius_m=1000) -> FeatureResult:
    """Create a FeatureResult with one feature per category."""
    features = empty_features()
    for i, cat in enumerate(ALL_CATEGORIES):
        features[cat] = [_make_geo_feature(cat, osm_id=f"node/{i}")]
    return FeatureResult(
        latitude=lat,
        longitude=lon,
        radius_m=radius_m,
        features=features,
        source="overpass",
        query_time_ms=123.4,
    )


def _make_error_result(lat=28.6139, lon=77.2090, radius_m=1000) -> FeatureResult:
    return FeatureResult(
        latitude=lat,
        longitude=lon,
        radius_m=radius_m,
        features=empty_features(),
        source="overpass",
        query_time_ms=5001.0,
        error="Overpass API request failed. Using empty feature set.",
    )


def _make_mock_backend(result: FeatureResult) -> MagicMock:
    backend = MagicMock()
    backend.fetch.return_value = result
    # mirror real validator
    from intelligence.geo.overpass import OverpassClient
    backend._validate = OverpassClient._validate
    return backend


def _make_mock_cache(hit: FeatureResult | None = None) -> MagicMock:
    cache = MagicMock()
    cache.get.return_value = hit   # None = miss, FeatureResult = hit
    cache.set.return_value = None
    return cache


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestFeatureCollectorCollect(unittest.TestCase):

    # ── Happy path ────────────────────────────────────────────────────────────

    def test_collect_returns_feature_result(self):
        expected = _make_ok_result()
        collector = FeatureCollector(
            backend=_make_mock_backend(expected),
            cache=_make_mock_cache(hit=None),
        )
        result = collector.collect(lat=28.6139, lon=77.2090, radius_m=1000)
        self.assertIsInstance(result, FeatureResult)

    def test_collect_has_all_eight_categories(self):
        expected = _make_ok_result()
        collector = FeatureCollector(
            backend=_make_mock_backend(expected),
            cache=_make_mock_cache(hit=None),
        )
        result = collector.collect(28.6139, 77.2090, 1000)
        for cat in ALL_CATEGORIES:
            self.assertIn(cat, result.features)

    def test_collect_total_equals_sum_of_categories(self):
        expected = _make_ok_result()
        collector = FeatureCollector(
            backend=_make_mock_backend(expected),
            cache=_make_mock_cache(hit=None),
        )
        result = collector.collect(28.6139, 77.2090, 1000)
        manual_total = sum(len(v) for v in result.features.values())
        self.assertEqual(result.total, manual_total)

    # ── Cache behaviour ───────────────────────────────────────────────────────

    def test_cache_miss_calls_backend(self):
        expected = _make_ok_result()
        mock_backend = _make_mock_backend(expected)
        collector = FeatureCollector(
            backend=mock_backend,
            cache=_make_mock_cache(hit=None),   # cache miss
        )
        collector.collect(28.6139, 77.2090, 1000)
        mock_backend.fetch.assert_called_once_with(lat=28.6139, lon=77.2090, radius_m=1000)

    def test_cache_hit_skips_backend(self):
        cached_result = _make_ok_result()
        cached_result = FeatureResult(
            latitude=28.6139, longitude=77.2090, radius_m=1000,
            features=empty_features(), source="cache",
        )
        mock_backend = _make_mock_backend(_make_ok_result())
        collector = FeatureCollector(
            backend=mock_backend,
            cache=_make_mock_cache(hit=cached_result),  # cache hit
        )
        result = collector.collect(28.6139, 77.2090, 1000)
        mock_backend.fetch.assert_not_called()
        self.assertEqual(result.source, "cache")

    def test_successful_result_stored_in_cache(self):
        expected = _make_ok_result()
        mock_cache = _make_mock_cache(hit=None)
        collector = FeatureCollector(
            backend=_make_mock_backend(expected),
            cache=mock_cache,
        )
        collector.collect(28.6139, 77.2090, 1000)
        mock_cache.set.assert_called_once()
        stored_arg = mock_cache.set.call_args[0][0]
        self.assertIsInstance(stored_arg, FeatureResult)

    def test_error_result_not_stored_in_cache(self):
        """Failed backend responses must not be cached."""
        mock_cache = _make_mock_cache(hit=None)
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_error_result()),
            cache=mock_cache,
        )
        collector.collect(28.6139, 77.2090, 1000)
        mock_cache.set.assert_not_called()

    def test_cache_disabled_always_calls_backend(self):
        mock_backend = _make_mock_backend(_make_ok_result())
        collector = FeatureCollector(backend=mock_backend, cache=None)
        collector.collect(28.6139, 77.2090, 1000)
        collector.collect(28.6139, 77.2090, 1000)
        self.assertEqual(mock_backend.fetch.call_count, 2)

    # ── Error handling ────────────────────────────────────────────────────────

    def test_backend_error_returns_result_with_error_field(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_error_result()),
            cache=_make_mock_cache(hit=None),
        )
        result = collector.collect(28.6139, 77.2090, 1000)
        self.assertFalse(result.ok)
        self.assertIsNotNone(result.error)

    def test_backend_error_features_are_empty_lists(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_error_result()),
            cache=_make_mock_cache(hit=None),
        )
        result = collector.collect(28.6139, 77.2090, 1000)
        for cat in ALL_CATEGORIES:
            self.assertEqual(result.features[cat], [])

    def test_invalid_lat_raises_value_error(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_ok_result()),
            cache=_make_mock_cache(hit=None),
        )
        with self.assertRaises(ValueError):
            collector.collect(lat=95.0, lon=77.0, radius_m=1000)

    def test_invalid_lon_raises_value_error(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_ok_result()),
            cache=_make_mock_cache(hit=None),
        )
        with self.assertRaises(ValueError):
            collector.collect(lat=28.0, lon=-200.0, radius_m=1000)

    def test_invalid_radius_raises_value_error(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_ok_result()),
            cache=_make_mock_cache(hit=None),
        )
        with self.assertRaises(ValueError):
            collector.collect(lat=28.0, lon=77.0, radius_m=0)

    # ── collect_summary ───────────────────────────────────────────────────────

    def test_collect_summary_returns_dict(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_ok_result()),
            cache=_make_mock_cache(hit=None),
        )
        summary = collector.collect_summary(28.6139, 77.2090, 1000)
        self.assertIsInstance(summary, dict)

    def test_collect_summary_has_counts_key(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_ok_result()),
            cache=_make_mock_cache(hit=None),
        )
        summary = collector.collect_summary(28.6139, 77.2090, 1000)
        self.assertIn("counts", summary)
        for cat in ALL_CATEGORIES:
            self.assertIn(cat, summary["counts"])

    def test_collect_summary_total_matches_counts(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_ok_result()),
            cache=_make_mock_cache(hit=None),
        )
        summary = collector.collect_summary(28.6139, 77.2090, 1000)
        expected_total = sum(summary["counts"].values())
        self.assertEqual(summary["total"], expected_total)

    def test_collect_summary_ok_true_on_success(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_ok_result()),
            cache=_make_mock_cache(hit=None),
        )
        summary = collector.collect_summary(28.6139, 77.2090, 1000)
        self.assertTrue(summary["ok"])

    def test_collect_summary_ok_false_on_error(self):
        collector = FeatureCollector(
            backend=_make_mock_backend(_make_error_result()),
            cache=_make_mock_cache(hit=None),
        )
        summary = collector.collect_summary(28.6139, 77.2090, 1000)
        self.assertFalse(summary["ok"])

    # ── FeatureResult properties ──────────────────────────────────────────────

    def test_result_ok_property_true_when_no_error(self):
        result = _make_ok_result()
        self.assertTrue(result.ok)

    def test_result_ok_property_false_when_error(self):
        result = _make_error_result()
        self.assertFalse(result.ok)

    def test_result_to_dict_includes_all_categories(self):
        result = _make_ok_result()
        d = result.to_dict()
        for cat in ALL_CATEGORIES:
            self.assertIn(cat, d["features"])

    def test_result_to_dict_features_are_serialisable(self):
        """to_dict() output should be JSON-serialisable (no GeoFeature objects)."""
        import json
        result = _make_ok_result()
        d = result.to_dict()
        # Should not raise
        json.dumps(d)


# ── Test: shim backwards compatibility ────────────────────────────────────────

class TestFetcherShim(unittest.TestCase):

    @patch("intelligence.geo.overpass.requests.Session")
    def test_shim_returns_dict_with_all_categories(self, MockSession):
        """fetch_nearby_features() must return a plain dict, not FeatureResult."""
        mock_session = MagicMock()
        MockSession.return_value = mock_session
        # Return empty elements so it completes quickly
        mock_session.post.return_value.status_code = 200
        mock_session.post.return_value.raise_for_status = MagicMock()
        mock_session.post.return_value.json.return_value = {"elements": []}

        from intelligence.osm.fetcher import fetch_nearby_features
        result = fetch_nearby_features(lat=28.6139, lon=77.2090, radius_m=1000)

        self.assertIsInstance(result, dict)
        for cat in ALL_CATEGORIES:
            self.assertIn(cat, result)
            self.assertIsInstance(result[cat], list)


if __name__ == "__main__":
    unittest.main()
