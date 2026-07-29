"""
[DEPRECATED] local.py — SQLite development settings.

This file is no longer used. The project now uses PostgreSQL 18 + PostGIS 3.6.2
for local development, matching the production environment exactly.

The active settings file is: config/settings/development.py

Migration completed: 2026-07-04
Reason: PostgreSQL 18 + PostGIS 3.6.2 installed natively on all development machines.
         SQLite cannot support:
           - PostGIS PointField (geography/geometry types)
           - PostgreSQL ArrayField
           - Spatial indexes and ST_* functions

Do NOT use this file. It will be removed in a future cleanup.
"""

raise ImportError(
    "\n\n"
    "config.settings.local is DEPRECATED and no longer functional.\n"
    "Use: config.settings.development\n\n"
    "Start the server with:\n"
    "  python manage.py runserver --settings=config.settings.development\n"
    "Or set in .env:\n"
    "  DJANGO_SETTINGS_MODULE=config.settings.development\n"
)
