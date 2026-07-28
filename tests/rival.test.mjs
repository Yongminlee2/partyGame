import test from 'node:test';
import assert from 'node:assert/strict';
import { createRival, RIVAL_PARAMS } from '../web/js/ai/rival.js';

test('난이도별 평균 응답시간이 파라미터 ±30% 안', () => {
  for (const level of [1, 2, 3]) {
    const r = createRival(level);
    let sum = 0;
    const N = 2000;
    for (let i = 0; i < N; i++) sum += r.answerDelayMs();
    const avg = sum / N;
    const target = RIVAL_PARAMS[level].meanMs;
    assert.ok(Math.abs(avg - target) < target * 0.3, `level${level}: avg=${avg}`);
  }
});

test('난이도 높을수록 정답률 높음 (단조성)', () => {
  const rate = (level) => {
    const r = createRival(level);
    let c = 0;
    for (let i = 0; i < 5000; i++) if (r.willAnswer()) c++;
    return c / 5000;
  };
  const r1 = rate(1), r2 = rate(2), r3 = rate(3);
  assert.ok(r1 < r2 && r2 < r3, `${r1} ${r2} ${r3}`);
});

test('응답시간은 최소 지연 이상', () => {
  const r = createRival(3);
  for (let i = 0; i < 500; i++) assert.ok(r.answerDelayMs() >= 1500);
});
