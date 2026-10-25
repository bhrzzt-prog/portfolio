"""Refine the existing R7 project in place; keep its source objects editable.

Executed with Blender bpy by Higgsfield 3D Jutsu. No external image input, no
reference-image projection, and no portfolio imagery is baked into the mesh.
"""
import bpy
import math
import random
from mathutils import Vector

rng = random.Random(91025)
scene = bpy.context.scene
scene.frame_set(1)
# Preserve earlier work in the same .blend; hide superseded prototype geometry.
for obj in list(scene.objects):
    if obj.name.startswith('R9_'):
        bpy.data.objects.remove(obj, do_unlink=True)
    elif obj.type == 'MESH' and (obj.name.startswith(('TREE_', 'LIFE_', 'LEAF_', 'GROUND_', 'LANDSCAPE_', 'ROCK_')) or 'nebula' in obj.name.lower()):
        obj.hide_render = True
        obj.hide_viewport = True

collection = bpy.data.collections.get('R9_REFINED_COSMIC_TREE')
if collection is None:
    collection = bpy.data.collections.new('R9_REFINED_COSMIC_TREE')
    scene.collection.children.link(collection)

def material(name, color, metallic, roughness, emission=0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    n = m.node_tree.nodes
    n.clear()
    out = n.new('ShaderNodeOutputMaterial')
    bs = n.new('ShaderNodeBsdfPrincipled')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Metallic'].default_value = metallic
    bs.inputs['Roughness'].default_value = roughness
    if emission:
        bs.inputs['Emission Color'].default_value = (*color, 1)
        bs.inputs['Emission Strength'].default_value = emission
    m.node_tree.links.new(bs.outputs['BSDF'], out.inputs['Surface'])
    return m, bs

bark, bs = material('R9_BARK_charred_aged_bronze', (.11, .085, .061), .42, .38)
noise = bark.node_tree.nodes.new('ShaderNodeTexNoise')
noise.inputs['Scale'].default_value = 14
noise.inputs['Detail'].default_value = 5
tex = bark.node_tree.nodes.new('ShaderNodeTexCoord')
mapping = bark.node_tree.nodes.new('ShaderNodeVectorMath')
mapping.operation = 'MULTIPLY'
mapping.inputs[1].default_value = (3.5, 3.5, .35)
bark.node_tree.links.new(tex.outputs['Generated'], mapping.inputs[0])
bark.node_tree.links.new(mapping.outputs[0], noise.inputs['Vector'])
bump = bark.node_tree.nodes.new('ShaderNodeBump')
bump.inputs['Strength'].default_value = .55
bump.inputs['Distance'].default_value = .14
bark.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
bark.node_tree.links.new(bump.outputs[0], bs.inputs['Normal'])
gold, _ = material('R9_GOLD_living_veins', (.95, .64, .28), .45, .24, 2.2)
twigmat, _ = material('R9_TWIG_antique_gold', (.24, .18, .105), .6, .4)
leafmat, _ = material('R9_LEAF_muted_olive_bronze', (.17, .155, .09), .3, .66, .08)
glintmat, _ = material('R9_GLINT_warm_pollen', (1, .71, .35), .15, .4, 1.6)
rockmat, _ = material('R9_ROCK_wet_obsidian', (.023, .029, .035), .3, .24)
groundmat, _ = material('R9_GROUND_reflective_black', (.018, .022, .028), .78, .17)

class Batch:
    def __init__(self):
        self.v = []
        self.f = []
    def tube(self, points, radii, sides=8, ridge=0):
        start = len(self.v)
        points = [Vector(p) for p in points]
        for i, p in enumerate(points):
            tangent = (points[min(i+1, len(points)-1)]-points[max(0,i-1)]).normalized()
            axis = Vector((0,1,0))
            if abs(tangent.dot(axis)) > .95:
                axis = Vector((1,0,0))
            u = tangent.cross(axis).normalized()
            v = tangent.cross(u).normalized()
            for j in range(sides):
                a = j*math.tau/sides
                r = radii[i]*(1+ridge*math.sin(j*2.7+i*.46))
                self.v.append(tuple(p + r*(math.cos(a)*u+math.sin(a)*v)))
        for i in range(len(points)-1):
            for j in range(sides):
                a=start+i*sides+j
                b=start+i*sides+(j+1)%sides
                self.f.append((a,b,b+sides,a+sides))
        self.f.append(tuple(start+j for j in reversed(range(sides))))
        self.f.append(tuple(start+(len(points)-1)*sides+j for j in range(sides)))
    def leaf(self, p, length, a):
        i=len(self.v)
        u=Vector((math.cos(a),math.sin(a),rng.uniform(-.5,.5)))
        v=Vector((-math.sin(a),math.cos(a),rng.uniform(-.3,.3)))*length*.35
        self.v.extend([tuple(p-u*length*.5),tuple(p+v),tuple(p+u*length*.5),tuple(p-v),tuple(p+Vector((0,0,length*.12)))])
        self.f.extend([(i,i+1,i+4),(i+1,i+2,i+4),(i+2,i+3,i+4),(i+3,i,i+4)])
    def make(self, name, mat):
        mesh=bpy.data.meshes.new(name+'_mesh')
        mesh.from_pydata(self.v, [], self.f)
        mesh.update()
        obj=bpy.data.objects.new(name, mesh)
        collection.objects.link(obj)
        obj.data.materials.append(mat)
        for face in mesh.polygons:
            face.use_smooth=True
        return obj

wood=Batch(); veins=Batch(); fine=Batch(); leaves=Batch(); glints=Batch()

def center(t):
    return Vector((6.4+1.08*math.sin(t*math.tau-.15)-1.7*t*t, .38*math.sin(t*5), 11.2*t))

# Eight contiguous, tapering, ridged growth ribs make a genuinely twisted trunk.
for strand in range(8):
    pts=[]; rr=[]; glow=[]
    for j in range(60):
        t=j/59
        c=center(t)
        a=strand*math.tau/8+t*3.8
        spread=(.65*(1-t)+.14)*(1+.25*math.exp(-t*18))
        p=c+Vector((math.cos(a)*spread, math.sin(a)*spread, 0))
        radius=(.38*(1-t)**.8+.055)*(1+.8*math.exp(-t*18))
        pts.append(p);rr.append(radius)
        glow.append(p+Vector((math.cos(a),math.sin(a),.06))*radius*.96)
    wood.tube(pts,rr,12,.12)
    veins.tube(glow,[.012+.009*(1-j/59) for j in range(60)],5)

# Sculpted spreading roots taper into the island rather than sitting on top.
for k in range(30):
    a=k*math.tau/30+rng.uniform(-.1,.1)
    reach=rng.uniform(2.5,6.3)
    pts=[]
    for j in range(22):
        t=j/21
        angle=a+.22*math.sin(t*4+k)
        pts.append(Vector((6.3+math.cos(angle)*reach*t, math.sin(angle)*reach*t*.55, .08+.8*(1-t)**3+.09*math.sin(t*9+k))))
    wood.tube(pts,[.34*(1-j/21)**1.5+.012 for j in range(22)],9,.13)
    if k%2==0:
        veins.tube([p+Vector((0,0,.035+.28*(1-j/21)**1.5)) for j,p in enumerate(pts)],[.016*(1-j/21)+.005 for j in range(22)],4)

tips=[]
# Long bowed primary limbs establish the wide, asymmetrical crown silhouette.
for k, t0 in enumerate([.53,.58,.63,.69,.73,.80,.85,.89,.94,.98]):
    start=center(t0)
    side=[-1,1,-1,1,1,-1,1,-1,-1,1][k]
    reach=rng.uniform(5.2,9.8)*(1-.25*(t0-.5))
    target=start+Vector((side*reach,rng.uniform(-3.5,4.5),rng.uniform(.4,3.1)))
    droop=rng.uniform(.3,1.1)
    bow=rng.uniform(-.8,.8)
    points=[]
    for j in range(28):
        t=j/27
        p=start.lerp(target,t)
        p.z-=droop*math.sin(t*math.pi)
        p.z+=.22*math.sin(t*math.tau+k)
        p.y+=bow*math.sin(t*math.pi)+.24*math.sin(t*6+k)
        points.append(p)
    thickness=rng.uniform(.28,.43)
    wood.tube(points,[thickness*(1-j/27)**1.15+.018 for j in range(28)],11,.14)
    veins.tube([p+Vector((0,-(.25*(1-j/27)+.02),.025)) for j,p in enumerate(points)],[.014*(1-j/27)+.003 for j in range(28)],4)
    for branch in range(11):
        q=.19+.072*branch+rng.uniform(-.025,.025)
        p=points[int(q*27)]
        end=p+Vector((side*rng.uniform(.55,2.2),rng.uniform(-2.2,2.2),rng.uniform(.5,1.8)))
        branchpts=[p.lerp(end,j/11)+Vector((0,.15*math.sin(j*.5+k),.2*math.sin(j/11*math.pi))) for j in range(12)]
        fine.tube(branchpts,[.075*(1-j/11)+.004 for j in range(12)],6)
        for twig in range(9):
            b=branchpts[2+twig]
            e=b+Vector((rng.uniform(-.8,.8),rng.uniform(-.7,.7),rng.uniform(.35,1.0)))
            fine.tube([b,b.lerp(e,.5)+Vector((0,.06,.08)),e],[.018,.009,.0018],5)
            tips.append(e)
            for leaf in range(22):
                pos=b.lerp(e,rng.uniform(.2,1))+Vector((rng.uniform(-.18,.18),rng.uniform(-.18,.18),rng.uniform(-.1,.1)))
                leaves.leaf(pos,rng.uniform(.17,.32),rng.uniform(0,math.tau))
                if rng.random()<.035:
                    glints.leaf(pos+Vector((0,0,.03)),rng.uniform(.015,.035),rng.uniform(0,math.tau))

# The leader continues into the crown; avoid a visibly cut-off central trunk.
leader_start=center(.88)
leader_points=[leader_start.lerp(Vector((3.3,1.3,15.5)),j/27)+Vector((.45*math.sin(j/27*math.pi),-.3*math.sin(j/27*math.pi),0)) for j in range(28)]
wood.tube(leader_points,[.26*(1-j/27)**1.1+.005 for j in range(28)],12,.12)
trunk=wood.make('R9_TREE_twisted_trunk_roots_primary_limbs',bark)
# Keep the growth ribs editable while merging their contacts into continuous bark.
remesh=trunk.modifiers.new('R9_organic_branch_union','REMESH')
remesh.mode='VOXEL';remesh.voxel_size=.085;remesh.adaptivity=.35;remesh.use_smooth_shade=True
smooth=trunk.modifiers.new('R9_growth_surface_smoothing','SMOOTH')
smooth.factor=.4;smooth.iterations=3
fine.make('R9_TREE_fine_curved_branches_and_twigs',twigmat)
leaves.make('R9_TREE_individual_crown_leaves',leafmat)
veins.make('R9_TREE_independent_luminous_vein_network',gold)
glints.make('R9_TREE_sparse_crown_glints',glintmat)

# One reusable rough mesh, individually deformed at vertex level for rock detail.
rocks=Batch()
# Broad, broken bedrock anchors the roots; fine stones are secondary details.
bedrock=Batch()
radial_steps=6;angular_steps=64
for ring in range(radial_steps):
    t=ring/(radial_steps-1)
    for j in range(angular_steps):
        a=j*math.tau/angular_steps
        radius=t*(1+.11*math.sin(a*7)+.06*math.sin(a*13))
        bedrock.v.append((6.3+math.cos(a)*radius*7.1,math.sin(a)*radius*3.9,.04+.23*(1-t)**2+rng.uniform(-.08,.12)))
for ring in range(radial_steps-1):
    for j in range(angular_steps):
        a=ring*angular_steps+j;b=ring*angular_steps+(j+1)%angular_steps
        bedrock.f.extend([(a,b,b+angular_steps),(a,b+angular_steps,a+angular_steps)])
bedrock.make('R9_LANDSCAPE_broken_bedrock_root_island',rockmat)
for k in range(110):
    a=rng.uniform(0,math.tau);d=rng.random()**.7*7
    cx=6.3+math.cos(a)*d;cy=math.sin(a)*d*.53
    radius=rng.uniform(.15,.85)*(1-.4*d/7)
    h=radius*rng.uniform(.5,1.3)
    points=[]
    for ring in range(3):
        z=[-.14,.16,h][ring]
        for j in range(7):
            angle=j*math.tau/7
            rad=radius*rng.uniform(.6,1.3)*(1 if ring<2 else .4)
            points.append((cx+math.cos(angle)*rad,cy+math.sin(angle)*rad,z+rng.uniform(-.08,.08)))
    off=len(rocks.v);rocks.v.extend(points)
    for ring in range(2):
        for j in range(7):
            rocks.f.append((off+ring*7+j,off+ring*7+(j+1)%7,off+(ring+1)*7+(j+1)%7,off+(ring+1)*7+j))
    rocks.f.append(tuple(off+14+j for j in range(7)))
rock_obj=rocks.make('R9_LANDSCAPE_eroded_obsidian_island',rockmat)
for face in rock_obj.data.polygons:face.use_smooth=False
# Low distant terrain has real depth, not a flat skyline card.
hillmat,_=material('R9_TERRAIN_distant_charcoal',(.008,.012,.017),.04,.94)
hills=Batch()
for row in range(25):
    for j in range(121):
        x=-36+j*.6;y=7+row*.7
        h=.12+(abs(math.sin(x*.43+y*.19)*math.cos(x*.17-y*.23))**2)*1.9
        hills.v.append((x,y,h))
for row in range(24):
    for j in range(120):
        a=row*121+j;hills.f.extend([(a,a+1,a+122),(a,a+122,a+121)])
hills.make('R9_LANDSCAPE_distant_mountain_silhouette',hillmat)
# Two broken shore rocks frame the reflective foreground at different depths.
shore=Batch()
for cx,cy,sx,sy,h in [(-13,-12,4.2,2.1,1.2),(14,-17,5.4,2.5,.8)]:
    offset=len(shore.v)
    for ring in range(4):
        t=ring/3
        for j in range(24):
            a=j*math.tau/24;d=1-t*.72
            shore.v.append((cx+math.cos(a)*sx*d*rng.uniform(.8,1.12),cy+math.sin(a)*sy*d*rng.uniform(.8,1.12),-.2+h*t+rng.uniform(-.12,.12)))
    for ring in range(3):
        for j in range(24):
            a=offset+ring*24+j;b=offset+ring*24+(j+1)%24;shore.f.append((a,b,b+24,a+24))
    shore.f.append(tuple(offset+72+j for j in range(24)))
shore.make('R9_LANDSCAPE_foreground_broken_shore',rockmat)
floor=Batch()
floor.v=[(-70,-70,-.18),(70,-70,-.18),(70,70,-.18),(-70,70,-.18)]
floor.f=[(0,1,2,3)]
floor.make('R9_GROUND_black_reflective_foreground',groundmat)
tracks=Batch()
for k in range(3):
    pts=[]
    for j in range(120):
        a=-.3+j/119*math.pi*1.4
        pts.append((math.cos(a)*(15+k*3)-2,math.sin(a)*(8+k*2)-12,-.14))
    tracks.tube(pts,[.012]*120,5)
tracks.make('R9_GROUND_inlaid_curving_gold_orbits',gold)

# Lower the delivery camera so the root island rests near the reference horizon.
camera=scene.camera
camera.animation_data_clear()
camera.location=(0,-37,8.5)
camera.rotation_euler=(1.4684524536,0,0)
camera.data.type='ORTHO'
camera.data.ortho_scale=37
scene.frame_start=1;scene.frame_end=193;scene.render.fps=24
for frame,dx,dz in [(1,0,0),(49,.22,.045),(97,0,.09),(145,-.22,.045),(193,0,0)]:
    camera.location=(dx,-37,dz+8.5)
    camera.keyframe_insert(data_path='location',frame=frame)
scene.frame_set(1)
scene.render.engine='BLENDER_EEVEE'
scene.render.resolution_x=1672;scene.render.resolution_y=941;scene.render.resolution_percentage=100
scene.world.color=(.015,.018,.025)
for obj in scene.objects:
    if obj.type=='LIGHT' and obj.data.type=='POINT':
        obj.data.shadow_soft_size=max(obj.data.shadow_soft_size,2)
scene['R9_reference_sha256']='a1397aa9fb03a0ac06d48291d0fad08bb7983560eaec2cba5b6ce95f6e56c2d2'
scene['R9_status']='STAGING_REFINEMENT_NOT_OWNER_APPROVED'
scene['R9_portfolio_textures']='EMPTY_IN_BLENDER_REAL_PHOTOS_INSERTED_SEPARATELY_BY_THREEJS'
result={'created':[o.name for o in collection.objects],'trunk_vertices':len(wood.v),'fine_vertices':len(fine.v),'leaf_faces':len(leaves.f),'reference_used_as_texture':False,'original_source_preserved':True,'frame_range':[1,193],'camera_location':list(camera.location)}

# Keep prototype objects editable, outside the active scene and portable export.
archive=bpy.data.collections.get('R7_ARCHIVE_NOT_EXPORTED') or bpy.data.collections.new('R7_ARCHIVE_NOT_EXPORTED')
archive.use_fake_user=True
for obj in list(scene.objects):
    if obj.type=='MESH' and not obj.name.startswith('R9_') and (obj.hide_render or obj.name.startswith('ROCK_')):
        for old_collection in list(obj.users_collection):old_collection.objects.unlink(obj)
        archive.objects.link(obj)
