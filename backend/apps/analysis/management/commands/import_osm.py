"""
Management command: python manage.py import_osm

Imports OpenStreetMap data for Ahmedabad (or custom file) into local PostGIS database using osm2pgsql.
Auto-detects osm2pgsql or downloads Windows binary if needed.
Executes post-import spatial indexing and schema inspection.
"""

import os
import sys
import shutil
import subprocess
import urllib.request
import urllib.parse
import zipfile
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection

# Default BBOX for Ahmedabad, Gujarat: (min_lon, min_lat, max_lon, max_lat)
AHMEDABAD_BBOX = (72.45, 22.92, 72.70, 23.15)


class Command(BaseCommand):
    help = "Imports OSM data (Ahmedabad extract) into PostGIS using native osm2pgsql"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            help="Path to .osm.pbf or .osm file to import (defaults to data/ahmedabad.osm)",
        )
        parser.add_argument(
            "--bbox",
            type=str,
            default="72.53,22.97,72.63,23.08",
            help="Bounding box min_lon,min_lat,max_lon,max_lat (default: core Ahmedabad ~11km x 12km)",
        )
        parser.add_argument(
            "--osm2pgsql",
            type=str,
            help="Path to osm2pgsql executable",
        )
        parser.add_argument(
            "--style",
            type=str,
            help="Custom style file for osm2pgsql (optional)",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("=== Obrix Local OSM Importer (PostGIS) ==="))

        # 1. Resolve osm2pgsql executable
        osm2pgsql_bin = self._resolve_osm2pgsql(options.get("osm2pgsql"))
        if not osm2pgsql_bin:
            self.stderr.write(self.style.ERROR("Could not locate or download osm2pgsql executable."))
            return

        self.stdout.write(f"Using osm2pgsql: {osm2pgsql_bin}")

        # 2. Resolve input file
        data_dir = Path(settings.BASE_DIR) / "data"
        data_dir.mkdir(exist_ok=True)
        
        file_path = options.get("file")
        if file_path:
            osm_file = Path(file_path)
        else:
            # Check for .osm.pbf first (BBBike format), then .osm
            pbf_file = data_dir / "ahmedabad.osm.pbf"
            osm_file_xml = data_dir / "ahmedabad.osm"
            if pbf_file.exists():
                osm_file = pbf_file
            elif osm_file_xml.exists():
                osm_file = osm_file_xml
            else:
                osm_file = osm_file_xml  # will trigger download

        self._actual_osm_file = osm_file  # may be overridden by download

        if not osm_file.exists():
            bbox_str = options.get("bbox")
            self.stdout.write(f"OSM file not found. Downloading Ahmedabad extract...")
            download_success = self._download_ahmedabad_osm(bbox_str, osm_file)
            if not download_success:
                self.stderr.write(self.style.ERROR("Failed to download OSM data for Ahmedabad."))
                return
            osm_file = self._actual_osm_file  # use the actual downloaded file

        # If input is .osm XML file, ensure elements are sorted by type & ID for osm2pgsql
        if osm_file.suffix.lower() == ".osm" and not osm_file.name.endswith("_sorted.osm"):
            sorted_file = osm_file.with_name(f"{osm_file.stem}_sorted.osm")
            if not sorted_file.exists():
                self.stdout.write(f"Sorting XML elements in {osm_file.name} for osm2pgsql compatibility...")
                from data.sort_osm import sort_osm_file
                sort_osm_file(osm_file, sorted_file)
            if sorted_file.exists():
                osm_file = sorted_file

        self.stdout.write(f"Target OSM data file: {osm_file} ({osm_file.stat().st_size / (1024*1024):.2f} MB)")

        # 3. Prepare Database Connection Params
        db_config = settings.DATABASES["default"]
        db_name = db_config.get("NAME", "obrix_db")
        db_user = db_config.get("USER", "postgres")
        db_pass = db_config.get("PASSWORD", "")
        db_host = db_config.get("HOST", "localhost")
        db_port = str(db_config.get("PORT", "5432"))

        # Set environment variable for password
        env = os.environ.copy()
        if db_pass:
            env["PGPASSWORD"] = db_pass

        # Add Postgres bin directory to PATH if present
        pg_bin = r"C:\Program Files\PostgreSQL\18\bin"
        if os.path.exists(pg_bin) and pg_bin not in env.get("PATH", ""):
            env["PATH"] = pg_bin + os.pathsep + env.get("PATH", "")

        # 4. Construct osm2pgsql command
        cmd = [
            osm2pgsql_bin,
            "--create",
            "--database", db_name,
            "--username", db_user,
            "--host", db_host,
            "--port", db_port,
            "--slim",
            str(osm_file),
        ]

        style_file = options.get("style")
        if not style_file:
            default_style_path = Path(osm2pgsql_bin).parent / "default.style"
            if default_style_path.exists():
                style_file = str(default_style_path)

        if style_file:
            cmd.extend(["--style", style_file])

        self.stdout.write(f"Executing: {' '.join(cmd)}")

        try:
            res = subprocess.run(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            self.stdout.write(self.style.SUCCESS("osm2pgsql import completed successfully!"))
        except subprocess.CalledProcessError as err:
            self.stderr.write(self.style.ERROR(f"osm2pgsql failed with exit code {err.returncode}:"))
            self.stderr.write(err.stderr or err.stdout)
            return

        # 5. Schema Inspection & Post-Import Spatial Indexing
        self._inspect_and_index_schema()

    def _resolve_osm2pgsql(self, explicit_path: str = None) -> str | None:
        """Find osm2pgsql executable or download official Windows binary."""
        if explicit_path and os.path.exists(explicit_path):
            return explicit_path

        # Check PATH
        which_path = shutil.which("osm2pgsql")
        if which_path:
            return which_path

        # Check common Windows locations
        user_home = Path.home()
        appdata_bin = user_home / ".osm2pgsql" / "bin" / "osm2pgsql.exe"

        common_paths = [
            str(appdata_bin),
            r"C:\Program Files\osm2pgsql\osm2pgsql.exe",
            r"C:\Program Files (x86)\osm2pgsql\osm2pgsql.exe",
            r"C:\Program Files\PostgreSQL\18\bin\osm2pgsql.exe",
            r"C:\osm2pgsql\osm2pgsql.exe",
        ]
        for cp in common_paths:
            if os.path.exists(cp):
                self._ensure_pg_dlls(Path(cp).parent)
                return cp

        # If not found, download to user AppData directory
        target_dir = user_home / ".osm2pgsql" / "bin"
        target_dir.mkdir(parents=True, exist_ok=True)
        target_exe = target_dir / "osm2pgsql.exe"
        if target_exe.exists():
            self._ensure_pg_dlls(target_dir)
            return str(target_exe)

        self.stdout.write("Downloading portable osm2pgsql for Windows...")
        # Official osm2pgsql.org Windows binary hosting
        url = "https://osm2pgsql.org/download/windows/osm2pgsql-latest-x64.zip"
        zip_path = tools_dir / "osm2pgsql.zip"

        try:
            urllib.request.urlretrieve(url, zip_path)
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(tools_dir)
            
            # Locate extracted exe
            for root, dirs, files in os.walk(target_dir):
                if "osm2pgsql.exe" in files:
                    found_exe = os.path.join(root, "osm2pgsql.exe")
                    self._ensure_pg_dlls(Path(found_exe).parent)
                    return found_exe

        except Exception as exc:
            self.stderr.write(f"Automatic download of osm2pgsql failed: {exc}")

        return None

    def _ensure_pg_dlls(self, target_dir: Path):
        """Ensure PostgreSQL 18 runtime DLLs are present alongside osm2pgsql.exe on Windows."""
        if sys.platform != "win32":
            return
        pg_bin = Path(r"C:\Program Files\PostgreSQL\18\bin")
        if not pg_bin.exists():
            return
        for dll in pg_bin.glob("*.dll"):
            dest = target_dir / dll.name
            if not dest.exists():
                try:
                    shutil.copy2(dll, dest)
                except Exception:
                    pass

    def _download_ahmedabad_osm(self, bbox_str: str, target_file: Path) -> bool:
        """Download OSM data for Ahmedabad from BBBike (pre-built city extract)."""
        # BBBike has pre-built city extracts — much more reliable than Overpass for large areas
        bbbike_url = "https://download.bbbike.org/osm/bbbike/Ahmedabad/Ahmedabad.osm.pbf"
        self.stdout.write(f"Downloading Ahmedabad extract from BBBike...")
        self.stdout.write(f"URL: {bbbike_url}")
        self.stdout.write("This may take 1-3 minutes...")

        # Use .osm.pbf extension for BBBike download
        pbf_target = target_file.with_suffix(".osm.pbf")

        try:
            req = urllib.request.Request(
                bbbike_url,
                headers={"User-Agent": "Obrix/1.0 (academic project; github.com/Yash19k/Obrix)"},
            )
            with urllib.request.urlopen(req, timeout=300) as response, open(pbf_target, "wb") as out_file:
                total = 0
                while True:
                    chunk = response.read(65536)
                    if not chunk:
                        break
                    out_file.write(chunk)
                    total += len(chunk)
                    if total % (1024 * 1024) < 65536:
                        self.stdout.write(f"  Downloaded {total / (1024*1024):.1f} MB...")
            self.stdout.write(self.style.SUCCESS(f"Download complete: {total / (1024*1024):.1f} MB → {pbf_target}"))
            # Update the target_file reference to point to the .pbf file
            # We need to return the actual path - caller will need to check
            self._actual_osm_file = pbf_target
            return True
        except Exception as exc:
            self.stderr.write(f"BBBike download failed: {exc}")
            self.stdout.write("Falling back to small Overpass extract...")
            return self._download_overpass_fallback(bbox_str, target_file)

    def _download_overpass_fallback(self, bbox_str: str, target_file: Path) -> bool:
        """Fallback: download a small area from Overpass API."""
        parts = bbox_str.split(",")
        if len(parts) != 4:
            return False

        min_lon, min_lat, max_lon, max_lat = parts
        overpass_bbox = f"{min_lat},{min_lon},{max_lat},{max_lon}"

        query = f"""
[timeout:300][maxsize:536870912][out:xml];
(
  node({overpass_bbox});
  way({overpass_bbox});
  relation({overpass_bbox});
);
out meta;
>;
out meta qt;
"""
        url = "https://overpass-api.de/api/interpreter"
        self.stdout.write(f"Downloading from Overpass API for bbox ({bbox_str})...")

        try:
            data = urllib.parse.urlencode({"data": query}).encode("utf-8")
            req = urllib.request.Request(
                url,
                data=data,
                headers={
                    "User-Agent": "Obrix/1.0 (academic project)",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )
            with urllib.request.urlopen(req, timeout=360) as response, open(target_file, "wb") as out_file:
                total = 0
                while True:
                    chunk = response.read(65536)
                    if not chunk:
                        break
                    out_file.write(chunk)
                    total += len(chunk)
            self.stdout.write(self.style.SUCCESS(f"Overpass download complete: {total / (1024*1024):.1f} MB"))
            self._actual_osm_file = target_file
            return True
        except Exception as exc:
            self.stderr.write(f"Overpass download also failed: {exc}")
            return False



    def _inspect_and_index_schema(self):
        """Inspect generated tables, add spatial/tag indexes, and print schema details."""
        self.stdout.write(self.style.MIGRATE_HEADING("\n--- Post-Import Schema Inspection & Indexing ---"))

        with connection.cursor() as cursor:
            # Query all table names matching planet_osm_% or osm_%
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND (table_name LIKE 'planet_osm_%%' OR table_name LIKE 'osm_%%')
                ORDER BY table_name;
            """)
            tables = [row[0] for row in cursor.fetchall()]

            self.stdout.write(self.style.SUCCESS(f"Discovered {len(tables)} spatial tables in database:"))

            for tbl in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {tbl};")
                count = cursor.fetchone()[0]

                cursor.execute(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = %s;
                """, [tbl])
                cols = cursor.fetchall()
                col_names = [c[0] for c in cols]

                self.stdout.write(f"  • Table: {tbl:<24} Row Count: {count:<8} Columns: {', '.join(col_names[:6])}...")

                # Create Spatial GIST Index on geometry column if present
                geom_col = "way" if "way" in col_names else ("geom" if "geom" in col_names else None)
                if geom_col:
                    idx_name = f"idx_{tbl}_{geom_col}_gist"
                    self.stdout.write(f"    Creating GIST spatial index `{idx_name}` on {tbl}({geom_col})...")
                    try:
                        cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {tbl} USING GIST ({geom_col});")
                    except Exception as e:
                        self.stdout.write(f"    Notice: {e}")

                # Create Tag Indexes on amenity, highway, leisure, landuse if present
                for tag in ["highway", "amenity", "leisure", "landuse"]:
                    if tag in col_names:
                        idx_name = f"idx_{tbl}_{tag}"
                        try:
                            cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {tbl} ({tag}) WHERE {tag} IS NOT NULL;")
                        except Exception as e:
                            pass

            self.stdout.write(self.style.SUCCESS("\nSchema inspection & spatial indexing completed successfully!"))
