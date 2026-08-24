import React from 'react';
import { HeroCharacter } from '../../data/characters';

interface CombatSpriteHeroProps {
  hero: HeroCharacter;
  action: 'idle' | 'attack' | 'hurt' | 'heal' | 'victory';
  className?: string;
}

export const CombatSpriteHero: React.FC<CombatSpriteHeroProps> = ({
  hero,
  action,
  className = '',
}) => {
  const isAttack = action === 'attack';
  const isHurt = action === 'hurt';
  const isHeal = action === 'heal';
  const isVictory = action === 'victory';

  // Dynamic animation classes
  let transformClasses = 'transition-all duration-150 ';
  if (isAttack) {
    transformClasses += 'translate-x-8 sm:translate-x-12 scale-110 rotate-3 ';
  } else if (isHurt) {
    transformClasses += '-translate-x-6 scale-95 -rotate-6 filter saturate-150 contrast-125 brightness-125 ';
  } else if (isHeal) {
    transformClasses += 'scale-105 -translate-y-2 ';
  } else if (isVictory) {
    transformClasses += 'scale-110 -translate-y-3 animate-bounce ';
  } else {
    transformClasses += 'animate-[pulse_3s_ease-in-out_infinite] ';
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Healing / Buff Halo */}
      {isHeal && (
        <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl animate-ping pointer-events-none" />
      )}

      {/* Hurt Red Flash Aura */}
      {isHurt && (
        <div className="absolute inset-0 rounded-full bg-rose-500/40 blur-xl pointer-events-none animate-pulse" />
      )}

      {/* Attack Energy Glow Behind Hero */}
      {isAttack && (
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-amber-400/30 blur-2xl pointer-events-none" />
      )}

      {/* Hero Container */}
      <div className={`relative w-28 h-32 sm:w-36 sm:h-40 ${transformClasses}`}>
        {/* Render Vector Hero depending on hero.id */}
        {renderHeroSvg(hero.id, action)}

        {/* Slash / Magic Projectile Visual Effect when attacking */}
        {isAttack && renderAttackEffect(hero.id)}

        {/* Hurt Sparkles */}
        {isHurt && (
          <div className="absolute -top-2 -right-2 text-rose-500 font-black text-xl animate-ping">
            💥
          </div>
        )}

        {/* Heal Aura Sparkles */}
        {isHeal && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-emerald-400 font-bold text-lg animate-bounce">
            ✨ +HEAL ✨
          </div>
        )}
      </div>

      {/* Shadow under character */}
      <div className="w-20 sm:w-28 h-3.5 bg-slate-400/25 rounded-full blur-xs mt-1" />
    </div>
  );
};

