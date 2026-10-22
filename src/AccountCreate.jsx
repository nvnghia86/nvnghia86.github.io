import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error?.message || payload.error || 'Không thể hoàn tất yêu cầu.');
  return payload.success === true && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

function classLabel(item) { return [item.name, item.schoolName, item.communeName, item.provinceName].filter(Boolean).join(' · '); }

export function SearchableSelector({ items, value, onChange, labelFor, multiple = false, placeholder }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = multiple ? (Array.isArray(value) ? value : []) : value ? [value] : [];
  const selectedItems = items.filter(item => selected.includes(item.id));
  const visible = useMemo(() => items.filter(item => labelFor(item).toLocaleLowerCase().includes(query.toLocaleLowerCase())).slice(0, 50), [items, labelFor, query]);
  function choose(id) { onChange(multiple ? (selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id]) : id); if (!multiple) { setOpen(false); setQuery(''); } }
  return <div className="searchable-selector"><input type="search" value={open ? query : (multiple ? '' : selectedItems[0] ? labelFor(selectedItems[0]) : '')} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }} placeholder={placeholder} aria-label={placeholder} />{multiple && selectedItems.length > 0 && <div className="selected-options">{selectedItems.map(item => <button type="button" key={item.id} onClick={() => choose(item.id)}>{labelFor(item)} ×</button>)}</div>}{open && <div className="selector-options">{visible.length ? visible.map(item => <button type="button" className={selected.includes(item.id) ? 'selected' : ''} key={item.id} onMouseDown={event => event.preventDefault()} onClick={() => choose(item.id)}>{multiple && <span>{selected.includes(item.id) ? '✓' : '○'}</span>}{labelFor(item)}</button>) : <small>{placeholder}</small>}</div>}</div>;
}

const initialForm = { username: '', password: '', displayName: '', email: '', phone: '', role: 'student', classIds: [], adminScope: 'class', adminScopeId: '' };

export default function AccountCreate({ teacher, onError, onSaved }) {
  const { t } = useTranslation();
  const isSystemAdmin = ['system_admin', 'master'].includes(teacher?.role);
  const [form, setForm] = useState(initialForm);
  const [classes, setClasses] = useState([]);
  const [options, setOptions] = useState({ schools: [], communes: [], provinces: [] });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);
  useEffect(() => { request('/classes').then(data => setClasses(data.items || [])).catch(error => onError(error.message)); }, []);
  useEffect(() => { if (isSystemAdmin) request('/admin/management-options').then(data => setOptions(data)).catch(error => onError(error.message)); }, [isSystemAdmin]);
  const scopeItems = form.adminScope === 'class' ? classes : options[`${form.adminScope}s`] || [];
  function update(key, value) { setForm(previous => ({ ...previous, [key]: value })); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setCreated(null);
    try { const account = await request('/accounts', { method: 'POST', body: JSON.stringify(form) }); setCreated(account); setForm(initialForm); await onSaved(); }
    catch (error) { onError(error.message); } finally { setBusy(false); }
  }
  const canChooseAdmin = isSystemAdmin;
  return <article className="dashboard-panel account-create-panel"><div className="panel-heading"><div><p className="eyebrow">{t('accountCreate.eyebrow')}</p><h2>{t('accountCreate.title')}</h2><p className="muted-copy">{t('accountCreate.description')}</p></div></div><form className="form-grid" onSubmit={submit}><label className="field">{t('accountCreate.role')}<select value={form.role} onChange={event => update('role', event.target.value)}><option value="student">{t('accounts.roles.student')}</option><option value="teacher">{t('accounts.roles.teacher')}</option>{canChooseAdmin && <option value="admin">{t('accounts.roles.admin')}</option>}</select></label><label className="field">{t('accountCreate.username')}<input required value={form.username} onChange={event => update('username', event.target.value)} placeholder="teacher01" /></label><label className="field">{t('accountCreate.password')}<input required minLength={6} type="password" value={form.password} onChange={event => update('password', event.target.value)} /></label><label className="field">{t('accountCreate.name')}<input required value={form.displayName} onChange={event => update('displayName', event.target.value)} /></label><label className="field">{t('accountCreate.email')}<input type="email" value={form.email} onChange={event => update('email', event.target.value)} /></label><label className="field">{t('accountCreate.phone')}<input value={form.phone} onChange={event => update('phone', event.target.value)} /></label><label className="field wide">{form.role === 'student' ? t('accountCreate.studentClasses') : t('accountCreate.teachingClasses')}<SearchableSelector multiple items={classes} value={form.classIds} onChange={value => update('classIds', value)} labelFor={classLabel} placeholder={t('accountCreate.searchClasses')} /><small>{form.role === 'student' ? t('accountCreate.studentClassesHint') : t('accountCreate.teachingClassesHint')}</small></label>{form.role === 'admin' && <><label className="field">{t('scopeConfig.scope')}<select value={form.adminScope} onChange={event => setForm(previous => ({ ...previous, adminScope: event.target.value, adminScopeId: '' }))}><option value="class">{t('scopeConfig.scopeClass')}</option><option value="school">{t('scopeConfig.scopeSchool')}</option><option value="commune">{t('scopeConfig.scopeCommune')}</option><option value="province">{t('scopeConfig.scopeProvince')}</option></select></label><label className="field">{t('scopeConfig.target')}<SearchableSelector items={scopeItems} value={form.adminScopeId} onChange={value => update('adminScopeId', value)} labelFor={form.adminScope === 'class' ? classLabel : item => item.name} placeholder={t('accountCreate.searchScope')} /></label></>}<div className="actions wide"><button className="primary-button" type="submit" disabled={busy || (form.role === 'admin' && !form.adminScopeId)}>{busy ? t('common.loading') : t('accountCreate.submit')}</button></div></form>{created && <div className="account-created-notice">{t('accountCreate.created', { name: created.displayName })}</div>}</article>;
}
