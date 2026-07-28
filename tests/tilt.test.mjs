import test from 'node:test';
import assert from 'node:assert/strict';
import { createTiltDetector } from '../web/js/games/charades.js';

// 세로로 이마에 댄 상태: beta≈90(중립). 앞으로 숙이면 beta↑(정답), 뒤로 젖히면 beta↓(패스).

test('중립에서 숙이면 ok 1회만 발동', () => {
  const d = createTiltDetector();
  assert.equal(d.update(90), null);   // 중립
  assert.equal(d.update(125), 'ok');  // 발동
  assert.equal(d.update(130), null);  // 유지 중 재발동 금지
  assert.equal(d.update(140), null);
});

test('중립 복귀 후에만 재발동 (히스테리시스)', () => {
  const d = createTiltDetector();
  d.update(90);
  assert.equal(d.update(125), 'ok');
  assert.equal(d.update(110), null);  // 아직 중립 아님
  assert.equal(d.update(90), null);   // 중립 복귀
  assert.equal(d.update(125), 'ok');  // 재발동 가능
});

test('뒤로 젖히면 pass', () => {
  const d = createTiltDetector();
  d.update(90);
  assert.equal(d.update(55), 'pass');
  assert.equal(d.update(50), null);
});

test('처음부터 기울어져 있으면 발동 안 함 (중립 거쳐야)', () => {
  const d = createTiltDetector();
  assert.equal(d.update(130), null);
  assert.equal(d.update(135), null);
  d.update(90);
  assert.equal(d.update(130), 'ok');
});
