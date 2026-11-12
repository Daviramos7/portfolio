"""Turn a raw generated GLB into a web prop: clean, decimate to a triangle budget, UV, real scale, grounded origin.

  blender.sh --background --python clean_asset.py -- --input raw.glb --output prop.glb
      --triangles 6000 --longest 0.17 [--name handgrip] [--rotate-deg 0,0,0]
      [--materials "aluminium=#c3c8cd/1/.38,spring=#141618/1/.5"] [--split island-top | --split-height 0.735]
      [--sharp-deg 40] [--min-island 0.002] [--report prop.json]

Steps, in order: import and join -> merge duplicate vertices, drop degenerate faces, loose vertices and tiny
floating islands -> recalculate outward normals -> collapse-decimate until triangles <= budget -> optional
rotation (Blender axes, degrees) -> uniform scale so the longest side is --longest metres -> origin at the centre
of the base (Blender Z = 0, i.e. Three.js y = 0) -> smooth shading with sharp edges above --sharp-deg ->
Smart UV Project -> export GLB (+Y up, no cameras, lights or animation).

Materials are plain named placeholders (no textures): the site swaps them by name. With two materials, the
second one goes either to the highest connected piece (--split island-top, exact when the generator kept the part
separate; the report lists every piece) or to the faces above F * height (--split-height F, a jagged fallback).
"""
import argparse
import math
import os
import sys

sys.dont_write_bytecode = True  # no __pycache__ beside the versioned scripts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bmesh  # noqa: E402
import bpy  # noqa: E402
from mathutils import Euler, Matrix, Vector  # noqa: E402
import asset_common as common  # noqa: E402


def parse_materials(text):
    """"name=#rrggbb/metallic/roughness,..." -> [(name, (r, g, b), metallic, roughness)] in linear colour."""
    result = []
    for item in filter(None, (part.strip() for part in text.split(","))):
        name, _, spec = item.partition("=")
        fields = (spec or "#b0b0b0").split("/")
        code = fields[0].lstrip("#")
        srgb = [int(code[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        linear = tuple(c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in srgb)
        result.append((name, linear, float(fields[1]) if len(fields) > 1 else 0, float(fields[2]) if len(fields) > 2 else .6))
    return result


def islands(bm):
    seen, groups = set(), []
    for seed in bm.faces:
        if seed.index in seen:
            continue
        group, stack = [], [seed]
        seen.add(seed.index)
        while stack:
            face = stack.pop()
            group.append(face)
            for edge in face.edges:
                for other in edge.link_faces:
                    if other.index not in seen:
                        seen.add(other.index)
                        stack.append(other)
        groups.append(group)
    return groups


def clean(obj, min_island, log):
    mesh = obj.data
    low, high = common.bounds([obj])
    tolerance = (high - low).length * 1e-6
    bm = bmesh.new()
    bm.from_mesh(mesh)
    before = (len(bm.verts), len(bm.faces))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=tolerance)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=tolerance)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.faces.ensure_lookup_table()
    bm.faces.index_update()
    groups = islands(bm)
    limit = max(1, int(len(bm.faces) * min_island))
    small = [face for group in groups if len(group) < limit for face in group]
    if small:
        bmesh.ops.delete(bm, geom=small, context="FACES")
    loose = [vertex for vertex in bm.verts if not vertex.link_faces]
    if loose:
        bmesh.ops.delete(bm, geom=loose, context="VERTS")
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    open_edges = sum(1 for edge in bm.edges if len(edge.link_faces) != 2)
    log["clean"] = {
        "vertices_before": before[0], "faces_before": before[1], "vertices_after": len(bm.verts), "faces_after": len(bm.faces),
        "islands": len(groups), "islands_removed": sum(1 for group in groups if len(group) < limit), "faces_removed_as_islands": len(small),
        "loose_vertices_removed": len(loose), "non_manifold_edges": open_edges, "merge_distance": tolerance,
    }
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()


def decimate(obj, budget, log):
    passes = []
    for _ in range(6):
        current = common.triangle_count([obj])
        if current <= budget:
            break
        modifier = obj.modifiers.new("budget", "DECIMATE")
        modifier.decimate_type = "COLLAPSE"
        ratio = budget / current * (.995 if not passes else .97)
        modifier.ratio = ratio
        modifier.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        passes.append({"from": current, "ratio": round(ratio, 6), "to": common.triangle_count([obj])})
    log["decimate"] = {"budget": budget, "passes": passes, "triangles": common.triangle_count([obj])}
    if log["decimate"]["triangles"] > budget:
        raise SystemExit(f"decimation stopped at {log['decimate']['triangles']} triangles, above the budget {budget}")


def shade(obj, sharp_degrees):
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    limit = math.radians(sharp_degrees)
    sharp = 0
    for face in bm.faces:
        face.smooth = True
    for edge in bm.edges:
        edge.smooth = len(edge.link_faces) == 2 and edge.calc_face_angle(math.pi) < limit
        sharp += not edge.smooth
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    return sharp


def assign_materials(obj, materials, split, split_height):
    mesh = obj.data
    mesh.materials.clear()
    for name, colour, metallic, roughness in materials:
        material = bpy.data.materials.new(name)
        material.use_nodes = True
        shader = material.node_tree.nodes.get("Principled BSDF")
        shader.inputs["Base Color"].default_value = (*colour, 1)
        shader.inputs["Metallic"].default_value = metallic
        shader.inputs["Roughness"].default_value = roughness
        mesh.materials.append(material)
    report = {"mode": "single"}
    low, high = common.bounds([obj])
    height = high.z - low.z
    if len(materials) > 1 and split == "island-top":
        # Connected pieces survive decimation, so a part the generator kept separate (a spring, a strap) can be
        # addressed exactly: the island with the highest centre takes the second material.
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bm.faces.ensure_lookup_table()
        bm.faces.index_update()
        groups = islands(bm)
        described = []
        for group in groups:
            heights = [vertex.co.z for face in group for vertex in face.verts]
            described.append({"faces": len(group), "from": round((min(heights) - low.z) / height, 4), "to": round((max(heights) - low.z) / height, 4),
                              "centre": sum(face.calc_center_median().z for face in group) / len(group), "indices": [face.index for face in group]})
        bm.free()
        top = max(described, key=lambda item: item["centre"])
        for item in described:
            for index in item["indices"]:
                mesh.polygons[index].material_index = 1 if item is top else 0
        report = {"mode": split, "islands": [{key: item[key] for key in ("faces", "from", "to")} | {"second_material": item is top} for item in described]}
        if len(described) < 2:
            raise SystemExit("--split island-top needs at least two connected pieces; use --split-height instead")
    elif len(materials) > 1 and split_height is not None:
        # Cut real edges along the plane first: classifying uncut triangles leaves a sawtooth border.
        cut = low.z + height * split_height
        bm = bmesh.new()
        bm.from_mesh(mesh)
        before = len(bm.faces)
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, cut), plane_no=(0, 0, 1), dist=height * 1e-5)
        bmesh.ops.triangulate(bm, faces=bm.faces)
        for face in bm.faces:
            face.material_index = 1 if face.calc_center_median().z > cut else 0
        report = {"mode": "height", "fraction": split_height, "triangles_added_by_cut": len(bm.faces) - before}
        bm.to_mesh(mesh)
        bm.free()
        mesh.update()
    return report


