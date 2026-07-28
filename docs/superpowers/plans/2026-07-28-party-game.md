# 예능게임 앱 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 예능 단골 게임 7종(솔로 AI 대전 + 파티)을 웹(GitHub Pages)과 안드로이드 APK 하나의 코드로 제공.

**Architecture:** 순수 HTML/JS/CSS(빌드 도구 없음, ES 모듈) SPA + JSON 데이터. 안드로이드는 WebViewAssetLoader로 같은 웹 번들을 내장한 Kotlin 래퍼. 서버·계정 없음.

**Tech Stack:** Vanilla JS(ES2020 모듈), node:test(로직 테스트), Kotlin+WebView(래퍼), GitHub Actions(Pages 배포).

## Global Constraints

- 연예인 실물 사진 파일을 저장소·앱에 포함 금지. 위키피디아 REST API 실시간 로딩만.
- 방송 프로그램명·로고·캐릭터 사용 금지. 게임 이름은 일반 명칭.
- 데이터 텍스트(뜻풀이·설명·제시어)는 전부 직접 작성. 사전 복사 금지.
- 사운드는 WebAudio 합성만(음원 파일 금지).
- 외부 JS 라이브러리·CDN 금지(위키 API 제외 외부 요청 없음).
- 게임 로직은 DOM 없는 순수 함수로 분리 → `node --test` 테스트.
- UI 텍스트 한국어. 모바일 세로 기준(몸으로 말해요만 가로).
- 커밋 메시지 한국어, `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` 푸터.

## 파일 구조

```
web/
├── index.html            홈 + 모든 게임 화면 컨테이너 (SPA, hash 라우팅)
├── privacy.html          개인정보처리방침 (플레이스토어 요건)
├── css/style.css         공통 스타일 (다크 예능 자막 스타일)
├── js/
│   ├── main.js           엔트리: 라우터 초기화, 게임 등록
│   ├── core/
│   │   ├── router.js     hash 라우팅 (#/, #/idiom, ...)
│   │   ├── store.js      localStorage 안전 래퍼 (기록·설정)
│   │   ├── sound.js      WebAudio 효과음 합성 (tick/ok/bad/boom/fanfare)
│   │   ├── hangul.js     초성 추출·한글 판정 (순수)
│   │   ├── quiz.js       퀴즈 라운드 상태머신 (순수)
│   │   ├── wiki.js       위키피디아 summary API 로딩 + 출처 정보
│   │   └── photofx.js    canvas 모자이크·실루엣 효과
│   ├── ai/rival.js       AI 대전 상대 (난이도 파라미터, 순수)
│   └── games/
│       ├── idiom.js      사자성어 뒷글자
│       ├── celeb.js      연예인 퀴즈 (초성+사진)
│       ├── charades.js   몸으로 말해요
│       ├── bomb.js       초성 이어말하기+폭탄
│       ├── liar.js       라이어 게임
│       ├── roulette.js   복불복 룰렛
│       └── photoquiz.js  사진 퀴즈 만들기
└── data/
    ├── idioms.json       사자성어 400+
    ├── celebs.json       연예인 300+
    ├── charades.json     제시어 6카테고리×100+
    ├── liar.json         라이어 세트 100+
    └── choseong-dict.json 초성쌍→단어목록 (WordChain 사전에서 생성)
tests/                    node:test (*.test.mjs)
tools/
    ├── validate-data.mjs 데이터 스키마·중복·초성일치 검증
    └── build-choseong-dict.mjs WordChain dict_common.txt → choseong-dict.json
app/                      Android Kotlin WebView 래퍼 (WordChain 빌드 설정 참조)
.github/workflows/pages.yml
README.md                 개발일지 (매 태스크 갱신)
```

---

### Task 1: 뼈대 + 라우터 + 홈 화면

**Files:** Create `web/index.html`, `web/css/style.css`, `web/js/main.js`, `web/js/core/router.js`, `web/js/core/store.js`, `web/js/core/sound.js`, `tests/router.test.mjs`, `.gitignore`

**Interfaces (Produces):**
- `router.js`: `initRouter(routes)`, `parseHash(hash) -> {page, params}`, `go(page)`
- `store.js`: `load(key, fallback)`, `save(key, value)` — localStorage 실패 시 무시
- `sound.js`: `sfx.tick() / ok() / bad() / boom() / fanfare() / spin()`
- 게임 모듈 규격: `export default {id, title, emoji, mount(el), unmount()}`

