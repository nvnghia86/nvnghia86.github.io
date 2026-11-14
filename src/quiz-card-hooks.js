import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import 'js-aruco2/src/cv.js';
import aruco from 'js-aruco2';

export const AR = aruco.AR || globalThis.AR;
export const cardDictionary = new AR.Dictionary('ARUCO');

export function mergeCardSession(previous, incoming) {
  if (!incoming || !previous || previous.id !== incoming.id) return incoming || previous;
  if (previous.status === 'finished' && incoming.status !== 'finished') return previous;
  if (incoming.status === 'finished') return incoming;
  if (previous.status === 'playing' && incoming.status === 'lobby') return previous;
  if (Number(incoming.currentQuestion) < Number(previous.currentQuestion)) return previous;
  if (previous.currentQuestionData?.id === incoming.currentQuestionData?.id && previous.questionStatus === 'closed' && incoming.questionStatus !== 'closed') return previous;
  if (incoming.currentQuestion === previous.currentQuestion && Number(incoming.version) < Number(previous.version)) return previous;
  return incoming;
}

export function answerFromCorners(corners) {
  if (!Array.isArray(corners) || corners.length !== 4) return null;
  const dx = corners[1].x - corners[0].x;
  const dy = corners[1].y - corners[0].y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) < 20) return null;
  const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
  const quadrant = Math.round(angle / 90) % 4;
  const distance = Math.abs(((angle - quadrant * 90 + 540) % 360) - 180);
  // Camera coordinates have a downward Y axis. Clockwise physical rotation
  // therefore moves the labelled answer from A to D, C, then B.
  return distance <= 35 ? ['A', 'D', 'C', 'B'][quadrant] : null;
}

export function cornerCenter(corners) {
  if (!Array.isArray(corners) || !corners.length) return { x: 0, y: 0 };
  return {
    x: corners.reduce((sum, corner) => sum + corner.x, 0) / corners.length,
    y: corners.reduce((sum, corner) => sum + corner.y, 0) / corners.length,
  };
}

export function shiftCornersInFrame(corners, dx = 0, dy = 0, frameWidth = 640, frameHeight = 360) {
  if (!Array.isArray(corners) || corners.length !== 4) return { corners: [], edgePinned: false };
  const shifted = corners.map(({ x, y }) => ({ x: x + dx, y: y + dy }));
  const xs = shifted.map(corner => corner.x);
  const ys = shifted.map(corner => corner.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = 12;
  const padTop = 52;
  const padBottom = 16;
  let clampDx = 0;
  let clampDy = 0;
  if (minX < padX) clampDx = padX - minX;
  else if (maxX > frameWidth - padX) clampDx = (frameWidth - padX) - maxX;
  if (minY < padTop) clampDy = padTop - minY;
  else if (maxY > frameHeight - padBottom) clampDy = (frameHeight - padBottom) - maxY;
  const edgePinned = Math.abs(clampDx) > 0.5 || Math.abs(clampDy) > 0.5;
  return {
    corners: shifted.map(({ x, y }) => ({
      x: Math.round((x + clampDx) * 10) / 10,
      y: Math.round((y + clampDy) * 10) / 10,
    })),
    edgePinned,
  };
}

const LUMA_COLS = 48;
const LUMA_ROWS = 27;

export function sampleLumaGrid(imageData, cols = LUMA_COLS, rows = LUMA_ROWS) {
  if (!imageData?.data || !imageData.width || !imageData.height) return null;
  const { data, width, height } = imageData;
  const grid = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    const py = Math.min(height - 1, Math.floor((r + 0.5) * height / rows));
    for (let c = 0; c < cols; c++) {
      const px = Math.min(width - 1, Math.floor((c + 0.5) * width / cols));
      const idx = (py * width + px) * 4;
      grid[r * cols + c] = (data[idx] * 77 + data[idx + 1] * 150 + data[idx + 2] * 29) >> 8;
    }
  }
  return grid;
}

