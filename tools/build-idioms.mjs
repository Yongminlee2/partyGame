// tools/src/idioms-*.json ([word, meaning, level] 튜플) → web/data/idioms.json
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'tools', 'src');

const seen = new Set();
const out = [];
for (const f of readdirSync(SRC).filter(f => f.startsWith('idioms-')).sort()) {
  for (const [word, meaning, level] of JSON.parse(readFileSync(join(SRC, f), 'utf8'))) {
    if (seen.has(word)) { console.warn(`중복 건너뜀: ${word} (${f})`); continue; }
    seen.add(word);
    out.push({ word, front: word.slice(0, 2), back: word.slice(2), meaning, level });
  }
}
writeFileSync(join(ROOT, 'web', 'data', 'idioms.json'), JSON.stringify(out));
const by = l => out.filter(i => i.level === l).length;
console.log(`사자성어 ${out.length}개 (쉬움 ${by(1)} / 보통 ${by(2)} / 어려움 ${by(3)})`);
