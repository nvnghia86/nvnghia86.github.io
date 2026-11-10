import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Presentation } from 'lucide-react';
import TableAction from './TableAction';
import SharedCardGames from './SharedCardGames';
import { cardDisplayUrl, replayCardGame } from './card-game-display';
import './prepared-card-games.css';

export function PreparedCardGames({ api, API, onError, revision = 0, classes = [] }) {
  const { t } = useTranslation('preparedGames');
  const [games, setGames] = useState(null), [exportingId, setExportingId] = useState(''), [finishingId, setFinishingId] = useState('');
  const navigate = useNavigate();
  useEffect(() => { let active = true; api('/card-games').then(data => { if (active) setGames(data.items || []); }).catch(error => { if (active) { setGames([]); onError(error.message); } }); return () => { active = false; }; }, [api, revision]);
  async function download(game) {
    setExportingId(game.id);
    try {
      const response = await fetch(`${API}/card-games/${game.id}/presentation.pptx`, { credentials: 'include' });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error?.message || data.message || t('exportError')); }
      const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `${game.title.replace(/[<>:"/\\|?*]/g, '-')}.pptx`; document.body.append(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { onError(error.message); } finally { setExportingId(''); }
  }
  async function forceFinish(game) {
    if (finishingId || !window.confirm(t('forceQuitConfirm'))) return;
    setFinishingId(game.id);
    try {
      await api(`/card-games/${game.id}/force-finish`, { method: 'POST' });
      const data = await api('/card-games');
      setGames(data.items || []);
    } catch (error) { onError(error.message); }
    finally { setFinishingId(''); }
  }
  return <><section className="dashboard-panel prepared-game-list"><div className="panel-heading"><div><p className="eyebrow">{t('eyebrow')}</p><h2>{t('savedTitle')}</h2><p className="muted-copy">{t('savedHint')}</p></div><a className="text-button" href={`${import.meta.env.BASE_URL}office/quizzz-manifest.xml`} download>{t('addin')}</a></div>
    <p className="muted-copy"><a href={`${import.meta.env.BASE_URL}office/setup.html`} target="_blank" rel="noreferrer">{t('setup')}</a></p>
    {games === null ? <p role="status">{t('loading')}</p> : games.length ? <div className="table-scroll"><table className="management-table">
      <thead><tr><th>{t('game')}</th><th>{t('class')}</th><th>{t('questions')}</th><th>{t('detail.status')}</th><th>{t('actions')}</th></tr></thead>
      <tbody>{games.map(game => {
        const detailUrl = `/teacher/card-scan/games/${game.id}`;
        const status = game.playStatus || 'notStarted';
        return <tr key={game.id}>
          <td><Link to={detailUrl}><strong>{game.title}</strong></Link><small>{t('detail.seconds', { count: game.timeLimitSeconds })}</small></td>
          <td>{game.className}</td><td>{game.questionCount}</td>
          <td><span className={`prepared-status ${status}`}>{t(`detail.${status}`)}</span><small>{t('detail.runCount', { count: game.runCount || 0 })}</small>{game.isShared && <small>{t('sharing.shared')}</small>}</td>
          <td><div className="prepared-game-actions">
            <TableAction action="view" label={t('detail.view')} onClick={() => navigate(detailUrl)} />
            {game.canEdit && <TableAction action="edit" label={t('detail.edit')} onClick={() => navigate(`${detailUrl}?edit=1`)} />}
            {game.runCount > 0 && <TableAction action="results" label={t('detail.statistics')} onClick={() => navigate(`${detailUrl}?tab=statistics`)} />}
            {status === 'played' && <TableAction action="replay" label={t('sharing.replay')} onClick={() => replayCardGame(game)} />}
            {status === 'playing' && <TableAction action="close" danger label={finishingId === game.id ? t('forceQuitting') : t('forceQuit')} disabled={Boolean(finishingId)} aria-busy={finishingId === game.id} onClick={() => forceFinish(game)} />}
            <a className="table-icon-button" href={cardDisplayUrl(game)} target="_blank" rel="noreferrer" aria-label={t('present')} title={t('present')}><Presentation size={18} strokeWidth={1.8} aria-hidden="true" /></a>
            <TableAction action="download" label={exportingId === game.id ? t('loading') : t('export')} disabled={exportingId === game.id} aria-busy={exportingId === game.id} onClick={() => download(game)} />
          </div></td>
        </tr>;
      })}</tbody>
    </table></div> : <p className="empty-state compact">{t('empty')}</p>}
  </section><SharedCardGames api={api} classes={classes} onError={onError} /></>;
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