export function estimateCameraMotion(previousObservations, currentObservations, previousLuma, currentLuma, frameWidth = 640, frameHeight = 360) {
  if (Array.isArray(previousObservations) && Array.isArray(currentObservations) && previousObservations.length && currentObservations.length) {
    const prevById = new Map(previousObservations.map(item => [item.markerId, item]));
    const deltas = [];
    for (const current of currentObservations) {
      const prev = prevById.get(current.markerId);
      if (!prev?.corners?.length || !current?.corners?.length) continue;
      const prevCenter = cornerCenter(prev.corners);
      const currCenter = cornerCenter(current.corners);
      deltas.push({ dx: currCenter.x - prevCenter.x, dy: currCenter.y - prevCenter.y });
    }
    if (deltas.length) {
      return {
        dx: deltas.reduce((sum, item) => sum + item.dx, 0) / deltas.length,
        dy: deltas.reduce((sum, item) => sum + item.dy, 0) / deltas.length,
      };
    }
  }
  if (!previousLuma || !currentLuma || previousLuma.length !== LUMA_COLS * LUMA_ROWS || currentLuma.length !== LUMA_COLS * LUMA_ROWS) {
    return { dx: 0, dy: 0 };
  }
  const maxShiftX = 5;
  const maxShiftY = 3;
  let zeroCost = 0;
  let count = 0;
  let variance = 0;
  for (let r = maxShiftY; r < LUMA_ROWS - maxShiftY; r++) {
    for (let c = maxShiftX; c < LUMA_COLS - maxShiftX; c++) {
      const idx = r * LUMA_COLS + c;
      const diff = Math.abs(currentLuma[idx] - previousLuma[idx]);
      zeroCost += diff;
      if (c > maxShiftX) variance += Math.abs(currentLuma[idx] - currentLuma[idx - 1]);
      count++;
    }
  }
  if (!count || variance / count < 4) return { dx: 0, dy: 0 };
  let bestCost = zeroCost;
  let bestGx = 0;
  let bestGy = 0;
  for (let gy = -maxShiftY; gy <= maxShiftY; gy++) {
    for (let gx = -maxShiftX; gx <= maxShiftX; gx++) {
      if (gx === 0 && gy === 0) continue;
      let cost = 0;
      for (let r = maxShiftY; r < LUMA_ROWS - maxShiftY; r++) {
        const prevRow = (r - gy) * LUMA_COLS;
        const currRow = r * LUMA_COLS;
        for (let c = maxShiftX; c < LUMA_COLS - maxShiftX; c++) {
          cost += Math.abs(currentLuma[currRow + c] - previousLuma[prevRow + (c - gx)]);
        }
      }
      if (cost < bestCost) {
        bestCost = cost;
        bestGx = gx;
        bestGy = gy;
      }
    }
  }
  if (bestCost > zeroCost * 0.85) return { dx: 0, dy: 0 };
  return {
    dx: bestGx * (frameWidth / LUMA_COLS),
    dy: bestGy * (frameHeight / LUMA_ROWS),
  };
}

export function useQuizSocket(apiBase, sessionId, role, onUpdate, enabled = true, scannerToken = '') {
  const [connection, setConnection] = useState('connecting');
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;
  useEffect(() => {
    if (!enabled) return;
    const origin = new URL(apiBase, window.location.href).origin;
    // Start with Socket.IO's polling transport and upgrade to WebSocket when
    // available. Some mobile networks and embedded browsers block a direct
    // WebSocket handshake, so forcing websocket here leaves the room offline.
    const socket = io(`${origin}/realtime`, { withCredentials: true, reconnection: true });
    socketRef.current = socket;
    const join = () => {
      setConnection('connecting');
      socket.timeout(8000).emit('join_room', { sessionId, role, ...(role === 'scanner' ? { scannerToken } : {}) }, (err, response) => {
        if (err || !response?.ok) { setConnection('error'); setError(response?.error || 'Không thể kết nối phòng.'); return; }
        setError(''); setConnection('connected'); updateRef.current(response.snapshot);
      });
    };
    socket.on('connect', join);
    socket.on('disconnect', () => setConnection('disconnected'));
    for (const name of ['question_started', 'question_closed', 'session_finished']) socket.on(name, state => updateRef.current(state));
    socket.on('student_answered', answer => updateRef.current(null, answer));
    socket.on('connect_error', () => { setConnection('error'); setError('Mất kết nối tới máy chủ. Đang thử lại…'); });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [apiBase, sessionId, role, enabled, scannerToken]);
  function sendAnswer(payload) {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket?.connected) return reject(new Error('Điện thoại đang mất kết nối.'));
      socket.timeout(5000).emit('student_answered', payload, (err, response) => {
        if (err || !response?.ok) reject(new Error(response?.error || 'Không thể gửi đáp án.'));
        else resolve(response);
      });
    });
  }
  return { connection, error, sendAnswer };
}

export function useCamera() {
  const webcamRef = useRef(null);
  const [cameraState, setCameraState] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  return { webcamRef, cameraState, cameraError,
    prepareCamera: () => { setCameraState('loading'); setCameraError(''); },
    resetCamera: () => { setCameraState('idle'); setCameraError(''); },
    onUserMedia: () => { setCameraState('ready'); setCameraError(''); },
    onUserMediaError: error => {
      setCameraState('error');
      const message = error?.name === 'NotAllowedError'
        ? 'Camera đang bị chặn. Hãy cho phép quyền camera trong cài đặt trình duyệt rồi thử lại.'
        : error?.name === 'NotFoundError'
          ? 'Không tìm thấy camera trên thiết bị.'
          : error?.message || 'Không thể mở camera. Hãy kiểm tra quyền truy cập và HTTPS.';
      setCameraError(message);
    },
  };
}

