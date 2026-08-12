import os
import logging
from django.conf import settings
from .client import PostGISClient

logger = logging.getLogger(__name__)


def get_osm_backend():
    """
    Backend factory function.

    Returns PostGISClient when OSM_DATA_SOURCE == 'local',
    otherwise OverpassClient when OSM_DATA_SOURCE == 'overpass'.
    """
    try:
        source = getattr(settings, "OSM_DATA_SOURCE", None)
    except Exception:
        source = None

    if source is None:
        source = os.environ.get("OSM_DATA_SOURCE", "local")

    source = str(source).lower().strip()

    if source == "local":
        try:
            return PostGISClient()
        except Exception as exc:
            logger.warning("Local PostGISClient init failed (%s); falling back to OverpassClient.", exc)
            from intelligence.geo.overpass import OverpassClient
            return OverpassClient()

    # Explicitly overpass or non-local: return OverpassClient directly without PostGIS fallback
    from intelligence.geo.overpass import OverpassClient
    return OverpassClient()


__all__ = ["PostGISClient", "get_osm_backend"]

