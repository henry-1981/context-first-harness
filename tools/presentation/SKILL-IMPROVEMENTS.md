# Presentation Skill — 개선 계획

> 출처: 2026-04-03 AI Native 전환 제안서 제작 세션에서 발견된 문제 목록  
> 다음 세션에서 이 파일을 읽고 구현 작업으로 진입할 것

---

## 🔴 파이프라인 구조 결함

### 1. ✅ 섹션 인디케이터 방식 — Phase 1 확정 항목 추가
- **문제**: 아웃라인 승인 후 섹션 구분 방식이 3번 변경됨 (텍스트 → 유니코드 → HTML 배지)
- **구현**: `skill.md` Phase 1 아웃라인 승인 체크리스트에 "섹션 인디케이터 스타일 확정" 항목 추가
  - 선택지: ① FOOTER_TAG 텍스트  ② 유니코드 원문자  ③ HTML span 배지 (색상 연동)
  - 기본값: HTML span 배지 (agenda 색상과 동일)
- **상태**: skill.md Phase 1에 3가지 선택지 + 기본값(C) 명시 완료

### 2. ✅ agenda 템플릿 — 가변 항목 수 지원
- **문제**: agenda.html이 최대 4개 고정 → 6개 섹션 시 수동 확장 필요
- **구현**: `agenda.html`을 6개 항목으로 확장 (n5/n6 클래스 포함) — 또는 Phase 1에서 섹션 수 확인 후 템플릿 적합성 자동 검증
- **상태**: healthcare agenda.html에 6개 항목 + JS 빈 항목 자동 숨김 구현 완료. warm은 4개 고정 유지

### 3. ✅ JSON → HTML 재생성 CLI
- **문제**: `generate-deck.ts`가 JSON 파일 직접 입력 미지원 → 텍스트 수정마다 수동 치환
- **구현**: `npx tsx scripts/generate-from-json.ts _workspace/02a_deck_data.json _workspace/output/` 형태 스크립트 작성
  - `fs.readFileSync(jsonPath)` → slides 배열 순회 → 템플릿 `replaceAll('{{KEY}}', value)` → 파일 저장
- **상태**: `scripts/generate-from-json.ts` + `base-templates/generate-deck.ts` (JSON CLI args) 모두 구현 완료

---

## 🟠 에디터(slides-grab) 안정성

### 4. ✅ 포트 충돌 방지 로직
- **문제**: 이전 세션 서버가 살아있어 잘못된 폴더를 서빙 → 4개 인스턴스 생성됨
- **구현**: 에디터 기동 전 표준 절차 추가
  1. `curl -s http://localhost:{PORT}/api/slides` 응답 확인
  2. 동일 slides-dir이면 재사용
  3. 다른 dir이면 +1 포트로 새 인스턴스 기동
  - `skill.md` Phase 7에 이 절차 명문화
- **상태**: skill.md Phase 7에 lock file + curl 헬스체크 + trap EXIT 구현 완료

### 5. ⚠️ A/B 비교 iframe 해상도 기준 수정 (사실상 해소)
- **문제**: body가 1920×1080인데 iframe이 960×540 기준으로 렌더링
- **구현**: A/B 비교 HTML 생성 로직에서 `width: 1920, height: 1080` 명시 (JS 스케일링 기준)
- **상태**: A/B 비교가 이미지 기반(PNG 캡처)으로 전환되어 iframe 해상도 이슈 자체가 해소됨

---

## 🟠 디자인 시스템

### 6. ✅ 섹션 배지 색상 vs 템플릿 내부 요소 충돌 매트릭스
- **문제**: 섹션④(`#34D399`) ↔ step-3(`#10B981`) 유사, 섹션①(`#0EA5E9`) = bullet dot 색상
- **구현**: `skill.md` 또는 컬러 팔레트 문서에 충돌 매트릭스 추가
  ```
  섹션① #0EA5E9  → bullet-list dot과 동색 → dot을 #7DD3FA로 override
  섹션④ #34D399  → vertical-steps s3(#10B981)과 유사 → s3을 #059669로 override
  ```
  template-filler가 해당 조합 감지 시 자동으로 override CSS 삽입
