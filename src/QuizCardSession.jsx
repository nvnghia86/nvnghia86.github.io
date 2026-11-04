import QuestionMedia from './QuestionMedia';
import GameAudioControls from './GameAudioControls';
import { useGameAudio } from './use-game-audio';
import { cardAudioCue, cardAudioSnapshot } from './game-audio';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ScannerConnect from './ScannerConnect';
import Webcam from 'react-webcam';
import { useTranslation } from 'react-i18next';
import { cardDictionary, mergeCardSession, useAruco, useCamera, useQuizSocket } from './quiz-card-hooks';
import './quiz-card-session.css';
import './quiz-card-scanner-mobile.css';
import './quiz-card-host-enhanced.css';
import './quiz-card-fullscreen.css';
import './quiz-card-layout.css';
import './quiz-card-celebration.css';

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
      setSession(previous => mergeCardSession(previous, data));
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
    if (session?.status !== 'playing' || session?.questionStatus === 'closed' || !questionId || !startedAt || !timeLimitSeconds) {
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
  }, [session?.status, session?.questionStatus, questionId, startedAt, timeLimitSeconds]);
  return seconds;
}

function CardSheet({ players }) {
  const { t } = useTranslation();
  const cards = useMemo(() => players.filter(player => player.markerId).map(player => ({ ...player, svg: cardDictionary.generateSVG(player.markerId) })), [players]);
  return <div className="card-sheet"><div className="card-sheet-toolbar"><h2>{t('cardScan.cardsTitle')}</h2><button className="secondary-button" type="button" onClick={() => window.print()}>{t('cardScan.printCards')}</button></div><div className="card-sheet-grid">{cards.map(card => <article className="print-card" key={card.markerId}><strong>#{card.markerId} · {card.nickname}</strong><div className="print-card-marker"><span className="card-side top">A</span><span className="card-side right">B</span><span className="card-side bottom">C</span><span className="card-side left">D</span><div dangerouslySetInnerHTML={{ __html: card.svg }} /></div></article>)}</div></div>;
}

function rankedPlayers(players, limit = 3) {
  return [...players]
    .sort((left, right) => Number(right.score || 0) - Number(left.score || 0) || Number(left.markerId || 0) - Number(right.markerId || 0))
    .slice(0, limit);
}

function TopThree({ players, t, expanded = false }) {
  const leaders = rankedPlayers(players, expanded ? players.length : 3);
  const medals = ['🥇', '🥈', '🥉'];
  return <section className="dashboard-panel card-leaderboard"><div className="card-leaderboard-heading"><div><span className="card-leaderboard-icon">♛</span><div>{!expanded && <p>{t('cardScan.topThree')}</p>}<h2>{t('cardScan.leaderboard')}</h2></div></div></div><div className="card-leader-list" tabIndex={expanded ? 0 : undefined} role={expanded ? 'region' : undefined} aria-label={expanded ? t('cardScan.leaderboard') : undefined}>{leaders.length ? leaders.map((player, index) => <article className={`card-leader-row place-${index + 1}`} key={player.id}><span className="card-leader-medal" aria-hidden="true">{medals[index] || index + 1}</span><span className="card-leader-avatar">{String(player.nickname || '?').trim().charAt(0).toUpperCase()}</span><span className="card-leader-name"><strong>{player.nickname}</strong><small>#{player.markerId}</small></span><span className="card-leader-score"><strong>{player.score || 0}</strong><small>{t('cardScan.points')}</small></span></article>) : <p className="muted-copy">{t('cardScan.noScores')}</p>}</div></section>;
}

function CelebrationModal({ players, onClose, t }) {
  const leaders = rankedPlayers(players);
  const podium = [leaders[1] && { player: leaders[1], rank: 2 }, leaders[0] && { player: leaders[0], rank: 1 }, leaders[2] && { player: leaders[2], rank: 3 }].filter(Boolean);
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
  useEffect(() => {
    const closeOnEscape = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return <div className="card-celebration-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="card-celebration-modal" role="dialog" aria-modal="true" aria-labelledby="card-celebration-title"><div className="card-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} />)}</div><button className="card-celebration-close" type="button" onClick={onClose} aria-label={t('common.close')}>×</button><div className="card-celebration-heading"><span>🏆</span><p>{t('cardScan.gameComplete')}</p><h2 id="card-celebration-title">{t('cardScan.congratulations')}</h2><small>{t('cardScan.congratulationsHint')}</small></div>{podium.length ? <div className="card-podium">{podium.map(({ player, rank }) => <article className={`card-podium-place podium-${rank}`} key={player.id}><span className="card-podium-medal">{medals[rank]}</span><span className="card-podium-avatar">{String(player.nickname || '?').trim().charAt(0).toUpperCase()}</span><strong>{player.nickname}</strong><small>#{player.markerId}</small><b>{player.score || 0} {t('cardScan.points')}</b><div className="card-podium-step"><span>{rank}</span></div></article>)}</div> : <p className="muted-copy">{t('cardScan.noScores')}</p>}<button className="primary-button card-celebration-action" type="button" onClick={onClose}>{t('cardScan.closeResults')}</button></section></div>;
}

export function ScannerRoster({ players, questionId, t }) {
  const listRef = useRef(null);
  const { ordered, pending } = useMemo(() => {
    if (!questionId) return { ordered: players, pending: [] };
    const pending = players.filter(player => !player.answer);
    return { pending, ordered: [...pending, ...players.filter(player => player.answer)] };
  }, [players, questionId]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = 0; }, [questionId]);
  return <section className="dashboard-panel scanner-student-roster">
    <div className="scanner-roster-heading"><div><h2>{t('cardScan.studentRoster')}</h2><small aria-live="polite">{questionId ? t('cardScan.pendingAnswerCount', { count: pending.length }) : t('cardScan.students', { count: players.length })}</small></div><strong>{players.length}</strong></div>
    <div className="scanner-roster-list" ref={listRef}>{ordered.map(player => {
      const answered = Boolean(player.answer);
      return <article key={player.id} className={questionId ? answered ? 'has-current-answer' : 'is-awaiting-answer' : undefined}>
        <span className="scanner-roster-marker">#{player.markerId}</span>
        <strong>{player.nickname}</strong>
        <span className="scanner-roster-score">{player.score || 0} {t('cardScan.points')}</span>
        {questionId && <span className={`scanner-roster-answer-status ${answered ? 'is-answered' : 'is-pending'}`}>{answered ? t('cardScan.currentAnswered', { answer: player.answer }) : t('cardScan.currentUnanswered')}</span>}
        <small><b>{t('cardScan.correct')}: {player.correctCount || 0}</b><b>{t('cardScan.incorrect')}: {player.incorrectCount || 0}</b><span>{t('cardScan.answeredCount', { count: player.answeredCount || 0 })}</span></small>
      </article>;
    })}</div>
  </section>;
}

export function QuizCardHost({ api, API, sessionId, onError }) {
  const { t } = useTranslation();
  const sound = useGameAudio();
  const previousSound = useRef(null);
  const [session, setSession, sessionError] = useSession(api, sessionId, onError);
  const [busy, setBusy] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const previousStatus = useRef(null);
  const hostRef = useRef(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(hostRef);
  const onUpdate = (snapshot, answer) => {
    if (snapshot) setSession(previous => mergeCardSession(previous, snapshot));
    if (answer) setSession(previous => previous && previous.questionStatus !== 'closed' && previous.currentQuestionData?.id === answer.questionId && answer.version > previous.version ? { ...previous, version: answer.version, players: previous.players.map(player => player.markerId === answer.markerId ? { ...player, answer: answer.answer } : player) } : previous);
  };
  const socket = useQuizSocket(API, sessionId, 'host', onUpdate);
  async function action(path, automatic = false) {
    setBusy(true);
    try {
      const state = await api(`/quiz-sessions/${sessionId}/${path}`, { method: 'POST', body: JSON.stringify({ questionId: session?.currentQuestionData?.id }), ...(automatic ? { silent: true } : {}) });
      setSession(previous => mergeCardSession(previous, state));
      return state;
    } catch (error) {
      if (automatic) {
        try { const state = await api(`/quiz-sessions/${sessionId}`, { silent: true }); setSession(previous => mergeCardSession(previous, state)); } catch { /* The server timer or another teacher control may have closed the question first. */ }
      } else onError(error.message);
      return null;
    } finally { setBusy(false); }
  }
  const timerClose = useRef(false);
  const seconds = useSessionCountdown(session, () => {
    if (!timerClose.current) {
      timerClose.current = true;
      action('close', true);
    }
  });
  useEffect(() => {
    const current = cardAudioSnapshot(session, seconds);
    const cue = cardAudioCue(previousSound.current, current);
    previousSound.current = current;
    sound.audio.setMusic(session?.status === 'playing' ? 'quiz' : null);
    if (cue) sound.audio.play(cue);
  }, [session, seconds, sound.audio]);
  useEffect(() => { timerClose.current = false; }, [session?.currentQuestionData?.id]);
  useEffect(() => {
    const status = session?.status || null;
    if (previousStatus.current && previousStatus.current !== 'finished' && status === 'finished') setShowCelebration(true);
    previousStatus.current = status;
  }, [session?.status]);
  if (!session) return <section className="content-page"><p className={sessionError ? 'error' : 'muted-copy'}>{sessionError || t('common.loading')}</p></section>;
  const scanUrl = `${window.location.origin}${window.location.pathname}#/quiz/${sessionId}/scan?token=${encodeURIComponent(session.scannerToken || '')}`;
  const answered = session.players.filter(player => player.answer).length;
  const questionClosed = session.questionStatus === 'closed';
  return <section className={`content-page card-session-page ${isFullscreen ? 'card-host-fullscreen' : ''}`} ref={hostRef}><div className="dashboard-heading card-host-heading"><div><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{session.title}</h1><p className="muted-copy">{session.className} · {t('cardScan.questionProgress', { current: Math.min(session.currentQuestion + 1, session.questionCount), total: session.questionCount })}</p></div><div className="card-host-heading-actions"><GameAudioControls {...sound} /><span className="setup-badge">{socket.connection === 'connected' ? t('cardScan.connected') : t('cardScan.disconnected')}</span><button className="secondary-button card-fullscreen-toggle" type="button" onClick={toggleFullscreen}>{isFullscreen ? t('cardScan.exitFullscreen') : t('cardScan.fullscreen')}</button></div></div>{socket.error && <p className="error">{socket.error}</p>}<div className="card-host-layout"><main className="dashboard-panel card-host-question">{session.currentQuestionData ? <><div className="card-question-meta"><span className="eyebrow">{t('cardScan.questionProgress', { current: session.currentQuestion + 1, total: session.questionCount })}</span><strong className="card-countdown">{seconds}s</strong></div><div className="card-question-body"><h2>{session.currentQuestionData.question}</h2><QuestionMedia question={session.currentQuestionData} /></div><div className="card-option-grid">{session.currentQuestionData.options?.map((option, index) => <div key={index} className={questionClosed ? session.questionSummary?.correctAnswer === 'ABCD'[index] ? 'is-correct' : 'is-reviewed' : ''}><b>{'ABCD'[index]}</b><span>{option}</span>{questionClosed && <small className="card-option-result">{t('cardScan.optionCount', { count: session.questionSummary?.counts?.['ABCD'[index]] || 0 })}{session.questionSummary?.correctAnswer === 'ABCD'[index] && <strong>{t('cardScan.correctAnswer')}</strong>}</small>}</div>)}</div></> : <div className="empty-state"><h2>{session.status === 'finished' ? t('cardScan.finished') : t('cardScan.ready')}</h2><p>{session.status === 'finished' ? t('cardScan.finishedHint') : t('cardScan.readyHint')}</p></div>}<div className="card-host-actions">{session.status === 'playing' && questionClosed && <p className="card-question-closed-hint" role="status">{t('cardScan.questionClosedHint')}</p>}{session.status === 'lobby' && <button className="primary-button" disabled={busy} onClick={() => action('start')}>{t('cardScan.start')}</button>}{session.status === 'playing' && <><button className="secondary-button" disabled={busy || questionClosed} onClick={() => action('close')}>{t('cardScan.endQuestion')}</button><button className="primary-button" disabled={busy || !questionClosed} onClick={() => action('next')}>{t('cardScan.next')}</button><button className="secondary-button" disabled={busy} onClick={() => action('finish')}>{t('cardScan.finish')}</button></>}</div></main><aside className="card-host-rail"><TopThree players={session.players} t={t} expanded={isFullscreen} /><ScannerConnect scanUrl={scanUrl} answered={answered} total={session.players.length} showCards={showCards} onToggleCards={() => setShowCards(value => !value)} onError={onError} t={t} /></aside></div><div className="dashboard-panel card-roster"><h2>{t('cardScan.students')}</h2><div className="card-roster-grid">{session.players.map(player => <div className={player.answer ? 'answered' : ''} key={player.id}><b>#{player.markerId}</b><span>{player.nickname}</span><strong>{player.answer || '—'}</strong><small>{player.score || 0}</small></div>)}</div></div>{showCards && <CardSheet players={session.players} />}{showCelebration && <CelebrationModal players={session.players} onClose={() => setShowCelebration(false)} t={t} />}</section>;
}

export function QuizCardScanner({ api, API, sessionId, scannerToken, onError, allowStart = false }) {
  const { t } = useTranslation();
  const hasAccess = /^[0-9a-f]{48}$/i.test(scannerToken || '');
  const scannerEndpoint = `/quiz-sessions/${sessionId}/scanner?token=${encodeURIComponent(scannerToken || '')}`;
  const scannerActionEndpoint = action => `/quiz-sessions/${sessionId}/scanner/${action}?token=${encodeURIComponent(scannerToken || '')}`;
  const [session, setSession, sessionError] = useSession(api, sessionId, onError, hasAccess, scannerEndpoint);
  const [recent, setRecent] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [lastQuestionSummary, setLastQuestionSummary] = useState(null);
  const camera = useCamera();
  const sent = useRef(new Map());
  const pending = useRef(new Set());
  const lastAttempt = useRef(new Map());
  const scannerRef = useRef(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(scannerRef);
  const updateScannerSession = useCallback((snapshot, answer) => {
    if (snapshot) {
      if (snapshot.previousQuestionSummary) setLastQuestionSummary(snapshot.previousQuestionSummary);
      setSession(previous => mergeCardSession(previous, snapshot));
    }
    if (answer) setSession(previous => previous?.status === 'playing' && previous.questionStatus !== 'closed' && previous.currentQuestionData?.id === answer.questionId && answer.version > previous.version
      ? { ...previous, version: answer.version, players: previous.players.map(player => player.markerId === answer.markerId ? { ...player, answer: answer.answer } : player) }
      : previous);
  }, [setSession]);
  const socket = useQuizSocket(API, sessionId, 'scanner', updateScannerSession, hasAccess, scannerToken);
  const finished = session?.status === 'finished';
  const questionId = session?.status === 'playing' ? session.currentQuestionData?.id : null;
  const questionClosed = session?.questionStatus === 'closed';
  const seconds = useSessionCountdown(session);
  const acceptingAnswers = Boolean(questionId && !questionClosed && seconds > 0);
  const openCamera = () => { if (!finished) { camera.prepareCamera(); setCameraEnabled(true); } };
  const closeCamera = () => { camera.resetCamera(); setCameraEnabled(false); };
  useEffect(() => {
    if (!finished) return;
    setCameraEnabled(false); setTestMode(false); setTestResults([]); setRecent([]);
    camera.resetCamera();
    sent.current.clear(); pending.current.clear(); lastAttempt.current.clear();
  }, [finished]);
  useEffect(() => {
    if (!hasAccess || !session || finished) return undefined;
    let active = true, fetching = false;
    const refresh = async () => {
      if (!active || fetching || document.hidden) return;
      fetching = true;
      try { const state = await api(scannerEndpoint); if (active) updateScannerSession(state); }
      catch { /* Realtime reports connection errors; retry without repeated toasts. */ }
      finally { fetching = false; }
    };
    const visible = () => { if (!document.hidden) void refresh(); };
    const timer = socket.connection !== 'connected' ? window.setInterval(refresh, 5000) : null;
    document.addEventListener('visibilitychange', visible); window.addEventListener('online', refresh);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); window.removeEventListener('online', refresh); };
  }, [api, scannerEndpoint, hasAccess, session?.status, finished, socket.connection, updateScannerSession]);
  const activeQuestion = useRef(null);
  activeQuestion.current = acceptingAnswers ? questionId : null;
  async function controlQuestion(action) {
    if (advancing || (action === 'start' ? !allowStart || session?.status !== 'lobby' : !questionId) || (action === 'next' && !questionClosed) || (action === 'close' && questionClosed)) return;
    setAdvancing(true);
    try { updateScannerSession(await api(scannerActionEndpoint(action), { method: 'POST', body: JSON.stringify({ questionId }) })); }
    catch (error) { onError(error.message); }
    finally { setAdvancing(false); }
  }
  useEffect(() => { sent.current.clear(); pending.current.clear(); lastAttempt.current.clear(); setRecent([]); }, [questionId]);
  const onDetected = ({ markerId, answer }) => {
    if (finished) return;
    if (testMode) {
      setTestResults(previous => [{ markerId, answer, detectedAt: Date.now() }, ...previous.filter(item => item.markerId !== markerId)].slice(0, 12));
      return;
    }
    const player = session?.players.find(item => item.markerId === markerId);
    if (!acceptingAnswers || socket.connection !== 'connected' || !player || player.answer || sent.current.has(markerId)) return;
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
    }).catch(error => { if (activeQuestion.current === questionId) onError(error.message); }).finally(() => pending.current.delete(pendingKey));
  };
  const { seen, error: detectorError, diagnostics } = useAruco(camera.webcamRef, Boolean(hasAccess && !finished && cameraEnabled && (testMode || acceptingAnswers)), onDetected, testMode ? 'test' : questionId || 'idle');
  if (!hasAccess) return <section className="content-page card-scanner-entry"><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{t('cardScan.scannerTitle')}</h1><div className="dashboard-panel card-scanner-welcome"><span className="card-scanner-welcome-icon">⌁</span><h2>{t('cardScan.invalidScanLink')}</h2><p>{t('cardScan.invalidScanLinkHint')}</p></div></section>;
  if (!session) return <section className="content-page card-scanner-entry"><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{t('cardScan.scannerTitle')}</h1><p className={sessionError ? 'error' : 'muted-copy'}>{sessionError || t('common.loading')}</p></section>;
  if (finished) return <section className="content-page card-session-page card-scanner-page">
    <div className="dashboard-heading card-scanner-heading"><div><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{t('cardScan.scannerTitle')}</h1><p className="muted-copy">{session.title} · {session.className}</p></div></div>
    <div className="dashboard-panel card-scanner-finished" role="status"><span aria-hidden="true">🏁</span><h2>{t(session.endedReason === 'game_updated' ? 'preparedGames.detail.updatedTitle' : 'cardScan.scannerFinishedTitle')}</h2><p>{t(session.endedReason === 'game_updated' ? 'preparedGames.detail.updatedHint' : 'cardScan.scannerFinishedHint')}</p></div>
    <ScannerRoster players={session.players} t={t} />
  </section>;
  const statusLabel = session.status === 'playing' ? questionClosed ? t('cardScan.questionClosed') : t('cardScan.sessionPlaying') : t('cardScan.sessionWaiting');
  const latestScan = testMode ? testResults[0] : recent[0];
  const cameraStatus = testMode ? t('cardScan.testing') : questionClosed ? t('cardScan.questionClosed') : acceptingAnswers ? t('cardScan.scanning') : t('cardScan.waitingQuestion');
  const answerStats = ['A', 'B', 'C', 'D'].map(answer => ({ answer, count: questionClosed ? session.questionSummary?.counts?.[answer] || 0 : session.players.filter(player => player.answer === answer).length }));
  const recordedAnswers = answerStats.reduce((total, item) => total + item.count, 0);
  const previousQuestionSummary = lastQuestionSummary ? <section className="dashboard-panel scanner-closed-summary"><div><h2>{t('cardScan.questionResult', { current: lastQuestionSummary.position + 1 })}</h2><small>{t('cardScan.answersRecorded', { count: lastQuestionSummary.answeredCount })}</small></div><div className="scanner-answer-counts">{['A', 'B', 'C', 'D'].map(answer => <span className={answer === lastQuestionSummary.correctAnswer ? 'is-correct' : ''} key={answer}><b>{answer}</b><strong>{lastQuestionSummary.counts?.[answer] || 0}</strong></span>)}</div><p>{t('cardScan.correctAnswer')}: <b>{lastQuestionSummary.correctAnswer}</b></p></section> : null;
  const scannerQuestionControls = <>{allowStart && session.status === 'lobby' && <section className="dashboard-panel scanner-question-control"><p>{t('preparedGames.connectedHint')}</p><button className="primary-button" type="button" disabled={advancing || testMode} onClick={() => controlQuestion('start')}>{t('cardScan.start')}</button></section>}{session.status === 'playing' && questionId && <section className="dashboard-panel scanner-question-control"><div className="scanner-answer-summary"><div><h2>{questionClosed ? t('cardScan.questionResult', { current: session.currentQuestion + 1 }) : t('cardScan.answerSummary')}</h2><small>{t('cardScan.answersRecorded', { count: recordedAnswers })}</small></div><div className="scanner-answer-counts">{answerStats.map(item => <span className={questionClosed && item.answer === session.questionSummary?.correctAnswer ? 'is-correct' : ''} key={item.answer}><b>{item.answer}</b><strong>{item.count}</strong></span>)}</div></div>{questionClosed && <p className="card-question-closed-hint" role="status">{t('cardScan.correctAnswer')}: <b>{session.questionSummary?.correctAnswer}</b> · {t('cardScan.questionClosedHint')}</p>}<div className="scanner-question-buttons"><button className="secondary-button scanner-close-button" type="button" disabled={advancing || testMode || questionClosed} onClick={() => controlQuestion('close')}>{t('cardScan.endQuestion')}</button><button className="primary-button scanner-next-button" type="button" disabled={advancing || testMode || !questionClosed} onClick={() => controlQuestion('next')}>{advancing ? t('cardScan.advancing') : t('cardScan.scannerNext')}</button>{allowStart && <button className="secondary-button" type="button" disabled={advancing || testMode} onClick={() => { if (window.confirm(t('preparedGames.finishConfirm'))) controlQuestion('finish'); }}>{t('cardScan.finish')}</button>}</div></section>}{!questionClosed && previousQuestionSummary}</>;

  return <section className={`content-page card-session-page card-scanner-page ${isFullscreen ? 'card-scanner-fullscreen' : ''}`}><div className="dashboard-heading card-scanner-heading"><div><p className="eyebrow">{t('cardScan.eyebrow')}</p><h1>{t('cardScan.scannerTitle')}</h1><p className="muted-copy">{session.title}</p></div><div className="card-host-heading-actions"><span className="setup-badge">{statusLabel}</span>{questionId && <strong className="card-countdown">{seconds}s</strong>}</div></div><div className="dashboard-panel scanner-room-summary"><div><span>{t('cardScan.classInfo')}</span><strong>{session.className || '—'}</strong></div><div><span>{t('cardScan.students')}</span><strong>{session.players?.length || 0}</strong></div><div><span>{t('cardScan.connection')}</span><strong>{socket.connection === 'connected' ? t('cardScan.connected') : t('cardScan.disconnected')}</strong></div></div>{socket.error && <p className="error">{socket.error}</p>}{sessionError && <p className="error">{sessionError}</p>}{camera.cameraError && <p className="error">{camera.cameraError}</p>}{detectorError && <p className="error">{detectorError}</p>}{allowStart && session.status === 'lobby' && !isFullscreen && scannerQuestionControls}<div className="scanner-mode-actions"><button className={testMode ? 'secondary-button' : 'primary-button'} type="button" onClick={cameraEnabled ? closeCamera : openCamera}>{cameraEnabled ? t('cardScan.closeCamera') : t('cardScan.openCamera')}</button><button className={testMode ? 'primary-button' : 'secondary-button'} type="button" onClick={() => { setTestMode(value => !value); setTestResults([]); if (!cameraEnabled) openCamera(); }}>{testMode ? t('cardScan.stopTest') : t('cardScan.startTest')}</button></div>{testMode && <div className="scanner-test-banner"><b>{t('cardScan.testMode')}</b><span>{t('cardScan.testModeHint')}</span></div>}<div className="card-scanner-layout">{cameraEnabled ? <div className={`card-camera ${acceptingAnswers || testMode ? 'is-scanning' : ''}`} ref={scannerRef}><Webcam ref={camera.webcamRef} audio={false} mirrored={false} playsInline videoConstraints={{ facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }} onUserMedia={camera.onUserMedia} onUserMediaError={camera.onUserMediaError} /><div className="card-camera-guide" aria-hidden="true"><i className="camera-guide-corner top-left" /><i className="camera-guide-corner top-right" /><i className="camera-guide-corner bottom-left" /><i className="camera-guide-corner bottom-right" /></div><div className={`scanner-live-feedback ${latestScan ? 'has-result' : ''}`} aria-live="polite"><span className="scanner-live-indicator" /><div><small>{cameraStatus}</small>{latestScan ? <strong>#{latestScan.markerId} · {latestScan.answer}</strong> : <b>{questionClosed ? t('cardScan.waitingNext') : t('cardScan.detected')}</b>}</div></div><button className="card-camera-fullscreen" type="button" aria-label={isFullscreen ? t('cardScan.exitFullscreen') : t('cardScan.fullscreen')} title={isFullscreen ? t('cardScan.exitFullscreen') : t('cardScan.fullscreen')} onClick={toggleFullscreen} />{isFullscreen && <div className="scanner-camera-controls">{scannerQuestionControls}</div>}</div> : <div className="dashboard-panel card-camera-placeholder"><span>▣</span><h2>{t('cardScan.cameraReadyTitle')}</h2><p>{t('cardScan.cameraReadyHint')}</p><button className="primary-button" type="button" onClick={openCamera}>{t('cardScan.openCamera')}</button></div>}<aside className="dashboard-panel card-scanner-info"><div className="scanner-diagnostic"><span className={camera.cameraState === 'ready' ? 'ready' : ''} /><b>{camera.cameraState === 'ready' ? t('cardScan.cameraActive') : t('cardScan.cameraInactive')}</b><small>{t('cardScan.processedFrames', { count: diagnostics.frames })}</small></div><h2>{testMode ? t('cardScan.testResults') : questionClosed ? t('cardScan.questionClosed') : t('cardScan.detected')}</h2><p>{questionClosed ? t('cardScan.questionClosedHint') : t('cardScan.cameraHint')}</p><div className="card-detected">{seen.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div>{testMode ? <><h3>{t('cardScan.stableDetections')}</h3><div className="card-detected test-results">{testResults.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div>{!testResults.length && <small className="muted-copy">{t('cardScan.noTestDetection')}</small>}</> : <><h3>{t('cardScan.sent')}</h3><div className="card-detected">{recent.map(item => <span key={item.markerId}>#{item.markerId} · {item.answer}</span>)}</div></>}</aside></div>{!isFullscreen && !(allowStart && session.status === 'lobby') && scannerQuestionControls}<ScannerRoster players={session.players} questionId={questionId} t={t} /></section>;
}
