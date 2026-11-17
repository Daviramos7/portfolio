"""Shared helpers for the DRF headless Blender asset scripts (Blender 5.2, no add-ons).

Run through the wrapper, never by double click:
  /c/Users/davir/drf-ia3d/scripts/blender.sh --background --python <script> -- <args>

Coordinates: Blender is Z-up. glTF/Three.js is Y-up. The importer and exporter convert, so every
"up" in these scripts is Blender Z, and every reported "y_up" triple is what Three.js will see.
"""
import hashlib
import json
import os
import sys

import bpy
from mathutils import Matrix, Vector


def script_args():
    """Arguments after the lone "--" on the Blender command line."""
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


def empty_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def import_glb(path):
    """Import a GLB and return its mesh objects with parents removed and transforms baked into the data."""
    if not os.path.isfile(path):
        raise SystemExit("input not found: " + path)
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if not meshes:
        raise SystemExit("no mesh in " + path)
    bpy.context.view_layer.update()
    for obj in meshes:
        world = obj.matrix_world.copy()
        if obj.data.users > 1:
            obj.data = obj.data.copy()
        obj.parent = None
        obj.data.transform(world)
        obj.matrix_world = Matrix.Identity(4)
    for obj in [o for o in bpy.context.scene.objects if o.type != "MESH"]:
        bpy.data.objects.remove(obj, do_unlink=True)
    return meshes


def join(meshes, name):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = obj.data.name = name
    return obj


def bounds(objects):
    """World-space (min, max) over all vertices of the given mesh objects."""
    low = Vector((float("inf"),) * 3)
    high = Vector((float("-inf"),) * 3)
    for obj in objects:
        for vertex in obj.data.vertices:
            point = obj.matrix_world @ vertex.co
            for axis in range(3):
                low[axis] = min(low[axis], point[axis])
                high[axis] = max(high[axis], point[axis])
    return low, high


def triangle_count(objects):
    total = 0
    for obj in objects:
        obj.data.calc_loop_triangles()
        total += len(obj.data.loop_triangles)
    return total


def stats(objects):
    low, high = bounds(objects)
    size = high - low
    per_material = {}
    for obj in objects:
        obj.data.calc_loop_triangles()
        slots = [slot.material.name if slot.material else "(none)" for slot in obj.material_slots] or ["(none)"]
        for triangle in obj.data.loop_triangles:
            key = slots[min(triangle.material_index, len(slots) - 1)]
            per_material[key] = per_material.get(key, 0) + 1
    return {
        "objects": len(objects),
        "vertices": sum(len(o.data.vertices) for o in objects),
        "triangles": triangle_count(objects),
        "triangles_by_material": per_material,
        "has_uv": all(len(o.data.uv_layers) > 0 for o in objects),
        # Blender axes (Z up) and the same box as Three.js reads it (Y up): x, z, y.
        "size_m_blender_xyz": [round(v, 5) for v in size],
        "size_m_y_up_xyz": [round(size.x, 5), round(size.z, 5), round(size.y, 5)],
        "largest_dimension_m": round(max(size), 5),
        "min_blender_xyz": [round(v, 5) for v in low],
        "max_blender_xyz": [round(v, 5) for v in high],
    }


def file_facts(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return {"path": os.path.abspath(path), "bytes": os.path.getsize(path), "sha256": digest.hexdigest()}


def write_json(path, payload):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=False)
        handle.write("\n")
