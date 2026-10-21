import React from 'react';
const root = '/admin/video-projects';

function modelPrice(model, kind, t, locale) {
  const format = amount => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumSignificantDigits: 4 }).format(amount);
  const pricing = model.pricing;
  if (kind === 'llm') {
    const prices = [pricing?.inputPerMillion, pricing?.outputPerMillion];
    return prices.every(Number.isFinite) ? `${t('videoStudio.inputPrice')}: ${format(prices[0])} · ${t('videoStudio.outputPrice')}: ${format(prices[1])} ${t('videoStudio.perMillionTokens')}` : t('videoStudio.priceUnavailable');
  }
  const items = pricing?.items || [];
  if (!items.length) return t('videoStudio.priceUnavailable');
  const byUnit = new Map();
  for (const item of items) {
    const key = kind === 'video' ? item.sku : item.unit;
    const existing = byUnit.get(key);
    if (!existing || item.amount < existing.amount) byUnit.set(key, item);
  }
  const labels = [...byUnit.values()].map(item => {
    if (kind === 'video') return `${item.sku}: ${format(item.amount)}`;
    const unit = item.unit === 'image' ? t('videoStudio.perImage') : item.unit === 'megapixel' ? t('videoStudio.perMegapixel') : `/${item.unit}`;
    return `${format(item.amount)}${unit}`;
  });
  return `${t('videoStudio.priceFrom')} ${labels.join(' · ')}`;
}

export function ModelSelect({ kind, label, models, value, onChange, t, locale, disabled = false, required = true }) {
  const options = models?.[kind] || [];
  return <label className="field">{label}<select required={required} disabled={disabled} value={value || ''} onChange={event => onChange(event.target.value)}><option value="">{t('videoStudio.noModel')}</option>{options.map(model => <option key={model.id} value={model.id} disabled={!model.available}>{model.name || model.id} · {model.provider} · {modelPrice(model, kind, t, locale)} · {t(model.available ? 'videoStudio.configured' : 'videoStudio.unavailable')}</option>)}</select></label>;
}

export function VersionGallery({ projectId, items, kind, selectedId, onApprove, apiBase, t, busy, locale }) {
  if (!items.length) return null;
  return <div className="video-versions"><strong>{t('videoStudio.versions')}</strong><div className="video-version-grid">{items.map(asset => <div className={`video-version${selectedId === asset.id ? ' selected' : ''}`} key={asset.id}><div className="video-media">{asset.mime_type?.startsWith('image/') ? <img src={`${apiBase}${root}/${projectId}/media/${asset.id}`} alt={t(kind === 'image' ? 'videoStudio.characterRef' : 'videoStudio.keyframe')} loading="lazy" /> : asset.mime_type?.startsWith('audio/') ? <audio src={`${apiBase}${root}/${projectId}/media/${asset.id}`} controls preload="metadata" /> : <video src={`${apiBase}${root}/${projectId}/media/${asset.id}`} controls preload="metadata" />}</div><div className="video-version-footer"><small>{new Date(asset.created_at).toLocaleString(locale)}</small>{selectedId === asset.id ? <span className="video-approved">✓ {t('videoStudio.approved')}</span> : <button type="button" className="secondary-button" disabled={busy} onClick={() => onApprove(asset.id)}>{t('videoStudio.approveContinue')}</button>}</div></div>)}</div></div>;
}

export function PromptAction({ value, onChange, onRun, label, disabled, busy, t }) {
  return <div className="video-prompt-action"><label className="field">{t('videoStudio.prompt')}<textarea value={value || ''} onChange={event => onChange(event.target.value)} placeholder={t('videoStudio.promptHint')} rows="2" /></label><button type="button" className="primary-button" disabled={disabled || busy} onClick={onRun}>{busy ? t('videoStudio.jobRunning') : label}</button></div>;
}

