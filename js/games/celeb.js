// 연예인 퀴즈: 초성 모드(오프라인 OK) + 사진 모드(위키피디아 실시간, 온라인 전용)
// v2: 20초 제한시간 + 콤보 + 자동 진행 + 예능 연출 + AI 페르소나
import { createQuiz } from '../core/quiz.js';
import { createRival } from '../ai/rival.js';
import { sfx } from '../core/sound.js';
import { fx } from '../core/fx.js';
import { load, save } from '../core/store.js';
import { loadData, pick } from '../core/data.js';
import { fetchPortrait, loadImage } from '../core/wiki.js';

const ROUNDS = 10;
const TIME_SEC = 20;
const GRADE_COMMENTS = {
  S: ['연예계 인명사전이세요?', '팬심 만렙 인정;;', '소속사 차리셔야겠다'],
  A: ['연예뉴스 좀 보시는구나~', '오~ 덕력 좀 있는데?', '박수 짝짝짝'],
  B: ['TV는 보고 사시는군요', '반은 맞혔다!', '나쁘지 않아~'],
  C: ['요즘 연예인을 잘 모르시는군요…', '아이돌 세대교체를 따라가자', '다시 도전 각'],
  D: ['혹시 TV가 없으신가요…', '연예계와 담 쌓으셨군요', '뉴스만 보시는 타입'],
};

let timers = [];
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function every(fn, ms) { const t = setInterval(fn, ms); timers.push(t); return t; }
function clearTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }

