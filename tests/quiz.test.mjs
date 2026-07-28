import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuiz, gradeOf } from '../web/js/core/quiz.js';

const items = [
  { answer: '해지', hints: ['ㅎㅈ', '푸는 것'] },
  { answer: '보은', hints: ['ㅂㅇ'] },
  { answer: '감래', hints: [] },
];

test('정답 점수 = 100 + 남은초×10', () => {
  const q = createQuiz({ items, rounds: 3 });
  const r = q.answer('해지', 8);
  assert.equal(r.correct, true);
  assert.equal(r.score, 180); // 100 + 80
  assert.equal(r.combo, 1);
});

test('남은 시간 없으면 기본 100', () => {
  const q = createQuiz({ items, rounds: 3 });
  assert.equal(q.answer('해지', 0).score, 100);
});

test('힌트당 -30, 바닥 10 보장', () => {
  const q = createQuiz({ items, rounds: 3 });
  q.revealHint(); q.revealHint();
  assert.equal(q.answer('해지', 0).score, 40); // 100-60
  q.next();
  const q2 = createQuiz({ items: [{ answer: 'x', hints: ['a','b','c','d'] }], rounds: 1 });
  q2.revealHint(); q2.revealHint(); q2.revealHint(); q2.revealHint();
  assert.equal(q2.answer('x', 0).score, 10);
});

test('콤보 배수: 2연속 ×1.2, 3연속 ×1.4', () => {
  const q = createQuiz({ items, rounds: 3 });
  assert.equal(q.answer('해지', 0).score, 100); // combo 1, ×1
  q.next();
  const r2 = q.answer('보은', 0);
  assert.equal(r2.combo, 2);
  assert.equal(r2.score, 120); // 100 × 1.2
  q.next();
  const r3 = q.answer('감래', 5);
  assert.equal(r3.combo, 3);
  assert.equal(r3.score, 210); // 150 × 1.4
});

test('패스하면 콤보 리셋', () => {
  const q = createQuiz({ items, rounds: 3 });
  q.answer('해지', 0);
  q.next();
  q.pass(); // 틀림
  q.next();
  const r = q.answer('감래', 0);
  assert.equal(r.combo, 1);
  assert.equal(r.score, 100);
});

test('결과에 maxCombo·grade 포함', () => {
  const q = createQuiz({ items, rounds: 3 });
  q.answer('해지', 15); q.next();
  q.answer('보은', 15); q.next();
  q.answer('감래', 15);
  const res = q.result();
  assert.equal(res.maxCombo, 3);
  assert.equal(res.correct, 3);
  assert.ok(['S', 'A'].includes(res.grade));
});

test('등급 경계: 만점비율 90/70/50/30', () => {
  // 만점 = rounds × 250
  assert.equal(gradeOf(225, 1), 'S');  // 90%
  assert.equal(gradeOf(224, 1), 'A');
  assert.equal(gradeOf(175, 1), 'A');  // 70%
  assert.equal(gradeOf(125, 1), 'B');  // 50%
  assert.equal(gradeOf(75, 1), 'C');   // 30%
  assert.equal(gradeOf(74, 1), 'D');
});

test('오답은 콤보 안 깨짐 (재도전 허용)', () => {
  const q = createQuiz({ items, rounds: 3 });
  q.answer('해지', 0); q.next();
  q.answer('틀림', 5);
  const r = q.answer('보은', 3);
  assert.equal(r.combo, 2);
});
