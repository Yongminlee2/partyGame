import test from 'node:test';
import assert from 'node:assert/strict';
import { makeChoices } from '../web/js/games/idiom.js';

const pool = [
  { word: '결자해지', front: '결자', back: '해지' },
  { word: '결초보은', front: '결초', back: '보은' },
  { word: '고진감래', front: '고진', back: '감래' },
  { word: '과유불급', front: '과유', back: '불급' },
  { word: '괄목상대', front: '괄목', back: '상대' },
];

test('정답 포함 4개 보기, 모두 유일', () => {
  const item = pool[0];
  const choices = makeChoices(item, pool, 4);
  assert.equal(choices.length, 4);
  assert.ok(choices.includes('해지'));
  assert.equal(new Set(choices).size, 4);
});

test('풀이 부족하면 가능한 만큼만 (에러 없이)', () => {
  const small = pool.slice(0, 2);
  const choices = makeChoices(small[0], small, 4);
  assert.ok(choices.includes('해지'));
  assert.equal(choices.length, 2);
});

test('보기에 정답과 같은 값이 중복으로 안 들어감', () => {
  const dupPool = pool.concat([{ word: '문제해지', front: '문제', back: '해지' }]);
  for (let i = 0; i < 20; i++) {
    const choices = makeChoices(pool[0], dupPool, 4);
    assert.equal(choices.filter(c => c === '해지').length, 1);
  }
});