export default {
  id: 'celeb', title: '연예인 퀴즈', emoji: '⭐',

  mount(el) { this.el = el; this.menu(); },
  unmount() { clearTimers(); },

  menu() {
    clearTimers();
    const best = load('celeb.best', 0);
    const online = navigator.onLine;
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>⭐ 연예인 퀴즈</h2></div>
      <div class="screen-center">
        <p class="caption" style="font-size:1.4rem">이름을 맞혀라!</p>
        ${best ? `<span class="badge">최고 기록 ${best}점</span>` : ''}
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:300px">
          <button class="btn" data-mode="cho">🔤 초성 퀴즈 (20초 스피드)</button>
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
        try { await loadImage(photo.imgUrl); } catch { photo = null; }
      }
    }
    this.renderRound(item, photo);
  },

  renderRound(item, photo) {
    const q = this.quiz;
    let done = false;
    let remain = TIME_SEC;

    this.el.innerHTML = `
      <div class="top-bar">
        <button class="back-btn" id="quit">←</button>
        <h2>${q.round()} / ${q.total()}</h2>
        ${this.mode === 'ai' ? `<span class="badge">나 ${q.result().score} : ${this.aiScore} AI</span>`
          : `<span class="badge">${q.result().score}점${q.combo() >= 2 ? ' 🔥' + q.combo() : ''}</span>`}
      </div>
      <div class="screen-center" style="gap:10px">
        ${this.rival ? `
          <div class="ai-face">
            <span class="ai-emoji" id="aiemoji">${this.rival.emoji}</span>
            <div><b>${this.rival.name}</b><div id="aibubble"></div></div>
          </div>` : ''}
        <div class="time-bar" id="tbar"><div style="width:100%"></div></div>
        ${photo
          ? `<img src="${photo.imgUrl}" alt="" style="max-width:80vw; max-height:38vh; border-radius:12px; object-fit:cover">`
          : `<div class="caption">${item.cho}</div><span class="badge">${item.cat}</span>`}
        <div id="hints" style="color:var(--fg-dim); min-height:1.4em; text-align:center"></div>
        <input type="text" id="guess" placeholder="이름 입력" autocomplete="off" style="max-width:300px; text-align:center">
        <div class="btn-row">
          <button class="btn" id="submit">정답!</button>
          <button class="btn secondary small" id="hintbtn">힌트 (-30점)</button>
        </div>
      </div>`;

    this.el.querySelector('#quit').addEventListener('click', () => { clearTimers(); this.menu(); });

    const finishRound = (ok, sub) => {
      if (done) return;
      done = true;
      clearTimers();
      this.roundResult(item, photo, ok, sub);
    };

    // 제한시간
    const bar = this.el.querySelector('#tbar');
    every(() => {
      remain -= 0.2;
      if (bar) {
        bar.firstElementChild.style.width = Math.max(0, (remain / TIME_SEC) * 100) + '%';
        bar.classList.toggle('danger', remain <= 5);
      }
      if (remain <= 0) {
        q.pass();
        fx.wrong('시간 초과!');
        sfx.bad();
        finishRound(false, '');
      }
    }, 200);
    let beat = 0;
    every(() => {
      beat++;
      if (remain <= 5) sfx.heartbeat(3);
      else if (beat % 2 === 0) sfx.heartbeat(1);
    }, 1000);

    // AI 대결
    if (this.rival && this.rival.willAnswer()) {
      const delay = Math.min(this.rival.answerDelayMs(), TIME_SEC * 1000 - 500);
      later(() => { const e = this.el.querySelector('#aiemoji'); if (e) e.textContent = '😏'; }, delay * 0.7);
      later(() => {
        if (done) return;
        this.aiScore += 100;
        q.pass();
        const bub = this.el.querySelector('#aibubble');
        if (bub) bub.innerHTML = `<span class="ai-bubble">"${item.name}!" ${this.rival.taunt()}</span>`;
        fx.wrong('뺏겼다!');
        sfx.bad();
        later(() => finishRound(false, `${this.rival.name}이 먼저 맞혔어요`), 900);
      }, delay);
    } else if (this.rival) {
      later(() => { const e = this.el.querySelector('#aiemoji'); if (e) e.textContent = '🤔'; }, 2000);
    }

    const input = this.el.querySelector('#guess');
    const tryAnswer = () => {
      if (done || !input.value.trim()) return;
      const r = q.answer(input.value, remain);
      if (r.correct) {
        sfx.ok();
        if (r.combo >= 2) { fx.comboPop(r.combo); sfx.combo(r.combo); }
        else fx.good();
        if (r.combo >= 3) fx.confetti(20);
        finishRound(true, `+${r.score}점`);
      } else {
        fx.wrong();
        sfx.bad();
        input.value = '';
        input.placeholder = '땡! 다시!';
      }
    };
    this.el.querySelector('#submit').addEventListener('click', tryAnswer);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') tryAnswer(); });
    this.el.querySelector('#hintbtn').addEventListener('click', () => {
      const h = q.revealHint();
      if (h) this.el.querySelector('#hints').textContent = `힌트 ${q.hintsUsed()}: ${h}`;
    });
    if (this.mode !== 'photo') input.focus();
  },

  roundResult(item, photo, ok, sub) {
    clearTimers();
    this.el.innerHTML = `
      <div class="screen-center">
        <div style="font-size:3rem">${ok ? '⭕' : '❌'}</div>
        <div class="caption">${item.name}</div>
        ${photo ? `
          <img src="${photo.imgUrl}" alt="" style="max-width:60vw; max-height:30vh; border-radius:12px; object-fit:cover">
          <p style="font-size:.75rem; color:var(--fg-dim)">
            <a href="${photo.pageUrl}" target="_blank" style="color:var(--fg-dim)">${photo.attribution} ↗</a>
          </p>` : `<p style="color:var(--fg-dim)">${item.hints[2]}</p>`}
        ${sub ? `<span class="badge">${sub}</span>` : ''}
      </div>`;
    later(() => this.nextOrEnd(), photo ? 2000 : 1600);
  },

  nextOrEnd() {
    if (this.quiz.next()) return this.playRound();
    const res = this.quiz.result();
    const best = load('celeb.best', 0);
    if (res.score > best) save('celeb.best', res.score);
    const won = res.score > this.aiScore;
    const comment = GRADE_COMMENTS[res.grade][Math.floor(Math.random() * 3)];
    sfx.grade(res.grade);
    if (res.grade === 'S' || res.grade === 'A' || (this.mode === 'ai' && won)) fx.confetti();
    this.el.innerHTML = `
      <div class="screen-center">
        <div style="font-size:4.5rem; font-weight:900; color:var(--accent)">${res.grade}</div>
        <p class="caption" style="font-size:1.1rem">"${comment}"</p>
        <div style="font-size:2.2rem; font-weight:900">${res.score}점</div>
        ${res.maxCombo >= 2 ? `<span class="badge">🔥 최대 ${res.maxCombo}연속</span>` : ''}
        ${this.mode === 'ai' ? `
          <div class="ai-face" style="margin-top:8px">
            <span class="ai-emoji">${won ? '😭' : this.rival.emoji}</span>
            <span class="ai-bubble">"${won ? this.rival.winLine() : this.rival.loseLine()}" (AI ${this.aiScore}점)</span>
          </div>` : `<p style="color:var(--fg-dim)">${res.total}문제 중 ${res.correct}개 정답</p>`}
        <div class="btn-row">
          <button class="btn" id="again">한 판 더!</button>
          <button class="btn secondary" onclick="location.hash=''">홈으로</button>
        </div>
      </div>`;
    this.el.querySelector('#again').addEventListener('click', () => this.menu());
  },
};
