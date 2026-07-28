// 위키피디아 REST API로 인물 사진을 실시간 로딩한다.
// 사진 파일은 앱·저장소에 저장하지 않는다 (저작권·초상권 안전장치).
export async function fetchPortrait(title) {
  try {
    const res = await fetch(
      `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!res.ok) return null;
    const j = await res.json();
    const imgUrl = j.originalimage?.source || j.thumbnail?.source;
    if (!imgUrl) return null;
    return {
      imgUrl,
      pageUrl: j.content_urls?.desktop?.page || `https://ko.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      attribution: '사진: 한국어 위키백과 (위키미디어 커먼즈, 자유 라이선스)',
    };
  } catch {
    return null; // 오프라인·차단 등 — 호출측에서 초성 모드로 전환
  }
}

// canvas에 그릴 수 있게 CORS 허용으로 이미지를 로드
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
