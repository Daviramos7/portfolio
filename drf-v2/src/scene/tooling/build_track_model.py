"""Original DRF Sprint-03. Blender batch authoring, not conversion of TrackCar.
Run blender --background --factory-startup --python this.py -- output.glb review_dir.
No downloaded mesh/texture, external add-on, driver likeness or brand references.
"""
import bpy, math, os, sys
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
output, review = args[0], args[1]
os.makedirs(review, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def material(name, color, metallic, roughness):
    m = bpy.data.materials.new(name); m.diffuse_color = (*color, 1); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value = (*color,1)
    p.inputs['Metallic'].default_value = metallic; p.inputs['Roughness'].default_value = roughness
    return m
ivory=material('ivory',(.82,.86,.83),.35,.28)
wine=material('wine',(.25,.009,.025),.5,.25)
carbon=material('carbon',(.016,.022,.026),.25,.38)
rubber=material('rubber',(.015,.018,.02),0,.83)
alloy=material('alloy',(.37,.44,.47),.85,.26)
parts=[]
def point(p): return (p[0],-p[2],p[1])
def mesh(name, verts, faces, mat):
    data=bpy.data.meshes.new(name); data.from_pydata([point(v) for v in verts],[],faces); data.update()
    obj=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(obj); obj.data.materials.append(mat)
    for f in data.polygons: f.use_smooth=True
    parts.append(obj); return obj
def loft(name, sections, mat, offset=0, sides=32):
    verts=[]; faces=[]
    for z,w,low,high in sections:
        for j in range(sides):
            t=j*2*math.pi/sides; verts.append((offset+w*math.sin(t),(low+high)/2+(high-low)/2*math.cos(t),z))
    for n in range(len(sections)-1):
        for j in range(sides):
            a=n*sides+j; b=n*sides+(j+1)%sides; faces.append((a,b,b+sides,a+sides))
    faces += [tuple(range(sides-1,-1,-1)),tuple((len(sections)-1)*sides+j for j in range(sides))]
    return mesh(name,verts,faces,mat)
def tube(name, points, radius, mat, sides=10):
    verts=[]; faces=[]
    for i,p in enumerate(points):
        tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        axis=tangent.normalized(); basis=axis.cross(Vector((0,1,0)))
        if basis.length<.01: basis=axis.cross(Vector((1,0,0)))
        basis.normalize(); other=axis.cross(basis)
        for j in range(sides):
            q=Vector(p)+radius*(math.cos(j*2*math.pi/sides)*basis+math.sin(j*2*math.pi/sides)*other); verts.append(q)
    for i in range(len(points)-1):
        for j in range(sides):
            a=i*sides+j;b=i*sides+(j+1)%sides;faces.append((a,b,b+sides,a+sides))
    faces.extend([tuple(range(sides-1,-1,-1)),tuple((len(points)-1)*sides+j for j in range(sides))])
    return mesh(name,verts,faces,mat)
def airfoil(name, span, z, y, chord, mat):
    # Curved closed airfoil section, swept tips; not rectangular aero slabs.
    profile=[(0,0),(.08,.028),(.3,.045),(.6,.025),(1,.002),(.6,-.012),(.22,-.018),(.06,-.012)]
    verts=[]
    for x in [-span/2,-span*.38,0,span*.38,span/2]:
        sweep=.12*(abs(x)/(span/2))**2
        for t,h in profile: verts.append((x,y+h+abs(x)*.018,z+t*chord+sweep))
    faces=[]
    for k in range(4):
        for j in range(8): a=k*8+j;b=k*8+(j+1)%8;faces.append((a,b,b+8,a+8))
    faces.extend([tuple(range(7,-1,-1)),tuple(range(32,40))]); return mesh(name,verts,faces,mat)

floor=loft('scalloped-floor',[(-2.22,.58,.10,.135),(-1.7,.77,.10,.135),(-.6,.82,.10,.135),(.7,.72,.10,.135),(1.9,.24,.10,.135)],carbon)
tub=loft('monocoque',[(-1.05,.24,.21,.76),(-.8,.38,.21,.91),(-.4,.42,.21,.94),(0,.36,.22,.84),(.55,.29,.24,.72),(1.1,.21,.24,.53),(1.85,.13,.23,.35),(2.35,.065,.235,.29)],ivory)
# Real recessed cockpit carved in the new monocoque, smooth elliptical opening.
bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=16,location=point((0,.91,-.44)))
cutter=bpy.context.object;cutter.scale=(.31,.5,.4)
cutter.data.materials.append(carbon)
mod=tub.modifiers.new('cockpit-hollow','BOOLEAN');mod.object=cutter;mod.operation='DIFFERENCE';mod.material_mode='TRANSFER'
bpy.context.view_layer.objects.active=tub;bpy.ops.object.modifier_apply(modifier=mod.name);bpy.data.objects.remove(cutter,do_unlink=True)
loft('recessed-seat',[(-.86,.19,.38,.45),(-.48,.25,.35,.40),(-.03,.2,.35,.39)],carbon)
loft('engine-spine',[(-2.2,.1,.24,.43),(-1.8,.22,.23,.69),(-1.3,.28,.24,1.01),(-1.0,.21,.3,1.08),(-.9,.13,.4,1.02)],wine)
for side in [-1,1]:
    loft('sidepod-'+str(side),[(-1.9,.10,.2,.34),(-1.5,.21,.2,.50),(-.9,.28,.21,.64),(-.25,.28,.22,.71),(.32,.21,.26,.68),(.45,.14,.3,.59)],wine,side*.51)
    loft('inlet-'+str(side),[(.453,.12,.36,.59),(.47,.11,.38,.57)],carbon,side*.51)
    tube('cockpit-rim-'+str(side),[(side*.28,.77,-.86),(side*.34,.86,-.62),(side*.32,.86,-.25),(side*.22,.72,.08)],.028,carbon,12)
    for z in [-1.53,1.52]:
        for y,dx in [(.35,.022),(.54,.018)]:
            for end in [-.18,.18]:
                anchor_z=(-1.55 if end<0 else -1.1) if z<0 else (.75 if end<0 else 1.1)
                anchor_y=(.32 if y<.4 else .42) if z<0 else (.32 if y<.4 else .46)
                tube('wishbone',[(side*(.51 if z<0 else (.16 if y<.4 else .155)),anchor_y,anchor_z),(side*.785,y+.025,z)],dx,carbon)
        tube('upright',[(side*.785,.31,z),(side*.785,.57,z)],.027,alloy)
        tube('pushrod',[(side*.79,.38,z),(side*(.48 if z<0 else .16),.52 if z<0 else .57,-1.18 if z<0 else .78)],.018,alloy)
    tube('front-aero-mount',[(side*.16,.32,1.68),(side*.16,.2,2.07)],.026,carbon)
    tube('rear-aero-mount',[(side*.18,.46,-1.93),(side*.18,.99,-2.08)],.028,carbon)
    # Curved slender endplates, closed cross sections.
    loft('rear-endplate',[(-2.19,.027,.83,1.13),(-1.98,.027,.83,1.13),(-1.75,.027,.9,1.09)],ivory,side*.83,12)
    loft('front-endplate',[(1.94,.028,.12,.37),(2.14,.028,.12,.36),(2.39,.026,.19,.34)],wine,side*1.035,12)
