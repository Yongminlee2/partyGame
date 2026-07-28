// tools/src/celebs-*.json ([name, cat, h1, h2, h3, wiki?] 튜플) → web/data/celebs.json
// cho는 이름에서 자동 계산해 오타를 원천 차단한다. wiki 생략 시 이름 그대로.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { choseong } from '../web/js/core/hangul.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'tools', 'src');

const seen = new Set();
const out = [];
for (const f of readdirSync(SRC).filter(f => f.startsWith('celebs-')).sort()) {
  for (const [name, cat, h1, h2, h3, wiki] of JSON.parse(readFileSync(join(SRC, f), 'utf8'))) {
    if (seen.has(name)) { console.warn(`중복 건너뜀: ${name} (${f})`); continue; }
    seen.add(name);
    out.push({ name, cho: choseong(name), hints: [h1, h2, h3], wiki: wiki || name, cat });
  }
}
writeFileSync(join(ROOT, 'web', 'data', 'celebs.json'), JSON.stringify(out));
const by = c => out.filter(x => x.cat === c).length;
console.log(`연예인 ${out.length}명 (가수 ${by('가수')} / 배우 ${by('배우')} / 예능인 ${by('예능인')} / 운동선수 ${by('운동선수')})`);
