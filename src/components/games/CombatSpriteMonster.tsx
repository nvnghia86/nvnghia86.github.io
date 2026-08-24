import React from 'react';

interface CombatSpriteMonsterProps {
  monsterId: string;
  action: 'idle' | 'attack' | 'hurt';
  element: 'earth' | 'ice' | 'fire' | 'dark';
  className?: string;
}

export const CombatSpriteMonster: React.FC<CombatSpriteMonsterProps> = ({
  monsterId,
  action,
  element,
  className = '',
}) => {
  const isAttack = action === 'attack';
  const isHurt = action === 'hurt';

  // Dynamic animation classes
  let transformClasses = 'transition-all duration-150 ';
  if (isAttack) {
    transformClasses += '-translate-x-8 sm:-translate-x-12 scale-110 -rotate-3 ';
  } else if (isHurt) {
    transformClasses += 'translate-x-6 scale-95 rotate-6 filter saturate-150 brightness-125 ';
  } else {
    transformClasses += 'animate-[pulse_2.5s_ease-in-out_infinite] ';
  }

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Hurt Flash Aura */}
      {isHurt && (
        <div className="absolute inset-0 rounded-full bg-amber-500/40 blur-xl pointer-events-none animate-ping" />
      )}

      {/* Attack Elemental Aura Behind Monster */}
      {isAttack && (
        <div
          className={`absolute -left-6 top-1/2 -translate-y-1/2 w-28 h-28 rounded-full blur-2xl pointer-events-none ${
            element === 'fire'
              ? 'bg-orange-500/40'
              : element === 'ice'
              ? 'bg-cyan-400/40'
              : element === 'dark'
              ? 'bg-purple-600/40'
              : 'bg-emerald-500/40'
          }`}
        />
      )}

      {/* Monster Sprite Container */}
      <div className={`relative w-32 h-36 sm:w-44 sm:h-48 ${transformClasses}`}>
        {renderMonsterSvg(monsterId, action)}

        {/* Attack Projectile Counter-Attack Effect */}
        {isAttack && renderMonsterAttackEffect(element)}

        {/* Hurt Impact Sparks */}
        {isHurt && (
          <div className="absolute top-2 -left-2 text-amber-400 font-black text-2xl animate-bounce">
            ⚡
          </div>
        )}
      </div>

      {/* Shadow under monster */}
      <div className="w-24 sm:w-36 h-4 bg-slate-400/25 rounded-full blur-xs mt-1" />
    </div>
  );
};

