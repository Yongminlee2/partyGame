// canvas 사진 효과: 모자이크(점점 선명) / 블러.
// 실루엣은 직사각형 사진에서는 검은 상자가 되어 버려서 블러로 대체했다.

// 경과 시간에 따른 모자이크 레벨 (8=가장 거침 → 1=거의 원본), 순수 함수
export function mosaicLevelAt(elapsedMs, totalMs, maxLevel = 8) {
  const t = Math.min(1, Math.max(0, elapsedMs / totalMs));
  return Math.max(1, Math.round(maxLevel - t * (maxLevel - 1)));
}

// 이미지가 canvas를 꽉 채우도록 cover 방식으로 그린다
function drawCover(ctx, img, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

export function mosaic(img, canvas, level) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  if (level <= 1) {
    ctx.imageSmoothingEnabled = true;
    drawCover(ctx, img, w, h);
    return;
  }
  const blocks = Math.max(4, Math.round(48 / level)); // 8→6칸, 1→48칸
  const off = document.createElement('canvas');
  off.width = blocks;
  off.height = Math.round(blocks * (h / w));
  const octx = off.getContext('2d');
  drawCover(octx, img, off.width, off.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, w, h);
}

export function blur(img, canvas, level) {
  const ctx = canvas.getContext('2d');
  ctx.filter = level <= 1 ? 'none' : `blur(${level * 3}px)`;
  drawCover(ctx, img, canvas.width, canvas.height);
  ctx.filter = 'none';
}
