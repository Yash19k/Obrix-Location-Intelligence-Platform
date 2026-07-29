"""
Obrix URL configuration — root router.

API versioning strategy: all endpoints live under /api/v1/.
Each app registers its own router via include().

Verification endpoints:
  GET /          → Landing page (HTML or JSON based on Accept header)
  GET /health/   → Health check: {"status": "ok"}
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    """
    GET /health/
    Simple health check endpoint. Returns 200 OK if Django is running.
    No database query — intentionally lightweight.
    """
    return JsonResponse({"status": "ok"})


def root_view(request):
    """
    GET /
    Root endpoint — useful for quick API verification.
    The real landing page is served by the React frontend.
    """
    return JsonResponse({
        "name": "Obrix API",
        "version": "v1",
        "description": "Intelligent Location Intelligence Platform",
        "docs": "/api/v1/",
        "health": "/health/",
        "admin": "/admin/",
    })


# API v1 URL patterns — each app owns its namespace
api_v1_patterns = [
    path("auth/", include("apps.accounts.urls", namespace="accounts")),
    path("locations/", include("apps.locations.urls", namespace="locations")),
    path("analysis/", include("apps.analysis.urls", namespace="analysis")),
    path("reports/", include("apps.reports.urls", namespace="reports")),
]

urlpatterns = [
    # Verification endpoints
    path("", root_view, name="root"),
    path("health/", health_check, name="health"),

    # Admin
    path("admin/", admin.site.urls),

    # API v1
    path("api/v1/", include((api_v1_patterns, "api_v1"))),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    # django-debug-toolbar (only if installed)
    try:
        import debug_toolbar
        urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
    except ImportError:
        pass
