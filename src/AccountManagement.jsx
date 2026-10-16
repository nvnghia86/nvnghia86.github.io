import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './account-management.css';
import StudentAccountBulk from './StudentAccountBulk';

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    credentials: 'include',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error?.message || payload.error || 'Không thể hoàn tất yêu cầu.');
  }
  return payload.success === true && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

function TeacherProfile({ teacher, onError }) {
  const { t } = useTranslation();
  const [schools, setSchools] = useState([]);
  const [phone, setPhone] = useState(teacher?.phone || '');
  const [schoolId, setSchoolId] = useState(teacher?.schoolId || '');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setPhone(teacher?.phone || ''); setSchoolId(teacher?.schoolId || ''); }, [teacher?.id, teacher?.phone, teacher?.schoolId]);
  useEffect(() => { request('/schools').then(data => setSchools(data.items || [])).catch(error => onError(error.message)); }, []);
  async function save(event) { event.preventDefault(); setSaving(true); try { await request('/accounts/me', { method: 'PATCH', body: JSON.stringify({ phone, schoolId }) }); } catch (error) { onError(error.message); } finally { setSaving(false); } }
  return <form className="dashboard-panel teacher-profile-form" onSubmit={save}><div className="panel-heading"><div><p className="eyebrow">{t('teacherProfile.eyebrow')}</p><h2>{t('teacherProfile.title')}</h2></div></div><div className="form-grid"><label className="field">{t('teacherProfile.phone')}<input value={phone} onChange={event => setPhone(event.target.value)} placeholder="090..." /></label><label className="field">{t('teacherProfile.school')}<select value={schoolId} onChange={event => setSchoolId(event.target.value)}><option value="">{t('teacherProfile.noSchool')}</option>{schools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="actions wide"><button className="primary-button" type="submit" disabled={saving}>{saving ? t('common.loading') : t('common.save')}</button></div></div></form>;
}

