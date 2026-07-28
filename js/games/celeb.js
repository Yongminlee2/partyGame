// 연예인 퀴즈: 초성 모드(오프라인 OK) + 사진 모드(위키피디아 실시간, 온라인 전용)
import { createQuiz } from '../core/quiz.js';
import { createRival } from '../ai/rival.js';
import { sfx } from '../core/sound.js';
import { load, save } from '../core/store.js';
import { loadData, pick } from '../core/data.js';
import { fetchPortrait, loadImage } from '../core/wiki.js';

const ROUNDS = 10;
let timers = [];
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function every(fn, ms) { const t = setInterval(fn, ms); timers.push(t); return t; }
function clearTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }

export default {
  id: 'celeb', title: '연예인 퀴즈', emoji: '⭐',

  mount(el) { this.el = el; this.menu(); },
  unmount() { clearTimers(); },

  menu() {
    const best = load('celeb.best', 0);
    const online = navigator.onLine;
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>⭐ 연예인 퀴즈</h2></div>
      <div class="screen-center">
        <p class="caption" style="font-size:1.4rem">이름을 맞혀라!</p>
        ${best ? `<span class="badge">최고 기록 ${best}점</span>` : ''}
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:300px">
          <button class="btn" data-mode="cho">🔤 초성 퀴즈</button>
          <button class="btn" data-mode="ai">🤖 AI와 초성 대결</button>
          <button class="btn ${online ? '' : 'secondary'}" data-mode="photo" ${online ? '' : 'disabled'}>
            📷 사진 퀴즈 ${online ? '' : '(오프라인)'}
          </button>
        </div>
        <p style="color:var(--fg-dim); font-size:.8rem; max-width:300px; text-align:center">
          사진 퀴즈는 위키피디아에서 실시간으로 불러오며 앱에 저장하지 않아요
        </p>
      </div>`;
    this.el.querySelectorAll('[data-mode]:not([disabled])').forEach(b =>
      b.addEventListener('click', () => this.pickCat(b.dataset.mode)));
  },

  pickCat(mode) {
    const cats = ['전체', '가수', '배우', '예능인', '운동선수'];
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>분야 선택</h2></div>
      <div class="screen-center">
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:280px">
          ${cats.map(c => `<button class="btn secondary" data-cat="${c}">${c}</button>`).join('')}
        </div>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    this.el.querySelectorAll('[data-cat]').forEach(b =>
      b.addEventListener('click', () => this.start(mode, b.dataset.cat)));
  },

  async start(mode, cat) {
    const all = await loadData('celebs');
    const filtered = cat === '전체' ? all : all.filter(c => c.cat === cat);
    const items = pick(filtered, ROUNDS).map(c => ({ ...c, answer: c.name, hints: c.hints }));
    this.quiz = createQuiz({ items, rounds: ROUNDS });
    this.mode = mode;
    this.rival = mode === 'ai' ? createRival(2) : null;
    this.aiScore = 0;
    this.playRound();
  },

  async playRound() {
    clearTimers();
    const q = this.quiz;
    const item = q.current();
    let photo = null;

    if (this.mode === 'photo') {
      this.el.innerHTML = '<div class="screen-center"><p>사진 불러오는 중...</p></div>';
      photo = await fetchPortrait(item.wiki);
      if (photo) {
        try { photo.img = await loadImage(photo.imgUrl); }
        catch { photo = null; }
      }
    }

    this.renderRound(item, photo);
  },

  renderRound(item, photo) {
    const q = this.quiz;
    let answered = false;

    this.el.innerHTML = `
      <div class="top-bar">
        <button class="back-btn" id="quit">←</button>
        <h2>${q.round()} / ${q.total()}</h2>
        ${this.mode === 'ai' ? `<span class="badge">나 ${q.result().score} : ${this.aiScore} AI</span>` : `<span class="badge">${item.cat}</span>`}
      </div>
      <div class="screen-center">
        ${photo
          ? `<img src="${photo.imgUrl}" alt="" style="max-width:80vw; max-height:45vh; border-radius:12px; object-fit:cover">`
          : `<div class="caption">${item.cho}</div>`}
        <div id="hints" style="color:var(--fg-dim); min-height:1.4em; text-align:center"></div>
        ${this.mode === 'ai' ? '<div style="width:100%;max-width:320px;height:8px;background:var(--bg-card);border-radius:4px"><div id="aibar" style="height:100%;width:0%;background:var(--accent2);border-radius:4px"></div></div>' : ''}
        <input type="text" id="guess" placeholder="이름 입력" autocomplete="off" style="max-width:300px; text-align:center">
        <div class="btn-row">
          <button class="btn" id="submit">정답!</button>
          ${photo ? '' : '<button class="btn secondary small" id="hint">힌트 보기 (-30점)</button>'}
          <button class="btn secondary small" id="giveup">모르겠어요</button>
        </div>
      </div>`;

    this.el.querySelector('#quit').addEventListener('click', () => { clearTimers(); this.menu(); });

    // AI 대결
    if (this.rival && this.rival.willAnswer()) {
      const delay = this.rival.answerDelayMs();
      const bar = this.el.querySelector('#aibar');
      const t0 = Date.now();
      every(() => { if (bar) bar.style.width = Math.min(100, ((Date.now() - t0) / delay) * 100) + '%'; }, 100);
      later(() => {
        if (answered) return;
        answered = true;
        this.aiScore += 100;
        sfx.bad();
        q.pass();
        this.showResult(item, photo, false, 'AI가 먼저 맞혔어요!');
      }, delay);
    }

    const tryAnswer = () => {
      if (answered) return;
      const v = this.el.querySelector('#guess').value;
      if (!v.trim()) return;
      const r = q.answer(v);
      if (r.correct) {
        answered = true;
        clearTimers();
        sfx.ok();
        this.showResult(item, photo, true, `+${r.score}점`);
      } else {
        sfx.bad();
        const g = this.el.querySelector('#guess');
        g.value = '';
        g.placeholder = '땡! 다시 도전';
      }
    };

    this.el.querySelector('#submit').addEventListener('click', tryAnswer);
    this.el.querySelector('#guess').addEventListener('keydown', e => { if (e.key === 'Enter') tryAnswer(); });
    this.el.querySelector('#hint')?.addEventListener('click', () => {
      const h = q.revealHint();
      if (h) this.el.querySelector('#hints').textContent = `힌트 ${q.hintsUsed()}: ${h}`;
      else sfx.bad();
    });
    this.el.querySelector('#giveup').addEventListener('click', () => {
      if (answered) return;
      answered = true;
      clearTimers();
      q.pass();
      this.showResult(item, photo, false, '');
    });
  },

  showResult(item, photo, ok, sub) {
    this.el.innerHTML = `
      <div class="screen-center">
        <div style="font-size:3rem">${ok ? '⭕' : '❌'}</div>
        <div class="caption">${item.name}</div>
        ${photo ? `
          <img src="${photo.imgUrl}" alt="" style="max-width:70vw; max-height:40vh; border-radius:12px; object-fit:cover">
          <p style="font-size:.75rem; color:var(--fg-dim)">
            <a href="${photo.pageUrl}" target="_blank" style="color:var(--fg-dim)">${photo.attribution} ↗</a>
          </p>` : `<p style="color:var(--fg-dim)">${item.hints[2]}</p>`}
        ${sub ? `<span class="badge">${sub}</span>` : ''}
        <button class="btn" id="next">다음 →</button>
      </div>`;
    this.el.querySelector('#next').addEventListener('click', () => this.nextOrEnd());
  },

  nextOrEnd() {
    if (this.quiz.next()) return this.playRound();
    const res = this.quiz.result();
    const best = load('celeb.best', 0);
    if (res.score > best) save('celeb.best', res.score);
    const win = this.mode === 'ai' ? (res.score > this.aiScore ? '🏆 승리!' : res.score === this.aiScore ? '🤝 무승부' : '😭 패배...') : '';
    sfx.fanfare();
    this.el.innerHTML = `
      <div class="screen-center">
        <div class="caption">${win || '결과'}</div>
        <div style="font-size:2.5rem; font-weight:900">${res.score}점</div>
        ${this.mode === 'ai' ? `<p style="color:var(--fg-dim)">AI: ${this.aiScore}점</p>` : ''}
        <p style="color:var(--fg-dim)">${res.total}문제 중 ${res.correct}개 정답</p>
        <div class="btn-row">
          <button class="btn" id="again">다시 하기</button>
          <button class="btn secondary" onclick="location.hash=''">홈으로</button>
        </div>
      </div>`;
    this.el.querySelector('#again').addEventListener('click', () => this.menu());
  },
};
