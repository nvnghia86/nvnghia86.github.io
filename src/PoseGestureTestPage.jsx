import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { useTranslation } from 'react-i18next';
import PoseGestureIllustration from './PoseGestureIllustration';
import { GESTURE_LIBRARY, POSE_DETECTION_INTERVAL_MS, POSE_LANDMARKER_OPTIONS, classifyGesture, hasPlayableBodyPose } from './pose-gesture-library';
import './pose-arena-game.css';

export default function PoseGestureTestPage() {
  const { t } = useTranslation();
  const [cameraState, setCameraState] = useState('idle');
  const [modelState, setModelState] = useState('loading');
  const [bodyReady, setBodyReady] = useState(false);
  const [detected, setDetected] = useState(null);
  const [lastDetected, setLastDetected] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const modelRef = useRef(null);
  const requestRef = useRef(false);
  const frameRef = useRef(-1);

  useEffect(() => {
    let disposed = false;
    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
        const settings = POSE_LANDMARKER_OPTIONS;
        let model;
        try { model = await PoseLandmarker.createFromOptions(vision, { ...settings, baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate: 'GPU' } }); }
        catch { model = await PoseLandmarker.createFromOptions(vision, { ...settings, baseOptions: { modelAssetPath: '/models/pose_landmarker_lite.task', delegate: 'CPU' } }); }
        if (disposed) { model.close(); return; }
        modelRef.current = model;
        setModelState('ready');
      } catch { if (!disposed) setModelState('missing'); }
    }
    loadModel();
    return () => { disposed = true; modelRef.current?.close(); modelRef.current = null; };
  }, []);

  const startCamera = useCallback(async () => {
    if (cameraState === 'ready' || requestRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) { setCameraState('unsupported'); return; }
    requestRef.current = true;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      streamRef.current = media;
      videoRef.current.srcObject = media;
      await videoRef.current.play();
      media.getVideoTracks()[0]?.addEventListener('ended', () => { requestRef.current = false; setCameraState('idle'); setBodyReady(false); }, { once: true });
      setCameraState('ready');
    } catch { requestRef.current = false; setCameraState('denied'); }
  }, [cameraState]);

  useEffect(() => { if (cameraState === 'idle') startCamera(); }, [cameraState, startCamera]);
  useEffect(() => () => streamRef.current?.getTracks().forEach(track => track.stop()), []);

  useEffect(() => {
    let timer;
    function detect() {
      const video = videoRef.current;
      const model = modelRef.current;
      if (!video || !model || cameraState !== 'ready') return;
      try {
        if (video.currentTime === frameRef.current) return;
        frameRef.current = video.currentTime;
        const landmarks = model.detectForVideo(video, performance.now()).landmarks?.[0] || null;
        const ready = Boolean(landmarks && hasPlayableBodyPose(landmarks));
        setBodyReady(ready);
        if (!ready) { setDetected(null); return; }
        const key = classifyGesture(landmarks);
        setDetected(key);
        if (key) setLastDetected(key);
      } catch { /* ignore one invalid frame */ }
    }
    if (cameraState === 'ready' && modelState === 'ready') timer = window.setInterval(detect, POSE_DETECTION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [cameraState, modelState]);

  const status = cameraState !== 'ready' ? t('poseArena:testCameraNeeded')
    : modelState !== 'ready' ? t('poseArena:testModelLoading')
      : !bodyReady ? t('poseArena:testFitBody')
        : detected ? t('poseArena:testDetected', { gesture: t(`poseArena:gestures.${detected}.title`) })
          : t('poseArena:testReady');

  return <section className="content-page pose-arena-page pose-test-page">
    <div className="pose-test-heading"><div><p className="eyebrow">{t('poseArena:testEyebrow')}</p><h1>{t('poseArena:testTitle')}</h1><p>{t('poseArena:testDescription')}</p></div><a className="secondary-button" href="#/teacher/body-pose">{t('poseArena:testBack')}</a></div>
    <div className="pose-test-layout">
      <article className="pose-test-camera-panel"><div className={`pose-test-status ${bodyReady ? 'ready' : ''}`}><b>{status}</b><small>{t('poseArena:testPrivacy')}</small></div><div className="pose-camera-frame"><video ref={videoRef} muted playsInline /><div className="pose-guide-frame" />{cameraState !== 'ready' && <div className="camera-placeholder"><span>◉</span><b>{t('poseArena:cameraRequiredTitle')}</b><small>{t('poseArena:cameraStartHint')}</small></div>}{cameraState === 'ready' && !bodyReady && <div className="camera-fit-warning"><b>{t('poseArena:fitBodyTitle')}</b><small>{t('poseArena:fitBodyHint')}</small></div>}{detected && <div className="pose-detected-badge">{t('poseArena:testDetected', { gesture: t(`poseArena:gestures.${detected}.title`) })}</div>}</div>{cameraState !== 'ready' && <button className="camera-button" type="button" onClick={startCamera}>{t('poseArena:cameraOn')}</button>}</article>
      <aside className="pose-test-library"><div><h2>{t('poseArena:testLibraryTitle')}</h2><p>{t('poseArena:testLibraryHint')}</p></div><div className="pose-test-gesture-grid">{GESTURE_LIBRARY.map(gesture => <article key={gesture.key} className={`${detected === gesture.key ? 'active' : ''} ${lastDetected === gesture.key ? 'last' : ''}`} style={{ '--gesture-color': gesture.color }}><PoseGestureIllustration gestureKey={gesture.key} /><span><b>{t(`poseArena:gestures.${gesture.key}.title`)}</b><small>{t(`poseArena:gestures.${gesture.key}.hint`)}</small></span></article>)}</div></aside>
    </div>
  </section>;
}

