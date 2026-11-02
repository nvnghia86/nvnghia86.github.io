# UFO assets

The game uses pre-rendered WebP backgrounds and a shared animated sprite atlas.
`ufo-bake-models.js` contains the offline source geometry; it is not imported by the application.
`ufo-bake-assets.js` renders those models once and exports the three images in `public/ufo`.

To regenerate, start Vite and run this in the local browser console:

```js
const { bakeAssets } = await import('/scripts/ufo-bake-assets.js');
const assets = await bakeAssets();
for (const [name, url] of Object.entries(assets)) {
  const link = document.createElement('a');
  link.download = name;
  link.href = url;
  link.click();
}
```

Copy the downloaded images into `public/ufo`. Regeneration is not required during normal builds.
Keep the atlas layout in `src/ufo-sprite-layout.js` synchronized with the generator.
The wide background uses a fixed orthographic half-height of 10.2; the portrait background uses a fixed half-width of 8.3.
The runtime camera and centered `background-size: cover` cropping use these same dimensions.

Student sprites and cached name bitmaps are composited on Canvas 2D; Babylon renders only the UFO and tractor-beam effects.
Navigation runs at 15 Hz and positions are interpolated for display. Student selection and result history remain in `ClassStudentCaller`.
