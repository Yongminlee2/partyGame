import { initRouter, go } from './core/router.js';
import { unlockAudio } from './core/sound.js';
import idiom from './games/idiom.js';
import celeb from './games/celeb.js';
import charades from './games/charades.js';
import bomb from './games/bomb.js';
import liar from './games/liar.js';
import roulette from './games/roulette.js';
import photoquiz from './games/photoquiz.js';

// 게임 모듈은 태스크 진행하며 하나씩 등록한다.
const GAMES = [
  { id: 'celeb', title: '연예인 퀴즈', emoji: '⭐', desc: '초성·사진으로 맞추기' },
  { id: 'idiom', title: '사자성어', emoji: '📜', desc: '뒷 두 글자 맞추기' },
  { id: 'charades', title: '몸으로 말해요', emoji: '🙆', desc: '이마에 대고 맞추기' },
  { id: 'bomb', title: '폭탄 초성게임', emoji: '💣', desc: '초성 단어 이어말하기' },
  { id: 'liar', title: '라이어 게임', emoji: '🤥', desc: '라이어를 찾아라' },
  { id: 'roulette', title: '복불복 룰렛', emoji: '🎡', desc: '벌칙·순서 정하기' },
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

const routes = { home };
for (const g of GAMES) routes[g.id] = placeholder(g.title);
routes.about = placeholder('정보·출처');

// 구현된 게임 모듈 등록 (placeholder 덮어쓰기)
for (const game of [idiom, celeb, charades, bomb, liar, roulette, photoquiz]) routes[game.id] = game;

unlockAudio();
initRouter(routes);