def unwrap(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.01, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--triangles", type=int, required=True, help="triangle budget (upper bound)")
    parser.add_argument("--longest", type=float, required=True, help="longest side of the bounding box, metres")
    parser.add_argument("--name")
    parser.add_argument("--rotate-deg", default="0,0,0", help="XYZ Euler in Blender axes, applied before grounding")
    parser.add_argument("--materials", default="prop=#b0b0b0/0/.6")
    parser.add_argument("--split", choices=["island-top"], help="second material goes to the highest connected piece")
    parser.add_argument("--split-height", type=float, help="second material goes to faces above this share of the height")
    parser.add_argument("--sharp-deg", type=float, default=40)
    parser.add_argument("--min-island", type=float, default=.002, help="islands below this share of the faces are dropped")
    parser.add_argument("--report")
    args = parser.parse_args(common.script_args())
    name = args.name or os.path.splitext(os.path.basename(args.output))[0]
    log = {"blender": bpy.app.version_string, "arguments": vars(args), "input": common.file_facts(args.input)}

    common.empty_scene()
    obj = common.join(common.import_glb(args.input), name)
    log["raw"] = common.stats([obj])
    clean(obj, args.min_island, log)
    # The height cut adds triangles along the plane afterwards: keep a reserve so the export still fits the budget.
    reserve = int(args.triangles * .05) if args.split_height is not None else 0
    decimate(obj, args.triangles - reserve, log)

    mesh = obj.data
    rotation = Euler([math.radians(float(v)) for v in args.rotate_deg.split(",")], "XYZ").to_matrix().to_4x4()
    mesh.transform(rotation)
    low, high = common.bounds([obj])
    scale = args.longest / max(high - low)
    mesh.transform(Matrix.Scale(scale, 4))
    low, high = common.bounds([obj])
    mesh.transform(Matrix.Translation(Vector((-(low.x + high.x) / 2, -(low.y + high.y) / 2, -low.z))))
    mesh.update()
    log["scale_factor"] = scale

    log["materials"] = assign_materials(obj, parse_materials(args.materials), args.split, args.split_height)
    log["sharp_edges"] = shade(obj, args.sharp_deg)
    unwrap(obj)

    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=args.output, export_format="GLB", use_selection=True, export_yup=True, export_apply=True,
        export_cameras=False, export_lights=False, export_animations=False, export_extras=False,
        export_texcoords=True, export_normals=True, export_materials="EXPORT",
    )
    log["mesh"] = common.stats([obj])
    log["output"] = common.file_facts(args.output)
    if log["mesh"]["triangles"] > args.triangles:
        raise SystemExit(f"exported {log['mesh']['triangles']} triangles, above the budget {args.triangles}")
    if args.report:
        common.write_json(args.report, log)
        print("DRF_REPORT_WRITTEN " + os.path.abspath(args.report))
    summary = log["mesh"]
    print(f"DRF_CLEAN_DONE triangles={summary['triangles']} size_y_up={summary['size_m_y_up_xyz']} bytes={log['output']['bytes']} sha256={log['output']['sha256']}")


main()
