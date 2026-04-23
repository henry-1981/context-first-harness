---
name: presentation:export
description: "프레젠테이션 포맷 변환 스킬 — WebPPT/PPTX/PDF 변환, export-verifier 검증, 결과 파일 자동 오픈. 트리거: '프레젠테이션 내보내기', '슬라이드 PPTX 변환', 'WebPPT export', '덱 PDF', '프레젠테이션 포맷 변환'."
---

# presentation:export — 내보내기 단계 Stage-Owner 스킬

design 단계에서 PASS한 풀 덱(`draft/slides/slide-*.html`)을 HB 선택 포맷으로 변환하고, export-verifier로 무결성 검증한다. 본 스킬 완료 시 `export.verifiers.export.status = "passed"`.

## 실행 모드

**Main thread 직접 실행.** 변환 command 실행 + export-verifier 서브에이전트 디스패치. HB 상호작용은 포맷 선택 1회.

## 진입 Gate (HARD-GATE)

state.json 확인:

| 상황 | 처리 |
|---|---|
| state.json 없음 또는 `design.status != "passed"` | **즉시 중단**. HB에 "design 단계를 먼저 완료하세요" 안내, `presentation:design` 호출 지시 |
| `design.status == "passed"` + 기존 `export.*` 있음 | 포맷만 재선택 가능(재호출 시나리오, Spec §3.2 export 행) |
| `design.status == "passed"` + `export.*` 없음 | 신규 진입 |

## Phase P8: 포맷 선택

state.json `config.mode` 읽어 선택지 분기:

포맷 선택 UI를 띄우기 직전 현재 `draft/`를 자동 checkpoint로 저장한다. 기본 라벨은 `auto-pre-export-{YYYY-MM-DD-HHMMSS}`다.

**PPTX 모드 (`config.mode == "pptx"`):**
```
내보내기 포맷을 선택하세요 (복수 선택 가능):
  ① HTML-WebPPT (브라우저 발표용)
  ② PPTX (PowerPoint)
  ③ PDF (인쇄/공유용)
```

**WebPPT 모드 (`config.mode == "webppt"`):**
```
내보내기 포맷을 선택하세요 (복수 선택 가능):
  ① HTML-WebPPT (브라우저 발표용)
  ③ PDF (인쇄/공유용)
⚠️ PPTX 변환은 WebPPT 모드에서 지원되지 않습니다 (백드롭 필터·clip-path 손실).
```

**🚧 GATE: HB 선택 없이 변환 진입 금지.** 복수 선택(예: "1,3") 허용.

선택 직후 state.json에 기록:

```js
sm.merge('{state_path}', {
  export: {
    formats: ['webppt', 'pdf'],  // HB 선택값
    files: {}
  },
  history_append: { event: 'export_formats_selected', formats: [...] }
});
```

## Phase P8-B: 포맷별 변환 실행

각 포맷 변환 command 순차 실행:

### ① HTML-WebPPT

```bash
python scripts/build-webppt.py \
  {project_root}/draft/slides \
  {project_root}/export/webppt.html \
  "발표 제목"
```

주의: 위치 인자(--input/--out 플래그 아님). `slide-*.html` 전부 읽음.

### ② PPTX (mode == pptx만)

```bash
npm run html2pptx -- \
  --slidesDir={project_root}/draft/slides \
  --output={project_root}/export/deck.pptx
```

`tsc` 컴파일 후 `dist/html-pipeline/cli.js` 실행. pptxgenjs + Playwright 기반.

### ③ PDF

```bash
npx tsx scripts/capture-slides-to-pdf.ts \
  {project_root}/draft/slides \
  {project_root}/export/deck.pdf
```

Playwright 슬라이드별 캡처 → PDF 합성.

변환 완료 후 state.json:

```js
sm.merge('{state_path}', {
  export: {
    files: {
      webppt: 'export/webppt.html',
      pptx: 'export/deck.pptx',
      pdf: 'export/deck.pdf'
    }
  },
  history_append: { event: 'export_files_written' }
});
```

