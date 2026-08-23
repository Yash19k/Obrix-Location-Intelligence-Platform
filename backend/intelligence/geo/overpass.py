"""
intelligence/geo/overpass.py

Low-level Overpass API client.

Responsibilities
----------------
- Build the Overpass QL query for all categories in one batched request.
- Execute HTTP POST with automatic failover across multiple public Overpass API mirrors.
- Parse raw JSON response into a flat list of GeoFeature objects.
- Handle HTTP / network errors gracefully (never raises to callers).
"""

from __future__ import annotations

import logging
import random
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

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
OVERPASS_URL = OVERPASS_ENDPOINTS[0]
TIMEOUT_SECS = 15        # per-request timeout


# ── Tag → Category mapping ────────────────────────────────────────────────────
# Evaluated top-to-bottom; first match wins.

_ROAD_HIGHWAYS = frozenset({
    "motorway", "trunk", "primary", "secondary",
    "tertiary", "residential", "unclassified", "living_street",
})

_HOSPITAL_AMENITIES   = frozenset({"hospital", "clinic", "doctors", "nursing_home"})
_SCHOOL_AMENITIES     = frozenset({"school", "college", "university", "kindergarten", "language_school"})


def _categorise(tags: dict[str, str]) -> Optional[str]:
    """Return the category for an OSM element's tags, or None if uncategorised."""
    amenity   = tags.get("amenity", "")
    highway   = tags.get("highway", "")
    leisure   = tags.get("leisure", "")
    landuse   = tags.get("landuse", "")
    pub_trans = tags.get("public_transport", "")
    building  = tags.get("building", "")
    shop      = tags.get("shop", "")
    office    = tags.get("office", "")

    if highway in _ROAD_HIGHWAYS:
        return "roads"
    if highway == "bus_stop" or pub_trans in ("stop_position", "platform", "station"):
        return "bus_stops"
    if amenity in _HOSPITAL_AMENITIES or building == "hospital":
        return "hospitals"
    if amenity in _SCHOOL_AMENITIES or building in ("school", "university", "college", "kindergarten"):
        return "schools"
    if amenity == "fuel":
        return "fuel_stations"
    if amenity in ("restaurant", "fast_food", "food_court", "pub", "bar"):
        return "restaurants"
    if amenity in ("bank", "atm", "bureau_de_change"):
        return "banks"
    if leisure in ("park", "pitch", "playground", "garden") or landuse in ("park", "recreation_ground", "village_green", "grass"):
        return "parks"

    # Business-specific categories
    if amenity == "pharmacy":
        return "pharmacies"
    if shop in ("stationery", "books"):
        return "stationery_shops"
    if amenity == "cafe":
        return "cafes"
    if shop in ("grocery", "general"):
        return "grocery_stores"
    if shop == "supermarket":
        return "supermarkets"
    if shop == "convenience":
        return "convenience_stores"
    if bool(office) or building == "office":
        return "offices"
    if building == "commercial":
        return "commercial"
    if building == "apartments" or building == "residential" or landuse == "residential":
        return "residential"

    return None


# ── Query builder ─────────────────────────────────────────────────────────────

