import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rocket, RotateCcw, Shuffle } from 'lucide-react';
import { groupStudents, pickStudents } from './classroom-random';
import UfoGameStage from './UfoGameStage';
import './class-workspace-i18n';

function loadSession(key) {
  try {
    const data = JSON.parse(sessionStorage.getItem(key));
    return { called: Array.isArray(data?.called) ? data.called.filter(id => typeof id === 'string') : [], rounds: Array.isArray(data?.rounds) ? data.rounds.filter(round => Array.isArray(round) && round.every(id => typeof id === 'string')).slice(0, 8) : [], total: Number.isSafeInteger(data?.total) && data.total >= 0 ? data.total : 0 };
  } catch { return { called: [], rounds: [], total: 0 }; }
}

export default function ClassStudentCaller({ students, classId, teacherId, onError }) {
  const { t } = useTranslation('classWorkspace');
  const storageKey = `quizzz.caller.${teacherId}.${classId}`;
  const [session, setSession] = useState(() => loadSession(storageKey));
  const [excluded, setExcluded] = useState([]);
  const [count, setCount] = useState(1);
  const [noRepeat, setNoRepeat] = useState(true);
  const [mission, setMission] = useState(null);
  const [flightProgress, setFlightProgress] = useState({ phase: 'approach', captured: 0 });
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false);
  const [showResults, setShowResults] = useState(true);
  const [resultIds, setResultIds] = useState([]);
  const [groupCount, setGroupCount] = useState(4);
  const [groups, setGroups] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [notice, setNotice] = useState('');
  const gameRef = useRef(null);
  const missionRef = useRef(null);
  const missionSequence = useRef(0);
  const spinning = !!mission;
  const rosterKey = students.map(student => student.studentId).join(',');
  const present = students.filter(student => !excluded.includes(student.studentId));
  const available = present.filter(student => !noRepeat || !session.called.includes(student.studentId));
  const actualCount = Math.min(available.length, Math.max(1, Math.floor(Number(count) || 1)));
  const results = resultIds.map(id => students.find(student => student.studentId === id)).filter(Boolean);

  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify(session)); } catch { /* Storage may be disabled. */ } }, [storageKey, session]);
  useEffect(() => {
    setResultIds([]); setGroups([]); setMission(null); missionRef.current = null;
    return () => { missionRef.current = null; };
  }, [rosterKey]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);

  function launch() {
    if (missionRef.current || !actualCount) return;
    const selected = pickStudents(present, actualCount, session.called, noRepeat);
    const nextMission = { id: ++missionSequence.current, winnerIds: selected.map(student => student.studentId), reducedMotion };
    missionRef.current = nextMission;
    setResultIds([]); setShowResults(true); setNotice(''); setFlightProgress({ phase: 'approach', captured: 0 }); setMission(nextMission);
  }
  function finishMission(id) {
    const current = missionRef.current;
    if (!current || current.id !== id) return;
    missionRef.current = null;
    setResultIds(current.winnerIds); setMission(null);
    setSession(previous => ({ called: [...new Set([...previous.called, ...current.winnerIds])], rounds: [current.winnerIds, ...previous.rounds].slice(0, 8), total: previous.total + 1 }));
  }
  function changePresence(ids) { setExcluded(ids); setGroups([]); setResultIds([]); }

  const controls = <div className="caller-controls ufo-play-controls"><label className="field">{t('callCount')}<input type="number" min="1" max={Math.max(1, available.length)} value={available.length ? actualCount : 1} disabled={spinning || !available.length} onChange={event => setCount(event.target.value)} /></label><button type="button" className="primary-button" disabled={spinning || !available.length} onClick={launch}><Rocket size={18} />{t(spinning ? 'flying' : 'start')}</button>{spinning ? <button type="button" className="secondary-button ufo-game-skip" onClick={() => { const id = missionRef.current?.id; gameRef.current?.skip(); finishMission(id); }}>{t('gameSkip')}</button> : <button type="button" className="secondary-button" onClick={() => { gameRef.current?.reset(); setSession({ called: [], rounds: [], total: 0 }); setResultIds([]); setNotice(t('resetDone')); }}><RotateCcw size={18} />{t('reset')}</button>}</div>;

  return <section className="class-caller" aria-label={t('callerTitle')}>
    <div className="class-caller-heading"><div><p className="eyebrow">{t('caller')}</p><h2>{t('callerTitle')}</h2><p className="muted-copy">{t('callerDescription')}</p></div></div>
    <div className="class-caller-layout"><div className="class-caller-main">
      <label className="field caller-question-input">{t('prompt')}<textarea rows={2} maxLength={1000} value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={t('promptPlaceholder')} /></label>
      <UfoGameStage ref={gameRef} students={present} mission={mission} reducedMotion={reducedMotion} progress={flightProgress} prompt={prompt} onComplete={finishMission} onProgress={setFlightProgress} onFullscreenChange={setFullscreen} onFullscreenError={onError} controls={controls} capturedStudents={!spinning ? results : []} showResults={showResults} onShowResults={() => setShowResults(true)} onDismissResults={() => setShowResults(false)} />
      {!fullscreen && controls}
      <label className="check"><input type="checkbox" checked={noRepeat} disabled={spinning} onChange={event => setNoRepeat(event.target.checked)} />{t('noRepeat')}</label>
      <div className="ufo-flight-options"><label className="check"><input type="checkbox" checked={reducedMotion} disabled={spinning} onChange={event => setReducedMotion(event.target.checked)} />{t('gameReducedMotion')}</label></div>
      <p className="muted-copy" role="status">{notice || (!present.length ? t('noPresent') : !available.length ? t('exhausted') : t('remaining', { count: available.length }))}</p>
      {!!session.rounds.length && <details className="caller-history"><summary>{t('history')}</summary>{session.rounds.map((ids, i) => <p key={i}><b>{t('round', { number: session.total - i })}</b><span>{ids.map(id => students.find(student => student.studentId === id)?.nickname).filter(Boolean).join(' · ') || '—'}</span></p>)}</details>}
      <section className="caller-group-panel"><h3>{t('groups')}</h3><p className="muted-copy">{t('groupsHint')}</p><div className="caller-controls"><label className="field">{t('groupCount')}<input type="number" min="1" max={Math.max(1, present.length)} value={Math.min(Math.max(1, present.length), Math.max(1, Number(groupCount) || 1))} disabled={spinning} onChange={event => setGroupCount(event.target.value)} /></label><button type="button" className="secondary-button" disabled={spinning || !present.length} onClick={() => setGroups(groupStudents(present, groupCount))}><Shuffle size={18} />{t('makeGroups')}</button></div><div className="caller-groups">{groups.map((group, i) => <article key={i}><b>{t('group', { number: i + 1 })}</b>{group.map(student => <span key={student.studentId}>{student.nickname}</span>)}</article>)}</div></section>
    </div><aside className="caller-presence"><h3>{t('presence')}</h3><p className="muted-copy">{t('presenceHint')}</p><strong>{t('selectedCount', { count: present.length, total: students.length })}</strong><div className="caller-presence-actions"><button type="button" className="text-button" disabled={spinning} onClick={() => changePresence([])}>{t('selectAll')}</button><button type="button" className="text-button" disabled={spinning} onClick={() => changePresence(students.map(student => student.studentId))}>{t('clearPresence')}</button></div><div className="caller-presence-list">{students.map((student, index) => <label key={student.studentId}><input type="checkbox" disabled={spinning} checked={!excluded.includes(student.studentId)} onChange={event => changePresence(event.target.checked ? excluded.filter(id => id !== student.studentId) : [...excluded, student.studentId])} /><span><b>{index + 1}. {student.nickname}</b><small>{student.username || ''}</small></span>{session.called.includes(student.studentId) && <small className="caller-called">{t('called')}</small>}</label>)}</div><p className="muted-copy">{t('sessionHint')}</p></aside></div>
  </section>;
}