function ScopeConfig({ item, options, onCancel, onError, onSaved }) {
  const { t } = useTranslation();
  const [scope, setScope] = useState(item.adminScope || 'school');
  const [scopeId, setScopeId] = useState(item.managedClassId || item.managedSchoolId || item.managedCommuneId || item.managedProvinceId || '');
  const [saving, setSaving] = useState(false);
  const choices = options[`${scope}s`] || [];

  useEffect(() => {
    setScopeId(scope === 'class' ? item.managedClassId || '' : scope === 'school' ? item.managedSchoolId || '' : scope === 'commune' ? item.managedCommuneId || '' : item.managedProvinceId || '');
  }, [scope, item]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await request(`/admin/users/${item.id}/scope`, { method: 'PUT', body: JSON.stringify({ scope, scopeId }) });
      await onSaved();
    } catch (error) {
      onError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return <form className="scope-config-panel form-grid" onSubmit={save}>
    <div className="wide"><strong>{t('scopeConfig.title')}</strong><p className="muted-copy">{item.displayName || item.username} · {t('scopeConfig.description')}</p></div>
    <label className="field">{t('scopeConfig.scope')}<select value={scope} onChange={event => setScope(event.target.value)}><option value="class">{t('scopeConfig.scopeClass')}</option><option value="school">{t('scopeConfig.scopeSchool')}</option><option value="commune">{t('scopeConfig.scopeCommune')}</option><option value="province">{t('scopeConfig.scopeProvince')}</option></select></label>
    <label className="field">{t('scopeConfig.target')}<select required value={scopeId} onChange={event => setScopeId(event.target.value)}><option value="">{t('scopeConfig.chooseTarget')}</option>{choices.map(option => <option key={option.id} value={option.id}>{option.name}{scope === 'class' && option.teacherName ? ` · ${option.teacherName}` : ''}</option>)}</select></label>
    <div className="actions wide"><button className="primary-button" type="submit" disabled={saving || !scopeId}>{saving ? t('common.loading') : t('scopeConfig.save')}</button><button className="secondary-button" type="button" onClick={onCancel}>{t('common.cancel')}</button></div>
  </form>;
}

export default function AccountManagement({ teacher, onError }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [options, setOptions] = useState({ classes: [], schools: [], communes: [], provinces: [] });
  const [configuring, setConfiguring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ name: '', login: '', phone: '', role: '', classes: '', status: '' });
  const isAdmin = ['admin', 'system_admin'].includes(teacher?.role);
  const isSystemAdmin = teacher?.role === 'system_admin';

  async function load() {
    setLoading(true);
    try {
      const data = await request('/accounts');
      setItems(data.items || []);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [teacher?.id]);
  useEffect(() => { if (isSystemAdmin) request('/admin/management-options').then(setOptions).catch(error => onError(error.message)); }, [isSystemAdmin]);

  async function changeRole(item, role) {
    try {
      await request(`/admin/users/${item.id}/role`, { method: 'POST', body: JSON.stringify({ role }) });
      await load();
      if (role === 'admin') setConfiguring({ ...item, role: 'admin', adminScope: null });
    } catch (error) {
      onError(error.message);
    }
  }
  async function toggleStatus(item) { try { await request(`/accounts/${item.id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive: item.isActive === false }) }); await load(); } catch (error) { onError(error.message); } }

  const filteredItems = useMemo(() => {
    const name = filters.name.trim().toLocaleLowerCase(); const login = filters.login.trim().toLocaleLowerCase(); const phone = filters.phone.trim().toLocaleLowerCase(); const classText = filters.classes.trim().toLocaleLowerCase();
    return items.filter(item => {
      const displayName = [item.displayName, item.nickname].filter(Boolean).join(' ').toLocaleLowerCase(); const loginName = [item.username, item.email].filter(Boolean).join(' ').toLocaleLowerCase(); const phoneNumber = String(item.studentPhone || item.phone || '').toLocaleLowerCase(); const classNames = String(item.classNames || '').toLocaleLowerCase();
      return (!name || displayName.includes(name)) && (!login || loginName.includes(login)) && (!phone || phoneNumber.includes(phone)) && (!filters.role || item.role === filters.role) && (!filters.status || (item.isActive === false ? 'inactive' : 'active') === filters.status) && (!classText || classNames.includes(classText));
    });
  }, [items, filters]);
  const hasFilters = Boolean(filters.name || filters.login || filters.phone || filters.role || filters.classes || filters.status);
  function updateFilter(key, value) { setFilters(previous => ({ ...previous, [key]: value })); }
  function clearFilters() { setFilters({ name: '', login: '', phone: '', role: '', classes: '', status: '' }); }
  function scopeText(item) { return item.managementTargetName && item.adminScope ? `${t(`scopeConfig.scope${item.adminScope.charAt(0).toUpperCase()}${item.adminScope.slice(1)}`)}: ${item.managementTargetName}` : t('scopeConfig.notConfigured'); }

  return <section className="content-page admin-management">
    <div className="dashboard-heading"><div><p className="eyebrow">{t('accounts.eyebrow')}</p><h1>{t('accounts.title')}</h1><p className="muted-copy">{isSystemAdmin ? t('accounts.systemAdminDescription') : isAdmin ? t('accounts.adminDescription') : t('accounts.teacherDescription')}</p></div><span className="panel-kicker">{filteredItems.length}/{items.length}</span></div>
    {teacher && <TeacherProfile teacher={teacher} onError={onError} />}
    {teacher && <StudentAccountBulk onError={onError} onSaved={load} />}
    {isSystemAdmin && configuring && <ScopeConfig item={configuring} options={options} onCancel={() => setConfiguring(null)} onError={onError} onSaved={async () => { setConfiguring(null); await load(); }} />}
    <div className="dashboard-panel">
      {loading ? <div className="empty-state compact"><small>{t('common.loading')}</small></div> : items.length === 0 ? <div className="empty-state compact"><small>{t('accounts.empty')}</small></div> : <div className="management-table-wrap"><table className="management-table"><thead><tr><th>{t('accounts.name')}</th><th>{t('accounts.login')}</th><th>{t('accounts.phone')}</th><th>{t('accounts.role')}</th>{isSystemAdmin && <th>{t('scopeConfig.current')}</th>}<th>{t('accounts.classes')}</th><th>{t('accounts.status')}</th>{isAdmin && <th>{t('accounts.actions')}</th>}</tr><tr className="management-filter-row"><th><input type="search" value={filters.name} onChange={event => updateFilter('name', event.target.value)} placeholder={t('accounts.searchName')} aria-label={t('accounts.searchName')} /></th><th><input type="search" value={filters.login} onChange={event => updateFilter('login', event.target.value)} placeholder={t('accounts.searchLogin')} aria-label={t('accounts.searchLogin')} /></th><th><input type="search" value={filters.phone} onChange={event => updateFilter('phone', event.target.value)} placeholder={t('accounts.searchPhone')} aria-label={t('accounts.searchPhone')} /></th><th><select value={filters.role} onChange={event => updateFilter('role', event.target.value)} aria-label={t('accounts.filterRole')}><option value="">{t('accounts.allRoles')}</option>{isSystemAdmin && <option value="system_admin">{t('accounts.roles.system_admin')}</option>}<option value="admin">{t('accounts.roles.admin')}</option><option value="teacher">{t('accounts.roles.teacher')}</option><option value="student">{t('accounts.roles.student')}</option></select></th>{isSystemAdmin && <th />}<th><input type="search" value={filters.classes} onChange={event => updateFilter('classes', event.target.value)} placeholder={t('accounts.searchClass')} aria-label={t('accounts.searchClass')} /></th><th><select value={filters.status} onChange={event => updateFilter('status', event.target.value)} aria-label={t('accounts.filterStatus')}><option value="">{t('accounts.allStatuses')}</option><option value="active">{t('accounts.active')}</option><option value="inactive">{t('accounts.inactive')}</option></select></th>{isAdmin && <th>{hasFilters && <button className="text-button" type="button" onClick={clearFilters}>{t('accounts.clearFilters')}</button>}</th>}</tr></thead><tbody>{filteredItems.map(item => <tr key={item.id}><td><strong>{item.displayName || item.nickname || item.username}</strong>{item.nickname && <small>{item.nickname}</small>}</td><td>{item.email || item.username || '—'}</td><td>{item.studentPhone || item.phone || '—'}</td><td><span className={`status-pill role-${item.role}`}>{t(`accounts.roles.${item.role}`, item.role)}</span></td>{isSystemAdmin && <td>{item.role === 'admin' ? scopeText(item) : '—'}</td>}<td>{item.classNames || '—'}</td><td><span className={`status-badge ${item.isActive === false ? 'inactive' : 'active'}`}>{item.isActive === false ? t('accounts.inactive') : t('accounts.active')}</span></td>{isAdmin && <td>{item.id !== teacher?.id && <>{item.role === 'student' && <button className="text-button" type="button" onClick={() => changeRole(item, 'teacher')}>{t('accounts.promote')}</button>}{item.role === 'teacher' && <><button className="text-button danger" type="button" onClick={() => changeRole(item, 'student')}>{t('accounts.demote')}</button>{isSystemAdmin && <button className="text-button" type="button" onClick={() => changeRole(item, 'admin')}>{t('accounts.promoteAdmin')}</button>}</>}{isSystemAdmin && item.role === 'admin' && <><button className="text-button danger" type="button" onClick={() => changeRole(item, 'teacher')}>{t('accounts.demoteAdmin')}</button><button className="text-button" type="button" onClick={() => setConfiguring(item)}>{t('scopeConfig.configure')}</button></>}{item.role !== 'system_admin' && <button className="text-button" type="button" onClick={() => toggleStatus(item)}>{item.isActive === false ? t('accounts.activate') : t('accounts.deactivate')}</button>}</>}</td>}</tr>)}</tbody></table>{filteredItems.length === 0 && <div className="empty-state compact"><small>{t('accounts.noMatch')}</small>{hasFilters && <button className="text-button" type="button" onClick={clearFilters}>{t('accounts.clearFilters')}</button>}</div>}</div>}
    </div>
  </section>;
}
