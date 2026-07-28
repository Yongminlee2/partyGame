// 숫자야구 ⚾: 서로 다른 3자리 숫자 맞히기. 솔로(내가 추리) / 대전(AI와 번갈아 추리).
import { sfx } from '../core/sound.js';
import { fx } from '../core/fx.js';
import { load, save } from '../core/store.js';

export function judge(guess, answer) {
  let s = 0, b = 0;
  for (let i = 0; i < 3; i++) {
    if (guess[i] === answer[i]) s++;
    else if (answer.includes(guess[i])) b++;
  }
  return { s, b };
}

export function validGuess(str) {
  return /^\d{3}$/.test(str) && new Set(str).size === 3;
}

export function randomSecret() {
  const d = '0123456789'.split('');
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d.slice(0, 3).join('');
}

// 소거법 AI: 판정과 모순되지 않는 후보만 남긴다.
// level 1/2는 가끔 후보 밖 추리(실수), level 3은 항상 정석.
const ERR_PROB = { 1: 0.35, 2: 0.15, 3: 0 };

function allCandidates() {
  const out = [];
  for (let a = 0; a <= 9; a++)
    for (let b = 0; b <= 9; b++)
      for (let c = 0; c <= 9; c++)
        if (a !== b && b !== c && a !== c) out.push(`${a}${b}${c}`);
  return out;
}

export function createSolver(level = 2) {
  let candidates = allCandidates();
  return {
    nextGuess() {
      if (Math.random() < (ERR_PROB[level] ?? 0.15)) {
        return allCandidates()[Math.floor(Math.random() * 720)]; // 실수: 아무거나
      }
      return candidates[Math.floor(Math.random() * candidates.length)] || randomSecret();
    },
    feed(guess, result) {
      candidates = candidates.filter(c => {
        const r = judge(guess, c);
        return r.s === result.s && r.b === result.b;
      });
    },
    left() { return candidates.length; },
  };
}

