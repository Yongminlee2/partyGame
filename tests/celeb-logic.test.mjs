import test from 'node:test';
import assert from 'node:assert/strict';
import { mosaicLevelAt } from '../web/js/core/photofx.js';

test('시작은 최대 레벨(가장 거침)', () => {
  assert.equal(mosaicLevelAt(0, 30000), 8);
});

test('시간이 다 되면 레벨 1(거의 원본)', () => {
  assert.equal(mosaicLevelAt(30000, 30000), 1);
  assert.equal(mosaicLevelAt(99999, 30000), 1);
});

test('중간 지점에서는 중간 레벨, 단조 감소', () => {
  let prev = 9;
  for (let t = 0; t <= 30000; t += 3000) {
    const lv = mosaicLevelAt(t, 30000);
    assert.ok(lv >= 1 && lv <= 8);
    assert.ok(lv <= prev, `t=${t}에서 증가함`);
    prev = lv;
  }
});
