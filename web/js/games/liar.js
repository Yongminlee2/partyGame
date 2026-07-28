// 라이어 게임: 파티(폰 돌려 단어 확인) + 솔로(AI 4명 중 라이어 찾기)
import { sfx } from '../core/sound.js';
import { load, save } from '../core/store.js';
import { loadData, shuffle, pick } from '../core/data.js';

export function assignRoles(n) {
  return { liarIndex: Math.floor(Math.random() * n) };
}

export function buildSoloRound(set, aiCount = 4) {
  const normals = shuffle(set.normal).slice(0, aiCount - 1).map(text => ({ text, isLiar: false }));
  const liar = { text: shuffle(set.liar)[0], isLiar: true };
  const statements = shuffle([...normals, liar]);
  return { statements, liarIndex: statements.findIndex(s => s.isLiar) };
}

export default {
  id: 'liar', title: '라이어 게임', emoji: '🤥',

  mount(el) { this.el = el; this.menu(); },
  unmount() {},

  menu() {
    const streak = load('liar.streak', 0);
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>🤥 라이어 게임</h2></div>
      <div class="screen-center">
        <p style="color:var(--fg-dim); text-align:center">모두 같은 단어를 받지만<br>한 명만 라이어! 라이어를 찾아내세요.</p>
        ${streak ? `<span class="badge">솔로 연속 정답 ${streak}</span>` : ''}
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:280px">
          <button class="btn" id="party">👥 다같이 (폰 돌리기)</button>
          <button class="btn" id="solo">🤖 솔로 (AI 라이어 찾기)</button>
        </div>
      </div>`;
    this.el.querySelector('#party').addEventListener('click', () => this.partySetup());
    this.el.querySelector('#solo').addEventListener('click', () => this.soloRound());
  },

  // ---------- 파티 ----------
  partySetup() {
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>몇 명이서 하나요?</h2></div>
      <div class="screen-center">
        <div class="btn-row" style="flex-wrap:wrap; justify-content:center">
          ${[3, 4, 5, 6, 7, 8, 9, 10].map(n => `<button class="btn secondary" data-n="${n}">${n}명</button>`).join('')}
        </div>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    this.el.querySelectorAll('[data-n]').forEach(b =>
      b.addEventListener('click', () => this.partyStart(Number(b.dataset.n))));
  },

  async partyStart(n) {
    const sets = await loadData('liar');
    this.set = pick(sets, 1)[0];
    this.n = n;
    this.liarIndex = assignRoles(n).liarIndex;
    this.showPlayer(0);
  },

  showPlayer(i) {
    if (i >= this.n) return this.discussion();
    let revealed = false;
    this.el.innerHTML = `
      <div class="screen-center">
        <p class="caption" style="font-size:1.5rem">${i + 1}번째 사람</p>
        <p style="color:var(--fg-dim)">다른 사람이 안 보게 확인하세요</p>
        <div class="card-panel" id="card" style="width:260px; height:140px; display:flex; align-items:center; justify-content:center; cursor:pointer">
          <span id="cardtext" style="font-size:1.3rem; font-weight:800">👆 눌러서 확인</span>
        </div>
        <button class="btn" id="done" disabled>확인했어요 → 다음 사람</button>
      </div>`;
    const card = this.el.querySelector('#card');
    const text = this.el.querySelector('#cardtext');
    const done = this.el.querySelector('#done');
    card.addEventListener('pointerdown', () => {
      text.textContent = i === this.liarIndex ? '🤥 당신은 라이어!' : `제시어: ${this.set.word}`;
      text.style.color = i === this.liarIndex ? 'var(--bad)' : 'var(--accent)';
      revealed = true;
      done.disabled = false;
    });
    card.addEventListener('pointerup', () => { text.textContent = '👆 눌러서 확인'; text.style.color = ''; });
    card.addEventListener('pointerleave', () => { text.textContent = '👆 눌러서 확인'; text.style.color = ''; });
    done.addEventListener('click', () => { if (revealed) this.showPlayer(i + 1); });
  },

  discussion() {
    this.el.innerHTML = `
      <div class="screen-center">
        <div class="caption" style="font-size:1.6rem">🗣️ 토론 시간!</div>
        <p style="color:var(--fg-dim); text-align:center">카테고리: <b>${this.set.category}</b><br>
        돌아가며 제시어를 설명하세요.<br>라이어는 아는 척 버텨야 합니다!</p>
        <button class="btn" id="vote">투표하러 가기</button>
      </div>`;
    this.el.querySelector('#vote').addEventListener('click', () => this.vote());
  },

  vote() {
    this.el.innerHTML = `
      <div class="screen-center">
        <p class="caption" style="font-size:1.4rem">라이어로 지목된 사람은?</p>
        <div class="btn-row" style="flex-wrap:wrap; justify-content:center">
          ${Array.from({ length: this.n }, (_, i) => `<button class="btn secondary" data-p="${i}">${i + 1}번</button>`).join('')}
        </div>
      </div>`;
    this.el.querySelectorAll('[data-p]').forEach(b =>
      b.addEventListener('click', () => {
        const picked = Number(b.dataset.p);
        const caught = picked === this.liarIndex;
        if (caught) sfx.fanfare(); else sfx.bad();
        this.el.innerHTML = `
          <div class="screen-center">
            <div style="font-size:4rem">${caught ? '🎯' : '🤣'}</div>
            <div class="caption">라이어는 ${this.liarIndex + 1}번!</div>
            <p style="color:var(--fg-dim)">제시어: ${this.set.word}</p>
            <p class="caption" style="font-size:1.2rem">${caught ? '라이어 검거 성공! 라이어 벌칙!' : '라이어 승리! 시민들 벌칙!'}</p>
            <div class="btn-row">
              <button class="btn" id="again">한 판 더</button>
              <button class="btn secondary" onclick="location.hash=''">홈으로</button>
            </div>
          </div>`;
        this.el.querySelector('#again').addEventListener('click', () => this.partySetup());
      }));
  },

  // ---------- 솔로 ----------
  async soloRound() {
    const sets = await loadData('liar');
    const set = pick(sets, 1)[0];
    const round = buildSoloRound(set, 4);
    const names = ['🤖 알파', '🤖 브라보', '🤖 찰리', '🤖 델타'];

    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>제시어: ${set.word}</h2></div>
      <p style="color:var(--fg-dim); text-align:center; padding-bottom:8px">한 명은 제시어를 몰라요. 누가 라이어일까요?</p>
      <div id="stmts" style="display:flex; flex-direction:column; gap:10px">
        ${round.statements.map((s, i) => `
          <button class="card-panel" data-i="${i}" style="text-align:left; border:2px solid transparent; color:var(--fg); font-family:inherit; font-size:1rem; cursor:pointer">
            <b>${names[i]}</b><br>"${s.text}"
          </button>`).join('')}
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    this.el.querySelectorAll('[data-i]').forEach(b =>
      b.addEventListener('click', () => {
        const picked = Number(b.dataset.i);
        const ok = picked === round.liarIndex;
        const streak = ok ? load('liar.streak', 0) + 1 : 0;
        save('liar.streak', streak);
        if (ok) sfx.fanfare(); else sfx.bad();
        this.el.innerHTML = `
          <div class="screen-center">
            <div style="font-size:4rem">${ok ? '🎯' : '❌'}</div>
            <div class="caption">${ok ? '정답!' : '땡!'}</div>
            <p style="color:var(--fg-dim)">라이어는 ${names[round.liarIndex]}<br>"${round.statements[round.liarIndex].text}"</p>
            ${ok ? `<span class="badge">연속 정답 ${streak}</span>` : ''}
            <div class="btn-row">
              <button class="btn" id="again">다음 문제</button>
              <button class="btn secondary" onclick="location.hash=''">홈으로</button>
            </div>
          </div>`;
        this.el.querySelector('#again').addEventListener('click', () => this.soloRound());
      }));
  },
};