def _build_query(lat: float, lon: float, radius_m: int) -> str:
    """
    Build a single batched Overpass QL query that retrieves all feature
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
  way["amenity"~"^(hospital|clinic|doctors|nursing_home)$"]({a});
  way["building"="hospital"]({a});

  // ── Schools & universities ────────────────────────────────────────────
  node["amenity"~"^(school|college|university|kindergarten|language_school)$"]({a});
  way["amenity"~"^(school|college|university|kindergarten|language_school)$"]({a});
  way["building"~"^(school|university|college)$"]({a});

  // ── Bus stops ─────────────────────────────────────────────────────────
  node["highway"="bus_stop"]({a});
  node["public_transport"~"^(stop_position|platform)$"]({a});
  way["highway"="bus_stop"]({a});

  // ── Parks ─────────────────────────────────────────────────────────────
  node["leisure"~"^(park|pitch|playground|garden)$"]({a});
  way["leisure"~"^(park|pitch|playground|garden)$"]({a});
  relation["leisure"~"^(park|pitch|playground|garden)$"]({a});
  way["landuse"~"^(park|recreation_ground|village_green|grass)$"]({a});

  // ── Fuel stations ─────────────────────────────────────────────────────
  node["amenity"="fuel"]({a});
  way["amenity"="fuel"]({a});

  // ── Restaurants / Dining ──────────────────────────────────────────────
  node["amenity"~"^(restaurant|fast_food|food_court|pub|bar)$"]({a});
  way["amenity"~"^(restaurant|fast_food|food_court|pub|bar)$"]({a});

  // ── Banks & ATMs ──────────────────────────────────────────────────────
  node["amenity"~"^(bank|atm|bureau_de_change)$"]({a});
  way["amenity"~"^(bank|atm|bureau_de_change)$"]({a});

  // ── Pharmacies ────────────────────────────────────────────────────────
  node["amenity"="pharmacy"]({a});
  way["amenity"="pharmacy"]({a});

  // ── Stationery & Book Shops ───────────────────────────────────────────
  node["shop"~"^(stationery|books)$"]({a});
  way["shop"~"^(stationery|books)$"]({a});

  // ── Cafes ─────────────────────────────────────────────────────────────
  node["amenity"="cafe"]({a});
  way["amenity"="cafe"]({a});

  // ── Grocery, Supermarkets, Convenience ───────────────────────────────
  node["shop"~"^(grocery|general|supermarket|convenience)$"]({a});
  way["shop"~"^(grocery|general|supermarket|convenience)$"]({a});

  // ── Offices & Commercial ──────────────────────────────────────────────
  node["office"]({a});
  way["office"]({a});
  way["building"~"^(office|commercial)$"]({a});

  // ── Residential (apartments, residential landuse/buildings) ───────────
  node["building"="apartments"]({a});
  way["building"~"^(apartments|residential)$"]({a});
  way["landuse"="residential"]({a});
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
    HTTP client for the Overpass API with multi-endpoint mirror failover.

    Usage
    -----
    client = OverpassClient()
    result = client.fetch(lat=23.0350, lon=72.5600, radius_m=1000)
    # result is a FeatureResult

    Error handling
    --------------
    Network errors, timeouts, and rate limits trigger failover to mirrors.
    Always returns a FeatureResult (with error set if all mirrors fail).
    """

    def __init__(self, endpoints: list[str] | None = None, url: str | None = None) -> None:
        if url:
            self._endpoints = [url]
        elif endpoints:
            self._endpoints = endpoints
        else:
            self._endpoints = OVERPASS_ENDPOINTS

        self._session = requests.Session()
        self._session.headers.update({
            "User-Agent": "Obrix/1.0 (Location Intelligence; github.com/Yash19k/Obrix)",
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
        Fetch all feature categories near (lat, lon) within radius_m metres.

        Never raises. Always returns a FeatureResult (possibly with error set).
        """
        self._validate(lat, lon, radius_m)
        query = _build_query(lat, lon, radius_m)

        t0 = time.perf_counter()
        raw, error_msg = self._execute(query)
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        if raw is None:
            return FeatureResult(
                latitude=lat,
                longitude=lon,
                radius_m=radius_m,
                features=empty_features(),
                source="overpass",
                query_time_ms=elapsed_ms,
                error=error_msg or "Overpass API request failed. Using empty feature set.",
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

    def _execute(self, query: str) -> tuple[Optional[dict], Optional[str]]:
        """
        POST the query to available Overpass API endpoints in order.
        Tries primary endpoint first; falls back to mirrors on HTTP 429 / 5xx / timeout / connection error.
        Uses bounded exponential backoff with random jitter on transient errors (429, 502/503/504).
        Returns (raw_json_dict, error_message).
        """
        last_error = None
        total_endpoints = len(self._endpoints)

        for idx, endpoint in enumerate(self._endpoints):
            mirror_num = idx + 1
            logger.info(
                "OverpassClient: Attempting query on mirror %d/%d (%s)...",
                mirror_num, total_endpoints, endpoint
            )
            initial_wait = 0.5
            max_attempts = 2

            for attempt in range(1, max_attempts + 1):
                attempt_t0 = time.perf_counter()
                try:
                    response = self._session.post(
                        endpoint,
                        data={"data": query},
                        timeout=TIMEOUT_SECS,
                    )
                    attempt_ms = (time.perf_counter() - attempt_t0) * 1000.0

                    if response.status_code == 429:
                        jitter = random.uniform(0.05, 0.20)
                        backoff = (initial_wait * (2 ** (attempt - 1))) + jitter
                        last_error = f"Rate limit (429) at {endpoint}"
                        logger.warning(
                            "OverpassClient: Mirror %d/%d (%s) rate-limited (429) [attempt=%d/%d, wait=%.2fs].",
                            mirror_num, total_endpoints, endpoint, attempt, max_attempts, backoff
                        )
                        if attempt < max_attempts:
                            time.sleep(backoff)
                            continue
                        else:
                            break

                    if response.status_code in (502, 503, 504):
                        jitter = random.uniform(0.05, 0.20)
                        backoff = (initial_wait * (2 ** (attempt - 1))) + jitter
                        last_error = f"HTTP {response.status_code} at {endpoint}"
                        logger.warning(
                            "OverpassClient: Mirror %d/%d (%s) returned transient error HTTP %d [attempt=%d/%d].",
                            mirror_num, total_endpoints, endpoint, response.status_code, attempt, max_attempts
                        )
                        if attempt < max_attempts:
                            time.sleep(backoff)
                            continue
                        else:
                            break

                    if response.status_code >= 500:
                        last_error = f"HTTP {response.status_code} at {endpoint}"
                        logger.warning(
                            "OverpassClient: Mirror %d/%d (%s) returned server error HTTP %d. Trying next mirror...",
                            mirror_num, total_endpoints, endpoint, response.status_code
                        )
                        break

                    response.raise_for_status()
                    data = response.json()

                    if not isinstance(data, dict) or "elements" not in data:
                        last_error = f"Malformed response (no 'elements') from {endpoint}"
                        logger.warning(
                            "OverpassClient: Mirror %d/%d (%s) returned response without 'elements' key. Trying next mirror...",
                            mirror_num, total_endpoints, endpoint
                        )
                        break

                    elements_count = len(data.get("elements", []))
                    logger.info(
                        "OverpassClient: Mirror %d/%d (%s) succeeded in %.0fms (elements=%d).",
                        mirror_num, total_endpoints, endpoint, attempt_ms, elements_count
                    )
                    return data, None

                except requests.exceptions.Timeout:
                    last_error = f"Timeout at {endpoint}"
                    logger.warning(
                        "OverpassClient: Mirror %d/%d (%s) request timed out after %ds. Trying next mirror...",
                        mirror_num, total_endpoints, endpoint, TIMEOUT_SECS
                    )
                    break
                except requests.exceptions.ConnectionError as exc:
                    last_error = f"Connection error at {endpoint}"
                    logger.warning(
                        "OverpassClient: Mirror %d/%d (%s) connection failed (%s). Trying next mirror...",
                        mirror_num, total_endpoints, endpoint, exc
                    )
                    break
                except requests.exceptions.HTTPError as exc:
                    last_error = f"HTTP error at {endpoint}: {exc}"
                    logger.warning(
                        "OverpassClient: Mirror %d/%d (%s) HTTP error (%s). Trying next mirror...",
                        mirror_num, total_endpoints, endpoint, exc
                    )
                    break
                except (ValueError, TypeError) as exc:
                    last_error = f"Non-JSON response from {endpoint}"
                    logger.warning(
                        "OverpassClient: Mirror %d/%d (%s) returned non-JSON response (%s). Trying next mirror...",
                        mirror_num, total_endpoints, endpoint, exc
                    )
                    break

        logger.error(
            "OverpassClient: All %d mirrors failed or timed out. Final outcome: OSM_DATA_UNAVAILABLE (last_error: %s)",
            total_endpoints, last_error
        )
        return None, last_error or "All Overpass API endpoints failed or timed out."

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


