import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Camera } from '@babylonjs/core/Cameras/camera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import '@babylonjs/core/Meshes/instancedMesh';
import { createBakeModels } from './ufo-bake-models';
import { SPRITES } from '../src/ufo-sprite-layout';

export async function bakeAssets() {
  const canvas = document.createElement('canvas');
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: false }, false);
  const results = {};
  function createScene(target = new Vector3(0, 2.2, 1), position = new Vector3(0, 15, -21)) {
    const scene = new Scene(engine); scene.clearColor = new Color4(0, 0, 0, 0);
    const camera = new FreeCamera('bake-camera', position, scene); camera.setTarget(target); camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
    const ambient = new HemisphericLight('light', new Vector3(0, 1, -.4), scene); ambient.intensity = .85; ambient.groundColor = Color3.FromHexString('#46577d');
    const sun = new DirectionalLight('sun', new Vector3(-.4, -1, .5), scene); sun.intensity = .65;
    return { scene, camera, models: createBakeModels(scene) };
  }
  function size(camera, width, height, halfHeight) {
    engine.setSize(width, height, true);
    camera.orthoLeft = -halfHeight * width / height; camera.orthoRight = halfHeight * width / height;
    camera.orthoTop = halfHeight; camera.orthoBottom = -halfHeight;
  }
  try {
    const backdrop = createScene(); backdrop.models.environment();
    for (const [name, width, height, halfHeight] of [['yard-wide', 2500, 1000, 10.2], ['yard-portrait', 900, 3000, 8.3 / .3]]) {
      size(backdrop.camera, width, height, halfHeight); await backdrop.scene.whenReadyAsync(); backdrop.scene.render();
      results[name + '.webp'] = canvas.toDataURL('image/webp', .94);
    }
    backdrop.scene.dispose();
    const atlas = document.createElement('canvas'); atlas.width = SPRITES.width * SPRITES.columns; atlas.height = Math.ceil(SPRITES.total / SPRITES.columns) * SPRITES.height;
    const context = atlas.getContext('2d');
    const sprites = createScene(new Vector3(0, .72, 0), new Vector3(0, 4.02, -6.6));
    size(sprites.camera, SPRITES.width, SPRITES.height, .9);
    function capture(index) {
      sprites.scene.render(); context.drawImage(canvas, (index % SPRITES.columns) * SPRITES.width, Math.floor(index / SPRITES.columns) * SPRITES.height);
    }
    for (let palette = 0; palette < SPRITES.palettes; palette++) {
      const actor = sprites.models.actor(palette);
      await sprites.scene.whenReadyAsync();
      for (let local = 0; local < SPRITES.perPalette; local++) {
        const walk = local < 24, direction = walk ? Math.floor(local / 6) : (local - 24) % 4;
        const phase = walk ? local % 6 / 6 * Math.PI * 2 : 0, hug = local >= 28 && local < 32, lift = local >= 32;
        actor.root.rotation.y = -direction * Math.PI / 2;
        actor.body.position.y = hug ? -.2 : 0; actor.body.scaling.y = hug ? .8 : 1;
        actor.limbs.forEach(({ leg, arm, side }) => { leg.rotation.x = Math.sin(phase) * .8 * side; arm.rotation.x = lift ? -2.1 : hug ? -1.3 : -Math.sin(phase) * .8 * side; arm.rotation.z = lift ? side * .35 : hug ? -side * .45 : side * .05; });
        capture(palette * SPRITES.perPalette + local);
      }
      actor.root.dispose();
    }
    sprites.camera.setTarget(new Vector3(0, 1.15, 0)); sprites.camera.position.set(0, 4.45, -6.6); size(sprites.camera, 128, 160, 1.5);
    const tree = sprites.models.refuge(); await sprites.scene.whenReadyAsync(); capture(SPRITES.tree); tree.dispose();
    sprites.camera.setTarget(new Vector3(0, .92, 0)); sprites.camera.position.set(0, 4.22, -6.6); size(sprites.camera, 128, 160, 1.15);
    const door = sprites.models.door(); await sprites.scene.whenReadyAsync();
    for (let frame = 0; frame < 4; frame++) { door.rotation.y = -frame / 3 * 1.3; capture(SPRITES.door + frame); }
    results['students.webp'] = atlas.toDataURL('image/webp', .96); sprites.scene.dispose();
    return results;
  } finally { engine.dispose(); }
}