// Render Individual Character Vector Illustration
function renderHeroSvg(heroId: string, action: string) {
  const isAttack = action === 'attack';
  const isHurt = action === 'hurt';

  switch (heroId) {
    case 'mage':
      return (
        <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-lg select-none">
          <defs>
            <linearGradient id="mageRobe" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
            <linearGradient id="mageOrb" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>
          {/* Robe Cape */}
          <path d="M 50 70 Q 30 140 45 165 Q 80 175 115 165 Q 130 140 110 70 Z" fill="url(#mageRobe)" />
          {/* Inner Tunic */}
          <path d="M 60 75 L 65 160 L 95 160 L 100 75 Z" fill="#312e81" />
          <path d="M 75 75 L 75 160" stroke="#fbbf24" strokeWidth="2" />
          {/* Hands */}
          <circle cx="50" cy="100" r="8" fill="#fcd34d" />
          <circle cx="110" cy={isAttack ? '85' : '100'} r="8" fill="#fcd34d" />
          {/* Head & Hood */}
          <ellipse cx="80" cy="48" rx="22" ry="24" fill="#6b21a8" />
          {/* Face */}
          <circle cx="80" cy="50" r="14" fill="#fde68a" />
          {/* Mage Hat Point */}
          <path d="M 54 44 Q 80 8 106 44 Z" fill="#581c87" />
          <polygon points="106,44 135,15 100,32" fill="#7e22ce" />
          {/* Wizard Hat Brim */}
          <ellipse cx="80" cy="46" rx="28" ry="8" fill="#4c1d95" />
          {/* Glowing Eyes */}
          <ellipse cx="74" cy="50" rx="2.5" ry="3" fill="#60a5fa" />
          <ellipse cx="86" cy="50" rx="2.5" ry="3" fill="#60a5fa" />
          {/* Arcane Staff in Right Hand */}
          <g className={`transition-transform duration-150 ${isAttack ? 'rotate-12 origin-bottom' : ''}`}>
            <line x1="112" y1="30" x2="116" y2="165" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
            <circle cx="111" cy="26" r="14" fill="url(#mageOrb)" className="animate-pulse" />
            <circle cx="111" cy="26" r="6" fill="#ffffff" />
            <circle cx="111" cy="26" r="18" fill="none" stroke="#e9d5ff" strokeWidth="1.5" strokeDasharray="4,3" />
          </g>
          {/* Orbiting Arcane Runes */}
          <circle cx="48" cy="80" r="4" fill="#38bdf8" className="animate-ping" />
        </svg>
      );

    case 'archer':
      return (
        <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-lg select-none">
          <defs>
            <linearGradient id="archerTunic" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          </defs>
          {/* Body & Quiver on back */}
          <rect x="42" y="55" width="16" height="50" rx="6" fill="#78350f" transform="rotate(-15 42 55)" />
          <line x1="42" y1="50" x2="35" y2="40" stroke="#f59e0b" strokeWidth="3" />
          <line x1="48" y1="50" x2="45" y2="38" stroke="#f59e0b" strokeWidth="3" />
          {/* Cape */}
          <path d="M 52 65 Q 35 120 48 160 Q 80 168 112 160 Q 125 120 108 65 Z" fill="url(#archerTunic)" />
          {/* Legs & Boots */}
          <rect x="62" y="145" width="12" height="25" rx="4" fill="#92400e" />
          <rect x="86" y="145" width="12" height="25" rx="4" fill="#92400e" />
          {/* Torso */}
          <path d="M 60 70 L 64 148 L 96 148 L 100 70 Z" fill="#047857" />
          <path d="M 60 95 L 100 95" stroke="#78350f" strokeWidth="4" />
          {/* Head & Hair */}
          <circle cx="80" cy="46" r="16" fill="#fde68a" />
          {/* Green Ranger Cowl */}
          <path d="M 60 40 Q 80 20 100 40 Q 102 55 96 64 L 64 64 Z" fill="#065f46" />
          <ellipse cx="80" cy="47" rx="12" ry="11" fill="#fed7aa" />
          <ellipse cx="76" cy="47" rx="2" ry="2" fill="#0f172a" />
          <ellipse cx="84" cy="47" rx="2" ry="2" fill="#0f172a" />
          {/* Long Bow in Left/Right Hand */}
          <g className={`transition-transform duration-100 ${isAttack ? 'translate-x-3' : ''}`}>
            {/* Curved Bow */}
            <path d="M 116 15 Q 145 90 116 165" fill="none" stroke="#d97706" strokeWidth="5" strokeLinecap="round" />
            <line x1="116" y1="15" x2={isAttack ? '95' : '116'} y2="90" stroke="#f8fafc" strokeWidth="1.5" />
            <line x1={isAttack ? '95' : '116'} y1="90" x2="116" y2="165" stroke="#f8fafc" strokeWidth="1.5" />
            {/* Arrow Loaded */}
            {isAttack && (
              <g>
                <line x1="90" y1="90" x2="155" y2="90" stroke="#0284c7" strokeWidth="3" />
                <polygon points="155,86 165,90 155,94" fill="#38bdf8" />
              </g>
            )}
          </g>
        </svg>
      );

    case 'assassin':
      return (
        <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-lg select-none">
          <defs>
            <linearGradient id="ninjaSuit" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          {/* Ninja Scarf waving */}
          <path d="M 68 55 Q 30 70 15 60 Q 20 85 55 70 Z" fill="#dc2626" className="animate-pulse" />
          {/* Body */}
          <path d="M 55 65 L 60 150 L 100 150 L 105 65 Z" fill="url(#ninjaSuit)" />
          {/* Red Sash */}
          <rect x="58" y="96" width="44" height="6" fill="#e11d48" />
          {/* Head & Ninja Mask */}
          <circle cx="80" cy="44" r="16" fill="#1e293b" />
          {/* Eye Visor slit */}
          <rect x="68" y="38" width="24" height="9" rx="3" fill="#fed7aa" />
          <circle cx="75" cy="42" r="2" fill="#dc2626" />
          <circle cx="85" cy="42" r="2" fill="#dc2626" />
          {/* Headband Ribbon */}
          <rect x="64" y="32" width="32" height="5" rx="2" fill="#b91c1c" />
          {/* Dual Ninjato Swords */}
          <g className={`transition-transform duration-100 ${isAttack ? 'rotate-45 translate-x-4' : ''}`}>
            {/* Sword 1 */}
            <line x1="110" y1="35" x2="145" y2="140" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
            <rect x="105" y="32" width="10" height="4" fill="#f59e0b" transform="rotate(-15 105 32)" />
            {/* Sword 2 (Crossed) */}
            <line x1="50" y1="35" x2="20" y2="135" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'cyber':
      return (
        <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-lg select-none">
          <defs>
            <linearGradient id="cyberArmor" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="neonBlade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {/* Mecha Exoskeleton */}
          <path d="M 52 65 L 58 155 L 102 155 L 108 65 Z" fill="url(#cyberArmor)" />
          {/* Neon circuit lines */}
          <path d="M 65 75 L 75 90 L 75 140" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
          <path d="M 95 75 L 85 90 L 85 140" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
          {/* Cyber Helmet */}
          <rect x="64" y="26" width="32" height="32" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          {/* Glowing Visor */}
          <rect x="68" y="36" width="24" height="8" rx="3" fill="#06b6d4" className="animate-pulse" />
          {/* Shoulder Mecha Pads */}
          <polygon points="45,62 60,62 55,85 40,80" fill="#0284c7" />
          <polygon points="115,62 100,62 105,85 120,80" fill="#0284c7" />
          {/* Cyber Laser Saber */}
          <g className={`transition-transform duration-100 ${isAttack ? 'rotate-45 translate-x-5' : ''}`}>
            {/* Hilt */}
            <rect x="110" y="70" width="8" height="24" rx="2" fill="#475569" />
            {/* Glowing Neon Beam */}
            <line x1="114" y1="70" x2="135" y2="8" stroke="url(#neonBlade)" strokeWidth="6" strokeLinecap="round" />
            <line x1="114" y1="70" x2="135" y2="8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>
      );

    case 'valkyrie':
      return (
        <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-lg select-none">
          <defs>
            <linearGradient id="valkGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="valkWing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          {/* Feathered Divine Wings */}
          <path d="M 60 70 C 15 30 5 110 50 120 Z" fill="url(#valkWing)" stroke="#cbd5e1" strokeWidth="1.5" className="animate-pulse" />
          <path d="M 100 70 C 145 30 155 110 110 120 Z" fill="url(#valkWing)" stroke="#cbd5e1" strokeWidth="1.5" className="animate-pulse" />
          {/* White & Gold Armor Dress */}
          <path d="M 56 68 L 60 155 L 100 155 L 104 68 Z" fill="#f8fafc" />
          <path d="M 64 70 L 80 110 L 96 70 Z" fill="url(#valkGold)" />
          {/* Head & Winged Tiara */}
          <circle cx="80" cy="45" r="15" fill="#fed7aa" />
          <path d="M 64 36 Q 80 20 96 36 Z" fill="url(#valkGold)" />
          <polygon points="62,34 50,22 66,28" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" />
          <polygon points="98,34 110,22 94,28" fill="#ffffff" stroke="#f59e0b" strokeWidth="1" />
          {/* Face */}
          <circle cx="75" cy="45" r="2" fill="#0f172a" />
          <circle cx="85" cy="45" r="2" fill="#0f172a" />
          {/* Holy Dawn Spear */}
          <g className={`transition-transform duration-100 ${isAttack ? 'rotate-12 translate-x-4' : ''}`}>
            <line x1="112" y1="10" x2="112" y2="170" stroke="url(#valkGold)" strokeWidth="4" strokeLinecap="round" />
            <polygon points="112,0 102,25 122,25" fill="#fef08a" stroke="#d97706" strokeWidth="1.5" />
            <circle cx="112" cy="25" r="6" fill="#f59e0b" />
          </g>
        </svg>
      );

    case 'warrior':
    default:
      return (
        <svg viewBox="0 0 160 180" className="w-full h-full drop-shadow-lg select-none">
          <defs>
            <linearGradient id="warriorSteel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
            <linearGradient id="bladeGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
          {/* Blue Cape */}
          <path d="M 50 65 Q 30 135 45 165 Q 80 175 115 165 Q 130 135 110 65 Z" fill="#1d4ed8" />
          {/* Heavy Chest Armor */}
          <path d="M 56 68 L 62 155 L 98 155 L 104 68 Z" fill="url(#warriorSteel)" />
          <path d="M 70 75 L 80 115 L 90 75 Z" fill="#fbbf24" />
          {/* Shoulder Armor Plates */}
          <ellipse cx="50" cy="72" rx="14" ry="10" fill="#2563eb" stroke="#fbbf24" strokeWidth="2" />
          <ellipse cx="110" cy="72" rx="14" ry="10" fill="#2563eb" stroke="#fbbf24" strokeWidth="2" />
          {/* Knight Helm */}
          <rect x="64" y="26" width="32" height="34" rx="8" fill="#1e40af" stroke="#93c5fd" strokeWidth="2" />
          {/* T-Visor Slit with Golden Cross */}
          <rect x="70" y="38" width="20" height="5" rx="2" fill="#fbbf24" />
          <rect x="78" y="32" width="4" height="18" rx="1" fill="#fbbf24" />
          {/* Helm Wing crest */}
          <polygon points="62,26 48,10 68,18" fill="#60a5fa" />
          <polygon points="98,26 112,10 92,18" fill="#60a5fa" />
          {/* Excalibur Holy Greatsword */}
          <g className={`transition-transform duration-120 ${isAttack ? 'rotate-45 translate-x-6' : ''}`}>
            {/* Blade */}
            <polygon points="122,12 116,90 128,90" fill="#f8fafc" stroke="#60a5fa" strokeWidth="2" />
            <polygon points="122,8 114,30 130,30" fill="url(#bladeGold)" />
            {/* Guard & Grip */}
            <rect x="110" y="90" width="24" height="6" rx="2" fill="#f59e0b" />
            <rect x="120" y="96" width="4" height="18" fill="#78350f" />
            <circle cx="122" cy="116" r="4" fill="#f59e0b" />
          </g>
        </svg>
      );
  }
}

// Render dynamic attack swing / projectile effect
function renderAttackEffect(heroId: string) {
  return (
    <div className="absolute top-1/2 -right-16 -translate-y-1/2 pointer-events-none z-30 animate-in fade-in zoom-in duration-200">
      {heroId === 'mage' ? (
        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 blur-xs flex items-center justify-center animate-spin">
          <div className="w-10 h-10 rounded-full bg-white shadow-xl shadow-purple-500" />
        </div>
      ) : heroId === 'archer' ? (
        <div className="flex items-center gap-1">
          <div className="w-16 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-white rounded-full shadow-lg" />
          <span className="text-2xl text-cyan-400 drop-shadow-md">➤</span>
        </div>
      ) : heroId === 'assassin' ? (
        <div className="relative w-20 h-16">
          <div className="absolute top-2 w-16 h-1 bg-red-500 shadow-md shadow-red-500 rotate-12" />
          <div className="absolute bottom-2 w-16 h-1 bg-white shadow-md -rotate-12" />
        </div>
      ) : heroId === 'cyber' ? (
        <div className="w-24 h-4 bg-gradient-to-r from-cyan-400 to-white rounded-full blur-2xs shadow-xl shadow-cyan-400 rotate-6" />
      ) : (
        <div className="w-24 h-24 rounded-full border-4 border-amber-300 border-t-transparent border-l-transparent rotate-45 animate-ping" />
      )}
    </div>
  );
}
