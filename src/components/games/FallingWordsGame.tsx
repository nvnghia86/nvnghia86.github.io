import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, LessonResult } from '../../types';
import { soundEngine } from '../../utils/soundEngine';
import { triggerConfetti } from '../../utils/confetti';
import { ArrowLeft, RotateCcw, Heart, Zap, Target, Trophy } from 'lucide-react';

interface FallingWordsGameProps {
  lesson: Lesson;
  onFinish: (result: LessonResult) => void;
  onBack: () => void;
}

interface FallingWord {
  id: number;
  word: string;
  x: number; // percentage 10% - 85%
  y: number; // percentage 0% - 100%
  speed: number;
  typed: string;
}

export const FallingWordsGame: React.FC<FallingWordsGameProps> = ({
  lesson,
  onFinish,
  onBack,
}) => {
  const wordsList = useRef<string[]>(
    lesson.content.join(' ').split(/\s+/).filter((w) => w.length > 0)
  );

  const [activeWords, setActiveWords] = useState<FallingWord[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [wordsCleared, setWordsCleared] = useState(0);
  const [startTime] = useState(Date.now());

  const containerRef = useRef<HTMLDivElement>(null);
  const wordIdCounter = useRef(0);

  // Focus container
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Spawn words periodically
  useEffect(() => {
    if (gameOver || gameWon) return;

    const spawnInterval = setInterval(() => {
      if (wordsList.current.length === 0 && activeWords.length === 0) {
        setGameWon(true);
        triggerConfetti();
        return;
      }

      if (activeWords.length < 5 && wordsList.current.length > 0) {
        const nextWord = wordsList.current.shift();
        if (nextWord) {
          wordIdCounter.current += 1;
          const newWord: FallingWord = {
            id: wordIdCounter.current,
            word: nextWord,
            x: 10 + Math.random() * 75,
            y: 0,
            speed: 0.25 + Math.random() * 0.35,
            typed: '',
          };
          setActiveWords((prev) => [...prev, newWord]);
        }
      }
    }, 1800);

    return () => clearInterval(spawnInterval);
  }, [activeWords.length, gameOver, gameWon]);

  // Game tick animation loop for falling words
  useEffect(() => {
    if (gameOver || gameWon) return;

    const gameLoop = setInterval(() => {
      setActiveWords((prev) => {
        const nextWords: FallingWord[] = [];
        let lostALife = false;

        for (const w of prev) {
          const nextY = w.y + w.speed;
          if (nextY >= 90) {
            // Hit bottom!
            lostALife = true;
            soundEngine.playError();
          } else {
            nextWords.push({ ...w, y: nextY });
          }
        }

        if (lostALife) {
          setLives((l) => {
            const nextL = l - 1;
            if (nextL <= 0) {
              setGameOver(true);
            }
            return nextL;
          });
        }

        return nextWords;
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameOver, gameWon]);

  // Typing key handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (gameOver || gameWon) return;

      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        onBack();
        return;
      }

      if (e.key.length !== 1) return;

      const char = e.key;
      setTotalKeystrokes((k) => k + 1);

      // Find the closest active word that matches the next expected letter
      setActiveWords((prev) => {
        // First look for a word that is already partially typed
        let targetIndex = prev.findIndex((w) => w.typed.length > 0 && w.word[w.typed.length] === char);

        // Otherwise find any word whose first letter matches
        if (targetIndex === -1) {
          targetIndex = prev.findIndex((w) => w.typed.length === 0 && w.word[0] === char);
        }

        if (targetIndex !== -1) {
          soundEngine.playKeyClick(char === ' ');
          setCorrectKeystrokes((c) => c + 1);

          const updated = [...prev];
          const target = updated[targetIndex];
          const nextTyped = target.typed + char;

          if (nextTyped === target.word) {
            // Word completely cleared!
            soundEngine.playStarEarned(2);
            setScore((s) => s + target.word.length * 20);
            setWordsCleared((w) => w + 1);
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
    [gameOver, gameWon, onBack]
  );

  const handleFinishGame = () => {
    const elapsed = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
    const wpm = Math.max(1, Math.round((correctKeystrokes / 5) / (elapsed / 60)));

    let stars = 1;
    if (wordsCleared >= 4) stars = 2;
    if (wordsCleared >= 8 && accuracy >= 85) stars = 3;
    if (wordsCleared >= 12 && accuracy >= 90) stars = 4;
    if (gameWon && accuracy >= 92) stars = 5;

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
      {/* Top Header */}
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
              <Zap className="w-4 h-4 text-blue-600 fill-blue-600" /> Word Ninja (Falling Words)
            </h1>
            <span className="text-xs text-slate-500">Type words before they touch the ground!</span>
          </div>
        </div>

        {/* Lives & Score */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((heart) => (
              <Heart
                key={heart}
                className={`w-5 h-5 ${
                  heart <= lives ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
                } transition-all`}
              />
            ))}
          </div>

          <div className="bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-200 font-mono shadow-xs">
            <span className="text-xs text-slate-500 uppercase mr-2 font-bold">Score:</span>
            <span className="text-lg font-black text-blue-600">{score}</span>
          </div>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="flex-1 relative w-full overflow-hidden bg-gradient-to-b from-slate-100 via-[#f0f4f8] to-slate-200">
        {/* Falling Words */}
        {activeWords.map((w) => {
          const typedPart = w.word.slice(0, w.typed.length);
          const untypedPart = w.word.slice(w.typed.length);
          const isTargeted = w.typed.length > 0;

          return (
            <div
              key={w.id}
              style={{
                left: `${w.x}%`,
                top: `${w.y}%`,
              }}
              className={`absolute -translate-x-1/2 px-3.5 py-1.5 rounded-xl text-base sm:text-lg font-mono font-bold tracking-wider shadow-md transition-all duration-75 border ${
                isTargeted
                  ? 'bg-blue-600 border-blue-500 text-white shadow-blue-300 scale-110 z-10 ring-2 ring-blue-300'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <span className={isTargeted ? 'text-amber-300 font-black' : 'text-blue-600 font-black'}>{typedPart}</span>
              <span className={isTargeted ? 'text-white' : 'text-slate-800'}>{untypedPart}</span>
            </div>
          );
        })}

        {/* Lava / Danger Line at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-rose-500/20 via-rose-500/10 to-transparent border-t border-rose-400 flex items-center justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-700">
            Defend the perimeter
          </span>
        </div>

        {/* Game Over / Victory Modal */}
        {(gameOver || gameWon) && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-30">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl text-center max-w-sm w-full animate-in zoom-in-95">
              {gameWon ? (
                <>
                  <Trophy className="w-14 h-14 text-amber-500 fill-amber-300 mx-auto mb-3" />
                  <h2 className="text-2xl font-black text-slate-900 mb-1">Victory!</h2>
                  <p className="text-xs text-slate-500 mb-4">You sliced all falling words like a true Ninja!</p>
                </>
              ) : (
                <>
                  <RotateCcw className="w-14 h-14 text-rose-500 mx-auto mb-3" />
                  <h2 className="text-2xl font-black text-slate-900 mb-1">Game Over</h2>
                  <p className="text-xs text-slate-500 mb-4">You cleared {wordsCleared} words. Keep practicing!</p>
                </>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6 flex justify-around">
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Final Score</div>
                  <div className="text-2xl font-black text-blue-600 font-mono">{score}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Words Cleared</div>
                  <div className="text-2xl font-black text-emerald-600 font-mono">{wordsCleared}</div>
                </div>
              </div>

              <button
                onClick={handleFinishGame}
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
