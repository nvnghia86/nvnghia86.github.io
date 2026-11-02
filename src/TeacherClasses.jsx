import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, Gamepad2, GraduationCap, Plus, Printer, Radio, RefreshCw, Rocket, Users } from 'lucide-react';
import ClassStudentPicker from './ClassStudentPicker';
import ClassMarkerCards from './ClassMarkerCards';
import ClassStudentCaller from './ClassStudentCaller';
import TableAction from './TableAction';
import './class-workspace-i18n';
import './class-workspace.css';

function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase(); }

export default function TeacherClasses({ api }) {
  const { t } = useTranslation('classWorkspace');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    api('/classes/mine').then(data => { if (active) setItems(data.items || []); })
      .catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, revision]);
  const filtered = items.filter(item => normalize(`${item.name} ${item.grade || ''} ${item.schoolName || ''}`).includes(normalize(query)));
  return <section className="content-page my-classes-page">
    <div className="dashboard-heading"><div><p className="eyebrow">{t('eyebrow')}</p><h1>{t('title')}</h1><p className="muted-copy">{t('description')}</p></div><button type="button" className="secondary-button" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw size={18} />{t('refresh')}</button></div>
    <div className="panel class-directory-toolbar"><label className="field">{t('search')}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label><Link className="text-button" to="/teacher/classes">{t('manageClasses')}<ArrowRight size={16} /></Link></div>
    {loading ? <div className="panel" role="status">{t('loading')}</div> : error ? <div className="panel" role="alert"><p>{error}</p><button type="button" className="secondary-button" onClick={() => setRevision(value => value + 1)}>{t('retry')}</button></div> : <div className="my-class-grid">{filtered.map(item => <article className="my-class-card" key={item.id}>
      <div className="my-class-card-top"><span className="class-avatar"><GraduationCap size={26} /></span><span className={`status-pill ${item.isActive === false ? 'closed' : 'accepted'}`}>{t(item.isActive === false ? 'inactive' : 'active')}</span></div>
      <h2>{item.name}</h2><p className="muted-copy">{[item.grade && t('grade', { grade: String(item.grade).replace(/^Lớp\s+/i, '') }), item.schoolName].filter(Boolean).join(' · ') || '—'}</p>
      <div className="my-class-counts"><span><Users size={17} />{t('students', { count: item.studentCount || 0 })}</span>{item.pendingCount > 0 && <b>{t('pendingCount', { count: item.pendingCount })}</b>}</div>
      <Link className="primary-button" to={`/teacher/my-classes/${item.id}`}>{t('open')}<ArrowRight size={17} /></Link>
    </article>)}{!filtered.length && <div className="panel empty-state">{t('empty')}</div>}</div>}
  </section>;
}

function RemoveStudentDialog({ student, classItem, busy, onConfirm, onClose, t }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className="class-remove-dialog" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} aria-labelledby="class-remove-title">
    <h2 id="class-remove-title">{t('removeTitle')}</h2><p>{t('removeHint', { name: student.nickname, className: classItem.name })}</p><div className="class-dialog-actions"><button type="button" className="secondary-button" disabled={busy} onClick={onClose} autoFocus>{t('cancel')}</button><button type="button" className="primary-button class-danger-button" disabled={busy} onClick={onConfirm}>{t(busy ? 'removing' : 'confirmRemove')}</button></div>
  </dialog>;
}

export function TeacherClassWorkspace({ api, teacher, onError }) {
  const { classId } = useParams();
  // A route key resets class-specific UI when navigating between classes.
  return <ClassWorkspace key={`${teacher.id}:${classId}`} classId={classId} api={api} teacher={teacher} onError={onError} />;
}

