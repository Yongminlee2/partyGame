// 사자성어 뒷글자 맞추기: 혼자 연습 / AI 대결 / 다같이
// v2: 15초 제한시간 + 콤보 + 자동 진행 + 예능 연출
import { createQuiz } from '../core/quiz.js';
import { createRival } from '../ai/rival.js';
import { sfx } from '../core/sound.js';
import { fx } from '../core/fx.js';
import { load, save } from '../core/store.js';
import { loadData, pick } from '../core/data.js';

const ROUNDS = 10;
const TIME_SEC = 15;
const GRADE_COMMENTS = {
  S: ['미쳤다;; 이걸 다 맞히네', '사자성어 만렙 인정', '혹시 국어 선생님이세요?'],
  A: ['오~ 좀 치는데?', '박수 짝짝짝', '어른의 품격 무엇'],
  B: ['나쁘지 않아, 나쁘지 않아', '반은 넘겼다!', '중간은 간다'],
  C: ['아슬아슬했다…', '뜻은 알겠는데 글자가…', '다시 도전 각'],
  D: ['국어책부터 다시 펴자…', '사자성어가 울고 있어요', '고사성어: 나를 아는가?'],
};

let timers = [];
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function every(fn, ms) { const t = setInterval(fn, ms); timers.push(t); return t; }
function clearTimers() { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; }

export default {
  id: 'idiom', title: '사자성어', emoji: '📜',

  mount(el) {
    this.el = el;
    this.menu();
  },
  unmount() { clearTimers(); },

  menu() {
    clearTimers();
    const best = load('idiom.best', 0);
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>📜 사자성어</h2></div>
      <div class="screen-center">
        <p class="caption" style="font-size:1.4rem">앞 두 글자를 보고<br>뒷 두 글자를 맞혀라!</p>
        ${best ? `<span class="badge">최고 기록 ${best}점</span>` : ''}
        <div class="btn-row" style="flex-direction:column; width:100%; max-width:280px">
          <button class="btn" data-mode="solo">🙋 혼자 도전 (15초 스피드)</button>
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
    let done = false;
    let remain = TIME_SEC;

    this.el.innerHTML = `
      <div class="top-bar">
        <button class="back-btn" id="quit">←</button>
        <h2>${q.round()} / ${q.total()}</h2>
        ${this.mode === 'ai' ? `<span class="badge">나 ${q.result().score} : ${this.aiScore} AI</span>`
          : `<span class="badge">${q.result().score}점${q.combo() >= 2 ? ' 🔥' + q.combo() : ''}</span>`}
      </div>
      <div class="screen-center">
        ${this.rival ? `
          <div class="ai-face">
            <span class="ai-emoji" id="aiemoji">${this.rival.emoji}</span>
            <div><b>${this.rival.name}</b><div id="aibubble"></div></div>
          </div>` : ''}
        ${this.mode === 'party' ? '' : `<div class="time-bar" id="tbar"><div style="width:100%"></div></div>`}
        <div class="caption"><span style="color:var(--fg)">${item.front}</span> ＿ ＿</div>
        <p id="hint" style="color:var(--fg-dim); min-height:2.4em; text-align:center"></p>
        ${this.mode === 'party'
          ? '<button class="btn" id="reveal">정답 보기</button>'
          : `<input type="text" id="guess" placeholder="뒤 두 글자 입력" autocomplete="off" maxlength="2" style="max-width:220px; text-align:center; font-size:1.4rem">
             <div class="btn-row">
               <button class="btn" id="submit">정답!</button>
               <button class="btn secondary small" id="hintbtn">힌트 (-30점)</button>
             </div>`}
      </div>`;

    this.el.querySelector('#quit').addEventListener('click', () => { clearTimers(); this.menu(); });

    if (this.mode === 'party') {
      this.el.querySelector('#reveal').addEventListener('click', () => {
        sfx.ok();
        this.roundResult(item, true, '');
      });
      return;
    }

    const finishRound = (ok, sub) => {
      if (done) return;
      done = true;
      clearTimers();
      this.roundResult(item, ok, sub);
    };

    // 제한시간 타이머
    const bar = this.el.querySelector('#tbar');
    every(() => {
      remain -= 0.2;
      if (bar) {
        bar.firstElementChild.style.width = Math.max(0, (remain / TIME_SEC) * 100) + '%';
        bar.classList.toggle('danger', remain <= 5);
      }
      if (remain <= 0) {
        this.quiz.pass();
        fx.wrong('시간 초과!');
        sfx.bad();
        finishRound(false, '');
      }
    }, 200);
    let lastBeat = 0;
    every(() => {
      lastBeat++;
      if (remain <= 5) sfx.heartbeat(3);
      else if (lastBeat % 2 === 0) sfx.heartbeat(1);
    }, 1000);

    // AI 대결
    if (this.rival && this.rival.willAnswer()) {
      const delay = Math.min(this.rival.answerDelayMs(), TIME_SEC * 1000 - 500);
      later(() => {
        const e = this.el.querySelector('#aiemoji');
        if (e) e.textContent = '😏';
      }, delay * 0.7);
      later(() => {
        if (done) return;
        this.aiScore += 100;
        this.quiz.pass();
        const bub = this.el.querySelector('#aibubble');
        if (bub) bub.innerHTML = `<span class="ai-bubble">"${item.back}!" ${this.rival.taunt()}</span>`;
        fx.wrong('뺏겼다!');
        sfx.bad();
        later(() => finishRound(false, `${this.rival.name}이 먼저 맞혔어요`), 900);
      }, delay);
    } else if (this.rival) {
      later(() => {
        const e = this.el.querySelector('#aiemoji');
        if (e) e.textContent = '🤔';
      }, 2000);
    }

    const input = this.el.querySelector('#guess');
    const tryAnswer = () => {
      if (done || !input.value.trim()) return;
      const r = this.quiz.answer(input.value, remain);
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
      const h = this.quiz.revealHint();
      if (h) this.el.querySelector('#hint').textContent = `힌트: ${h}`;
    });
    input.focus();
  },

  // 1.6초 결과 노출 후 자동 다음
  roundResult(item, ok, sub) {
    clearTimers();
    this.el.innerHTML = `
      <div class="screen-center">
        <div style="font-size:3rem">${ok ? '⭕' : '❌'}</div>
        <div class="caption">${item.word}</div>
        <p style="color:var(--fg-dim); text-align:center; max-width:320px">${item.meaning}</p>
        ${sub ? `<span class="badge">${sub}</span>` : ''}
      </div>`;
    if (this.mode === 'party') {
      later(() => this.nextOrEnd(), 2200);
    } else {
      later(() => this.nextOrEnd(), 1600);
    }
  },

  nextOrEnd() {
    if (this.quiz.next()) return this.playRound();
    const res = this.quiz.result();
    const best = load('idiom.best', 0);
    if (this.mode !== 'party' && res.score > best) save('idiom.best', res.score);
    const won = res.score > this.aiScore;
    const comment = GRADE_COMMENTS[res.grade][Math.floor(Math.random() * 3)];
    sfx.grade(res.grade);
    if (res.grade === 'S' || res.grade === 'A' || (this.mode === 'ai' && won)) fx.confetti();
    this.el.innerHTML = `
      <div class="screen-center">
        <div style="font-size:4.5rem; font-weight:900; color:var(--accent)">${this.mode === 'party' ? '끝!' : res.grade}</div>
        ${this.mode === 'party' ? '' : `<p class="caption" style="font-size:1.1rem">"${comment}"</p>`}
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
