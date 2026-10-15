import React, { useEffect, useRef, useState } from 'react';
import './head-tilt-game.css';
import { GameRoomBuilder } from './GameRoomBuilder';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const initialForm = { code: '', nickname: '' };

function faceCenter(face) {
  const box = face?.boundingBox || face?.boundingBox;
  if (!box) return null;
  const x = typeof box.x === 'number' ? box.x : box.left;
  const width = typeof box.width === 'number' ? box.width : (box.right - box.left);
  return Number.isFinite(x) && Number.isFinite(width) ? x + width / 2 : null;
}

function estimateHorizontalMotion(video, tracking) {
  if (!video.videoWidth || !video.videoHeight) return null;
  const canvas = tracking.canvas || document.createElement('canvas');
  canvas.width = 128; canvas.height = 96; tracking.canvas = canvas;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const frame = new Uint8Array(canvas.width * canvas.height);
  for (let index = 0; index < frame.length; index += 1) {
    const pixel = index * 4;
    frame[index] = (pixels[pixel] * 3 + pixels[pixel + 1] * 6 + pixels[pixel + 2]) / 10;
  }
  const previous = tracking.motionFrame;
  tracking.motionFrame = frame;
  if (!previous) return null;
  let bestShift = 0; let bestScore = Number.POSITIVE_INFINITY;
  for (let shift = -12; shift <= 12; shift += 1) {
    let score = 0; let samples = 0;
    for (let y = 12; y < canvas.height - 12; y += 2) {
      for (let x = 20; x < canvas.width - 20; x += 2) {
        const previousX = x - shift;
        if (previousX < 0 || previousX >= canvas.width) continue;
        score += Math.abs(frame[y * canvas.width + x] - previous[y * canvas.width + previousX]);
        samples += 1;
      }
    }
    const normalized = score / Math.max(1, samples);
    if (normalized < bestScore) { bestScore = normalized; bestShift = shift; }
  }
  return bestShift;
}

function faceYaw(landmarks) {
  const nose = landmarks?.[1];
  const leftEye = landmarks?.[33];
  const rightEye = landmarks?.[263];
  if (!nose || !leftEye || !rightEye) return null;
  const eyeCenter = (leftEye.x + rightEye.x) / 2;
  const eyeWidth = Math.max(0.001, Math.abs(rightEye.x - leftEye.x));
  return (nose.x - eyeCenter) / eyeWidth;
}

