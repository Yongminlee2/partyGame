import test from 'node:test';
import assert from 'node:assert/strict';
import { choseong, isHangulWord } from '../web/js/core/hangul.js';

test('초성 추출: 기본', () => {
  assert.equal(choseong('김수현'), 'ㄱㅅㅎ');
  assert.equal(choseong('아이유'), 'ㅇㅇㅇ');
});

test('초성 추출: 된소리·받침 복잡한 글자', () => {
  assert.equal(choseong('뽀로로'), 'ㅃㄹㄹ');
  assert.equal(choseong('닭볶음탕'), 'ㄷㅂㅇㅌ');
});

test('초성 추출: 비한글은 그대로', () => {
  assert.equal(choseong('BTS 정국'), 'BTS ㅈㄱ');
  assert.equal(choseong(''), '');
});

test('완성형 한글 판정', () => {
  assert.equal(isHangulWord('가수'), true);
  assert.equal(isHangulWord('가수2'), false);
  assert.equal(isHangulWord('ㄱㅅ'), false);
  assert.equal(isHangulWord(''), false);
});
