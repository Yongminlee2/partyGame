import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHash } from '../web/js/core/router.js';

test('빈 해시는 home', () => {
  assert.deepEqual(parseHash(''), { page: 'home', params: {} });
  assert.deepEqual(parseHash('#'), { page: 'home', params: {} });
  assert.deepEqual(parseHash('#/'), { page: 'home', params: {} });
});

test('게임 페이지 해시', () => {
  assert.deepEqual(parseHash('#/idiom'), { page: 'idiom', params: {} });
});

test('쿼리 파라미터 파싱', () => {
  assert.deepEqual(parseHash('#/idiom?mode=solo&level=2'), {
    page: 'idiom',
    params: { mode: 'solo', level: '2' },
  });
});

test('한글 파라미터 디코딩', () => {
  assert.deepEqual(parseHash('#/charades?cat=%EB%8F%99%EB%AC%BC'), {
    page: 'charades',
    params: { cat: '동물' },
  });
});
