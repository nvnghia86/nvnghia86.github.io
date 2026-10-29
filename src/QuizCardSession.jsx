import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Webcam from 'react-webcam';
import { useTranslation } from 'react-i18next';
import { cardDictionary, useAruco, useCamera, useQuizSocket } from './quiz-card-hooks';
import './quiz-card-session.css';

function useSession(api, sessionId, onError, enabled = true) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const errorRef = useRef(onError);
  errorRef.current = onError;
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    api(`/quiz-sessions/${sessionId}`).then(data => {
      if (!active) return;
      setSession(data);
      setError('');
    }).catch(failure => {
      if (!active) return;
      setError(failure.message);
      errorRef.current(failure.message);
    });
    return () => { active = false; };
  }, [api, sessionId, enabled]);
  return [session, setSession, error];
}

function useFullscreen(elementRef) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === elementRef.current);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [elementRef]);
  async function toggle() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await elementRef.current?.requestFullscreen?.();
    } catch {
      // Browsers can reject fullscreen outside a direct tap. Keep the normal camera view available.
    }
  }
  return { isFullscreen, toggle };
}

function useSessionCountdown(session, onElapsed) {
  const [seconds, setSeconds] = useState(0);
  const elapsedRef = useRef(onElapsed);
  const completed = useRef('');
  elapsedRef.current = onElapsed;
  const questionId = session?.currentQuestionData?.id;
  const startedAt = session?.questionStartedAt;
  const timeLimitSeconds = Number(session?.timeLimitSeconds || 0);
  useEffect(() => {
    if (session?.status !== 'playing' || !questionId || !startedAt || !timeLimitSeconds) {
      setSeconds(0);
      return undefined;
    }
    const deadline = new Date(startedAt).getTime() + timeLimitSeconds * 1000;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(next);
      if (next === 0 && completed.current !== questionId) {
        completed.current = questionId;
        elapsedRef.current?.();
      }
    };
    completed.current = '';
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [session?.status, questionId, startedAt, timeLimitSeconds]);
  return seconds;
}