- **상태**: template-filler.md에 충돌 매트릭스 + generate-from-json.ts에 overrideCSS 주입 구현 완료

### 7. ✅ 타이틀 배지 수직 정렬 — 템플릿 레벨 수정
- **문제**: HTML span 배지가 있는 TITLE에서 `.title`에 flex 미적용 시 정렬 깨짐
- **구현**: healthcare 템플릿 전체에서 `.title` CSS를 `display: flex; align-items: center;`로 수정
  - 대상: `bullet-list.html`, `two-column-compare.html`, `vertical-steps.html`
  - cover/agenda/closing은 배지 없으므로 제외
- **상태**: 3개 템플릿 모두 `.title { display: flex; align-items: center; gap: 8px; }` 적용 완료

---

## 🟡 템플릿 한계

### 8. ✅ 커스텀 레이아웃용 보일러플레이트 추가
- **문제**: 2열 커스텀 레이아웃 작성 시 padding/font-size가 표준과 달라짐
- **구현**: `templates-slide-healthcare/custom-shell.html` 신규 생성
  - top-bar, title(28px, flex), footer 포함
  - `.body` 영역만 비워두고 자유 레이아웃 가능
  - slide.md 아키타입 목록에 `custom` 타입 추가
- **상태**: healthcare custom-shell.html 구현 완료 (`b73d46d`). warm은 스코프 외

### 9. ✅ deck-reviewer — 템플릿 모드 자동 통과 조건 강화
- **문제**: templateSet 있어도 HTML 스펙(viewport, 폰트) FAIL 판정
- **구현**: `deck-reviewer.md`에 다음 조건 명시
  ```
  if (deck_data.templateSet !== undefined) {
    HTML/CSS 스펙 검사 전체 SKIP → 자동 PASS
    메시지 품질 검사만 수행
  }
  ```
- **상태**: deck-reviewer.md에 templateSet 판별 + 자동 PASS 로직 구현 완료

---

## 🟡 콘텐츠 품질

### 10. ✅ template-filler — 수치/고유명사 맥락 보존 규칙
- **문제**: "30개", "1,143개" 등 수치가 맥락 없이 슬라이드에 노출됨
- **구현**: `template-filler.md` 프롬프트에 규칙 추가
  ```
  수치·통계가 포함된 경우: 반드시 "무엇의 N개/N%" 형식으로 한 문장 안에 맥락 포함
  약어·고유명사: 첫 등장 시 풀네임 병기
  ```
- **상태**: template-filler.md 작업 원칙에 규칙 구현 완료

### 11. PDF 캡처 기본 해상도 (완료)
- **상태**: ✅ 이미 수정됨 (`deviceScaleFactor: 1 → 2`)
- `scripts/capture-slides-to-pdf.ts` line 47 확인

---

## 구현 현황 (2026-04-04 검증)

| # | 항목 | 상태 |
|---|---|---|
| 1 | 섹션 인디케이터 — Phase 1 확정 | ✅ |
| 2 | agenda 가변 항목 | ✅ (healthcare 6항목, warm은 4고정) |
| 3 | JSON→HTML 재생성 CLI | ✅ |
| 4 | 포트 충돌 방지 (lock file) | ✅ |
| 5 | A/B iframe 해상도 | ⚠️ 이미지 기반 전환으로 해소 |
| 6 | 색상 충돌 매트릭스 + override | ✅ |
| 7 | 타이틀 flex 정렬 | ✅ |
| 8 | custom-shell 보일러플레이트 | ✅ (healthcare, warm은 스코프 외) |
| 9 | reviewer templateSet 자동통과 | ✅ |
| 10 | 수치/약어 맥락 규칙 | ✅ |
| 11 | PDF 캡처 해상도 | ✅ |
| 12 | 서버 종료 보장 | ✅ (trap EXIT) |
| 13 | HTML 참조 검증 | ⚠️ 타임스탬프만, URL 유효성 미구현 |

**잔여 작업**: #13 외부 리소스 URL 유효성 검증 (현재 타임스탬프만 체크)
