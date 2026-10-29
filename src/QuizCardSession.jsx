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
  useEffect(() => { if (!enabled) return; let active = true; api(`/quiz-sessions/${sessionId}`).then(data => { if (active) { setSession(data); setError(''); } }).catch(failure => { if (active) { setError(failure.message); errorRef.current(failure.message); } }); return () => { active = false; }; }, [api, sessionId, enabled]);
  return [session, setSession, error];
}

function CardSheet({ players }) {
  const { t } = useTranslation();
  const cards = useMemo(() => players.filter(player => player.markerId).map(player => ({ ...player, svg: cardDictionary.generateSVG(player.markerId) })), [players]);
  return <div className="card-sheet"><div className="card-sheet-toolbar"><h2>{t('cardScan.cardsTitle')}</h2><button className="secondary-button" type="button" onClick={() => window.print()}>{t('cardScan.printCards')}</button></div><div className="card-sheet-grid">{cards.map(card => <article className="print-card" key={card.markerId}><strong>#{card.markerId} · {card.nickname}</strong><div className="print-card-marker"><span className="card-side top">A</span><span className="card-side right">B</span><span className="card-side bottom">C</span><span className="card-side left">D</span><div dangerouslySetInnerHTML={{ __html: card.svg }} /></div></article>)}</div></div>;
}

export function QuizCardHost({ api, API, sessionId, onError }) {
  const { t } = useTranslation();
  const [session, setSession, sessionError] = useSession(api, sessionId, onError);
  const [busy, setBusy] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const onUpdate = (snapshot, answer) => {
    if (snapshot) setSession(snapshot);
    if (answer) setSession(previous => previous && previous.currentQuestionData?.id === answer.questionId && answer.version > previous.version ? { ...previous, version: answer.version, players: previous.players.map(player => player.markerId === answer.markerId ? { ...player, answer: answer.answer } : player) } : previous);
  };
  const socket = useQuizSocket(API, sessionId, 'host', onUpdate);
  async function action(path) {
    setBusy(true);
    try { setSession(await api(`/quiz-sessions/${sessionId}/${path}`, { method: 'POST' })); }
    catch (error) { onError(error.message); }
    finally { setBusy(false); }
  }
  const scanUrl = `${window.location.origin}${window.location.pathname}#/quiz/${sessionId}/scan`;
  if (!session) return <section className="content-page"><p className={sessionError ? 'error' : 'muted-copy'}>{sessionError || t('common.loading')}</p></section>;
  const answered = session.players.filter(player => player.answer).length;
  return <section className="content-page card-session-page"><div className="dashboard-heading"><div><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{session.title}</h1><p className="muted-copy">{session.className} · {t('cardScan.questionProgress', { current: Math.min(session.currentQuestion + 1, session.questionCount), total: session.questionCount })}</p></div><span className="setup-badge">{socket.connection === 'connected' ? t('cardScan.connected') : t('cardScan.disconnected')}</span></div>{socket.error && <p className="error">{socket.error}</p>}<div className="card-host-layout"><main className="dashboard-panel card-host-question">{session.currentQuestionData ? <><span className="eyebrow">{t('cardScan.questionProgress', { current: session.currentQuestion + 1, total: session.questionCount })}</span><h2>{session.currentQuestionData.question}</h2><div className="card-option-grid">{session.currentQuestionData.options?.map((option, index) => <div key={index}><b>{'ABCD'[index]}</b><span>{option}</span></div>)}</div></> : <div className="empty-state"><h2>{session.status === 'finished' ? t('cardScan.finished') : t('cardScan.ready')}</h2><p>{session.status === 'finished' ? t('cardScan.finishedHint') : t('cardScan.readyHint')}</p></div>}<div className="card-host-actions">{session.status === 'lobby' && <button className="primary-button" disabled={busy} onClick={() => action('start')}>{t('cardScan.start')}</button>}{session.status === 'playing' && <><button className="primary-button" disabled={busy} onClick={() => action('next')}>{t('cardScan.next')}</button><button className="secondary-button" disabled={busy} onClick={() => action('finish')}>{t('cardScan.finish')}</button></>}</div></main><aside className="dashboard-panel card-host-side"><h2>{t('cardScan.connectScanner')}</h2><QRCodeSVG value={scanUrl} size={180} level="M" /><small>{scanUrl}</small><div className="card-host-count"><strong>{answered}/{session.players.length}</strong><span>{t('cardScan.answered')}</span></div><button className="secondary-button" type="button" onClick={() => setShowCards(value => !value)}>{showCards ? t('cardScan.hideCards') : t('cardScan.showCards')}</button></aside></div><div className="dashboard-panel card-roster"><h2>{t('cardScan.students')}</h2><div className="card-roster-grid">{session.players.map(player => <div className={player.answer ? 'answered' : ''} key={player.id}><b>#{player.markerId}</b><span>{player.nickname}</span><strong>{player.answer || '—'}</strong><small>{player.score || 0}</small></div>)}</div></div>{showCards && <CardSheet players={session.players} />}</section>;
}

export function QuizCardScanner({ api, API, sessionId, teacher, onError }) {
  const { t } = useTranslation();
  const [session, setSession, sessionError] = useSession(api, sessionId, onError, Boolean(teacher));
  const [recent, setRecent] = useState([]);
  const camera = useCamera();
  const sent = useRef(new Map());
  const pending = useRef(new Set());
  const lastAttempt = useRef(new Map());
  const socket = useQuizSocket(API, sessionId, 'scanner', snapshot => { if (snapshot) setSession(snapshot); }, Boolean(teacher));
  const questionId = session?.currentQuestionData?.id;
  const activeQuestion = useRef(questionId);
  activeQuestion.current = questionId;
  useEffect(() => { sent.current.clear(); pending.current.clear(); lastAttempt.current.clear(); setRecent([]); }, [questionId]);
  const onDetected = ({ markerId, answer }) => {
    if (!questionId || socket.connection !== 'connected' || !session?.players.some(player => player.markerId === markerId)) return;
    const pendingKey = `${questionId}:${markerId}`;
    if (sent.current.get(markerId) === answer || pending.current.has(pendingKey)) return;
    const now = Date.now();
    if (now - (lastAttempt.current.get(markerId) || 0) < 500) return;
    lastAttempt.current.set(markerId, now); pending.current.add(pendingKey);
    socket.sendAnswer({ sessionId, questionId, markerId, answer }).then(() => {
      if (activeQuestion.current !== questionId) return;
      sent.current.set(markerId, answer);
      setRecent(previous => [{ markerId, answer }, ...previous.filter(item => item.markerId !== markerId)].slice(0, 8));
    }).catch(error => onError(error.message)).finally(() => pending.current.delete(pendingKey));
  };
  const { seen, error: detectorError } = useAruco(camera.webcamRef, Boolean(teacher && questionId), onDetected);
  if (!teacher) return <section className="content-page"><h1>{t('cardScan.scannerTitle')}</h1><p className="muted-copy">{t('cardScan.loginRequired')}</p></section>;
  return <section className="content-page card-session-page card-scanner-page"><div className="dashboard-heading"><div><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{t('cardScan.scannerTitle')}</h1><p className="muted-copy">{session?.title || t('common.loading')}</p></div><span className="setup-badge">{socket.connection === 'connected' ? t('cardScan.connected') : t('cardScan.disconnected')}</span></div>{socket.error && <p className="error">{socket.error}</p>}{sessionError && <p className="error">{sessionError}</p>}{camera.cameraError && <p className="error">{camera.cameraError}</p>}{detectorError && <p className="error">{detectorError}</p>}<div className="card-scanner-layout"><div className="card-camera"><Webcam ref={camera.webcamRef} audio={false} mirrored={false} playsInline videoConstraints={{ facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }} onUserMedia={camera.onUserMedia} onUserMediaError={camera.onUserMediaError} /><div className="card-camera-guide" /><span>{questionId ? t('cardScan.scanning') : t('cardScan.waitingQuestion')}</span></div><aside className="dashboard-panel"><h2>{t('cardScan.detected')}</h2><p>{t('cardScan.cameraHint')}</p><div className="card-detected">{seen.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div><h3>{t('cardScan.sent')}</h3><div className="card-detected">{recent.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div></aside></div></section>;
}
