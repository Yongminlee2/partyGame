import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuiz } from '../web/js/core/quiz.js';

const items = [
  { answer: '해지', hints: ['ㅎㅈ', '푸는 것'] },
  { answer: '보은', hints: ['ㅂㅇ'] },
  { answer: '감래', hints: [] },
];

test('정답이면 correct=true, 기본 100점', () => {
  const q = createQuiz({ items, rounds: 3 });
  const r = q.answer('해지');
  assert.equal(r.correct, true);
  assert.equal(r.score, 100);
});

test('공백·대소문자 무시하고 비교', () => {
  const q = createQuiz({ items: [{ answer: 'ABC', hints: [] }], rounds: 1 });
  assert.equal(q.answer(' abc ').correct, true);
});

test('힌트 볼 때마다 30점 감점, 최소 10점', () => {
  const q = createQuiz({ items, rounds: 3 });
  assert.equal(q.revealHint(), 'ㅎㅈ');
  assert.equal(q.revealHint(), '푸는 것');
  assert.equal(q.revealHint(), null); // 더 없음
  const r = q.answer('해지');
  assert.equal(r.score, 40); // 100 - 30*2
});

test('감점이 커져도 최소 10점 보장', () => {
  const q = createQuiz({
    items: [{ answer: 'x', hints: ['a', 'b', 'c', 'd'] }],
    rounds: 1,
  });
  q.revealHint(); q.revealHint(); q.revealHint(); q.revealHint();
  assert.equal(q.answer('x').score, 10);
});

test('오답이면 correct=false, 점수 없음', () => {
  const q = createQuiz({ items, rounds: 3 });
  const r = q.answer('틀림');
  assert.equal(r.correct, false);
  assert.equal(r.score, 0);
});

test('라운드 진행과 최종 집계', () => {
  const q = createQuiz({ items, rounds: 2 });
  q.answer(items[0].answer);
  assert.equal(q.next(), true);   // 2라운드로
  q.answer('오답');
  q.pass();
  assert.equal(q.next(), false);  // 더 없음
  const res = q.result();
  assert.equal(res.total, 2);
  assert.equal(res.correct, 1);
  assert.equal(res.score, 100);
});

test('rounds가 items보다 크면 items 수만큼만', () => {
  const q = createQuiz({ items, rounds: 10 });
  let n = 1;
  while (q.next()) n++;
  assert.equal(n, 3);
});
