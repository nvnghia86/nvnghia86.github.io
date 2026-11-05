import { afterEach, describe, expect, it, vi } from 'vitest';
import { audioSettings, cardAudioCue, cardAudioSnapshot, createGameAudio } from './game-audio';

function fakeContext() {
  const parameter = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), setTargetAtTime: vi.fn() });
  const context = { state: 'suspended', currentTime: 0, destination: {}, oscillators: [], gains: [] };
  context.createGain = () => { const node = { gain: parameter(), connect: vi.fn(), disconnect: vi.fn() }; context.gains.push(node); return node; };
  context.createOscillator = () => {
    const node = { frequency: parameter(), connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn(), onended: null };
    context.oscillators.push(node); return node;
  };
  context.resume = vi.fn(async () => { context.state = 'running'; });
  context.suspend = vi.fn(async () => { context.state = 'suspended'; });
  context.close = vi.fn(async () => { context.state = 'closed'; });
  return context;
}
afterEach(() => vi.useRealTimers());

describe('game sound lifecycle', () => {
  it('waits for a gesture and tolerates unavailable or blocked browser audio', async () => {
    const context = fakeContext(), createContext = vi.fn(() => context);
    const audio = createGameAudio({ createContext });
    audio.setMusic('ufo');
    expect(audio.play('launch')).toBe(false);
    expect(createContext).not.toHaveBeenCalled();
    context.resume.mockRejectedValueOnce(new Error('Autoplay blocked'));
    expect(await audio.unlock()).toBe(false);
    expect(audio.play('launch')).toBe(false);
    expect(await audio.unlock()).toBe(true);
    expect(audio.play('launch')).toBe(true);
    context.currentTime += 1;
    expect(audio.play('correct')).toBe(true);
    audio.dispose();
    expect(context.close).toHaveBeenCalledOnce();
    expect(await audio.unlock()).toBe(false);
    const unsupported = createGameAudio({ createContext: () => null });
    expect(await unsupported.unlock()).toBe(false);
    expect(unsupported.play('success')).toBe(false);
    unsupported.dispose();
  });

  it('coalesces a class full of scan events and bounds polyphony', async () => {
    const context = fakeContext(), audio = createGameAudio({ createContext: () => context });
    await audio.unlock();
    for (let i = 0; i < 35; i++) audio.play('scan');
    expect(context.oscillators).toHaveLength(1);
    for (let i = 0; i < 100; i++) { context.currentTime += .4; audio.play('launch'); }
    expect(context.oscillators).toHaveLength(32);
    audio.setSettings({ enabled: false });
    for (const oscillator of context.oscillators) expect(oscillator.disconnect).toHaveBeenCalledOnce();
    expect(audio.play('success')).toBe(false);
    audio.dispose();
  });

  it('stops scheduled music and effects on hidden tabs, mute and disposal', async () => {
    vi.useFakeTimers();
    const context = fakeContext(), audio = createGameAudio({ createContext: () => context });
    audio.setMusic('quiz'); await audio.unlock(); audio.play('start');
    expect(vi.getTimerCount()).toBe(1);
    audio.setHidden(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(context.suspend).toHaveBeenCalled();
    expect(context.oscillators.every(node => node.disconnect.mock.calls.length === 1)).toBe(true);
    expect(audio.play('tick')).toBe(false);
    const count = context.oscillators.length;
    context.currentTime = 3600; audio.setHidden(false);
    await Promise.resolve(); await Promise.resolve();
    expect(context.oscillators.length - count).toBeLessThanOrEqual(3);
    expect(vi.getTimerCount()).toBe(1);
    audio.setSettings({ music: false });
    expect(vi.getTimerCount()).toBe(0);
    expect(audio.play('question')).toBe(true);
    audio.setSettings({ enabled: false });
    await audio.unlock();
    expect(context.state).toBe('suspended');
    audio.dispose();
    expect(context.state).toBe('closed');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not start sound after an async resume finishes on an unmounted game', async () => {
    const context = fakeContext(); let resolve;
    context.resume.mockImplementation(() => new Promise(done => { resolve = done; }));
    const audio = createGameAudio({ createContext: () => context });
    audio.setMusic('ufo'); const pending = audio.unlock(); audio.dispose(); resolve();
    expect(await pending).toBe(false);
    expect(context.oscillators).toHaveLength(0);
  });

  it('validates stored volume without enabling malformed preferences', () => {
    expect(audioSettings(null)).toEqual({ enabled: true, music: true, volume: .8 });
    expect(audioSettings({ volume: 500, enabled: false, music: false })).toEqual({ volume: 1, enabled: false, music: false });
    expect(audioSettings({ volume: -2 }).volume).toBe(0);
    expect(audioSettings({ volume: NaN }).volume).toBe(.8);
    expect(audioSettings({ volume: .2, enabled: false, music: false })).toEqual({ volume: .2, enabled: false, music: false });
  });
});

describe('quiz scan sound events', () => {
  const playing = { id: 'game', status: 'playing', question: 'q1', seconds: 20, answered: 0 };
  it('keeps initial snapshots, reconnects and unrelated sessions silent', () => {
    expect(cardAudioCue(null, playing)).toBeNull();
    expect(cardAudioCue(playing, { ...playing })).toBeNull();
    expect(cardAudioCue(playing, { ...playing, id: 'other', status: 'finished' })).toBeNull();
    expect(cardAudioCue({ ...playing, status: 'finished' }, { ...playing, status: 'finished' })).toBeNull();
  });
  it('plays transitions once and resets scan counts between questions', () => {
    expect(cardAudioCue({ ...playing, status: 'lobby' }, playing)).toBe('start');
    expect(cardAudioCue(playing, { ...playing, question: 'q2', answered: 20 })).toBe('question');
    expect(cardAudioCue(playing, { ...playing, answered: 20 })).toBe('scan');
    expect(cardAudioCue({ ...playing, answered: 20 }, playing)).toBeNull();
    expect(cardAudioCue(playing, { ...playing, status: 'finished' })).toBe('success');
  });
  it('warns only in the last five seconds and ignores timer refreshes', () => {
    expect(cardAudioCue(playing, { ...playing, seconds: 19 })).toBeNull();
    expect(cardAudioCue({ ...playing, seconds: 6 }, { ...playing, seconds: 5 })).toBe('tick');
    expect(cardAudioCue({ ...playing, seconds: 5 }, { ...playing, seconds: 5 })).toBeNull();
    expect(cardAudioCue({ ...playing, seconds: 0 }, { ...playing, seconds: 5 })).toBeNull();
    expect(cardAudioCue({ ...playing, seconds: 1 }, { ...playing, seconds: 0 })).toBe('timeout');
    expect(cardAudioSnapshot({ id: 'game', players: [{ answer: 'A' }, { answer: null }] }, 5).answered).toBe(1);
  });
});
