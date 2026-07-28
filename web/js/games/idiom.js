// 사자성어 뒷글자 맞추기: 혼자 연습 / AI 대결 / 다같이
import { createQuiz } from '../core/quiz.js';
import { createRival, RIVAL_PARAMS } from '../ai/rival.js';
import { sfx } from '../core/sound.js';
import { load, save } from '../core/store.js';
import { loadData, pick } from '../core/data.js';

const ROUNDS = 10;
let timers = [];
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

export default {
  id: 'idiom', title: '사자성어', emoji: '📜',

  mount(el) {
    this.el = el;
    this.menu();
  },
  unmount() { clearTimers(); },

  menu() {
    const best = load('idiom.best', 0);
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>📜 사자성어</h2></div>
      <div class="screen-center">
        <p class="caption" style="font-size:1.4rem">앞 두 글자를 보고<br>뒷 두 글자를 맞혀라!</p>
        ${best ? `<span class="badge">최고 기록 ${best}점</span>` : ''}
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:280px">
          <button class="btn" data-mode="solo">🙋 혼자 연습</button>
          <button class="btn" data-mode="ai">🤖 AI와 대결</button>
          <button class="btn secondary" data-mode="party">👥 다같이 (진행자용)</button>
        </div>
      </div>`;
    this.el.querySelectorAll('[data-mode]').forEach(b =>
      b.addEventListener('click', () => this.pickLevel(b.dataset.mode)));
  },

  pickLevel(mode) {
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>난이도 선택</h2></div>
      <div class="screen-center">
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:280px">
          <button class="btn" data-level="1">🌱 쉬움</button>
          <button class="btn" data-level="2">🌿 보통</button>
          <button class="btn" data-level="3">🌳 어려움</button>
        </div>
        ${mode === 'ai' ? '<p style="color:var(--fg-dim)">난이도가 높을수록 AI도 빨라져요</p>' : ''}
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.menu());
    this.el.querySelectorAll('[data-level]').forEach(b =>
      b.addEventListener('click', () => this.start(mode, Number(b.dataset.level))));
  },

  async start(mode, level) {
    const all = await loadData('idioms');
    const items = pick(all.filter(i => i.level === level), ROUNDS)
      .map(i => ({ ...i, answer: i.back, hints: [i.meaning] }));
    this.quiz = createQuiz({ items, rounds: ROUNDS });
    this.mode = mode;
    this.rival = mode === 'ai' ? createRival(level) : null;
    this.aiScore = 0;
    this.playRound();
  },

  playRound() {
    clearTimers();
    const q = this.quiz;
    const item = q.current();
    let answered = false;

    this.el.innerHTML = `
      <div class="top-bar">
        <button class="back-btn" id="quit">←</button>
        <h2>${q.round()} / ${q.total()}</h2>
        ${this.mode === 'ai' ? `<span class="badge">나 ${q.result().score} : ${this.aiScore} AI</span>` : ''}
      </div>
      <div class="screen-center">
        <div class="caption"><span style="color:var(--fg)">${item.front}</span> ＿ ＿</div>
        <p id="hint" style="color:var(--fg-dim); min-height:2.4em; text-align:center"></p>
        ${this.mode === 'ai' ? '<div style="width:100%;max-width:320px;height:8px;background:var(--bg-card);border-radius:4px"><div id="aibar" style="height:100%;width:0%;background:var(--accent2);border-radius:4px"></div></div>' : ''}
        ${this.mode === 'party'
          ? '<button class="btn" id="reveal">정답 보기</button>'
          : `<input type="text" id="guess" placeholder="뒤 두 글자 입력" autocomplete="off" maxlength="2" style="max-width:220px; text-align:center; font-size:1.4rem">
             <div class="btn-row">
               <button class="btn" id="submit">정답!</button>
               <button class="btn secondary small" id="hintbtn">힌트 보기 (-30점)</button>
               <button class="btn secondary small" id="giveup">모르겠어요</button>
             </div>`}
      </div>`;

    this.el.querySelector('#quit').addEventListener('click', () => { clearTimers(); this.menu(); });

    if (this.mode === 'party') {
      this.el.querySelector('#reveal').addEventListener('click', () => {
        sfx.ok();
        this.showResult(item, true, '', () => this.nextOrEnd());
      });
      return;
    }

    // AI 대결: AI가 정답을 말하는 시점 예약 + 진행 바
    if (this.rival && this.rival.willAnswer()) {
      const delay = this.rival.answerDelayMs();
      const bar = this.el.querySelector('#aibar');
      const t0 = Date.now();
      const iv = setInterval(() => {
        if (bar) bar.style.width = Math.min(100, ((Date.now() - t0) / delay) * 100) + '%';
      }, 100);
      timers.push(iv);
      later(() => {
        clearInterval(iv);
        if (answered) return;
        answered = true;
        this.aiScore += 100;
        sfx.bad();
        q.pass();
        this.showResult(item, false, 'AI가 먼저 맞혔어요!', () => this.nextOrEnd());
      }, delay);
    }

    const input = this.el.querySelector('#guess');
    const tryAnswer = () => {
      if (answered || !input.value.trim()) return;
      const r = q.answer(input.value);
      if (r.correct) {
        answered = true;
        clearTimers();
        sfx.ok();
        this.showResult(item, true, `+${r.score}점`, () => this.nextOrEnd());
      } else {
        sfx.bad();
        input.value = '';
        input.placeholder = '땡! 다시 도전';
      }
    };
    this.el.querySelector('#submit').addEventListener('click', tryAnswer);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') tryAnswer(); });
    this.el.querySelector('#hintbtn').addEventListener('click', () => {
      const h = q.revealHint();
      if (h) this.el.querySelector('#hint').textContent = `힌트: ${h}`;
    });
    this.el.querySelector('#giveup').addEventListener('click', () => {
      if (answered) return;
      answered = true;
      clearTimers();
      q.pass();
      this.showResult(item, false, '', () => this.nextOrEnd());
    });
    input.focus();
  },

  showResult(item, ok, sub, onNext) {
    this.el.innerHTML = `
      <div class="screen-center">
        <div style="font-size:3rem">${ok ? '⭕' : '❌'}</div>
        <div class="caption">${item.word}</div>
        <p style="color:var(--fg-dim); text-align:center; max-width:320px">${item.meaning}</p>
        ${sub ? `<span class="badge">${sub}</span>` : ''}
        <button class="btn" id="next">다음 →</button>
      </div>`;
    this.el.querySelector('#next').addEventListener('click', onNext);
  },

  nextOrEnd() {
    if (this.quiz.next()) return this.playRound();
    const res = this.quiz.result();
    const best = load('idiom.best', 0);
    if (this.mode !== 'party' && res.score > best) save('idiom.best', res.score);
    const win = this.mode === 'ai' ? (res.score > this.aiScore ? '🏆 승리!' : res.score === this.aiScore ? '🤝 무승부' : '😭 패배...') : '';
    sfx.fanfare();
    this.el.innerHTML = `
      <div class="screen-center">
        ${win ? `<div class="caption">${win}</div>` : '<div class="caption">결과</div>'}
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
