"""
intelligence/geo/overpass.py

Low-level Overpass API client.

Responsibilities
----------------
- Build the Overpass QL query for all 8 categories in one batched request.
- Execute the HTTP POST against the public Overpass API endpoint.
- Parse the raw JSON response into a flat list of GeoFeature objects.
- Handle HTTP / network errors gracefully (never raises to callers).

Design note
-----------
This class knows nothing about caching, Django, or the scoring engine.
It is the only place where the Overpass API URL and QL syntax live.
Replacing it with a PostGIS-backed implementation requires only changing
FeatureCollector._backend, not any other module.
"""

from __future__ import annotations

import logging
import time
from typing import Optional

import requests

from .types import (
    ALL_CATEGORIES,
    GeoFeature,
    FeatureResult,
    empty_features,
)

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

OVERPASS_URL  = "https://overpass-api.de/api/interpreter"
TIMEOUT_SECS  = 30        # total request timeout
RETRY_WAIT    = 2.0       # seconds to wait before one retry on 429

# ── Tag → Category mapping ────────────────────────────────────────────────────
# Evaluated top-to-bottom; first match wins.

_ROAD_HIGHWAYS = frozenset({
    "motorway", "trunk", "primary", "secondary",
    "tertiary", "residential", "unclassified", "living_street",
})

_HOSPITAL_AMENITIES = frozenset({"hospital", "clinic", "doctors", "nursing_home"})
_SCHOOL_AMENITIES   = frozenset({"school", "college", "university", "kindergarten", "language_school"})
_RESTAURANT_AMENITIES = frozenset({"restaurant", "fast_food", "cafe", "food_court", "pub", "bar"})
_BANK_AMENITIES       = frozenset({"bank", "atm", "bureau_de_change"})


def _categorise(tags: dict[str, str]) -> Optional[str]:
    """Return the category for an OSM element's tags, or None if uncategorised."""
    amenity   = tags.get("amenity", "")
    highway   = tags.get("highway", "")
    leisure   = tags.get("leisure", "")
    landuse   = tags.get("landuse", "")
    pub_trans = tags.get("public_transport", "")
    bus       = tags.get("bus", "")

    if highway in _ROAD_HIGHWAYS:
        return "roads"
    if highway == "bus_stop":
        return "bus_stops"
    if pub_trans == "stop_position" and bus == "yes":
        return "bus_stops"
    if amenity in _HOSPITAL_AMENITIES:
        return "hospitals"
    if amenity in _SCHOOL_AMENITIES:
        return "schools"
    if amenity == "fuel":
        return "fuel_stations"
    if amenity in _RESTAURANT_AMENITIES:
        return "restaurants"
    if amenity in _BANK_AMENITIES:
        return "banks"
    if leisure == "park" or landuse in ("park", "recreation_ground", "village_green"):
        return "parks"

    return None


# ── Query builder ─────────────────────────────────────────────────────────────

def _build_query(lat: float, lon: float, radius_m: int) -> str:
    """
    Build a single batched Overpass QL query that retrieves all 8 feature
    categories in one HTTP call.

    Uses ``out center`` so that way/relation centroids are returned.
    """
    a = f"around:{radius_m},{lat:.6f},{lon:.6f}"
    q = f"""
[out:json][timeout:{TIMEOUT_SECS}];
(
  // ── Roads ─────────────────────────────────────────────────────────────
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street)$"]({a});

  // ── Hospitals & clinics ───────────────────────────────────────────────
  node["amenity"~"^(hospital|clinic|doctors|nursing_home)$"]({a});
  way["amenity"~"^(hospital|clinic)$"]({a});

  // ── Schools & universities ────────────────────────────────────────────
  node["amenity"~"^(school|college|university|kindergarten|language_school)$"]({a});
  way["amenity"~"^(school|college|university|kindergarten)$"]({a});

  // ── Bus stops ─────────────────────────────────────────────────────────
  node["highway"="bus_stop"]({a});
  node["public_transport"="stop_position"]["bus"="yes"]({a});

  // ── Parks ─────────────────────────────────────────────────────────────
  node["leisure"="park"]({a});
  way["leisure"="park"]({a});
  relation["leisure"="park"]({a});
  way["landuse"~"^(park|recreation_ground|village_green)$"]({a});

  // ── Fuel stations ─────────────────────────────────────────────────────
  node["amenity"="fuel"]({a});
  way["amenity"="fuel"]({a});

  // ── Restaurants / cafes / fast food ──────────────────────────────────
  node["amenity"~"^(restaurant|fast_food|cafe|food_court|pub|bar)$"]({a});

  // ── Banks & ATMs ──────────────────────────────────────────────────────
  node["amenity"~"^(bank|atm|bureau_de_change)$"]({a});
);
out center body;
"""
    return q.strip()


# ── Element parser ────────────────────────────────────────────────────────────

