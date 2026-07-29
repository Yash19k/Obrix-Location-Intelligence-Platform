"""
sort_osm.py — Sorts OSM XML file by element type (node -> way -> relation) and ID.
Required by osm2pgsql when input is un-ordered (e.g. from Overpass).
"""
import re
import sys
from pathlib import Path

def sort_osm_file(input_path: Path, output_path: Path):
    print(f"Sorting OSM XML file: {input_path} -> {output_path}")

    header = []
    nodes = {}
    ways = {}
    relations = {}

    current_element = []
    current_type = None
    current_id = 0
    in_osm = False

    def get_id(line):
        m = re.search(r'id=["\'](\d+)["\']', line)
        return int(m.group(1)) if m else 0

    with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            if not in_osm:
                header.append(line)
                if '<osm' in line:
                    in_osm = True
                continue

            if line.strip() == '</osm>':
                continue

            stripped = line.strip()
            if stripped.startswith('<node ') or stripped.startswith('<node>'):
                if stripped.endswith('/>'):
                    nid = get_id(line)
                    if nid not in nodes:
                        nodes[nid] = line
                else:
                    current_type = 'node'
                    current_id = get_id(line)
                    current_element = [line]
            elif stripped.startswith('<way ') or stripped.startswith('<way>'):
                if stripped.endswith('/>'):
                    wid = get_id(line)
                    if wid not in ways:
                        ways[wid] = line
                else:
                    current_type = 'way'
                    current_id = get_id(line)
                    current_element = [line]
            elif stripped.startswith('<relation ') or stripped.startswith('<relation>'):
                if stripped.endswith('/>'):
                    rid = get_id(line)
                    if rid not in relations:
                        relations[rid] = line
                else:
                    current_type = 'relation'
                    current_id = get_id(line)
                    current_element = [line]
            elif current_type:
                current_element.append(line)
                if stripped in ('</node>', '</way>', '</relation>'):
                    block = ''.join(current_element)
                    if current_type == 'node' and current_id not in nodes:
                        nodes[current_id] = block
                    elif current_type == 'way' and current_id not in ways:
                        ways[current_id] = block
                    elif current_type == 'relation' and current_id not in relations:
                        relations[current_id] = block
                    current_type = None
                    current_element = []

    print(f"Loaded {len(nodes)} unique nodes, {len(ways)} unique ways, {len(relations)} unique relations. Sorting by ID...")
    sorted_nodes = [nodes[k] for k in sorted(nodes.keys())]
    sorted_ways = [ways[k] for k in sorted(ways.keys())]
    sorted_relations = [relations[k] for k in sorted(relations.keys())]

    print("Writing sorted & deduplicated file...")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.writelines(header)
        f.writelines(sorted_nodes)
        f.writelines(sorted_ways)
        f.writelines(sorted_relations)
        f.write('</osm>\n')

    print(f"Done! {output_path} ({output_path.stat().st_size / (1024*1024):.2f} MB)")

if __name__ == '__main__':
    inp = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("data/ahmedabad.osm")
    outp = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("data/ahmedabad_sorted.osm")
    sort_osm_file(inp, outp)