function renderMonsterSvg(monsterId: string, action: string) {
  const isAttack = action === 'attack';
  const isHurt = action === 'hurt';

  switch (monsterId) {
    case 'cliff_yeti':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl select-none">
          <defs>
            <linearGradient id="yetiFur" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="60%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
            <linearGradient id="yetiEnergy" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          {/* Curved Beast Horns */}
          <path d="M 65 50 C 30 15 20 40 45 65 Z" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
          <path d="M 135 50 C 170 15 180 40 155 65 Z" fill="#475569" stroke="#1e293b" strokeWidth="2.5" />
          
          {/* Thick Beast Fur Body */}
          <ellipse cx="100" cy="125" rx="55" ry="45" fill="url(#yetiFur)" stroke="#cbd5e1" strokeWidth="2" />
          
          {/* Glowing Elemental Core in Chest */}
          <circle cx="100" cy="125" r="20" fill="url(#yetiEnergy)" className="animate-pulse" />
          <circle cx="100" cy="125" r="10" fill="#ffffff" opacity="0.9" />

          {/* Heavy Arm & Claw */}
          <path
            d="M 45 105 C 20 120 15 150 40 160 C 55 150 55 125 45 105 Z"
            fill="url(#yetiFur)"
            stroke="#94a3b8"
            strokeWidth="2"
          />
          <path
            d="M 155 105 C 180 120 185 150 160 160 C 145 150 145 125 155 105 Z"
            fill="url(#yetiFur)"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* Big Furry Head */}
          <ellipse cx="100" cy="65" rx="35" ry="30" fill="url(#yetiFur)" stroke="#94a3b8" strokeWidth="2" />
          
          {/* Dark Fur Face Mask */}
          <ellipse cx="100" cy="68" rx="22" ry="18" fill="#1e293b" />
          
          {/* Piercing Glowing Blue Eyes */}
          <ellipse cx="91" cy="64" rx="4.5" ry="4" fill="#38bdf8" className="animate-pulse" />
          <ellipse cx="109" cy="64" rx="4.5" ry="4" fill="#38bdf8" className="animate-pulse" />
          <ellipse cx="91" cy="64" rx="1.5" ry="1.5" fill="#ffffff" />
          <ellipse cx="109" cy="64" rx="1.5" ry="1.5" fill="#ffffff" />

          {/* Sharp Fangs */}
          <polygon points="94,76 97,71 100,76" fill="#ffffff" />
          <polygon points="100,76 103,71 106,76" fill="#ffffff" />
        </svg>
      );

    case 'frost_wyvern':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl select-none">
          <defs>
            <linearGradient id="wyvernScale" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="iceWing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>
          {/* Wyvern Huge Dragon Wings */}
          <path
            d="M 100 90 C 170 10 190 120 120 150 Z"
            fill="url(#iceWing)"
            opacity="0.9"
            className="animate-pulse"
          />
          <path
            d="M 60 90 C -10 10 -30 120 40 150 Z"
            fill="url(#iceWing)"
            opacity="0.9"
            className="animate-pulse"
          />
          {/* Wyvern Spiny Tail */}
          <path d="M 120 150 Q 170 180 180 140" fill="none" stroke="#0284c7" strokeWidth="10" strokeLinecap="round" />
          <polygon points="180,140 195,130 185,155" fill="#38bdf8" />
          {/* Dragon Body */}
          <ellipse cx="90" cy="115" rx="34" ry="42" fill="url(#wyvernScale)" />
          {/* Ice Horns & Spikes */}
          <polygon points="55,40 30,10 65,30" fill="#7dd3fc" />
          <polygon points="75,35 60,5 85,25" fill="#7dd3fc" />
          {/* Dragon Neck & Head */}
          <path d="M 65 100 Q 40 70 50 45 Q 25 50 15 65 Q 40 85 65 100 Z" fill="url(#wyvernScale)" />
          {/* Dragon Fierce Head */}
          <ellipse cx="45" cy="55" rx="20" ry="14" fill="#0284c7" />
          {/* Glowing Ice Eye */}
          <ellipse cx="40" cy="50" rx="3.5" ry="3.5" fill="#fef08a" />
          <ellipse cx="40" cy="50" rx="1.5" ry="1.5" fill="#0f172a" />
          {/* Sharp Fangs */}
          <polygon points="25,58 30,66 35,58" fill="#ffffff" />
          <polygon points="36,58 40,65 44,58" fill="#ffffff" />
          {/* Talons */}
          <ellipse cx="80" cy="165" rx="10" ry="6" fill="#0c4a6e" />
          <ellipse cx="110" cy="165" rx="10" ry="6" fill="#0c4a6e" />
        </svg>
      );

    case 'magma_golem':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl select-none">
          <defs>
            <linearGradient id="volcanicRock" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
            <linearGradient id="lavaGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          {/* Massive Boulder Shoulders */}
          <circle cx="45" cy="85" r="28" fill="url(#volcanicRock)" stroke="#ea580c" strokeWidth="2.5" />
          <circle cx="155" cy="85" r="28" fill="url(#volcanicRock)" stroke="#ea580c" strokeWidth="2.5" />
          {/* Giant Fist Arm */}
          <g className={`transition-transform duration-100 ${isAttack ? '-translate-x-6' : ''}`}>
            <ellipse cx="30" cy="125" rx="22" ry="18" fill="url(#volcanicRock)" stroke="#f97316" strokeWidth="2" />
            <polygon points="15,120 20,110 30,120" fill="#f97316" />
          </g>
          {/* Colossus Torso */}
          <polygon points="60,65 140,65 125,160 75,160" fill="url(#volcanicRock)" stroke="#b45309" strokeWidth="3" />
          {/* Molten Lava Cracks */}
          <path d="M 80 80 L 100 110 L 85 145" stroke="url(#lavaGlow)" strokeWidth="4" fill="none" className="animate-pulse" />
          <path d="M 120 80 L 105 110 L 115 145" stroke="url(#lavaGlow)" strokeWidth="4" fill="none" className="animate-pulse" />
          {/* Burning Core Heart */}
          <circle cx="100" cy="110" r="8" fill="#facc15" className="animate-ping" />
          {/* Head Crater with Volcanic Smoke */}
          <ellipse cx="100" cy="48" rx="24" ry="18" fill="url(#volcanicRock)" stroke="#ea580c" strokeWidth="2" />
          {/* Glowing Eyes of Fire */}
          <ellipse cx="90" cy="48" rx="4" ry="2.5" fill="#facc15" />
          <ellipse cx="110" cy="48" rx="4" ry="2.5" fill="#facc15" />
          {/* Volcanic Magma Crest */}
          <polygon points="90,32 100,12 110,32" fill="#ef4444" />
        </svg>
      );

    case 'demon_king':
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl select-none">
          <defs>
            <linearGradient id="voidDark" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#581c87" />
              <stop offset="100%" stopColor="#09090b" />
            </linearGradient>
            <linearGradient id="abyssPurple" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
          </defs>
          {/* Demonic Horns */}
          <path d="M 70 45 C 30 0 10 30 35 60 Z" fill="#9333ea" stroke="#c084fc" strokeWidth="2" />
          <path d="M 130 45 C 170 0 190 30 165 60 Z" fill="#9333ea" stroke="#c084fc" strokeWidth="2" />
          {/* Dark Bat / Void Wings */}
          <path d="M 85 80 C 10 20 5 150 70 160 Z" fill="url(#abyssPurple)" opacity="0.85" className="animate-pulse" />
          <path d="M 115 80 C 190 20 195 150 130 160 Z" fill="url(#abyssPurple)" opacity="0.85" className="animate-pulse" />
          {/* Demon Armor Body */}
          <path d="M 70 70 L 60 165 L 140 165 L 130 70 Z" fill="url(#voidDark)" />
          {/* Void Core Rune */}
          <polygon points="100,85 85,115 115,115" fill="#c084fc" stroke="#f3e8ff" strokeWidth="2" className="animate-pulse" />
          {/* Demon Mask & Face */}
          <ellipse cx="100" cy="55" rx="26" ry="22" fill="#2e1065" stroke="#a855f7" strokeWidth="2" />
          {/* Piercing Demon Crimson Eyes */}
          <ellipse cx="88" cy="52" rx="4" ry="2.5" fill="#ef4444" />
          <ellipse cx="112" cy="52" rx="4" ry="2.5" fill="#ef4444" />
          {/* Fanged Grimace */}
          <path d="M 90 68 Q 100 78 110 68" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
        </svg>
      );

    case 'goblin':
    default:
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl select-none">
          <defs>
            <linearGradient id="goblinSkin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#065f46" />
            </linearGradient>
          </defs>
          {/* Spiky Pointed Ears */}
          <polygon points="55,55 5,45 45,75" fill="#059669" stroke="#064e3b" strokeWidth="1.5" />
          <polygon points="145,55 195,45 155,75" fill="#059669" stroke="#064e3b" strokeWidth="1.5" />
          {/* Bone Armor Body */}
          <path d="M 65 85 L 60 160 L 140 160 L 135 85 Z" fill="#78350f" />
          <ellipse cx="100" cy="115" rx="22" ry="18" fill="#d97706" />
          {/* Goblin Head */}
          <ellipse cx="100" cy="65" rx="34" ry="28" fill="url(#goblinSkin)" />
          {/* Feral Red Eyes */}
          <ellipse cx="86" cy="60" rx="5" ry="5" fill="#dc2626" />
          <ellipse cx="86" cy="60" rx="2" ry="2" fill="#fef08a" />
          <ellipse cx="114" cy="60" rx="5" ry="5" fill="#dc2626" />
          <ellipse cx="114" cy="60" rx="2" ry="2" fill="#fef08a" />
          {/* Big Crooked Nose */}
          <polygon points="100,60 92,78 108,78" fill="#047857" />
          {/* Sharp Goblin Fangs */}
          <polygon points="86,85 90,75 94,85" fill="#ffffff" />
          <polygon points="106,85 110,75 114,85" fill="#ffffff" />
          {/* Poison-Dripping Daggers in Hand */}
          <g className={`transition-transform duration-100 ${isAttack ? '-translate-x-6 rotate-12' : ''}`}>
            <line x1="45" y1="120" x2="15" y2="85" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            <circle cx="15" cy="85" r="4" fill="#22c55e" className="animate-ping" />
          </g>
        </svg>
      );
  }
}

function renderMonsterAttackEffect(element: string) {
  return (
    <div className="absolute top-1/2 -left-16 -translate-y-1/2 pointer-events-none z-30 animate-in fade-in zoom-in duration-200">
      {element === 'fire' ? (
        <div className="w-24 h-24 rounded-full bg-gradient-to-l from-orange-500 via-red-500 to-yellow-300 blur-xs flex items-center justify-center animate-pulse">
          <span className="text-3xl">🔥</span>
        </div>
      ) : element === 'ice' ? (
        <div className="w-24 h-24 rounded-full bg-gradient-to-l from-cyan-400 via-blue-500 to-white blur-xs flex items-center justify-center animate-spin">
          <span className="text-3xl">❄️</span>
        </div>
      ) : element === 'dark' ? (
        <div className="w-24 h-24 rounded-full bg-gradient-to-l from-purple-700 via-fuchsia-600 to-black blur-xs flex items-center justify-center animate-ping">
          <span className="text-3xl">🌑</span>
        </div>
      ) : (
        <div className="w-20 h-20 rounded-full bg-emerald-500/70 blur-xs flex items-center justify-center animate-bounce">
          <span className="text-3xl">☠️</span>
        </div>
      )}
    </div>
  );
}
