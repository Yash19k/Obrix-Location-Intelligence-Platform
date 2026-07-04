import os, django, sys
from pathlib import Path

# Add the backend root to sys.path so `config`, `intelligence`, etc. resolve
_BACKEND = Path(__file__).resolve().parents[2]   # tests/geo/smoke_test.py → backend/
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from intelligence.geo import FeatureCollector

print("--- Live smoke test: Connaught Place, New Delhi (r=500m) ---")
c = FeatureCollector()
result = c.collect(lat=28.6315, lon=77.2167, radius_m=500)

print(f"Source        : {result.source}")
print(f"Query time    : {result.query_time_ms:.0f}ms")
print(f"Total features: {result.total}")
print(f"Error         : {result.error}")
print()

for cat, feats in result.features.items():
    names = [f.name or "(unnamed)" for f in feats[:2]]
    print(f"  {cat:<16} {len(feats):>3} features  {names}")

# Second call should come from cache
print()
print("--- Second call (should be cache hit) ---")
result2 = c.collect(lat=28.6315, lon=77.2167, radius_m=500)
print(f"Source : {result2.source}")
print(f"Time   : {result2.query_time_ms:.0f}ms")

print()
print("--- collect_summary ---")
summary = c.collect_summary(lat=28.6315, lon=77.2167, radius_m=500)
for k, v in summary.items():
    if k != "counts":
        print(f"  {k}: {v}")
print("  counts:")
for cat, cnt in summary["counts"].items():
    print(f"    {cat:<16} {cnt}")

sys.exit(0 if result.ok else 1)
