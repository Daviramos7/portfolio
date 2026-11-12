"""Render a GLB from four angles into one 2x2 PNG (EEVEE, neutral background) plus a wireframe sheet.

  blender.sh --background --python preview_asset.py -- --input model.glb --output preview.png
      [--tile 768] [--clay] [--wire-max 60000] [--no-wire]

Tiles, left to right, top to bottom: front (camera on Blender -Y = Three.js +Z), three-quarter front right,
right side, three-quarter back left from above. The cameras are orthographic and fit the bounding box, so the
sheet shows shape and proportion, not real size. `--clay` ignores the file's materials.
The wireframe sheet is written next to the output as <name>-wire.png and is skipped above --wire-max triangles
(a raw 500k mesh is a solid black blob and takes minutes).
"""
import argparse
import os
import shutil
import sys
import tempfile

sys.dont_write_bytecode = True  # no __pycache__ beside the versioned scripts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy  # noqa: E402
import numpy as np  # noqa: E402
from mathutils import Vector  # noqa: E402
import asset_common as common  # noqa: E402

VIEWS = [(0, -1, .12), (1, -1, .55), (1, 0, .12), (-1, 1, .9)]


def flat_material(name, colour, metallic=0.0, roughness=.6, emission=False):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*colour, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    if emission:
        shader.inputs["Emission Color"].default_value = (*colour, 1)
        shader.inputs["Emission Strength"].default_value = 1
    return material


def setup_scene(tile):
    scene = bpy.context.scene
    for engine in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    scene.render.resolution_x = scene.render.resolution_y = tile
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.new("neutral")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (.42, .43, .45, 1)
    background.inputs["Strength"].default_value = 1
    scene.world = world
    for name, energy, direction in (("key", 2.1, (.5, -.8, 1)), ("fill", .6, (-.9, .3, .4))):
        light = bpy.data.objects.new(name, bpy.data.lights.new(name, "SUN"))
        light.data.energy = energy
        light.rotation_euler = Vector(direction).to_track_quat("Z", "Y").to_euler()
        scene.collection.objects.link(light)
    camera = bpy.data.objects.new("preview-camera", bpy.data.cameras.new("preview-camera"))
    camera.data.type = "ORTHO"
    scene.collection.objects.link(camera)
    scene.camera = camera
    return scene, camera


def render_sheet(scene, camera, centre, radius, tile, target, folder, tag):
    files = []
    camera.data.ortho_scale = radius * 2.15
    camera.data.clip_start = radius * .01
    camera.data.clip_end = radius * 20
    for index, view in enumerate(VIEWS):
        direction = Vector(view).normalized()
        camera.location = centre + direction * radius * 6
        camera.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
        scene.render.filepath = os.path.join(folder, f"{tag}-{index}.png")
        bpy.ops.render.render(write_still=True)
        files.append(scene.render.filepath)
    sheet = np.zeros((tile * 2, tile * 2, 4), dtype=np.float32)
    for index, path in enumerate(files):
        image = bpy.data.images.load(path)
        pixels = np.empty(tile * tile * 4, dtype=np.float32)
        image.pixels.foreach_get(pixels)
        row, column = divmod(index, 2)
        # Image rows are stored bottom-up: sheet row 0 (top) is the upper half of the array.
        y = tile if row == 0 else 0
        sheet[y:y + tile, column * tile:(column + 1) * tile] = pixels.reshape(tile, tile, 4)
        bpy.data.images.remove(image)
    output = bpy.data.images.new("sheet-" + tag, tile * 2, tile * 2, alpha=False)
    output.pixels.foreach_set(sheet.ravel())
    output.filepath_raw = target
    output.file_format = "PNG"
    output.save()
    bpy.data.images.remove(output)
    print("DRF_PREVIEW_WRITTEN " + os.path.abspath(target))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--tile", type=int, default=768)
    parser.add_argument("--clay", action="store_true")
    parser.add_argument("--no-wire", action="store_true")
    parser.add_argument("--wire-max", type=int, default=60000)
    args = parser.parse_args(common.script_args())

    common.empty_scene()
    meshes = common.import_glb(args.input)
    triangles = common.triangle_count(meshes)
    low, high = common.bounds(meshes)
    centre, radius = (low + high) / 2, (high - low).length / 2
    scene, camera = setup_scene(args.tile)
    clay = flat_material("preview-clay", (.62, .63, .64), 0, .55)
    for obj in meshes:
        if args.clay or not any(slot.material for slot in obj.material_slots):
            obj.data.materials.clear()
            obj.data.materials.append(clay)
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
    folder = tempfile.mkdtemp(prefix="drf-preview-")
    try:
        render_sheet(scene, camera, centre, radius, args.tile, args.output, folder, "shaded")
        if args.no_wire or triangles > args.wire_max:
            print(f"DRF_PREVIEW_WIRE_SKIPPED triangles={triangles} limit={args.wire_max}")
        else:
            ink = flat_material("preview-wire", (.02, .02, .025), 0, 1, emission=True)
            for obj in meshes:
                obj.data.materials.clear()
                obj.data.materials.append(clay)
                cage = obj.copy()
                cage.data = obj.data.copy()
                cage.data.materials.clear()
                cage.data.materials.append(ink)
                scene.collection.objects.link(cage)
                wire = cage.modifiers.new("wire", "WIREFRAME")
                wire.thickness = radius * .0035
                wire.use_replace = True
            root, extension = os.path.splitext(args.output)
            render_sheet(scene, camera, centre, radius, args.tile, root + "-wire" + extension, folder, "wire")
    finally:
        shutil.rmtree(folder, ignore_errors=True)
    print(f"DRF_PREVIEW_DONE triangles={triangles}")


main()
