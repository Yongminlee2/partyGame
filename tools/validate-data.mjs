// 데이터 파일 스키마·중복·초성 일치 검증. CI와 로컬에서 실행: node tools/validate-data.mjs
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { choseong, isHangulWord } from '../web/js/core/hangul.js';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'web', 'data');
const errors = [];

function check(cond, msg) {
  if (!cond) errors.push(msg);
}

function loadIfExists(name) {
  const p = join(DATA, name);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

// ---- idioms.json ----
const idioms = loadIfExists('idioms.json');
if (idioms) {
  check(Array.isArray(idioms) && idioms.length >= 400, `idioms: 400개 이상 필요 (현재 ${idioms?.length})`);
  const seen = new Set();
  for (const it of idioms) {
    const tag = `idioms[${it.word}]`;
    check(typeof it.word === 'string' && it.word.length === 4, `${tag}: 4글자 아님`);
    check(it.front + it.back === it.word, `${tag}: front+back != word`);
    check(isHangulWord(it.word), `${tag}: 한글 아님`);
    check(typeof it.meaning === 'string' && it.meaning.length >= 10, `${tag}: meaning 10자 미만`);
    check([1, 2, 3].includes(it.level), `${tag}: level 1~3 아님`);
    check(!seen.has(it.word), `${tag}: 중복`);
    seen.add(it.word);
  }
}

// ---- celebs.json ----
const celebs = loadIfExists('celebs.json');
if (celebs) {
  check(Array.isArray(celebs) && celebs.length >= 300, `celebs: 300명 이상 필요 (현재 ${celebs?.length})`);
  const seen = new Set();
  const CATS = ['가수', '배우', '예능인', '운동선수'];
  for (const c of celebs) {
    const tag = `celebs[${c.name}]`;
    check(typeof c.name === 'string' && c.name.length >= 2, `${tag}: 이름 이상`);
    check(c.cho === choseong(c.name), `${tag}: cho 불일치 (기대 ${choseong(c.name)}, 실제 ${c.cho})`);
    check(Array.isArray(c.hints) && c.hints.length === 3, `${tag}: 힌트 3개 아님`);
    check(typeof c.wiki === 'string' && c.wiki.length > 0, `${tag}: wiki 제목 없음`);
    check(CATS.includes(c.cat), `${tag}: cat 이상 (${c.cat})`);
    check(!seen.has(c.name), `${tag}: 중복`);
    seen.add(c.name);
  }
}

// ---- charades.json ----
const charades = loadIfExists('charades.json');
if (charades) {
  for (const [cat, words] of Object.entries(charades)) {
    check(Array.isArray(words) && words.length >= 100, `charades[${cat}]: 100개 이상 필요 (현재 ${words?.length})`);
    const seen = new Set();
    for (const w of words) {
      check(typeof w === 'string' && w.length >= 1, `charades[${cat}][${w}]: 이상한 항목`);
      check(!seen.has(w), `charades[${cat}][${w}]: 중복`);
      seen.add(w);
    }
  }
}

// ---- liar.json ----
const liar = loadIfExists('liar.json');
if (liar) {
  check(Array.isArray(liar) && liar.length >= 100, `liar: 100세트 이상 필요 (현재 ${liar?.length})`);
  const seen = new Set();
  for (const s of liar) {
    const tag = `liar[${s.word}]`;
    check(typeof s.word === 'string' && s.word.length >= 1, `${tag}: word 이상`);
    check(typeof s.category === 'string', `${tag}: category 없음`);
    check(Array.isArray(s.normal) && s.normal.length >= 4, `${tag}: normal 4개 미만`);
    check(Array.isArray(s.liar) && s.liar.length >= 2, `${tag}: liar 2개 미만`);
    check(!seen.has(s.word), `${tag}: 중복`);
    seen.add(s.word);
  }
}

// ---- choseong-dict.json ----
const dict = loadIfExists('choseong-dict.json');
if (dict) {
  for (const [cho, words] of Object.entries(dict)) {
    check(cho.length === 2, `dict[${cho}]: 초성쌍이 2글자 아님`);
    check(Array.isArray(words) && words.length >= 30, `dict[${cho}]: 30단어 미만 (${words?.length})`);
    for (const w of words.slice(0, 5)) {
      check(choseong(w) === cho, `dict[${cho}][${w}]: 초성 불일치`);
    }
  }
}

if (errors.length) {
  console.error(`검증 실패 ${errors.length}건:`);
  for (const e of errors.slice(0, 30)) console.error(' - ' + e);
  if (errors.length > 30) console.error(` ... 외 ${errors.length - 30}건`);
  process.exit(1);
}
console.log('데이터 검증 통과');
