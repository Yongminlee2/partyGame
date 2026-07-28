// 몸으로 말해요: 폰을 이마에 대고, 앞으로 숙이면 정답 / 뒤로 젖히면 패스.
// 센서 없으면 화면 아래쪽 터치=정답, 위쪽 터치=패스.
import { sfx } from '../core/sound.js';
import { loadData, shuffle } from '../core/data.js';

const OK_ANGLE = 120;   // beta가 이 이상이면 숙임(정답)
const PASS_ANGLE = 60;  // beta가 이 이하면 젖힘(패스)
const NEUTRAL = [75, 105];

// 히스테리시스 기울기 판정기: 중립을 거쳐야 다음 판정이 발동된다.
export function createTiltDetector() {
  let armed = false;
  return {
    update(beta) {
      if (beta >= NEUTRAL[0] && beta <= NEUTRAL[1]) { armed = true; return null; }
      if (!armed) return null;
      if (beta >= OK_ANGLE) { armed = false; return 'ok'; }
      if (beta <= PASS_ANGLE) { armed = false; return 'pass'; }
      return null;
    },
  };
}

let cleanup = [];
function onCleanup(fn) { cleanup.push(fn); }
function runCleanup() { cleanup.forEach(fn => fn()); cleanup = []; }

export default {
  id: 'charades', title: '몸으로 말해요', emoji: '🙆',

  mount(el) { this.el = el; this.menu(); },
  unmount() { runCleanup(); },

  async menu() {
    runCleanup();
    const data = await loadData('charades');
    const cats = Object.keys(data);
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>🙆 몸으로 말해요</h2></div>
      <div class="screen-center">
        <p style="color:var(--fg-dim); text-align:center">진행자가 폰을 이마에 대면 제시어가 보여요.<br>
        맞히면 <b style="color:var(--ok)">앞으로 숙이기</b>, 모르면 <b style="color:var(--bad)">뒤로 젖히기</b>!</p>
        <div class="btn-row" style="flex-wrap:wrap; justify-content:center">
          ${cats.map(c => `<button class="btn secondary small" data-cat="${c}">${c}</button>`).join('')}
        </div>
        <p style="color:var(--fg-dim)">시간</p>
        <div class="btn-row">
          ${[60, 90, 120].map(t => `<button class="btn small ${t === 90 ? '' : 'secondary'}" data-time="${t}">${t}초</button>`).join('')}
        </div>
      </div>`;
    let time = 90;
    this.el.querySelectorAll('[data-time]').forEach(b =>
      b.addEventListener('click', () => {
        time = Number(b.dataset.time);
        this.el.querySelectorAll('[data-time]').forEach(x => x.classList.add('secondary'));
        b.classList.remove('secondary');
      }));
    this.el.querySelectorAll('[data-cat]').forEach(b =>
      b.addEventListener('click', () => this.ready(b.dataset.cat, data[b.dataset.cat], time)));
  },

  async ready(cat, words, time) {
    // iOS 센서 권한 (안드로이드는 불필요)
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      try { await DeviceOrientationEvent.requestPermission(); } catch { /* 터치로 대체 */ }
    }
    let n = 3;
    this.el.innerHTML = `
      <div class="screen-center">
        <p class="caption" style="font-size:1.6rem">폰을 이마에 대세요!</p>
        <div class="caption" id="count" style="font-size:5rem">3</div>
        <p style="color:var(--fg-dim)">${cat} · ${time}초</p>
      </div>`;
    const iv = setInterval(() => {
      n--;
      sfx.tick();
      if (n <= 0) { clearInterval(iv); this.play(cat, words, time); }
      else this.el.querySelector('#count').textContent = n;
    }, 1000);
    onCleanup(() => clearInterval(iv));
  },

  async play(cat, words, time) {
    runCleanup();
    const deck = shuffle(words);
    let idx = 0;
    const got = [], passed = [];
    let remain = time;

    // 화면 꺼짐 방지 (지원 기기만)
    try {
      const lock = await navigator.wakeLock?.request('screen');
      onCleanup(() => lock?.release());
    } catch { /* 무시 */ }

    this.el.innerHTML = `
      <div class="screen-center" id="stage" style="gap:8px">
        <div class="badge" id="timer">${remain}초</div>
        <div class="caption" id="word" style="font-size:3rem"></div>
        <p style="color:var(--fg-dim); font-size:.85rem">숙이면 정답 · 젖히면 패스<br>(터치: 아래=정답, 위=패스)</p>
      </div>`;
    const wordEl = this.el.querySelector('#word');
    const stage = this.el.querySelector('#stage');
    const show = () => { wordEl.textContent = deck[idx % deck.length]; };
    show();

    const flash = (color) => {
      stage.style.transition = 'none';
      stage.style.background = color;
      setTimeout(() => { stage.style.transition = 'background .4s'; stage.style.background = ''; }, 80);
    };

    const judge = (kind) => {
      const w = deck[idx % deck.length];
      idx++;
      if (kind === 'ok') { got.push(w); sfx.ok(); flash('rgba(76,217,100,.35)'); }
      else { passed.push(w); sfx.bad(); flash('rgba(255,69,58,.35)'); }
      show();
    };

    // 기울기 센서
    const det = createTiltDetector();
    const onTilt = (e) => {
      if (e.beta == null) return;
      const r = det.update(e.beta);
      if (r) judge(r);
    };
    window.addEventListener('deviceorientation', onTilt);
    onCleanup(() => window.removeEventListener('deviceorientation', onTilt));

    // 터치 대체: 화면 아래 절반=정답, 위 절반=패스
    const onTouch = (e) => {
      const y = (e.touches ? e.touches[0].clientY : e.clientY);
      judge(y > window.innerHeight / 2 ? 'ok' : 'pass');
    };
    stage.addEventListener('pointerdown', onTouch);
    onCleanup(() => stage.removeEventListener('pointerdown', onTouch));

    const iv = setInterval(() => {
      remain--;
      const t = this.el.querySelector('#timer');
      if (t) t.textContent = `${remain}초`;
      if (remain <= 10 && remain > 0) sfx.tick();
      if (remain <= 0) { clearInterval(iv); this.finish(cat, got, passed); }
    }, 1000);
    onCleanup(() => clearInterval(iv));
  },

  finish(cat, got, passed) {
    runCleanup();
    sfx.boom();
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>결과 · ${cat}</h2></div>
      <div style="text-align:center; padding:12px"><span class="caption">${got.length}개 성공!</span></div>
      <div class="card-panel" style="margin-bottom:12px">
        <b style="color:var(--ok)">⭕ 맞힌 단어 (${got.length})</b>
        <p style="word-break:keep-all; line-height:1.8">${got.join(', ') || '없음'}</p>
      </div>
      <div class="card-panel">
        <b style="color:var(--bad)">➡ 패스 (${passed.length})</b>
        <p style="word-break:keep-all; line-height:1.8">${passed.join(', ') || '없음'}</p>
      </div>
      <div class="btn-row" style="padding:16px 0">
        <button class="btn" id="again">한 판 더</button>
        <button class="btn secondary" onclick="location.hash=''">홈으로</button>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    this.el.querySelector('#again').addEventListener('click', () => this.menu());
  },
};
