import test from 'node:test';
import assert from 'node:assert/strict';
import { groupByChoseongPair } from '../tools/build-choseong-dict.mjs';

test('2글자 완성형 한글만 초성쌍으로 그룹핑', () => {
  const map = groupByChoseongPair(['가수', '감사', '노래방', 'ㄱㅅ', 'ab', '나비', '가수']);
  assert.deepEqual([...map['ㄱㅅ']].sort(), ['가수', '감사']);
  assert.deepEqual([...map['ㄴㅂ']], ['나비']);
  assert.equal(map['ㄴㄹㅂ'], undefined); // 3글자 제외
});

test('공백·빈 줄 무시', () => {
  const map = groupByChoseongPair(['', '  ', ' 가수 ']);
  assert.deepEqual([...map['ㄱㅅ']], ['가수']);
});
