import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { UFO_REFUGES } from '../src/ufo-student-motion';

// Offline-only source models. The game loads baked images instead of this scene.
export function createBakeModels(scene) {
const SHIRTS = ['#ffb550', '#6dd6cf', '#ee8fb0', '#7f9bff', '#b69bf5', '#eff3ff'];
  const materials = new Map();
  function material(color, glow = 0, alpha = 1) {
    const key = `${color}:${glow}:${alpha}`;
    if (materials.has(key)) return materials.get(key);
    const mat = new StandardMaterial(key, scene);
    mat.diffuseColor = Color3.FromHexString(color);
    mat.emissiveColor = mat.diffuseColor.scale(glow);
    mat.specularColor = new Color3(0.08, 0.08, 0.12);
    mat.alpha = alpha;
    materials.set(key, mat);
    return mat;
  }
  function finish(mesh, color, parent, position, scale, glow = 0, alpha = 1) {
    mesh.material = material(color, glow, alpha);
    if (parent) mesh.parent = parent;
    if (position) mesh.position.set(...position);
    if (scale) mesh.scaling.set(...scale);
    mesh.isPickable = false;
    return mesh;
  }
  const box = (name, color, position, scale, parent) => finish(CreateBox(name, { size: 1 }, scene), color, parent, position, scale);
  const sphere = (name, color, position, scale, parent, glow = 0) => finish(CreateSphere(name, { diameter: 1, segments: 8 }, scene), color, parent, position, scale, glow);
  const cylinder = (name, color, position, scale, parent, options = {}) => finish(CreateCylinder(name, { height: 1, diameter: 1, tessellation: 12, ...options }, scene), color, parent, position, scale);


  function environment() {
  // A self-contained low-poly schoolyard: no remote models, fonts or image requests.
  cylinder('island-rock', '#344665', [0, -0.8, 1], [40, 1.6, 28], null, { tessellation: 40 });
  cylinder('grass', '#528f7c', [0, -0.07, 1], [39.8, 0.3, 27.8], null, { tessellation: 40 });
  cylinder('playground', '#91b8a1', [0, 0.1, -0.5], [29.5, 0.08, 18], null, { tessellation: 40 });
  const path = box('walkway', '#d5c5ad', [-3.6, 0.11, 4.3], [4, 0.08, 5.4]);
  path.rotation.y = -0.15;
  const school = new TransformNode('school', scene);
  school.position.set(-4.3, 0.2, 7.5);
  box('school-building', '#c8c3d8', [0, 1.5, 0], [7.8, 3, 2.4], school);
  box('school-roof', '#716487', [0, 3.05, 0], [8.3, 0.3, 2.8], school);
  box('doorway', '#192c43', [0, 0.92, -1.24], [1.3, 1.9, 0.08], school);
  const doorPivot = new TransformNode('door-hinge', scene); doorPivot.parent = school; doorPivot.position.set(-0.58, 0, -1.34);
  const schoolDoor = box('door', '#3e5476', [0.58, 0.92, 0], [1.15, 1.84, 0.08], doorPivot);
  box('door-light', '#f8d98e', [0, 2.15, -1.3], [1.5, 0.15, 0.18], school).material = material('#ffd88a', 0.5);
  for (const x of [-2.7, -1.6, 1.6, 2.7]) for (const y of [0.9, 2.1]) {
    box('window-frame', '#6f7d9a', [x, y, -1.24], [0.81, 0.78, 0.12], school);
    box('warm-window', '#ffe3a0', [x, y, -1.32], [0.63, 0.61, 0.06], school).material = material('#ffe3a0', 0.45);
  }
  cylinder('clock', '#f4f1df', [0, 2.76, -1.31], [0.5, 0.05, 0.5], school).rotation.x = Math.PI / 2;
  box('clock-hand', '#4e5073', [0, 2.8, -1.35], [0.035, 0.14, 0.02], school);
  function tree(x, z, size = 1) {
    const root = new TransformNode('tree', scene); root.position.set(x, 0, z); root.scaling.setAll(size);
    cylinder('trunk', '#685447', [0, 0.8, 0], [0.3, 1.6, 0.3], root);
    sphere('tree-crown', '#397d70', [0, 2.25, 0], [2.2, 2.6, 2.1], root);
    sphere('tree-highlight', '#579780', [-0.4, 2.8, -0.2], [1.5, 1.6, 1.5], root);
    return root;
  }
  [[-11, 4, 1.3], [9.8, 5.7, 1.4], [12, 0, 1], [-11.5, -2, 0.9], [5.8, 8, 1.2]].forEach(args => tree(...args));
  const refugeTrees = UFO_REFUGES.trees.map(({ x, z }) => tree(x, z, 0.72));
  for (let i = 0; i < 19; i++) {
    const x = -11 + i * 1.2;
    box('fence-post', '#d0c8c5', [x, 0.55, 9.1], [0.14, 1.1, 0.14]);
  }
  box('fence-rail', '#b6bac6', [0, 0.72, 9.1], [22, 0.13, 0.13]);
  box('fence-rail', '#b6bac6', [0, 0.3, 9.1], [22, 0.1, 0.1]);
  for (const [x, z] of [[7, 5], [-9, 5]]) {
    cylinder('lamp-post', '#50627c', [x, 1.4, z], [0.12, 2.8, 0.12]);
    sphere('lamp', '#ffe7a0', [x, 2.9, z], [0.44, 0.5, 0.44], null, 0.9);
  }
  for (let i = 0; i < 22; i++) {
    const angle = i * 2.39;
    const x = Math.cos(angle) * (10.5 + i % 3 * 0.5), z = 1 + Math.sin(angle) * 7.5;
    sphere('flower', ['#fff1a7', '#f8b2c8', '#d1c4f1'][i % 3], [x, 0.22, z], [0.16, 0.18, 0.16]);
  }


    refugeTrees.forEach(tree => tree.setEnabled(false));
    schoolDoor.setEnabled(false);
    return { schoolDoor, doorPivot };
  }
  const avatarTemplates = new Map();
  const paint = new StandardMaterial('painted-students', scene);
  paint.diffuseColor = Color3.White(); paint.specularColor = Color3.Black();
  function coloredTemplate(name, parts) {
    for (const part of parts) {
      const color = part.material.diffuseColor, colors = new Float32Array(part.getTotalVertices() * 4);
      for (let i = 0; i < colors.length; i += 4) { colors[i] = color.r; colors[i + 1] = color.g; colors[i + 2] = color.b; colors[i + 3] = 1; }
      part.setVerticesData('color', colors); part.material = paint;
    }
    const merged = Mesh.MergeMeshes(parts, true, true);
    merged.name = name; merged.material = paint; merged.isVisible = false; merged.isPickable = false;
    return merged;
  }
  function templatesFor(index) {
    const shirt = SHIRTS[index % SHIRTS.length], skin = ['#f3c7a0', '#dba77f', '#bc8a66'][index % 3];
    const key = shirt + skin;
    if (!avatarTemplates.has(key)) {
      const bodyParts = [
        box('shirt', shirt, [0, 0.72, 0], [0.44, 0.45, 0.28]),
        sphere('head', skin, [0, 1.13, 0], [0.38, 0.4, 0.35]),
        sphere('hair', '#3a3547', [0, 1.28, 0.04], [0.41, 0.24, 0.37]),
        box('backpack', '#586288', [0, 0.77, 0.23], [0.3, 0.34, 0.15]),
        ...[-0.075, 0.075].map(x => sphere('eye', '#26314a', [x, 1.13, -0.17], [0.037, 0.045, 0.025])),
      ];
      const body = coloredTemplate('body-template', bodyParts);
      const arm = coloredTemplate('arm-template', [
        box('sleeve', shirt, [0, -0.1, 0], [0.13, 0.2, 0.17]),
        sphere('hand', skin, [0, -0.28, 0], [0.13, 0.21, 0.14]),
      ]);
      avatarTemplates.set(key, { body, arm });
    }
    if (!avatarTemplates.has('legs')) avatarTemplates.set('legs', coloredTemplate('leg-template', [
      box('trousers', '#384b74', [0, -0.18, 0], [0.15, 0.36, 0.17]),
      box('shoe', '#f4f3e9', [0, -0.36, -0.035], [0.18, 0.1, 0.25]),
    ]));
    return { ...avatarTemplates.get(key), leg: avatarTemplates.get('legs') };
  }

  function actor(index) {
    const root = new TransformNode('baked-student', scene), templates = templatesFor(index);
    const body = templates.body.createInstance('body'); body.parent = root;
    const limbs = [];
    for (const side of [-1, 1]) {
      const leg = templates.leg.createInstance('leg'); leg.parent = body; leg.position.set(side * .12, .52, 0);
      const arm = templates.arm.createInstance('arm'); arm.parent = body; arm.position.set(side * .28, .91, 0);
      limbs.push({ leg, arm, side });
    }
    return { root, body, limbs };
  }
  function refuge() {
    const root = new TransformNode('baked-tree', scene); root.scaling.setAll(.72);
    cylinder('trunk', '#685447', [0, .8, 0], [.3, 1.6, .3], root);
    sphere('crown', '#397d70', [0, 2.25, 0], [2.2, 2.6, 2.1], root);
    sphere('highlight', '#579780', [-.4, 2.8, -.2], [1.5, 1.6, 1.5], root);
    return root;
  }
  function door() {
    const root = new TransformNode('door', scene); root.position.x = -.58;
    box('door-panel', '#3e5476', [.58, .92, 0], [1.15, 1.84, .08], root);
    return root;
  }
  return { environment, actor, refuge, door };
}

