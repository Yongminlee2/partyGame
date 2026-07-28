# v2.0 노잼 탈출 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 스펙 [2026-07-29-v2-fun-overhaul-design.md](../specs/2026-07-29-v2-fun-overhaul-design.md)의 재미 전면 개선 — 연출 엔진, 퀴즈 루프 개편, AI 캐릭터화, 신규 3게임, 벌칙 확장.

**Architecture/Stack:** 기존 구조 유지 (vanilla JS + node:test). 신규 fx.js는 DOM 직접 조작, 로직은 순수 함수 분리.

## Global Constraints

- v1 Global Constraints 전부 유지 (사진 미수록·직접 작성 콘텐츠·외부 라이브러리 금지 등)
- 진실게임·벌칙 수위: 전체이용가 (음주·성적 소재 금지)
- 연출은 클릭 지연을 만들면 안 됨 (자막·콘페티는 non-blocking 오버레이)

### Task 1: fx.js 연출 엔진 + 사운드 확장
- [ ] fx.js: caption/confetti/shake/flash/vibrate. style.css에 keyframes(shake·팝업 바운스·도장)
- [ ] sound.js: heartbeat(rate), combo(n), grade(rank) 추가
- [ ] 브라우저에서 데모 확인 → 커밋

### Task 2: quiz.js 개편 (시간보너스·콤보·등급) — TDD
- [ ] 테스트: answer(text, remainSec) 점수=100+remain×10-힌트30, 콤보 배수 1+0.2n, maxCombo, grade(S≥90% 만점비율, A≥70, B≥50, C≥30, D)
- [ ] 구현 → 통과 → 커밋

### Task 3: 사자성어·연예인 퀴즈 루프 적용
- [ ] 15초 카운트다운 바+heartbeat, 자동 진행(1.5초 결과 노출), fx 연출 배선, 등급 결과 화면+예능 코멘트
- [ ] AI 페르소나 표시(얼굴·상태·도발 말풍선) — rival.js에 페르소나·대사 추가
- [ ] 브라우저 확인 → 커밋

### Task 4: 폭탄 리메이크
- [ ] 폭탄 크기·흔들림 CSS, 심지 불꽃, 경과 기반 틱 가속, 폭발 flash+shake+vibrate
- [ ] 확인 → 커밋

### Task 5: 밸런스 게임 + 데이터 150
- [ ] data/balance.json 150문항(aiSays 2+), validate 추가, games/balance.js (파티 카드덱 / 솔로 AI 공개)
- [ ] 확인 → 커밋

### Task 6: 진실게임 + 데이터 100
- [ ] data/truth.json 100문항(전체이용가), validate, games/truth.js 카드덱
- [ ] 확인 → 커밋

### Task 7: 숫자야구 — TDD
- [ ] judge(guess, answer) 테스트(3S·부분 S/B·중복 금지 검증) → 구현
- [ ] AI 소거법 추리 테스트(후보 일관성) → 구현 → games/baseball.js (솔로/대전)
- [ ] 확인 → 커밋

### Task 8: 벌칙 60 + 룰렛 뽑기 모드
- [ ] data/penalties.json 60개, 룰렛에서 로드 + 벌칙 카드 뽑기 버튼
- [ ] 확인 → 커밋

### Task 9: 홈 갱신 + 전체 검증 + 배포 + APK
- [ ] 홈 그리드 10게임, README 개발일지 갱신
- [ ] node --test + validate 통과 → 푸시(Pages 자동) → APK 빌드·실기기 설치