function CardSheet({ players }) {
  const { t } = useTranslation();
  const cards = useMemo(() => players.filter(player => player.markerId).map(player => ({ ...player, svg: cardDictionary.generateSVG(player.markerId) })), [players]);
  return <div className="card-sheet"><div className="card-sheet-toolbar"><h2>{t('cardScan.cardsTitle')}</h2><button className="secondary-button" type="button" onClick={() => window.print()}>{t('cardScan.printCards')}</button></div><div className="card-sheet-grid">{cards.map(card => <article className="print-card" key={card.markerId}><strong>#{card.markerId} · {card.nickname}</strong><div className="print-card-marker"><span className="card-side top">A</span><span className="card-side right">B</span><span className="card-side bottom">C</span><span className="card-side left">D</span><div dangerouslySetInnerHTML={{ __html: card.svg }} /></div></article>)}</div></div>;
}

function TopThree({ players, t }) {
  const leaders = [...players].sort((left, right) => Number(right.score || 0) - Number(left.score || 0)).slice(0, 3);
  return <aside className="dashboard-panel card-leaderboard"><div className="card-leaderboard-heading"><h2>{t('cardScan.leaderboard')}</h2><span>{t('cardScan.topThree')}</span></div>{leaders.length ? leaders.map((player, index) => <div className="card-leader-row" key={player.id}><b>{index + 1}</b><span>{player.nickname}</span><strong>{player.score || 0}</strong></div>) : <p className="muted-copy">{t('cardScan.noScores')}</p>}</aside>;
}

export function QuizCardHost({ api, API, sessionId, onError }) {
  const { t } = useTranslation();
  const [session, setSession, sessionError] = useSession(api, sessionId, onError);
  const [busy, setBusy] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const hostRef = useRef(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(hostRef);
  const onUpdate = (snapshot, answer) => {
    if (snapshot) setSession(snapshot);
    if (answer) setSession(previous => previous && previous.currentQuestionData?.id === answer.questionId && answer.version > previous.version ? { ...previous, version: answer.version, players: previous.players.map(player => player.markerId === answer.markerId ? { ...player, answer: answer.answer } : player) } : previous);
  };
  const socket = useQuizSocket(API, sessionId, 'host', onUpdate);
  async function action(path) {
    setBusy(true);
    try {
      const state = await api(`/quiz-sessions/${sessionId}/${path}`, { method: 'POST' });
      setSession(state);
      return state;
    } catch (error) {
      onError(error.message);
      return null;
    } finally { setBusy(false); }
  }
  const timerAdvance = useRef(false);
  const seconds = useSessionCountdown(session, () => {
    if (!timerAdvance.current) {
      timerAdvance.current = true;
      action('next');
    }
  });
  useEffect(() => { timerAdvance.current = false; }, [session?.currentQuestionData?.id]);
  const scanUrl = `${window.location.origin}${window.location.pathname}#/quiz/${sessionId}/scan`;
  if (!session) return <section className="content-page"><p className={sessionError ? 'error' : 'muted-copy'}>{sessionError || t('common.loading')}</p></section>;
  const answered = session.players.filter(player => player.answer).length;
  return <section className={`content-page card-session-page ${isFullscreen ? 'card-host-fullscreen' : ''}`} ref={hostRef}><div className="dashboard-heading card-host-heading"><div><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{session.title}</h1><p className="muted-copy">{session.className} · {t('cardScan.questionProgress', { current: Math.min(session.currentQuestion + 1, session.questionCount), total: session.questionCount })}</p></div><div className="card-host-heading-actions"><span className="setup-badge">{socket.connection === 'connected' ? t('cardScan.connected') : t('cardScan.disconnected')}</span><button className="secondary-button card-fullscreen-toggle" type="button" onClick={toggleFullscreen}>{isFullscreen ? t('cardScan.exitFullscreen') : t('cardScan.fullscreen')}</button></div></div>{socket.error && <p className="error">{socket.error}</p>}<div className="card-host-layout"><main className="dashboard-panel card-host-question">{session.currentQuestionData ? <><div className="card-question-meta"><span className="eyebrow">{t('cardScan.questionProgress', { current: session.currentQuestion + 1, total: session.questionCount })}</span><strong className="card-countdown">{seconds}s</strong></div><h2>{session.currentQuestionData.question}</h2><div className="card-option-grid">{session.currentQuestionData.options?.map((option, index) => <div key={index}><b>{'ABCD'[index]}</b><span>{option}</span></div>)}</div></> : <div className="empty-state"><h2>{session.status === 'finished' ? t('cardScan.finished') : t('cardScan.ready')}</h2><p>{session.status === 'finished' ? t('cardScan.finishedHint') : t('cardScan.readyHint')}</p></div>}<div className="card-host-actions">{session.status === 'lobby' && <button className="primary-button" disabled={busy} onClick={() => action('start')}>{t('cardScan.start')}</button>}{session.status === 'playing' && <><button className="primary-button" disabled={busy} onClick={() => action('next')}>{t('cardScan.next')}</button><button className="secondary-button" disabled={busy} onClick={() => action('finish')}>{t('cardScan.finish')}</button></>}</div></main><aside className="dashboard-panel card-host-side"><h2>{t('cardScan.connectScanner')}</h2><QRCodeSVG value={scanUrl} size={180} level="M" /><small>{scanUrl}</small><div className="card-host-count"><strong>{answered}/{session.players.length}</strong><span>{t('cardScan.answered')}</span></div><button className="secondary-button" type="button" onClick={() => setShowCards(value => !value)}>{showCards ? t('cardScan.hideCards') : t('cardScan.showCards')}</button></aside><TopThree players={session.players} t={t} /></div><div className="dashboard-panel card-roster"><h2>{t('cardScan.students')}</h2><div className="card-roster-grid">{session.players.map(player => <div className={player.answer ? 'answered' : ''} key={player.id}><b>#{player.markerId}</b><span>{player.nickname}</span><strong>{player.answer || '—'}</strong><small>{player.score || 0}</small></div>)}</div></div>{showCards && <CardSheet players={session.players} />}</section>;
}

export function QuizCardScanner({ api, API, sessionId, teacher, onError }) {
  const { t } = useTranslation();
  const [session, setSession, sessionError] = useSession(api, sessionId, onError, Boolean(teacher));
  const [recent, setRecent] = useState([]);
  const camera = useCamera();
  const sent = useRef(new Map());
  const pending = useRef(new Set());
  const lastAttempt = useRef(new Map());
  const scannerRef = useRef(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(scannerRef);
  const socket = useQuizSocket(API, sessionId, 'scanner', snapshot => { if (snapshot) setSession(snapshot); }, Boolean(teacher));
  const questionId = session?.currentQuestionData?.id;
  const seconds = useSessionCountdown(session);
  const activeQuestion = useRef(questionId);
  activeQuestion.current = questionId;
  useEffect(() => { sent.current.clear(); pending.current.clear(); lastAttempt.current.clear(); setRecent([]); }, [questionId]);
  const onDetected = ({ markerId, answer }) => {
    if (!questionId || socket.connection !== 'connected' || !session?.players.some(player => player.markerId === markerId)) return;
    const pendingKey = `${questionId}:${markerId}`;
    if (sent.current.get(markerId) === answer || pending.current.has(pendingKey)) return;
    const now = Date.now();
    if (now - (lastAttempt.current.get(markerId) || 0) < 500) return;
    lastAttempt.current.set(markerId, now);
    pending.current.add(pendingKey);
    socket.sendAnswer({ sessionId, questionId, markerId, answer }).then(() => {
      if (activeQuestion.current !== questionId) return;
      sent.current.set(markerId, answer);
      setRecent(previous => [{ markerId, answer }, ...previous.filter(item => item.markerId !== markerId)].slice(0, 8));
    }).catch(error => onError(error.message)).finally(() => pending.current.delete(pendingKey));
  };
  const { seen, error: detectorError } = useAruco(camera.webcamRef, Boolean(teacher && questionId), onDetected);
  if (!teacher) return <section className="content-page"><h1>{t('cardScan.scannerTitle')}</h1><p className="muted-copy">{t('cardScan.loginRequired')}</p></section>;
  return <section className={`content-page card-session-page card-scanner-page ${isFullscreen ? 'card-scanner-fullscreen' : ''}`}><div className="dashboard-heading card-scanner-heading"><div><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{t('cardScan.scannerTitle')}</h1><p className="muted-copy">{session?.title || t('common.loading')}</p></div><div className="card-host-heading-actions"><span className="setup-badge">{socket.connection === 'connected' ? t('cardScan.connected') : t('cardScan.disconnected')}</span>{questionId && <strong className="card-countdown">{seconds}s</strong>}</div></div>{socket.error && <p className="error">{socket.error}</p>}{sessionError && <p className="error">{sessionError}</p>}{camera.cameraError && <p className="error">{camera.cameraError}</p>}{detectorError && <p className="error">{detectorError}</p>}<div className="card-scanner-layout"><div className="card-camera" ref={scannerRef}><Webcam ref={camera.webcamRef} audio={false} mirrored={false} playsInline videoConstraints={{ facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }} onUserMedia={camera.onUserMedia} onUserMediaError={camera.onUserMediaError} /><div className="card-camera-guide" /><span>{questionId ? t('cardScan.scanning') : t('cardScan.waitingQuestion')}</span><button className="card-camera-fullscreen" type="button" onClick={toggleFullscreen}>{isFullscreen ? t('cardScan.exitFullscreen') : t('cardScan.fullscreen')}</button></div><aside className="dashboard-panel card-scanner-info"><h2>{t('cardScan.detected')}</h2><p>{t('cardScan.cameraHint')}</p><div className="card-detected">{seen.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div><h3>{t('cardScan.sent')}</h3><div className="card-detected">{recent.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div></aside></div></section>;
}
