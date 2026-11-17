"""Model the Davi vinyl figure procedurally (M16 fila 22b, refined in 22d) and export one GLB.

  blender.sh --background --python figure_davi.py -- --output figure.glb [--palette paleta.png] [--report figure.json]

Generic chibi vinyl style: big smooth head, eyes and brows as flat paint (decals with no relief), swept-back wavy
hair as a thin cap plus fourteen tapering locks, a close-cropped beard, a separate moustache and a painted mouth
(strand and grain normal map on a second UV set), black race suit with a
red and white chest band (front and back), gloves, a matte helmet held at the hip and a round base.
Built in units of 1.8 = total height, then scaled to 0.18 m. Blender is Z-up, front is -Y (the exporter turns it
into Y-up / +Z front).

Colour is per part ("material"), stored as cells of a small palette texture: every face's UVs collapse onto the
centre of its colour cell, so the scene's single textured material (easterEggs.ts) shows clean flat colours with
no photo projection. Nearest filtering keeps the cells from bleeding.
"""
import argparse
import hashlib
import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

UNIT_HEIGHT = 1.8
TARGET_HEIGHT = 0.18

# Palette: name -> sRGB hex. Order defines the cell index (4 x 4 cells).
PALETTE = {
    "pele": "#f2cdb0",        # skin
    "cabelo": "#6a4532",      # hair, beard, moustache, brows
    "macacao": "#18181b",     # suit
    "faixa-vermelha": "#c8162c",
    "faixa-branca": "#f1f1ee",
    "luvas": "#2c2c31",       # gloves and boots
    "capacete": "#101012",    # helmet shell (matte black)
    "viseira": "#3f4a5c",     # visor
    "base": "#232325",
    "olho": "#141210",
    "brilho": "#ffffff",      # eye highlight
    "orelha": "#eabd9c",      # ears and nose, a hair darker than the face
    "boca": "#8a4a42",        # mouth line between moustache and beard (fila 22d)
}

# Normal map (fila 22d): second UV set "Fios" (glTF TEXCOORD_1). Left half of the texture = strand grooves that vary
# only along v (hair: u is constant, v follows the comb angle); right half = short grain for beard and moustache
# (v 0..0.75) and a flat band (v 0.75..1) where every other face points.
NM_W, NM_H = 256, 128
NM_FLAT, NM_HAIR, NM_BEARD = 0, 1, 2
NM_STRANDS = 8            # grooves per texture height
NM_HAIR_REPEATS = 2.0     # texture repeats per quarter turn of comb angle (32 grooves across the head)
CELLS = 4
CELL_PX = 16

# Head ellipsoid (units).
HEAD_C = Vector((0.0, 0.0, 1.42))
HEAD_R = Vector((0.43, 0.38, 0.39))


def args_from_cli():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output", required=True)
    p.add_argument("--palette")
    p.add_argument("--report")
    p.add_argument("--max-triangles", type=int, default=15000)
    return p.parse_args(argv)


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


class Builder:
    """Collect parts as (bmesh geometry, colour per face) and merge into one mesh."""

    def __init__(self):
        self.bm = bmesh.new()
        self.col = self.bm.faces.layers.int.new("col")
        self.nm = self.bm.faces.layers.int.new("nm")
        self.names = list(PALETTE)

    def add_bm(self, src, colour, smooth=True, sharp_deg=None, matrix=None, nm=NM_FLAT):
        """Append a bmesh; colour is a palette name or a function(face_centre_world) -> name."""
        if matrix is not None:
            bmesh.ops.transform(src, matrix=matrix, verts=src.verts)
        src.normal_update()
        me = bpy.data.meshes.new("tmp")
        src.to_mesh(me)
        src.free()
        self.add_mesh(me, colour, smooth, sharp_deg, nm)
        bpy.data.meshes.remove(me)

    def add_object(self, obj, colour, smooth=True, sharp_deg=None, nm=NM_FLAT):
        """Append an object with its modifiers applied (curves and solidified shells)."""
        dg = bpy.context.evaluated_depsgraph_get()
        me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
        me.transform(obj.matrix_world)
        self.add_mesh(me, colour, smooth, sharp_deg, nm)
        bpy.data.meshes.remove(me)
        data = obj.data
        bpy.data.objects.remove(obj)
        if isinstance(data, bpy.types.Curve):
            bpy.data.curves.remove(data)
        elif isinstance(data, bpy.types.Mesh):
            bpy.data.meshes.remove(data)

    def add_mesh(self, me, colour, smooth, sharp_deg, nm=NM_FLAT):
        tmp = bmesh.new()
        tmp.from_mesh(me)
        bmesh.ops.triangulate(tmp, faces=tmp.faces[:])
        tmp.normal_update()
        for f in tmp.faces:
            f.smooth = smooth
        if sharp_deg is not None:
            limit = math.radians(sharp_deg)
            for e in tmp.edges:
                if len(e.link_faces) == 2 and e.calc_face_angle(0) > limit:
                    e.smooth = False
        # Copy into the shared bmesh by hand (keeps flags, adds the colour index).
        vmap = {v: self.bm.verts.new(v.co) for v in tmp.verts}
        for f in tmp.faces:
            try:
                nf = self.bm.faces.new([vmap[v] for v in f.verts])
            except ValueError:
                continue
            nf.smooth = f.smooth
            name = colour(f.calc_center_median()) if callable(colour) else colour
            nf[self.col] = self.names.index(name)
            nf[self.nm] = nm
        self.bm.edges.ensure_lookup_table()
        for e in tmp.edges:
            if not e.smooth:
                ne = self.bm.edges.get([vmap[v] for v in e.verts])
                if ne:
                    ne.smooth = False
        tmp.free()


