# Presentation Harness

프레젠테이션의 기획→A/B 테스트→풀 덱→검증→사용자 수정→포맷 내보내기를 에이전트 팀이 협업하여 제작하는 하네스.

## 구조

```
tools/presentation/.claude/
├── CLAUDE.md                          ← 이 파일
├── agents/
│   ├── storyteller.md                 — 메시지 설계 (소스 구조화, 슬라이드 시퀀스, takeaway)
│   ├── template-filler.md             — 템플릿 데이터 생성 ({{KEY}} 치환용 JSON)
│   ├── visual-designer.md             — PPTX 자유 모드 디자인 (HTML, PPTX 변환 전제)
│   ├── webppt-designer.md             — WebPPT 전용 디자인 (모션+풀CSS, PPTX 불가)
│   ├── deck-verifier.md               — 풀 덱 품질 검증 (메시지 충실도 + 규격 + AI Slop + 모션)
│   ├── outline-verifier.md            — outline 구조·슬라이드 수·섹션 검증
│   ├── sample-verifier.md             — A/B 샘플 수·PNG·direction·ab_compare 검증
│   ├── export-verifier.md             — 포맷 파일 존재·슬라이드 수·포맷 유효성 검증
│   └── _contracts/                    — verifier return JSON Schema + fixtures
├── lib/                               — 공통 라이브러리 (state-manager, schema-loader, aql-sampler, token-estimator)
└── skills/
    └── presentation/
        ├── plan/
        │   ├── SKILL.md               — 기획 stage-owner (P0~P4, outline+A/B sample)
        │   └── assets/                — ab-compare-template.html, archive-workspace.sh
        ├── design/
        │   ├── SKILL.md               — 디자인 stage-owner (P5~P7, 풀 덱+검증+에디터)
        │   └── assets/                — start-slides-grab.sh, stop-slides-grab.sh
        ├── export/
        │   └── SKILL.md               — 내보내기 stage-owner (P8~P9, 포맷 변환+검증)
        └── run/
            └── SKILL.md               — E2E 메타 스킬 (plan→design→export 체인)
```

## 사용법

`presentation:run` (또는 "프레젠테이션 만들어줘") 으로 E2E 진입.
단계별 재진입: `presentation:plan` / `presentation:design` / `presentation:export`.

## 운영 규율

`tools/presentation/`은 상시 운영 인프라다. 수정 시 feature branch에서 작업한 뒤 main으로 병합한다.

## 핵심 원칙

1. **디자인 판단 제거 (템플릿 모드)** — 기본 템플릿이 디자인 100%, LLM은 데이터 치환만
2. **A/B 테스트** — 비교 HTML 1장 생성 + 브라우저 자동 오픈 → 사용자가 모드 선택
3. **원문 보존 + 5안티패턴** — 콘텐츠 품질 가드레일
4. **3단 고정 구조** — 헤더 | 콘텐츠 | 푸터. 공간 활용 최대화
5. **영역 분리** — LLM 자동화(P1~P6) ↔ 사용자 수동 수정(P7) ↔ 기계적 변환(P8)

## 산출물

`{PPT_WORKSPACE_ROOT}/{project}/` 디렉토리 (프로젝트별 격리):
```
{project}/
  state.json            — 파이프라인 상태 (plan/design/export status)
  input/
    input.md            — 사용자 입력
    images/             — 사용자 제공 이미지
    references/         — 레퍼런스 자료
  draft/
    outline.md          — 메시지 설계 + 슬라이드 시퀀스
    deck-data.json      — 템플릿 모드 데이터
    slides/             — 현재 풀 덱 슬라이드 HTML
  checkpoints/          — 저장된 복원 지점
  samples/
    a/slides/           — Side A 샘플 HTML
    b/slides/           — Side B 샘플 HTML
    a/slide-*.png       — A 샘플 캡처
    b/slide-*.png       — B 샘플 캡처
    compare.html        — A/B 비교 페이지
  export/               — 최종 내보내기 (WebPPT / PPTX / PDF)
  verify/               — 검증 리포트 (plan.md / design.md / export.md)
  logs/hooks.jsonl      — ab_compare_opened 등 hook 이벤트 로그
```

## tools/slides-grab 에디터

- 상위 `../tools/slides-grab/` 경유. 본 `.claude/` 하위 스킬(`presentation:design` P7)이 start.sh/stop.sh를 직접 호출
- Layer 1(contenteditable) + Layer 2(AI edit /api/edit/ai) v1 복원 완료 — Chunk 5
- 엔진 환경변수 `PPT_EDIT_ENGINE`(codex|claude), state 환경변수 `PPT_STATE_PATH`
