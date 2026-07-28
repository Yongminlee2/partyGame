// 진실게임 🎯: "여기서 제일 ~할 것 같은 사람은?" 지목 카드 덱. 파티 전용.
import { sfx } from '../core/sound.js';
import { fx } from '../core/fx.js';
import { loadData, shuffle } from '../core/data.js';

export default {
  id: 'truth', title: '진실게임', emoji: '🎯',

  mount(el) { this.el = el; this.intro(); },
  unmount() {},

  intro() {
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>🎯 진실게임</h2></div>
      <div class="screen-center">
        <p class="caption" style="font-size:1.4rem">셋! 하면 동시에 지목!</p>
        <p style="color:var(--fg-dim); text-align:center">카드를 읽고 하나·둘·셋에<br>제일 어울리는 사람을 손가락으로 지목!<br>최다 득표자는 해명 또는 벌칙</p>
        <button class="btn" id="start">시작!</button>
      </div>`;
    this.el.querySelector('#start').addEventListener('click', () => this.start());
  },

  async start() {
    const all = await loadData('truth');
    this.deck = shuffle(all);
    this.idx = 0;
    this.playCard();
  },

  playCard() {
    if (this.idx >= this.deck.length) this.idx = 0;
    const q = this.deck[this.idx];
    sfx.tick();
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>${this.idx + 1}번째 카드</h2></div>
      <div class="screen-center" style="gap:20px">
        <div class="card-panel" style="min-height:160px; display:flex; align-items:center; justify-content:center; width:100%; max-width:340px">
          <p class="caption" style="font-size:1.35rem; text-align:center; line-height:1.5">${q}</p>
        </div>
        <button class="btn" id="count">하나·둘·셋! 🫵</button>
        <button class="btn secondary small" id="next">다음 카드 →</button>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.intro());
    this.el.querySelector('#count').addEventListener('click', () => {
      let n = 3;
      const iv = setInterval(() => {
        if (n > 0) { fx.caption(String(n), 'combo'); sfx.tick(); n--; }
        else {
          clearInterval(iv);
          fx.caption('지목!!', 'ok');
          sfx.fanfare();
          fx.vibrate([50, 50, 100]);
        }
      }, 700);
    });
    this.el.querySelector('#next').addEventListener('click', () => { this.idx++; this.playCard(); });
  },
};
