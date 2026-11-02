export const GAME_AUDIO_KEY = 'quizzz.game-audio.v1';
export const DEFAULT_AUDIO_SETTINGS = { enabled: true, music: true, volume: .5 };

export function audioSettings(value = {}) {
  return {
    enabled: typeof value?.enabled === 'boolean' ? value.enabled : true,
    music: typeof value?.music === 'boolean' ? value.music : true,
    volume: typeof value?.volume === 'number' && Number.isFinite(value.volume) ? Math.max(0, Math.min(1, value.volume)) : .5,
  };
}

// Original synthesized sounds: no downloads, decoding, or game-loop work.
// Notes are [frequency, delay, duration, endFrequency, gain, waveform].
const CUES = {
  ready: [[523, 0, .13], [659, .12, .2]],
  start: [[392, 0, .16], [523, .12, .16], [659, .24, .16], [784, .36, .34]],
  question: [[523, 0, .14], [784, .13, .24]],
  scan: [[1047, 0, .09, 1319, .1]],
  tick: [[880, 0, .065, 660, .12]],
  timeout: [[659, 0, .15], [523, .16, .15], [392, .32, .28]],
  launch: [[130, 0, .8, 520, .14, 'triangle'], [262, .15, .65, 784, .07]],
  beam: [[330, 0, .65, 1320, .12], [440, .12, .55, 1760, .06]],
  depart: [[392, 0, .7, 98, .12, 'triangle']],
  success: [[523, 0, .18], [659, .15, .18], [784, .3, .2], [1047, .5, .65], [659, .5, .6, 659, .07], [784, .5, .6, 784, .07]],
};
const MELODIES = {
  quiz: [523, 0, 659, 0, 587, 0, 392, 0, 440, 0, 523, 0, 392, 0, 0, 0],
  ufo: [262, 392, 523, 0, 330, 440, 659, 0, 294, 440, 587, 0, 262, 392, 523, 0],
};

export function createGameAudio({ createContext = () => {
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  return Context ? new Context() : null;
} } = {}) {
  let settings = { ...DEFAULT_AUDIO_SETTINGS }, context, master, musicBus, effectsBus;
  let disposed = false, hidden = false, unlocked = false, resuming = null;
  let theme = null, timer = null, nextNote = 0, step = 0;
  const voices = new Set(), lastCue = new Map();

  function stopVoices(kind) {
    for (const voice of [...voices]) {
      if (kind && voice.kind !== kind) continue;
      voice.oscillator.onended = null;
      try { voice.oscillator.stop(); } catch { /* Already ended. */ }
      voice.oscillator.disconnect(); voice.gain.disconnect(); voices.delete(voice);
    }
  }
  function stopMusic() {
    if (timer !== null) { clearInterval(timer); timer = null; }
    stopVoices('music');
  }
  function canPlay() { return !disposed && !hidden && settings.enabled && settings.volume > 0 && master && context?.state === 'running'; }
  function note(frequency, at, duration, endFrequency = frequency, volume = .18, type = 'sine', kind = 'effect') {
    if (!canPlay() || voices.size >= 32) return;
    const oscillator = context.createOscillator(), gain = context.createGain();
    const voice = { oscillator, gain, kind }; voices.add(voice);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain); gain.connect(kind === 'music' ? musicBus : effectsBus);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); voices.delete(voice); };
    oscillator.start(at); oscillator.stop(at + duration + .02);
  }
  function scheduleMusic() {
    if (!canPlay() || !settings.music || !MELODIES[theme]) return;
    // Schedule a short lookahead on the audio clock; never catch up missed bars.
    if (nextNote < context.currentTime) nextNote = context.currentTime + .04;
    while (nextNote < context.currentTime + .4) {
      const melody = MELODIES[theme], frequency = melody[step % melody.length];
      if (frequency) note(frequency, nextNote, .36, frequency, .055, 'sine', 'music');
      if (step % 4 === 0) note(theme === 'ufo' ? 131 : 196, nextNote, .75, theme === 'ufo' ? 131 : 196, .035, 'triangle', 'music');
      step++; nextNote += theme === 'ufo' ? .38 : .5;
    }
  }
  function syncMusic() {
    if (!canPlay() || !settings.music || !MELODIES[theme]) { stopMusic(); return; }
    if (timer !== null) return;
    nextNote = context.currentTime + .04; step = 0;
    scheduleMusic(); timer = setInterval(scheduleMusic, 200);
  }
  async function unlock() {
    if (disposed || hidden || !settings.enabled || settings.volume === 0) return false;
    if (resuming) return resuming;
    try {
      if (!context) {
        context = createContext();
        if (!context) return false;
        master = context.createGain(); musicBus = context.createGain(); effectsBus = context.createGain();
        master.gain.value = settings.volume; musicBus.gain.value = .4; effectsBus.gain.value = 1;
        musicBus.connect(master); effectsBus.connect(master); master.connect(context.destination);
      }
      resuming = (async () => {
        if (context.state !== 'running') await context.resume();
        if (disposed || hidden || !settings.enabled || settings.volume === 0) {
          if (!disposed) await context.suspend();
          return false;
        }
        unlocked = context.state === 'running'; syncMusic(); return unlocked;
      })();
      return await resuming;
    } catch { return false; } finally { resuming = null; }
  }
  return {
    unlock,
    play(cue) {
      if (!canPlay() || !CUES[cue]) return false;
      const now = context.currentTime, cooldown = cue === 'scan' ? .35 : cue === 'tick' ? .7 : .18;
      if (now - (lastCue.get(cue) ?? -Infinity) < cooldown) return false;
      lastCue.set(cue, now);
      if (cue === 'success' || cue === 'timeout') stopVoices('effect');
      for (const [frequency, delay, duration, endFrequency = frequency, gain, waveform] of CUES[cue]) {
        note(frequency, now + .01 + delay, duration, endFrequency, gain, waveform);
      }
      return true;
    },
    setMusic(value) { if (theme !== value) { stopMusic(); theme = value; } syncMusic(); },
    setSettings(value) {
      settings = audioSettings(value);
      if (master) master.gain.setTargetAtTime(settings.enabled ? settings.volume : 0, context.currentTime, .025);
      if (!settings.enabled || settings.volume === 0) { stopMusic(); stopVoices(); void context?.suspend().catch(() => {}); }
      else syncMusic();
    },
    setHidden(value) {
      hidden = value;
      if (hidden) { stopMusic(); stopVoices(); void context?.suspend().catch(() => {}); }
      else if (unlocked) void unlock();
    },
    dispose() {
      disposed = true; stopMusic(); stopVoices();
      master?.disconnect(); musicBus?.disconnect(); effectsBus?.disconnect();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
    },
  };
}

export function cardAudioSnapshot(session, seconds) {
  return session ? { id: session.id, status: session.status, question: session.currentQuestionData?.id, answered: session.players?.filter(player => player.answer).length || 0, seconds } : null;
}

export function cardAudioCue(previous, current) {
  if (!previous || !current || previous.id !== current.id) return null;
  if (previous.status !== 'finished' && current.status === 'finished') return 'success';
  if (current.status !== 'playing') return null;
  if (previous.status === 'lobby') return 'start';
  if (previous.question !== current.question && current.question) return 'question';
  if (previous.question !== current.question) return null;
  if (current.seconds === 0 && previous.seconds > 0) return 'timeout';
  if (current.seconds > 0 && current.seconds <= 5 && current.seconds < previous.seconds) return 'tick';
  if (current.answered > previous.answered) return 'scan';
  return null;
}
