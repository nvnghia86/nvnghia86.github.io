import React, { useRef, useEffect, useCallback } from 'react';
import { HeroCharacter } from '../../data/characters';

export interface HTML5CanvasProps {
  hero: HeroCharacter;
  monster: {
    id: string;
    name: string;
    vietnameseTitle: string;
    element: 'earth' | 'ice' | 'fire' | 'dark';
    maxHp: number;
    color: string;
    avatar: string;
    skillName: string;
  };
  playerHp: number;
  playerMaxHp: number;
  playerShield: number;
  playerEnergy: number;
  monsterHp: number;
  monsterChargePercent: number;
  currentWord: string;
  typedIndex: number;
  combo: number;
  playerAction: 'idle' | 'attack' | 'hurt' | 'heal' | 'victory';
  monsterAction: 'idle' | 'attack' | 'hurt';
  screenShake: boolean;
  onCanvasClick?: () => void;
  // Trigger external projectile spawn callback
  spawnEventRef?: React.MutableRefObject<((char: string, isCrit: boolean) => void) | null>;
  triggerUltimateRef?: React.MutableRefObject<(() => void) | null>;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'square' | 'spark' | 'ember' | 'rune';
  rotation?: number;
  vRot?: number;
  gravity?: number;
}

interface Projectile {
  id: number;
  char: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
  isCrit?: boolean;
}

interface DamagePop {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  color: string;
  isCrit?: boolean;
  scale: number;
}

interface SlashWave {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  angle: number;
  thickness: number;
}