def _parse_element(element: dict) -> Optional[GeoFeature]:
    """
    Convert a single Overpass JSON element into a GeoFeature.
    Returns None if the element cannot be categorised or has no useful tags.
    """
    tags     = element.get("tags") or {}
    category = _categorise(tags)
    if category is None:
        return None

    osm_type = element.get("type", "node")
    osm_id   = f"{osm_type}/{element.get('id', 0)}"
    name     = tags.get("name") or tags.get("name:en") or None

    # Nodes have lat/lon directly; ways/relations have a "center" object
    if osm_type == "node":
        lat = element.get("lat")
        lon = element.get("lon")
    else:
        center = element.get("center") or {}
        lat = center.get("lat")
        lon = center.get("lon")

    return GeoFeature(
        osm_id=osm_id,
        osm_type=osm_type,
        category=category,
        name=name,
        lat=lat,
        lon=lon,
        tags=tags,
    )


# ── OverpassClient ────────────────────────────────────────────────────────────

class OverpassClient:
    """
    Thin HTTP wrapper around the Overpass API.

    Usage
    -----
    client = OverpassClient()
    result = client.fetch(lat=28.6139, lon=77.2090, radius_m=1000)
    # result is a FeatureResult

    Error handling
    --------------
    Network errors, timeouts, and malformed responses are caught internally.
    The returned FeatureResult will have ``error`` set and empty ``features``.
    A single retry is attempted on HTTP 429 (rate-limit).
    """

    def __init__(self, url: str = OVERPASS_URL) -> None:
        self._url = url
        self._session = requests.Session()
        self._session.headers.update({
            "User-Agent": "Obrix/1.0 (academic project; github.com/Yash19k/Obrix)",
            "Content-Type": "application/x-www-form-urlencoded",
        })

    # ── Public interface ──────────────────────────────────────────────────────

    def fetch(
        self,
        lat: float,
        lon: float,
        radius_m: int,
    ) -> FeatureResult:
        """
        Fetch all 8 feature categories near (lat, lon) within radius_m metres.

        Never raises.  Always returns a FeatureResult (possibly with error set).
        """
        self._validate(lat, lon, radius_m)
        query = _build_query(lat, lon, radius_m)

        t0 = time.perf_counter()
        raw = self._execute(query)
        elapsed_ms = (time.perf_counter() - t0) * 1000

        if raw is None:
            return FeatureResult(
                latitude=lat,
                longitude=lon,
                radius_m=radius_m,
                features=empty_features(),
                source="overpass",
                query_time_ms=elapsed_ms,
                error="Overpass API request failed. Using empty feature set.",
            )

        features  = self._parse(raw)
        total     = sum(len(v) for v in features.values())
        logger.info(
            "Overpass: fetched %d features in %.0fms (lat=%.4f lon=%.4f r=%dm)",
            total, elapsed_ms, lat, lon, radius_m,
        )

        return FeatureResult(
            latitude=lat,
            longitude=lon,
            radius_m=radius_m,
            features=features,
            source="overpass",
            query_time_ms=elapsed_ms,
        )

    # ── Private helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _validate(lat: float, lon: float, radius_m: int) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"Invalid latitude: {lat}")
        if not (-180 <= lon <= 180):
            raise ValueError(f"Invalid longitude: {lon}")
        if not (50 <= radius_m <= 50_000):
            raise ValueError(f"radius_m must be between 50 and 50000, got {radius_m}")

    def _execute(self, query: str) -> Optional[dict]:
        """
        POST the query to the Overpass interpreter.
        Retries once on HTTP 429.  Returns raw JSON dict or None on failure.
        """
        for attempt in (1, 2):
            try:
                response = self._session.post(
                    self._url,
                    data={"data": query},
                    timeout=TIMEOUT_SECS + 5,  # slightly longer than QL timeout
                )
                if response.status_code == 429:
                    if attempt == 1:
                        logger.warning("Overpass rate-limited (429). Retrying in %.0fs…", RETRY_WAIT)
                        time.sleep(RETRY_WAIT)
                        continue
                    logger.error("Overpass rate-limited on retry. Returning empty result.")
                    return None

                response.raise_for_status()
                return response.json()

            except requests.exceptions.Timeout:
                logger.error("Overpass request timed out after %ds.", TIMEOUT_SECS)
                return None
            except requests.exceptions.ConnectionError as exc:
                logger.error("Overpass connection error: %s", exc)
                return None
            except requests.exceptions.HTTPError as exc:
                logger.error("Overpass HTTP error: %s", exc)
                return None
            except ValueError:
                # json() raised — response was not valid JSON
                logger.error("Overpass returned non-JSON response.")
                return None

        return None  # exhausted retries

    @staticmethod
    def _parse(raw: dict) -> dict[str, list[GeoFeature]]:
        """
        Convert the Overpass JSON ``elements`` list into a categorised dict.
        Uncategorised elements are silently dropped.
        """
        features = empty_features()
        elements = raw.get("elements", [])

        for element in elements:
            geo = _parse_element(element)
            if geo is not None:
                features[geo.category].append(geo)

        return features
