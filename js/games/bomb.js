// 폭탄 초성게임: 제시된 초성 단어를 번갈아 입력, 숨은 폭탄이 터질 때 든 사람 패배.
// 솔로 모드는 AI와 1:1 교대.
import { sfx } from '../core/sound.js';
import { loadData, shuffle } from '../core/data.js';
import { choseong } from '../core/hangul.js';

const GIVEUP_PROB = { 1: 0.15, 2: 0.07, 3: 0.02 };

export function checkWord(word, cho, used, entry) {
  const w = word.trim();
  if (used.has(w)) return 'dup';
  if (choseong(w) !== cho) return 'wrong-cho';
  if (!entry.w.includes(w)) return 'not-word';
  return 'ok';
}

export function pickAiWord(cho, used, entry, level) {
  if (Math.random() < (GIVEUP_PROB[level] ?? 0.07)) return null;
  const candidates = entry.c.filter(w => !used.has(w));
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

let timers = [];
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function clearTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }

export default {
  id: 'bomb', title: '폭탄 초성게임', emoji: '💣',

  mount(el) { this.el = el; this.menu(); },
  unmount() { clearTimers(); },

  menu() {
    clearTimers();
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>💣 폭탄 초성게임</h2></div>
      <div class="screen-center">
        <p style="color:var(--fg-dim); text-align:center">제시된 초성으로 단어를 이어 말해요.<br>폭탄이 언제 터질지는 아무도 몰라요!</p>
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:280px">
          <button class="btn" data-mode="party">👥 다같이 (폰 돌리기)</button>
          <button class="btn" data-mode="ai1">🤖 AI 대결 · 쉬움</button>
          <button class="btn" data-mode="ai2">🤖 AI 대결 · 보통</button>
          <button class="btn" data-mode="ai3">🤖 AI 대결 · 어려움</button>
        </div>
      </div>`;
    this.el.querySelectorAll('[data-mode]').forEach(b =>
      b.addEventListener('click', () => this.start(b.dataset.mode)));
  },

  async start(mode) {
    const dict = await loadData('choseong-dict');
    const cho = shuffle(Object.keys(dict))[0];
    this.entry = dict[cho];
    this.cho = cho;
    this.used = new Set();
    this.mode = mode;
    this.aiLevel = mode.startsWith('ai') ? Number(mode.slice(2)) : 0;
    this.turn = 'user'; // 파티에선 의미 없음, 솔로에선 user/ai 교대
    this.exploded = false;

    // 숨은 폭탄: 15~45초 랜덤
    const fuse = 15000 + Math.random() * 30000;
    later(() => this.explode(), fuse);

    // 긴장감 틱 사운드
    timers.push(setInterval(() => { if (!this.exploded) sfx.tick(); }, 2000));

    this.renderTurn('');
  },

  renderTurn(msg) {
    if (this.exploded) return;
    const solo = this.aiLevel > 0;
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="quit">←</button><h2>💣 ${this.cho}</h2>
        <span class="badge">${this.used.size}단어</span></div>
      <div class="screen-center">
        <div class="caption">${this.cho}</div>
        ${solo ? `<p style="color:var(--fg-dim)">${this.turn === 'user' ? '🙋 내 차례!' : '🤖 AI 생각 중...'}</p>` : '<p style="color:var(--fg-dim)">폰을 든 사람이 입력!</p>'}
        <p id="msg" style="color:var(--bad); min-height:1.4em">${msg}</p>
        <input type="text" id="word" placeholder="${this.cho} 단어 입력" autocomplete="off"
          style="max-width:280px; text-align:center" ${solo && this.turn === 'ai' ? 'disabled' : ''}>
        <button class="btn" id="go" ${solo && this.turn === 'ai' ? 'disabled' : ''}>입력!</button>
        <p style="color:var(--fg-dim); font-size:.8rem; max-width:300px; text-align:center; word-break:keep-all">
          ${[...this.used].join(', ')}</p>
      </div>`;
    this.el.querySelector('#quit').addEventListener('click', () => { clearTimers(); this.menu(); });

    const input = this.el.querySelector('#word');
    const submit = () => {
      if (this.exploded || !input.value.trim()) return;
      const w = input.value.trim();
      const r = checkWord(w, this.cho, this.used, this.entry);
      if (r === 'ok') {
        this.used.add(w);
        sfx.ok();
        if (this.aiLevel > 0) { this.turn = 'ai'; this.renderTurn(''); this.aiTurn(); }
        else this.renderTurn('');
      } else {
        sfx.bad();
        const msgs = { dup: '이미 나온 단어!', 'wrong-cho': '초성이 달라요!', 'not-word': '사전에 없는 단어!' };
        this.el.querySelector('#msg').textContent = msgs[r];
        input.value = '';
      }
    };
    this.el.querySelector('#go').addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    if (!(this.aiLevel > 0 && this.turn === 'ai')) input.focus();
  },

  aiTurn() {
    const delay = 1200 + Math.random() * 2800;
    later(() => {
      if (this.exploded) return;
      const w = pickAiWord(this.cho, this.used, this.entry, this.aiLevel);
      if (w === null) {
        // AI 포기 = 유저 승리
        clearTimers();
        sfx.fanfare();
        this.el.innerHTML = `
          <div class="screen-center">
            <div style="font-size:4rem">🏳️</div>
            <div class="caption">AI가 포기했어요!</div>
            <p style="color:var(--fg-dim)">${this.used.size}단어까지 갔어요</p>
            <div class="btn-row">
              <button class="btn" id="again">한 판 더</button>
              <button class="btn secondary" onclick="location.hash=''">홈으로</button>
            </div>
          </div>`;
        this.el.querySelector('#again').addEventListener('click', () => this.menu());
        return;
      }
      this.used.add(w);
      sfx.ok();
      this.turn = 'user';
      this.renderTurn(`🤖 AI: "${w}"`);
      const m = this.el.querySelector('#msg');
      if (m) m.style.color = 'var(--accent)';
    }, delay);
  },

  explode() {
    this.exploded = true;
    clearTimers();
    sfx.boom();
    const solo = this.aiLevel > 0;
    const loser = solo ? (this.turn === 'user' ? '😭 내가 졌다...' : '🏆 AI가 폭탄을 안았다!') : '지금 폰 든 사람 벌칙!';
    this.el.innerHTML = `
      <div class="screen-center">
        <div style="font-size:5rem">💥</div>
        <div class="caption">펑!</div>
        <p class="caption" style="font-size:1.3rem">${loser}</p>
        <p style="color:var(--fg-dim)">나온 단어 ${this.used.size}개: ${[...this.used].join(', ') || '없음'}</p>
        <div class="btn-row">
          <button class="btn" id="again">한 판 더</button>
          <button class="btn secondary" onclick="location.hash=''">홈으로</button>
        </div>
      </div>`;
    this.el.querySelector('#again').addEventListener('click', () => this.menu());
  },
};
