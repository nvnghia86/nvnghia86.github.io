import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Orbit, Radio, RefreshCw, Maximize, Minimize } from 'lucide-react';
import GameAudioControls from './GameAudioControls';
import { useGameAudio } from './use-game-audio';
import './ufo-game.css';

const UfoGameStage = forwardRef(function UfoGameStage({ students, mission, reducedMotion, progress, prompt, onComplete, onProgress, onFullscreenChange, onFullscreenError, controls, capturedStudents = [], showResults = true, onShowResults, onDismissResults }, ref) {
  const { t } = useTranslation('classWorkspace');
  const canvasRef = useRef(null);
  const spriteCanvasRef = useRef(null);
  const arenaRef = useRef(null);
  const sceneRef = useRef(null);
  const latest = useRef({ students, mission, onComplete, onProgress, onFullscreenChange });
  latest.current = { students, mission, onComplete, onProgress, onFullscreenChange };
  const playedRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [revision, setRevision] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [quality, setQuality] = useState('auto');
  const sound = useGameAudio();
  const lastSound = useRef(null);
  const rosterKey = students.map(student => `${student.studentId}:${student.nickname}`).join('|');

  useEffect(() => {
    const previous = lastSound.current;
    if (!mission) {
      sound.audio.setMusic(null);
      if (previous && capturedStudents.length) sound.audio.play('success');
      lastSound.current = null;
      return;
    }
    if (status !== 'ready') return;
    const phase = `${progress.phase}:${progress.captured || 0}`;
    sound.audio.setMusic('ufo');
    if (previous?.id !== mission.id) sound.audio.play('launch');
    else if (previous.phase !== phase) {
      if (progress.phase === 'capture') sound.audio.play('beam');
      else if (progress.phase === 'departure') sound.audio.play('depart');
    }
    lastSound.current = { id: mission.id, phase };
  }, [mission, progress.phase, progress.captured, capturedStudents.length, status, sound.audio]);

  useImperativeHandle(ref, () => ({ skip() { sceneRef.current?.skip(); }, reset() { sceneRef.current?.reset(); } }), []);
  useEffect(() => {
    const sync = () => { const value = document.fullscreenElement === arenaRef.current; setFullscreen(value); latest.current.onFullscreenChange?.(value); };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === arenaRef.current) await document.exitFullscreen();
      else if (arenaRef.current?.requestFullscreen) await arenaRef.current.requestFullscreen();
      else onFullscreenError?.(t('fullscreenFailed'));
    } catch { onFullscreenError?.(t('fullscreenFailed')); }
  }
  useEffect(() => {
    let cancelled = false;
    setStatus('loading'); playedRef.current = null;
    import('./ufo-scene').then(async ({ createUfoScene }) => {
      if (cancelled) return;
      const controller = await createUfoScene(canvasRef.current, {
        spriteCanvas: spriteCanvasRef.current,
        onProgress: value => { if (!cancelled) latest.current.onProgress(value); },
        onComplete: () => { if (!cancelled) latest.current.onComplete(latest.current.mission?.id); },
        onFailure: error => { if (!cancelled) { if (import.meta.env.DEV) console.warn('UFO scene stopped', error); setStatus('failed'); sceneRef.current?.dispose(); sceneRef.current = null; } },
      });
      if (cancelled) { controller.dispose(); return; }
      sceneRef.current = controller;
      setStatus('ready');
    }).catch(error => { if (!cancelled) { if (import.meta.env.DEV) console.warn('UFO scene could not start', error); setStatus('failed'); } });
    return () => { cancelled = true; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [revision]);
  useEffect(() => { if (status === 'ready') { sceneRef.current.setStudents(latest.current.students); playedRef.current = null; } }, [status, rosterKey]);
  useEffect(() => { if (status === 'ready') sceneRef.current.setReducedMotion(reducedMotion); }, [reducedMotion, status]);
  useEffect(() => { if (status === 'ready') sceneRef.current.setQuality?.(quality); }, [quality, status]);
  useEffect(() => {
    if (!mission) { sceneRef.current?.cancel(); return; }
    if (status === 'failed') { latest.current.onComplete(mission.id); return; }
    if (status === 'ready' && playedRef.current !== mission.id) {
      playedRef.current = mission.id;
      sceneRef.current.start(mission.winnerIds, mission.reducedMotion);
    }
  }, [mission, status, rosterKey]);
  const phase = !mission ? 'gameReady' : progress.phase === 'capture' ? 'gameCapturing' : progress.phase === 'departure' ? 'gameReturning' : 'gameEscaping';

  return <div className={`ufo-game ${fullscreen ? 'ufo-game-fullscreen' : ''}`} ref={arenaRef} data-scene-state={status} data-flight-phase={mission ? progress.phase : 'idle'} aria-busy={!!mission}>
    <canvas ref={spriteCanvasRef} className="ufo-game-sprites" role="img" aria-label={t('gameCanvasLabel')} />
    <canvas ref={canvasRef} className="ufo-game-canvas" aria-hidden="true" />
    <ul className="ufo-game-roster-accessible" aria-label={t('presence')}>{students.map(student => <li key={student.studentId}>{student.nickname}</li>)}</ul>
    <div className="ufo-game-hud"><span className="ufo-game-world"><Orbit size={15} />{t('gameWorld')}</span><span className="ufo-game-roster"><Radio size={14} />{t('students', { count: students.length })}</span></div>
    <div className="ufo-game-transmission" role="status"><i aria-hidden="true" /><span>{t(phase)}</span>{mission && <b>{t('gameProgress', { count: progress.captured || 0, total: mission.winnerIds.length })}</b>}</div>
    {prompt && <div className="ufo-game-question"><small>{t('gameTask')}</small><p>{prompt}</p></div>}
    {status === 'loading' && <div className="ufo-game-cover" role="status"><Orbit className="ufo-loading-icon" size={34} /><strong>{t('gameLoading')}</strong></div>}
    {status === 'failed' && <div className="ufo-game-cover ufo-game-unavailable"><Orbit size={42} /><strong>{t('gameUnavailable')}</strong><p>{t('gameFallback')}</p><button type="button" className="secondary-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} />{t('retry')}</button></div>}
    <button type="button" className="ufo-game-fullscreen-button" aria-label={t(fullscreen ? 'exitFullscreen' : 'fullscreen')} title={t(fullscreen ? 'exitFullscreen' : 'fullscreen')} onClick={toggleFullscreen}>{fullscreen ? <Minimize size={19} /> : <Maximize size={19} />}</button>
    <label className="ufo-game-quality"><span>{t('gameQuality')}</span><select aria-label={t('gameQuality')} value={quality} onChange={event => setQuality(event.target.value)}><option value="auto">{t('gameQualityAuto')}</option><option value="smooth">{t('gameQualitySmooth')}</option><option value="high">{t('gameQualityHigh')}</option></select></label>
    <GameAudioControls {...sound} />
    {capturedStudents.length > 0 && (showResults ? <section className="ufo-game-results" role="region" aria-live="polite" aria-label={t('gameCaptured', { count: capturedStudents.length })}><div className="ufo-game-results-heading"><h3>{t('gameCaptured', { count: capturedStudents.length })}</h3><button type="button" className="text-button" onClick={onDismissResults}>{t('gameContinue')}</button></div><div className="ufo-winners">{capturedStudents.map(student => <article key={student.studentId} className="ufo-winner"><strong>{student.nickname}</strong><small>{student.username || ''}</small></article>)}</div></section> : <button type="button" className="ufo-game-last-results" onClick={onShowResults}>{t('gameCaptured', { count: capturedStudents.length })}</button>)}
    {fullscreen && <div className="ufo-game-controls">{controls}</div>}
  </div>;
});
export default UfoGameStage;
