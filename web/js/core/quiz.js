// 퀴즈 라운드 상태머신 (DOM 없음, 순수).
// v2 점수: 정답 = (100 + 남은초×10 - 힌트×30, 바닥 10) × 콤보배수(1 + 0.2×(연속-1))
const BASE = 100;
const TIME_BONUS = 10;
const HINT_COST = 30;
const MIN = 10;
const MAX_PER_ROUND = BASE + 15 * TIME_BONUS; // 등급 산정용 만점(콤보 제외)

function norm(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, '');
}

export function gradeOf(score, rounds) {
  const ratio = score / (rounds * MAX_PER_ROUND);
  if (ratio >= 0.9) return 'S';
  if (ratio >= 0.7) return 'A';
  if (ratio >= 0.5) return 'B';
  if (ratio >= 0.3) return 'C';
  return 'D';
}

export function createQuiz({ items, rounds }) {
  const list = items.slice(0, Math.min(rounds, items.length));
  let idx = 0;
  let hintsUsed = 0;
  let score = 0;
  let correct = 0;
  let combo = 0;
  let maxCombo = 0;
  const history = [];

  return {
    current() { return list[idx]; },
    round() { return idx + 1; },
    total() { return list.length; },
    combo() { return combo; },

    revealHint() {
      const hints = list[idx].hints || [];
      if (hintsUsed >= hints.length) return null;
      return hints[hintsUsed++];
    },
    hintsUsed() { return hintsUsed; },

    answer(text, remainSec = 0) {
      const ok = norm(text) === norm(list[idx].answer);
      if (!ok) return { correct: false, score: 0, combo };
      combo++;
      maxCombo = Math.max(maxCombo, combo);
      const base = Math.max(MIN, BASE + Math.floor(remainSec) * TIME_BONUS - HINT_COST * hintsUsed);
      const mult = 1 + 0.2 * (combo - 1);
      const s = Math.round(base * mult);
      score += s;
      correct++;
      history.push({ item: list[idx], correct: true, score: s });
      return { correct: true, score: s, combo };
    },

    pass() {
      combo = 0;
      history.push({ item: list[idx], correct: false, score: 0 });
    },

    next() {
      if (idx + 1 >= list.length) return false;
      idx++;
      hintsUsed = 0;
      return true;
    },

    result() {
      return { score, correct, total: list.length, maxCombo, grade: gradeOf(score, list.length), history };
    },
  };
}
