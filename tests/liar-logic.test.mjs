import test from 'node:test';
import assert from 'node:assert/strict';
import { assignRoles, buildSoloRound } from '../web/js/games/liar.js';

test('라이어는 정확히 1명, 인원 범위 안', () => {
  for (let n = 3; n <= 10; n++) {
    for (let i = 0; i < 30; i++) {
      const { liarIndex } = assignRoles(n);
      assert.ok(liarIndex >= 0 && liarIndex < n);
    }
  }
});

test('라이어 위치가 고르게 분포 (모든 위치 등장)', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) seen.add(assignRoles(4).liarIndex);
  assert.equal(seen.size, 4);
});

const set = {
  word: '수영장', category: '장소',
  normal: ['물이 있어요', '여름에 가요', '수영복이 필요해요', '락커룸이 있어요'],
  liar: ['모래가 많아요', '파도가 쳐요'],
};

test('솔로 라운드: AI 4명 중 라이어 1명, liarIndex 일치', () => {
  for (let i = 0; i < 50; i++) {
    const r = buildSoloRound(set, 4);
    assert.equal(r.statements.length, 4);
    assert.equal(r.statements.filter(s => s.isLiar).length, 1);
    assert.equal(r.statements[r.liarIndex].isLiar, true);
    assert.ok(set.liar.includes(r.statements[r.liarIndex].text));
  }
});

test('정상 설명은 중복 없이 뽑힘', () => {
  const r = buildSoloRound(set, 4);
  const normals = r.statements.filter(s => !s.isLiar).map(s => s.text);
  assert.equal(new Set(normals).size, normals.length);
});
