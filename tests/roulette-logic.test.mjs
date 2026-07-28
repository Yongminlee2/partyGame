import test from 'node:test';
import assert from 'node:assert/strict';
import { winnerAt } from '../web/js/games/roulette.js';

// 포인터는 12시 방향 고정. 룰렛이 시계방향으로 angle(라디안)만큼 돌았을 때 당첨 칸.

test('회전 0이면 0번 칸', () => {
  assert.equal(winnerAt(0, 4), 0);
});

test('한 칸만큼 돌면 마지막 칸이 포인터 아래로 온다', () => {
  const slice = (Math.PI * 2) / 4;
  assert.equal(winnerAt(slice * 0.5, 4), 3);
  assert.equal(winnerAt(slice * 1.5, 4), 2);
});

test('한 바퀴 돌면 다시 0번', () => {
  assert.equal(winnerAt(Math.PI * 2, 4), 0);
  assert.equal(winnerAt(Math.PI * 4 + 0.01, 4), 3);
});

test('여러 칸 수에서 범위 안 인덱스', () => {
  for (let n = 2; n <= 12; n++) {
    for (let a = 0; a < 20; a++) {
      const idx = winnerAt(Math.random() * 100, n);
      assert.ok(idx >= 0 && idx < n);
    }
  }
});
