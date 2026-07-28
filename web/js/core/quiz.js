// 퀴즈 라운드 상태머신 (DOM 없음, 순수).
// 점수: 기본 100, 힌트 볼 때마다 -30, 최소 10점.
const BASE = 100;
const HINT_COST = 30;
const MIN = 10;

function norm(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, '');
}

export function createQuiz({ items, rounds }) {
  const list = items.slice(0, Math.min(rounds, items.length));
  let idx = 0;
  let hintsUsed = 0;
  let score = 0;
  let correct = 0;
  const history = [];

  return {
    current() { return list[idx]; },
    round() { return idx + 1; },
    total() { return list.length; },

    revealHint() {
      const hints = list[idx].hints || [];
      if (hintsUsed >= hints.length) return null;
      return hints[hintsUsed++];
    },
    hintsUsed() { return hintsUsed; },

    answer(text) {
      const ok = norm(text) === norm(list[idx].answer);
      if (!ok) return { correct: false, score: 0 };
      const s = Math.max(MIN, BASE - HINT_COST * hintsUsed);
      score += s;
      correct++;
      history.push({ item: list[idx], correct: true, score: s });
      return { correct: true, score: s };
    },

    pass() {
      history.push({ item: list[idx], correct: false, score: 0 });
    },

    next() {
      if (idx + 1 >= list.length) return false;
      idx++;
      hintsUsed = 0;
      return true;
    },

    result() {
      return { score, correct, total: list.length, history };
    },
  };
}
