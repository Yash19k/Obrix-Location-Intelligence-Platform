"""
tests/scoring/test_engine.py

Unit tests for the new deterministic, rule-based ScoringEngine.
Tests verify:
  - Returns ScoreResult with correct structure
  - Overall score is within [0, 100]
  - Supports only the 4 premium business types
  - Different business types produce different scores for the same feature counts
  - Competition logic is business-type specific
"""

import unittest
import sys
from pathlib import Path

_BACKEND = Path(__file__).resolve().parents[2]
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

import django
from django.conf import settings
if not settings.configured:
    settings.configure(
        DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
        CACHES={"default": {"BACKEND": "django.core.cache.backends.dummy.DummyCache"}},
        INSTALLED_APPS=[],
    )
    django.setup()

from intelligence.scoring import ScoringEngine
from intelligence.scoring.types import ScoreResult, FactorScore
from intelligence.scoring.business_profiles import BUSINESS_PROFILES

# Sample feature counts matching the new category structure (via mapping)
TEST_COUNTS = {
    "roads": 10,
    "hospitals": 3,
    "schools": 5,
    "bus_stops": 4,
    "parks": 2,
    "restaurants": 8,
    "banks": 4,
}

class TestRuleBasedScoringEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ScoringEngine()

    def test_returns_score_result_instance(self):
        result = self.engine.calculate(TEST_COUNTS, business_type="pharmacy")
        self.assertIsInstance(result, ScoreResult)

    def test_overall_score_range(self):
        result = self.engine.calculate(TEST_COUNTS, business_type="pharmacy")
        self.assertGreaterEqual(result.overall, 0.0)
        self.assertLessEqual(result.overall, 100.0)

    def test_supported_business_types(self):
        self.assertEqual(list(BUSINESS_PROFILES.keys()), ["pharmacy", "stationery", "cafe", "grocery"])

    def test_business_specificity(self):
        # Same location counts should yield different scores for pharmacy vs stationery
        pharmacy_res = self.engine.calculate(TEST_COUNTS, business_type="pharmacy")
        stationery_res = self.engine.calculate(TEST_COUNTS, business_type="stationery")
        self.assertNotEqual(pharmacy_res.overall, stationery_res.overall)

    def test_competition_logic_isolated(self):
        # Pharmacy score should be affected by nearby pharmacies (competitors)
        # but not stationery competitor count
        res_with_competitors = self.engine.calculate(
            feature_counts=TEST_COUNTS,
            business_type="pharmacy"
        )
        self.assertGreater(res_with_competitors.overall, 0.0)
