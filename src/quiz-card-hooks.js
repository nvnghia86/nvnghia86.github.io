import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import 'js-aruco2/src/cv.js';
import aruco from 'js-aruco2';

export const AR = aruco.AR || globalThis.AR;
export const cardDictionary = new AR.Dictionary('ARUCO');

export function answerFromCorners(corners) {
  if (!Array.isArray(corners) || corners.length !== 4) return null;
  const dx = corners[1].x - corners[0].x;
  const dy = corners[1].y - corners[0].y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) < 20) return null;
  const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
  const quadrant = Math.round(angle / 90) % 4;
  const distance = Math.abs(((angle - quadrant * 90 + 540) % 360) - 180);
  return distance <= 35 ? ['A', 'B', 'C', 'D'][quadrant] : null;
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
    for (const name of ['question_started', 'session_finished']) socket.on(name, state => updateRef.current(state));
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

export function useAruco(webcamRef, active, onDetected) {
  const [seen, setSeen] = useState([]);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState({ frames: 0, lastFrameAt: null });
  const callbackRef = useRef(onDetected);
  callbackRef.current = onDetected;
  useEffect(() => {
    if (!active) { setSeen([]); setDiagnostics({ frames: 0, lastFrameAt: null }); return; }
    const detector = new AR.Detector({ dictionaryName: 'ARUCO' });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const stable = new Map();
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
        const markers = detector.detect(context.getImageData(0, 0, width, height));
        frames += 1;
        if (frames === 1 || frames % 10 === 0) setDiagnostics({ frames, lastFrameAt: Date.now() });
        setError('');
        const observations = [];
        for (const marker of markers) {
          if (!Number.isInteger(marker.id) || marker.id < 1 || marker.id > 40) continue;
          const answer = answerFromCorners(marker.corners);
          if (!answer) continue;
          observations.push({ markerId: marker.id, answer });
          const previous = stable.get(marker.id);
          const count = previous?.answer === answer ? previous.count + 1 : 1;
          const lastNotified = previous?.answer === answer ? previous.lastNotified || 0 : 0;
          const shouldNotify = count >= 2 && Date.now() - lastNotified >= 500;
          stable.set(marker.id, { answer, count, lastNotified: shouldNotify ? Date.now() : lastNotified });
          if (shouldNotify) callbackRef.current({ markerId: marker.id, answer });
        }
        const visible = new Set(observations.map(item => item.markerId));
        for (const id of stable.keys()) if (!visible.has(id)) stable.delete(id);
        setSeen(observations);
      } catch (failure) { setError(failure?.message || 'Không thể nhận diện thẻ.'); }
      finally { processing = false; }
    }, 100);
    return () => window.clearInterval(timer);
  }, [webcamRef, active]);
  return { seen, error, diagnostics };
}
