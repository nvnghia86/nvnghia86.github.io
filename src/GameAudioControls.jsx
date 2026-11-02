import React from 'react';
import { useTranslation } from 'react-i18next';
import { Music2, Volume2, VolumeX } from 'lucide-react';
import './game-audio.css';

export default function GameAudioControls({ settings, onSettingsChange, className = '' }) {
  const { t } = useTranslation();
  const audible = settings.enabled && settings.volume > 0;
  return <div className={`game-audio-controls ${className}`} role="group" aria-label={t('gameAudio.controls')}>
    <button type="button" className="secondary-button game-audio-toggle" aria-pressed={audible} aria-label={t(audible ? 'gameAudio.mute' : 'gameAudio.enable')} title={t(audible ? 'gameAudio.mute' : 'gameAudio.enable')} onClick={() => onSettingsChange(audible ? { enabled: false } : { enabled: true, volume: settings.volume || .5 })}>{audible ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
    <label className="game-audio-volume"><span className="game-audio-label">{t('gameAudio.volume')}</span><input type="range" min="0" max="100" step="5" value={Math.round(settings.volume * 100)} aria-label={t('gameAudio.volume')} aria-valuetext={`${Math.round(settings.volume * 100)}%`} onChange={event => onSettingsChange({ volume: Number(event.target.value) / 100 })} /></label>
    <button type="button" className="secondary-button game-audio-music" aria-pressed={settings.music} aria-label={t(settings.music ? 'gameAudio.musicOff' : 'gameAudio.musicOn')} title={t(settings.music ? 'gameAudio.musicOff' : 'gameAudio.musicOn')} onClick={() => onSettingsChange({ music: !settings.music })}><Music2 size={16} /><span>{t('gameAudio.music')}</span></button>
  </div>;
}