## Phase P8-C: export-verifier 디스패치

```
Agent(
  subagent_type: "export-verifier",
  prompt: "export-verifier 에이전트. .claude/agents/export-verifier.md를 읽고 따르라.
           입력: {project_root}/draft/slides/slide-*.html + export/* + state.json
           config.mode: {pptx|webppt}
           export.formats: {선택된 포맷 배열}
           출력: {project_root}/verify/export.md
           returns stdout JSON per _contracts/export-verifier.schema.json"
)
```

AQL 샘플링(lot = 슬라이드 수) + Pre-flight 토큰 gate(n ≥ 20). 포맷별 검증:

- PPTX: python-pptx로 zip 해제 + XML 파싱 → 슬라이드 수·텍스트 diff(원 HTML AQL 샘플)
- PDF: pdfjs-dist 텍스트 추출 + 페이지 수 일치 + bounding box 잘림 감지 + AQL 샘플 pHash
- WebPPT: JSDOM 텍스트 + JS 에러 console 0 + AQL 샘플 Playwright 렌더 모션 확인
- 공통: 파일 크기 sanity, 폰트 embed 확인(PPTX)

verifier return validation 후 merge:

```js
sm.merge('{state_path}', {
  export: {
    verifiers: { export: { status, aql_sample_slides, retries, warnings, evidence_path: 'verify/export.md' } }
  },
  history_append: { event: `export_verifier_${status}`, retry: <n> }
});
```

FAIL 시 재시도 상한 2회. 3차 FAIL은 root cause 리포트(Spec §5.2, design 단계와 동일 5옵션 구조) → HB gate.

## Phase P9: 결과 파일 자동 오픈

export-verifier PASS 후 각 포맷 파일을 탐색기/브라우저에서 자동 오픈:

```bash
start "" "{project_root}/export/webppt.html"   # 브라우저
start "" "{project_root}/export/deck.pptx"     # PowerPoint
start "" "{project_root}/export/deck.pdf"      # 기본 PDF 뷰어
```

HB에게 최종 경로 보고:

```
내보내기 완료. 경로:
  - WebPPT: {project_root}/export/webppt.html
  - PDF: {project_root}/export/deck.pdf
state.json export.verifiers.export.status = "passed".
```

## 스킬 체인 안내

```
export 단계 완료. 본 스킬이 presentation 파이프라인의 마지막입니다.
`presentation:run`으로 진입하셨다면 이 시점에서 전체 완료.

재수정이 필요하면:
- 내용 수정 → `presentation:plan` (plan.status = "passed"이지만 진입 가능, 내용 수정 모드)
- 시각 수정 → `presentation:design` (에디터 모드 직진입)
- 포맷 추가 → `presentation:export` 재호출
```

## 에러 핸들링

| 상황 | 대응 |
|---|---|
| 진입 시 `design.status != "passed"` | 즉시 중단, HB에 design 선행 안내 |
| 변환 command 실패(예: build-webppt.py 에러) | stderr 캡처 + state.json `history`에 `export_convert_fail` + HB 통보 + 재시도 1회 |
| export-verifier 3차 FAIL | Root cause 리포트 + HB 선택 gate |
| 결과 파일 자동 오픈 실패 | 경로만 HB에 안내 후 수동 오픈 요청 |
| WebPPT 모드에서 PPTX 선택 시도 | 선택지에 없음, 무시 |

## Gate 규율 — Red Flags

| Red Flag | 대응 |
|---|---|
| `design.status != "passed"`인데 진입 | 즉시 중단 |
| HB 포맷 선택 없이 변환 시작 | 즉시 중단 |
| export-verifier FAIL인데 export.status passed 상신 | spec 위반, 롤백 |
| 결과 파일 미오픈 | 반드시 `start ""` 실행 |
| WebPPT 모드에서 PPTX 생성 시도 | 사용자에게 경고 + 시도 차단 |