function ClassWorkspace({ classId, api, teacher, onError }) {
  const { t, i18n } = useTranslation('classWorkspace');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('roster');
  const [picker, setPicker] = useState(false);
  const [cards, setCards] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [removeStudent, setRemoveStudent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revision, setRevision] = useState(0);
  const requestVersion = useRef(0);
  const reload = () => setRevision(value => value + 1);
  useEffect(() => {
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    api(`/classes/${classId}/workspace`).then(result => { if (version === requestVersion.current) setData(result); })
      .catch(error => { if (version === requestVersion.current) setError(error.message); }).finally(() => { if (version === requestVersion.current) setLoading(false); });
    return () => { requestVersion.current++; };
  }, [classId, api, revision]);
  useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 3000); return () => clearTimeout(timer); }, [copied]);
  async function membership(student, nextStatus) {
    setBusy(true);
    try { await api('/classes/members/status', { method: 'POST', body: JSON.stringify({ classId, studentId: student.studentId, status: nextStatus }) }); reload(); }
    catch (error) { onError(error.message); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try { await api(`/classes/${classId}/members/${removeStudent.studentId}`, { method: 'DELETE' }); setRemoveStudent(null); reload(); }
    catch (error) { onError(error.message); }
    finally { setBusy(false); }
  }
  const classItem = data?.classItem;
  const members = data?.members || [];
  const students = members.filter(student => student.status === 'accepted');
  const filtered = members.filter(student => (!status || student.status === status) && normalize([student.nickname, student.username, student.phone, student.email, student.address].join(' ')).includes(normalize(query)));
  const suffix = `?classId=${encodeURIComponent(classId)}`;
  const disabled = classItem?.isActive === false;
  if (!data) return <section className="content-page my-classes-page"><Link to="/teacher/my-classes" className="text-button"><ArrowLeft size={16} />{t('back')}</Link><div className="panel" role={error ? 'alert' : 'status'}><p>{loading ? t('loading') : error || t('notFound')}</p>{!loading && <button type="button" className="secondary-button" onClick={reload}>{t('retry')}</button>}</div></section>;
  return <section className="content-page class-workspace">
    <Link to="/teacher/my-classes" className="text-button class-back"><ArrowLeft size={16} />{t('back')}</Link>
    <div className="dashboard-heading"><div><p className="eyebrow">{[classItem.grade && t('grade', { grade: String(classItem.grade).replace(/^Lớp\s+/i, '') }), classItem.schoolName].filter(Boolean).join(' · ') || t('eyebrow')}</p><h1>{classItem.name}</h1><p className="muted-copy">{t('students', { count: students.length })}{members.some(student => student.status === 'pending') && ` · ${t('pendingCount', { count: members.filter(student => student.status === 'pending').length })}`}</p></div><div className="class-heading-actions"><button type="button" className="secondary-button" disabled={loading || busy} onClick={reload}><RefreshCw size={17} />{t('refresh')}</button><button type="button" className="secondary-button" disabled={disabled} onClick={() => setCards(value => !value)}><Printer size={18} />{t('cards')}</button></div></div>
    {error && <p role="alert" className="panel">{error}</p>}
    {classItem.inviteCode && <div className="class-invite"><span>{t('invite')}</span><strong>{classItem.inviteCode}</strong><button type="button" className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(classItem.inviteCode); setCopied(true); } catch { onError(t('copyFailed')); } }}>{copied ? <Check size={16} /> : <Copy size={16} />}{t(copied ? 'copied' : 'copy')}</button></div>}
    {disabled && <p role="status" className="panel">{t('inactiveHint')}</p>}
    {cards && <ClassMarkerCards classItem={classItem} request={api} onError={onError} onClose={() => setCards(false)} revision={revision} />}
    <div className="class-tabs" role="tablist" aria-label={classItem.name}>{[['roster', Users], ['homework', BookOpen], ['games', Gamepad2]].map(([name, Icon]) => <button key={name} type="button" role="tab" id={`class-tab-${name}`} aria-selected={tab === name} aria-controls={`class-panel-${name}`} tabIndex={tab === name ? 0 : -1} onKeyDown={event => { const tabs = ['roster', 'homework', 'games']; if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3; setTab(tabs[next]); document.getElementById(`class-tab-${tabs[next]}`)?.focus(); } }} onClick={() => setTab(name)}><Icon size={18} />{t(name)}</button>)}</div>
    <div role="tabpanel" id={`class-panel-${tab}`} aria-labelledby={`class-tab-${tab}`}>
      {tab === 'roster' && <div className="panel class-roster-panel"><div className="panel-heading"><h2>{t('roster')}</h2><button type="button" className="primary-button" onClick={() => setPicker(value => !value)}><Plus size={18} />{t(picker ? 'close' : 'add')}</button></div>
        {picker && <ClassStudentPicker classId={classId} request={api} onError={onError} onAdded={reload} />}
        <div className="class-roster-filters"><label className="field">{t('rosterSearch')}<input type="search" value={query} onChange={event => setQuery(event.target.value)} /></label><label className="field">{t('status')}<select value={status} onChange={event => setStatus(event.target.value)}><option value="">{t('all')}</option>{['accepted', 'pending', 'rejected'].map(value => <option key={value} value={value}>{t(value)}</option>)}</select></label></div>
        <div className="table-scroll"><table className="class-roster-table"><thead><tr>{['name', 'username', 'phone', 'email', 'address', 'status', 'actions'].map(key => <th key={key}>{t(key)}</th>)}</tr></thead><tbody>{filtered.map(student => <tr key={student.studentId}><td><strong>{student.nickname}</strong></td><td>{student.username || '—'}</td><td>{student.phone || '—'}</td><td>{student.email || '—'}</td><td>{student.address || '—'}</td><td><span className={`status-pill ${student.status}`}>{t(student.status)}</span></td><td className="table-actions">{student.status === 'pending' && <><TableAction action="approve" label={t('approve')} disabled={busy || loading} onClick={() => membership(student, 'accepted')} /><TableAction action="reject" label={t('reject')} disabled={busy || loading} onClick={() => membership(student, 'rejected')} /></>}<TableAction action="delete" danger label={t('remove')} disabled={busy || loading} onClick={() => setRemoveStudent(student)} /></td></tr>)}{!filtered.length && <tr><td colSpan={7}>{t('noStudents')}</td></tr>}</tbody></table></div>
      </div>}
      {tab === 'homework' && <div className="panel class-homework-panel"><div className="panel-heading"><div><h2>{t('homework')}</h2><p className="muted-copy">{t('homeworkHint')}</p></div>{!disabled && <Link className="primary-button" to={`/teacher/assignments${suffix}`}><Plus size={18} />{t('assign')}</Link>}</div><div className="class-homework-list">{(data.assignments || []).map(item => <article key={item.id}><div><strong>{item.title}</strong><small>{item.dueAt ? t('due', { date: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.dueAt)) }) : t('noDeadline')} · {t('submissions', { count: item.submissionCount })}</small></div><span className={`status-pill ${item.computedStatus}`}>{t(item.computedStatus)}</span></article>)}{!data.assignments?.length && <p className="empty-state">{t('noHomework')}</p>}</div><Link className="text-button" to={`/teacher/assignments${suffix}`}>{t('allHomework')}<ArrowRight size={16} /></Link></div>}
      {tab === 'games' && <><div className="class-game-grid">{[['realtime', Radio, '/teacher/realtime'], ['scan', Printer, '/teacher/card-scan']].map(([key, Icon, to]) => <article className="panel" key={key}><Icon size={26} /><h3>{t(key)}</h3><p className="muted-copy">{t(`${key}Hint`)}</p>{!disabled && <Link className="secondary-button" to={`${to}${suffix}`}>{t('open')}<ArrowRight size={16} /></Link>}</article>)}<article className="panel"><Rocket size={26} /><h3>{t('caller')}</h3><p className="muted-copy">{t('callerHint')}</p><span>{t('students', { count: students.length })}</span></article></div>{!disabled && <ClassStudentCaller classId={classId} teacherId={teacher.id} students={students} onError={onError} />}</>}
    </div>
    {removeStudent && <RemoveStudentDialog student={removeStudent} classItem={classItem} busy={busy} onClose={() => setRemoveStudent(null)} onConfirm={remove} t={t} />}
  </section>;
}