def ellipsoid_bm(centre, radii, seg=32, rings=16):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1.0)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(centre) @ Matrix.Diagonal((*radii, 1.0)), verts=bm.verts)
    return bm


def rounded_box_obj(name, centre, size, bevel, cuts_z=()):
    """Box with exact horizontal cut loops (for colour bands) and a bevel modifier that leaves flat cuts alone."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(centre) @ Matrix.Diagonal((*size, 1.0)), verts=bm.verts)
    for z in cuts_z:
        geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
        bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, z), plane_no=(0, 0, 1))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    mod = obj.modifiers.new("bevel", "BEVEL")
    mod.width = bevel
    mod.segments = 4
    mod.limit_method = "ANGLE"
    mod.angle_limit = math.radians(30)
    return obj


def capsule_bm(a, b, radius, seg=12, rings=8):
    """Cylinder between a and b with half-sphere caps (a squashed UV sphere stretched along the axis)."""
    a, b = Vector(a), Vector(b)
    axis = b - a
    length = axis.length
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=radius)
    for v in bm.verts:  # split the sphere at its equator and pull the halves apart
        v.co.z += length / 2 if v.co.z >= -1e-6 else -length / 2
    rot = axis.normalized().to_track_quat("Z", "Y").to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation((a + b) / 2) @ rot, verts=bm.verts)
    return bm


def head_surface(x, z, front=True):
    """Point and outward normal on the head ellipsoid at a given x, z (front or back face)."""
    u = (x - HEAD_C.x) / HEAD_R.x
    w = (z - HEAD_C.z) / HEAD_R.z
    s = max(1e-6, 1 - u * u - w * w)
    y = (-1 if front else 1) * HEAD_R.y * math.sqrt(s)
    p = Vector((x, y, z))
    n = Vector(((x - HEAD_C.x) / HEAD_R.x ** 2, y / HEAD_R.y ** 2, (z - HEAD_C.z) / HEAD_R.z ** 2)).normalized()
    return p, n


def decal_bm(x, z, rx, rz, tilt=0.0, lift=0.004, seg=20):
    """Flat painted oval sitting on the head surface (lift is 0.4 mm on the real figure: paint, not relief)."""
    p, n = head_surface(x, z)
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, segments=seg, radius=1.0)
    m = Matrix.Diagonal((rx, rz, 1.0, 1.0))
    m = Matrix.Rotation(tilt, 4, "Z") @ m
    rot = n.to_track_quat("Z", "Y").to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation(p) @ rot @ m, verts=bm.verts)
    for v in bm.verts:  # conform to the curved head so long marks (brows) never sink in
        q, qn = head_surface(v.co.x, v.co.z)
        v.co = q + qn * lift
    return bm


def shell_obj(name, bm, thickness, offset=1.0, mirror_x=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    if mirror_x:
        mir = obj.modifiers.new("mirror", "MIRROR")
        mir.use_axis[0] = True
        mir.use_clip = True
        mir.use_mirror_merge = True
        mir.merge_threshold = 0.002
    sol = obj.modifiers.new("solid", "SOLIDIFY")
    sol.thickness = thickness
    sol.offset = offset
    sol.use_even_offset = False
    return obj


def tube_obj(name, points, radii, depth, resolution=2):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = depth
    cu.bevel_resolution = resolution
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for pt, co, r in zip(sp.points, points, radii):
        pt.co = (*co, 1.0)
        pt.radius = r
    obj = bpy.data.objects.new(name, cu)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def build(b):
    # Base: low round plinth.
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=48, radius1=0.56, radius2=0.53, depth=0.1)
    b.add_bm(bm, "base", sharp_deg=35, matrix=Matrix.Translation((0, 0, 0.05)))

    # Legs (suit) and boots (glove colour).
    for sx in (-1, 1):
        b.add_bm(capsule_bm((sx * 0.13, 0.0, 0.2), (sx * 0.135, 0.0, 0.56), 0.11), "macacao")
        boot = ellipsoid_bm(Vector((sx * 0.14, -0.05, 0.165)), (0.12, 0.17, 0.075), seg=20, rings=10)
        b.add_bm(boot, "luvas")

    # Torso with the chest band (white under red), front and back.
    band = {"faixa-vermelha": (0.905, 0.955), "faixa-branca": (0.86, 0.905)}

    def torso_colour(c):
        for name, (lo, hi) in band.items():
            if lo <= c.z <= hi:
                return name
        return "macacao"

    torso = rounded_box_obj("torso", Vector((0, 0, 0.79)), (0.54, 0.38, 0.58), 0.13, cuts_z=(0.86, 0.905, 0.955))
    b.add_object(torso, torso_colour)

    # Neck.
    b.add_bm(capsule_bm((0, 0, 1.04), (0, 0, 1.12), 0.085, seg=16, rings=6), "pele")

    # Arms: figure's right arm hangs (on -X), left arm bent forward holding the helmet at the hip (+X).
    b.add_bm(capsule_bm((-0.3, 0.0, 0.98), (-0.36, -0.02, 0.66), 0.085), "macacao")
    b.add_bm(ellipsoid_bm(Vector((-0.37, -0.03, 0.6)), (0.075, 0.07, 0.08), seg=16, rings=8), "luvas")
    b.add_bm(capsule_bm((0.3, 0.0, 0.98), (0.38, 0.0, 0.74), 0.085), "macacao")
    b.add_bm(capsule_bm((0.38, 0.0, 0.74), (0.38, -0.2, 0.68), 0.08), "macacao")
    b.add_bm(ellipsoid_bm(Vector((0.4, -0.24, 0.66)), (0.07, 0.08, 0.075), seg=16, rings=8), "luvas")

    # Helmet held at the hip, visor facing out (+X), red band around the shell.
    hc = Vector((0.5, -0.06, 0.6))
    hb = ellipsoid_bm(hc, (0.23, 0.24, 0.23), seg=32, rings=16)
    bmesh.ops.bisect_plane(hb, geom=hb.verts[:] + hb.edges[:] + hb.faces[:], plane_co=hc + Vector((0, 0, -0.13)),
                           plane_no=(0, 0, 1), clear_inner=True)
    for z in (0.04, 0.075):
        bmesh.ops.bisect_plane(hb, geom=hb.verts[:] + hb.edges[:] + hb.faces[:], plane_co=hc + Vector((0, 0, z)),
                               plane_no=(0, 0, 1))
    bmesh.ops.contextual_create(hb, geom=[e for e in hb.edges if e.is_boundary])  # close the neck opening

    def helmet_colour(c):
        d = c - hc
        if 0.04 <= d.z <= 0.075:
            return "faixa-vermelha"
        if d.y < -0.1 and -0.09 < d.z < 0.03 and d.x > -0.12:
            return "viseira"
        return "capacete"

    b.add_bm(hb, helmet_colour, sharp_deg=60)

    # Head and painted face.
    b.add_bm(ellipsoid_bm(HEAD_C, HEAD_R, seg=40, rings=20), "pele")
    for sx in (-1, 1):
        ear = ellipsoid_bm(Vector((sx * 0.42, 0.02, 1.4)), (0.05, 0.08, 0.1), seg=16, rings=8)
        b.add_bm(ear, "orelha")
        b.add_bm(decal_bm(sx * 0.16, 1.42, 0.05, 0.06, lift=0.004), "olho")
        b.add_bm(decal_bm(sx * 0.16 - 0.015, 1.442, 0.015, 0.015, lift=0.008, seg=10), "brilho")
        b.add_bm(decal_bm(sx * 0.165, 1.53, 0.075, 0.018, tilt=sx * 0.03, lift=0.005), "cabelo")
    nose_p, nose_n = head_surface(0.0, 1.36)
    b.add_bm(ellipsoid_bm(nose_p - nose_n * 0.012, (0.04, 0.03, 0.032), seg=14, rings=7), "orelha")

    # Mouth: a painted line, visible between the moustache and the beard.
    b.add_bm(decal_bm(0.0, 1.252, 0.052, 0.013, lift=0.004, seg=16), "boca")

    # Hair cap: thin shell under the locks (no scalp shows between them), high at the forehead, low at the nape.
    cap = ellipsoid_bm(HEAD_C, HEAD_R * 1.012, seg=40, rings=20)
    bmesh.ops.bisect_plane(cap, geom=cap.verts[:] + cap.edges[:] + cap.faces[:], plane_co=(0, 0, 1.47),
                           plane_no=Vector((0, 0.55, 1)).normalized(), clear_inner=True)
    # Swell the cap under the quiff with the same bell as the locks: from the front the top is one smooth arc and
    # the locks only ripple on it (no crown of separate bumps).
    for v in cap.verts:
        d = v.co - HEAD_C
        q = Vector((d.x / HEAD_R.x, d.y / HEAD_R.y, d.z / HEAD_R.z)).normalized()
        beta = math.degrees(math.asin(max(-1.0, min(1.0, q.x))))
        phi = math.degrees(math.atan2(q.z, -q.y))
        bell = math.exp(-((phi - 74) / 30) ** 2) * math.exp(-(beta / 36) ** 2)
        v.co = HEAD_C + d * (1 + 0.115 * bell)
    b.add_object(shell_obj("hair-cap", cap, 0.022), "cabelo", nm=NM_HAIR)

    # Fourteen thinner locks, all combed back: thick rounded root at the hairline, tapering to a thin tip.
    # The quiff lift is a smooth bell over the comb angle, so from the front the top reads as one arc (no crown).
    # (comb angle, start, end, lift of the quiff, tube depth); sides start later and end sooner: short and close.
    locks = [(b_, 55 + 0.12 * abs(b_), 200, 0.12, 0.05) for b_ in (-26, -15.5, -5.2, 5.2, 15.5, 26)]
    locks += [(b_, 61, 188, 0.05, 0.045) for b_ in (-49, -37.5, 37.5, 49)]
    locks += [(b_, 70, 168, 0.0, 0.036) for b_ in (-67, -59, 59, 67)]
    R = HEAD_R * 1.035
    for i, (beta_deg, phi0, phi1, quiff, depth) in enumerate(locks):
        pts, radii = [], []
        steps = 18
        for k in range(steps):
            t = k / (steps - 1)
            phi_deg = phi0 + t * (phi1 - phi0)
            phi = math.radians(phi_deg)
            wave = 2.2 * math.sin(math.radians(phi_deg) * 2.4 + i * 1.3)
            beta = math.radians(beta_deg * (1 - 0.12 * t) + wave)
            u = Vector((math.sin(beta), -math.cos(phi) * math.cos(beta), math.sin(phi) * math.cos(beta)))
            bell = math.exp(-((phi_deg - 74) / 26) ** 2) * math.exp(-(beta_deg / 34) ** 2)
            lift = 0.955 + 0.045 * min(1, t * 6) + quiff * bell + 0.008 * math.sin(phi * 3 + i)
            pts.append(HEAD_C + Vector((R.x * u.x, R.y * u.y, R.z * u.z)) * lift)
            root = 0.6 + 0.4 * min(1, t / 0.07)
            radii.append(root * (0.14 + 0.86 * (1 - t) ** 0.75))
        b.add_object(tube_obj(f"lock-{i}", pts, radii, depth), "cabelo", nm=NM_HAIR)

    # Beard: close-cropped shell (2 mm on the 18 cm figure) on the jaw and cheeks, climbing to the sideburns in front
    # of the ears, leaving the mouth and upper lip bare. One symmetric piece (no mirror seam).
    beard = ellipsoid_bm(HEAD_C, HEAD_R * 1.004, seg=60, rings=30)

    def smoothstep(e0, e1, x):
        t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
        return t * t * (3 - 2 * t)

    def in_beard(c):
        ax = abs(c.x)
        top = 1.212 + 0.215 * smoothstep(0.1, 0.4, ax)
        back = -0.045 + 0.2 * smoothstep(1.32, 1.1, c.z)
        return c.z < top and c.y < back

    bmesh.ops.delete(beard, geom=[f for f in beard.faces if not in_beard(f.calc_center_median())], context="FACES")
    bmesh.ops.delete(beard, geom=[v for v in beard.verts if not v.link_faces], context="VERTS")
    # Relax the stair-stepped border into a clean line, keeping it on the head surface.
    for _ in range(8):
        moves = {}
        for v in beard.verts:
            if not v.is_boundary:
                continue
            nb = [e.other_vert(v).co for e in v.link_edges if e.is_boundary]
            if len(nb) == 2:
                moves[v] = v.co * 0.4 + (nb[0] + nb[1]) * 0.3
        for v, co in moves.items():
            d = co - HEAD_C
            k = 1 / math.sqrt((d.x / HEAD_R.x) ** 2 + (d.y / HEAD_R.y) ** 2 + (d.z / HEAD_R.z) ** 2) * 1.004
            v.co = HEAD_C + d * k
    b.add_object(shell_obj("beard", beard, 0.02), "cabelo", nm=NM_BEARD)

    # Moustache: separate thin tube arching under the nose, tapering at the corners, clear of the beard.
    pts, radii = [], []
    for k in range(15):
        t = k / 14
        x = -0.14 + 0.28 * t
        z = 1.302 - 0.04 * (abs(x) / 0.14) ** 1.6
        p, n = head_surface(x, z)
        pts.append(p + n * 0.016)
        radii.append(0.3 + 0.7 * math.sin(math.pi * t) ** 0.6)
    b.add_object(tube_obj("moustache", pts, radii, 0.024), "cabelo", nm=NM_BEARD)


def palette_image(path):
    size = CELLS * CELL_PX
    img = bpy.data.images.new("figure-paleta", size, size, alpha=False)
    px = [0.0] * (size * size * 4)
    for idx, hexcol in enumerate(PALETTE.values()):
        r, g, bl = (srgb_to_linear(c) for c in hex_rgb(hexcol))
        cx, cy = idx % CELLS, idx // CELLS
        for y in range(cy * CELL_PX, (cy + 1) * CELL_PX):
            for x in range(cx * CELL_PX, (cx + 1) * CELL_PX):
                o = (y * size + x) * 4
                px[o:o + 4] = (r, g, bl, 1.0)
    img.pixels = px
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    img.pack()
    return img


def normal_image(path):
    """Tangent-space normal map (see NM_* above), linear data, saved as PNG and packed."""
    import numpy as np
    h = np.zeros((NM_H, NM_W))
    half = NM_W // 2
    v = (np.arange(NM_H) + 0.5) / NM_H
    # Strands: rounded ridges with narrow grooves between them, constant along u.
    ridge = np.abs(np.sin(math.pi * NM_STRANDS * v)) ** 0.6
    h[:, :half] = ridge[:, None] * 1.5
    # Grain: blurred random bumps (a few pixels wide) in the beard band; flat band on top.
    rng = np.random.default_rng(22)
    beard_rows = int(NM_H * 0.75)
    g = rng.random((beard_rows, half))
    for _ in range(3):
        g = (g + np.roll(g, 1, 0) + np.roll(g, -1, 0) + np.roll(g, 1, 1) + np.roll(g, -1, 1)) / 5
    h[:beard_rows, half:] = (g - g.mean()) * 3.5
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) / 2
    dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) / 2
    dx[:, half - 1:half + 1] = 0  # no seam ridge between the halves
    dx[:, -1] = dx[:, 0] = 0
    dy[beard_rows - 1:beard_rows + 1, half:] = 0
    dy[-1, half:] = dy[0, half:] = 0
    n = np.stack([-dx, -dy, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    rgba = np.concatenate([n * 0.5 + 0.5, np.ones((NM_H, NM_W, 1))], -1)
    img = bpy.data.images.new("figure-normal", NM_W, NM_H, alpha=False, is_data=True)
    img.colorspace_settings.name = "Non-Color"
    img.pixels = rgba.astype(np.float32).ravel()  # Blender rows start at the bottom; the map has no up/down
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    img.pack()
    return img


def strand_uv(co, mode):
    """Second UV set: hair follows the comb angle (lines of constant x on the head run forehead to nape)."""
    if mode == NM_HAIR:
        d = co - HEAD_C
        q = Vector((d.x / HEAD_R.x, d.y / HEAD_R.y, d.z / HEAD_R.z)).normalized()
        beta = math.asin(max(-1.0, min(1.0, q.x)))
        return (0.25, beta / (math.pi / 2) * NM_HAIR_REPEATS)
    if mode == NM_BEARD:
        d = co - HEAD_C
        az = math.atan2(d.x, -d.y) / math.pi  # -0.5 .. 0.5 over the front half
        u = 0.5 + min(0.97, max(0.03, az + 0.5)) * 0.5
        v = min(0.72, max(0.02, (co.z - 1.0) / 0.45 * 0.72))
        return (u, v)
    return (0.75, 0.875)


def cell_uv(idx):
    cx, cy = idx % CELLS, idx // CELLS
    return ((cx + 0.5) / CELLS, (cy + 0.5) / CELLS)


def main():
    args = args_from_cli()
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj)
    out_dir = os.path.dirname(os.path.abspath(args.output))
    os.makedirs(out_dir, exist_ok=True)

    b = Builder()
    build(b)
    bm = b.bm
    bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=1e-5)
    uv = bm.loops.layers.uv.new("UVMap")  # first: palette cells (TEXCOORD_0)
    fios = bm.loops.layers.uv.new("Fios")  # second: normal map (TEXCOORD_1), in model units before the final scale
    for f in bm.faces:
        mode = f[b.nm]
        for loop in f.loops:
            loop[fios].uv = strand_uv(loop.vert.co, mode)
    zs = [v.co.z for v in bm.verts]
    s = TARGET_HEIGHT / (max(zs) - min(zs))
    bmesh.ops.transform(bm, matrix=Matrix.Diagonal((s, s, s, 1.0)), verts=bm.verts)
    zmin = min(v.co.z for v in bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0, -zmin), verts=bm.verts)
    per_colour = {}
    for f in bm.faces:
        idx = f[b.col]
        per_colour[b.names[idx]] = per_colour.get(b.names[idx], 0) + 1
        for loop in f.loops:
            loop[uv].uv = cell_uv(idx)
    bm.faces.layers.int.remove(b.col)
    bm.faces.layers.int.remove(b.nm)
    bm.normal_update()
    me = bpy.data.meshes.new("figure")
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new("figure", me)
    bpy.context.scene.collection.objects.link(obj)

    palette_path = args.palette or os.path.join(out_dir, "figure-paleta.png")
    img = palette_image(palette_path)
    mat = bpy.data.materials.new("figure")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = 0.45
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.interpolation = "Closest"
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nimg = normal_image(os.path.join(out_dir, "figure-normal.png"))
    ntex = nt.nodes.new("ShaderNodeTexImage")
    ntex.image = nimg
    ntex.interpolation = "Linear"
    uvn = nt.nodes.new("ShaderNodeUVMap")
    uvn.uv_map = "Fios"
    nmap = nt.nodes.new("ShaderNodeNormalMap")
    nmap.uv_map = "Fios"
    nmap.inputs["Strength"].default_value = 1.0
    nt.links.new(uvn.outputs["UV"], ntex.inputs["Vector"])
    nt.links.new(ntex.outputs["Color"], nmap.inputs["Color"])
    nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    me.materials.append(mat)

    triangles = sum(len(p.vertices) - 2 for p in me.polygons)
    if triangles > args.max_triangles:
        raise SystemExit(f"DRF_FIGURE_OVER_BUDGET triangles={triangles} max={args.max_triangles}")

    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(filepath=args.output, export_format="GLB", use_selection=True, export_yup=True,
                              export_apply=True, export_texcoords=True, export_normals=True,
                              export_materials="EXPORT", export_image_format="AUTO")
    dims = obj.dimensions
    with open(args.output, "rb") as fh:
        data = fh.read()
    report = {
        "blender": bpy.app.version_string,
        "triangles": triangles,
        "vertices_blender": len(me.vertices),
        "triangles_by_colour": dict(sorted(per_colour.items())),
        "size_m_blender_xyz": [round(d, 5) for d in dims],
        "palette": PALETTE,
        "output": {"path": os.path.abspath(args.output), "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()},
    }
    if args.report:
        with open(args.report, "w", encoding="utf-8") as fh:
            json.dump(report, fh, indent=2, ensure_ascii=False)
    print("DRF_FIGURE_DONE " + json.dumps({k: report[k] for k in ("triangles", "size_m_blender_xyz", "output")}))


main()
