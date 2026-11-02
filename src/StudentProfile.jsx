import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import StudentAddressFields, { profileRequest } from './StudentAddressFields';

export default function StudentProfile({ accountId, request = profileRequest, onError, onSaved, onClose }) {
  const { t } = useTranslation('studentProfile');
  const [form, setForm] = useState(null), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const endpoint = accountId ? `/accounts/${accountId}/student-profile` : '/student/profile';
  useEffect(() => {
    let active = true; setForm(null); setError('');
    request(endpoint).then(data => { if (active) setForm(data); }).catch(failure => { if (active) setError(failure.message); });
    return () => { active = false; };
  }, [endpoint, request]);
  const change = values => setForm(current => ({ ...current, ...values }));
  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try { setForm(await request(endpoint, { method: 'PUT', body: JSON.stringify(form) })); setMessage(t('saved')); await onSaved?.(); }
    catch (failure) { onError?.(failure.message); setError(failure.message); }
    finally { setBusy(false); }
  }
  return <section className={accountId ? 'student-profile-panel' : 'content-page student-profile-page'}><div className="panel-heading"><h2>{t('title')}</h2>{onClose && <button type="button" className="secondary-button" onClick={onClose}>{t('close')}</button>}</div>{error && <p role="alert">{error}</p>}{message && <p className="result-box" role="status">{message}</p>}{!form ? !error && <p>{t('loading')}</p> : <form className="panel form-grid" onSubmit={save}><label className="field">{t('username')}<input value={form.username || ''} readOnly /></label><label className="field">{t('email')}<input value={form.email || ''} readOnly /></label><label className="field">{t('name')}<input required maxLength={80} value={form.displayName || ''} disabled={busy} onChange={event => change({ displayName: event.target.value })} /></label><label className="field">{t('phone')}<input type="tel" maxLength={30} value={form.phone || ''} disabled={busy} onChange={event => change({ phone: event.target.value })} /></label><StudentAddressFields value={form} onChange={change} request={request} disabled={busy} /><div className="wide"><button className="primary-button" type="submit" disabled={busy}>{busy ? t('loading') : t('save')}</button></div></form>}</section>;
}
