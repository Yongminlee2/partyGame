// 사진 퀴즈 만들기: 내 갤러리 사진으로 모자이크 퀴즈 출제.
// 사진은 이 기기의 IndexedDB에만 저장된다 — 업로드·전송 없음. 삭제하면 바로 지워진다.
import { sfx } from '../core/sound.js';
import { shuffle } from '../core/data.js';
import { mosaic, mosaicLevelAt } from '../core/photofx.js';
import { allPhotos, addPhoto, updateAnswer, removePhoto } from '../core/photodb.js';

const REVEAL_TIME = 20000;
let timers = [];
function every(fn, ms) { const t = setInterval(fn, ms); timers.push(t); }
function clearTimers() { timers.forEach(clearInterval); timers = []; }

function loadImg(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export default {
  id: 'photoquiz', title: '사진 퀴즈 만들기', emoji: '📷',

  mount(el) { this.el = el; this.builder(); },
  unmount() { clearTimers(); },

  async builder() {
    clearTimers();
    this.el.innerHTML = '<div class="screen-center"><p>불러오는 중...</p></div>';

    // 저장된 사진 로딩 (기기 안 IndexedDB)
    const records = await allPhotos();
    this.items = records.map(r => {
      const url = URL.createObjectURL(r.blob);
      return { id: r.id, url, answer: r.answer || '' };
    });

    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>📷 사진 퀴즈</h2></div>
      <p style="color:var(--fg-dim); padding-bottom:10px; text-align:center">
        사진을 고르고 정답(이름)을 붙이면 모자이크 퀴즈가 돼요.<br>
        <b>사진은 이 기기에만 저장되고 밖으로 나가지 않아요.</b></p>
      <label class="btn secondary" style="display:block; text-align:center; margin-bottom:12px">
        ➕ 사진 추가 <input type="file" id="file" accept="image/*" multiple style="display:none">
      </label>
      <div id="list" style="display:flex; flex-direction:column; gap:10px"></div>
      <div class="btn-row" style="padding:16px 0">
        <button class="btn" id="play" ${this.items.length ? '' : 'disabled'}>퀴즈 시작 (${this.items.length}문제)</button>
      </div>`;

    const listEl = this.el.querySelector('#list');
    listEl.innerHTML = this.items.map((it, i) => `
      <div class="card-panel" style="display:flex; gap:10px; align-items:center">
        <img src="${it.url}" style="width:56px; height:56px; object-fit:cover; border-radius:8px">
        <input type="text" data-i="${i}" value="${it.answer.replace(/"/g, '&quot;')}" placeholder="정답 입력" style="flex:1">
        <button class="btn danger small" data-del="${i}">✕</button>
      </div>`).join('');
    listEl.querySelectorAll('[data-i]').forEach(inp =>
      inp.addEventListener('input', () => {
        const it = this.items[Number(inp.dataset.i)];
        it.answer = inp.value;
        updateAnswer(it.id, inp.value);
      }));
    listEl.querySelectorAll('[data-del]').forEach(b =>
      b.addEventListener('click', async () => {
        const it = this.items[Number(b.dataset.del)];
        await removePhoto(it.id);
        URL.revokeObjectURL(it.url);
        this.builder();
      }));

    this.el.querySelector('#file').addEventListener('change', async (e) => {
      for (const f of e.target.files) await addPhoto(f, '');
      this.builder();
    });

    this.el.querySelector('#play').addEventListener('click', async () => {
      if (!this.items.length) return;
      this.el.innerHTML = '<div class="screen-center"><p>준비 중...</p></div>';
      for (const it of this.items) {
        if (!it.img) { try { it.img = await loadImg(it.url); } catch { /* 깨진 사진은 건너뜀 */ } }
      }
      this.deck = shuffle(this.items.filter(it => it.img));
      this.idx = 0;
      this.playRound();
    });
  },

  playRound() {
    clearTimers();
    if (this.idx >= this.deck.length) return this.finish();
    const it = this.deck[this.idx];
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="quit">←</button><h2>${this.idx + 1} / ${this.deck.length}</h2></div>
      <div class="screen-center">
        <canvas id="pq" width="320" height="380" style="border-radius:12px; max-width:85vw"></canvas>
        <p style="color:var(--fg-dim)">점점 선명해져요! 먼저 외치는 사람이 승리</p>
        <div class="btn-row">
          <button class="btn" id="ok">⭕ 맞혔다!</button>
          <button class="btn secondary" id="skip">넘기기</button>
        </div>
      </div>`;
    this.el.querySelector('#quit').addEventListener('click', () => this.builder());

    const canvas = this.el.querySelector('#pq');
    const t0 = Date.now();
    const draw = () => mosaic(it.img, canvas, mosaicLevelAt(Date.now() - t0, REVEAL_TIME));
    draw();
    every(draw, 800);

    const reveal = (ok) => {
      clearTimers();
      if (ok) sfx.ok(); else sfx.bad();
      this.el.innerHTML = `
        <div class="screen-center">
          <div style="font-size:3rem">${ok ? '⭕' : '➡'}</div>
          <canvas id="full" width="320" height="380" style="border-radius:12px; max-width:85vw"></canvas>
          <div class="caption" style="font-size:1.5rem">${it.answer || '(정답 미입력)'}</div>
          <button class="btn" id="next">다음 →</button>
        </div>`;
      mosaic(it.img, this.el.querySelector('#full'), 1);
      this.el.querySelector('#next').addEventListener('click', () => { this.idx++; this.playRound(); });
    };
    this.el.querySelector('#ok').addEventListener('click', () => reveal(true));
    this.el.querySelector('#skip').addEventListener('click', () => reveal(false));
  },

  finish() {
    sfx.fanfare();
    this.el.innerHTML = `
      <div class="screen-center">
        <div class="caption">끝!</div>
        <p style="color:var(--fg-dim)">문제를 다 봤어요</p>
        <div class="btn-row">
          <button class="btn" id="again">다시 출제</button>
          <button class="btn secondary" onclick="location.hash=''">홈으로</button>
        </div>
      </div>`;
    this.el.querySelector('#again').addEventListener('click', () => this.builder());
  },
};