export function useAruco(webcamRef, active, onDetected, resetKey = '') {
  const [seen, setSeen] = useState([]);
  const [anchored, setAnchored] = useState([]);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState({ frames: 0, lastFrameAt: null });
  const callbackRef = useRef(onDetected);
  callbackRef.current = onDetected;
  useEffect(() => {
    setSeen([]);
    setAnchored([]);
    setError('');
    setDiagnostics({ frames: 0, lastFrameAt: null });
    if (!active) { setSeen([]); setAnchored([]); setDiagnostics({ frames: 0, lastFrameAt: null }); return; }
    const detector = new AR.Detector({ dictionaryName: 'ARUCO' });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const stable = new Map();
    const spatialAnchors = new Map();
    let previousObservations = [];
    let previousLuma = null;
    let processing = false;
    let frames = 0;
    const timer = window.setInterval(() => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState < 2 || !context || processing) return;
      processing = true;
      try {
        const width = 640;
        const height = Math.round(width * video.videoHeight / video.videoWidth);
        if (!Number.isFinite(height) || height < 1) return;
        canvas.width = width; canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);
        const currentLuma = sampleLumaGrid(imageData);
        const markers = detector.detect(imageData);
        frames += 1;
        if (frames === 1 || frames % 10 === 0) setDiagnostics({ frames, lastFrameAt: Date.now() });
        setError('');
        const observations = [];
        for (const marker of markers) {
          if (!Number.isInteger(marker.id) || marker.id < 1 || marker.id > 40) continue;
          const detectedAnswer = answerFromCorners(marker.corners);
          const existingAnchor = spatialAnchors.get(marker.id);
          const answer = detectedAnswer || existingAnchor?.lockedAnswer || existingAnchor?.answer || null;
          if (!answer) continue;
          const corners = marker.corners.map(({ x, y }) => ({ x, y }));
          observations.push({ markerId: marker.id, answer, corners, frameWidth: width, frameHeight: height });
          if (detectedAnswer) {
            const previous = stable.get(marker.id);
            const count = previous?.answer === detectedAnswer ? previous.count + 1 : 1;
            const lastNotified = previous?.answer === detectedAnswer ? previous.lastNotified || 0 : 0;
            const shouldNotify = count >= 2 && Date.now() - lastNotified >= 500;
            stable.set(marker.id, { answer: detectedAnswer, count, lastNotified: shouldNotify ? Date.now() : lastNotified });
            if (shouldNotify) callbackRef.current({ markerId: marker.id, answer: detectedAnswer });
            spatialAnchors.set(marker.id, {
              markerId: marker.id,
              answer: existingAnchor?.lockedAnswer || detectedAnswer,
              lockedAnswer: existingAnchor?.lockedAnswer || (count >= 2 ? detectedAnswer : null),
              corners,
              frameWidth: width,
              frameHeight: height,
              isLive: true,
              isAnchored: false,
              edgePinned: false,
              lastSeenAt: Date.now(),
            });
          } else if (existingAnchor) {
            spatialAnchors.set(marker.id, {
              ...existingAnchor,
              corners,
              frameWidth: width,
              frameHeight: height,
              isLive: true,
              isAnchored: false,
              edgePinned: false,
              lastSeenAt: Date.now(),
            });
          }
        }
        const visible = new Set(observations.map(item => item.markerId));
        for (const id of stable.keys()) if (!visible.has(id)) stable.delete(id);
        const { dx, dy } = estimateCameraMotion(previousObservations, observations, previousLuma, currentLuma, width, height);
        for (const [id, anchor] of spatialAnchors.entries()) {
          if (visible.has(id)) continue;
          const shifted = shiftCornersInFrame(anchor.corners, dx, dy, width, height);
          spatialAnchors.set(id, {
            ...anchor,
            corners: shifted.corners,
            frameWidth: width,
            frameHeight: height,
            isLive: false,
            isAnchored: true,
            edgePinned: shifted.edgePinned,
          });
        }
        previousObservations = observations;
        previousLuma = currentLuma;
        setSeen(observations);
        setAnchored(Array.from(spatialAnchors.values()));
      } catch (failure) { setError(failure?.message || 'Không thể nhận diện thẻ.'); }
      finally { processing = false; }
    }, 100);
    return () => window.clearInterval(timer);
  }, [webcamRef, active, resetKey]);
  return { seen, anchored, error, diagnostics };
}