export const HTML5MonsterBattleCanvas: React.FC<HTML5CanvasProps> = ({
  hero,
  monster,
  playerHp,
  playerMaxHp,
  playerShield,
  playerEnergy,
  monsterHp,
  monsterChargePercent,
  currentWord = '',
  typedIndex = 0,
  combo,
  playerAction,
  monsterAction,
  screenShake = false,
  onCanvasClick,
  spawnEventRef,
  triggerUltimateRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulation internal state refs
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const damagePopsRef = useRef<DamagePop[]>([]);
  const slashWavesRef = useRef<SlashWave[]>([]);
  const animFrameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const tickRef = useRef<number>(0);
  const ultActiveTimerRef = useRef<number>(0);
  const shakeIntensityRef = useRef<number>(0);
  const ghostTrailsRef = useRef<{ x: number; y: number; alpha: number; heroId: string }[]>([]);

  // Sound & impact trigger
  const spawnProjectile = useCallback((char: string, isCrit = false) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    const startX = width * 0.22;
    const startY = height * 0.58;
    const targetX = width * 0.76;
    const targetY = height * 0.54;

    const colors: Record<string, string> = {
      warrior: '#38bdf8',
      mage: '#a855f7',
      archer: '#34d399',
      ninja: '#f43f5e',
      cyber: '#06b6d4',
      valkyrie: '#fbbf24',
    };

    projectilesRef.current.push({
      id: Math.random(),
      char,
      x: startX,
      y: startY,
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      speed: 2.8 + Math.random() * 0.5,
      color: colors[hero.id] || '#60a5fa',
      trail: [],
      isCrit,
    });

    // Muzzle flash / hero cast sparks
    for (let i = 0; i < 8; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x: startX + 15,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: colors[hero.id] || '#38bdf8',
        alpha: 1,
        decay: 0.04 + Math.random() * 0.03,
        shape: 'spark',
      });
    }
  }, [hero.id]);

  const triggerUltimate = useCallback(() => {
    ultActiveTimerRef.current = 1.8; // 1.8s ultimate visual sequence
    shakeIntensityRef.current = 18;

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    // Spawn massive multi-slashes
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        slashWavesRef.current.push({
          x: width * 0.75 + (Math.random() - 0.5) * 80,
          y: height * 0.55 + (Math.random() - 0.5) * 80,
          size: 90 + Math.random() * 40,
          color: '#fbbf24',
          alpha: 1,
          angle: (Math.random() - 0.5) * Math.PI,
          thickness: 6,
        });

        // Burst particles
        for (let p = 0; p < 20; p++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 4 + Math.random() * 8;
          particlesRef.current.push({
            x: width * 0.75,
            y: height * 0.55,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            size: 4 + Math.random() * 6,
            color: p % 2 === 0 ? '#f59e0b' : '#38bdf8',
            alpha: 1,
            decay: 0.02 + Math.random() * 0.02,
            shape: 'ember',
            gravity: 0.1,
          });
        }
      }, i * 180);
    }
  }, []);

  // Expose triggers
  useEffect(() => {
    if (spawnEventRef) {
      spawnEventRef.current = spawnProjectile;
    }
    if (triggerUltimateRef) {
      triggerUltimateRef.current = triggerUltimate;
    }
  }, [spawnEventRef, triggerUltimateRef, spawnProjectile, triggerUltimate]);

  // Screen shake sync
  useEffect(() => {
    if (screenShake) {
      shakeIntensityRef.current = 10;
    }
  }, [screenShake]);

  // Handle Hero attack animation trail
  useEffect(() => {
    if (playerAction === 'attack' && canvasRef.current) {
      const width = canvasRef.current.width / (window.devicePixelRatio || 1);
      const height = canvasRef.current.height / (window.devicePixelRatio || 1);
      ghostTrailsRef.current.push({
        x: width * 0.22,
        y: height * 0.62,
        alpha: 0.8,
        heroId: hero.id,
      });
    }
  }, [playerAction, hero.id]);

  // MAIN RENDER LOOP (HTML5 Canvas 60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const resize = () => {
      if (!containerRef.current || !canvas) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientW = containerRef.current.clientWidth || 800;
      const clientH = containerRef.current.clientHeight || 380;
      const targetW = Math.max(rect.width || clientW, 300);
      const targetH = Math.max(rect.height || clientH, 260);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = targetW * dpr;
      canvas.height = targetH * dpr;
      canvas.style.width = `${targetW}px`;
      canvas.style.height = `${targetH}px`;
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Spawn ambient weather particles (snow, ember, pollen, void stars)
    const initAmbientParticles = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      for (let i = 0; i < 35; i++) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.6,
          vy: 0.3 + Math.random() * 0.8,
          size: 2 + Math.random() * 3,
          color:
            monster.element === 'fire'
              ? '#f97316'
              : monster.element === 'ice'
              ? '#bae6fd'
              : monster.element === 'dark'
              ? '#c084fc'
              : '#86efac',
          alpha: 0.2 + Math.random() * 0.6,
          decay: 0, // Continuous ambient
          shape: monster.element === 'fire' ? 'ember' : 'circle',
        });
      }
    };
    initAmbientParticles();

    // Render Function
    const render = (time: number) => {
      if (!isRunning) return;

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;
      tickRef.current += dt;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // --- SCREEN SHAKE OFFSET ---
      if (shakeIntensityRef.current > 0.1) {
        const sx = (Math.random() - 0.5) * shakeIntensityRef.current;
        const sy = (Math.random() - 0.5) * shakeIntensityRef.current;
        ctx.translate(sx, sy);
        shakeIntensityRef.current *= 0.88;
      }

      // --- 1. DYNAMIC PARALLAX SKY & ATMOSPHERE ---
      drawAtmosphere(ctx, width, height, monster.element, tickRef.current);

      // --- 2. 3D CLIFF BATTLE ARENA ---
      drawCliffArena(ctx, width, height, monster.element, tickRef.current);

      // --- 3. RUNIC GLYPHS ON GROUND ---
      drawRunicAuras(ctx, width, height, tickRef.current, hero.id, monster.element, playerAction, monsterAction);

      // --- 4. GHOST AFTER-IMAGES (HERO DASH TRAIL) ---
      drawGhostTrails(ctx, ghostTrailsRef.current, dt);

      // --- 5. RENDER HERO CHARACTER (CANVAS 60FPS) ---
      drawHeroSprite(
        ctx,
        width * 0.22,
        height * 0.62,
        hero,
        playerAction,
        tickRef.current,
        playerEnergy,
        playerHp,
        playerMaxHp
      );

      // --- 6. RENDER MONSTER BOSS (CANVAS 60FPS) ---
      drawMonsterSprite(
        ctx,
        width * 0.76,
        height * 0.60,
        monster,
        monsterAction,
        monsterChargePercent,
        tickRef.current,
        monsterHp,
        monster.maxHp
      );

      // --- 7. PROJECTILES (3D FLYING LETTER CUBES) ---
      updateAndDrawProjectiles(ctx, projectilesRef.current, particlesRef.current, damagePopsRef.current, slashWavesRef.current, dt, width, height);

      // --- 8. SLASH WAVES & ENERGY ARCS ---
      updateAndDrawSlashWaves(ctx, slashWavesRef.current, dt);

      // --- 9. PARTICLES (SPARKS, EMBERS, RUNES, EXPLOSIONS) ---
      updateAndDrawParticles(ctx, particlesRef.current, dt, width, height, monster.element);

      // --- 10. FLOATING DAMAGE & COMBO TEXTS ---
      updateAndDrawDamagePops(ctx, damagePopsRef.current, dt);

      // --- 11. ULTIMATE OVERLAY VISUALS ---
      if (ultActiveTimerRef.current > 0) {
        ultActiveTimerRef.current -= dt;
        drawUltimateEffects(ctx, width, height, ultActiveTimerRef.current, hero);
      }

      // --- 12. CANVAS FLOATING 3D LETTER CARDS (TOP HUD) ---
      drawFloatingLetterTiles(ctx, width, height, currentWord, typedIndex, tickRef.current);

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
    };
  }, [hero, monster, playerAction, monsterAction, currentWord, typedIndex]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[500px] select-none overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-700/60 shadow-2xl bg-slate-950"
      onClick={onCanvasClick}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

