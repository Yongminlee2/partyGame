// localStorage 안전 래퍼. 시크릿 모드 등 저장 불가 환경에서도 게임은 계속 돌게 한다.
const PREFIX = 'partygame.';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시 (기록만 안 남을 뿐 게임은 정상)
  }
}