export function HeadTiltStudent({ api, API, EventSource, onError, student }) {
  const [form, setForm] = useState({ ...initialForm, nickname: student?.nickname || '' });
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [answerState, setAnswerState] = useState(null);
  const [cameraState, setCameraState] = useState('idle');
  const [landmarkerState, setLandmarkerState] = useState('loading');
  const [landmarkerError, setLandmarkerError] = useState('');
  const [tiltHint, setTiltHint] = useState('Bật camera để chọn đáp án bằng cách lắc đầu');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sourceRef = useRef(null);
  const landmarkerRef = useRef(null);
  const trackingRef = useRef({ lastX: null, lastAt: 0, cooldown: 0, motionFrame: null, motionScore: 0, motionDirection: 0, motionStreak: 0, lastMotionAt: 0, canvas: null });

  useEffect(() => {
    let disposed = false;
    async function loadLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks('/mediapipe-wasm');
        const options = {
          runningMode: 'VIDEO', numFaces: 1,
          minFaceDetectionConfidence: 0.55, minFacePresenceConfidence: 0.55, minTrackingConfidence: 0.55,
        };
        let landmarker;
        try {
          landmarker = await FaceLandmarker.createFromOptions(vision, { ...options, baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'GPU' } });
        } catch {
          landmarker = await FaceLandmarker.createFromOptions(vision, { ...options, baseOptions: { modelAssetPath: '/models/face_landmarker.task', delegate: 'CPU' } });
        }
        if (disposed) { landmarker.close(); return; }
        landmarkerRef.current = landmarker;
        setLandmarkerState('ready');
      } catch (error) {
        if (!disposed) { setLandmarkerState('fallback'); setLandmarkerError(error?.message || 'Không thể tải model nhận diện khuôn mặt.'); setTiltHint('Không tải được Face Landmarker · đang dùng nhận diện chuyển động dự phòng'); }
      }
    }
    loadLandmarker();
    return () => { disposed = true; landmarkerRef.current?.close(); landmarkerRef.current = null; };
  }, []);

  async function join(event) {
    event.preventDefault();
    try {
      const code = form.code.trim().toUpperCase();
      const result = await api(`/rooms/${code}/players`, { method: 'POST', body: JSON.stringify({ nickname: form.nickname.trim() }) });
      setPlayer(result.player); setRoom(result.room); setAnswerState(null);
      sourceRef.current?.close();
      const source = new EventSource(`${API}/rooms/${code}/events`);
      source.addEventListener('room', item => setRoom(JSON.parse(item.data)));
      sourceRef.current = source;
    } catch (error) { onError(error.message); }
  }

  async function chooseAnswer(index, source = 'touch') {
    const current = room?.currentQuestionData;
    if (!player) { setTiltHint('Chưa kết nối người chơi trong phòng · hãy vào lại phòng'); return; }
    if (!current) { setTiltHint('Chờ giáo viên bắt đầu câu hỏi rồi hãy lắc đầu'); return; }
    if (answerState?.questionIndex === current.index) return;
    try {
      const result = await api(`/rooms/${room.code}/answer`, { method: 'POST', body: JSON.stringify({ playerId: player.id, playerToken: player.playerToken, answer: index }) });
      setAnswerState({ questionIndex: current.index, index, correct: result.correct, points: result.points, source });
    } catch (error) { onError(error.message); }
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) return setCameraState('unsupported');
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } }, audio: false });
      streamRef.current = media; videoRef.current.srcObject = media; await videoRef.current.play();
      setCameraState('ready');
      setTiltHint(landmarkerState === 'ready' ? 'Đưa mặt vào khung · lắc đầu sang trái/phải để chọn đáp án' : 'Camera đã bật · lắc trái/phải rõ ràng trong khung để chọn đáp án');
    } catch { setCameraState('denied'); setTiltHint('Camera chưa được cấp quyền · bạn vẫn có thể chạm để chọn'); }
  }

  useEffect(() => {
    let timer;
    async function detect() {
      if (cameraState !== 'ready' || !videoRef.current) return;
      try {
        const now = performance.now(); const tracking = trackingRef.current;
        if (landmarkerRef.current) {
          const result = landmarkerRef.current.detectForVideo(videoRef.current, now);
          const yaw = faceYaw(result.faceLandmarks?.[0]);
          if (yaw !== null) {
            if (tracking.yawBaseline === undefined || tracking.yawBaseline === null) tracking.yawBaseline = yaw;
            const delta = yaw - tracking.yawBaseline;
            if (Math.abs(delta) < 0.045) tracking.yawBaseline = tracking.yawBaseline * 0.96 + yaw * 0.04;
            const directionValue = Math.sign(delta);
            if (Math.abs(delta) >= 0.085) {
              tracking.yawStreak = tracking.yawDirection === directionValue ? (tracking.yawStreak || 0) + 1 : 1;
              tracking.yawDirection = directionValue;
            } else tracking.yawStreak = 0;
            if (tracking.yawStreak >= 2 && now > tracking.cooldown) {
              const direction = delta > 0 ? 'left' : 'right';
              tracking.cooldown = now + 1000; tracking.yawStreak = 0; tracking.yawBaseline = yaw;
              setTiltHint(direction === 'left' ? '← MediaPipe nhận diện: chọn đáp án trái' : 'MediaPipe nhận diện: chọn đáp án phải →');
              chooseAnswer(direction === 'left' ? 0 : Math.max(0, (room.currentQuestionData?.options || []).length - 1), 'head');
            }
          }
          return;
        }
        let nativeFaceDetected = false;
        if (typeof window.FaceDetector === 'function') {
          try {
            const faces = await new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 }).detect(videoRef.current);
            const x = faceCenter(faces[0]);
            if (x !== null) {
              nativeFaceDetected = true;
              if (tracking.lastX !== null && now - tracking.lastAt < 700 && now > tracking.cooldown) {
                const delta = x - tracking.lastX;
                if (Math.abs(delta) > 34) { tracking.cooldown = now + 1100; setTiltHint(delta < 0 ? '← Đã nhận diện: chọn đáp án trái' : 'Đã nhận diện: chọn đáp án phải →'); chooseAnswer(delta < 0 ? 0 : Math.max(0, (room.currentQuestionData?.options || []).length - 1), 'head'); }
              }
              tracking.lastX = x; tracking.lastAt = now;
            }
          } catch { /* Fall through to motion tracking when FaceDetector is unavailable at runtime. */ }
        }
        if (nativeFaceDetected) return;
        const shift = estimateHorizontalMotion(videoRef.current, tracking);
        if (shift === null) return;
        if (Math.abs(shift) >= 1) {
          const directionValue = Math.sign(shift);
          tracking.motionStreak = tracking.motionDirection === directionValue ? tracking.motionStreak + 1 : 1;
          tracking.motionDirection = directionValue; tracking.motionScore = shift; tracking.lastMotionAt = now;
        } else if (now - tracking.lastMotionAt > 400) { tracking.motionStreak = 0; tracking.motionScore = 0; }
        if (tracking.motionStreak >= 2 && Math.abs(tracking.motionScore) >= 1 && now > tracking.cooldown) {
          const direction = tracking.motionScore < 0 ? 'left' : 'right';
          tracking.cooldown = now + 1000; tracking.motionScore = 0; tracking.motionStreak = 0;
          setTiltHint(direction === 'left' ? '← Đã nhận diện chuyển động: chọn đáp án trái' : 'Đã nhận diện chuyển động: chọn đáp án phải →');
          chooseAnswer(direction === 'left' ? 0 : Math.max(0, (room.currentQuestionData?.options || []).length - 1), 'head');
        }
      } catch { /* FaceDetector is an optional browser capability. */ }
    }
    if (cameraState === 'ready') timer = window.setInterval(detect, 180);
    return () => window.clearInterval(timer);
  }, [cameraState, room?.currentQuestionData?.index, player, answerState]);

  useEffect(() => {
    function handleShortcut(event) {
      if (cameraState !== 'ready' || event.repeat) return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') chooseAnswer(0, 'keyboard');
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') chooseAnswer(Math.max(0, (room?.currentQuestionData?.options || []).length - 1), 'keyboard');
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [cameraState, room?.currentQuestionData?.index, player, answerState]);

  useEffect(() => () => { sourceRef.current?.close(); streamRef.current?.getTracks().forEach(track => track.stop()); }, []);
  useEffect(() => { if (answerState && room?.currentQuestionData?.index !== answerState.questionIndex) setAnswerState(null); }, [room?.currentQuestionData?.index]);

  if (!room) return <section className="content-page head-tilt-page"><div className="head-tilt-hero"><div><p className="eyebrow">ĐẤU TRƯỜNG AR</p><h1>Lắc đầu chọn đáp án</h1><p>Ôn tập Toán so sánh bằng chuyển động tự nhiên: lắc trái chọn nhỏ hơn, lắc phải chọn lớn hơn.</p></div><span className="hero-orbit">↔</span></div><form className="head-tilt-join" onSubmit={join}><div><label>Mã phòng<input required value={form.code} onChange={event => setForm({ ...form, code: event.target.value })} placeholder="VD: ABC123" /></label><label>Tên hiển thị<input required minLength="2" value={form.nickname} onChange={event => setForm({ ...form, nickname: event.target.value })} placeholder="Nhập tên của em" /></label></div><button className="head-tilt-primary" type="submit">Vào đấu trường <span>→</span></button></form><div className="tilt-how"><span>1</span><b>Nhìn vào camera</b><span>2</span><b>Lắc trái hoặc phải</b><span>3</span><b>Nhận điểm thật nhanh</b></div><p className={`tilt-model-status ${landmarkerState}`}>{landmarkerState === 'loading' ? 'Đang tải Face Landmarker…' : landmarkerState === 'ready' ? 'Face Landmarker đã sẵn sàng' : 'Face Landmarker lỗi, sẽ dùng fallback motion'}</p></section>;

  const options = (room.currentQuestionData?.options || []).slice(0, 2);
  const renderOption = (option, index) => <button key={index} type="button" disabled={Boolean(answerState)} className={`tilt-option option-${index} ${answerState?.index === index ? (answerState.correct ? 'correct' : 'wrong') : ''}`} onClick={() => chooseAnswer(index)}><div className="tilt-option-heading"><b>{index === 0 ? 'A' : 'B'}</b><small>{index === 0 ? 'ĐÁP ÁN TRÁI' : 'ĐÁP ÁN PHẢI'}</small><span>{index === 0 ? '↶ Lắc trái' : 'Lắc phải ↷'}</span></div><strong>{option}</strong><em>{index === 0 ? 'Nghiêng đầu sang trái' : 'Nghiêng đầu sang phải'}</em></button>;
  return <section className="content-page head-tilt-page"><div className="arena-top"><div className="arena-brand"><span className="arena-brand-icon">▣</span><div><h1>Quizzz AR Motion</h1><p>Phòng #{room.code} · {room.title} · Học sinh: {player?.nickname || 'Bạn'}</p></div></div><div className="arena-status-group"><span className="combo-pill">🔥 Combo: {answerState?.correct ? `+${answerState.points || 0}` : '0'}</span><span className="question-pill">● Câu {Number(room.currentQuestionData?.index || 0) + 1} / 10</span><span className={`timer-pill ${room.timeRemaining <= 5 ? 'urgent' : ''}`}>⌛ {room.timeRemaining ?? '--'}s</span><span className={`camera-pill ${cameraState}`}>{cameraState === 'ready' ? (landmarkerState === 'ready' ? '● MediaPipe sẵn sàng' : '● Camera · fallback') : '○ Camera chờ bật'}</span></div></div><div className="tilt-question-banner"><span>✥ CÂU HỎI THỬ THÁCH VẬN ĐỘNG</span>{room.currentQuestionData && <p>{room.currentQuestionData.question}</p>}<small>👈 Nghiêng đầu sang TRÁI để chọn A <b>•</b> 👉 Nghiêng đầu sang PHẢI để chọn B</small></div><div className="tilt-arena-grid"><div className="tilt-option-side left-side">{options[0] && renderOption(options[0], 0)}</div><main className="tilt-stage"><div className="tilt-stage-meta"><span>LIVE REC · AI FACE MOTION</span><b>{landmarkerState === 'ready' ? '⌾ MediaPipe đang theo dõi mặt' : landmarkerState === 'loading' ? '⌾ Đang tải Face Landmarker' : '⌾ Motion fallback'}</b></div>{room.status === 'lobby' && <div className="tilt-wait"><span>✦</span><h2>Sẵn sàng chưa?</h2><p>Chờ giáo viên bắt đầu trận đấu nhé!</p></div>}{room.status === 'finished' && <div className="tilt-wait"><span>🏆</span><h2>Trận đấu kết thúc</h2><p>Điểm của em: <b>{room.players?.find(item => item.id === player?.id)?.score || 0}</b></p></div>}<div className="camera-frame"><video ref={videoRef} muted playsInline /><div className="camera-guide"><i /><span /></div>{cameraState !== 'ready' && <div className="camera-placeholder"><span>◉</span><b>Camera tương tác</b><small>{cameraState === 'unsupported' ? 'Trình duyệt chưa hỗ trợ nhận diện khuôn mặt' : 'Bật camera để bắt đầu'}</small></div>}</div><button className="camera-button" type="button" onClick={startCamera}>{cameraState === 'ready' ? 'Camera đã sẵn sàng' : 'Bật camera web'}</button><p className="tilt-hint">{tiltHint}</p>{landmarkerError && <small className="tilt-detector-error">Face Landmarker: {landmarkerError}</small>}<div className="tilt-shortcuts"><span>Phím tắt hoặc bấm nhanh để giả lập:</span><button type="button" onClick={() => chooseAnswer(0, 'keyboard')}>↶ Nghiêng trái (A)</button><button type="button" onClick={() => chooseAnswer(Math.max(0, (room.currentQuestionData?.options || []).length - 1), 'keyboard')}>↷ Nghiêng phải (B)</button></div><div className="tilt-privacy">● Camera xử lý trên thiết bị của em</div></main><div className="tilt-option-side right-side">{options[1] && renderOption(options[1], 1)}</div></div>{answerState && <div className={`tilt-feedback ${answerState.correct ? 'good' : 'bad'}`}>{answerState.correct ? `Tuyệt vời! +${answerState.points} điểm` : 'Gần đúng rồi, thử câu tiếp theo nhé!'}</div>}</section>;
}

export function HeadTiltTeacherSetup({ api, API, EventSource, onError }) {
  return <GameRoomBuilder api={api} API={API} EventSource={EventSource} onError={onError} mode="head-tilt" />;
  const [quizzes, setQuizzes] = useState([]); const [form, setForm] = useState({ title: 'Đấu trường so sánh Toán học', quizId: '', grade: 'Lớp 4', timeLimitSeconds: 20, questionCount: 10 }); const [room, setRoom] = useState(null);
  useEffect(() => { api('/quiz-sets').then(result => setQuizzes(result.items || [])).catch(error => onError(error.message)); }, []);
  async function create(event) { event.preventDefault(); if (!form.quizId) return onError('Hãy chọn bộ quiz dạng so sánh.'); try { const result = await api('/rooms', { method: 'POST', body: JSON.stringify({ ...form, gameMode: 'head-tilt', answerMode: 'comparison', questionCount: Number(form.questionCount), timeLimitSeconds: Number(form.timeLimitSeconds) }) }); setRoom(result.room); } catch (error) { onError(error.message); } }
  return <section className="content-page head-tilt-page"><div className="dashboard-heading"><div><p className="eyebrow">ĐẤU TRƯỜNG AR</p><h1>Tạo game lắc đầu</h1><p className="muted-copy">Chỉ dùng câu hỏi trắc nghiệm so sánh. Nếu kho chưa đủ, hãy tạo bổ sung bằng AI trước khi mở phòng.</p></div><span className="setup-badge">✦ Tương tác camera</span></div>{room ? <div className="created-room-card"><p className="eyebrow">MÃ PHÒNG ĐÃ SẴN SÀNG</p><strong>{room.code}</strong><h2>{room.title}</h2><p>Chia sẻ mã này cho học sinh. Các câu hỏi sẽ hiển thị hai lựa chọn thật lớn.</p><button className="head-tilt-primary" type="button" onClick={() => setRoom(null)}>Tạo phòng mới</button></div> : <form className="panel form-grid head-tilt-form" onSubmit={create}><label className="field wide">Tên game<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label className="field wide">Bộ câu hỏi so sánh<select required value={form.quizId} onChange={event => setForm({ ...form, quizId: event.target.value })}><option value="">Chọn bộ quiz trắc nghiệm</option>{quizzes.map(quiz => <option key={quiz.id} value={quiz.id}>{quiz.title} · {quiz.questionCount || 0} câu</option>)}</select></label><label className="field">Khối lớp<select value={form.grade} onChange={event => setForm({ ...form, grade: event.target.value })}>{Array.from({ length: 5 }, (_, index) => <option key={index}>Lớp {index + 1}</option>)}</select></label><label className="field">Số câu<input type="number" min="1" max="30" value={form.questionCount} onChange={event => setForm({ ...form, questionCount: event.target.value })} /></label><label className="field">Giây / câu<input type="number" min="10" max="120" value={form.timeLimitSeconds} onChange={event => setForm({ ...form, timeLimitSeconds: event.target.value })} /></label><div className="wide head-tilt-form-note">💡 Gợi ý: đáp án nên có dạng “<b>3 482</b>” và “<b>3 428</b>” để học sinh chỉ cần lắc trái/phải.</div><button className="head-tilt-primary wide" type="submit">Tạo phòng đấu →</button></form>}</section>;
}
