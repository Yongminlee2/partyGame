// 밸런스 게임 ⚖️: 둘 중 하나만! 다같이 손들기용 + 혼자서는 AI 4명 반응 보기.
import { sfx } from '../core/sound.js';
import { fx } from '../core/fx.js';
import { loadData, shuffle } from '../core/data.js';

const AI_NAMES = ['🤖 알파', '🤖 브라보', '🤖 찰리', '🤖 델타'];
const AI_LINES_PICK = [
  '이건 고민도 안 됨', '무조건 이쪽이지', '반대쪽은 좀…', '난 후회 안 해',
  '인생은 실전이야', '이게 국룰 아님?', '반박 시 내 말이 맞음', '눈 감고 골랐다',
  '이건 과학이야', '내 취향 존중해줘', '어른의 선택이란 이런 것', '한 치의 망설임도 없다',
];

export default {
  id: 'balance', title: '밸런스 게임', emoji: '⚖️',

  mount(el) { this.el = el; this.menu(); },
  unmount() {},

  menu() {
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>⚖️ 밸런스 게임</h2></div>
      <div class="screen-center">
        <p class="caption" style="font-size:1.4rem">둘 중 하나만!</p>
        <p style="color:var(--fg-dim); text-align:center">다같이: 하나씩 골라 외치고 이유 배틀<br>혼자: AI 4명과 취향 비교</p>
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:280px">
          <button class="btn" data-mode="party">👥 다같이</button>
          <button class="btn" data-mode="solo">🤖 AI들과 비교</button>
        </div>
      </div>`;
    this.el.querySelectorAll('[data-mode]').forEach(b =>
      b.addEventListener('click', () => this.start(b.dataset.mode)));
  },

  async start(mode) {
    const all = await loadData('balance');
    this.deck = shuffle(all);
    this.idx = 0;
    this.mode = mode;
    this.agree = 0;
    this.playCard();
  },

  playCard() {
    if (this.idx >= this.deck.length) this.idx = 0;
    const item = this.deck[this.idx];
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>${this.idx + 1}번째</h2>
        <span class="badge">${item.cat}</span></div>
      <div class="screen-center" style="gap:14px">
        <button class="btn" data-pick="a" style="width:100%; max-width:340px; min-height:76px; font-size:1.15rem; white-space:normal">${item.a}</button>
        <div class="caption" style="font-size:1.6rem">VS</div>
        <button class="btn secondary" data-pick="b" style="width:100%; max-width:340px; min-height:76px; font-size:1.15rem; white-space:normal">${item.b}</button>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    this.el.querySelectorAll('[data-pick]').forEach(b =>
      b.addEventListener('click', () => {
        sfx.ok();
        fx.vibrate([20]);
        if (this.mode === 'party') { this.idx++; this.playCard(); }
        else this.soloReveal(item, b.dataset.pick);
      }));
  },

  soloReveal(item, myPick) {
    // AI 4명이 각자 선택 (약간 a 쏠림 방지로 순수 랜덤)
    const lines = [...AI_LINES_PICK].sort(() => Math.random() - 0.5);
    const ais = AI_NAMES.map((name, i) => ({
      name,
      pick: Math.random() < 0.5 ? 'a' : 'b',
      line: lines[i],
    }));
    const same = ais.filter(x => x.pick === myPick).length;
    if (same >= 3) fx.caption('취향 통했다!', 'ok');
    else if (same === 0) fx.caption('나만 달라;;', 'bad');

    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>결과</h2></div>
      <div style="text-align:center; padding-bottom:10px">
        <span class="badge">나의 선택: ${myPick === 'a' ? item.a : item.b}</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px">
        ${ais.map(x => `
          <div class="card-panel" style="display:flex; justify-content:space-between; align-items:center; gap:8px">
            <b>${x.name}</b>
            <span style="flex:1; text-align:center; font-size:.9rem; color:${x.pick === myPick ? 'var(--ok)' : 'var(--bad)'}">
              ${x.pick === 'a' ? item.a : item.b}</span>
            <span style="color:var(--fg-dim); font-size:.8rem">"${x.line}"</span>
          </div>`).join('')}
      </div>
      <div style="text-align:center; padding:12px">
        <p style="color:var(--fg-dim)">${same}명이 나랑 같은 선택</p>
        <button class="btn" id="next">다음 카드 →</button>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    this.el.querySelector('#next').addEventListener('click', () => { this.idx++; this.playCard(); });
  },
};