// ==========================================
// RENDER HELPERS (HTML5 Canvas 2D Engine)
// ==========================================

function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  element: 'earth' | 'ice' | 'fire' | 'dark',
  t: number
) {
  // Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (element === 'ice') {
    skyGrad.addColorStop(0, '#0c4a6e'); // deep cyan sky
    skyGrad.addColorStop(0.5, '#0284c7');
    skyGrad.addColorStop(1, '#bae6fd');
  } else if (element === 'fire') {
    skyGrad.addColorStop(0, '#450a0a'); // dark magma red
    skyGrad.addColorStop(0.5, '#991b1b');
    skyGrad.addColorStop(0.8, '#ea580c');
    skyGrad.addColorStop(1, '#fdba74');
  } else if (element === 'dark') {
    skyGrad.addColorStop(0, '#0f0728'); // cosmic abyss
    skyGrad.addColorStop(0.5, '#3b0764');
    skyGrad.addColorStop(0.8, '#581c87');
    skyGrad.addColorStop(1, '#1e1b4b');
  } else {
    // Earth / Cliff Blue Sky
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.4, '#38bdf8');
    skyGrad.addColorStop(0.75, '#7dd3fc');
    skyGrad.addColorStop(1, '#e0f2fe');
  }

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Distant Mountain Ridges (Parallax)
  ctx.save();
  ctx.fillStyle =
    element === 'fire'
      ? 'rgba(69, 10, 10, 0.6)'
      : element === 'ice'
      ? 'rgba(12, 74, 110, 0.4)'
      : element === 'dark'
      ? 'rgba(15, 7, 40, 0.7)'
      : 'rgba(3, 105, 161, 0.45)';

  ctx.beginPath();
  ctx.moveTo(0, h * 0.65);
  ctx.lineTo(w * 0.15, h * 0.48);
  ctx.lineTo(w * 0.35, h * 0.58);
  ctx.lineTo(w * 0.55, h * 0.44);
  ctx.lineTo(w * 0.75, h * 0.56);
  ctx.lineTo(w * 0.9, h * 0.46);
  ctx.lineTo(w, h * 0.6);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Floating Clouds with dynamic drift
  const cloudOffset1 = (t * 12) % (w + 200);
  const cloudOffset2 = (t * 8 + 300) % (w + 250);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  drawSoftCloud(ctx, cloudOffset1 - 100, h * 0.28, 120, 35);
  drawSoftCloud(ctx, cloudOffset2 - 120, h * 0.18, 160, 45);

  ctx.restore();
}

