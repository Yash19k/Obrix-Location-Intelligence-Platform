# ── Backend Dockerfile ──────────────────────────────────────────────────────
# Multi-stage build:
#   Stage 1 (builder): Install Python deps in a virtual environment
#   Stage 2 (runtime): Copy venv only — no build tools in final image

FROM python:3.12-slim AS builder

# Install system dependencies required for PostGIS / GDAL / PROJ build
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    proj-bin \
    binutils \
    && rm -rf /var/lib/apt/lists/*

ENV VIRTUAL_ENV=/opt/venv
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

WORKDIR /app
COPY requirements/ ./requirements/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements/production.txt

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

# Install system dependencies required for GeoDjango runtime (GDAL / GEOS / PROJ)
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    proj-bin \
    binutils \
    && rm -rf /var/lib/apt/lists/*

ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings.production

COPY --from=builder $VIRTUAL_ENV $VIRTUAL_ENV

WORKDIR /app
COPY . .

EXPOSE 8000

# Automated database migrations + static collection on startup + exec Gunicorn for signal handling
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --threads 4 --timeout 120 --access-logfile -"]