- [x] parseHash 테스트 작성(`#/idiom?mode=solo` → `{page:'idiom', params:{mode:'solo'}}`, 빈 해시 → home) → 실패 확인 → 구현 → 통과
- [x] index.html: `<main id="app">` + 홈 그리드(7게임 카드, 이모지+제목), 게임 화면은 mount 방식
- [x] style.css: 다크 배경(#111 계열) + 노랑 포인트(예능 자막 느낌), 카드 그리드, 큰 버튼(모바일 터치)
- [x] sound.js: OscillatorNode 합성 5종, 첫 터치에서 AudioContext resume
- [x] 브라우저 확인(홈 → 카드 클릭 → 빈 게임 화면 → 뒤로), 커밋

### Task 2: 한글 유틸 + 데이터 검증 스크립트

**Files:** Create `web/js/core/hangul.js`, `tests/hangul.test.mjs`, `tools/validate-data.mjs`

**Interfaces (Produces):**
- `choseong(str)` — "김수현"→"ㄱㅅㅎ", 비한글은 그대로
- `isHangulWord(str)` — 전부 완성형 한글인지
- `validate-data.mjs`: `node tools/validate-data.mjs` — 전 JSON 스키마·중복·초성 일치 검사, 실패 시 exit 1

- [x] choseong 테스트(받침 있는 글자, 혼합 문자열, 빈 문자열) → 구현(유니코드 0xAC00 분해) → 통과
- [x] validate-data.mjs: 파일별 검사 함수(idioms/celebs/charades/liar/choseong-dict), 존재하는 파일만 검사
- [x] 커밋

### Task 3: 사자성어 데이터 400+

**Files:** Create `web/data/idioms.json`

스키마: `{"word":"결자해지","front":"결자","back":"해지","meaning":"맺은 사람이 풀어야 한다는 뜻. 일을 벌인 사람이 마무리해야 함.","level":1}` (level 1쉬움/2보통/3어려움)

- [x] 난이도별로 직접 작성: level1 150개(고사성어 교과서 수준), level2 150개, level3 100개. 뜻풀이는 한 문장 요약으로 직접 작성
- [x] validate-data.mjs에 idioms 검사(4글자, front+back=word, 중복 없음, meaning 10자+) → 통과 확인
- [x] 커밋

### Task 4: 연예인 데이터 300+

**Files:** Create `web/data/celebs.json`

스키마: `{"name":"아이유","cho":"ㅇㅇㅇ","hints":["가수 겸 배우","솔로 가수","드라마 출연·국민 여동생"],"wiki":"아이유","cat":"가수"}` — cat: 가수/배우/예능인/운동선수

- [x] 카테고리별 직접 작성(가수 100, 배우 100, 예능인 60, 운동선수 40). 힌트는 사실 정보만, 3단계 점점 구체적으로. wiki는 한국어 위키 문서 제목
- [x] validate 검사(cho가 choseong(name)과 일치, 힌트 3개, 중복 없음) → 통과
- [x] 커밋

### Task 5: 몸으로 말해요 제시어

**Files:** Create `web/data/charades.json`

스키마: `{"동물":["코끼리",...], "직업":[...], "영화드라마":[...], "동작":[...], "음식":[...], "사물":[...]}` — 각 100개+. 영화드라마는 제목(사실 정보)만.

- [x] 카테고리별 작성 → validate(카테고리당 100+, 중복 없음) → 커밋

### Task 6: 라이어 게임 세트 100+

**Files:** Create `web/data/liar.json`

스키마: `{"word":"수영장","category":"장소","normal":["여름에 자주 가요","물이 있어요","수영복이 필요해요","락커룸이 있어요"],"liar":["모래가 많아요","파도가 쳐요"]}` — normal 4+, liar 2+(비슷한 다른 것을 연상시키는 설명)

- [x] 카테고리(장소/음식/직업/물건/동물) 100세트 직접 작성 → validate → 커밋

### Task 7: 초성 사전 생성

**Files:** Create `tools/build-choseong-dict.mjs`, `web/data/choseong-dict.json`, `tests/build-dict.test.mjs`

- [x] WordChain `app/src/main/assets/dict_common.txt` 포맷 확인(줄 단위 단어 목록 가정, 다르면 파서 조정)
- [x] 변환: 2글자 완성형 한글 단어만 → 초성쌍("ㄱㅅ")별 그룹 → 30단어 미만 쌍 제외 → JSON `{"ㄱㅅ":["가수","감사",...]}`
- [x] 그룹핑 함수 테스트(소형 입력) → 스크립트 실행 → validate → 커밋

### Task 8: 퀴즈 엔진 + AI 대전

**Files:** Create `web/js/core/quiz.js`, `web/js/ai/rival.js`, `tests/quiz.test.mjs`, `tests/rival.test.mjs`

**Interfaces (Produces):**
- `createQuiz({items, rounds}) -> {current(), answer(text)->{correct,score}, revealHint()->hint, next()->bool, result()}` — 점수: 기본 100, 힌트당 -30(최소 10)
- `createRival(level) -> {answerDelayMs()->number, willAnswer()->bool}` — level 1: 평균 12초·정답률 0.5 / 2: 8초·0.7 / 3: 5초·0.9. 지수분포 샘플링

- [x] 퀴즈 상태머신 테스트(정답/오답/힌트 감점/라운드 진행/최종 집계) → 구현 → 통과
- [x] rival 테스트(1000회 샘플링 평균이 파라미터 ±30%, level별 단조성) → 구현 → 통과
- [x] 커밋

### Task 9: 사자성어 게임

**Files:** Create `web/js/games/idiom.js`, `tests/idiom-logic.test.mjs`; Modify `web/js/main.js`

**Interfaces (Consumes):** quiz.js, rival.js, store.js, sfx
**Produces:** `makeChoices(item, pool, n=4)` — 오답은 다른 사자성어의 back에서, 중복 없이 섞기

- [x] makeChoices 테스트(정답 포함, 4개 유일, pool 부족 시 에러 없이 가능한 만큼) → 구현
- [x] 화면: 모드 선택(혼자 연습/AI 대결/다같이) → 난이도 → 라운드 10개. AI 대결은 타이머 바에 AI 예상 응답 시점 표시, 먼저 맞추면 승. 오답 시 뜻 힌트 후 1회 재도전
- [x] 브라우저 수동 확인 → 기록 저장(최고점) → 커밋

### Task 10: 연예인 퀴즈 (초성+사진)

**Files:** Create `web/js/games/celeb.js`, `web/js/core/wiki.js`, `web/js/core/photofx.js`, `tests/celeb-logic.test.mjs`; Modify `web/js/main.js`

**Interfaces (Produces):**
- `wiki.fetchPortrait(title) -> Promise<{imgUrl, pageUrl, attribution} | null>` — `https://ko.wikipedia.org/api/rest_v1/page/summary/{title}` thumbnail. 실패/사진없음 → null
- `photofx.mosaic(img, canvas, level)` — level 8(거침)→1(원본). `photofx.silhouette(img, canvas)`

- [x] 초성 모드: celebs.json + quiz 엔진, 힌트 3단계 공개. AI 대결 지원
- [x] 사진 모드: 라운드 시작 시 fetchPortrait, 모자이크 level 8→1 시간 경과 공개(또는 실루엣), 정답 공개 시 원본+출처 링크 표시. null이면 그 라운드는 초성 모드로 자동 전환. navigator.onLine false면 모드 선택에서 사진 모드 비활성 표시
- [x] 힌트 스케줄 순수 함수 테스트 → 브라우저 확인(온라인/오프라인 시뮬) → 커밋

### Task 11: 몸으로 말해요

**Files:** Create `web/js/games/charades.js`, `tests/tilt.test.mjs`; Modify `web/js/main.js`

**Produces:** `classifyTilt(beta, prev) -> 'ok'|'pass'|null` — 가로 모드 기준 앞으로 숙임(정답)/뒤로 젖힘(패스), 히스테리시스(중립 복귀 전 재발동 금지)

- [x] classifyTilt 테스트(경계값·히스테리시스) → 구현
- [x] 화면: 카테고리·시간 선택 → "이마에 대세요" 카운트다운 → 전체화면 큰 글자 제시어, 기울임 판정+효과음, DeviceOrientation 권한 없거나 미지원이면 화면 상/하 터치 버튼. Screen Wake Lock(지원 시)
- [x] 결과 화면(맞춤/패스 목록) → 실기기 확인 → 커밋

### Task 12: 초성 이어말하기 + 폭탄

**Files:** Create `web/js/games/bomb.js`, `tests/bomb-logic.test.mjs`; Modify `web/js/main.js`

**Produces:** `checkWord(word, cho, used, dict) -> 'ok'|'wrong-cho'|'not-word'|'dup'`, `pickAiWord(cho, used, dict, level) -> word|null` (level별 포기 확률 0.15/0.07/0.02)

- [x] checkWord·pickAiWord 테스트 → 구현
- [x] 화면: 파티(폰 돌리며 입력, 숨은 랜덤 타이머 15~45초, 폭발 연출+사운드) / 솔로(AI와 교대, AI 응답 딜레이 연출). 초성쌍은 dict에서 랜덤
- [x] 브라우저 확인 → 커밋

### Task 13: 라이어 게임

**Files:** Create `web/js/games/liar.js`, `tests/liar-logic.test.mjs`; Modify `web/js/main.js`

**Produces:** `assignRoles(n) -> {liarIndex}`, `buildSoloRound(set, aiCount=4) -> {statements:[{text, isLiar}...셔플], liarIndex}`

- [x] 역할 배정·솔로 라운드 조립 테스트(라이어 정확히 1명, 셔플 후 인덱스 일치) → 구현
- [x] 파티 플로우: 인원 설정 → "N번째 사람 확인" 넘겨보기(터치로 가림/공개) → 토론 안내 → 투표 집계 → 라이어 공개
- [x] 솔로 플로우: AI 4명 말풍선 순차 공개 → 지목 → 정답 공개·연속 정답 기록
- [x] 브라우저 확인 → 커밋

### Task 14: 복불복 룰렛

**Files:** Create `web/js/games/roulette.js`, `tests/roulette-logic.test.mjs`; Modify `web/js/main.js`

**Produces:** `winnerAt(angle, n) -> index` (최종 회전각→당첨 칸)

- [x] winnerAt 테스트(경계각) → 구현
- [x] canvas 룰렛: 항목 입력(이름/벌칙, 프리셋 벌칙 15종 내장), ease-out 회전 4~6초, 당첨 연출+fanfare
- [x] 브라우저 확인 → 커밋

### Task 15: 사진 퀴즈 만들기

**Files:** Create `web/js/games/photoquiz.js`; Modify `web/js/main.js`

- [x] 문제 만들기: `<input type=file accept=image/*>` 여러 장 → 각 사진에 정답 이름 입력 → 메모리(세션)에만 보관, 안내 문구 "사진은 기기 밖으로 나가지 않아요"
- [x] 출제: photofx.mosaic 재사용, 점점 선명 → 정답 공개. 진행자가 정답 판정(맞음/넘김 버튼)
- [x] 브라우저 확인 → 커밋

### Task 16: 설정·고지 + 개인정보처리방침

**Files:** Create `web/privacy.html`; Modify `web/index.html`, `web/js/main.js`

- [x] 홈에 정보(ⓘ) 페이지: 데이터 출처(직접 제작, 사전 CC0, 사진은 위키피디아 실시간·미저장), 오픈소스 고지, privacy.html 링크
- [x] privacy.html: 수집 정보 없음, localStorage 로컬 저장만, 사진 모드 시 위키피디아 접속 고지
- [x] 커밋

### Task 17: GitHub Pages 배포

**Files:** Create `.github/workflows/pages.yml`

- [x] workflow: push(main) → `actions/upload-pages-artifact`(path: web) → `actions/deploy-pages`
- [x] push → Actions 성공 확인 → `https://yongminlee2.github.io/partyGame/` 동작 확인(fetch로 200 확인)
- [x] 커밋

### Task 18: Android WebView 래퍼 + APK

**Files:** Create `app/` gradle 프로젝트(WordChain의 gradle 버전·서명 설정 패턴 참조: `C:\workAndroid\WordChain\build.gradle.kts`, `app/build.gradle.kts`), `app/src/main/java/.../MainActivity.kt`

- [x] 구조: settings.gradle.kts + app 모듈, applicationId `com.ymgames.partygame`(가칭), minSdk 24 / targetSdk는 WordChain과 동일
- [x] MainActivity: WebView + `WebViewAssetLoader`(`https://appassets.androidplatform.net/assets/web/index.html`) — ES 모듈·fetch 동작, JS·DOM storage 활성, 뒤로가기=라우터 back, 화면 회전 대응
- [x] gradle 태스크 `copyWebAssets`: `web/` → `app/src/main/assets/web/` (assets는 .gitignore)
- [ ] adb로 S20 Ultra 설치·전 게임 스모크 테스트 — 기기 미연결로 보류 (빌드는 성공)
- [x] 커밋

### Task 19: README 개발일지

**Files:** Create/Update `README.md`

- [x] 구성: 소개·게임 목록(스크린샷 없이 표)·아키텍처 요약·저작권 분석 정리(사진 3안 검토 결과 포함)·개발일지(태스크별 날짜·내용·부딪힌 문제)·빌드/배포 방법·플레이스토어 준비 상태
- [x] 이후 태스크 진행마다 개발일지 섹션 갱신 (완료 시점 일괄 아님)
- [x] 커밋·푸시

### Task 20: 최종 검증

- [x] `node --test tests/` 전체 통과 + `node tools/validate-data.mjs` 통과
- [x] 웹(Pages URL) 실행 확인 완료. - [ ] APK 실기기 오프라인 확인은 기기 연결 시
- [x] README 개발일지 마감 갱신 → 커밋 → push
