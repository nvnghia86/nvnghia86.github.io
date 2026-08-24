import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, LessonResult } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { triggerConfetti } from '../../utils/confetti';
import { ArrowLeft, RotateCcw, Zap, Trophy, Car } from 'lucide-react';

interface TypeRacerGameProps {
  lesson: Lesson;
  onFinish: (result: LessonResult) => void;
  onBack: () => void;
}

export const TypeRacerGame: React.FC<TypeRacerGameProps> = ({
  lesson,
  onFinish,
  onBack,
}) => {
  const fullText = lesson.content.join(' ');
  const [typedIndex, setTypedIndex] = useState(0);
  const [mistakeIndices, setMistakeIndices] = useState<number[]>([]);

  // Racers progress (0 to 100%)
  const [playerProgress, setPlayerProgress] = useState(0);
  const [bot1Progress, setBot1Progress] = useState(0);
  const [bot2Progress, setBot2Progress] = useState(0);
  const [bot3Progress, setBot3Progress] = useState(0);

  const [isRaceStarted, setIsRaceStarted] = useState(false);
  const [isRaceFinished, setIsRaceFinished] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [totalKeys, setTotalKeys] = useState(0);
  const [correctKeys, setCorrectKeys] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // 3-2-1 Countdown
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => {
        soundEngine.playKeyClick(false);
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0 && !isRaceStarted) {
      soundEngine.playStarEarned(4);
      setIsRaceStarted(true);
      setStartTime(Date.now());
    }
  }, [countdown, isRaceStarted]);

  // AI Bots speed simulation
  useEffect(() => {
    if (!isRaceStarted || isRaceFinished) return;

    const interval = setInterval(() => {
      // Bot 1: ~32 WPM
      setBot1Progress((p) => Math.min(100, p + (0.5 + Math.random() * 0.4)));
      // Bot 2: ~26 WPM
      setBot2Progress((p) => Math.min(100, p + (0.4 + Math.random() * 0.3)));
      // Bot 3: ~38 WPM
      setBot3Progress((p) => Math.min(100, p + (0.55 + Math.random() * 0.45)));
    }, 200);

    return () => clearInterval(interval);
  }, [isRaceStarted, isRaceFinished]);

  // Handle typing input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isRaceStarted || isRaceFinished) return;

      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        onBack();
        return;
      }

      if (e.key.length !== 1) return;

      const char = e.key;
      const expectedChar = fullText[typedIndex];
      setTotalKeys((k) => k + 1);

      if (char === expectedChar) {
        soundEngine.playKeyClick(char === ' ');
        setCorrectKeys((c) => c + 1);

        const nextIndex = typedIndex + 1;
        setTypedIndex(nextIndex);

        const prog = Math.round((nextIndex / fullText.length) * 100);
        setPlayerProgress(prog);

        if (nextIndex >= fullText.length) {
          // Finished race!
          setIsRaceFinished(true);
          soundEngine.playVictoryFanfare();
          triggerConfetti();
        }
      } else {
        soundEngine.playError();
        setMistakeIndices((prev) => [...prev, typedIndex]);
      }
    },
    [isRaceStarted, isRaceFinished, fullText, typedIndex, onBack]
  );

  const handleFinish = () => {
    const elapsed = startTime ? Math.max(1, Math.floor((Date.now() - startTime) / 1000)) : 1;
    const accuracy = totalKeys > 0 ? Math.round((correctKeys / totalKeys) * 100) : 100;
    const wpm = Math.max(1, Math.round((correctKeys / 5) / (elapsed / 60)));

    let stars = 3;
    if (playerProgress >= 100) {
      if (playerProgress > bot3Progress) stars = 5;
      else if (playerProgress > bot1Progress) stars = 4;
    }

    onFinish({
      lessonId: lesson.id,
      stars,
      wpm,
      rawWpm: wpm,
      accuracy,
      timeSeconds: elapsed,
      errorCount: Math.max(0, totalKeys - correctKeys),
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
              <Car className="w-4 h-4 text-blue-600 fill-blue-600" /> Typing Speedway Grand Prix
            </h1>
            <span className="text-xs text-slate-500">Race your sports car by typing without mistakes!</span>
          </div>
        </div>
      </header>

      {/* Race Track Canvas */}
      <div className="w-full max-w-5xl mx-auto px-4 py-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md flex flex-col gap-3">
          {/* Racer 1: Player */}
          <div className="relative flex items-center gap-3">
            <span className="w-20 text-xs font-bold text-blue-700">YOU (Player)</span>
            <div className="flex-1 h-10 bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden flex items-center px-2">
              <div
                style={{ left: `${Math.min(92, playerProgress)}%` }}
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-150 flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded-lg shadow-sm font-bold text-xs"
              >
                🏎️ YOU
              </div>
              <div className="absolute right-2 text-[10px] text-slate-400 font-bold uppercase">FINISH 🏁</div>
            </div>
            <span className="w-10 text-xs font-mono font-bold text-right text-blue-700">{playerProgress}%</span>
          </div>

          {/* Racer 2: Turbo Bot */}
          <div className="relative flex items-center gap-3">
            <span className="w-20 text-xs font-semibold text-slate-600">TurboBot</span>
            <div className="flex-1 h-8 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden flex items-center px-2">
              <div
                style={{ left: `${Math.min(92, bot3Progress)}%` }}
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-200 flex items-center gap-1 bg-purple-600 text-white px-2 py-0.5 rounded-lg text-xs"
              >
                🚗 Bot 1
              </div>
            </div>
            <span className="w-10 text-xs font-mono text-slate-500 text-right">{Math.round(bot3Progress)}%</span>
          </div>

          {/* Racer 3: Nitro Bot */}
          <div className="relative flex items-center gap-3">
            <span className="w-20 text-xs font-semibold text-slate-600">NitroBot</span>
            <div className="flex-1 h-8 bg-slate-50 rounded-xl border border-slate-200 relative overflow-hidden flex items-center px-2">
              <div
                style={{ left: `${Math.min(92, bot1Progress)}%` }}
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-200 flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-xs"
              >
                🚙 Bot 2
              </div>
            </div>
            <span className="w-10 text-xs font-mono text-slate-500 text-right">{Math.round(bot1Progress)}%</span>
          </div>
        </div>
      </div>

      {/* Typing Text Box */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-5xl mx-auto w-full">
        {countdown > 0 ? (
          <div className="text-center py-12">
            <div className="text-7xl font-black text-blue-600 font-mono animate-ping mb-4">
              {countdown}
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Get Ready to Race!
            </span>
          </div>
        ) : (
          <div className="w-full bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 font-mono text-2xl sm:text-3xl leading-loose text-center shadow-md flex flex-wrap items-center justify-center">
            {fullText.split('').map((char, i) => {
              const isTyped = i < typedIndex;
              const isCurrent = i === typedIndex;

              if (char === ' ') {
                let spaceClass = 'bg-slate-100/90 text-slate-400 border border-dashed border-slate-300';
                if (isTyped) {
                  spaceClass = 'bg-emerald-50 text-emerald-600 border border-emerald-300 font-medium';
                } else if (isCurrent) {
                  spaceClass = 'bg-[#42c998] text-slate-950 border border-[#2eb986] font-black shadow-xs';
                }

                return (
                  <span
                    key={i}
                    className={`inline-flex items-center justify-center min-w-[2.2em] sm:min-w-[2.8em] h-[1.35em] mx-1.5 sm:mx-2 px-2 py-0.5 rounded-lg text-xs sm:text-sm font-sans ${spaceClass}`}
                    title="Space"
                  >
                    ␣
                  </span>
                );
              }

              let color = 'text-slate-400 font-normal bg-transparent';
              if (isTyped) {
                color = 'text-emerald-600 font-bold bg-transparent';
              } else if (isCurrent) {
                color = 'bg-[#42c998] text-slate-950 font-black shadow-xs';
              }

              return (
                <span
                  key={i}
                  className={`inline-flex items-center justify-center min-w-[1.2ch] h-[1.35em] mx-[1px] px-1 py-0.5 rounded-md ${color}`}
                >
                  {char}
                </span>
              );
            })}
          </div>
        )}

        {isRaceFinished && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center max-w-sm w-full animate-in zoom-in-95">
              <Trophy className="w-14 h-14 text-amber-500 fill-amber-300 mx-auto mb-3" />
              <h2 className="text-2xl font-black text-slate-900 mb-1">Race Finished!</h2>
              <p className="text-xs text-slate-500 mb-6">
                {playerProgress > bot3Progress ? '🏆 1st Place Champion!' : 'Awesome sprint race!'}
              </p>

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

      <footer className="py-3 text-center text-xs text-slate-400">
        Type quickly and accurately to accelerate your car!
      </footer>
    </div>
  );
};
