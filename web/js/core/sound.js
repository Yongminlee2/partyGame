// WebAudio 합성 효과음. 음원 파일 없이 오실레이터로만 만든다.
let ctx = null;

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 첫 사용자 터치에서 AudioContext를 깨운다 (모바일 자동재생 정책)
export function unlockAudio() {
  document.addEventListener('pointerdown', () => ac(), { once: true });
}

function tone(freq, dur, { type = 'sine', gain = 0.15, when = 0, slideTo = null } = {}) {
  const c = ac();
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

function noise(dur, { gain = 0.3, when = 0 } = {}) {
  const c = ac();
  const t0 = c.currentTime + when;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  src.connect(g).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  tick() { tone(1000, 0.03, { type: 'square', gain: 0.05 }); },
  ok() { tone(660, 0.1); tone(880, 0.15, { when: 0.08 }); },
  bad() { tone(220, 0.25, { type: 'sawtooth', slideTo: 110 }); },
  boom() { noise(0.6, { gain: 0.4 }); tone(80, 0.5, { type: 'sawtooth', gain: 0.3, slideTo: 40 }); },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { when: i * 0.12, gain: 0.12 }));
  },
  spin() { tone(400, 0.05, { type: 'triangle', gain: 0.07 }); },
};
