"""
intelligence/spatial/osm package

PostGIS-backed local OpenStreetMap geospatial query service.
"""

from django.conf import settings
from .client import PostGISClient


def get_osm_backend():
    """
    Backend factory function.

    Returns PostGISClient when OSM_DATA_SOURCE == 'local',
    otherwise falls back to OverpassClient.
    """
    source = getattr(settings, "OSM_DATA_SOURCE", "local")
    if source == "local":
        try:
            return PostGISClient()
        except Exception:
            # Fallback to Overpass if local PostGIS client fails
            from intelligence.geo.overpass import OverpassClient
            return OverpassClient()
            
    from intelligence.geo.overpass import OverpassClient
    return OverpassClient()


__all__ = ["PostGISClient", "get_osm_backend"]
