import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cardDictionary } from './quiz-card-hooks';
import './class-marker-cards.css';

function MarkerCard({ card }) {
  const { t } = useTranslation();
  return <article className="class-marker-card">
    <div className="class-marker-card-heading"><strong>{card.nickname}</strong><span>{t('classCards.cardNumber', { number: card.markerId })}</span></div>
    <div className="class-marker-art" aria-label={t('classCards.cardNumber', { number: card.markerId })}>
      <b className="marker-direction marker-top">A</b><b className="marker-direction marker-right">B</b>
      <b className="marker-direction marker-bottom">C</b><b className="marker-direction marker-left">D</b>
      <div className="class-marker-svg" dangerouslySetInnerHTML={{ __html: card.svg }} />
    </div>
  </article>;
}

export default function ClassMarkerCards({ classItem, request, onError, onClose, revision = 0 }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [perPage, setPerPage] = useState(8);
  const panelRef = useRef(null);

  useEffect(() => { panelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    request(`/classes/${classItem.id}/markers`).then(result => { if (active) setData(result); })
      .catch(error => { if (active) onError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [classItem.id, request, revision]);

  async function generate() {
    setBusy(true);
    try { setData(await request(`/classes/${classItem.id}/markers`, { method: 'POST' })); }
    catch (error) { onError(error.message); }
    finally { setBusy(false); }
  }

  const cards = useMemo(() => (data?.items || []).filter(item => Number.isInteger(item.markerId) && item.markerId >= 1 && item.markerId <= 40).map(item => ({ ...item, svg: cardDictionary.generateSVG(item.markerId) })), [data]);
  const pages = useMemo(() => Array.from({ length: Math.ceil(cards.length / perPage) }, (_, index) => cards.slice(index * perPage, (index + 1) * perPage)), [cards, perPage]);
  const needsUpdate = data && cards.length > 0 && data.studentCount !== cards.length;

  return <section ref={panelRef} className="panel class-cards-panel" aria-label={t('classCards.title')}>
    <div className="class-cards-toolbar">
      <div><p className="eyebrow">{t('classCards.eyebrow')}</p><h2>{t('classCards.title')} · {classItem.name}</h2><p className="muted-copy">{t('classCards.description')}</p></div>
      <button className="secondary-button" type="button" onClick={onClose}>{t('common.close')}</button>
    </div>
    <div className="class-cards-controls">
      <button className="primary-button" type="button" onClick={generate} disabled={busy || loading || data?.studentCount < 1 || data?.studentCount > 40}>{busy ? t('common.loading') : needsUpdate ? t('classCards.update') : t('classCards.generate')}</button>
      <label className="field">{t('classCards.layout')}<select value={perPage} onChange={event => setPerPage(Number(event.target.value))}><option value={8}>{t('classCards.eightPerPage')}</option><option value={4}>{t('classCards.fourPerPage')}</option></select></label>
      <button className="secondary-button" type="button" onClick={() => window.print()} disabled={!cards.length || needsUpdate}>{t('classCards.printA4')}</button>
      {data && <small>{t('classCards.count', { assigned: cards.length, total: data.studentCount })}</small>}
    </div>
    {loading && <p className="muted-copy">{t('common.loading')}</p>}
    {!loading && data?.studentCount === 0 && <p className="muted-copy">{t('classCards.noStudents')}</p>}
    {!loading && data?.studentCount > 40 && <p className="muted-copy">{t('classCards.tooMany')}</p>}
    {!loading && data?.studentCount > 0 && data?.studentCount <= 40 && !cards.length && <p className="muted-copy">{t('classCards.empty')}</p>}
    {!!pages.length && <div className={`class-card-print-root class-card-layout-${perPage}`}>
      {pages.map((page, index) => <div className="class-card-page" key={index}>
        <div className="class-card-page-header"><strong>{classItem.name}</strong><span>{t('classCards.page', { current: index + 1, total: pages.length })}</span></div>
        <div className="class-card-page-grid">{page.map(card => <MarkerCard key={card.studentId} card={card} />)}</div>
      </div>)}
    </div>}
  </section>;
}
