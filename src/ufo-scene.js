import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateTorus } from '@babylonjs/core/Meshes/Builders/torusBuilder';
import { CreateDisc } from '@babylonjs/core/Meshes/Builders/discBuilder';
import { createUfoMission, missionFrame } from './ufo-mission';
import { UFO_REFUGES, UFO_TREES, createStudentMotion, stepStudentMotion, resetStudentMotion, resizeStudentMotion, wakeStudentForCapture } from './ufo-student-motion';
import { UFO_ACTOR_SCALE, UFO_YARD, renderScale, createQualityMonitor } from './ufo-render-quality';

import { SPRITES, studentSpriteCell, yardProjection } from './ufo-sprite-layout';
import { loadUfoAtlas, createSpriteRenderer } from './ufo-sprite-renderer';
import { nextUfoBackground, backgroundUrl } from './ufo-backgrounds';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const mix = (a, b, t) => a + (b - a) * t;
const ease = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
const STEP = 1 / 15;

export async function createUfoScene(canvas, { spriteCanvas, onProgress, onComplete, onFailure }) {
  const atlas = await loadUfoAtlas();
  const painter = createSpriteRenderer(spriteCanvas, atlas);
  const engine = new Engine(canvas, false, { stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance', antialias: false }, false);
  try {
  const scene = new Scene(engine); scene.clearColor = new Color4(0, 0, 0, 0); scene.skipPointerMovePicking = true;
  const camera = new FreeCamera('class-camera', new Vector3(0, 15, -21), scene);
  camera.setTarget(new Vector3(0, 2.2, 1)); camera.mode = Camera.ORTHOGRAPHIC_CAMERA; camera.minZ = .1; camera.maxZ = 150;
  const ambient = new HemisphericLight('evening-light', new Vector3(0, 1, -.4), scene); ambient.intensity = .85;
  const moonlight = new DirectionalLight('moonlight', new Vector3(-.4, -1, .5), scene); moonlight.intensity = .65;
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
  const sphere = (name, color, position, scale, parent, glow = 0) => finish(CreateSphere(name, { diameter: 1, segments: 8 }, scene), color, parent, position, scale, glow);


  function mergeByMaterial(meshes, parent) {
    const groups = new Map();
    meshes.forEach(mesh => { const group = groups.get(mesh.material) || []; group.push(mesh); groups.set(mesh.material, group); });
    groups.forEach(group => {
      if (group.length < 2) { if (!parent) group[0].freezeWorldMatrix(); return; }
      const merged = Mesh.MergeMeshes(group, true, true);
      if (!merged) return;
      merged.isPickable = false;
      if (parent) merged.setParent(parent); else merged.freezeWorldMatrix();
    });
  }

  const ufo = new TransformNode('ufo', scene);
  ufo.position.set(0, 6.7, 0);
  sphere('ufo-hull', '#9bace7', [0, 0, 0], [3.7, 0.65, 3.1], ufo);
  sphere('ufo-rim', '#6674b9', [0, -0.12, 0], [4, 0.3, 3.3], ufo);
  sphere('ufo-canopy', '#92e0e0', [0, 0.42, 0], [1.9, 1.2, 1.75], ufo, 0.25);
  sphere('alien-head', '#adf2a5', [0, 0.55, -0.56], [0.6, 0.56, 0.27], ufo, 0.1);
  for (const x of [-0.12, 0.12]) sphere('alien-eye', '#283c54', [x, 0.58, -0.71], [0.12, 0.18, 0.06], ufo);
  const engineRing = finish(CreateTorus('engine-ring', { diameter: 2.5, thickness: 0.12, tessellation: 32 }, scene), '#a5ffe7', ufo, [0, -0.25, 0], null, 0.8);
  const ufoLights = new TransformNode('ufo-lights', scene); ufoLights.parent = ufo;
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2;
    sphere('ufo-light', i % 2 ? '#ffdd8b' : '#a8ffed', [Math.cos(a) * 1.55, -0.06, Math.sin(a) * 1.35], [0.2, 0.14, 0.2], ufoLights, 0.9);
  }
  mergeByMaterial(ufoLights.getChildMeshes(), ufoLights);
  const beam = finish(CreateCylinder('tractor-beam', { height: 1, diameterTop: 0.65, diameterBottom: 3.2, tessellation: 32, cap: 0 }, scene), '#92ffe5', null, [0, 3.2, 0], [1, 6.4, 1], 0.85, 0.18);
  beam.material.backFaceCulling = false; beam.isVisible = false;
  const beamPool = finish(CreateDisc('beam-pool', { radius: 1.75, tessellation: 40 }, scene), '#a0ffe0', null, [0, 0.2, 0], null, 0.8, 0.35);
  beamPool.rotation.x = Math.PI / 2; beamPool.isVisible = false;
  const rings = Array.from({ length: 4 }, (_, i) => {
    const ring = finish(CreateTorus(`beam-ring-${i}`, { diameter: 2.2, thickness: 0.035, tessellation: 24 }, scene), '#aaffeb', null, null, null, 0.8, 0.55);
    ring.isVisible = false; return ring;
  });


  let actors = [], plan = null, elapsed = 0, flightIndex = -1, lastPhase = '', batchOrigin = null, boundX = 9;
  let visible = true, hidden = document.hidden, disposed = false, clock = 0, lastRender = performance.now(), reducedMotion = false;
  let quality = 'auto', pressure = 1, qualityWarmup = 2, viewport, widthRatio = 1, heightRatio = 1, pixelsPerUnit = 1, accumulator = 0, doorOpen = 0, toiletOpen = 0, background = '';
  let theme = '', pendingTheme = null, themeRequest = 0;
  function changeTheme() {
    const chosen = nextUfoBackground(pendingTheme || theme), request = ++themeRequest;
    pendingTheme = chosen;
    const image = new Image();
    image.onload = () => {
      if (disposed || request !== themeRequest) return;
      theme = chosen; pendingTheme = null;
      canvas.parentElement.style.setProperty('--ufo-scenery', `url("${backgroundUrl(theme)}")`);
      canvas.parentElement.dataset.background = theme;
    };
    image.onerror = () => { if (request === themeRequest) pendingTheme = null; };
    image.src = backgroundUrl(chosen);
  }
  const qualityMonitor = createQualityMonitor(), lastUfo = new Vector3(), projected = new Vector3(), projectInput = new Vector3();
  function project(x, y, z) {
    projectInput.set(x, y, z); Vector3.ProjectToRef(projectInput, Matrix.IdentityReadOnly, scene.getTransformMatrix(), viewport, projected);
    return { x: projected.x * widthRatio, y: projected.y * heightRatio };
  }
  function setStudents(students) {
    plan = null; elapsed = 0; accumulator = 0; cancel();
    actors = students.map((student, index) => {
      const angle = index * 2.39996, radius = Math.sqrt((index + .5) / Math.max(1, students.length));
      const position = new Vector3(Math.cos(angle) * boundX * radius, .18, Math.sin(angle) * 5.2 * radius - 1.1);
      return { student, id: student.studentId, palette: index % 6, position, previous: position.clone(), motion: createStudentMotion(index, position), phase: index * 2.1, captured: false, from: null, scale: 1, lift: 0, tilt: 0 };
    });
  }
  function resetActors() {
    for (const actor of actors) {
      resetStudentMotion(actor.motion); actor.captured = false; actor.position.set(actor.motion.x, .18, actor.motion.z);
      actor.previous.copyFrom(actor.position); actor.from = null; actor.scale = 1; actor.lift = 0; actor.tilt = 0;
    }
    accumulator = 0;
  }
  function start(ids, reduce = false) {
    resetActors(); changeTheme(); plan = createUfoMission(ids.filter(id => actors.some(actor => actor.id === id)), reduce);
    elapsed = 0; flightIndex = -1; lastPhase = ''; reducedMotion = reduce; lastUfo.copyFrom(ufo.position);
    if (!plan.winners.length) { plan = null; queueMicrotask(() => { if (!disposed) onComplete(); }); }
  }
  function cancel() { plan = null; beam.isVisible = false; beamPool.isVisible = false; rings.forEach(ring => { ring.isVisible = false; }); }
  function finishFlight() {
    if (!plan) return;
    const winners = plan.winners;
    actors.forEach(actor => { if (winners.includes(actor.id)) actor.captured = true; });
    cancel(); onProgress({ phase: 'complete', captured: winners.length, total: winners.length, targetIds: [] }); onComplete();
  }
  function resize() {
    if (disposed) return;
    const scale = renderScale(canvas.clientWidth, canvas.clientHeight, quality, pressure);
    if (Math.abs(engine.getHardwareScalingLevel() - scale) > .02) engine.setHardwareScalingLevel(scale);
    engine.resize();
    const aspect = Math.max(.2, canvas.clientWidth / Math.max(1, canvas.clientHeight)), projection = yardProjection(aspect);
    camera.orthoLeft = -projection.halfWidth; camera.orthoRight = projection.halfWidth; camera.orthoTop = projection.halfHeight; camera.orthoBottom = -projection.halfHeight;
    const previousBound = boundX; boundX = Math.min(UFO_YARD.maxX, projection.halfWidth * .78); const ratio = boundX / previousBound;
    actors.forEach(actor => { resizeStudentMotion(actor.motion, previousBound, boundX); actor.position.x = actor.from ? actor.position.x * ratio : actor.motion.x; actor.previous.x *= ratio; if (actor.from) actor.from.x *= ratio; });
    ufo.position.x *= ratio; lastUfo.x *= ratio; if (batchOrigin) batchOrigin.x *= ratio;
    viewport = camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
    widthRatio = canvas.clientWidth / engine.getRenderWidth(); heightRatio = canvas.clientHeight / engine.getRenderHeight();
    pixelsPerUnit = canvas.clientHeight / (projection.halfHeight * 2);
    painter.resize(canvas.clientWidth, canvas.clientHeight);
    const nextBackground = projection.portrait ? 'yard-portrait.webp' : 'yard-wide.webp';
    if (nextBackground !== background) { background = nextBackground; canvas.parentElement.style.setProperty('--ufo-backdrop', `url("${import.meta.env.BASE_URL}ufo/${background}")`); }
  }
  resize(); changeTheme(); const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(canvas);

  function render() {
    if (disposed || !visible || hidden || engine.isContextLost) { lastRender = performance.now(); return; }
    const now = performance.now(), frameMs = now - lastRender;
    if (frameMs < (reducedMotion && !plan ? 100 : 32)) return;
    const dt = Math.min(.1, frameMs / 1000); lastRender = now; clock += dt; qualityWarmup -= dt;
    if (quality === 'auto' && qualityWarmup <= 0 && !reducedMotion) { const next = qualityMonitor.sample(frameMs, dt); if (next) { pressure = next; resize(); } }
    let frame = null;
    if (plan) {
      elapsed += dt; frame = missionFrame(plan, elapsed);
      if (frame.phase !== lastPhase || frame.index !== flightIndex) {
        lastPhase = frame.phase; flightIndex = frame.index;
        actors.forEach(actor => { if (frame.captured.includes(actor.id)) actor.captured = true; });
        if (frame.phase === 'capture') {
          const targets = actors.filter(actor => frame.targets.includes(actor.id)); lastUfo.copyFrom(ufo.position);
          targets.forEach(actor => { wakeStudentForCapture(actor.motion); actor.position.set(actor.motion.x, .18, actor.motion.z); actor.previous.copyFrom(actor.position); actor.from = actor.position.clone(); });
          batchOrigin = { x: targets.reduce((sum, actor) => sum + actor.from.x, 0) / targets.length, z: targets.reduce((sum, actor) => sum + actor.from.z, 0) / targets.length };
        }
        onProgress({ phase: frame.phase, captured: frame.captured.length, total: plan.winners.length, targetIds: frame.targets });
      }
      if (frame.phase === 'complete') { finishFlight(); frame = null; }
    }
    if (!frame) {
      ufo.position.x = mix(ufo.position.x, reducedMotion ? 0 : Math.sin(clock * .25) * 4.2, dt * 1.6);
      ufo.position.y = mix(ufo.position.y, 6.8 + (reducedMotion ? 0 : Math.sin(clock * 1.2) * .15), dt * 1.6); ufo.position.z = mix(ufo.position.z, .8, dt * 1.6);
    } else if (frame.phase === 'approach') {
      const t = ease(frame.progress); ufo.position.set(mix(lastUfo.x, 0, t), mix(lastUfo.y, 6.5, t), mix(lastUfo.z, 0, t));
    } else if (frame.phase === 'capture') {
      const t = ease(frame.progress / .32); ufo.position.set(mix(lastUfo.x, batchOrigin.x, t), 6.5 + Math.sin(clock * 2) * .08, mix(lastUfo.z, batchOrigin.z, t));
      const lit = frame.progress > .27 && frame.progress < .97; beam.isVisible = lit; beamPool.isVisible = lit;
      beam.position.set(ufo.position.x, 3.4, ufo.position.z); beamPool.position.set(ufo.position.x, .2, ufo.position.z);
      rings.forEach((ring, i) => { const t = (clock * .8 + i / 4) % 1; ring.isVisible = lit; ring.position.set(ufo.position.x, .3 + t * 5.8, ufo.position.z); ring.scaling.setAll(1 - t * .72); });
    } else if (frame.phase === 'departure') {
      beam.isVisible = false; beamPool.isVisible = false; rings.forEach(ring => { ring.isVisible = false; }); ufo.position.y = 6.5 + ease(frame.progress) * 5; ufo.position.z -= dt * 4;
    }
    ufo.rotation.z = reducedMotion ? 0 : Math.sin(clock * 1.5) * .025; ufoLights.rotation.y += reducedMotion ? 0 : dt * .6;
    const panic = !!frame && frame.phase !== 'departure';
    const targets = frame?.phase === 'capture' ? frame.targets : [];
    const neighbours = actors.filter(actor => !actor.captured && !targets.includes(actor.id)).map(actor => actor.motion);
    if (!reducedMotion) {
      accumulator += dt;
      while (accumulator >= STEP) {
        for (const actor of actors) {
          if (actor.captured || targets.includes(actor.id)) continue;
          actor.previous.set(actor.motion.x, .18, actor.motion.z);
          stepStudentMotion(actor.motion, STEP, { boundX, panic, ufo: ufo.position, neighbours });
        }
        accumulator -= STEP;
      }
    }
    const doorwayInUse = actors.some(actor => !actor.captured && ['enterClass', 'insideClass', 'exitClass'].includes(actor.motion.mode));
    doorOpen = mix(doorOpen, doorwayInUse && !reducedMotion ? 1 : 0, Math.min(1, dt * 7));
    const toiletInUse = actors.some(actor => !actor.captured && ['enterToilet', 'insideToilet', 'exitToilet'].includes(actor.motion.mode));
    toiletOpen = mix(toiletOpen, toiletInUse && !reducedMotion ? 1 : 0, Math.min(1, dt * 7));
    painter.begin();
    const queue = [], blend = accumulator / STEP;
    for (const tree of UFO_TREES) {
      const point = project(tree.x, .18, tree.z);
      queue.push({ ...point, depth: point.y, cell: SPRITES.tree, height: 3 * tree.size / .72 * pixelsPerUnit, anchor: .843 });
    }
    const door = project(-4.3, .2, 6.16);
    queue.push({ ...door, depth: door.y, cell: SPRITES.door + Math.round(doorOpen * 3), height: 2.3 * pixelsPerUnit, anchor: .858 });
    const toilet = project(UFO_REFUGES.toiletDoor.x, .18, 6.05);
    queue.push({ ...toilet, depth: toilet.y, cell: SPRITES.toilet + Math.round(toiletOpen * 3), height: 4.4 * pixelsPerUnit, anchor: .785 });
    for (const actor of actors) {
      if (actor.captured) continue;
      const targeted = targets.includes(actor.id);
      actor.lift = 0; actor.scale = 1; actor.tilt = 0;
      if (targeted) {
        const gather = ease((frame.progress - .2) / .28), lift = ease((frame.progress - .43) / .5);
        actor.position.set(mix(actor.from.x, batchOrigin.x + Math.sin(actor.phase) * .35, gather), .18 + lift * 6.2, mix(actor.from.z, batchOrigin.z + Math.cos(actor.phase) * .35, gather));
        actor.lift = lift; actor.scale = 1 - lift * .6; actor.tilt = Math.sin(clock * 8 + actor.phase) * lift * .14;
      } else if (!reducedMotion) {
        actor.position.set(mix(actor.previous.x, actor.motion.x, blend), .18, mix(actor.previous.z, actor.motion.z, blend));
      }
      if (!targeted && actor.motion.hidden) continue;
      const foot = project(actor.position.x, actor.position.y, actor.position.z), ground = project(actor.position.x, .18, actor.position.z);
      painter.shadow(ground.x, ground.y, pixelsPerUnit * UFO_ACTOR_SCALE * (1 - actor.lift * .7));
      const height = 1.8 * UFO_ACTOR_SCALE * actor.scale * pixelsPerUnit;
      const mode = targeted ? 'lift' : actor.motion.mode === 'hugTree' ? 'hugTree' : reducedMotion || !actor.motion.moving ? 'idle' : 'walk';
      queue.push({ ...foot, depth: ground.y, cell: studentSpriteCell(actor.palette, actor.motion.heading, mode, actor.motion.walkPhase), height, angle: actor.tilt, student: actor.student, targeted });
    }
    queue.sort((a, b) => a.depth - b.depth);
    // Paint both the character and their name before any nearer foliage or building facade.
    // Transparent pixels in the foreground sprite reveal only the uncovered part behind it.
    queue.forEach(item => {
      painter.sprite(item.cell, item.x, item.y, item.height, item.angle || 0, 1, item.anchor || .86);
      if (item.student) painter.name(item.student, item.x, item.y - item.height * .82 - 2, item.targeted);
    });
    scene.render();
  }
  const loop = () => { try { render(); } catch (error) { engine.stopRenderLoop(loop); onFailure(error); } };
  const syncLoop = () => { if (disposed) return; lastRender = performance.now(); if (visible && !hidden) engine.runRenderLoop(loop); else engine.stopRenderLoop(loop); };
  const visibility = () => { hidden = document.hidden; syncLoop(); }; document.addEventListener('visibilitychange', visibility);
  const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncLoop(); }, { rootMargin: '150px' }) : null; intersection?.observe(canvas);
  const contextLost = engine.onContextLostObservable.add(() => onFailure(new Error('WebGL context lost'))); engine.runRenderLoop(loop);
  return {
    setStudents, start, skip: finishFlight, cancel, reset() { cancel(); resetActors(); }, setReducedMotion(value) { reducedMotion = value; },
    setQuality(value) { quality = ['smooth', 'high'].includes(value) ? value : 'auto'; pressure = 1; qualityMonitor.reset(); qualityWarmup = 2; resize(); },
    dispose() { disposed = true; engine.stopRenderLoop(loop); resizeObserver.disconnect(); intersection?.disconnect(); document.removeEventListener('visibilitychange', visibility); engine.onContextLostObservable.remove(contextLost); painter.dispose(); scene.dispose(); engine.dispose(); },
  };
  } catch (error) { painter.dispose(); engine.dispose(); throw error; }
}
