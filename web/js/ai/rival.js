// AI 대전 상대. 서버·API 없이 확률 파라미터로만 동작한다.
// v2: 페르소나(얼굴·이름·대사)가 붙었다.
export const RIVAL_PARAMS = {
  1: { meanMs: 12000, pAnswer: 0.5, name: '느긋이', emoji: '🐢' },
  2: { meanMs: 8000, pAnswer: 0.7, name: '보통이', emoji: '🦊' },
  3: { meanMs: 5000, pAnswer: 0.9, name: '독종이', emoji: '😈' },
};

const TAUNTS = [
  'ㅋㅋ 내가 먼저~', '이것도 몰라?', '너무 쉬운데?', '아 이건 국룰이지',
  '손가락 풀고 있었어?', '한 수 배워가~', '척 보면 척이지', '음~ 개꿀',
  '다음 건 양보해줄게 ㅋ', '아직 멀었네~',
];
const WIN_LINES = ['짜식 좀 치네…', '한 판 더 해!', '방심했다 방심했어', '오늘만 봐준다'];
const LOSE_LINES = ['내가 이겼지롱~', '더 연습하고 와라', '상대가 안 되네 ㅋ', '다음엔 봐줄게'];

const MIN_DELAY = 1500;
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function createRival(level) {
  const p = RIVAL_PARAMS[level] || RIVAL_PARAMS[2];
  return {
    name: p.name,
    emoji: p.emoji,
    // 지수분포 샘플 (평균 meanMs), 최소 지연 보장
    answerDelayMs() {
      const u = Math.random();
      const raw = -Math.log(1 - u) * (p.meanMs - MIN_DELAY);
      return MIN_DELAY + raw;
    },
    willAnswer() {
      return Math.random() < p.pAnswer;
    },
    taunt() { return pickOne(TAUNTS); },       // AI가 먼저 맞혔을 때
    winLine() { return pickOne(WIN_LINES); },   // 유저가 최종 승리했을 때 AI 반응
    loseLine() { return pickOne(LOSE_LINES); }, // 유저가 최종 패배했을 때 AI 반응
  };
}
