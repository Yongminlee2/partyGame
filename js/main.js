import { initRouter, go } from './core/router.js';
import { unlockAudio } from './core/sound.js';
import idiom from './games/idiom.js';
import balance from './games/balance.js';
import truth from './games/truth.js';
import baseball from './games/baseball.js';
import celeb from './games/celeb.js';
import charades from './games/charades.js';
import bomb from './games/bomb.js';
import liar from './games/liar.js';
import roulette from './games/roulette.js';
import photoquiz from './games/photoquiz.js';

// 게임 모듈은 태스크 진행하며 하나씩 등록한다.
const GAMES = [
  { id: 'celeb', title: '연예인 퀴즈', emoji: '⭐', desc: '초성·사진 스피드 퀴즈' },
  { id: 'idiom', title: '사자성어', emoji: '📜', desc: '15초 스피드 퀴즈' },
  { id: 'balance', title: '밸런스 게임', emoji: '⚖️', desc: '둘 중 하나만!' },
  { id: 'truth', title: '진실게임', emoji: '🎯', desc: '셋! 하면 동시 지목' },
  { id: 'charades', title: '몸으로 말해요', emoji: '🙆', desc: '이마에 대고 맞추기' },
  { id: 'bomb', title: '폭탄 초성게임', emoji: '💣', desc: '초성 단어 이어말하기' },
  { id: 'liar', title: '라이어 게임', emoji: '🤥', desc: '라이어를 찾아라' },
  { id: 'baseball', title: '숫자야구', emoji: '⚾', desc: '3자리 숫자 추리' },
  { id: 'roulette', title: '복불복 룰렛', emoji: '🎡', desc: '벌칙·순서·카드뽑기' },
  { id: 'photoquiz', title: '사진 퀴즈 만들기', emoji: '📷', desc: '내 사진으로 출제' },
];

const home = {
  mount(el) {
    el.innerHTML = `
      <header class="home-header">
        <h1>🎉 모여라 게임판</h1>
        <p>예능에서 보던 그 게임, 혼자서도 다같이도</p>
      </header>
      <div class="game-grid">
        ${GAMES.map(g => `
          <button class="game-card" data-id="${g.id}">
            <span class="game-emoji">${g.emoji}</span>
            <span class="game-title">${g.title}</span>
            <span class="game-desc">${g.desc}</span>
          </button>`).join('')}
      </div>
      <footer class="home-footer">
        <a href="#/about">ⓘ 정보·출처</a>
      </footer>`;
    el.querySelectorAll('.game-card').forEach(btn =>
      btn.addEventListener('click', () => go(btn.dataset.id)));
  },
};

const placeholder = (title) => ({
  mount(el) {
    el.innerHTML = `
      <div class="screen-center">
        <h2>${title}</h2>
        <p>준비 중입니다</p>
        <button class="btn" onclick="location.hash=''">← 홈으로</button>
      </div>`;
  },
});

const about = {
  mount(el) {
    el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>ⓘ 정보·출처</h2></div>
      <div class="card-panel" style="margin-bottom:12px">
        <b>🎉 모여라 게임판</b>
        <p style="color:var(--fg-dim); margin-top:6px">예능 단골 게임 7종. 서버·계정·광고 없음.</p>
      </div>
      <div class="card-panel" style="margin-bottom:12px">
        <b>데이터 출처</b>
        <p style="color:var(--fg-dim); margin-top:6px; line-height:1.7">
          · 사자성어·제시어·라이어 설명: 직접 제작<br>
          · 연예인 정보: 이름·직업 등 사실 정보만 수록<br>
          · 연예인 사진: 앱에 저장하지 않고 위키피디아에서
            실시간으로 불러오며 출처를 표기합니다<br>
          · 단어 사전: 퍼블릭 도메인(CC0) 한국어 단어 목록<br>
          · 효과음: 코드로 합성 (음원 파일 없음)</p>
      </div>
      <div class="card-panel" style="margin-bottom:12px">
        <b>개인정보</b>
        <p style="color:var(--fg-dim); margin-top:6px">
          수집하는 정보가 없습니다. 기록은 이 기기에만 저장됩니다.<br>
          <a href="privacy.html" style="color:var(--accent)">개인정보처리방침 보기</a></p>
      </div>
      <div class="card-panel">
        <b>오픈소스</b>
        <p style="color:var(--fg-dim); margin-top:6px">
          <a href="https://github.com/Yongminlee2/partyGame" style="color:var(--accent)">github.com/Yongminlee2/partyGame</a></p>
      </div>`;
  },
};

const routes = { home, about };
for (const g of GAMES) routes[g.id] = placeholder(g.title);
routes.about = about;

// 구현된 게임 모듈 등록 (placeholder 덮어쓰기)
for (const game of [idiom, celeb, charades, bomb, liar, roulette, photoquiz, balance, truth, baseball]) routes[game.id] = game;

unlockAudio();
initRouter(routes);
