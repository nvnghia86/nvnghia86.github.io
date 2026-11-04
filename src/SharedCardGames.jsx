import React, { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TableAction from './TableAction';

export default function SharedCardGames({ api, classes, onError }) {
  const { t } = useTranslation('preparedGames');
  const navigate = useNavigate();
  const classLabel = useId();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const [revision, setRevision] = useState(0);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setItems(null);
    setFailed(false);
    api('/card-games/shared', { silent: true }).then(data => {
      if (active) setItems(data.items || []);
    }).catch(error => {
      if (active) { setFailed(true); onError(error.message); }
    });
    return () => { active = false; };
  }, [api, open, revision]);

  async function saveCopy(event) {
    event.preventDefault();
    if (busy || !draft.classId || !/^\d{6}$/.test(draft.pin)) return;
    setBusy(true);
    try {
      const { source, ...input } = draft;
      const copy = await api(`/card-games/shared/${source.id}/copies`, {
        method: 'POST', body: JSON.stringify(input), silent: true,
      });
      navigate(`/teacher/card-scan/games/${copy.id}`);
    } catch (error) { onError(error.message); }
    finally { setBusy(false); }
  }

  return <section className="dashboard-panel prepared-game-list">
    <div className="panel-heading">
      <div><h2>{t('sharing.library')}</h2><p className="muted-copy">{t('sharing.libraryHint')}</p></div>
      <button className="secondary-button" type="button" aria-expanded={open} aria-controls="shared-card-games" disabled={busy} onClick={() => { setOpen(!open); setDraft(null); }}>{t(open ? 'sharing.hide' : 'sharing.browse')}</button>
    </div>
    {open && <div id="shared-card-games">
      {failed ? <button className="secondary-button" type="button" onClick={() => setRevision(value => value + 1)}>{t('retry')}</button> : !items ? <p role="status">{t('loading')}</p> : !items.length ? <p className="empty-state compact">{t('sharing.empty')}</p> : <div className="table-scroll"><table className="management-table">
        <thead><tr><th>{t('game')}</th><th>{t('sharing.author')}</th><th>{t('questions')}</th><th>{t('actions')}</th></tr></thead>
        <tbody>{items.map(game => <tr key={game.id}>
          <td><strong>{game.title}</strong><small>{t('detail.seconds', { count: game.timeLimitSeconds })}</small></td>
          <td>{game.authorName}</td><td>{game.questionCount}</td>
          <td><TableAction action="copy" label={t('sharing.use')} disabled={busy} onClick={() => setDraft({ source: game, classId: '', pin: '', copyId: crypto.randomUUID() })} /></td>
        </tr>)}</tbody>
      </table></div>}
      {draft && <form className="panel form-grid shared-card-copy" onSubmit={saveCopy}>
        <div className="wide"><h3>{draft.source.title}</h3><p className="muted-copy">{t('sharing.copyHint')}</p></div>
        <div className="field"><label htmlFor={classLabel}>{t('class')}</label><select id={classLabel} value={draft.classId} disabled={busy} required onChange={event => setDraft({ ...draft, classId: event.target.value, copyId: crypto.randomUUID() })}>
          <option value="">{t('sharing.chooseClass')}</option>{classes.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
        </select></div>
        <label className="field">{t('pin')}<input type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{6}" maxLength={6} value={draft.pin} disabled={busy} required onChange={event => setDraft({ ...draft, pin: event.target.value.replace(/\D/g, ''), copyId: crypto.randomUUID() })} /></label>
        {!classes.length && <p className="wide muted-copy">{t('sharing.noClasses')}</p>}
        <div className="wide prepared-detail-actions">
          <button className="primary-button" disabled={busy || !draft.classId || draft.pin.length !== 6}>{t(busy ? 'loading' : 'sharing.saveCopy')}</button>
          <button className="secondary-button" type="button" disabled={busy} onClick={() => setDraft(null)}>{t('sharing.cancel')}</button>
        </div>
      </form>}
    </div>}
  </section>;
}