export default {
  id: 'baseball', title: '숫자야구', emoji: '⚾',

  mount(el) { this.el = el; this.menu(); },
  unmount() {},

  menu() {
    const best = load('baseball.best', 0);
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>⚾ 숫자야구</h2></div>
      <div class="screen-center">
        <p style="color:var(--fg-dim); text-align:center">서로 다른 숫자 3개를 맞혀라!<br>
        자리·숫자 일치 <b style="color:var(--ok)">S</b> · 숫자만 일치 <b style="color:var(--accent)">B</b></p>
        ${best ? `<span class="badge">최소 시도 기록 ${best}번</span>` : ''}
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:300px">
          <button class="btn" data-mode="solo">🙋 혼자 추리 (기록 도전)</button>
          <button class="btn" data-mode="vs2">🤖 AI 대결 · 보통</button>
          <button class="btn" data-mode="vs3">😈 AI 대결 · 독종 (실수 없음)</button>
        </div>
      </div>`;
    this.el.querySelectorAll('[data-mode]').forEach(b =>
      b.addEventListener('click', () => {
        const m = b.dataset.mode;
        if (m === 'solo') this.solo();
        else this.vsSetup(Number(m.slice(2)));
      }));
  },

  // ---------- 솔로: AI 숫자를 추리 ----------
  solo() {
    this.secret = randomSecret();
    this.tries = [];
    this.renderSolo('');
  },

  renderSolo(msg) {
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>⚾ ${this.tries.length}번째 시도</h2></div>
      <div class="screen-center" style="gap:10px">
        <p style="color:var(--fg-dim)">숨겨진 세 자리 숫자를 맞혀봐!</p>
        <input type="tel" id="guess" maxlength="3" placeholder="예: 123" autocomplete="off"
          style="max-width:160px; text-align:center; font-size:1.6rem; letter-spacing:.3em">
        <button class="btn" id="go">던지기!</button>
        <p id="msg" style="color:var(--bad); min-height:1.2em">${msg}</p>
        <div style="width:100%; max-width:280px">
          ${this.tries.map((t, i) => `
            <div style="display:flex; justify-content:space-between; padding:6px 12px; background:var(--bg-card); border-radius:8px; margin-bottom:6px">
              <span style="color:var(--fg-dim)">${i + 1}.</span>
              <b style="letter-spacing:.3em">${t.g}</b>
              <span>${t.r.s ? `<b style="color:var(--ok)">${t.r.s}S</b>` : ''} ${t.r.b ? `<b style="color:var(--accent)">${t.r.b}B</b>` : ''} ${!t.r.s && !t.r.b ? 'OUT' : ''}</span>
            </div>`).reverse().join('')}
        </div>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    const input = this.el.querySelector('#guess');
    const go = () => {
      const g = input.value.trim();
      if (!validGuess(g)) {
        this.el.querySelector('#msg').textContent = '서로 다른 숫자 3자리!';
        fx.wrong('땡!');
        return;
      }
      const r = judge(g, this.secret);
      this.tries.push({ g, r });
      if (r.s === 3) {
        const n = this.tries.length;
        const best = load('baseball.best', 0);
        if (!best || n < best) save('baseball.best', n);
        sfx.fanfare();
        fx.confetti();
        this.el.innerHTML = `
          <div class="screen-center">
            <div style="font-size:4rem">🎉</div>
            <div class="caption">${this.secret} 홈런!</div>
            <p class="caption" style="font-size:1.2rem">${n}번 만에 명중${n <= 5 ? ' — 명탐정인데?' : n <= 8 ? ' — 준수해요' : ' — 끈기의 승리'}</p>
            <div class="btn-row">
              <button class="btn" id="again">한 판 더!</button>
              <button class="btn secondary" onclick="location.hash=''">홈으로</button>
            </div>
          </div>`;
        this.el.querySelector('#again').addEventListener('click', () => this.solo());
        return;
      }
      sfx.tick();
      fx.vibrate([20]);
      this.renderSolo('');
    };
    this.el.querySelector('#go').addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    input.focus();
  },

  // ---------- 대전: 번갈아 추리, 먼저 3S ----------
  vsSetup(level) {
    this.level = level;
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>내 숫자 정하기</h2></div>
      <div class="screen-center">
        <p style="color:var(--fg-dim); text-align:center">AI가 맞혀야 할 <b>내 비밀 숫자</b>를 정하세요<br>(서로 다른 숫자 3자리)</p>
        <input type="tel" id="mysecret" maxlength="3" placeholder="예: 407" autocomplete="off"
          style="max-width:160px; text-align:center; font-size:1.6rem; letter-spacing:.3em">
        <div class="btn-row">
          <button class="btn" id="start">대결 시작!</button>
          <button class="btn secondary small" id="rand">🎲 랜덤</button>
        </div>
        <p id="msg" style="color:var(--bad)"></p>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    const input = this.el.querySelector('#mysecret');
    this.el.querySelector('#rand').addEventListener('click', () => { input.value = randomSecret(); });
    this.el.querySelector('#start').addEventListener('click', () => {
      const s = input.value.trim();
      if (!validGuess(s)) { this.el.querySelector('#msg').textContent = '서로 다른 숫자 3자리!'; return; }
      this.mySecret = s;
      this.aiSecret = randomSecret();
      this.solver = createSolver(level);
      this.myTries = [];
      this.aiTries = [];
      this.vsRender('');
    });
  },

  vsRender(msg) {
    const row = (t) => `${t.g} → ${t.r.s}S ${t.r.b}B`;
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>⚾ AI 대결</h2></div>
      <div class="screen-center" style="gap:10px">
        <input type="tel" id="guess" maxlength="3" placeholder="AI 숫자 추리" autocomplete="off"
          style="max-width:160px; text-align:center; font-size:1.5rem; letter-spacing:.3em">
        <button class="btn" id="go">던지기!</button>
        <p id="msg" style="color:var(--bad); min-height:1.2em">${msg}</p>
        <div style="display:flex; gap:12px; width:100%; max-width:340px">
          <div class="card-panel" style="flex:1">
            <b>🙋 내 추리</b>
            ${this.myTries.map(row).map(r => `<div style="font-size:.9rem">${r}</div>`).join('') || '<div style="color:var(--fg-dim)">-</div>'}
          </div>
          <div class="card-panel" style="flex:1">
            <b>🤖 AI 추리</b>
            ${this.aiTries.map(row).map(r => `<div style="font-size:.9rem">${r}</div>`).join('') || '<div style="color:var(--fg-dim)">-</div>'}
          </div>
        </div>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    const input = this.el.querySelector('#guess');
    const go = () => {
      const g = input.value.trim();
      if (!validGuess(g)) { this.el.querySelector('#msg').textContent = '서로 다른 숫자 3자리!'; fx.wrong('땡!'); return; }
      const r = judge(g, this.aiSecret);
      this.myTries.push({ g, r });
      if (r.s === 3) return this.vsEnd(true);
      // AI 턴
      const ag = this.solver.nextGuess();
      const ar = judge(ag, this.mySecret);
      this.solver.feed(ag, ar);
      this.aiTries.push({ g: ag, r: ar });
      if (ar.s === 3) return this.vsEnd(false);
      sfx.tick();
      this.vsRender('');
    };
    this.el.querySelector('#go').addEventListener('click', go);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    input.focus();
  },

  vsEnd(won) {
    if (won) { sfx.fanfare(); fx.confetti(); } else { sfx.bad(); fx.shake(); }
    this.el.innerHTML = `
      <div class="screen-center">
        <div style="font-size:4rem">${won ? '🏆' : '😭'}</div>
        <div class="caption">${won ? '내가 먼저 맞혔다!' : 'AI 승리...'}</div>
        <p style="color:var(--fg-dim)">AI 숫자: ${this.aiSecret} · 내 숫자: ${this.mySecret}</p>
        <p style="color:var(--fg-dim)">내 시도 ${this.myTries.length}번 · AI 시도 ${this.aiTries.length}번</p>
        <div class="btn-row">
          <button class="btn" id="again">한 판 더!</button>
          <button class="btn secondary" onclick="location.hash=''">홈으로</button>
        </div>
      </div>`;
    this.el.querySelector('#again').addEventListener('click', () => this.vsSetup(this.level));
  },
};