tube('roll-hoop',[(-.22,.84,-.92),(-.18,1.18,-.97),(0,1.23,-1),(.18,1.18,-.97),(.22,.84,-.92)],.039,carbon,12)
airfoil('front-main',2.05,1.91,.185,.42,wine);airfoil('front-flap',1.85,1.79,.27,.29,ivory)
airfoil('rear-main',1.68,-2.22,.99,.36,carbon);airfoil('rear-flap',1.60,-2.17,1.075,.26,wine)

# Shared original wheel pair geometry: X axles, closed tire/rim and curved spokes.
def lathe(name, profile, mat, steps=40):
    verts=[];faces=[]
    for x,r in profile:
        for j in range(steps):t=j*2*math.pi/steps;verts.append((x,r*math.sin(t),r*math.cos(t)))
    for n in range(len(profile)-1):
        for j in range(steps):a=n*steps+j;b=n*steps+(j+1)%steps;faces.append((a,b,b+steps,a+steps))
    return mesh(name,verts,faces,mat)
tire=lathe('tire',[(-.14,.23),(-.14,.29),(-.11,.332),(-.07,.34),(.07,.34),(.11,.332),(.14,.29),(.14,.23),(-.14,.23)],rubber)
rim=lathe('rim',[(-.14,.19),(-.14,.23),(-.105,.244),(.105,.244),(.14,.23),(.14,.19),(-.14,.19)],alloy)
wheel_parts=[rim]
for face in [-1,1]:
    wheel_parts.append(lathe('hub',[(face*.12,.001),(face*.12,.045),(face*.153,.045),(face*.153,.001)],alloy,24))
    for j in range(7):
        angle=j*2*math.pi/7
        pts=[(face*.135,math.sin(angle+t)*radius,math.cos(angle+t)*radius) for radius,t in [(.04,0),(.10,.09),(.18,.13),(.225,.04)]]
        wheel_parts.append(tube('swept-spoke',pts,.012,alloy,8))
