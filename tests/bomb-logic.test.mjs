import test from 'node:test';
import assert from 'node:assert/strict';
import { checkWord, pickAiWord } from '../web/js/games/bomb.js';

const entry = { w: ['가수', '감사', '개시', '공사', '기사'], c: ['가수', '감사'] };

test('사전에 있고 초성 맞으면 ok', () => {
  assert.equal(checkWord('가수', 'ㄱㅅ', new Set(), entry), 'ok');
});

test('초성이 다르면 wrong-cho', () => {
  assert.equal(checkWord('나비', 'ㄱㅅ', new Set(), entry), 'wrong-cho');
});

test('사전에 없으면 not-word', () => {
  assert.equal(checkWord('갓수', 'ㄱㅅ', new Set(), entry), 'not-word');
});

test('이미 나온 단어면 dup', () => {
  assert.equal(checkWord('가수', 'ㄱㅅ', new Set(['가수']), entry), 'dup');
});

test('AI는 안 나온 단어를 골라 준다', () => {
  const used = new Set(['가수']);
  for (let i = 0; i < 50; i++) {
    const w = pickAiWord('ㄱㅅ', used, entry, 3);
    assert.ok(w === null || (!used.has(w) && entry.c.includes(w)));
  }
});

test('남은 단어가 없으면 null (포기)', () => {
  const used = new Set(entry.c);
  assert.equal(pickAiWord('ㄱㅅ', used, entry, 3), null);
});
