import QuestionMedia from './QuestionMedia';
import GameQuestionPicker from './GameQuestionPicker';
import { PreparedCardGames } from './PreparedCardGames';
import { getQuestionGestures } from './pose-gesture-library';
import PoseArenaTeacherLive from './PoseArenaTeacherLive';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import './game-room-builder.css';

const emptyForm = { title: '', quizId: '', classId: '', questionCount: 10, timeLimitSeconds: 20 };

function RoomClassSelector({ classes, value, onChange, t, required = false }) {
  const selected = classes.find(item => item.id === value);
  return <label className="field wide">{t('roomBuilder.classLabel')}
    <select value={value} required={required} onChange={event => onChange(event.target.value)}>
      <option value="">{t('roomBuilder.noClass')}</option>
      {classes.map(item => <option key={item.id} value={item.id}>{item.name} · {t('roomBuilder.studentCount', { count: item.studentCount || 0 })}</option>)}
    </select>
    <small className="muted-copy">{selected ? t('roomBuilder.classHint', { count: selected.studentCount || 0 }) : t('roomBuilder.noClassHint')}</small>
  </label>;
}

function useNativeFullscreen(elementRef, activeKey) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setIsFullscreen(document.fullscreenElement === elementRef.current);
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [activeKey, elementRef]);
  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await elementRef.current?.requestFullscreen?.();
    } catch {
      // A normal stage remains available when the browser declines fullscreen.
    } finally {
      setIsFullscreen(document.fullscreenElement === elementRef.current);
    }
  };
  const reset = () => setIsFullscreen(false);
  return { isFullscreen, toggle, reset };
}

