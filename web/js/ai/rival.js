// AI 대전 상대. 서버·API 없이 확률 파라미터로만 동작한다.
// meanMs: 평균 응답 시간(지수분포), pAnswer: 라운드당 정답 확률.
export const RIVAL_PARAMS = {
  1: { meanMs: 12000, pAnswer: 0.5, name: '느긋한 AI' },
  2: { meanMs: 8000, pAnswer: 0.7, name: '보통 AI' },
  3: { meanMs: 5000, pAnswer: 0.9, name: '독한 AI' },
};

const MIN_DELAY = 1500;

export function createRival(level) {
  const p = RIVAL_PARAMS[level] || RIVAL_PARAMS[2];
  return {
    name: p.name,
    // 지수분포 샘플 (평균 meanMs), 최소 지연 보장
    answerDelayMs() {
      const u = Math.random();
      const raw = -Math.log(1 - u) * (p.meanMs - MIN_DELAY);
      return MIN_DELAY + raw;
    },
    willAnswer() {
      return Math.random() < p.pAnswer;
    },
  };
}
