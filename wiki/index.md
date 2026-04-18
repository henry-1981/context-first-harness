# Wiki Index

비개발자가 운영하는 **동적 지식**의 박제 위치. AI Agent가 매 작업마다 이 인덱스에서 도메인 클러스터를 드릴다운해 답변에 인용한다.

> Karpathy LLM Wiki 패턴 — 사용자 도메인 전문가 + LLM 공동 진화형 지식 시스템.

## 역할 분리

- **사용자**: `sources/` 큐레이션, 분석 방향 설정, 좋은 질문, 의미 해석, 도메인 검증
- **LLM**: 요약, 교차 참조, filing, bookkeeping — sources 본문 외 전부

## 도메인 클러스터

페이지는 **도메인(주제) 클러스터** 기준으로 정렬한다. 페이지 타입(entity, concept, comparison, synthesis)은 frontmatter에만 기록하고, index에서는 주제별로 묶는다. 클러스터는 LLM이 자율적으로 생성·병합·분리한다.

### Medical Device RA/QA

- [[medical-device-ra-qa-thinking-frame]] — 의료기기 RA/QA 업무에서 반복되는 사고 구조 (1부 명시지 4축 + 2부 HITL 3영역)

### (운영 시 클러스터 추가)

비개발자 자기 도메인의 신규 페이지가 추가되면 위 형식으로 클러스터를 만들어 누적한다.

## Page Types

| Type | 설명 | 예시 |
|------|------|------|
| summary | 단일 소스 요약 | source 1건 압축 |
| entity | 인물·기관·제품 등 개체 | 회사 프로필, 인터뷰 entity |
| concept | 추상 개념·원칙·패턴 | thinking frame, methodology |
| comparison | 두 항목 구조적 비교 | 두 framework 차이 |
| synthesis | 다중 소스·페이지 교차 결론 | medical-device-ra-qa-thinking-frame 본 페이지 |

## Filing 트리거 (LLM 자율 판단)

대화·작업에서 다음 5가지 신호가 잡히면 wiki 페이지로 박제한다.

1. **교차 비교** — 두 framework·규정·접근법의 구조적 비교 → comparison
2. **신규 개념** — 기존 위키에 없는 개념·용어·패턴 등장 → concept
3. **종합 분석** — 여러 소스/페이지를 교차해 새 결론 도출 → synthesis
4. **의사결정 근거** — 향후 참조 가치 있는 선택의 논리 → concept
5. **반복 주제** — 같은 주제 2회 이상 → entity 또는 concept으로 승격

## 폴더 역할

- `wiki/sources/` — 사용자 큐레이션 원자료 (LLM 수정 금지)
- `wiki/pages/` — LLM 소유 page (kebab-case, flat)
- `wiki/raw/sessions/YYYY-MM-DD/` — 대화 세션 자동 ingest 원본. seCall 도구가 Claude Code 대화 로그를 일자별 폴더로 적재. 사용자는 직접 수정하지 않음
- `wiki/wiki/projects|sessions/` — codex 파이프라인이 raw 세션을 1차 정리한 결과물. 프로젝트명·주제·결정 기준으로 드릴다운 가능. pages 작성 시 참고 재료
- `wiki/log.md` — 모든 wiki 활동 로그 (ingest, query, filing, lint, update)
- `wiki/index.md` — 본 파일 (도메인 클러스터 + `## Sessions` 섹션으로 세션 원재료 링크 노출)

## 세션 아카이빙 파이프라인

대화 세션이 지식 자산으로 쌓이는 경로는 다음 4단계입니다.

1. **세션 진행** — Claude Code(또는 codex 등 다른 AI CLI) 대화가 로그로 저장됩니다
2. **seCall 자동 ingest** — seCall 도구가 세션 로그를 `wiki/raw/sessions/YYYY-MM-DD/`로 자동 복사합니다. 사용자는 이 폴더를 직접 건드리지 않습니다
3. **codex 1차 정리** — codex 파이프라인이 raw 세션을 `wiki/wiki/projects|sessions/`로 요약·분류합니다. 프로젝트·주제·결정 단위로 드릴다운이 가능해집니다
4. **LLM filing 참고** — LLM이 `pages/`에 새 페이지를 만들거나 기존 페이지를 갱신할 때 이 정리된 세션 층을 참고 재료로 씁니다. 단순 인용이 아니라 세션에 담긴 도메인 맥락·의사결정 근거를 재추출하는 용도입니다

이 파이프라인 덕분에 대화 자체가 휘발되지 않고 **맥락 자산으로 복리 누적**됩니다. "이전에 결정한 근거는?"을 매 세션마다 처음부터 재논의할 필요가 없어지며, LLM은 `index.md`의 `## Sessions` 섹션을 통해 필요한 세션 원재료에 `[[raw/sessions/YYYY-MM-DD/...]]` 링크로 직접 접근합니다.

본 공유 레포에는 세션 원재료가 포함되지 않습니다 (사용자 개인 대화 로그라 공개 범위 밖). 운영 환경에서 seCall을 설치하면 자기 세션이 동일 구조로 자동 수집됩니다.

## Cross-references

페이지 간 연결은 `[[filename]]` 형식.