export function GameRoomBuilder({ api, API, EventSource, onError, mode = 'realtime' }) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialClassId = mode === 'body-pose' ? '' : searchParams.get('classId') || '';
  const headTilt = mode === 'head-tilt';
  const cardScan = mode === 'card-scan';
  const bodyPose = mode === 'body-pose';
  const [prepare, setPrepare] = useState(false), [pin, setPin] = useState(''), [saving, setSaving] = useState(false), [savedRevision, setSavedRevision] = useState(0);
  const [form, setForm] = useState({ ...emptyForm, classId: initialClassId, title: headTilt ? 'Đấu trường so sánh Toán học' : bodyPose ? t('poseArena:teacherDefaultTitle') : cardScan ? t('cardScan.defaultTitle') : 'Quiz realtime' });
  useEffect(() => { setForm(previous => ({ ...previous, classId: initialClassId })); }, [initialClassId]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]); const [questions, setQuestions] = useState([]); const [classes, setClasses] = useState([]); const [selected, setSelected] = useState([]); const [pickerOpen, setPickerOpen] = useState(false); const [room, setRoom] = useState(null); const streamRef = useRef(null);
  const liveRef = useRef(null); const { isFullscreen: isLiveFullscreen, toggle: toggleLiveFullscreen, reset: resetLiveFullscreen } = useNativeFullscreen(liveRef, room?.id || null);
  const questionType = headTilt ? 'comparison' : '';
  useEffect(() => { setQuestionsLoading(true); Promise.all([api(`/quiz-sets?gameType=${headTilt ? 'head-tilt' : 'realtime'}`), api(`/questions${questionType ? `?type=${questionType}` : ''}`)]).then(([quizData, questionData]) => { setQuizzes((quizData.items || []).filter(item => !cardScan || item.gameType !== 'head-tilt')); setQuestions(questionData.items || []); }).catch(error => onError(error.message)).finally(() => setQuestionsLoading(false)); if (!bodyPose) api('/classes').then(classData => setClasses((classData.items || []).filter(item => item.isActive !== false))).catch(error => onError(error.message)); }, [headTilt, cardScan, bodyPose, questionType]);
  useEffect(() => () => streamRef.current?.close(), []);
  const selectedQuestions = useMemo(() => questions.filter(item => selected.includes(item.id)), [questions, selected]);
  async function create(event) { event.preventDefault(); if (cardScan && prepare) { if (!/^\d{6}$/.test(pin)) return onError(t('preparedGames.pinHint')); setSaving(true); try { await api('/card-games', { method: 'POST', body: JSON.stringify({ ...form, pin, ...(form.quizId ? {} : { questionIds: selected }) }) }); setPin(''); setSavedRevision(value => value + 1); } catch (error) { onError(error.message); } finally { setSaving(false); } return; } if (!form.quizId && !selected.length) return onError('Hãy chọn một bộ quiz hoặc chọn câu hỏi trực tiếp.'); if (cardScan && !form.classId) return onError(t('cardScan.chooseClass')); try { const url = form.quizId ? '/rooms' : '/rooms?source=questions'; const { classId, ...classlessForm } = form; const payload = { ...(bodyPose ? classlessForm : form), gameMode: mode, answerMode: headTilt ? 'comparison' : 'standard', questionCount: Number(form.questionCount), timeLimitSeconds: Number(form.timeLimitSeconds), ...(form.quizId ? {} : { questionIds: selected }) }; const result = await api(url, { method: 'POST', body: JSON.stringify(payload) }); if (cardScan) { window.location.hash = `#/quiz/${result.room.id}/host`; return; } resetLiveFullscreen(); setRoom(result.room); const source = new (EventSource || window.EventSource)(`${API || '/api/v1'}/rooms/${result.room.code}/events`); source.addEventListener('room', eventItem => setRoom(JSON.parse(eventItem.data))); streamRef.current = source; } catch (error) { onError(error.message); } }
  async function roomAction(action) { try { const result = await api(`/rooms/${room.code}/${action}`, { method: 'POST' }); setRoom(result.room); } catch (error) { onError(error.message); } }
  async function checkHostAnswer(answer) { return api(`/rooms/${room.code}/host-answer`, { method: 'POST', body: JSON.stringify({ answer }) }); }
  async function leaveRoom() {
    streamRef.current?.close();
    streamRef.current = null;
    resetLiveFullscreen();
    try { if (document.fullscreenElement === liveRef.current) await document.exitFullscreen(); } catch { /* The room still closes if the browser rejects exitFullscreen. */ }
    setRoom(null);
  }
  const toggleQuestion = id => setSelected(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  if (room && bodyPose) return <PoseArenaTeacherLive room={room} formTimeLimit={form.timeLimitSeconds} onAction={roomAction} onCheckAnswer={checkHostAnswer} onError={onError} onExit={leaveRoom} fullscreen={isLiveFullscreen} onToggleFullscreen={toggleLiveFullscreen} containerRef={liveRef} />;
  if (room) { const leaders = [...(room.leaderboard || room.players || [])].sort((left, right) => Number(right.score || 0) - Number(left.score || 0)).slice(0, 3); return <section className={`content-page game-builder-page ${isLiveFullscreen ? 'game-live-fullscreen' : ''}`} ref={liveRef}><div className="game-live-heading"><div><p className="eyebrow">{headTilt ? 'ĐẤU TRƯỜNG AR · GAME LẮC ĐẦU' : bodyPose ? t('poseArena:teacherLiveEyebrow') : 'QUIZ LIVE ARENA · GAME REALTIME'}</p><h1>{room.title}</h1>{room.className && <p className="muted-copy">{t('roomBuilder.classLabel')}: {room.className}</p>}</div><div className="game-live-heading-actions"><div className="game-live-code"><small>MÃ PHÒNG</small><strong>{room.code}</strong></div><button className="secondary-button" type="button" onClick={toggleLiveFullscreen}>{isLiveFullscreen ? t('cardScan.exitFullscreen') : t('cardScan.fullscreen')}</button></div></div><div className="game-live-layout"><main className="game-live-stage"><div className="game-live-toolbar"><span>{room.status === 'lobby' ? 'Phòng chờ' : room.status === 'finished' ? 'Đã kết thúc' : 'Đang trực tiếp'}</span><b>{room.timeRemaining ?? form.timeLimitSeconds}s</b></div>{room.currentQuestionData ? <><p className="eyebrow">CÂU HỎI {Number(room.currentQuestionData.index || 0) + 1}</p><h2>{room.currentQuestionData.question}</h2><QuestionMedia question={room.currentQuestionData} /><div className={`game-live-options ${headTilt ? 'two-options' : ''}`}>{(room.currentQuestionData.options || []).map((option, index) => <div className={`game-live-option option-${index}`} key={index}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></div>)}</div>{bodyPose && <div className="game-live-gestures" aria-label={t('poseArena:teacherGestureMap')}>{(getQuestionGestures(room.code, room.currentQuestionData.index ?? 0, Math.min(4, (room.currentQuestionData.options || []).length || 4))).map((gesture, index) => <span key={gesture.key} style={{ '--gesture-color': gesture.color }}><b>{String.fromCharCode(65 + index)}</b>{gesture.emoji} {t(`poseArena:gestures.${gesture.key}.cue`)}</span>)}</div>}</> : <div className="game-live-empty"><span>✦</span><h2>Sẵn sàng bắt đầu?</h2><p>Chia sẻ mã <b>{room.code}</b> cho học sinh rồi bắt đầu game.</p></div>}<div className="game-live-actions"><button className="secondary-button" onClick={() => roomAction('start')} disabled={room.status !== 'lobby'}>▶ Bắt đầu game</button><button className="primary-button" onClick={() => roomAction('next')} disabled={room.status !== 'playing'}>Câu tiếp theo →</button><button className="text-button" onClick={() => { streamRef.current?.close(); setRoom(null); }}>Kết thúc</button></div></main><aside className="game-live-side"><div className="panel-heading"><h2>{t('cardScan.leaderboard')}</h2><span>{t('cardScan.topThree')}</span></div><div className="game-top-three">{leaders.length ? leaders.map((item, index) => <div className="game-player" key={item.id}><b>{index + 1}</b><span>{item.nickname}</span><strong>{item.score || 0}</strong></div>) : <p className="muted-copy">{t('cardScan.noScores')}</p>}</div><div className="panel-heading game-player-heading"><h2>{t('roomBuilder.players')}</h2><span>{room.players?.length || 0}</span></div>{(room.players || []).map(item => <div className="game-player" key={item.id}><span>{item.nickname}{room.classId && !item.joined ? <small className="game-player-pending">{t('roomBuilder.waiting')}</small> : null}</span><b>{item.score || 0}</b></div>)}</aside></div></section>; }
  return <section className="content-page game-builder-page"><div className="dashboard-heading"><div><p className="eyebrow">{headTilt ? 'ĐẤU TRƯỜNG AR' : bodyPose ? t('poseArena:teacherEyebrow') : cardScan ? t('cardScan.eyebrow') : 'PHÒNG QUIZ REALTIME'}</p><h1>{headTilt ? 'Tạo game lắc đầu' : bodyPose ? t('poseArena:teacherCreateTitle') : cardScan ? t('cardScan.createTitle') : 'Tạo game quiz realtime'}</h1><p className="muted-copy">{headTilt ? 'Chỉ hiển thị bộ quiz và câu hỏi dạng so sánh &lt;, &gt;, =.' : bodyPose ? t('poseArena:teacherDescription') : 'Chọn bộ quiz hoặc mở kho câu hỏi để chọn trực tiếp từng câu.'}</p></div><span className="setup-badge">{headTilt ? '↔ So sánh' : bodyPose ? t('poseArena:teacherBadge') : cardScan ? t('cardScan.badge') : '● Live quiz'}</span></div><form className="panel form-grid game-builder-form" onSubmit={create}>{cardScan && <div className="wide prepared-mode-choice"><label><input type="radio" name="card-game-mode" checked={!prepare} onChange={() => setPrepare(false)} />{t('preparedGames.playNow')}</label><label><input type="radio" name="card-game-mode" checked={prepare} onChange={() => setPrepare(true)} />{t('preparedGames.prepare')}</label></div>}{cardScan && prepare && <label className="field wide prepared-pin-field">{t('preparedGames.pin')}<input aria-label={t('preparedGames.pin')} type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{6}" maxLength={6} minLength={6} required value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} /><small>{t('preparedGames.pinHint')}</small></label>}<label className="field wide">Tên game<input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label><label className="field wide">Bộ quiz {headTilt ? 'lắc đầu' : bodyPose ? 'cử chỉ' : 'realtime'}<select value={form.quizId} onChange={event => { setForm({ ...form, quizId: event.target.value, questionCount: Math.min(30, quizzes.find(item => item.id === event.target.value)?.questionCount || form.questionCount) }); setSelected([]); }}><option value="">Không chọn bộ quiz — chọn câu hỏi trực tiếp</option>{quizzes.map(item => <option key={item.id} value={item.id}>{item.title} · {item.questionCount || 0} câu</option>)}</select></label>{!bodyPose && <RoomClassSelector classes={classes} value={form.classId} onChange={classId => setForm({ ...form, classId })} t={t} required={cardScan} />}<div className="wide builder-divider"><span>hoặc</span><button type="button" className="secondary-button" onClick={() => setPickerOpen(true)}>Chọn câu hỏi trực tiếp ({selected.length})</button></div><div className="form-grid wide"><label className="field">Số câu<input type="number" min="1" max="30" value={form.questionCount} onChange={event => setForm({ ...form, questionCount: event.target.value })} /></label><label className="field">Giây / câu<input type="number" min="10" max="120" value={form.timeLimitSeconds} onChange={event => setForm({ ...form, timeLimitSeconds: event.target.value })} /></label></div><div className="wide selected-question-preview">{selectedQuestions.length ? selectedQuestions.map(item => <span key={item.id}>{item.question}</span>) : <small>Chưa chọn câu trực tiếp</small>}</div><button className="primary-button wide" type="submit" disabled={saving}>{saving ? t('common.loading') : cardScan && prepare ? t('preparedGames.save') : 'Tạo phòng và vào màn điều khiển →'}</button></form>{cardScan && <PreparedCardGames api={api} API={API} onError={onError} revision={savedRevision} classes={classes} />}{pickerOpen && <GameQuestionPicker questions={questions} selected={selected} onToggle={toggleQuestion} onClose={() => setPickerOpen(false)} api={api} cardScan={cardScan} headTilt={headTilt} bodyPose={bodyPose} loading={questionsLoading} />}</section>;
}
