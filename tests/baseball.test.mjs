import test from 'node:test';
import assert from 'node:assert/strict';
import { judge, validGuess, createSolver, randomSecret } from '../web/js/games/baseball.js';

test('판정: 3S 완승', () => {
  assert.deepEqual(judge('123', '123'), { s: 3, b: 0 });
});

test('판정: 자리 다르면 B', () => {
  assert.deepEqual(judge('123', '321'), { s: 1, b: 2 });
  assert.deepEqual(judge('456', '645'), { s: 0, b: 3 });
});

test('판정: 아웃', () => {
  assert.deepEqual(judge('123', '456'), { s: 0, b: 0 });
});

test('입력 검증: 3자리·중복 금지·숫자만', () => {
  assert.equal(validGuess('123'), true);
  assert.equal(validGuess('112'), false);
  assert.equal(validGuess('12'), false);
  assert.equal(validGuess('12a'), false);
});

test('비밀번호 생성: 항상 유효', () => {
  for (let i = 0; i < 100; i++) assert.equal(validGuess(randomSecret()), true);
});

test('AI 솔버: 판정 결과와 모순되지 않는 추리만 낸다', () => {
  for (let trial = 0; trial < 20; trial++) {
    const secret = randomSecret();
    const solver = createSolver(3); // 실수 없음 난이도
    const seen = [];
    for (let turn = 0; turn < 10; turn++) {
      const g = solver.nextGuess();
      assert.equal(validGuess(g), true);
      const r = judge(g, secret);
      seen.push([g, r]);
      if (r.s === 3) break;
      solver.feed(g, r);
      // 다음 추리가 정답이라고 가정했을 때 과거 판정이 전부 재현돼야 함 (소거법 일관성)
      const ng = solver.nextGuess();
      for (const [pg, pr] of seen) {
        assert.deepEqual(judge(pg, ng), pr, `추리 ${ng}가 과거 판정과 모순`);
      }
    }
    // 10턴 내 항상 정답 도달 (소거법이면 평균 5~6턴)
    assert.ok(seen.some(([g]) => judge(g, secret).s === 3), `${secret} 못 맞힘`);
  }
});
