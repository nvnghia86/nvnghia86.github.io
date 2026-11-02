import { SPRITES, studentDisplayName } from './ufo-sprite-layout';

let atlasPromise;
export function loadUfoAtlas() {
  if (!atlasPromise) atlasPromise = new Promise((resolve, reject) => {
    const image = new Image(); image.onload = () => resolve(image);
    image.onerror = () => { atlasPromise = null; reject(new Error('Could not load UFO sprites')); };
    image.src = `${import.meta.env.BASE_URL}ufo/students.webp`;
  });
  return atlasPromise;
}
function roundBox(context, x, y, width, height, radius) {
  context.beginPath(); context.moveTo(x + radius, y); context.arcTo(x + width, y, x + width, y + height, radius); context.arcTo(x + width, y + height, x, y + height, radius); context.arcTo(x, y + height, x, y, radius); context.arcTo(x, y, x + width, y, radius); context.closePath(); context.fill();
}
export function createSpriteRenderer(canvas, atlas) {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('Canvas 2D unavailable');
  const names = new Map();
  let width = 1, height = 1, ratio = 1, fontSize = 11;
  function label(value, background = '#172c4ef0', foreground = '#fff') {
    const image = document.createElement('canvas'), ctx = image.getContext('2d');
    ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
    const words = String(value).split(/\s+/), lines = []; let line = '';
    for (const word of words) {
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width > 148 && line) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
    const logicalWidth = Math.ceil(Math.max(20, ...lines.map(line => ctx.measureText(line).width)) + 12), logicalHeight = lines.length * (fontSize + 3) + 7;
    image.width = logicalWidth * 2; image.height = logicalHeight * 2;
    ctx.scale(2, 2); ctx.font = `600 ${fontSize}px system-ui, sans-serif`; ctx.fillStyle = background;
    roundBox(ctx, 0, 0, logicalWidth, logicalHeight, 4);
    ctx.fillStyle = foreground; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((line, i) => ctx.fillText(line, logicalWidth / 2, 3 + i * (fontSize + 3)));
    return image;
  }
  function nameFor(student) {
    const key = `${student.studentId}:${student.nickname}`;
    if (!names.has(key)) {
      const image = label(studentDisplayName(student.nickname)); image.dataset.studentId = student.studentId;
      names.set(key, image);
    }
    return names.get(key);
  }
  return {
    resize(nextWidth, nextHeight) {
      width = nextWidth; height = nextHeight; ratio = Math.min(1.5, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const nextFont = width < 600 ? 9 : 11;
      if (fontSize !== nextFont) { fontSize = nextFont; names.clear(); }
    },
    begin() { context.clearRect(0, 0, width, height); },
    sprite(cell, x, feetY, pixelHeight, angle = 0, alpha = 1, anchor = .86) {
      const pixelWidth = pixelHeight * SPRITES.width / SPRITES.height;
      context.save(); context.translate(x, feetY); if (angle) context.rotate(angle); context.globalAlpha = alpha;
      context.drawImage(atlas, cell % SPRITES.columns * SPRITES.width, Math.floor(cell / SPRITES.columns) * SPRITES.height, SPRITES.width, SPRITES.height, -pixelWidth / 2, -pixelHeight * anchor, pixelWidth, pixelHeight);
      context.restore();
    },
    shadow(x, y, scale) { context.fillStyle = '#233e5530'; context.beginPath(); context.ellipse(x, y, scale * .28, scale * .1, 0, 0, Math.PI * 2); context.fill(); },
    name(student, x, y, targeted) {
      const image = nameFor(student), width = image.width / 2, height = image.height / 2;
      if (targeted) { context.fillStyle = '#a5ffe7'; roundBox(context, x - width / 2 - 2, y - height - 2, width + 4, height + 4, 5); }
      context.drawImage(image, x - width / 2, y - height, width, height);
    },
    dispose() { names.clear(); context.clearRect(0, 0, canvas.width, canvas.height); },
  };
}
