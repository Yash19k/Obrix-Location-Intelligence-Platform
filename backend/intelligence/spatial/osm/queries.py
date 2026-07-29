"""
intelligence/spatial/osm/queries.py

SQL Query Builders for PostGIS local OSM spatial dataset.
All raw SQL queries reside here.
"""

from typing import List, Tuple, Dict, Any
from django.db import connection
from .config import TABLE_POINT, TABLE_LINE, TABLE_POLYGON, TABLE_ROADS, CATEGORY_TAG_MAP


def execute_category_query(
    category: str,
    lat: float,
    lon: float,
    radius_m: int,
) -> List[Dict[str, Any]]:
    """
    Execute spatial query for a specific category within radius_m of (lat, lon).
    Returns list of dicts with row fields:
        osm_id, name, lat, lon, distance_m, amenity, highway, leisure, landuse, public_transport, shop, osm_type
    """
    results: List[Dict[str, Any]] = []
    
    if category not in CATEGORY_TAG_MAP:
        return results

    tag_filters = CATEGORY_TAG_MAP[category]

    # Decide which tables to query for this category
    tables_to_query = []
    if category == "roads":
        tables_to_query.append((TABLE_LINE, "way"))
    elif category == "bus_stops":
        tables_to_query.append((TABLE_POINT, "node"))
    else:
        # Most categories (hospitals, schools, parks, restaurants, banks, fuel) exist as both points and polygons
        tables_to_query.append((TABLE_POINT, "node"))
        tables_to_query.append((TABLE_POLYGON, "way"))

    with connection.cursor() as cursor:
        for table_name, osm_type in tables_to_query:
            cat_clauses = []
            tag_params: List[Any] = []
            for tag_col, val_set in tag_filters.items():
                placeholders = ", ".join(["%s"] * len(val_set))
                cat_clauses.append(f"{tag_col} IN ({placeholders})")
                tag_params.extend(list(val_set))
            
            where_sql = " OR ".join(cat_clauses)
            params = [lon, lat] + tag_params + [lon, lat, radius_m]

            sql = f"""
                SELECT
                    osm_id,
                    name,
                    amenity,
                    highway,
                    leisure,
                    landuse,
                    public_transport,
                    shop,
                    ST_Y(ST_Transform(ST_Centroid(way), 4326)) AS lat,
                    ST_X(ST_Transform(ST_Centroid(way), 4326)) AS lon,
                    ST_Distance(
                        ST_Transform(way, 4326)::geography,
                        ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
                    ) AS distance_m
                FROM {table_name}
                WHERE ({where_sql})
                  AND ST_DWithin(
                        way,
                        ST_Transform(ST_SetSRID(ST_MakePoint(%s, %s), 4326), 3857),
                        %s
                      )
                ORDER BY distance_m;
            """

            cursor.execute(sql, params)
            col_names = [col[0] for col in cursor.description]
            for r in cursor.fetchall():
                row_dict = dict(zip(col_names, r))
                row_dict["osm_type"] = osm_type
                results.append(row_dict)

    # Sort combined results by distance
    results.sort(key=lambda x: x.get("distance_m", float("inf")))
    return results
