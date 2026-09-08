import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, LessonResult, UserSettings } from '../../types';
import { getHeroById, HeroCharacter } from '../../data/characters';
import { HTML5MonsterBattleCanvas } from './HTML5MonsterBattleCanvas';
import { HeroSelectModal } from '../HeroSelectModal';
import { soundEngine } from '../../utils/soundEngine';
import { triggerConfetti } from '../../utils/confetti';
import {
  ArrowLeft,
  Swords,
  Shield,
  Heart,
  Zap,
  Flame,
  Trophy,
  RotateCcw,
  Sparkles,
  Skull,
  Crosshair,
  Volume2,
  VolumeX,
  User,
  CheckCircle,
} from 'lucide-react';

// Background assets generated for rich 3D arena graphics
import cliffBg from '../../assets/images/cliff_battle_bg_1786970320348.jpg';
import glacierBg from '../../assets/images/glacier_battle_bg_1786970336119.jpg';
import volcanoBg from '../../assets/images/volcano_battle_bg_1786970352099.jpg';
import abyssBg from '../../assets/images/abyss_battle_bg_1786970366346.jpg';

interface MonsterBattleGameProps {
  lesson: Lesson;
  settings?: UserSettings;
  onUpdateSettings?: (newSettings: Partial<UserSettings>) => void;
  onFinish: (result: LessonResult) => void;
  onBack: () => void;
}

interface MonsterData {
  id: string;
  name: string;
  vietnameseTitle: string;
  title: string;
  avatar: string;
  element: 'earth' | 'ice' | 'fire' | 'dark';
  maxHp: number;
  attackPower: number;
  attackIntervalSeconds: number;
  skillName: string;
  bgImage: string;
  cliffTexture: string;
  color: string;
}

const MONSTERS: MonsterData[] = [
  {
    id: 'cliff_yeti',
    name: 'Borb the Cliff Behemoth',
    vietnameseTitle: 'Quái Thú Đỉnh Núi Borb',
    title: 'Peak Guardian Titan',
    avatar: '🦍',
    element: 'ice',
    maxHp: 480,
    attackPower: 18,
    attackIntervalSeconds: 6.5,
    skillName: 'Ice Slam (Địa Chấn Băng Cốt)',
    bgImage: cliffBg,
    cliffTexture: 'from-slate-200 via-stone-300 to-stone-500',
    color: 'text-cyan-400',
  },
  {
    id: 'goblin',
    name: 'Grom the Shadow Goblin',
    vietnameseTitle: 'Goblin Chúa Rừng Sâu',
    title: 'Jungle Outpost Boss',
    avatar: '👺',
    element: 'earth',
    maxHp: 650,
    attackPower: 22,
    attackIntervalSeconds: 5.8,
    skillName: 'Poison Blades (Song Đao Tẩm Độc)',
    bgImage: cliffBg,
    cliffTexture: 'from-emerald-200 via-stone-400 to-stone-600',
    color: 'text-emerald-400',
  },
  {
    id: 'frost_wyvern',
    name: 'Glacia the Frost Wyvern',
    vietnameseTitle: 'Băng Long Ngàn Năm',
    title: 'Glacier Sky Ruler',
    avatar: '🐉',
    element: 'ice',
    maxHp: 950,
    attackPower: 30,
    attackIntervalSeconds: 5.0,
    skillName: 'Blizzard Breath (Bão Tuyết Cuồng Nộ)',
    bgImage: glacierBg,
    cliffTexture: 'from-cyan-100 via-blue-200 to-slate-500',
    color: 'text-cyan-300',
  },
  {
    id: 'magma_golem',
    name: 'Ignis the Magma Colossus',
    vietnameseTitle: 'Khổng Lồ Dung Nham',
    title: 'Volcano Core Titan',
    avatar: '🌋',
    element: 'fire',
    maxHp: 1300,
    attackPower: 42,
    attackIntervalSeconds: 4.5,
    skillName: 'Meteor Fist (Cú Đấm Hỏa Diệm)',
    bgImage: volcanoBg,
    cliffTexture: 'from-amber-700 via-stone-800 to-neutral-900',
    color: 'text-orange-400',
  },
  {
    id: 'demon_king',
    name: 'Malakor the Void Overlord',
    vietnameseTitle: 'Chúa Tể Hư Không',
    title: 'Supreme Chaos Dragon',
    avatar: '👿',
    element: 'dark',
    maxHp: 1800,
    attackPower: 52,
    attackIntervalSeconds: 4.0,
    skillName: 'Abyssal Cataclysm (Đại Họa Hư Không)',
    bgImage: abyssBg,
    cliffTexture: 'from-purple-900 via-indigo-950 to-black',
    color: 'text-purple-400',
  },
];

