// data/*.json 로더 (1회 fetch 후 캐시)
const cache = {};

export async function loadData(name) {
  if (cache[name]) return cache[name];
  const res = await fetch(`data/${name}.json`);
  if (!res.ok) throw new Error(`${name} 로딩 실패`);
  cache[name] = await res.json();
  return cache[name];
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}
