// 복불복 룰렛: 이름·벌칙을 넣고 돌린다.
import { sfx } from '../core/sound.js';
import { load, save } from '../core/store.js';

const PRESETS = [
  '코 만지고 노래 부르기', '애교 3종 세트', '옆 사람 어깨 안마 1분', '물 한 컵 원샷',
  '성대모사 하나', '10초 막춤', '삼행시 짓기', '윙크 날리기', '개인기 보여주기',
  '한 곡 열창', '팔굽혀펴기 10개', '오늘 커피 쏘기', '다음 판 벌칙 2배', '통과 (행운!)',
  '셀카 찍어서 단톡방에 올리기',
];

// 포인터(12시)에 걸린 칸: 룰렛이 시계방향으로 angle만큼 돌았을 때
export function winnerAt(angle, n) {
  const TWO_PI = Math.PI * 2;
  const a = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
  return Math.floor(((TWO_PI - a) % TWO_PI) / (TWO_PI / n)) % n;
}

const COLORS = ['#ffd400', '#ff5e78', '#4cd964', '#5ac8fa', '#af52de', '#ff9500', '#34c7c0', '#ff6b6b'];
let raf = null;

export default {
  id: 'roulette', title: '복불복 룰렛', emoji: '🎡',

  mount(el) { this.el = el; this.setup(); },
  unmount() { if (raf) cancelAnimationFrame(raf); },

  setup() {
    const saved = load('roulette.items', null);
    const items = saved || ['1번', '2번', '3번', '4번'];
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" onclick="location.hash=''">←</button><h2>🎡 복불복 룰렛</h2></div>
      <p style="color:var(--fg-dim); padding-bottom:8px">이름이나 벌칙을 한 줄에 하나씩 (2~8개)</p>
      <textarea id="items" rows="6" style="width:100%; font-family:inherit; font-size:1rem; background:var(--bg-card); color:var(--fg); border:2px solid var(--bg-card-hover); border-radius:12px; padding:12px; resize:none">${items.join('\n')}</textarea>
      <div class="btn-row" style="padding:14px 0">
        <button class="btn" id="go">룰렛 만들기</button>
        <button class="btn secondary small" id="preset">🎲 랜덤 벌칙 채우기</button>
      </div>`;
    this.el.querySelector('#preset').addEventListener('click', () => {
      const shuffled = PRESETS.slice().sort(() => Math.random() - 0.5).slice(0, 6);
      this.el.querySelector('#items').value = shuffled.join('\n');
    });
    this.el.querySelector('#go').addEventListener('click', () => {
      const list = this.el.querySelector('#items').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 8);
      if (list.length < 2) return;
      save('roulette.items', list);
      this.wheel(list);
    });
  },

  wheel(items) {
    this.el.innerHTML = `
      <div class="top-bar"><button class="back-btn" id="back">←</button><h2>🎡 돌려돌려!</h2></div>
      <div class="screen-center" style="gap:4px">
        <div style="font-size:2rem">🔻</div>
        <canvas id="wheel" width="320" height="320" style="max-width:85vw"></canvas>
        <p id="result" class="caption" style="font-size:1.3rem; min-height:1.6em"></p>
        <button class="btn" id="spin">돌리기!</button>
      </div>`;
    this.el.querySelector('#back').addEventListener('click', () => this.setup());

    const canvas = this.el.querySelector('#wheel');
    const ctx = canvas.getContext('2d');
    const n = items.length;
    let angle = 0;

    const draw = () => {
      const c = 160, r = 155;
      ctx.clearRect(0, 0, 320, 320);
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(angle);
      const slice = (Math.PI * 2) / n;
      for (let i = 0; i < n; i++) {
        // 0번 칸이 12시부터 시계방향으로 시작
        const start = -Math.PI / 2 + i * slice;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, start, start + slice);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fill();
        ctx.save();
        ctx.rotate(start + slice / 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'right';
        const label = items[i].length > 8 ? items[i].slice(0, 8) + '…' : items[i];
        ctx.fillText(label, r - 12, 5);
        ctx.restore();
      }
      ctx.restore();
    };
    draw();

    let spinning = false;
    this.el.querySelector('#spin').addEventListener('click', () => {
      if (spinning) return;
      spinning = true;
      this.el.querySelector('#result').textContent = '';
      const duration = 4000 + Math.random() * 2000;
      const target = angle + Math.PI * 2 * (4 + Math.random() * 3); // 4~7바퀴
      const from = angle;
      const t0 = performance.now();
      let lastTick = 0;
      const finish = () => {
        if (!spinning) return;
        spinning = false;
        angle = target;
        draw();
        const idx = winnerAt(angle, n);
        sfx.fanfare();
        const r = this.el.querySelector('#result');
        if (r) r.textContent = `🎉 ${items[idx]}!`;
      };
      const step = (now) => {
        if (!spinning) return;
        const t = Math.min(1, (now - t0) / duration);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
        angle = from + (target - from) * ease;
        draw();
        if (now - lastTick > 120 && t < 0.9) { sfx.spin(); lastTick = now; }
        if (t < 1) raf = requestAnimationFrame(step);
        else finish();
      };
      raf = requestAnimationFrame(step);
      // 탭이 백그라운드로 가서 rAF가 멈춰도 결과는 반드시 나온다
      setTimeout(finish, duration + 150);
    });
  },
};