bpy.ops.object.select_all(action='DESELECT')
for o in wheel_parts:o.select_set(True)
bpy.context.view_layer.objects.active=rim;bpy.ops.object.join();rim=bpy.context.object;rim.name='forged-wheel-face'
for side in [-1,1]:
    for z in [-1.53,1.52]:
        group=bpy.data.objects.new('wheel-'+('front' if z>0 else 'rear')+'-'+('left' if side<0 else 'right'),None);bpy.context.collection.objects.link(group);group.location=point((side*.965,.34,z))
        for original in [tire,rim]:
            duplicate=bpy.data.objects.new(original.name,original.data);bpy.context.collection.objects.link(duplicate);duplicate.parent=group
for o in [tire,rim]:bpy.data.objects.remove(o,do_unlink=True)

# Collapse static authored body meshes by material; wheel linked data remains reusable.
for mat in [ivory,wine,carbon,alloy]:
    candidates=[o for o in bpy.context.scene.objects if o.type=='MESH' and not o.parent and o.data.materials[0]==mat]
    if candidates:
        bpy.ops.object.select_all(action='DESELECT')
        for o in candidates:o.select_set(True)
        bpy.context.view_layer.objects.active=candidates[0];bpy.ops.object.join();bpy.context.object.name='body-'+mat.name
        if mat==carbon:
            bpy.context.object['frontRoots']=[[s*x,y,z] for s in [-1,1] for x,y in [(.16,.32),(.155,.46)] for z in [.75,1.1]]
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=output,export_format='GLB',use_selection=True,export_materials='EXPORT',export_cameras=False,export_lights=False,export_extras=True)

# Review only: three real model views, neutral studio, no application camera changes.
scene=bpy.context.scene;scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1200;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world.color=(.19,.19,.19)
bpy.ops.mesh.primitive_plane_add(size=200);plane=bpy.context.object;plane.data.materials.append(material('review-floor',(.13,.15,.17),0,.8))
for position,power,size in [((3,-4,6),1500,5),((-4,1,4),1100,4),((1,5,5),1400,3)]:
    bpy.ops.object.light_add(type='AREA',location=position);lamp=bpy.context.object;lamp.data.energy=power;lamp.data.shape='DISK';lamp.data.size=size;lamp.rotation_euler=(Vector((0,0,.5))-lamp.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=6.7
for name,location in [('three-quarter',(5,-7,3.3)),('side',(7,0,1.8)),('front',(0,-8,2.2))]:
    cam.location=location;cam.rotation_euler=(Vector((0,0,.56))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=os.path.join(review,name+'.png');bpy.ops.render.render(write_still=True)
print('DRF_ASSET',output,os.path.getsize(output))
