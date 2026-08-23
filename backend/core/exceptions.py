"""
Custom DRF exception handler.

Wraps all error responses in a consistent envelope:
{
    "error": true,
    "code": "validation_error",
    "message": "Human readable message",
    "details": { field: [errors] }
}
"""

from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


class OSMDataUnavailableException(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "Live OpenStreetMap data is temporarily unavailable. Please retry in a moment."
    default_code = "osm_data_unavailable"


def custom_exception_handler(exc, context):
    """Intercept DRF exceptions and normalize the response format."""
    response = exception_handler(exc, context)

    if response is not None:
        explicit_code = getattr(exc, "default_code", None) or getattr(exc, "code", None)
        if not explicit_code or not isinstance(explicit_code, str):
            explicit_code = _get_error_code(response.status_code)

        error_data = {
            "error": True,
            "code": explicit_code,
            "message": _extract_message(response.data),
            "details": response.data if isinstance(response.data, dict) else {},
        }
        response.data = error_data
    else:
        # Unhandled exception — log and return 500
        logger.exception("Unhandled exception: %s", exc)
        return Response(
            {
                "error": True,
                "code": "internal_server_error",
                "message": "An unexpected error occurred. Please try again.",
                "details": {},
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response


def _get_error_code(status_code: int) -> str:
    codes = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        405: "method_not_allowed",
        409: "conflict",
        422: "validation_error",
        429: "throttled",
        500: "internal_server_error",
        502: "bad_gateway",
        503: "osm_data_unavailable",
        504: "gateway_timeout",
    }
    return codes.get(status_code, "error")


def _extract_message(data) -> str:
    if isinstance(data, dict):
        # Return the first error message found
        for value in data.values():
            if isinstance(value, list) and value:
                return str(value[0])
            if isinstance(value, str):
                return value
    if isinstance(data, list) and data:
        return str(data[0])
    return str(data)
