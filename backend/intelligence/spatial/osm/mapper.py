"""
intelligence/spatial/osm/mapper.py

Maps PostGIS database rows to GeoFeature domain objects.
"""

from typing import Any, Dict, Optional
from intelligence.geo.types import GeoFeature, ALL_CATEGORIES, empty_features


def map_row_to_geofeature(row: Dict[str, Any], category: str, osm_type: str = "node") -> GeoFeature:
    """
    Convert a PostGIS result row into a GeoFeature object.
    
    Row expected keys:
        osm_id, name, lat, lon, distance_m, + tag columns (amenity, highway, etc.)
    """
    osm_id = row.get("osm_id", 0)
    name = row.get("name")
    lat = row.get("lat")
    lon = row.get("lon")
    
    # Construct tags dictionary from non-null tag columns
    tags: Dict[str, str] = {}
    for col in ("amenity", "highway", "leisure", "landuse", "public_transport", "shop", "tourism", "ref"):
        val = row.get(col)
        if val:
            tags[col] = str(val)

    return GeoFeature(
        osm_id=osm_id,
        osm_type=osm_type,
        category=category,
        name=name if name else None,
        lat=round(float(lat), 6) if lat is not None else None,
        lon=round(float(lon), 6) if lon is not None else None,
        tags=tags,
    )
