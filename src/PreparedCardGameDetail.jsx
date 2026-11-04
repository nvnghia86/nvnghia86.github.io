import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TableAction from './TableAction';
import QuestionMedia from './QuestionMedia';
import GameQuestionPicker from './GameQuestionPicker';
import './prepared-card-games.css';

const letters = ['A', 'B', 'C', 'D'];

function RunStatistics({ api, game, refresh }) {
  const { t, i18n } = useTranslation('preparedGames');
  const [runId, setRunId] = useState(game.runs[0]?.id || '');
  const [data, setData] = useState(null), [error, setError] = useState(''), [failed, setFailed] = useState(false);
  const date = value => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  const number = value => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(value);
  useEffect(() => {
    if (!game.runs.some(run => run.id === runId)) setRunId(game.runs[0]?.id || '');
  }, [game.runs, runId]);
  useEffect(() => {
    if (!runId) return undefined;
    let active = true; setData(null); setError(''); setFailed(false);
    api(`/card-games/${game.id}/runs/${runId}`, { silent: true }).then(result => { if (active) setData(result); }).catch(failure => { if (active) { setError(failure.message); setFailed(true); } });
    return () => { active = false; };
  }, [api, game.id, game.runs, runId]);
  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(''), 10000);
    return () => window.clearTimeout(timer);
  }, [error]);
  if (!game.runs.length) return <section className="panel"><h2>{t('detail.statistics')}</h2><p className="empty-state compact">{t('detail.noRuns')}</p></section>;
  return <section className="panel prepared-statistics" id="statistics">
    <div className="panel-heading"><h2>{t('detail.statistics')}</h2><button className="secondary-button" type="button" onClick={refresh}>{t('detail.refresh')}</button></div>
    <label className="field">{t('detail.run')}<select value={runId} onChange={event => setRunId(event.target.value)}>{game.runs.map((run, index) => <option value={run.id} key={run.id}>{t('detail.runLabel', { number: game.runs.length - index })} · {date(run.startedAt)} · {t(`detail.${run.status === 'playing' ? 'playing' : 'finished'}`)}</option>)}</select></label>
    {error ? <p role="alert" className="error">{error}</p> : !data ? <p role="status">{t(failed ? 'detail.statsError' : 'loading')}</p> : <>
      <p className="muted-copy">{date(data.run.startedAt)}{data.run.finishedAt && ` → ${date(data.run.finishedAt)}`}</p>
      {data.run.status === 'playing' && <p className="prepared-info" role="status">{t('detail.liveHint')}</p>}
      <div className="prepared-summary">{[['students', data.studentCount], ['closedQuestions', `${data.completedQuestions}/${data.questionCount}`], ['accuracy', `${number(data.accuracy)}%`], ['averageScore', number(data.averageScore)]].map(([key, value]) => <div key={key}><span>{t(`detail.${key}`)}</span><strong>{value}</strong></div>)}</div>
      <h3>{t('detail.studentResults')}</h3><div className="table-scroll"><table className="management-table"><thead><tr>{['rank','student','score','correct','incorrect','unanswered'].map(key => <th key={key}>{t(`detail.${key}`)}</th>)}</tr></thead><tbody>{data.students.map((student, index) => <tr key={student.id}><td>{index + 1}</td><td><strong>{student.nickname}</strong><small>#{student.markerId}</small></td><td>{student.score}</td><td>{student.correctCount}</td><td>{student.incorrectCount}</td><td>{student.unansweredCount}</td></tr>)}</tbody></table></div>
      <h3>{t('detail.questionResults')}</h3><div className="prepared-question-list">{data.questions.map(question => <article className="prepared-question" key={question.id}>
        <p className="eyebrow">{t('detail.questionNumber', { number: question.position + 1 })} · {t(`detail.${question.isClosed ? 'closed' : question.wasAsked ? 'inProgress' : 'notAsked'}`)}</p><h4>{question.question}</h4><QuestionMedia question={question} />
        <div className="prepared-answer-grid">{question.options.map((option, index) => <div className={question.correctAnswer === letters[index] ? 'is-correct' : ''} key={index}><span><b>{letters[index]}.</b> {option}</span><strong>{question.isClosed ? t('detail.selectedCount', { count: question.counts[letters[index]] }) : '—'}</strong>{question.correctAnswer === letters[index] && <small>{t('detail.correctAnswer')}</small>}</div>)}</div>
        {question.isClosed && <p className="muted-copy">{t('detail.responseSummary', { answered: question.answeredCount, unanswered: question.unansweredCount })}</p>}
      </article>)}</div>
    </>}
  </section>;
}

export default function PreparedCardGameDetail({ api }) {
  const { gameId } = useParams();
  const [params, setParams] = useSearchParams();
  const { t } = useTranslation('preparedGames');
  const [game, setGame] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [draft, setDraft] = useState(null), [busy, setBusy] = useState(false), [loadFailed, setLoadFailed] = useState(false);
  const [classes, setClasses] = useState([]), [bank, setBank] = useState([]), [bankLoading, setBankLoading] = useState(false), [picker, setPicker] = useState(false);
  const requestedEdit = useRef(false);
  const edit = item => { setDraft({ ...item, pin: '', questions: item.questions.map(question => ({ ...question, options: [...question.options] })) }); setMessage(''); };
  useEffect(() => {
    let active = true; setGame(null); setDraft(null); setError(''); setLoadFailed(false); requestedEdit.current = false;
    api(`/card-games/${gameId}`, { silent: true }).then(data => { if (active) setGame(data); }).catch(failure => { if (active) { setError(failure.message); setLoadFailed(true); } });
    return () => { active = false; };
  }, [api, gameId]);
  useEffect(() => {
    if (!game || requestedEdit.current) return;
    requestedEdit.current = true;
    if (params.get('edit') === '1' && game.canEdit) edit(game);
  }, [game, params]);
  useEffect(() => {
    if (game && !draft && params.get('tab') === 'statistics') document.getElementById('statistics')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [gameId, Boolean(game), Boolean(draft), params]);
  useEffect(() => {
    if (!error) return undefined;
    const timer = window.setTimeout(() => setError(''), 10000);
    return () => window.clearTimeout(timer);
  }, [error]);
  const editing = Boolean(draft);
  useEffect(() => {
    if (!editing) return undefined;
    let active = true; setBankLoading(true);
    Promise.all([api('/classes', { silent: true }), api('/questions', { silent: true })]).then(([classData, questionData]) => {
      if (active) { setClasses((classData.items || []).filter(item => item.isActive !== false)); setBank(questionData.items || []); }
    }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setBankLoading(false); });
    return () => { active = false; };
  }, [api, editing]);
  async function refresh() {
    try { const data = await api(`/card-games/${gameId}`, { silent: true }); setGame(data); setLoadFailed(false); }
    catch (failure) { setError(failure.message); setLoadFailed(true); }
  }
  async function save(event) {
    event.preventDefault(); if (busy || !draft.questions.length) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await api(`/card-games/${gameId}`, { method: 'PATCH', silent: true, body: JSON.stringify({ version: draft.version, title: draft.title, classId: draft.classId, timeLimitSeconds: Number(draft.timeLimitSeconds), pin: draft.pin, questionIds: draft.questions.map(question => question.id), questionEdits: draft.questions.map(({ id, question, options, answer }) => ({ id, question, options, answer })) }) });
      setGame(data); setDraft(null); setParams({}, { replace: true }); setMessage('detail.saved');
    } catch (failure) {
      setError(failure.message);
      // Keep entered changes visible on validation/network failures. A fresh read
      // still revokes editing if another device has already started the game.
      try { const current = await api(`/card-games/${gameId}`, { silent: true }); setGame(current); if (!current.canEdit) setDraft(null); } catch { /* The teacher can retry once the connection returns. */ }
    } finally { setBusy(false); }
  }
  const changeQuestion = (id, changes) => setDraft(previous => ({ ...previous, questions: previous.questions.map(question => question.id === id ? { ...question, ...changes } : question) }));
  const move = (index, offset) => setDraft(previous => { const questions = [...previous.questions]; [questions[index], questions[index + offset]] = [questions[index + offset], questions[index]]; return { ...previous, questions }; });
  const pickerQuestions = [...new Map([...bank, ...(draft?.questions || [])].map(question => [question.id, question])).values()];
  const toggle = id => setDraft(previous => ({ ...previous, questions: previous.questions.some(question => question.id === id) ? previous.questions.filter(question => question.id !== id) : previous.questions.length < 30 ? [...previous.questions, pickerQuestions.find(question => question.id === id)] : previous.questions }));
  return <section className="content-page prepared-detail">
    <Link to="/teacher/card-scan" className="text-button">← {t('detail.back')}</Link>
    {error && <p className="error" role="alert">{error}</p>}{message && <p className="prepared-info" role="status">{t(message)}</p>}
    {!game ? <div className="panel"><p role="status">{loadFailed ? t('detail.loadError') : t('loading')}</p>{loadFailed && <button className="secondary-button" onClick={refresh}>{t('retry')}</button>}</div> : <>
      <div className="dashboard-heading"><div><p className="eyebrow">{t('savedTitle')}</p><h1>{game.title}</h1><p className="muted-copy">{game.className} · {t('detail.questionCount', { count: game.questionCount })} · {t('detail.seconds', { count: game.timeLimitSeconds })}</p></div><span className={`prepared-status ${game.playStatus}`}>{t(`detail.${game.playStatus}`)}</span></div>
      {editing ? <form className="panel prepared-edit" onSubmit={save}>
        <h2>{t('detail.edit')}</h2><p className="prepared-info">{t('detail.editHint')}</p>
        <fieldset disabled={busy}><div className="form-grid">
          <label className="field wide">{t('detail.title')}<input required maxLength={120} value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} /></label>
          <label className="field">{t('class')}<select required value={draft.classId} onChange={event => setDraft({ ...draft, classId: event.target.value })}>{!classes.some(item => item.id === draft.classId) && <option value={draft.classId}>{draft.className}</option>}{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="field">{t('detail.time')}<input type="number" min={10} max={120} required value={draft.timeLimitSeconds} onChange={event => setDraft({ ...draft, timeLimitSeconds: event.target.value })} /></label>
          <label className="field wide">{t('detail.newPin')}<input type="password" autoComplete="new-password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={draft.pin} onChange={event => setDraft({ ...draft, pin: event.target.value.replace(/\D/g, '').slice(0, 6) })} /><small>{t('detail.keepPin')}</small></label>
        </div><div className="panel-heading"><h3>{t('detail.questionCount', { count: draft.questions.length })}</h3><button className="secondary-button" type="button" disabled={bankLoading} onClick={() => setPicker(true)}>{t('detail.pickQuestions')}</button></div>
        <div className="prepared-question-list">{draft.questions.map((question, index) => <article className="prepared-question" key={question.id}>
          <div className="panel-heading"><h3>{t('detail.questionNumber', { number: index + 1 })}</h3><div className="prepared-game-actions"><TableAction action="promote" label={t('detail.moveUp')} disabled={!index} onClick={() => move(index, -1)} /><TableAction action="demote" label={t('detail.moveDown')} disabled={index === draft.questions.length - 1} onClick={() => move(index, 1)} /><TableAction action="delete" label={t('detail.remove')} danger onClick={() => toggle(question.id)} /></div></div>
          <label className="field">{t('detail.questionText')}<textarea required maxLength={6000} value={question.question} onChange={event => changeQuestion(question.id, { question: event.target.value })} /></label><QuestionMedia question={question} />
          <div className="prepared-answer-grid">{question.options.map((option, optionIndex) => <div key={optionIndex} className={question.answer === optionIndex ? 'is-correct' : ''}><label className="field">{t('detail.option', { letter: letters[optionIndex] })}<input required maxLength={2000} value={option} onChange={event => changeQuestion(question.id, { options: question.options.map((value, position) => position === optionIndex ? event.target.value : value) })} /></label><label className="prepared-correct-choice"><input type="radio" name={`answer-${question.id}`} checked={question.answer === optionIndex} onChange={() => changeQuestion(question.id, { answer: optionIndex })} />{t('detail.correctAnswer')}</label></div>)}</div>
        </article>)}</div>{!draft.questions.length && <p className="muted-copy">{t('detail.chooseAtLeastOne')}</p>}
        {draft.version !== game.version && <p className="prepared-info">{t('detail.conflictHint')} <button type="button" className="text-button" onClick={() => { edit(game); setError(''); }}>{t('detail.reload')}</button></p>}
        <div className="prepared-detail-actions"><button className="primary-button" disabled={busy || !draft.questions.length || draft.version !== game.version} type="submit">{busy ? t('loading') : t('detail.saveChanges')}</button><button className="secondary-button" type="button" onClick={() => { setDraft(null); setParams({}, { replace: true }); }}>{t('detail.cancel')}</button></div></fieldset>
      </form> : <>
        <div className="prepared-detail-actions">{game.canEdit && <button className="primary-button" onClick={() => edit(game)}>{t('detail.edit')}</button>}<a className="secondary-button" href={`${import.meta.env.BASE_URL}office/card-game.html#game=${game.presentationKey}`} target="_blank" rel="noreferrer">{t('present')}</a><button className="secondary-button" onClick={refresh}>{t('detail.refresh')}</button></div>
        <p className="muted-copy">{t(game.canEdit ? 'detail.editableHint' : 'detail.lockedHint')}</p>
        <section className="panel"><h2>{t('detail.content')}</h2><div className="prepared-question-list">{game.questions.map((question, index) => <article className="prepared-question" key={question.id}><p className="eyebrow">{t('detail.questionNumber', { number: index + 1 })}</p><h3>{question.question}</h3><QuestionMedia question={question} /><div className="prepared-answer-grid">{question.options.map((option, optionIndex) => <div key={optionIndex} className={question.answer === optionIndex ? 'is-correct' : ''}><span><b>{letters[optionIndex]}.</b> {option}</span>{question.answer === optionIndex && <small>{t('detail.correctAnswer')}</small>}</div>)}</div></article>)}</div></section>
        <RunStatistics api={api} game={game} refresh={refresh} key={gameId} />
      </>}
    </>}
    {picker && draft && <GameQuestionPicker questions={pickerQuestions} selected={draft.questions.map(question => question.id)} onToggle={toggle} onClose={() => setPicker(false)} api={api} cardScan />}
  </section>;
}
