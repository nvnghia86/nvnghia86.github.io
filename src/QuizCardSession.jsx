import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Webcam from 'react-webcam';
import { useTranslation } from 'react-i18next';
import { cardDictionary, useAruco, useCamera, useQuizSocket } from './quiz-card-hooks';
import './quiz-card-session.css';
import './quiz-card-scanner-mobile.css';
import './quiz-card-host-enhanced.css';

function useSession(api, sessionId, onError, enabled = true, endpoint = `/quiz-sessions/${sessionId}`) {
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const errorRef = useRef(onError);
  errorRef.current = onError;
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    api(endpoint).then(data => {
      if (!active) return;
      setSession(data);
      setError('');
    }).catch(failure => {
      if (!active) return;
      setError(failure.message);
      errorRef.current(failure.message);
    });
    return () => { active = false; };
  }, [api, sessionId, enabled, endpoint]);
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
  const medals = ['🥇', '🥈', '🥉'];
  return <section className="dashboard-panel card-leaderboard"><div className="card-leaderboard-heading"><div><span className="card-leaderboard-icon">♛</span><div><p>{t('cardScan.topThree')}</p><h2>{t('cardScan.leaderboard')}</h2></div></div></div><div className="card-leader-list">{leaders.length ? leaders.map((player, index) => <article className={`card-leader-row place-${index + 1}`} key={player.id}><span className="card-leader-medal" aria-hidden="true">{medals[index]}</span><span className="card-leader-avatar">{String(player.nickname || '?').trim().charAt(0).toUpperCase()}</span><span className="card-leader-name"><strong>{player.nickname}</strong><small>#{player.markerId}</small></span><span className="card-leader-score"><strong>{player.score || 0}</strong><small>{t('cardScan.points')}</small></span></article>) : <p className="muted-copy">{t('cardScan.noScores')}</p>}</div></section>;
}

function ScannerConnect({ scanUrl, answered, total, showCards, onToggleCards, onError, t }) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null);
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);
  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(scanUrl);
      else {
        const field = document.createElement('textarea');
        field.value = scanUrl;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const copiedWithFallback = document.execCommand('copy');
        field.remove();
        if (!copiedWithFallback) throw new Error(t('cardScan.copyFailed'));
      }
      setCopied(true);
      window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch (error) { onError(error?.message || t('cardScan.copyFailed')); }
  }
  return <section className="dashboard-panel card-host-side"><div className="card-scanner-connect-heading"><div><p>{t('cardScan.scannerQr')}</p><h3>{t('cardScan.connectScanner')}</h3></div><div className="card-host-count"><strong>{answered}/{total}</strong><span>{t('cardScan.answered')}</span></div></div><div className="card-scanner-connect-body"><QRCodeSVG value={scanUrl} size={112} level="M" /><div className="card-scanner-connect-actions"><button className="primary-button" type="button" onClick={copyLink}>⧉ {copied ? t('cardScan.copied') : t('cardScan.copyLink')}</button><button className="secondary-button" type="button" onClick={onToggleCards}>{showCards ? t('cardScan.hideCards') : t('cardScan.showCards')}</button></div></div></section>;
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
  if (!session) return <section className="content-page"><p className={sessionError ? 'error' : 'muted-copy'}>{sessionError || t('common.loading')}</p></section>;
  const scanUrl = `${window.location.origin}${window.location.pathname}#/quiz/${sessionId}/scan?token=${encodeURIComponent(session.scannerToken || '')}`;
  const answered = session.players.filter(player => player.answer).length;
  return <section className={`content-page card-session-page ${isFullscreen ? 'card-host-fullscreen' : ''}`} ref={hostRef}><div className="dashboard-heading card-host-heading"><div><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{session.title}</h1><p className="muted-copy">{session.className} · {t('cardScan.questionProgress', { current: Math.min(session.currentQuestion + 1, session.questionCount), total: session.questionCount })}</p></div><div className="card-host-heading-actions"><span className="setup-badge">{socket.connection === 'connected' ? t('cardScan.connected') : t('cardScan.disconnected')}</span><button className="secondary-button card-fullscreen-toggle" type="button" onClick={toggleFullscreen}>{isFullscreen ? t('cardScan.exitFullscreen') : t('cardScan.fullscreen')}</button></div></div>{socket.error && <p className="error">{socket.error}</p>}<div className="card-host-layout"><main className="dashboard-panel card-host-question">{session.currentQuestionData ? <><div className="card-question-meta"><span className="eyebrow">{t('cardScan.questionProgress', { current: session.currentQuestion + 1, total: session.questionCount })}</span><strong className="card-countdown">{seconds}s</strong></div><h2>{session.currentQuestionData.question}</h2><div className="card-option-grid">{session.currentQuestionData.options?.map((option, index) => <div key={index}><b>{'ABCD'[index]}</b><span>{option}</span></div>)}</div></> : <div className="empty-state"><h2>{session.status === 'finished' ? t('cardScan.finished') : t('cardScan.ready')}</h2><p>{session.status === 'finished' ? t('cardScan.finishedHint') : t('cardScan.readyHint')}</p></div>}<div className="card-host-actions">{session.status === 'lobby' && <button className="primary-button" disabled={busy} onClick={() => action('start')}>{t('cardScan.start')}</button>}{session.status === 'playing' && <><button className="primary-button" disabled={busy} onClick={() => action('next')}>{t('cardScan.next')}</button><button className="secondary-button" disabled={busy} onClick={() => action('finish')}>{t('cardScan.finish')}</button></>}</div></main><aside className="card-host-rail"><TopThree players={session.players} t={t} /><ScannerConnect scanUrl={scanUrl} answered={answered} total={session.players.length} showCards={showCards} onToggleCards={() => setShowCards(value => !value)} onError={onError} t={t} /></aside></div><div className="dashboard-panel card-roster"><h2>{t('cardScan.students')}</h2><div className="card-roster-grid">{session.players.map(player => <div className={player.answer ? 'answered' : ''} key={player.id}><b>#{player.markerId}</b><span>{player.nickname}</span><strong>{player.answer || '—'}</strong><small>{player.score || 0}</small></div>)}</div></div>{showCards && <CardSheet players={session.players} />}</section>;
}

export function QuizCardScanner({ api, API, sessionId, scannerToken, onError }) {
  const { t } = useTranslation();
  const hasAccess = /^[0-9a-f]{48}$/i.test(scannerToken || '');
  const scannerEndpoint = `/quiz-sessions/${sessionId}/scanner?token=${encodeURIComponent(scannerToken || '')}`;
  const [session, setSession, sessionError] = useSession(api, sessionId, onError, hasAccess, scannerEndpoint);
  const [recent, setRecent] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const camera = useCamera();
  const sent = useRef(new Map());
  const pending = useRef(new Set());
  const lastAttempt = useRef(new Map());
  const scannerRef = useRef(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(scannerRef);
  const socket = useQuizSocket(API, sessionId, 'scanner', snapshot => { if (snapshot) setSession(snapshot); }, hasAccess, scannerToken);
  const questionId = session?.currentQuestionData?.id;
  const seconds = useSessionCountdown(session);
  const openCamera = () => { camera.prepareCamera(); setCameraEnabled(true); };
  const closeCamera = () => { camera.resetCamera(); setCameraEnabled(false); };
  const activeQuestion = useRef(questionId);
  activeQuestion.current = questionId;
  useEffect(() => { sent.current.clear(); pending.current.clear(); lastAttempt.current.clear(); setRecent([]); }, [questionId]);
  const onDetected = ({ markerId, answer }) => {
    if (testMode) {
      setTestResults(previous => [{ markerId, answer, detectedAt: Date.now() }, ...previous.filter(item => item.markerId !== markerId)].slice(0, 12));
      return;
    }
    const player = session?.players.find(item => item.markerId === markerId);
    if (!questionId || socket.connection !== 'connected' || !player || player.answer || sent.current.has(markerId)) return;
    const pendingKey = `${questionId}:${markerId}`;
    if (pending.current.has(pendingKey)) return;
    const now = Date.now();
    if (now - (lastAttempt.current.get(markerId) || 0) < 500) return;
    lastAttempt.current.set(markerId, now);
    pending.current.add(pendingKey);
    socket.sendAnswer({ sessionId, questionId, markerId, answer }).then(response => {
      if (activeQuestion.current !== questionId) return;
      const recordedAnswer = response.answer || answer;
      sent.current.set(markerId, recordedAnswer);
      setRecent(previous => [{ markerId, answer: recordedAnswer }, ...previous.filter(item => item.markerId !== markerId)].slice(0, 8));
    }).catch(error => onError(error.message)).finally(() => pending.current.delete(pendingKey));
  };
  const { seen, error: detectorError, diagnostics } = useAruco(camera.webcamRef, Boolean(hasAccess && cameraEnabled && (testMode || questionId)), onDetected, testMode ? 'test' : questionId || 'idle');
  if (!hasAccess) return <section className="content-page card-scanner-entry"><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{t('cardScan.scannerTitle')}</h1><div className="dashboard-panel card-scanner-welcome"><span className="card-scanner-welcome-icon">⌁</span><h2>{t('cardScan.invalidScanLink')}</h2><p>{t('cardScan.invalidScanLinkHint')}</p></div></section>;
  if (!session) return <section className="content-page card-scanner-entry"><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{t('cardScan.scannerTitle')}</h1><p className={sessionError ? 'error' : 'muted-copy'}>{sessionError || t('common.loading')}</p></section>;
  const statusLabel = session.status === 'playing' ? t('cardScan.sessionPlaying') : session.status === 'finished' ? t('cardScan.finished') : t('cardScan.sessionWaiting');
  return <section className={`content-page card-session-page card-scanner-page ${isFullscreen ? 'card-scanner-fullscreen' : ''}`}><div className="dashboard-heading card-scanner-heading"><div><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{t('cardScan.scannerTitle')}</h1><p className="muted-copy">{session.title}</p></div><div className="card-host-heading-actions"><span className="setup-badge">{statusLabel}</span>{questionId && <strong className="card-countdown">{seconds}s</strong>}</div></div><div className="dashboard-panel scanner-room-summary"><div><span>{t('cardScan.classInfo')}</span><strong>{session.className || '—'}</strong></div><div><span>{t('cardScan.students')}</span><strong>{session.players?.length || 0}</strong></div><div><span>{t('cardScan.connection')}</span><strong>{socket.connection === 'connected' ? t('cardScan.connected') : t('cardScan.disconnected')}</strong></div></div>{socket.error && <p className="error">{socket.error}</p>}{sessionError && <p className="error">{sessionError}</p>}{camera.cameraError && <p className="error">{camera.cameraError}</p>}{detectorError && <p className="error">{detectorError}</p>}<div className="scanner-mode-actions"><button className={testMode ? 'secondary-button' : 'primary-button'} type="button" onClick={cameraEnabled ? closeCamera : openCamera}>{cameraEnabled ? t('cardScan.closeCamera') : t('cardScan.openCamera')}</button><button className={testMode ? 'primary-button' : 'secondary-button'} type="button" onClick={() => { setTestMode(value => !value); setTestResults([]); if (!cameraEnabled) openCamera(); }}>{testMode ? t('cardScan.stopTest') : t('cardScan.startTest')}</button></div>{testMode && <div className="scanner-test-banner"><b>{t('cardScan.testMode')}</b><span>{t('cardScan.testModeHint')}</span></div>}<div className="card-scanner-layout">{cameraEnabled ? <div className="card-camera" ref={scannerRef}><Webcam ref={camera.webcamRef} audio={false} mirrored={false} playsInline videoConstraints={{ facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }} onUserMedia={camera.onUserMedia} onUserMediaError={camera.onUserMediaError} /><div className="card-camera-guide" /><span>{testMode ? t('cardScan.testing') : questionId ? t('cardScan.scanning') : t('cardScan.waitingQuestion')}</span><button className="card-camera-fullscreen" type="button" onClick={toggleFullscreen}>{isFullscreen ? t('cardScan.exitFullscreen') : t('cardScan.fullscreen')}</button></div> : <div className="dashboard-panel card-camera-placeholder"><span>▣</span><h2>{t('cardScan.cameraReadyTitle')}</h2><p>{t('cardScan.cameraReadyHint')}</p><button className="primary-button" type="button" onClick={openCamera}>{t('cardScan.openCamera')}</button></div>}<aside className="dashboard-panel card-scanner-info"><div className="scanner-diagnostic"><span className={camera.cameraState === 'ready' ? 'ready' : ''} />{camera.cameraState === 'ready' ? t('cardScan.cameraActive') : t('cardScan.cameraInactive')}<small>{t('cardScan.processedFrames', { count: diagnostics.frames })}</small></div><h2>{testMode ? t('cardScan.testResults') : t('cardScan.detected')}</h2><p>{t('cardScan.cameraHint')}</p><div className="card-detected">{seen.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div>{testMode ? <><h3>{t('cardScan.stableDetections')}</h3><div className="card-detected test-results">{testResults.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div>{!testResults.length && <small className="muted-copy">{t('cardScan.noTestDetection')}</small>}</> : <><h3>{t('cardScan.sent')}</h3><div className="card-detected">{recent.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div></>}</aside></div></section>;
}
