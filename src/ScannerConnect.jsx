import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Expand, Printer, X } from 'lucide-react';
import './quiz-card-connect.css';

export default function ScannerConnect({ scanUrl, answered, total, showCards, onToggleCards, onError, t }) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null), dialogRef = useRef(null);
  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  async function copyLink() {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(scanUrl);
      else {
        const field = document.createElement('textarea');
        field.value = scanUrl; field.style.position = 'fixed'; field.style.opacity = '0';
        document.body.appendChild(field); field.select();
        const copiedWithFallback = document.execCommand('copy'); field.remove();
        if (!copiedWithFallback) throw new Error(t('cardScan.copyFailed'));
      }
      setCopied(true); window.clearTimeout(copiedTimer.current);
      copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch (error) { onError(error?.message || t('cardScan.copyFailed')); }
  }

  return <section className="dashboard-panel card-host-side">
    <div className="card-scanner-connect-qr"><QRCodeSVG value={scanUrl} size={360} marginSize={4} level="M" title={t('cardScan.scannerQr')} /></div>
    <div className="card-scanner-connect-details">
      <div className="card-scanner-connect-heading"><div><p>{t('cardScan.scannerQr')}</p><h3>{t('cardScan.connectScanner')}</h3></div></div>
      <div className="card-host-count"><strong>{answered}/{total}</strong><span>{t('cardScan.answered')}</span></div>
      <div className="card-scanner-connect-actions">
        <button className="primary-button" type="button" onClick={copyLink}><Copy size={16} aria-hidden="true" />{copied ? t('cardScan.copied') : t('cardScan.copyLink')}</button>
        <button className="secondary-button" type="button" onClick={() => dialogRef.current?.showModal()}><Expand size={16} aria-hidden="true" />{t('cardScan.enlargeQr')}</button>
        <button className="secondary-button" type="button" onClick={onToggleCards}><Printer size={16} aria-hidden="true" />{showCards ? t('cardScan.hideCards') : t('cardScan.showCards')}</button>
      </div>
    </div>
    <dialog className="card-scanner-qr-dialog" ref={dialogRef} aria-label={t('cardScan.enlargeQr')} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className="card-scanner-qr-dialog-heading"><h2>{t('cardScan.connectScanner')}</h2><button type="button" className="secondary-button" aria-label={t('common.close')} onClick={() => dialogRef.current?.close()}><X size={22} aria-hidden="true" /></button></div>
      <div className="card-scanner-qr-large"><QRCodeSVG value={scanUrl} size={768} marginSize={4} level="M" title={t('cardScan.scannerQr')} /></div>
      <p>{t('cardScan.enlargeQrHint')}</p>
    </dialog>
  </section>;
}
