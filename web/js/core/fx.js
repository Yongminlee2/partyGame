// 예능식 연출 엔진: 대형 자막, 콘페티, 흔들림, 플래시, 진동.
// 전부 논블로킹 오버레이 — 게임 진행을 막지 않는다.

function overlay() {
  let el = document.getElementById('fx-layer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fx-layer';
    document.body.appendChild(el);
  }
  return el;
}

export const fx = {
  // kind: 'ok'(노랑 튀어오름) | 'bad'(빨강 도장) | 'combo'(주황 회전)
  caption(text, kind = 'ok') {
    const el = document.createElement('div');
    el.className = `fx-caption fx-${kind}`;
    el.textContent = text;
    overlay().appendChild(el);
    setTimeout(() => el.remove(), 900);
  },

  confetti(count = 40) {
    const layer = overlay();
    const colors = ['#ffd400', '#ff5e78', '#4cd964', '#5ac8fa', '#af52de', '#ff9500'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'fx-confetti';
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = Math.random() * 0.3 + 's';
      p.style.animationDuration = 0.9 + Math.random() * 0.8 + 's';
      p.style.transform = `rotate(${Math.random() * 360}deg)`;
      layer.appendChild(p);
      setTimeout(() => p.remove(), 1800);
    }
  },

  shake() {
    document.body.classList.remove('fx-shake');
    void document.body.offsetWidth; // 리플로우로 애니메이션 재시작
    document.body.classList.add('fx-shake');
    setTimeout(() => document.body.classList.remove('fx-shake'), 450);
  },

  flash(color = 'rgba(255,255,255,.7)') {
    const el = document.createElement('div');
    el.className = 'fx-flash';
    el.style.background = color;
    overlay().appendChild(el);
    setTimeout(() => el.remove(), 200);
  },

  vibrate(pattern) {
    try { navigator.vibrate?.(pattern); } catch { /* 미지원 무시 */ }
  },

  // 자주 쓰는 조합
  good(text = '정답!!') { this.caption(text, 'ok'); this.vibrate([30]); },
  wrong(text = '땡!') { this.caption(text, 'bad'); this.shake(); this.vibrate([80]); },
  comboPop(n) { this.caption(`${n}연속!!`, 'combo'); this.vibrate([30, 30, 60]); },
  boom() { this.flash('rgba(255,120,40,.85)'); this.shake(); this.vibrate([300, 100, 300]); },
};
