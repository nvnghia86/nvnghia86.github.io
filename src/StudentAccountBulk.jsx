import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './student-account-bulk.css';

const API = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { credentials: 'include', ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error?.message || payload.error || 'Không thể hoàn tất yêu cầu.');
  return payload.success === true && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

const emptyRow = { username: '', password: '', displayName: '', phone: '', classId: '' };

export default function StudentAccountBulk({ onError, onSaved }) {
  const { t } = useTranslation();
  const [classes, setClasses] = useState([]);
  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { request('/classes').then(data => setClasses(data.items || [])).catch(error => onError(error.message)); }, []);
  function updateRow(index, key, value) { setRows(previous => previous.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row)); }
  function addRow() { setRows(previous => [...previous, { ...emptyRow }]); }
  function removeRow(index) { setRows(previous => previous.length === 1 ? previous : previous.filter((_, rowIndex) => rowIndex !== index)); }
  async function submit(event) { event.preventDefault(); setBusy(true); setResult(null); try { const data = await request('/accounts/students/bulk', { method: 'POST', body: JSON.stringify({ students: rows }) }); setResult(data); if (data.created?.length) { onSaved(); setRows([{ ...emptyRow }]); } } catch (error) { onError(error.message); } finally { setBusy(false); } }
  async function importFile(event) { const file = event.target.files?.[0]; event.target.value = ''; if (!file) return; setBusy(true); setResult(null); try { const fileData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); const data = await request('/accounts/students/import', { method: 'POST', body: JSON.stringify({ fileData }) }); setResult(data); if (data.created?.length) onSaved(); } catch (error) { onError(error.message); } finally { setBusy(false); } }
  async function downloadTemplate() { try { const response = await fetch(`${API}/accounts/students/template`, { credentials: 'include' }); if (!response.ok) throw new Error('Không thể tải file mẫu.'); const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'mau-tai-khoan-hoc-sinh.xlsx'; anchor.click(); URL.revokeObjectURL(url); } catch (error) { onError(error.message); } }
  return <article className="dashboard-panel bulk-student-panel">
    <div className="panel-heading"><div><p className="eyebrow">{t('studentAccounts.eyebrow')}</p><h2>{t('studentAccounts.title')}</h2><p className="muted-copy">{t('studentAccounts.description')}</p></div><div className="bulk-actions"><button className="secondary-button" type="button" onClick={downloadTemplate}>{t('studentAccounts.downloadTemplate')}</button><label className="secondary-button file-button">{t('studentAccounts.importExcel')}<input type="file" accept=".xlsx,.xls" onChange={importFile} disabled={busy} /></label></div></div>
    <form onSubmit={submit}>
      <div className="bulk-student-table"><div className="bulk-student-row bulk-student-head"><span>{t('studentAccounts.username')}</span><span>{t('studentAccounts.password')}</span><span>{t('studentAccounts.name')}</span><span>{t('studentAccounts.phone')}</span><span>{t('studentAccounts.class')}</span><span /></div>{rows.map((row, index) => <div className="bulk-student-row" key={index}><input required value={row.username} onChange={event => updateRow(index, 'username', event.target.value)} placeholder="student01" /><input required minLength={6} type="password" value={row.password} onChange={event => updateRow(index, 'password', event.target.value)} placeholder="••••••" /><input required value={row.displayName} onChange={event => updateRow(index, 'displayName', event.target.value)} placeholder={t('studentAccounts.name')} /><input value={row.phone} onChange={event => updateRow(index, 'phone', event.target.value)} placeholder="090..." /><select required value={row.classId} onChange={event => updateRow(index, 'classId', event.target.value)}><option value="">{t('studentAccounts.chooseClass')}</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="text-button danger" type="button" onClick={() => removeRow(index)}>{t('studentAccounts.remove')}</button></div>)}</div>
      <div className="actions bulk-footer"><button className="secondary-button" type="button" onClick={addRow}>{t('studentAccounts.addRow')}</button><button className="primary-button" type="submit" disabled={busy}>{busy ? t('common.loading') : t('studentAccounts.create')}</button></div>
    </form>
    {result && <div className="bulk-result"><span>{t('studentAccounts.created', { count: result.created?.length || 0 })}</span>{result.errors?.length > 0 && <span className="bulk-errors">{t('studentAccounts.failed', { count: result.errors.length })}: {result.errors.map(item => `${item.row}: ${item.error}`).join(' · ')}</span>}</div>}
  </article>;
}
