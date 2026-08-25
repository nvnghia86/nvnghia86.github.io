import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Lesson, LessonResult, UserSettings } from '../types';
import { VirtualKeyboard } from './VirtualKeyboard';
import { HandGuide } from './HandGuide';
import { soundEngine } from '../utils/soundEngine';
import { useTranslation } from '../i18n';
import { LanguageSelector } from './LanguageSelector';
import {
  normalizeNFC,
  telexKeysForChar,
  isVietnameseText,
  samePhysicalChar,
  TELEX_VOWEL_RULES,
  TELEX_TONE_RULES,
  tokenizeLine,
  evaluateLineProgress,
  convertPhysicalKeysToComposedText,
  resolveActualKeys,
} from '../utils/vietnameseTelex';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Keyboard as KeyboardIcon,
  Hand,
  ArrowLeft,
  Timer,
  Zap,
  Target,
  Pause,
  Play,
  HelpCircle,
  BookOpen,
  X,
  Sparkles,
} from 'lucide-react';

interface TypingEngineProps {
  lesson: Lesson;
  settings: UserSettings;
  onFinish: (result: LessonResult) => void;
  onBack: () => void;
  onUpdateSettings: (settings: Partial<UserSettings>) => void;
}

export const TypingEngine: React.FC<TypingEngineProps> = ({
  lesson,
  settings,
  onFinish,
  onBack,
  onUpdateSettings,
}) => {
  const { t, language } = useTranslation();

  // Current exercise line index within lesson.content
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // Physical keystrokes tracking for current line
  const [typedPhysicalKeys, setTypedPhysicalKeys] = useState<string[]>([]);
  const [physicalErrors, setPhysicalErrors] = useState<Set<number>>(new Set());

  // Aggregated performance across all lines in this lesson
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [wrongKeysMap, setWrongKeysMap] = useState<Record<string, number>>({});

  // Timing
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  // Live Metrics
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  // Physical keyboard tracking
  const [activePressedKeyCode, setActivePressedKeyCode] = useState<string>('');
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  // Telex Guide Modal
  const [showTelexGuide, setShowTelexGuide] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // Normalize current line
  const rawCurrentLine = lesson.content[currentLineIndex] || '';
  const currentLine = normalizeNFC(rawCurrentLine);

  // Tokenize line for flexible multi-sequence Telex parsing
  const tokens = useMemo(() => tokenizeLine(currentLine), [currentLine]);
  const targetChars = useMemo(() => [...currentLine], [currentLine]);

  // Real-time evaluated typing state
  const lineState = useMemo(() => {
    return evaluateLineProgress(currentLine, tokens, typedPhysicalKeys, physicalErrors);
  }, [currentLine, tokens, typedPhysicalKeys, physicalErrors]);

  const currentKeyIndex = typedPhysicalKeys.length;
  const currentCharIndex = lineState.currentCharIndex;
  const nextExpectedPhysicalKey = lineState.nextExpectedKey;
  const currentTargetChar = targetChars[currentCharIndex] || '';

  // Check if current exercise has Vietnamese characters
  const isVietnameseContent = useMemo(() => {
    return isVietnameseText(currentLine);
  }, [currentLine]);

  // Configure sound
  useEffect(() => {
    soundEngine.setSoundTheme(settings.soundTheme);
    soundEngine.setVolume(settings.volume);
  }, [settings.soundTheme, settings.volume]);

  // Focus container or hidden input on mount
  useEffect(() => {
    containerRef.current?.focus();
    hiddenInputRef.current?.focus();
  }, [lesson.id, currentLineIndex]);

  // Timer interval
  useEffect(() => {
    if (!isStarted || isPaused) return;

    const interval = setInterval(() => {
      if (startTime) {
        const seconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(seconds);

        // Calculate WPM: (correctKeystrokes / 5) / (seconds / 60)
        const words = correctKeystrokes / 5;
        const minutes = seconds / 60;
        const calculatedWpm = Math.round(words / minutes);
        setLiveWpm(Math.max(0, calculatedWpm));

        // Calculate Accuracy based on physical keystrokes
        const acc =
          totalKeystrokes > 0
            ? Math.round((correctKeystrokes / totalKeystrokes) * 100)
            : 100;
        setLiveAccuracy(acc);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isStarted, isPaused, startTime, correctKeystrokes, totalKeystrokes]);

  const handleReset = useCallback(() => {
    setCurrentLineIndex(0);
    setTypedPhysicalKeys([]);
    setPhysicalErrors(new Set());
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setErrorCount(0);
    setWrongKeysMap({});
    setStartTime(null);
    setElapsedSeconds(0);
    setIsStarted(false);
    setIsPaused(false);
    setLiveWpm(0);
    setLiveAccuracy(100);
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
    containerRef.current?.focus();
  }, []);

  // Complete the entire lesson
  const completeLesson = useCallback(
    (
      finalTotalKeys: number,
      finalCorrectKeys: number,
      finalErrors: number,
      finalWrongMap: Record<string, number>
    ) => {
      const now = Date.now();
      const duration = startTime ? Math.max(1, Math.floor((now - startTime) / 1000)) : 1;
      const finalAccuracy =
        finalTotalKeys > 0 ? Math.round((finalCorrectKeys / finalTotalKeys) * 100) : 100;
      const finalWpm = Math.max(1, Math.round(finalCorrectKeys / 5 / (duration / 60)));
      const rawWpm = Math.max(1, Math.round(finalTotalKeys / 5 / (duration / 60)));

      // Calculate Stars based on strict pedagogical rules
      let stars = 1;
      if (finalAccuracy >= 85) stars = 2;
      if (finalAccuracy >= 90 && finalWpm >= lesson.targetWpm * 0.8) stars = 3;
      if (finalAccuracy >= 95 && finalWpm >= lesson.targetWpm) stars = 4;
      if (finalAccuracy >= 98 && finalWpm >= lesson.targetWpm + 5) stars = 5;

      const result: LessonResult = {
        lessonId: lesson.id,
        stars,
        wpm: finalWpm,
        rawWpm,
        accuracy: finalAccuracy,
        timeSeconds: duration,
        errorCount: finalErrors,
        wrongKeys: finalWrongMap,
        completedAt: new Date().toISOString(),
      };

      onFinish(result);
    },
    [lesson, startTime, onFinish]
  );

  // Advance to next line or finish lesson
  const advanceLine = useCallback(
    (
      newTotalKeys: number,
      newCorrectKeys: number,
      newErrors: number,
      newWrongMap: Record<string, number>
    ) => {
      if (currentLineIndex + 1 < lesson.content.length) {
        setCurrentLineIndex((prev) => prev + 1);
        setTypedPhysicalKeys([]);
        setPhysicalErrors(new Set());
        if (hiddenInputRef.current) {
          hiddenInputRef.current.value = '';
        }
      } else {
        // All lines finished!
        completeLesson(newTotalKeys, newCorrectKeys, newErrors, newWrongMap);
      }
    },
    [currentLineIndex, lesson.content.length, completeLesson]
  );

  // Key Down Listener for physical keyboard typing with flexible Telex sequence validation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isPaused) return;

      // Detect Caps Lock state
      setIsCapsLockOn(e.getModifierState('CapsLock'));
      setActivePressedKeyCode(e.code);

      // Handle Tab or Esc to restart
      if (e.key === 'Tab' || e.key === 'Escape') {
        e.preventDefault();
        handleReset();
        return;
      }

      // Ignore modifier keys
      if (
        [
          'Shift',
          'Control',
          'Alt',
          'Meta',
          'CapsLock',
          'ContextMenu',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
        ].includes(e.key)
      ) {
        return;
      }

      // Prevent space scrolling
      if (e.key === ' ') {
        e.preventDefault();
      }

      // Handle Backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
        // Ignore synthetic Backspace generated under-the-hood by OS IMEs (Unikey / EVKey)
        // Real physical user Backspace keypress always has e.code === 'Backspace'
        if (e.code !== 'Backspace' || e.nativeEvent.isComposing || isComposingRef.current) {
          return;
        }
        if (typedPhysicalKeys.length > 0) {
          const newKeys = typedPhysicalKeys.slice(0, -1);
          const newErrors = new Set(physicalErrors);
          newErrors.delete(typedPhysicalKeys.length - 1);

          setTypedPhysicalKeys(newKeys);
          setPhysicalErrors(newErrors);
          soundEngine.playKeyClick(false);
        }
        return;
      }

      // Only accept single printable characters or composed Vietnamese characters
      if (e.key.length > 1 && !isVietnameseText(e.key) && e.key !== ' ') {
        return;
      }

      // Start timer on first valid key
      if (!isStarted) {
        setIsStarted(true);
        setStartTime(Date.now());
      }

      const activeToken = lineState.activeToken;
      const actualKey = e.key;
      const newTotalKeys = totalKeystrokes + 1;
      setTotalKeystrokes(newTotalKeys);

      if (!activeToken) {
        // Line already finished
        return;
      }

      const keysInCurrentToken = typedPhysicalKeys.slice(lineState.tokenStartKeyPtr);
      const resolvedKeys = resolveActualKeys(actualKey, keysInCurrentToken);
      const candidateKeys = [...keysInCurrentToken, ...resolvedKeys];

      // 1. Check if candidateKeys matches any valid sequence for the current active token
      const matchingSequence = activeToken.sequences.find((seq) => {
        if (candidateKeys.length > seq.length) return false;
        return candidateKeys.every((k, i) => samePhysicalChar(k, seq[i]));
      });

      if (matchingSequence) {
        // MATCH!
        soundEngine.playKeyClick(actualKey === ' ');
        const newCorrectKeys = correctKeystrokes + resolvedKeys.length;
        setCorrectKeystrokes(newCorrectKeys);

        const newKeys = [...typedPhysicalKeys, ...resolvedKeys];
        setTypedPhysicalKeys(newKeys);

        // If this token was completed and it was the last token of the line
        const composedCand = convertPhysicalKeysToComposedText(candidateKeys);
        const isTokenComplete =
          candidateKeys.length >= matchingSequence.length &&
          (samePhysicalChar(composedCand, activeToken.text) || candidateKeys.length === matchingSequence.length);

        if (isTokenComplete && lineState.currentTokenIndex + 1 >= tokens.length) {
          advanceLine(newTotalKeys, newCorrectKeys, errorCount, wrongKeysMap);
        }
        return;
      }

      // 2. Full direct token/character match (e.g. Unikey / IME directly typed 'ăn', 'uống', 'đ')
      if (samePhysicalChar(actualKey, activeToken.text)) {
        const fullSeq = activeToken.sequences[0] || [actualKey];
        const remainingKeys = fullSeq.slice(keysInCurrentToken.length);
        const addedCount = Math.max(1, remainingKeys.length);

        soundEngine.playKeyClick(false);
        const newCorrectKeys = correctKeystrokes + addedCount;
        setCorrectKeystrokes(newCorrectKeys);

        const newKeys = [
          ...typedPhysicalKeys,
          ...(remainingKeys.length > 0 ? remainingKeys : [actualKey]),
        ];
        setTypedPhysicalKeys(newKeys);

        if (lineState.currentTokenIndex + 1 >= tokens.length) {
          advanceLine(newTotalKeys, newCorrectKeys, errorCount, wrongKeysMap);
        }
        return;
      }

      // 3. Wrong Keystroke!
      soundEngine.playError();
      const newErrorCount = errorCount + 1;
      setErrorCount(newErrorCount);

      const newErrors = new Set(physicalErrors);
      for (let i = 0; i < resolvedKeys.length; i++) {
        newErrors.add(typedPhysicalKeys.length + i);
      }
      setPhysicalErrors(newErrors);

      const expectedKey =
        lineState.nextExpectedKey || activeToken.sequences[0]?.[0] || actualKey;
      const newWrongMap = {
        ...wrongKeysMap,
        [expectedKey]: (wrongKeysMap[expectedKey] || 0) + 1,
      };
      setWrongKeysMap(newWrongMap);

      const newKeys = [...typedPhysicalKeys, ...resolvedKeys];
      setTypedPhysicalKeys(newKeys);
    },
    [
      isPaused,
      isStarted,
      lineState,
      tokens.length,
      typedPhysicalKeys,
      physicalErrors,
      totalKeystrokes,
      correctKeystrokes,
      errorCount,
      wrongKeysMap,
      handleReset,
      advanceLine,
    ]
  );

  const handleKeyUp = useCallback(() => {
    setActivePressedKeyCode('');
  }, []);

  // IME Composition handling
  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const composedData = normalizeNFC(e.data);
    if (!composedData) return;

    setTimeout(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = '';
      }
    }, 0);
  };

  const fontSizeClass = {
    small: 'text-xl sm:text-2xl',
    medium: 'text-2xl sm:text-3xl',
    large: 'text-3xl sm:text-4xl',
    huge: 'text-4xl sm:text-5xl',
  }[settings.fontSize || 'large'];

  // Composed typed text for current exercise line
  const composedTypedText = useMemo(() => {
    const raw = typedPhysicalKeys.join('');
    if (isVietnameseContent) {
      return convertPhysicalKeysToComposedText(typedPhysicalKeys);
    }
    return raw;
  }, [typedPhysicalKeys, isVietnameseContent]);

  const composedTypedSegments = useMemo(() => {
    if (!composedTypedText) return [];
    const targetArray = [...currentLine];
    const typedArray = [...composedTypedText];

    return typedArray.map((char, idx) => {
      const isError =
        idx >= targetArray.length || !samePhysicalChar(char, targetArray[idx]);
      return { text: char, isError };
    });
  }, [composedTypedText, currentLine]);


  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onClick={() => {
        containerRef.current?.focus();
        hiddenInputRef.current?.focus();
      }}
      className="outline-none min-h-screen bg-[#f0f4f8] text-slate-800 flex flex-col justify-between selection:bg-blue-500/20 selection:text-blue-900 select-none pb-4 font-sans"
    >
      {/* Hidden input for IME and mobile compatibility */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="opacity-0 absolute -top-9999 left-0 w-1 h-1 pointer-events-none"
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        tabIndex={-1}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* Top Header Bar */}
      <header className="w-full bg-white border-b border-slate-200 px-4 sm:px-8 py-2.5 h-[64px] flex items-center justify-between shadow-xs">
        {/* Left: Back & Lesson Info */}
        <div className="flex items-center gap-3">
          <button
            id="back-to-course-btn"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold border border-slate-200 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t.common.back}</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                {language === 'vi' ? `Bài ${lesson.id}` : `Lesson ${lesson.id}`}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {lesson.title}
              </h1>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-sm hidden md:block">
              {lesson.description}
            </p>
          </div>
        </div>

        {/* Center: Live Stats HUD */}
        <div className="flex items-center gap-3 sm:gap-6 bg-slate-100 px-4 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
          {/* Live WPM */}
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <div>
              <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                {liveWpm}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 ml-1 font-bold">
                WPM
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Live Accuracy */}
          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-base sm:text-lg font-black text-slate-800 font-mono">
                {liveAccuracy}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 ml-1 font-bold">
                {language === 'vi' ? 'ĐCX' : 'ACC'}
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Live Time */}
          <div className="hidden sm:flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-mono text-slate-700 font-bold">
              {Math.floor(elapsedSeconds / 60)}:
              {(elapsedSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Telex Reference Guide Toggle */}
          <button
            id="telex-guide-toggle-btn"
            onClick={() => setShowTelexGuide(true)}
            title={language === 'vi' ? 'Bảng quy tắc gõ Telex' : 'Telex Typing Rules'}
            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all flex items-center gap-1 text-xs font-bold shadow-xs cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span className="hidden lg:inline">{language === 'vi' ? 'Quy tắc Telex' : 'Telex Guide'}</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector variant="compact" />

          {/* Pause / Resume */}
          <button
            id="pause-typing-btn"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? t.typingEngine.resume : t.typingEngine.paused}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 shadow-xs cursor-pointer"
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>

          {/* Reset Lesson */}
          <button
            id="reset-typing-btn"
            onClick={handleReset}
            title={t.typingEngine.restartLesson}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-amber-600 transition-all border border-slate-200 shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Toggle Sound */}
          <button
            id="sound-toggle-btn"
            onClick={() =>
              onUpdateSettings({
                soundTheme: settings.soundTheme === 'mute' ? 'mechanical' : 'mute',
              })
            }
            title="Sound Feedback"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 shadow-xs cursor-pointer"
          >
            {settings.soundTheme === 'mute' ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            )}
          </button>

          {/* Toggle Keyboard */}
          <button
            id="keyboard-toggle-btn"
            onClick={() => onUpdateSettings({ showKeyboard: !settings.showKeyboard })}
            title={t.typingEngine.keyboardGuide}
            className={`p-2 rounded-xl border transition-all shadow-xs cursor-pointer ${
              settings.showKeyboard
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <KeyboardIcon className="w-4 h-4" />
          </button>

          {/* Toggle Hands */}
          <button
            id="hands-toggle-btn"
            onClick={() => onUpdateSettings({ showHands: !settings.showHands })}
            title={t.typingEngine.handGuide}
            className={`p-2 rounded-xl border transition-all hidden sm:flex shadow-xs cursor-pointer ${
              settings.showHands
                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Progress Dots / Lines Indicator */}
      <div className="w-full max-w-4xl mx-auto px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {language === 'vi'
              ? `Dòng ${currentLineIndex + 1} / ${lesson.content.length}`
              : `Exercise ${currentLineIndex + 1} of ${lesson.content.length}`}
          </span>
          <div className="flex items-center gap-1.5">
            {lesson.content.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx < currentLineIndex
                    ? 'w-6 bg-emerald-500'
                    : idx === currentLineIndex
                    ? 'w-8 bg-blue-600 animate-pulse'
                    : 'w-3 bg-slate-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-blue-600" />
          {language === 'vi' ? 'Mục tiêu:' : 'Goal:'}{' '}
          <span className="text-slate-800 font-bold">{lesson.targetWpm} WPM</span> (
          {language === 'vi' ? 'Độ chính xác' : 'Acc'}: {lesson.minAccuracy}%)
        </div>
      </div>

      {/* Main Typing Display Area */}
      <main className="flex-1 flex flex-col items-center justify-between px-3 sm:px-6 py-2 max-w-5xl mx-auto w-full gap-2.5">
        {/* Pause Banner */}
        {isPaused ? (
          <div className="text-center py-8 px-6 bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full my-auto animate-in fade-in zoom-in-95">
            <Pause className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-slate-800 mb-1">{t.typingEngine.paused}</h2>
            <p className="text-xs text-slate-500 mb-4">{t.typingEngine.smoothTypingTip}</p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-200 flex items-center gap-2 mx-auto cursor-pointer text-sm"
            >
              <Play className="w-4 h-4 fill-current" /> {t.typingEngine.resume}
            </button>
          </div>
        ) : (
          <>
            {/* Upper Row: Typing Prompt & Input Log (Left) + Hand Guide (Right) */}
            <div
              className={`w-full grid gap-2.5 items-stretch ${
                settings.showHands ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
              }`}
            >
              {/* Left Column: Typing Prompt & User Typed Input Log */}
              <div
                className={`flex flex-col gap-2 ${
                  settings.showHands ? 'lg:col-span-7 xl:col-span-8' : 'col-span-1'
                }`}
              >
                {/* 1. Target Typing Prompt Box */}
                <div
                  id="typing-prompt-box"
                  onClick={() => {
                    containerRef.current?.focus();
                    hiddenInputRef.current?.focus();
                  }}
                  className="w-full bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200 shadow-xs cursor-text relative overflow-hidden transition-all flex flex-col justify-between min-h-[120px]"
                >
                  {/* Persistent Top Helper / Telex Rule Bar (Fixed height, prevents layout jump) */}
                  <div className="h-7 mb-1.5 flex items-center justify-center gap-2 overflow-hidden select-none">
                    {lineState.activeToken && lineState.activeSequence.length > 1 ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {language === 'vi' ? 'Quy tắc gõ từ' : 'Telex keys for'}{' '}
                          <span className="font-bold text-slate-900 text-xs">
                            "{lineState.activeToken.text}"
                          </span>
                          :
                        </span>
                        <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 font-mono text-[11px] shadow-xs">
                          {lineState.activeSequence.map((k, kIdx) => {
                            const isSubTyped = kIdx < lineState.activeTokenKeyIndex;
                            const isSubCurrent = kIdx === lineState.activeTokenKeyIndex;
                            return (
                              <span
                                key={kIdx}
                                className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                                  isSubTyped
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isSubCurrent
                                    ? 'bg-[#42c998] text-slate-950 shadow-xs ring-2 ring-emerald-400'
                                    : 'bg-white text-slate-500 border border-slate-200'
                                }`}
                              >
                                {k}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-slate-500 text-[11px]">
                        {currentTargetChar === ' ' ? (
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="text-slate-400">
                              {language === 'vi' ? 'Phím tiếp theo' : 'Next key'}:
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-xs">
                              {language === 'vi' ? 'Phím cách (Space)' : 'Spacebar'}
                            </span>
                          </span>
                        ) : currentTargetChar ? (
                          <span className="flex items-center gap-1.5 font-medium">
                            <span className="text-slate-400">
                              {language === 'vi' ? 'Phím tiếp theo' : 'Next key'}:
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono font-bold text-xs">
                              {nextExpectedPhysicalKey || currentTargetChar}
                            </span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-xs">
                            {language === 'vi' ? '✓ Hoàn thành dòng này!' : '✓ Line completed!'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Target key characters stream */}
                  <div
                    className={`font-mono leading-relaxed text-center select-none ${fontSizeClass} flex flex-wrap items-center justify-center my-auto`}
                  >
                    {targetChars.map((char, index) => {
                      const status = lineState.charStatus[index] || 'pending';
                      const isCompleted = status === 'correct';
                      const isCurrent = status === 'current';
                      const hasError = status === 'error';

                      if (char === ' ') {
                        // Expanded, visually clear Space block with consistent fixed width across all states
                        let spaceClass =
                          'bg-slate-100/90 text-slate-400 border border-dashed border-slate-300';
                        if (isCompleted) {
                          spaceClass =
                            'bg-emerald-50 text-emerald-600 border border-emerald-300 font-medium';
                        } else if (hasError) {
                          spaceClass =
                            'bg-rose-500 text-white border border-rose-600 font-bold';
                        } else if (isCurrent) {
                          spaceClass =
                            'bg-[#42c998] text-slate-950 border border-[#2eb986] font-black shadow-xs';
                        }

                        return (
                          <span
                            key={index}
                            className={`inline-flex items-center justify-center min-w-[2em] sm:min-w-[2.4em] h-[1.25em] mx-1 px-1.5 py-0.5 rounded-lg text-xs font-sans ${spaceClass}`}
                            title="Spacebar"
                          >
                            ␣
                          </span>
                        );
                      }

                      // Regular character: fixed box so there's zero layout shift or sliding motion
                      let charStyle = 'text-slate-400 font-normal bg-transparent';
                      if (isCompleted) {
                        charStyle = 'text-emerald-600 font-bold bg-transparent';
                      } else if (hasError) {
                        charStyle = 'bg-rose-500 text-white font-bold shadow-xs';
                      } else if (isCurrent) {
                        charStyle = 'bg-[#42c998] text-slate-950 font-black shadow-xs';
                      }

                      return (
                        <span
                          key={index}
                          className={`inline-flex items-center justify-center min-w-[1.2ch] h-[1.25em] mx-[1px] px-0.5 py-0.5 rounded-md ${charStyle}`}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>

                  {/* Persistent Bottom Sub-prompt / Control Hint (Fixed height, prevents layout jump) */}
                  <div className="h-5 mt-1.5 text-center text-xs text-blue-600 font-sans font-medium flex items-center justify-center gap-1.5 overflow-hidden select-none">
                    {!isStarted ? (
                      <span className="flex items-center gap-1.5 animate-pulse text-blue-600 font-semibold">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                        {isVietnameseContent && language === 'vi'
                          ? 'Nhấn phím bất kỳ theo quy tắc Telex để bắt đầu gõ'
                          : t.typingEngine.pressToStart}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-normal">
                        {language === 'vi'
                          ? 'Mẹo: Nhấn Tab để bắt đầu lại dòng • Esc để tạm dừng'
                          : 'Tip: Press Tab to retry line • Esc to pause'}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. User Actual Typed Input Box (Hộp textbox ghi lại văn bản người dùng đã gõ dạng văn bản thuần) */}
                <div
                  id="user-typed-log-box"
                  onClick={() => {
                    containerRef.current?.focus();
                    hiddenInputRef.current?.focus();
                  }}
                  className="w-full bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200 shadow-xs cursor-text flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 font-heading">
                      <KeyboardIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t.typingEngine.typedLogTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span>
                        {composedTypedSegments.length} / {targetChars.length}{' '}
                        {language === 'vi' ? 'ký tự' : 'chars'}
                      </span>
                      {physicalErrors.size > 0 && (
                        <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          {physicalErrors.size} {language === 'vi' ? 'lỗi' : 'err'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full bg-slate-50/90 rounded-lg px-3 py-2 border border-slate-200/90 min-h-[38px] text-sm sm:text-base font-normal leading-relaxed text-slate-800 shadow-inner flex items-center">
                    {composedTypedSegments.length === 0 ? (
                      <span className="text-slate-400 italic text-xs sm:text-sm font-sans select-none">
                        {t.typingEngine.typedLogPlaceholder}
                      </span>
                    ) : (
                      <div className="font-body text-slate-800 text-sm sm:text-base whitespace-pre-wrap flex items-center flex-wrap">
                        {composedTypedSegments.map((segment, idx) => (
                          <span
                            key={idx}
                            className={
                              segment.isError
                                ? 'text-rose-600 font-medium underline decoration-rose-400'
                                : 'text-slate-800'
                            }
                          >
                            {segment.text}
                          </span>
                        ))}
                        <span className="inline-block w-0.5 h-4 sm:h-5 bg-blue-600 rounded-full animate-pulse ml-0.5 align-middle" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Hand Posture Guide (Mô phỏng tư thế tay gõ phím nhỏ gọn nằm ngang) */}
              {settings.showHands && (
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
                  <HandGuide
                    targetChar={nextExpectedPhysicalKey || currentTargetChar}
                    compact={true}
                    className="h-full min-h-[140px]"
                  />
                </div>
              )}
            </div>

            {/* Lower Row: Virtual Keyboard (Bàn phím ảo) */}
            {settings.showKeyboard && (
              <div className="w-full">
                <VirtualKeyboard
                  targetChar={nextExpectedPhysicalKey || currentTargetChar}
                  activePressedKey={activePressedKeyCode}
                  isCapsLock={isCapsLockOn}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer shortcut hints */}
      <footer className="w-full max-w-4xl mx-auto px-4 text-center text-[11px] text-slate-500 flex flex-wrap items-center justify-center gap-4">
        <span>
          {language === 'vi' ? 'Nhấn' : 'Press'}{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-xs font-semibold">
            Tab
          </kbd>{' '}
          {language === 'vi' ? 'hoặc' : 'or'}{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-xs font-semibold">
            Esc
          </kbd>{' '}
          {language === 'vi' ? 'để gõ lại' : 'to restart'}
        </span>
        <span>•</span>
        <span>
          {language === 'vi' ? 'Nhấn' : 'Press'}{' '}
          <kbd className="px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-xs font-semibold">
            Backspace
          </kbd>{' '}
          {language === 'vi' ? 'để sửa phím gõ sai' : 'to fix errors'}
        </span>
        <span>•</span>
        <span>
          {language === 'vi' ? 'Quy tắc Telex:' : 'Telex:'}{' '}
          <span className="font-semibold text-slate-700">aa=â, aw=ă, ee=ê, oo=ô, ow=ơ, uw=ư, dd=đ</span>
        </span>
      </footer>

      {/* Telex Reference Modal */}
      {showTelexGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-2xl w-full text-slate-800 flex flex-col relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowTelexGuide(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {language === 'vi'
                    ? 'Bảng Quy Tắc Gõ Tiếng Việt Telex'
                    : 'Vietnamese Telex Typing Rules'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'vi'
                    ? 'Chuẩn quy tắc gõ 10 ngón tiếng Việt theo chuẩn bàn phím QWERTY'
                    : 'Standard Vietnamese touch typing rules on QWERTY keyboard'}
                </p>
              </div>
            </div>

            {/* Vowels Section */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {language === 'vi' ? '1. Bảng Phím Nguyên Âm & Chữ Đ' : '1. Vowels & Letter Đ'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {TELEX_VOWEL_RULES.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-black text-blue-600 text-base bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {item.telex}
                      </span>
                      <span className="font-sans font-bold text-slate-900 text-lg">
                        = {item.result}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{item.example}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tone Marks Section */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                {language === 'vi' ? '2. Bảng Phím Dấu Thanh' : '2. Tone Marks'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {TELEX_TONE_RULES.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-black text-emerald-600 text-base bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                        {item.key}
                      </span>
                      <span className="font-sans font-bold text-slate-900 text-sm">
                        {item.tone}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{item.example}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Typing Tips */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed mb-4">
              <p className="font-bold mb-1 flex items-center gap-1.5">
                💡 {language === 'vi' ? 'Mẹo gõ 10 ngón tiếng Việt nhanh & chính xác:' : 'Pro Tip for Fast Typing:'}
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>
                  {language === 'vi'
                    ? 'Gõ các chữ cái gốc và nguyên âm trước, sau đó gõ phím dấu thanh ở cuối từ (Ví dụ: gõ "tiengs" để được "tiếng").'
                    : 'Type the base word first, then add the tone key at the end of the word.'}
                </li>
                <li>
                  {language === 'vi'
                    ? 'Ký tự "Đ" gõ bằng hai lần phím "D" (dd = đ, Dd = Đ).'
                    : 'Letter "Đ" is typed by pressing "D" twice (dd = đ).'}
                </li>
                <li>
                  {language === 'vi'
                    ? 'Để xóa dấu vừa gõ, có thể dùng phím "z" (Ví dụ: "toans" + "z" = "toan").'
                    : 'To remove a diacritic tone mark, press "z".'}
                </li>
              </ul>
            </div>

            <button
              onClick={() => setShowTelexGuide(false)}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-200 cursor-pointer"
            >
              {language === 'vi' ? 'Đã hiểu, Tiếp tục luyện tập' : 'Got it, Continue Practice'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