function drawSoftCloud(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
  ctx.ellipse(x - w * 0.25, y + h * 0.1, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.25, y + h * 0.1, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCliffArena(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  element: 'earth' | 'ice' | 'fire' | 'dark',
  t: number
) {
  ctx.save();

  const cliffY = h * 0.64;

  // Cliff Shadow / Deep Base
  const baseGrad = ctx.createLinearGradient(0, cliffY, 0, h);
  if (element === 'fire') {
    baseGrad.addColorStop(0, '#292524');
    baseGrad.addColorStop(0.5, '#1c1917');
    baseGrad.addColorStop(1, '#0c0a09');
  } else if (element === 'ice') {
    baseGrad.addColorStop(0, '#0f172a');
    baseGrad.addColorStop(0.5, '#0284c7');
    baseGrad.addColorStop(1, '#082f49');
  } else if (element === 'dark') {
    baseGrad.addColorStop(0, '#1e1b4b');
    baseGrad.addColorStop(0.5, '#090514');
    baseGrad.addColorStop(1, '#020108');
  } else {
    baseGrad.addColorStop(0, '#334155');
    baseGrad.addColorStop(0.5, '#1e293b');
    baseGrad.addColorStop(1, '#0f172a');
  }

  // Draw 3D Craggy Platform Edge
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.moveTo(0, cliffY + 20);
  ctx.lineTo(w * 0.08, cliffY + 14);
  ctx.lineTo(w * 0.22, cliffY + 16);
  ctx.lineTo(w * 0.38, cliffY + 12);
  ctx.lineTo(w * 0.52, cliffY + 18);
  ctx.lineTo(w * 0.72, cliffY + 14);
  ctx.lineTo(w * 0.88, cliffY + 16);
  ctx.lineTo(w, cliffY + 22);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  // Top Surface (Grass / Snow / Lava Crust / Crystal)
  const topGrad = ctx.createLinearGradient(0, cliffY - 15, 0, cliffY + 20);
  if (element === 'fire') {
    topGrad.addColorStop(0, '#78350f');
    topGrad.addColorStop(0.7, '#451a03');
    topGrad.addColorStop(1, '#1c1917');
  } else if (element === 'ice') {
    topGrad.addColorStop(0, '#e0f2fe');
    topGrad.addColorStop(0.6, '#7dd3fc');
    topGrad.addColorStop(1, '#0369a1');
  } else if (element === 'dark') {
    topGrad.addColorStop(0, '#6b21a8');
    topGrad.addColorStop(0.7, '#3b0764');
    topGrad.addColorStop(1, '#1e1b4b');
  } else {
    topGrad.addColorStop(0, '#4ade80'); // lush mountain grass
    topGrad.addColorStop(0.4, '#16a34a');
    topGrad.addColorStop(1, '#334155');
  }

  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, cliffY + 6, w * 0.54, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlight Rim
  ctx.strokeStyle =
    element === 'fire'
      ? '#fb923c'
      : element === 'ice'
      ? '#bae6fd'
      : element === 'dark'
      ? '#d8b4fe'
      : '#86efac';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, cliffY + 4, w * 0.53, 23, 0, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}

function drawRunicAuras(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  heroId: string,
  element: string,
  playerAction: string,
  monsterAction: string
) {
  ctx.save();
  const heroX = w * 0.22;
  const heroY = h * 0.65;
  const bossX = w * 0.76;
  const bossY = h * 0.64;

  // Hero Underfoot Runic Circle
  const heroRuneColor = playerAction === 'attack' ? 'rgba(56, 189, 248, 0.7)' : 'rgba(56, 189, 248, 0.35)';
  ctx.strokeStyle = heroRuneColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(heroX, heroY, 44 + Math.sin(t * 4) * 3, 16, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Boss Underfoot Elemental Pool
  const bossRuneColor =
    monsterAction === 'attack'
      ? 'rgba(239, 68, 68, 0.8)'
      : element === 'fire'
      ? 'rgba(249, 115, 22, 0.5)'
      : element === 'ice'
      ? 'rgba(56, 189, 248, 0.5)'
      : element === 'dark'
      ? 'rgba(168, 85, 247, 0.6)'
      : 'rgba(34, 197, 94, 0.5)';

  ctx.strokeStyle = bossRuneColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(bossX, bossY, 65 + Math.cos(t * 3) * 4, 22, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawGhostTrails(
  ctx: CanvasRenderingContext2D,
  trails: { x: number; y: number; alpha: number; heroId: string }[],
  dt: number
) {
  ctx.save();
  for (let i = trails.length - 1; i >= 0; i--) {
    const tr = trails[i];
    tr.alpha -= dt * 2.5;
    if (tr.alpha <= 0) {
      trails.splice(i, 1);
      continue;
    }

    ctx.fillStyle = `rgba(56, 189, 248, ${tr.alpha * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(tr.x - 20, tr.y - 30, 22, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ----------------------------------------------------
// HERO SPRITE CANVAS RENDERING (60 FPS Procedural Rig)
// ----------------------------------------------------
function drawHeroSprite(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  hero: HeroCharacter,
  action: 'idle' | 'attack' | 'hurt' | 'heal' | 'victory',
  t: number,
  energy: number,
  playerHp = 100,
  playerMaxHp = 100
) {
  ctx.save();

  let x = baseX;
  let y = baseY;
  let scale = 1;
  let angle = 0;

  // Breathing / Action offsets
  if (action === 'attack') {
    x += 35;
    y -= 5;
    scale = 1.15;
    angle = 0.08;
  } else if (action === 'hurt') {
    x -= 20;
    y += 4;
    scale = 0.95;
    angle = -0.15;
  } else if (action === 'victory') {
    y -= 18 + Math.abs(Math.sin(t * 6)) * 14;
    scale = 1.1;
  } else {
    // Idle gentle sway
    y += Math.sin(t * 3.5) * 3;
  }

  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  // Aura for 100% Ultimate energy
  if (energy >= 100) {
    ctx.save();
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.5 + Math.sin(t * 8) * 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, -35, 48 + Math.sin(t * 6) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Shadow under hero
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 5, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw Cape / Back hair
  ctx.fillStyle = hero.id === 'warrior' ? '#dc2626' : hero.id === 'mage' ? '#7e22ce' : '#059669';
  ctx.beginPath();
  const capeWave = Math.sin(t * 4) * 8;
  ctx.moveTo(-12, -45);
  ctx.quadraticCurveTo(-26 + capeWave, -20, -18 + capeWave, 0);
  ctx.lineTo(-4, 0);
  ctx.closePath();
  ctx.fill();

  // Draw Body / Armor
  const armorColor =
    hero.id === 'warrior'
      ? '#3b82f6'
      : hero.id === 'mage'
      ? '#9333ea'
      : hero.id === 'ninja'
      ? '#1e293b'
      : hero.id === 'cyber'
      ? '#0891b2'
      : hero.id === 'valkyrie'
      ? '#eab308'
      : '#10b981';

  ctx.fillStyle = armorColor;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-14, -50, 28, 38, 8) : ctx.rect(-14, -50, 28, 38);
  ctx.fill();

  // Gold Chest Trim / Emblem
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(0, -34, 6, 0, Math.PI * 2);
  ctx.fill();

  // Head / Helmet
  ctx.fillStyle = '#fde047'; // Hair or Helmet
  ctx.beginPath();
  ctx.arc(0, -62, 16, 0, Math.PI * 2);
  ctx.fill();

  // Face skin
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(3, -61, 10, 0, Math.PI * 2);
  ctx.fill();

  // Hero Eye (Determined warrior)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(7, -62, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Weapon in Hand (Swings when attacking!)
  ctx.save();
  const weaponArmAngle = action === 'attack' ? -Math.PI * 0.4 + Math.sin(t * 20) * 0.3 : Math.sin(t * 3.5) * 0.15;
  ctx.translate(14, -36);
  ctx.rotate(weaponArmAngle);

  // Weapon Blade
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-2, -45, 6, 45);
  ctx.strokeRect(-2, -45, 6, 45);

  // Guard & Hilt
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-8, 0, 18, 5);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-1, 5, 4, 12);

  // Glowing Blade Edge
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(1, -45);
  ctx.lineTo(1, 0);
  ctx.stroke();

  ctx.restore();

  // Overhead Floating Player HP Bar
  const hpPercent = Math.max(0, Math.min(1, (playerHp || 100) / (playerMaxHp || 100)));
  const barWidth = 70;
  const barHeight = 6;
  const barY = -92;

  // Bar Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);
  ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);

  // HP Green Fill
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(-barWidth / 2 + 1, barY + 1, (barWidth - 2) * hpPercent, barHeight - 2);

  // Energy Sub-bar
  if (energy !== undefined) {
    const energyPercent = Math.max(0, Math.min(1, energy / 100));
    ctx.fillStyle = energy >= 100 ? '#f59e0b' : '#38bdf8';
    ctx.fillRect(-barWidth / 2, barY + barHeight + 2, barWidth * energyPercent, 3);
  }

  // Hero Name Badge below
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText(hero.name, 0, 22);

  ctx.restore();
}

// ----------------------------------------------------
// MONSTER BOSS SPRITE CANVAS RENDERING (60 FPS Procedural)
// ----------------------------------------------------
function drawMonsterSprite(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  monster: {
    id: string;
    name: string;
    vietnameseTitle: string;
    element: string;
    avatar: string;
  },
  action: 'idle' | 'attack' | 'hurt',
  chargePercent: number,
  t: number,
  monsterHp = 500,
  maxHp = 500
) {
  ctx.save();

  let x = baseX;
  let y = baseY;
  let scale = 1.3;
  let hurtFlash = false;

  if (action === 'attack') {
    x -= 28;
    scale = 1.45;
  } else if (action === 'hurt') {
    x += 16;
    scale = 1.2;
    hurtFlash = true;
  } else {
    y += Math.cos(t * 3) * 4;
  }

  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Shadow under Monster
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 48, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hurt Red / White Flashing Aura
  if (hurtFlash) {
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.beginPath();
    ctx.arc(0, -45, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Boss Custom Visuals depending on ID ---
  if (monster.id === 'cliff_yeti') {
    drawYetiBoss(ctx, t, action);
  } else if (monster.id === 'frost_wyvern') {
    drawWyvernBoss(ctx, t, action);
  } else if (monster.id === 'magma_golem') {
    drawMagmaBoss(ctx, t, action);
  } else if (monster.id === 'demon_king') {
    drawVoidBoss(ctx, t, action);
  } else {
    // Goblin Boss
    drawGoblinBoss(ctx, t, action);
  }

  // Spell Charge Ring around Boss Head
  if (chargePercent > 0) {
    ctx.strokeStyle = `rgba(239, 68, 68, ${0.4 + (chargePercent / 100) * 0.6})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, -95, 24, -Math.PI * 0.5, -Math.PI * 0.5 + (Math.PI * 2 * chargePercent) / 100);
    ctx.stroke();
  }

  // Overhead Floating Boss HP Bar
  const bossHpPercent = Math.max(0, Math.min(1, monsterHp / (maxHp || 1)));
  const bossBarWidth = 90;
  const bossBarHeight = 7;
  const bossBarY = -120;

  // Boss Bar Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.fillRect(-bossBarWidth / 2, bossBarY, bossBarWidth, bossBarHeight);
  ctx.strokeRect(-bossBarWidth / 2, bossBarY, bossBarWidth, bossBarHeight);

  // Boss HP Gradient Fill
  const bossHpGrad = ctx.createLinearGradient(-bossBarWidth / 2, 0, bossBarWidth / 2, 0);
  bossHpGrad.addColorStop(0, '#dc2626');
  bossHpGrad.addColorStop(0.5, '#ea580c');
  bossHpGrad.addColorStop(1, '#f59e0b');
  ctx.fillStyle = bossHpGrad;
  ctx.fillRect(-bossBarWidth / 2 + 1, bossBarY + 1, (bossBarWidth - 2) * bossHpPercent, bossBarHeight - 2);

  // Boss Name & Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 5;
  ctx.fillText(monster.name, 0, 24);

  ctx.restore();
}

function drawYetiBoss(ctx: CanvasRenderingContext2D, t: number, action: string) {
  // Giant Fur Body
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(0, -40, 42, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chest Armor / Frost Core
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.ellipse(0, -36, 26, 28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Crystal Core
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(0, -36, 12 + Math.sin(t * 5) * 2, 0, Math.PI * 2);
  ctx.fill();

  // Yeti Head
  ctx.fillStyle = '#0369a1';
  ctx.beginPath();
  ctx.arc(0, -78, 22, 0, Math.PI * 2);
  ctx.fill();

  // Horns
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-16, -88);
  ctx.quadraticCurveTo(-34, -108, -26, -118);
  ctx.moveTo(16, -88);
  ctx.quadraticCurveTo(34, -108, 26, -118);
  ctx.stroke();

  // Glowing Ice Eyes
  ctx.fillStyle = '#f0fdf4';
  ctx.beginPath();
  ctx.arc(-8, -78, 4, 0, Math.PI * 2);
  ctx.arc(8, -78, 4, 0, Math.PI * 2);
  ctx.fill();

  // Giant Yeti Fists
  const fistOffset = action === 'attack' ? -22 : Math.sin(t * 3) * 4;
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(-36 + fistOffset, -30, 16, 0, Math.PI * 2);
  ctx.arc(36, -30, 16, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoblinBoss(ctx: CanvasRenderingContext2D, t: number, action: string) {
  // Agile Goblin Body
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.ellipse(0, -35, 28, 36, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leather Harness
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-18, -38, 36, 8);

  // Goblin Head with Long Ears
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(0, -68, 18, 0, Math.PI * 2);
  ctx.fill();

  // Long Pointed Ears
  ctx.beginPath();
  ctx.moveTo(-16, -68);
  ctx.lineTo(-42, -74);
  ctx.lineTo(-16, -60);
  ctx.moveTo(16, -68);
  ctx.lineTo(42, -74);
  ctx.lineTo(16, -60);
  ctx.fill();

  // Yellow Cunning Eyes
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(-6, -70, 3.5, 0, Math.PI * 2);
  ctx.arc(6, -70, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Dual Poison Daggers with green glow trail
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-24, -30);
  ctx.lineTo(-46, -45);
  ctx.moveTo(24, -30);
  ctx.lineTo(46, -45);
  ctx.stroke();
}

function drawWyvernBoss(ctx: CanvasRenderingContext2D, t: number, action: string) {
  // Frost Wyvern Dragon Body
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.ellipse(0, -45, 34, 42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flapping Ice Wings
  const wingFlap = Math.sin(t * 6) * 16;
  ctx.fillStyle = '#7dd3fc';
  ctx.beginPath();
  ctx.moveTo(-20, -55);
  ctx.quadraticCurveTo(-80, -90 + wingFlap, -60, -30 + wingFlap);
  ctx.lineTo(-15, -40);
  ctx.moveTo(20, -55);
  ctx.quadraticCurveTo(80, -90 + wingFlap, 60, -30 + wingFlap);
  ctx.lineTo(15, -40);
  ctx.fill();

  // Dragon Neck & Head
  ctx.fillStyle = '#0369a1';
  ctx.beginPath();
  ctx.arc(0, -84, 18, 0, Math.PI * 2);
  ctx.fill();

  // Ice Horns
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-10, -92);
  ctx.lineTo(-24, -114);
  ctx.moveTo(10, -92);
  ctx.lineTo(24, -114);
  ctx.stroke();

  // Glowing Cyan Eyes
  ctx.fillStyle = '#67e8f9';
  ctx.beginPath();
  ctx.arc(-6, -84, 3.5, 0, Math.PI * 2);
  ctx.arc(6, -84, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawMagmaBoss(ctx: CanvasRenderingContext2D, t: number, action: string) {
  // Magma Colossus Molten Rock Body
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.ellipse(0, -48, 48, 52, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing Lava Veins in body
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-20, -60);
  ctx.lineTo(0, -40);
  ctx.lineTo(24, -54);
  ctx.moveTo(-15, -30);
  ctx.lineTo(5, -20);
  ctx.stroke();

  // Molten Core
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(0, -42, 14 + Math.sin(t * 6) * 3, 0, Math.PI * 2);
  ctx.fill();

  // Colossus Head
  ctx.fillStyle = '#292524';
  ctx.beginPath();
  ctx.arc(0, -90, 24, 0, Math.PI * 2);
  ctx.fill();

  // Fiery Eyes
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(-8, -90, 4.5, 0, Math.PI * 2);
  ctx.arc(8, -90, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawVoidBoss(ctx: CanvasRenderingContext2D, t: number, action: string) {
  // Dark Void Overlord
  ctx.fillStyle = '#2e1065';
  ctx.beginPath();
  ctx.ellipse(0, -50, 46, 56, 0, 0, Math.PI * 2);
  ctx.fill();

  // Void Energy Swirl
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -50, 32 + Math.sin(t * 7) * 4, 0, Math.PI * 2);
  ctx.stroke();

  // Void Fiend Head
  ctx.fillStyle = '#0f0728';
  ctx.beginPath();
  ctx.arc(0, -94, 22, 0, Math.PI * 2);
  ctx.fill();

  // Curved Demon Horns
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-14, -100);
  ctx.quadraticCurveTo(-42, -125, -28, -135);
  ctx.moveTo(14, -100);
  ctx.quadraticCurveTo(42, -125, 28, -135);
  ctx.stroke();

  // Glowing Purple Eyes
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(-7, -94, 4, 0, Math.PI * 2);
  ctx.arc(7, -94, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ----------------------------------------------------
// PROJECTILES ENGINE (Parabolic 3D Letter Cubes)
// ----------------------------------------------------
function updateAndDrawProjectiles(
  ctx: CanvasRenderingContext2D,
  projectiles: Projectile[],
  particles: Particle[],
  damagePops: DamagePop[],
  slashWaves: SlashWave[],
  dt: number,
  w: number,
  h: number
) {
  ctx.save();

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.progress += dt * p.speed;

    // Parabolic arc trajectory
    const dx = p.targetX - p.startX;
    const dy = p.targetY - p.startY;
    const currentX = p.startX + dx * p.progress;
    const arcHeight = Math.sin(p.progress * Math.PI) * -65;
    const currentY = p.startY + dy * p.progress + arcHeight;

    p.x = currentX;
    p.y = currentY;

    // Add trail
    p.trail.push({ x: currentX, y: currentY, alpha: 1 });
    if (p.trail.length > 8) p.trail.shift();

    // Draw Comet Trail
    for (let t = 0; t < p.trail.length; t++) {
      const pt = p.trail[t];
      pt.alpha -= dt * 3;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, pt.alpha * 0.6);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, (t + 1) * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw Glowing 3D Letter Cube
    ctx.save();
    ctx.translate(currentX, currentY);
    ctx.rotate(p.progress * Math.PI * 4); // Spinning in flight

    // Cube Outer Glow
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 12;
    ctx.fillRect(-12, -12, 24, 24);

    // Inner Bevel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-9, -9, 18, 18);

    // Letter on Cube
    ctx.fillStyle = '#0f172a';
    ctx.font = 'black 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(p.char.toUpperCase(), 0, 0);

    ctx.restore();

    // TARGET HIT COLLISION!
    if (p.progress >= 1) {
      projectiles.splice(i, 1);

      // 1. Spawn Impact Slash Wave
      slashWaves.push({
        x: p.targetX,
        y: p.targetY,
        size: 55,
        color: p.color,
        alpha: 1,
        angle: (Math.random() - 0.5) * Math.PI,
        thickness: 4,
      });

      // 2. Spawn Particle Shards Explosion
      for (let k = 0; k < 16; k++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 3 + Math.random() * 6;
        particles.push({
          x: p.targetX,
          y: p.targetY,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          size: 3 + Math.random() * 4,
          color: p.color,
          alpha: 1,
          decay: 0.04 + Math.random() * 0.03,
          shape: 'spark',
          gravity: 0.15,
        });
      }

      // 3. Spawn Floating Damage Number
      const dmg = p.isCrit ? Math.floor(65 + Math.random() * 25) : Math.floor(35 + Math.random() * 15);
      damagePops.push({
        id: Math.random(),
        text: p.isCrit ? `CRIT! -${dmg}` : `-${dmg}`,
        x: p.targetX + (Math.random() - 0.5) * 30,
        y: p.targetY - 20,
        vy: -2.5,
        alpha: 1,
        color: p.isCrit ? '#fde047' : '#ffffff',
        isCrit: p.isCrit,
        scale: p.isCrit ? 1.4 : 1,
      });
    }
  }

  ctx.restore();
}

// ----------------------------------------------------
// SLASH WAVES & ENERGY ARCS
// ----------------------------------------------------
function updateAndDrawSlashWaves(ctx: CanvasRenderingContext2D, waves: SlashWave[], dt: number) {
  ctx.save();
  for (let i = waves.length - 1; i >= 0; i--) {
    const sw = waves[i];
    sw.alpha -= dt * 3.5;
    sw.size += dt * 80;

    if (sw.alpha <= 0) {
      waves.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(sw.x, sw.y);
    ctx.rotate(sw.angle);

    ctx.strokeStyle = sw.color;
    ctx.globalAlpha = sw.alpha;
    ctx.lineWidth = sw.thickness;
    ctx.beginPath();
    ctx.arc(0, 0, sw.size, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();

    ctx.restore();
  }
  ctx.restore();
}

// ----------------------------------------------------
// PARTICLE ENGINE (Sparks, Embers, Explosions)
// ----------------------------------------------------
function updateAndDrawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  dt: number,
  w: number,
  h: number,
  element: string
) {
  ctx.save();
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.x += p.vx * 60 * dt;
    p.y += p.vy * 60 * dt;
    if (p.gravity) p.vy += p.gravity;

    if (p.decay > 0) {
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }
    } else {
      // Continuous ambient wrap-around
      if (p.y > h) p.y = 0;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
    }

    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.shape === 'ember') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'spark') {
      ctx.fillRect(p.x, p.y, p.size, p.size * 2);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ----------------------------------------------------
// DAMAGE POPS & HIT NUMBERS
// ----------------------------------------------------
function updateAndDrawDamagePops(ctx: CanvasRenderingContext2D, pops: DamagePop[], dt: number) {
  ctx.save();
  for (let i = pops.length - 1; i >= 0; i--) {
    const dp = pops[i];
    dp.y += dp.vy;
    dp.alpha -= dt * 1.5;
    dp.scale = Math.max(1, dp.scale - dt * 0.8);

    if (dp.alpha <= 0) {
      pops.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(dp.x, dp.y);
    ctx.scale(dp.scale, dp.scale);
    ctx.globalAlpha = dp.alpha;

    ctx.font = dp.isCrit ? '900 18px system-ui, sans-serif' : 'bold 15px system-ui, sans-serif';
    ctx.fillStyle = dp.color;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;
    ctx.fillText(dp.text, 0, 0);

    ctx.restore();
  }
  ctx.restore();
}

// ----------------------------------------------------
// ULTIMATE FULL-SCREEN EFFECT
// ----------------------------------------------------
function drawUltimateEffects(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  timer: number,
  hero: HeroCharacter
) {
  ctx.save();

  // Screen Flash / Darkening
  ctx.fillStyle = `rgba(15, 23, 42, ${Math.min(0.7, timer)})`;
  ctx.fillRect(0, 0, w, h);

  // Massive Golden Laser Beam from Hero to Boss
  const beamY = h * 0.58;
  const beamGrad = ctx.createLinearGradient(0, beamY - 30, 0, beamY + 30);
  beamGrad.addColorStop(0, 'rgba(251, 191, 36, 0)');
  beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
  beamGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');

  ctx.fillStyle = beamGrad;
  ctx.fillRect(w * 0.22, beamY - 30, w * 0.6, 60);

  // Ultimate Text Announcement
  ctx.font = '900 28px system-ui, sans-serif';
  ctx.fillStyle = '#fde047';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#eab308';
  ctx.shadowBlur = 16;
  ctx.fillText(`⚡ ${(hero.skillName || 'TUYỆT KỸ TẤT SÁT').toUpperCase()} ⚡`, w * 0.5, h * 0.24);

  ctx.restore();
}

// ----------------------------------------------------
// FLOATING 3D LETTER CARDS (Canvas HUD Sync)
// ----------------------------------------------------
function drawFloatingLetterTiles(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  word: string,
  typedIndex: number,
  t: number
) {
  if (!word || typeof word !== 'string' || word.length === 0) return;
  ctx.save();

  const letters = word.split('');
  const cardWidth = Math.min(42, (w * 0.85) / Math.max(letters.length, 1));
  const cardHeight = cardWidth * 1.25;
  const gap = 5;
  const totalWidth = letters.length * cardWidth + (letters.length - 1) * gap;
  const startX = (w - totalWidth) / 2;
  const startY = h * 0.12;

  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    const x = startX + i * (cardWidth + gap);
    let y = startY;

    const isTyped = i < typedIndex;
    const isCurrent = i === typedIndex;

    if (isCurrent) {
      y -= 4 + Math.sin(t * 8) * 3; // Bouncing active letter
    }

    ctx.save();
    ctx.translate(x, y);

    // 3D Card Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(0, 6, cardWidth, cardHeight, 8)
      : ctx.rect(0, 6, cardWidth, cardHeight);
    ctx.fill();

    // Card Face
    if (isTyped) {
      // Completed - Emerald / Green
      ctx.fillStyle = '#059669';
      ctx.strokeStyle = '#34d399';
    } else if (isCurrent) {
      // Active Target - Glowing Cyan / Gold
      ctx.fillStyle = '#2563eb';
      ctx.strokeStyle = '#60a5fa';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
    } else {
      // Upcoming - Clean White Glass
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
    }

    ctx.lineWidth = isCurrent ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect
      ? ctx.roundRect(0, 0, cardWidth, cardHeight, 8)
      : ctx.rect(0, 0, cardWidth, cardHeight);
    ctx.fill();
    ctx.stroke();

    // Character Text
    ctx.fillStyle = isTyped ? '#a7f3d0' : isCurrent ? '#ffffff' : '#94a3b8';
    ctx.font = `bold ${Math.floor(cardWidth * 0.58)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;
    ctx.fillText(char, cardWidth / 2, cardHeight / 2);

    ctx.restore();
  }

  ctx.restore();
}
