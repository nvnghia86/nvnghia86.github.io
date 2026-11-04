import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Presentation } from 'lucide-react';
import TableAction from './TableAction';
import './prepared-card-games.css';

export function PreparedCardGames({ api, API, onError, revision = 0 }) {
  const { t } = useTranslation('preparedGames');
  const [games, setGames] = useState(null), [busy, setBusy] = useState('');
  useEffect(() => { let active = true; api('/card-games').then(data => { if (active) setGames(data.items || []); }).catch(error => { if (active) { setGames([]); onError(error.message); } }); return () => { active = false; }; }, [api, revision]);
  const displayUrl = game => `${window.location.origin}${import.meta.env.BASE_URL}office/card-game.html#game=${game.presentationKey}`;
  async function download(game) {
    setBusy(game.id);
    try {
      const response = await fetch(`${API}/card-games/${game.id}/presentation.pptx`, { credentials: 'include' });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error?.message || data.message || t('exportError')); }
      const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `${game.title.replace(/[<>:"/\\|?*]/g, '-')}.pptx`; document.body.append(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { onError(error.message); } finally { setBusy(''); }
  }
  return <section className="dashboard-panel prepared-game-list"><div className="panel-heading"><div><p className="eyebrow">{t('eyebrow')}</p><h2>{t('savedTitle')}</h2><p className="muted-copy">{t('savedHint')}</p></div><a className="text-button" href={`${import.meta.env.BASE_URL}office/quizzz-manifest.xml`} download>{t('addin')}</a></div>
    <p className="muted-copy"><a href={`${import.meta.env.BASE_URL}office/setup.html`} target="_blank" rel="noreferrer">{t('setup')}</a></p>
    {games === null ? <p role="status">{t('loading')}</p> : games.length ? <div className="table-scroll"><table className="management-table"><thead><tr><th>{t('game')}</th><th>{t('class')}</th><th>{t('questions')}</th><th>{t('actions')}</th></tr></thead><tbody>{games.map(game => <tr key={game.id}><td><strong>{game.title}</strong><small>{game.timeLimitSeconds}s</small></td><td>{game.className}</td><td>{game.questionCount}</td><td><div className="prepared-game-actions"><a className="table-icon-button" href={displayUrl(game)} target="_blank" rel="noreferrer" aria-label={t('present')} title={t('present')}><Presentation size={18} strokeWidth={1.8} aria-hidden="true" /></a><TableAction action="download" label={busy === game.id ? t('loading') : t('export')} disabled={busy === game.id} aria-busy={busy === game.id} onClick={() => download(game)} /></div></td></tr>)}</tbody></table></div> : <p className="empty-state compact">{t('empty')}</p>}
  </section>;
}

export function CardGamePair({ api }) {
  const { t } = useTranslation('preparedGames');
  const { pairKey } = useParams(); const navigate = useNavigate();
  const [info, setInfo] = useState(null), [pin, setPin] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => { if (!error) return undefined; const timer = window.setTimeout(() => setError(''), 10000); return () => window.clearTimeout(timer); }, [error]);
  useEffect(() => { let active = true; setError(''); setLoading(true); setInfo(null); api(`/card-games/pair/${pairKey}`, { silent: true }).then(data => { if (active) setInfo(data); }).catch(failure => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [api, pairKey, retry]);
  async function connect(event) {
    event.preventDefault(); if (!/^\d{6}$/.test(pin) || busy) return;
    setBusy(true); setError('');
    try {
      const result = await api(`/card-games/pair/${pairKey}`, { method: 'POST', body: JSON.stringify({ pin }), silent: true });
      navigate(`/quiz/${result.sessionId}/scan?token=${encodeURIComponent(result.scannerToken)}&prepared=1`, { replace: true });
    } catch (failure) { setError(failure.message); } finally { setPin(''); setBusy(false); }
  }
  return <section className="content-page card-pair-page"><div className="panel card-pair-panel"><p className="eyebrow">QUIZZZ</p><h1>{t('pairTitle')}</h1>{info && <><h2>{info.title}</h2><p className="muted-copy">{info.className}</p><p>{t('pairHint')}</p><form onSubmit={connect}><label className="field">{t('pin')}<input type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{6}" maxLength={6} minLength={6} required value={pin} disabled={busy} onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label><button className="primary-button" disabled={busy || pin.length !== 6}>{busy ? t('loading') : t('connect')}</button></form></>}{loading && <p role="status">{t('loading')}</p>}{!loading && !info && <button className="secondary-button" type="button" onClick={() => setRetry(value => value + 1)}>{t('retry')}</button>}{error && <p className="card-pair-error" role="alert">{error}</p>}</div></section>;
}
