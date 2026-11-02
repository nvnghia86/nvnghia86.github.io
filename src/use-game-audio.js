import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audioSettings, createGameAudio, GAME_AUDIO_KEY } from './game-audio';

function readSettings() {
  try { return audioSettings(JSON.parse(localStorage.getItem(GAME_AUDIO_KEY))); } catch { return audioSettings(); }
}

export function useGameAudio() {
  const [settings, setSettings] = useState(readSettings);
  const engine = useRef(null), latest = useRef(settings);
  latest.current = settings;
  const audio = useMemo(() => ({
    play: cue => engine.current?.play(cue),
    setMusic: theme => engine.current?.setMusic(theme),
    unlock: () => engine.current?.unlock() || Promise.resolve(false),
  }), []);
  useEffect(() => {
    const instance = createGameAudio(); engine.current = instance;
    instance.setSettings(latest.current); instance.setHidden(document.hidden);
    const unlock = event => { if (event.type !== 'keydown' || ['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) void instance.unlock(); };
    const visibility = () => instance.setHidden(document.hidden);
    const pageHide = () => instance.setHidden(true);
    const sync = event => { if (event.key === GAME_AUDIO_KEY) setSettings(readSettings()); };
    window.addEventListener('pointerdown', unlock, true); window.addEventListener('keydown', unlock, true);
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', pageHide);
    window.addEventListener('pageshow', visibility);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('pointerdown', unlock, true); window.removeEventListener('keydown', unlock, true);
      document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pageHide);
      window.removeEventListener('pageshow', visibility);
      window.removeEventListener('storage', sync);
      instance.dispose(); if (engine.current === instance) engine.current = null;
    };
  }, []);
  useEffect(() => { engine.current?.setSettings(settings); }, [settings]);
  const onSettingsChange = useCallback(patch => {
    const next = audioSettings({ ...latest.current, ...patch });
    latest.current = next; setSettings(next); engine.current?.setSettings(next);
    try { localStorage.setItem(GAME_AUDIO_KEY, JSON.stringify(next)); } catch { /* Private browsing may disable storage. */ }
    // Called directly by a sound control gesture, including when re-enabling audio.
    if (next.enabled && next.volume > 0) void engine.current?.unlock().then(ready => { if (ready && patch.enabled === true) engine.current?.play('ready'); });
  }, []);
  return { audio, settings, onSettingsChange };
}