// Rich set of authentic words & challenge sentences
const BATTLE_WORD_POOL = [
  'comfortable',
  'extraordinary',
  'championship',
  'courageous',
  'lightning',
  'adventure',
  'thunderstorm',
  'invincible',
  'legendary',
  'destruction',
  'sanctuary',
  'mysterious',
  'victory',
  'valiant',
  'determination',
];

interface FloatingText {
  id: number;
  text: string;
  x: number; // percentage
  y: number; // percentage
  color: string;
  isCrit?: boolean;
}

interface FlyingLetterProjectile {
  id: number;
  char: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  color: string;
}

export const MonsterBattleGame: React.FC<MonsterBattleGameProps> = ({
  lesson,
  settings,
  onUpdateSettings,
  onFinish,
  onBack,
}) => {
  // Hero character from profile
  const hero = getHeroById(settings?.characterId);
  const [showHeroModal, setShowHeroModal] = useState(false);

  // Boss / Wave State
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0);
  const monster = MONSTERS[currentMonsterIndex];

  // Player & Monster Stats
  const playerMaxHp = 500;
  const [playerHp, setPlayerHp] = useState(playerMaxHp);
  const [monsterHp, setMonsterHp] = useState(monster.maxHp);
  const [playerShield, setPlayerShield] = useState(0);
  const [playerEnergy, setPlayerEnergy] = useState(0);

  // Monster Auto-Attack Gauge
  const [monsterChargePercent, setMonsterChargePercent] = useState(0);

  // Word pool & current word typing
  const [wordList, setWordList] = useState<string[]>(() => {
    if (lesson.content && lesson.content.length > 0) {
      // Split into single words or short phrases
      const extracted: string[] = [];
      lesson.content.forEach((line) => {
        line.split(/\s+/).forEach((w) => {
          const cleaned = w.trim();
          if (cleaned.length > 0) extracted.push(cleaned);
        });
      });
      return extracted.length > 0 ? extracted : BATTLE_WORD_POOL;
    }
    return BATTLE_WORD_POOL;
  });

  const [wordIndex, setWordIndex] = useState(0);
  const currentWord = wordList[wordIndex % wordList.length] || 'comfortable';
  const [typedIndex, setTypedIndex] = useState(0);

  // Combat Stats
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalDamageDealt, setTotalDamageDealt] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Animation States
  const [playerAction, setPlayerAction] = useState<'idle' | 'attack' | 'hurt' | 'heal' | 'victory'>('idle');
  const [monsterAction, setMonsterAction] = useState<'idle' | 'attack' | 'hurt'>('idle');
  const [screenShake, setScreenShake] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [letterProjectiles, setLetterProjectiles] = useState<FlyingLetterProjectile[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [monsterKnockback, setMonsterKnockback] = useState(0);

  // Game Finish
  const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const nextFloatingId = useRef(1);
  const nextProjectileId = useRef(1);

  // Canvas interaction trigger refs
  const canvasSpawnRef = useRef<((char: string, isCrit: boolean) => void) | null>(null);
  const canvasUltRef = useRef<(() => void) | null>(null);

  // Focus container
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Spawn floating combat damage text
  const spawnFloatingText = useCallback(
    (text: string, x: number, y: number, color: string, isCrit = false) => {
      const id = nextFloatingId.current++;
      setFloatingTexts((prev) => [...prev, { id, text, x, y, color, isCrit }]);
      setTimeout(() => {
        setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
      }, 1000);
    },
    []
  );

  // Spawn flying 3D letter projectile cube from hero to monster
  const launchLetterProjectile = useCallback((char: string) => {
    const id = nextProjectileId.current++;
    const newProj: FlyingLetterProjectile = {
      id,
      char,
      startX: 32,
      startY: 55,
      targetX: 68,
      targetY: 52,
      color: 'bg-white text-blue-700 shadow-lg border-2 border-blue-400',
    };
    setLetterProjectiles((prev) => [...prev, newProj]);
    setTimeout(() => {
      setLetterProjectiles((prev) => prev.filter((p) => p.id !== id));
    }, 400);
  }, []);

  // Switch Monster
  const handleSelectMonster = (idx: number) => {
    const newM = MONSTERS[idx];
    setCurrentMonsterIndex(idx);
    setMonsterHp(newM.maxHp);
    setPlayerHp(playerMaxHp);
    setPlayerShield(0);
    setPlayerEnergy(0);
    setMonsterChargePercent(0);
    setWordIndex(0);
    setTypedIndex(0);
    setCombo(0);
    setMonsterKnockback(0);
    setPlayerAction('idle');
    setMonsterAction('idle');
    setGameResult(null);
    setIsFinished(false);
    containerRef.current?.focus();
  };

  // Monster Auto-Attack charge interval
  useEffect(() => {
    if (isFinished || gameResult) return;

    const intervalMs = 100;
    const stepIncrement = (100 / (monster.attackIntervalSeconds * 10)) * (intervalMs / 100);

    const timer = setInterval(() => {
      setMonsterChargePercent((prev) => {
        if (prev + stepIncrement >= 100) {
          triggerMonsterAttack();
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [monster, isFinished, gameResult]);

  // Monster attacks player
  const triggerMonsterAttack = useCallback(() => {
    if (isFinished || gameResult) return;

    setMonsterAction('attack');
    soundEngine.playMonsterRoar();

    setTimeout(() => {
      setMonsterAction('idle');
      setPlayerAction('hurt');
      setScreenShake(true);
      soundEngine.playPlayerHurt();

      const baseDmg = monster.attackPower;
      let effectiveDmg = baseDmg;

      setPlayerShield((prevShield) => {
        if (prevShield > 0) {
          if (prevShield >= baseDmg) {
            spawnFloatingText(`🛡️ BLOCKED -${baseDmg}`, 30, 45, 'text-cyan-300 font-black');
            return prevShield - baseDmg;
          } else {
            effectiveDmg = baseDmg - prevShield;
            spawnFloatingText(`🛡️ SHIELD BROKEN`, 30, 45, 'text-cyan-300 font-black');
            return 0;
          }
        }
        return 0;
      });

      setPlayerHp((prevHp) => {
        const nextHp = Math.max(0, prevHp - effectiveDmg);
        spawnFloatingText(`-${effectiveDmg} HP`, 30, 52, 'text-rose-500 font-black text-2xl');

        if (nextHp <= 0) {
          handleGameOver(false);
        }
        return nextHp;
      });

      setCombo(0);

      setTimeout(() => {
        setPlayerAction('idle');
        setScreenShake(false);
      }, 350);
    }, 250);
  }, [monster, isFinished, gameResult, spawnFloatingText]);

  // Player Ultimate Skill
  const handleCastSpecialSkill = () => {
    if (playerEnergy < 100 || isFinished || gameResult) return;

    setPlayerEnergy(0);
    setPlayerAction('attack');
    soundEngine.playHealSpell();
    soundEngine.playCriticalSlash();

    // Trigger Canvas Full-Screen Ultimate VFX
    canvasUltRef.current?.();

    const ultDamage = 250 + Math.round(combo * 5);
    const healAmount = 60;
    const shieldBonus = 80;

    spawnFloatingText(`💥 ${hero.skillName}!`, 50, 30, 'text-amber-300 font-black text-3xl animate-bounce', true);
    spawnFloatingText(`-${ultDamage} CRIT DMG!`, 70, 40, 'text-amber-300 font-black text-3xl', true);

    setPlayerHp((hp) => Math.min(playerMaxHp, hp + healAmount));
    setPlayerShield((s) => s + shieldBonus);
    setTotalDamageDealt((d) => d + ultDamage);
    setMonsterKnockback((k) => Math.min(30, k + 15));

    setMonsterAction('hurt');
    setMonsterHp((prev) => {
      const nextHp = Math.max(0, prev - ultDamage);
      if (nextHp <= 0) {
        handleGameOver(true);
      }
      return nextHp;
    });

    setTimeout(() => {
      setPlayerAction('idle');
      setMonsterAction('idle');
    }, 500);
  };

  // When a single word is fully typed
  const handleWordCompleted = () => {
    if (isFinished || gameResult) return;

    const wordLen = currentWord.length;
    const isCrit = combo >= 8;
    const baseDamage = Math.round(wordLen * 6.5 + combo * 4);
    const finalDamage = isCrit ? Math.round(baseDamage * 1.5) : baseDamage;

    setPlayerAction('attack');
    if (isCrit) {
      soundEngine.playCriticalSlash();
    } else {
      soundEngine.playAttackHit();
    }

    // Energy increase
    setPlayerEnergy((e) => Math.min(100, e + Math.round(wordLen * 2.2)));

    // Small shield for fast typing
    if (combo > 5) {
      setPlayerShield((s) => Math.min(120, s + 15));
    }

    setTotalDamageDealt((prev) => prev + finalDamage);
    setMonsterKnockback((k) => Math.min(35, k + 5));

    // Monster HP Damage
    setMonsterHp((prevHp) => {
      const nextHp = Math.max(0, prevHp - finalDamage);
      spawnFloatingText(
        `-${finalDamage} DMG ${isCrit ? '⚡CRIT!' : ''}`,
        70,
        42,
        isCrit ? 'text-amber-300 font-black text-3xl' : 'text-amber-200 font-black text-xl',
        isCrit
      );

      if (nextHp <= 0) {
        handleGameOver(true);
      }
      return nextHp;
    });

    setMonsterAction('hurt');

    setTimeout(() => {
      setPlayerAction('idle');
      setMonsterAction('idle');
    }, 300);

    // Next word
    setWordIndex((prev) => prev + 1);
    setTypedIndex(0);
  };

  // Keyboard Typing Handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isFinished || gameResult) return;

    // Trigger Ultimate with Enter
    if (e.key === 'Enter') {
      if (playerEnergy >= 100) {
        e.preventDefault();
        handleCastSpecialSkill();
        return;
      }
    }

    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }

    if (!startTime) {
      setStartTime(Date.now());
    }

    const expectedChar = currentWord[typedIndex];
    const expectedCharLower = expectedChar.toLowerCase();
    const typedCharLower = e.key.toLowerCase();

    // Tự động không phân biệt chữ hoa, chữ thường
    if (typedCharLower === expectedCharLower) {
      // Keystroke correct!
      soundEngine.playKeyClick(false);
      const nextIdx = typedIndex + 1;
      setTypedIndex(nextIdx);
      setCorrectKeystrokes((c) => c + 1);

      // Launch 3D letter projectile from Hero to Monster (DOM & Canvas)
      launchLetterProjectile(e.key);
      canvasSpawnRef.current?.(e.key, combo >= 8);

      setCombo((c) => {
        const nextC = c + 1;
        setMaxCombo((m) => Math.max(m, nextC));
        return nextC;
      });

      // Check if word is completed
      if (nextIdx >= currentWord.length) {
        handleWordCompleted();
      }
    } else {
      // Keystroke Error!
      soundEngine.playError();
      setErrorCount((err) => err + 1);
      setCombo(0);

      // Monster builds charge faster on typos
      setMonsterChargePercent((prev) => Math.min(100, prev + 15));
      spawnFloatingText(`MISS!`, 30, 50, 'text-rose-400 font-black text-sm');
    }
  };

  // Game Win / Defeat
  const handleGameOver = (won: boolean) => {
    setIsFinished(true);
    setGameResult(won ? 'won' : 'lost');

    if (won) {
      setPlayerAction('victory');
      soundEngine.playVictoryFanfare();
      triggerConfetti();
    } else {
      soundEngine.playPlayerHurt();
    }
  };

  // Return to lesson / map with result
  const handleFinishAndReturn = () => {
    const elapsedSeconds = startTime ? Math.max(1, Math.round((Date.now() - startTime) / 1000)) : 30;
    const words = correctKeystrokes / 5;
    const minutes = elapsedSeconds / 60;
    const wpm = minutes > 0 ? Math.round(words / minutes) : 0;
    const totalKeystrokes = correctKeystrokes + errorCount;
    const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;

    let stars = 0;
    if (gameResult === 'won') {
      if (accuracy >= 98 && wpm >= 40) stars = 5;
      else if (accuracy >= 95 && wpm >= 30) stars = 4;
      else if (accuracy >= 90) stars = 3;
      else stars = 2;
    } else {
      stars = 1;
    }

    const result: LessonResult = {
      lessonId: lesson.id,
      stars,
      wpm,
      rawWpm: wpm,
      accuracy,
      timeSeconds: elapsedSeconds,
      errorCount,
      wrongKeys: {},
      completedAt: new Date().toISOString(),
    };

    onFinish(result);
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`min-h-screen relative w-full overflow-hidden select-none outline-none flex flex-col justify-between ${
        screenShake ? 'animate-[shake_0.2s_ease-in-out]' : ''
      }`}
    >
      {/* 1. CINEMATIC 3D BACKGROUND IMAGE */}
      <img
        src={monster.bgImage}
        alt="Battle Stage Background"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0 filter brightness-95"
      />

      {/* Atmospheric Cloud Fog Layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none z-0" />

      {/* Floating Animated Clouds */}
      <div className="absolute top-12 left-0 w-full h-24 pointer-events-none z-0 opacity-40 overflow-hidden">
        <div className="w-[200%] h-full bg-radial from-white/40 via-white/10 to-transparent animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      {/* 2. TOP HUD HEADER BAR */}
      <header className="relative z-30 h-16 px-4 sm:px-8 bg-slate-900/70 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-white shadow-lg">
        {/* Left: Exit & Boss Wave */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 text-white transition-all flex items-center gap-1.5 text-xs font-bold border border-white/20 cursor-pointer backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quay Lại</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/30 text-rose-300 border border-rose-400/40">
              <Swords className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white flex items-center gap-2 drop-shadow-md">
                <span>Trận Đấu Đỉnh Núi (Cliff Arena)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/80 text-white font-bold border border-blue-400/40">
                  Ải {currentMonsterIndex + 1}/{MONSTERS.length}
                </span>
              </h1>
              <p className="text-[11px] text-slate-300 drop-shadow-xs">
                Gõ chính xác từng phím để phóng tuyệt chiêu trảm quái vật
              </p>
            </div>
          </div>
        </div>

        {/* Center: Stage Boss Selectors */}
        <div className="hidden lg:flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-2xl border border-white/10 backdrop-blur-sm">
          {MONSTERS.map((m, idx) => {
            const isCurrent = idx === currentMonsterIndex;
            const isDefeated = idx < currentMonsterIndex;
            return (
              <button
                key={m.id}
                onClick={() => handleSelectMonster(idx)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isCurrent
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40'
                    : isDefeated
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <span>{m.avatar}</span>
                <span className="truncate max-w-[90px]">{m.name.split(' ')[0]}</span>
                {isDefeated && <CheckCircle className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Right: Change Hero Button, Combo & Sound */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Hero Pill */}
          <button
            onClick={() => setShowHeroModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/80 to-indigo-600/80 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md backdrop-blur-sm transition-all"
            title="Đổi nhân vật người chơi"
          >
            <span className="text-base">{hero.avatarEmoji}</span>
            <span className="hidden sm:inline font-semibold">{hero.name}</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md text-amber-200">Đổi</span>
          </button>

          {/* Combo Pill */}
          <div className="bg-black/50 px-3 py-1.5 rounded-xl border border-white/20 font-mono text-xs font-black text-amber-300 flex items-center gap-1.5 backdrop-blur-sm">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{combo}x</span>
          </div>

          <button
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              soundEngine.setSoundTheme(nextMute ? 'mute' : 'mechanical');
            }}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white transition-colors border border-white/20 cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 3. MAIN ARENA: FLOATING WORD TILES & 3D CLIFF BATTLE STAGE */}
      <main className="relative z-20 flex-1 flex flex-col justify-between max-w-6xl w-full mx-auto p-4 sm:p-6">
        
        {/* ========================================================================= */}
        {/* TOP WORD LETTERS (Exact Match with user screenshot: [C][o][m][f][o][r][t]...) */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center justify-center my-2 sm:my-4">
          {/* Floating Letter Cards Container */}
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 bg-slate-950/40 p-4 sm:p-5 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
            {currentWord.split('').map((char, idx) => {
              const isTyped = idx < typedIndex;
              const isCurrent = idx === typedIndex;

              return (
                <div
                  key={idx}
                  className={`relative flex items-center justify-center w-12 h-14 sm:w-14 sm:h-16 rounded-2xl font-black text-xl sm:text-2xl transition-all duration-150 transform ${
                    isTyped
                      ? 'bg-emerald-500/90 text-white border-2 border-emerald-300 scale-95 shadow-md shadow-emerald-500/40 translate-y-1'
                      : isCurrent
                      ? 'bg-white text-blue-900 border-4 border-blue-500 shadow-2xl shadow-blue-500/80 -translate-y-2 scale-110 animate-bounce'
                      : 'bg-white/80 text-slate-800 border border-white shadow-lg backdrop-blur-sm'
                  }`}
                >
                  <span>{char === ' ' ? '␣' : char}</span>

                  {/* Active Indicator Pip */}
                  {isCurrent && (
                    <div className="absolute -bottom-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md" />
                  )}

                  {/* Typed Check Pip */}
                  {isTyped && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-black">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Word Progress & Tip */}
          <div className="mt-2 text-center text-xs font-bold text-white/90 drop-shadow-md bg-black/40 px-4 py-2 rounded-xl border border-white/10 flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span>Từ {wordIndex + 1}/{wordList.length}:</span>
              <span className="text-amber-300 font-mono text-sm tracking-widest">{currentWord}</span>
            </div>
            
            {/* Vùng hiển thị text người dùng đã nhập */}
            <div className="flex items-center gap-2 mt-1 bg-slate-900/80 px-4 py-1.5 rounded-lg border border-slate-700 w-full max-w-xs shadow-inner">
              <span className="text-slate-400 font-mono text-xs">Đã nhập:</span>
              <span className="text-emerald-400 font-mono font-black text-sm tracking-widest border-r-2 border-emerald-400 pr-1 animate-pulse min-h-[20px]">
                {currentWord.substring(0, typedIndex)}
              </span>
            </div>

            <span className="text-slate-300 text-[11px] mt-1">(Gõ không phân biệt hoa/thường)</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CLIFF ARENA STAGE (HTML5 CANVAS 60FPS) */}
        {/* ========================================================================= */}
        <div className="relative w-full h-[340px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
          <HTML5MonsterBattleCanvas
            hero={hero}
            monster={monster}
            playerHp={playerHp}
            playerMaxHp={playerMaxHp}
            playerShield={playerShield}
            playerEnergy={playerEnergy}
            playerAction={playerAction}
            monsterHp={monsterHp}
            monsterChargePercent={monsterChargePercent}
            monsterAction={monsterAction}
            combo={combo}
            currentWord={currentWord}
            typedIndex={typedIndex}
            screenShake={screenShake}
            onCanvasClick={() => containerRef.current?.focus()}
            onCastSpecialSkill={handleCastSpecialSkill}
            spawnEventRef={canvasSpawnRef}
            triggerUltimateRef={canvasUltRef}
          />
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM COMBAT HUD CONTROL PANEL */}
        {/* ========================================================================= */}
        <div className="bg-slate-950/70 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex flex-wrap items-center justify-between text-xs text-white">
          <div className="flex items-center gap-4 sm:gap-6 font-medium">
            <span>
              ⚔️ Sát thương: <b className="text-amber-400 font-bold">{totalDamageDealt}</b>
            </span>
            <span>
              🎯 Chính xác: <b className="text-emerald-400 font-bold">{correctKeystrokes > 0 ? Math.round((correctKeystrokes / (correctKeystrokes + errorCount)) * 100) : 100}%</b>
            </span>
            <span>
              🛡️ Lỗi: <b className="text-rose-400 font-bold">{errorCount}</b>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-[11px] hidden sm:inline">
              Vũ khí: <b className="text-amber-300">{hero.weaponName}</b>
            </span>
            <button
              onClick={handleCastSpecialSkill}
              disabled={playerEnergy < 100}
              className={`px-3 py-1 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                playerEnergy >= 100
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-white border-amber-300 shadow-md animate-pulse'
                  : 'bg-black/40 text-slate-500 border-white/10 cursor-not-allowed'
              }`}
            >
              Kích Hoạt Chiêu Cuối (Enter)
            </button>
          </div>
        </div>

      </main>

      {/* 4. VICTORY / DEFEAT MODAL */}
      {gameResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900/95 rounded-3xl border border-white/20 shadow-2xl p-6 sm:p-8 max-w-lg w-full text-white flex flex-col items-center text-center animate-in zoom-in-95">
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-xl border ${
                gameResult === 'won'
                  ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 border-amber-300 text-amber-950 shadow-amber-500/30'
                  : 'bg-rose-950/80 border-rose-700 text-rose-400 shadow-rose-950/50'
              }`}
            >
              {gameResult === 'won' ? '🏆' : '💀'}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mb-1 text-white drop-shadow-md">
              {gameResult === 'won' ? 'VICTORY! CHIẾN THẮNG!' : 'DEFEAT! THẤT BẠI!'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mb-6">
              {gameResult === 'won'
                ? `Chiến binh ${hero.name} đã đánh bại hoàn toàn ${monster.name}!`
                : `Boss ${monster.name} đã phòng thủ thành công! Hãy luyện tập tốc độ và tái đấu.`}
            </p>

            <div className="grid grid-cols-3 gap-3 w-full mb-6 text-center">
              <div className="p-3 bg-black/40 rounded-2xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sát Thương</span>
                <span className="text-lg font-black text-amber-400">{totalDamageDealt}</span>
              </div>
              <div className="p-3 bg-black/40 rounded-2xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Max Combo</span>
                <span className="text-lg font-black text-blue-400">{maxCombo}x</span>
              </div>
              <div className="p-3 bg-black/40 rounded-2xl border border-white/10">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Độ Chính Xác</span>
                <span className="text-lg font-black text-emerald-400">
                  {correctKeystrokes > 0 ? Math.round((correctKeystrokes / (correctKeystrokes + errorCount)) * 100) : 100}%
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {gameResult === 'won' && currentMonsterIndex < MONSTERS.length - 1 ? (
                <button
                  onClick={() => handleSelectMonster(currentMonsterIndex + 1)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all cursor-pointer text-xs sm:text-sm"
                >
                  Ải Tiếp Theo ({MONSTERS[currentMonsterIndex + 1].name.split(' ')[0]})
                </button>
              ) : (
                <button
                  onClick={() => handleSelectMonster(currentMonsterIndex)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Đấu Lại</span>
                </button>
              )}

              <button
                onClick={handleFinishAndReturn}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer text-xs sm:text-sm"
              >
                Hoàn Thành & Lưu Điểm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. HERO SELECTION MODAL */}
      {showHeroModal && (
        <HeroSelectModal
          selectedHeroId={settings?.characterId || 'warrior'}
          onSelectHero={(heroId) => {
            if (onUpdateSettings) {
              onUpdateSettings({ characterId: heroId });
            }
            setShowHeroModal(false);
          }}
          onClose={() => setShowHeroModal(false)}
        />
      )}
    </div>
  );
};
