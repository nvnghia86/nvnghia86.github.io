import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, LessonResult } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { triggerConfetti } from '../../utils/confetti';
import { ArrowLeft, RotateCcw, Zap, Trophy, CircleDot } from 'lucide-react';

interface BalloonPopGameProps {
  lesson: Lesson;
  onFinish: (result: LessonResult) => void;
  onBack: () => void;
}

interface Balloon {
  id: number;
  word: string;
  x: number; // 10% to 85%
  y: number; // 90% down to 0%
  speed: number;
  typed: string;
  color: string;
}

const BALLOON_COLORS = [
  'from-rose-500 to-pink-600 border-rose-400',
  'from-blue-500 to-indigo-600 border-blue-400',
  'from-emerald-500 to-teal-600 border-emerald-400',
  'from-amber-500 to-orange-600 border-amber-400',
  'from-purple-500 to-violet-600 border-purple-400',
];

export const BalloonPopGame: React.FC<BalloonPopGameProps> = ({
  lesson,
  onFinish,
  onBack,
}) => {
  const wordsList = useRef<string[]>(
    lesson.content.join(' ').split(/\s+/).filter((w) => w.length > 0)
  );

  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const [escapedCount, setEscapedCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startTime] = useState(Date.now());
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const balloonIdCounter = useRef(0);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Spawn balloons from bottom
  useEffect(() => {
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      if (wordsList.current.length === 0 && balloons.length === 0) {
        setGameOver(true);
        triggerConfetti();
        return;
      }

      if (balloons.length < 5 && wordsList.current.length > 0) {
        const nextWord = wordsList.current.shift();
        if (nextWord) {
          balloonIdCounter.current += 1;
          const newBalloon: Balloon = {
            id: balloonIdCounter.current,
            word: nextWord,
            x: 10 + Math.random() * 75,
            y: 95,
            speed: 0.2 + Math.random() * 0.25,
            typed: '',
            color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
          };
          setBalloons((prev) => [...prev, newBalloon]);
        }
      }
    }, 1600);

    return () => clearInterval(spawnInterval);
  }, [balloons.length, gameOver]);

  // Floating animation loop
  useEffect(() => {
    if (gameOver) return;

    const loop = setInterval(() => {
      setBalloons((prev) => {
        const nextList: Balloon[] = [];
        let escaped = 0;

        for (const b of prev) {
          const nextY = b.y - b.speed;
          if (nextY <= 0) {
            escaped += 1;
            soundEngine.playError();
          } else {
            nextList.push({ ...b, y: nextY });
          }
        }

        if (escaped > 0) {
          setEscapedCount((e) => {
            const nextE = e + escaped;
            if (nextE >= 5) {
              setGameOver(true);
            }
            return nextE;
          });
        }

        return nextList;
      });
    }, 50);

    return () => clearInterval(loop);
  }, [gameOver]);

  // Handle typing
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (gameOver) return;

      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        onBack();
        return;
      }

      if (e.key.length !== 1) return;

      const char = e.key;
      setTotalKeystrokes((k) => k + 1);

      setBalloons((prev) => {
        let targetIndex = prev.findIndex((b) => b.typed.length > 0 && b.word[b.typed.length] === char);

        if (targetIndex === -1) {
          targetIndex = prev.findIndex((b) => b.typed.length === 0 && b.word[0] === char);
        }

        if (targetIndex !== -1) {
          soundEngine.playKeyClick(char === ' ');
          setCorrectKeystrokes((c) => c + 1);

          const updated = [...prev];
          const target = updated[targetIndex];
          const nextTyped = target.typed + char;

          if (nextTyped === target.word) {
            // POP!
            soundEngine.playStarEarned(3);
            setPoppedCount((p) => p + 1);
            updated.splice(targetIndex, 1);
          } else {
            updated[targetIndex] = { ...target, typed: nextTyped };
          }
          return updated;
        } else {
          soundEngine.playError();
          return prev;
        }
      });
    },
    [gameOver, onBack]
  );

  const handleFinish = () => {
    const elapsed = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
    const wpm = Math.max(1, Math.round((correctKeystrokes / 5) / (elapsed / 60)));

    let stars = 1;
    if (poppedCount >= 5) stars = 2;
    if (poppedCount >= 10 && accuracy >= 85) stars = 3;
    if (poppedCount >= 14 && accuracy >= 90) stars = 4;
    if (poppedCount >= 18 && accuracy >= 94) stars = 5;

    onFinish({
      lessonId: lesson.id,
      stars,
      wpm,
      rawWpm: wpm,
      accuracy,
      timeSeconds: elapsed,
      errorCount: Math.max(0, totalKeystrokes - correctKeystrokes),
      wrongKeys: {},
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none min-h-screen bg-[#f0f4f8] text-slate-800 flex flex-col justify-between select-none relative overflow-hidden font-sans"
    >
      <header className="w-full bg-white border-b border-slate-200 px-6 py-3 h-[64px] flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-2 text-xs font-semibold border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-blue-600 fill-blue-600" /> Balloon Pop Arcade
            </h1>
            <span className="text-xs text-slate-500">Pop floating balloons by typing letters!</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-200 font-mono shadow-xs">
            <span className="text-xs text-slate-500 uppercase mr-2 font-bold">Popped:</span>
            <span className="text-lg font-black text-emerald-600">{poppedCount}</span>
          </div>

          <div className="bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-200 font-mono shadow-xs">
            <span className="text-xs text-slate-500 uppercase mr-2 font-bold">Escaped:</span>
            <span className="text-lg font-black text-rose-600">{escapedCount}/5</span>
          </div>
        </div>
      </header>

      {/* Game Stage with Floating Balloons */}
      <main className="flex-1 relative w-full overflow-hidden bg-gradient-to-b from-sky-100/60 via-[#f0f4f8] to-slate-200/80">
        {balloons.map((b) => {
          const typedPart = b.word.slice(0, b.typed.length);
          const untypedPart = b.word.slice(b.typed.length);
          const isTargeted = b.typed.length > 0;

          return (
            <div
              key={b.id}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
              }}
              className={`absolute -translate-x-1/2 flex flex-col items-center justify-center w-20 h-24 sm:w-24 sm:h-28 rounded-full bg-gradient-to-br shadow-xl border-2 transition-all duration-75 ${
                b.color
              } ${isTargeted ? 'scale-110 ring-4 ring-blue-400 z-10' : ''}`}
            >
              <div className="font-mono font-black text-base sm:text-lg text-white drop-shadow-md text-center px-1">
                <span className="text-amber-200">{typedPart}</span>
                <span>{untypedPart}</span>
              </div>
              {/* Balloon knot string */}
              <div className="absolute -bottom-3 w-1.5 h-1.5 bg-slate-600 rounded-full" />
              <div className="absolute -bottom-6 w-0.5 h-3 bg-slate-400" />
            </div>
          );
        })}

        {gameOver && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-30">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center max-w-sm w-full animate-in zoom-in-95">
              <Trophy className="w-14 h-14 text-amber-500 fill-amber-300 mx-auto mb-3" />
              <h2 className="text-2xl font-black text-slate-900 mb-1">Game Completed!</h2>
              <p className="text-xs text-slate-500 mb-6">You popped {poppedCount} balloons.</p>

              <button
                onClick={handleFinish}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-200 cursor-pointer"
              >
                Claim Rewards & Continue
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
