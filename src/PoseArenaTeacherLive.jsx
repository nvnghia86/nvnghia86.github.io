import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { useTranslation } from 'react-i18next';
import QuestionMedia from './QuestionMedia';
import PoseGestureIllustration from './PoseGestureIllustration';
import PoseArenaSummary from './PoseArenaSummary';
import PoseCelebration from './PoseCelebration';
import GameAudioControls from './GameAudioControls';
import { useGameAudio } from './use-game-audio';
import {
  HOLD_MS,
  POSE_DETECTION_INTERVAL_MS,
  POSE_LANDMARKER_OPTIONS,
  classifyGesture,
  getQuestionGestures,
  hasPlayableBodyPose,
  isPoseInputReady,
} from './pose-gesture-library';
import './pose-arena-game.css';

const HOLD_SECONDS = (HOLD_MS / 1000).toFixed(1);
const AUTO_ADVANCE_MS = 1200;

export default function PoseArenaTeacherLive({ room, formTimeLimit, onAction, onCheckAnswer, onError, onExit, fullscreen, onToggleFullscreen, containerRef }) {
  const { t } = useTranslation();
  const [cameraState, setCameraState] = useState('idle');
  const [modelState, setModelState] = useState('loading');
  const [bodyReady, setBodyReady] = useState(false);
  const [detected, setDetected] = useState(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [lockedIndex, setLockedIndex] = useState(null);
  const [lockedResult, setLockedResult] = useState(null);
  const [hostResults, setHostResults] = useState({});
  const [hint, setHint] = useState(t('poseArena:hintCameraStart'));
  const [customMusic, setCustomMusic] = useState(null);
  const sound = useGameAudio();
  const videoRef = useRef(null);
  const customAudioRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const cameraRequestRef = useRef(false);
  const trackingRef = useRef({ lastVideoTime: -1 });
  const holdRef = useRef({ key: null, startedAt: 0, fired: false });
  const advanceTimerRef = useRef(null);
  const question = room.currentQuestionData;
  const questionIndex = question?.index ?? null;
  const previousAudioStateRef = useRef({ status: room.status, questionIndex });
  const options = (question?.options || []).slice(0, 4);
  const assignment = useMemo(() => questionIndex === null ? [] : getQuestionGestures(room.code, questionIndex, 4), [room.code, questionIndex]);
  const leaderboard = useMemo(() => [...(room.leaderboard || room.players || [])].sort((left, right) => Number(right.score || 0) - Number(left.score || 0)), [room.leaderboard, room.players]);
  const cameraPlayable = isPoseInputReady(cameraState, modelState, bodyReady);
  const gestureLabel = useCallback((key, field) => t(`poseArena:gestures.${key}.${field}`), [t]);

  useEffect(() => {
    let disposed = false;
    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
        const base = POSE_LANDMARKER_OPTIONS;
        let model;
        try { model = await PoseLandmarker.createFromOptions(vision, { ...base, baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate: 'GPU' } }); }
        catch { model = await PoseLandmarker.createFromOptions(vision, { ...base, baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate: 'CPU' } }); }
        if (disposed) { model.close(); return; }
        landmarkerRef.current = model;
        setModelState('ready');
      } catch { if (!disposed) setModelState('missing'); }
    }
    loadModel();
    return () => { disposed = true; landmarkerRef.current?.close(); landmarkerRef.current = null; };
  }, []);

  const startCamera = useCallback(async () => {
    if (cameraState === 'ready' || cameraRequestRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) { setCameraState('unsupported'); return; }
    cameraRequestRef.current = true;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = media;
      videoRef.current.srcObject = media;
      await videoRef.current.play();
      media.getVideoTracks()[0]?.addEventListener('ended', () => { cameraRequestRef.current = false; setCameraState('idle'); setBodyReady(false); }, { once: true });
      setCameraState('ready');
      setHint(t('poseArena:hintStepBack', { seconds: HOLD_SECONDS }));
    } catch {
      cameraRequestRef.current = false;
      setCameraState('denied');
      setHint(t('poseArena:hintNoPermission'));
    }
  }, [cameraState, t]);

  useEffect(() => { if (cameraState === 'idle') startCamera(); }, [cameraState, startCamera]);
  useEffect(() => () => streamRef.current?.getTracks().forEach(track => track.stop()), []);
  useEffect(() => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = null;
    setDetected(null); setHoldProgress(0); setLockedIndex(null); setLockedResult(null);
    holdRef.current = { key: null, startedAt: 0, fired: false };
  }, [questionIndex]);
  useEffect(() => () => { if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current); }, []);

  useEffect(() => {
    sound.audio.setMusic(room.status === 'playing' && !customMusic ? 'quiz' : null);
    return () => sound.audio.setMusic(null);
  }, [customMusic, room.status, sound.audio]);

  useEffect(() => {
    const previous = previousAudioStateRef.current;
    if (previous.status === 'lobby' && room.status === 'playing') sound.audio.play('start');
    else if (previous.status !== 'finished' && room.status === 'finished') sound.audio.play('success');
    else if (room.status === 'playing' && previous.questionIndex !== questionIndex) sound.audio.play('question');
    previousAudioStateRef.current = { status: room.status, questionIndex };
  }, [questionIndex, room.status, sound.audio]);

  useEffect(() => {
    const audio = customAudioRef.current;
    if (!audio) return;
    audio.volume = sound.settings.volume;
    audio.muted = !sound.settings.enabled || !sound.settings.music || sound.settings.volume <= 0;
    if (customMusic && room.status === 'playing' && !audio.muted) void audio.play().catch(() => {});
    else if (audio.hasAttribute('src')) audio.pause();
  }, [customMusic, room.status, sound.settings]);

  useEffect(() => () => { if (customMusic?.url) URL.revokeObjectURL(customMusic.url); }, [customMusic]);

  function chooseMusic(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|aac)$/i.test(file.name)) return;
    const url = URL.createObjectURL(file);
    if (customAudioRef.current) {
      customAudioRef.current.src = url;
      customAudioRef.current.load();
      customAudioRef.current.volume = sound.settings.volume;
      customAudioRef.current.muted = !sound.settings.enabled || !sound.settings.music;
      if (room.status === 'playing' && !customAudioRef.current.muted) void customAudioRef.current.play().catch(() => {});
    }
    setCustomMusic(previous => {
      if (previous?.url) URL.revokeObjectURL(previous.url);
      return { name: file.name, url };
    });
  }

  function clearMusic() {
    customAudioRef.current?.pause();
    customAudioRef.current?.removeAttribute('src');
    setCustomMusic(previous => { if (previous?.url) URL.revokeObjectURL(previous.url); return null; });
  }

  const confirmHostAnswer = useCallback(async (index, gestureKey) => {
    try {
      const result = await onCheckAnswer(index);
      if (Number(result.questionIndex) !== Number(questionIndex)) return;
      const correct = Boolean(result.correct);
      setLockedResult(correct ? 'correct' : 'wrong');
      setHostResults(previous => Object.prototype.hasOwnProperty.call(previous, questionIndex) ? previous : { ...previous, [questionIndex]: correct });
      setHint(`${t(correct ? 'poseArena:teacherCorrect' : 'poseArena:teacherWrong')} · ${t('poseArena:teacherDetectedAdvance', { letter: String.fromCharCode(65 + index), gesture: gestureLabel(gestureKey, 'title'), seconds: (AUTO_ADVANCE_MS / 1000).toFixed(1) })}`);
      if (correct) sound.audio.play('correct');
      advanceTimerRef.current = window.setTimeout(() => { advanceTimerRef.current = null; void onAction('next'); }, AUTO_ADVANCE_MS);
    } catch (error) {
      setLockedIndex(null);
      setLockedResult(null);
      setDetected(null);
      setHoldProgress(0);
      holdRef.current = { key: null, startedAt: 0, fired: false };
      setHint(t('poseArena:teacherCheckFailed'));
      onError?.(error.message);
    }
  }, [gestureLabel, onAction, onCheckAnswer, onError, questionIndex, sound.audio, t]);

  useEffect(() => {
    let timer;
    function detect() {
      const video = videoRef.current;
      const model = landmarkerRef.current;
      if (room.status !== 'playing' || cameraState !== 'ready' || !video || !model || lockedIndex !== null) return;
      try {
        if (video.currentTime === trackingRef.current.lastVideoTime) return;
        trackingRef.current.lastVideoTime = video.currentTime;
        const landmarks = model.detectForVideo(video, performance.now()).landmarks?.[0] || null;
        if (!landmarks || !hasPlayableBodyPose(landmarks)) {
          setBodyReady(false); setDetected(null); setHoldProgress(0);
          holdRef.current = { key: null, startedAt: 0, fired: false };
          setHint(landmarks ? t('poseArena:hintFullBody') : t('poseArena:hintNotInFrame'));
          return;
        }
        setBodyReady(true);
        const key = classifyGesture(landmarks);
        const index = assignment.findIndex(item => item.key === key);
        const active = index >= 0 ? key : null;
        setDetected(active);
        const hold = holdRef.current;
        const now = performance.now();
        if (active !== hold.key) {
          holdRef.current = { key: active, startedAt: active ? now : 0, fired: false };
          setHoldProgress(0);
          if (active) setHint(t('poseArena:hintHoldMore', { gesture: gestureLabel(active, 'title'), seconds: HOLD_SECONDS }));
        } else if (active && !hold.fired) {
          const progress = Math.min(1, (now - hold.startedAt) / HOLD_MS);
          setHoldProgress(progress);
          if (progress >= 1) {
            hold.fired = true;
            setLockedIndex(index);
            sound.audio.play('scan');
            void confirmHostAnswer(index, active);
          }
        }
      } catch { /* skip one camera frame */ }
    }
    if (cameraState === 'ready' && modelState === 'ready') timer = window.setInterval(detect, POSE_DETECTION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [assignment, cameraState, confirmHostAnswer, gestureLabel, lockedIndex, modelState, room.status, sound.audio, t]);

  function renderOption(option, index) {
    const gesture = assignment[index];
    const active = detected && gesture?.key === detected;
    const locked = lockedIndex === index;
    const letter = String.fromCharCode(65 + index);
    return <article className={`pose-option option-${index} ${active ? 'armed' : ''} ${locked ? 'teacher-locked' : ''} ${locked ? lockedResult || '' : ''}`} style={gesture ? { '--gesture-color': gesture.color } : undefined}>
      <div className="pose-option-gesture"><b>{letter}</b>{gesture && <PoseGestureIllustration gestureKey={gesture.key} />}</div>
      <div className="pose-option-copy">{gesture && <span className="pose-gesture-chip">{gestureLabel(gesture.key, 'hint')}</span>}<strong>{option}</strong>{locked && <em>{lockedResult ? t(lockedResult === 'correct' ? 'poseArena:teacherCorrect' : 'poseArena:teacherWrong') : t('poseArena:teacherSelected')}</em>}</div>
      {active && lockedIndex === null && <div className="pose-hold"><i style={{ width: `${Math.round(holdProgress * 100)}%` }} /></div>}
    </article>;
  }

  if (room.status === 'finished') {
    const totalQuestions = room.summary?.questionCount || room.questionCount || 0;
    const correctCount = Object.values(hostResults).filter(Boolean).length;
    return <section className={`content-page pose-arena-page pose-teacher-live pose-arena-finished ${fullscreen ? 'is-fullscreen' : ''}`} ref={containerRef}>
      <div className="pose-topbar"><div className="pose-brand"><span className="pose-brand-icon">◉</span><div><h1>{room.title}</h1><p>{t('poseArena:teacherRoomMeta', { code: room.code, count: room.players?.length || 0 })}</p></div></div><div className="pose-status"><button type="button" className="pose-pill fullscreen" onClick={onToggleFullscreen}>{fullscreen ? t('poseArena:fullscreenOff') : t('poseArena:fullscreenOn')}</button></div></div>
      {fullscreen && <button type="button" className="pose-fullscreen-exit" onClick={onToggleFullscreen}>{t('poseArena:fullscreenOff')}</button>}
      <PoseArenaSummary correctCount={correctCount} questionCount={totalQuestions} players={leaderboard} onExit={onExit} />
    </section>;
  }

  return <section className={`content-page pose-arena-page pose-teacher-live ${fullscreen ? 'is-fullscreen' : ''}`} ref={containerRef}>
    <div className="pose-topbar"><div className="pose-brand"><span className="pose-brand-icon">◉</span><div><h1>{room.title}</h1><p>{t('poseArena:teacherRoomMeta', { code: room.code, count: room.players?.length || 0 })}</p></div></div><div className="pose-status"><span className="pose-pill">{t('poseArena:questionProgress', { current: Number(questionIndex || 0) + 1, total: room.questionCount || 0 })}</span><span className="pose-pill timer">{t('poseArena:timeLeft', { seconds: room.timeRemaining ?? formTimeLimit })}</span><span className={`pose-pill camera ${cameraState}`}>{cameraPlayable ? t('poseArena:cameraTracking') : t('poseArena:cameraOff')}</span><button type="button" className="pose-pill fullscreen" onClick={onToggleFullscreen}>{fullscreen ? t('poseArena:fullscreenOff') : t('poseArena:fullscreenOn')}</button></div></div>
    {fullscreen && <button type="button" className="pose-fullscreen-exit" onClick={onToggleFullscreen}>{t('poseArena:fullscreenOff')}</button>}
    <div className="pose-question-banner"><span>{t('poseArena:questionTag')}</span>{question ? <><p>{question.question}</p><QuestionMedia question={question} /></> : <p>{t('poseArena:waitingHint')}</p>}</div>
    <div className="pose-play-layout">
      <div className="pose-answer-slot slot-a">{options[0] !== undefined && renderOption(options[0], 0)}</div><div className="pose-answer-slot slot-b">{options[1] !== undefined && renderOption(options[1], 1)}</div>
      <main className="pose-stage">
        <div className="pose-stage-meta"><span>{t('poseArena:liveTag')}</span><b className={cameraPlayable ? 'ready' : ''}>{cameraPlayable ? t('poseArena:trackingReady') : cameraState !== 'ready' ? t('poseArena:cameraRequired') : t('poseArena:fitBody')}</b></div>
        <div className="pose-camera-frame"><video ref={videoRef} muted playsInline /><div className="pose-guide-frame" />{cameraState !== 'ready' && <div className="camera-placeholder"><span>◉</span><b>{t('poseArena:cameraRequiredTitle')}</b><small>{t('poseArena:cameraStartHint')}</small></div>}{cameraState === 'ready' && modelState === 'ready' && !bodyReady && <div className="camera-fit-warning"><b>{t('poseArena:fitBodyTitle')}</b><small>{t('poseArena:fitBodyHint')}</small></div>}{detected && <div className="pose-detected-badge">{t('poseArena:detectedBadge', { gesture: gestureLabel(detected, 'title') })}</div>}</div>
        {cameraState !== 'ready' && <button className="camera-button" type="button" onClick={startCamera}>{t('poseArena:cameraOn')}</button>}
        <p className="pose-hint">{hint}</p>
        <div className="pose-audio-panel">
          <GameAudioControls settings={sound.settings} onSettingsChange={sound.onSettingsChange} />
          <label className="pose-audio-upload">{t('poseArena:musicUpload')}<input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/aac,.mp3,.wav,.ogg,.m4a,.aac" onChange={chooseMusic} /></label>
          {customMusic && <span className="pose-audio-file"><b title={customMusic.name}>{customMusic.name}</b><button type="button" onClick={clearMusic}>{t('poseArena:musicDefault')}</button></span>}
          <audio ref={customAudioRef} src={customMusic?.url || undefined} loop preload="metadata" />
        </div>
        <div className="pose-host-actions"><button className="secondary-button" type="button" onClick={() => onAction('start')} disabled={room.status !== 'lobby'}>{t('poseArena:teacherStart')}</button><button className="primary-button" type="button" onClick={() => onAction('next')} disabled={room.status !== 'playing' || lockedIndex !== null}>{t('poseArena:teacherNext')}</button><button className="text-button" type="button" onClick={onExit}>{t('poseArena:teacherEnd')}</button></div>
      </main>
      <div className="pose-answer-slot slot-c">{options[2] !== undefined && renderOption(options[2], 2)}</div><div className="pose-answer-slot slot-d">{options[3] !== undefined && renderOption(options[3], 3)}</div>
    </div>
    <div className="pose-teacher-gesture-map" aria-label={t('poseArena:teacherGestureMap')}>{assignment.map((gesture, index) => <span key={gesture.key}><b>{String.fromCharCode(65 + index)}</b>{gestureLabel(gesture.key, 'cue')}</span>)}</div>
    <details className="pose-teacher-players"><summary><span>{t('cardScan.leaderboard')}</span><b>{t('poseArena:teacherPlayerCount', { count: leaderboard.length })}</b></summary><div>{leaderboard.length ? leaderboard.map((item, index) => <span key={item.id}><b>#{index + 1}</b><em>{item.nickname}</em><strong>{item.score || 0}</strong></span>) : <small>{t('cardScan.noScores')}</small>}</div></details>
    {lockedResult === 'correct' && <PoseCelebration burstKey={questionIndex} />}
  </section>;
}

