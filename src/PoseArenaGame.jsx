import QuestionMedia from './QuestionMedia';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import './pose-arena-game.css';
import { GameRoomBuilder } from './GameRoomBuilder';
import PoseGestureIllustration from './PoseGestureIllustration';
import PoseGestureTestPage from './PoseGestureTestPage';
import PoseArenaSummary from './PoseArenaSummary';
import PoseCelebration from './PoseCelebration';
import { useGameAudio } from './use-game-audio';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import {
  HOLD_MS,
  POSE_DETECTION_INTERVAL_MS,
  POSE_LANDMARKER_OPTIONS,
  GESTURE_LIBRARY,
  classifyGesture,
  getQuestionGestures,
  hasPlayableBodyPose,
  isPoseInputReady,
} from './pose-gesture-library';

const initialForm = { code: '', nickname: '' };
const HOLD_SECONDS = (HOLD_MS / 1000).toFixed(1);

// Subset of MediaPipe's 33-point topology for the skeleton overlay.
const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28],
  [15, 17], [15, 19], [16, 18], [16, 20],
];

function lm(landmarks, index) {
  const point = landmarks?.[index];
  return point && Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
}

export function PoseArenaStudent({ api, API, EventSource, onError, student }) {
  const { t } = useTranslation();
  const sound = useGameAudio();
  const [form, setForm] = useState({ ...initialForm, nickname: student?.nickname || '' });
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [answerState, setAnswerState] = useState(null);
  const [cameraState, setCameraState] = useState('idle');
  const [modelState, setModelState] = useState('loading');
  const [modelError, setModelError] = useState('');
  const [detected, setDetected] = useState(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [hint, setHint] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [skeleton, setSkeleton] = useState(null);
  const [bodyReady, setBodyReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const landmarkerRef = useRef(null);
  const holdRef = useRef({ key: null, startedAt: 0, fired: false });
  const trackingRef = useRef({ lastVideoTime: -1 });
  const arenaRef = useRef(null);
  const cameraRequestRef = useRef(false);

  // Gesture label helpers (translation-driven).
  const gestureLabel = useCallback((key, field) => t(`poseArena:gestures.${key}.${field}`), [t]);

  useEffect(() => {
    if (!student?.nickname) return;
    setForm(previous => previous.nickname ? previous : { ...previous, nickname: student.nickname });
  }, [student?.nickname]);
  useEffect(() => { if (!hint) setHint(t('poseArena:hintCameraStart')); }, [hint, t]);

  const questionIndex = room?.currentQuestionData?.index ?? null;
  const optionCount = Math.min(4, (room?.currentQuestionData?.options || []).length || 4);

  // Deterministic gesture → option mapping for the current question. Seeded by
  // room code + question index so every player sees the same 4 gestures.
  const assignment = useMemo(() => {
    if (!room?.code || questionIndex === null) return [];
    return getQuestionGestures(room.code, questionIndex, optionCount);
  }, [room?.code, questionIndex, optionCount]);

  // Keep the latest assignment in a ref so the detection loop reads fresh data.
  const assignmentRef = useRef(assignment);
  useEffect(() => { assignmentRef.current = assignment; }, [assignment]);
  const cameraPlayable = isPoseInputReady(cameraState, modelState, bodyReady);

  useEffect(() => {
    sound.audio.setMusic(room?.status === 'playing' ? 'quiz' : null);
    return () => sound.audio.setMusic(null);
  }, [room?.status, sound.audio]);

  // ---- Model loading -------------------------------------------------
  useEffect(() => {
    let disposed = false;
    async function loadPose() {
      try {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
        const options = POSE_LANDMARKER_OPTIONS;
        let landmarker;
        try {
          landmarker = await PoseLandmarker.createFromOptions(vision, { ...options, baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate: 'GPU' } });
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(vision, { ...options, baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate: 'CPU' } });
        }
        if (disposed) { landmarker.close(); return; }
        landmarkerRef.current = landmarker;
        setModelState('ready');
      } catch (error) {
        if (!disposed) {
          setModelState('missing');
          setModelError(error?.message || 'Không tải được model nhận diện tư thế.');
        }
      }
    }
    loadPose();
    return () => { disposed = true; landmarkerRef.current?.close(); landmarkerRef.current = null; };
  }, []);

  // ---- Room API ------------------------------------------------------
  async function join(event) {
    event.preventDefault();
    try {
      const code = form.code.trim().toUpperCase();
      const result = await api(`/rooms/${code}/players`, { method: 'POST', body: JSON.stringify({ nickname: form.nickname.trim() }) });
      setPlayer(result.player);
      setRoom(result.room);
      setAnswerState(null);
      sourceRef.current?.close();
      const RoomEventSource = EventSource || window.EventSource;
      const source = new RoomEventSource(`${API}/rooms/${code}/events?playerId=${encodeURIComponent(result.player.id)}`);
      source.addEventListener('room', item => setRoom(JSON.parse(item.data)));
      sourceRef.current = source;
    } catch (error) { onError(error.message); }
  }

  const chooseAnswer = useCallback(async (index, source = 'pose') => {
    if (source !== 'pose' || !cameraPlayable) { setHint(t('poseArena:hintCameraRequired')); return; }
    const current = room?.currentQuestionData;
    if (!player) { setHint(t('poseArena:hintNoPlayer')); return; }
    if (!current) { setHint(t('poseArena:hintNoQuestion')); return; }
    if (room?.status !== 'playing') { setHint(t('poseArena:hintNoQuestion')); return; }
    if (answerState?.questionIndex === current.index) { setHint(t('poseArena:hintAlreadyAnswered')); return; }
    try {
      const result = await api(`/rooms/${room.code}/answer`, { method: 'POST', body: JSON.stringify({ playerId: player.id, playerToken: player.playerToken, answer: index }) });
      setAnswerState({ questionIndex: current.index, index, correct: result.correct, points: result.points, source });
      if (result.correct) sound.audio.play('correct');
    } catch (error) { onError(error.message); }
  }, [room?.code, room?.status, room?.currentQuestionData, player, answerState, cameraPlayable, api, onError, sound.audio, t]);

  // Commit a detected gesture: resolve its option index from the current
  // question's assignment, ignoring gestures not used by this question.
  const commitGesture = useCallback((gestureKey) => {
    const index = assignmentRef.current.findIndex(item => item.key === gestureKey);
    if (index < 0) return;
    const letter = String.fromCharCode(65 + index);
    setHint(t('poseArena:hintDetected', { gesture: gestureLabel(gestureKey, 'title'), letter }));
    chooseAnswer(index, 'pose');
  }, [chooseAnswer, gestureLabel, t]);

  // ---- Camera --------------------------------------------------------
  async function startCamera() {
    if (cameraState === 'ready' || cameraRequestRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) return setCameraState('unsupported');
    cameraRequestRef.current = true;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = media;
      videoRef.current.srcObject = media;
      await videoRef.current.play();
      media.getVideoTracks()[0]?.addEventListener('ended', () => {
        cameraRequestRef.current = false;
        setCameraState('idle');
        setBodyReady(false);
        setSkeleton(null);
      }, { once: true });
      setCameraState('ready');
      setHint(modelState === 'ready' ? t('poseArena:hintStepBack', { seconds: HOLD_SECONDS }) : t('poseArena:hintCameraStart'));
    } catch {
      cameraRequestRef.current = false;
      setCameraState('denied');
      setBodyReady(false);
      setHint(t('poseArena:hintNoPermission'));
    }
  }

  // Request camera permission as soon as the player has joined and the video
  // element exists. If the browser blocks automatic permission prompts, the
  // visible retry button calls the same flow from a user gesture.
  useEffect(() => {
    if (!room?.code || cameraState !== 'idle') return;
    startCamera();
  }, [room?.code, cameraState]);

  // ---- Detection loop ------------------------------------------------
  useEffect(() => {
    let timer;
    function detect() {
      if (cameraState !== 'ready' || !videoRef.current) return;
      const landmarker = landmarkerRef.current;
        if (!landmarker) { setDetected(null); setSkeleton(null); setBodyReady(false); return; }
      try {
        const now = performance.now();
        const video = videoRef.current;
        if (video.currentTime === trackingRef.current.lastVideoTime) return;
        trackingRef.current.lastVideoTime = video.currentTime;

        const result = landmarker.detectForVideo(video, now);
        const landmarks = result.landmarks?.[0] || null;
        setSkeleton(landmarks);
        if (!landmarks) {
          setDetected(null);
          setHoldProgress(0);
          setBodyReady(false);
          holdRef.current = { key: null, startedAt: 0, fired: false };
          setHint(t('poseArena:hintNotInFrame'));
          return;
        }

        if (!hasPlayableBodyPose(landmarks)) {
          setDetected(null);
          setHoldProgress(0);
          setBodyReady(false);
          holdRef.current = { key: null, startedAt: 0, fired: false };
          setHint(t('poseArena:hintFullBody'));
          return;
        }
        setBodyReady(true);

        const rawGesture = classifyGesture(landmarks);
        // Only treat a gesture as active when it maps to an option this question.
        const inQuestion = rawGesture && assignmentRef.current.some(item => item.key === rawGesture);
        const gesture = inQuestion ? rawGesture : null;
        setDetected(gesture);

        const hold = holdRef.current;
        if (gesture !== hold.key) {
          holdRef.current = { key: gesture, startedAt: gesture ? now : 0, fired: false };
          setHoldProgress(0);
          if (gesture) setHint(t('poseArena:hintHoldMore', { gesture: gestureLabel(gesture, 'title'), seconds: HOLD_SECONDS }));
        } else if (gesture && !hold.fired) {
          const elapsed = now - hold.startedAt;
          setHoldProgress(Math.min(1, elapsed / HOLD_MS));
          if (elapsed >= HOLD_MS) {
            hold.fired = true;
            setHoldProgress(1);
            commitGesture(gesture);
          }
        }
      } catch {
        /* frame skipped */
      }
    }
    if (cameraState === 'ready') timer = window.setInterval(detect, POSE_DETECTION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [cameraState, modelState, commitGesture, gestureLabel, t]);

  // ---- Skeleton overlay ---------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    context.clearRect(0, 0, width, height);
    if (!skeleton) return;

    const px = point => ({ x: (1 - point.x) * width, y: point.y * height });
    context.lineWidth = Math.max(3, width / 220);
    context.strokeStyle = detected ? 'rgba(255, 216, 77, 0.9)' : 'rgba(120, 220, 255, 0.85)';
    POSE_CONNECTIONS.forEach(([a, b]) => {
      const start = lm(skeleton, a);
      const end = lm(skeleton, b);
      if (!start || !end) return;
      const p1 = px(start);
      const p2 = px(end);
      context.beginPath();
      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);
      context.stroke();
    });
    [11, 12, 13, 14, 15, 16, 23, 24].forEach(index => {
      const point = lm(skeleton, index);
      if (!point) return;
      const p = px(point);
      const isHand = index === 15 || index === 16;
      context.beginPath();
      context.arc(p.x, p.y, isHand ? Math.max(7, width / 90) : Math.max(4, width / 150), 0, Math.PI * 2);
      context.fillStyle = isHand ? (detected ? '#ffd84d' : '#7de3ff') : 'rgba(255,255,255,0.9)';
      context.fill();
    });
  }, [skeleton, detected]);

  useEffect(() => () => { sourceRef.current?.close(); streamRef.current?.getTracks().forEach(track => track.stop()); }, []);
  useEffect(() => {
    if (answerState && questionIndex !== answerState.questionIndex) setAnswerState(null);
    setDetected(null);
    setHoldProgress(0);
    holdRef.current = { key: null, startedAt: 0, fired: false };
  }, [questionIndex]);
  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  async function toggleFullscreen() {
    const node = arenaRef.current;
    if (!node) return;
    try {
      if (!document.fullscreenElement) { await node.requestFullscreen(); setFullscreen(true); }
      else { await document.exitFullscreen(); setFullscreen(false); }
    } catch { setFullscreen(value => !value); }
  }

  // ---- Join screen ---------------------------------------------------
  if (!room) {
    return (
      <section className="content-page pose-arena-page">
        <div className="pose-hero">
          <div>
            <p className="eyebrow">{t('poseArena:eyebrow')}</p>
            <h1>{t('poseArena:title')}</h1>
            <p>{t('poseArena:heroDescription')}</p>
            <div className="pose-hero-gestures">
              {GESTURE_LIBRARY.slice(0, 8).map(gesture => (
                <div key={gesture.key} className="pose-hero-gesture">
                  <PoseGestureIllustration gestureKey={gesture.key} />
                  <small>{gestureLabel(gesture.key, 'hint')}</small>
                </div>
              ))}
            </div>
            <p className="pose-hero-count">{t('poseArena:gestureCount', { count: GESTURE_LIBRARY.length })}</p>
          </div>
          <span className="hero-orbit">🖐</span>
        </div>
        <form className="pose-join" onSubmit={join}>
          <div>
            <label>{t('poseArena:roomCode')}<input required value={form.code} onChange={event => setForm({ ...form, code: event.target.value })} placeholder={t('poseArena:roomCodePlaceholder')} /></label>
            <label>{t('poseArena:nickname')}<input required minLength={2} value={form.nickname} onChange={event => setForm({ ...form, nickname: event.target.value })} placeholder={t('poseArena:nicknamePlaceholder')} /></label>
          </div>
          <button className="pose-primary" type="submit">{t('poseArena:joinRoom')} <span>→</span></button>
        </form>
        <p className={`pose-model-status ${modelState}`}>
          {modelState === 'loading' ? t('poseArena:modelLoading') : modelState === 'ready' ? t('poseArena:modelReady') : t('poseArena:modelMissing')}
        </p>
      </section>
    );
  }

  const options = (room.currentQuestionData?.options || []).slice(0, 4);
  const detectedIndex = detected ? assignment.findIndex(item => item.key === detected) : -1;
  const me = room.players?.find(item => item.id === player?.id);

  if (room.status === 'finished') {
    const totalQuestions = room.summary?.questionCount || room.questionCount || 0;
    return <section className={`content-page pose-arena-page pose-arena-finished ${fullscreen ? 'is-fullscreen' : ''}`} ref={arenaRef}>
      <div className="pose-topbar">
        <div className="pose-brand"><span className="pose-brand-icon">◉</span><div><h1>{t('poseArena:brandTitle')}</h1><p>{t('poseArena:roomMeta', { code: room.code, title: room.title, nickname: player?.nickname || 'Bạn' })}</p></div></div>
        <div className="pose-status"><span className="pose-pill score">{t('poseArena:score', { score: me?.score || 0 })}</span><button type="button" className="pose-pill fullscreen" onClick={toggleFullscreen}>{fullscreen ? t('poseArena:fullscreenOff') : t('poseArena:fullscreenOn')}</button></div>
      </div>
      {fullscreen && <button type="button" className="pose-fullscreen-exit" onClick={toggleFullscreen}>{t('poseArena:fullscreenOff')}</button>}
      <PoseArenaSummary correctCount={me?.correctCount || 0} questionCount={totalQuestions} score={me?.score || 0} />
    </section>;
  }

  const renderOption = (option, index) => {
    const gesture = assignment[index];
    const isActive = detectedIndex === index;
    const isAnswered = answerState?.index === index;
    const letter = String.fromCharCode(65 + index);
    return (
      <article
        key={index}
        className={`pose-option option-${index} ${isActive ? 'armed' : ''} ${isAnswered ? (answerState.correct ? 'correct' : 'wrong') : ''}`}
        style={gesture ? { '--gesture-color': gesture.color } : undefined}
        aria-label={t('poseArena:optionGestureLabel', { letter, gesture: gesture ? gestureLabel(gesture.key, 'title') : '' })}
        aria-disabled={!cameraPlayable || Boolean(answerState)}
      >
        <div className="pose-option-gesture">
          <b>{letter}</b>
          {gesture && <PoseGestureIllustration gestureKey={gesture.key} />}
        </div>
        <div className="pose-option-copy">
          {gesture && <span className="pose-gesture-chip">{gestureLabel(gesture.key, 'hint')}</span>}
          <strong>{option}</strong>
          {isAnswered && <em>{answerState.correct ? t('poseArena:correctBadge') : t('poseArena:wrongBadge')}</em>}
        </div>
        {isActive && <div className="pose-hold"><i style={{ width: `${Math.round(holdProgress * 100)}%` }} /></div>}
      </article>
    );
  };

  return (
    <section className={`content-page pose-arena-page ${fullscreen ? 'is-fullscreen' : ''}`} ref={arenaRef}>
      <div className="pose-topbar">
        <div className="pose-brand">
          <span className="pose-brand-icon">◉</span>
          <div>
            <h1>{t('poseArena:brandTitle')}</h1>
            <p>{t('poseArena:roomMeta', { code: room.code, title: room.title, nickname: player?.nickname || 'Bạn' })}</p>
          </div>
        </div>
        <div className="pose-status">
          <span className="pose-pill score">{t('poseArena:score', { score: me?.score || 0 })}</span>
          <span className="pose-pill">{t('poseArena:questionProgress', { current: Number(room.currentQuestionData?.index || 0) + 1, total: room.questionCount || 10 })}</span>
          <span className={`pose-pill timer ${room.timeRemaining <= 5 ? 'urgent' : ''}`}>{t('poseArena:timeLeft', { seconds: room.timeRemaining ?? '--' })}</span>
          <span className={`pose-pill camera ${cameraState}`}>
            {cameraState === 'ready' ? (modelState === 'ready' ? t('poseArena:cameraTracking') : t('poseArena:cameraWaitingModel')) : t('poseArena:cameraOff')}
          </span>
          <button type="button" className="pose-pill fullscreen" onClick={toggleFullscreen}>
            {fullscreen ? t('poseArena:fullscreenOff') : t('poseArena:fullscreenOn')}
          </button>
        </div>
      </div>
      {fullscreen && <button type="button" className="pose-fullscreen-exit" onClick={toggleFullscreen}>{t('poseArena:fullscreenOff')}</button>}

      <div className="pose-question-banner">
        <span>{t('poseArena:questionTag')}</span>
        {room.currentQuestionData && <p>{room.currentQuestionData.question}</p>}
        <QuestionMedia question={room.currentQuestionData} />
      </div>

      <div className="pose-play-layout">
        <div className="pose-answer-slot slot-a">{options[0] !== undefined && renderOption(options[0], 0)}</div>
        <div className="pose-answer-slot slot-b">{options[1] !== undefined && renderOption(options[1], 1)}</div>
        <main className="pose-stage">
          <div className="pose-stage-meta">
            <span>{t('poseArena:liveTag')}</span>
            <b className={cameraPlayable ? 'ready' : ''}>{cameraPlayable ? t('poseArena:trackingReady') : modelState === 'loading' ? t('poseArena:loadingModel') : modelState === 'missing' ? t('poseArena:noModel') : cameraState !== 'ready' ? t('poseArena:cameraRequired') : t('poseArena:fitBody')}</b>
          </div>

          {room.status === 'lobby' && (
            <div className="pose-wait"><span>✦</span><h2>{t('poseArena:waiting')}</h2><p>{t('poseArena:waitingHint')}</p></div>
          )}
          <div className="pose-camera-frame">
            <video ref={videoRef} muted playsInline />
            <canvas ref={canvasRef} className="pose-skeleton" />
            <div className="pose-guide-frame" />
            {cameraState !== 'ready' && (
              <div className="camera-placeholder">
                <span>◉</span>
                <b>{t('poseArena:cameraRequiredTitle')}</b>
                <small>{cameraState === 'unsupported' ? t('poseArena:cameraUnsupported') : t('poseArena:cameraStartHint')}</small>
              </div>
            )}
            {cameraState === 'ready' && modelState === 'ready' && !bodyReady && (
              <div className="camera-fit-warning"><b>{t('poseArena:fitBodyTitle')}</b><small>{t('poseArena:fitBodyHint')}</small></div>
            )}
            {cameraState === 'ready' && detected && (
              <div className="pose-detected-badge">{t('poseArena:detectedBadge', { gesture: gestureLabel(detected, 'title') })}</div>
            )}
          </div>

          {cameraState !== 'ready' && <button className="camera-button" type="button" onClick={startCamera}>{t('poseArena:cameraOn')}</button>}
          <p className="pose-hint">{hint}</p>
          {modelError && <small className="pose-detector-error">Pose Landmarker: {modelError}</small>}

          <div className="pose-legend">
            <span>{t('poseArena:legendTitle', { seconds: HOLD_SECONDS })}</span>
            {assignment.map((gesture, index) => (
              <small key={gesture.key} style={{ '--gesture-color': gesture.color }}>{String.fromCharCode(65 + index)} · {gestureLabel(gesture.key, 'cue')}</small>
            ))}
          </div>
          <div className="pose-privacy">{t('poseArena:privacy')}</div>
        </main>
        <div className="pose-answer-slot slot-c">{options[2] !== undefined && renderOption(options[2], 2)}</div>
        <div className="pose-answer-slot slot-d">{options[3] !== undefined && renderOption(options[3], 3)}</div>
      </div>

      {answerState && (
        <div className={`pose-feedback ${answerState.correct ? 'good' : 'bad'}`}>
          {answerState.correct ? t('poseArena:correct', { points: answerState.points }) : t('poseArena:wrong')}
        </div>
      )}
      {answerState?.correct && <PoseCelebration burstKey={answerState.questionIndex} />}
    </section>
  );
}

export function PoseArenaTeacherSetup({ api, API, EventSource, onError }) {
  const { t } = useTranslation();
  const location = useLocation();
  if (new URLSearchParams(location.search).get('view') === 'test') return <PoseGestureTestPage />;
  return <><div className="pose-test-shortcut"><span>{t('poseArena:testShortcutHint')}</span><a className="secondary-button" href="#/teacher/body-pose?view=test">{t('poseArena:testShortcut')}</a></div><GameRoomBuilder api={api} API={API} EventSource={EventSource} onError={onError} mode="body-pose" /></>;
}
