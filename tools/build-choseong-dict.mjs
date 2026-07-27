// WordChain 사전(CC0) → 초성쌍 사전 변환.
// 출력: web/data/choseong-dict.json  { "ㄱㅅ": { "w": [전체 2글자 단어...], "c": [흔한 단어...] } }
//  - w: 입력 검증용 (dict_all 기반)
//  - c: AI 응수·문제 출제용 (dict_common 기반)
// 채택 기준: c가 5단어 이상 && w가 30단어 이상인 초성쌍만.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { choseong, isHangulWord } from '../web/js/core/hangul.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WC = 'C:/workAndroid/WordChain/app/src/main/assets';

export function groupByChoseongPair(words) {
  const map = {};
  for (const raw of words) {
    const w = raw.trim();
    if (w.length !== 2 || !isHangulWord(w)) continue;
    const cho = choseong(w);
    (map[cho] ??= new Set()).add(w);
  }
  return map;
}

function readWords(file) {
  return readFileSync(join(WC, file), 'utf8').split(/\r?\n/);
}

// 직접 실행 시에만 파일 생성 (테스트에서 import할 땐 실행 안 함)
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const all = groupByChoseongPair(readWords('dict_all.txt'));
  const common = groupByChoseongPair(readWords('dict_common.txt'));

  const out = {};
  for (const [cho, commonSet] of Object.entries(common)) {
    const allSet = all[cho] ?? new Set();
    for (const w of commonSet) allSet.add(w); // common 단어는 무조건 검증 통과
    if (commonSet.size >= 5 && allSet.size >= 30) {
      out[cho] = { w: [...allSet].sort(), c: [...commonSet].sort() };
    }
  }

  const path = join(ROOT, 'web', 'data', 'choseong-dict.json');
  writeFileSync(path, JSON.stringify(out));
  const pairs = Object.keys(out).length;
  const total = Object.values(out).reduce((s, v) => s + v.w.length, 0);
  console.log(`초성쌍 ${pairs}개, 검증 단어 ${total}개 → ${path}`);
}
