// 한글 초성 유틸. 완성형(가~힣)을 유니코드 분해해서 초성을 뽑는다.
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const BASE = 0xAC00;
const LAST = 0xD7A3;

export function choseong(str) {
  let out = '';
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code >= BASE && code <= LAST) {
      out += CHO[Math.floor((code - BASE) / 588)];
    } else {
      out += ch;
    }
  }
  return out;
}

export function isHangulWord(str) {
  if (!str) return false;
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (code < BASE || code > LAST) return false;
  }
  return true;
}
