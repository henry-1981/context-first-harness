---
name: pdf-conversion-fragments
purpose: PDF→MD 변환 프롬프트 fragment의 케이스별 누적 자산
status: active
created: 2026-04-18
last_case_added: 2026-04-18
related_spec: docs/superpowers/specs/2026-04-18-documents-to-articles-pipeline-design.md
related_skill: .claude/skills/pdf-to-md/skill.md
---

# PDF 변환 프롬프트 Fragment 누적

## 운영 원칙

PDF→MD 변환 프롬프트는 **단일 만능 프롬프트가 아니라 케이스별 fragment의 누적**으로 진화한다. 변환 실패 케이스를 만나면 그 케이스에서 효과 입증된 fragment를 본 자산에 추가하고, 운영 프롬프트는 base + 해당 케이스 fragments 합성으로 구성한다.

이 패턴의 근거: GT-diff 측정(`drafts/llm-comparison/2026-04-18-gt-diff/`) 결과 정적 만능 프롬프트는 **변환 대상의 누락 패턴 사전 지식을 요구**한다는 한계 확인. 미지의 PDF에 대한 정적 프롬프트는 평균 최적화에 머물고, 케이스별 강화로만 회수 가능.

## Base 프롬프트

모든 PDF에 공통 적용되는 최소 지시:

```
Convert this PDF to clean Markdown. Critical requirements:

1. Preserve ALL text content visible in the PDF, including Korean characters exactly as shown.
2. Preserve heading hierarchy (H1-H4), bullet lists, and tables.
3. Use '---' as the page/slide separator between pages.
4. Output Markdown only — no preamble, no explanation, no commentary.
```

## Case Fragments

### Case A: 슬라이드 PDF (Keynote/Figma export, 텍스트가 벡터/이미지로 박힌 경우)

**감지 신호**:
- pdfplumber로 raw text 추출 시 페이지당 평균 50자 미만
- 도식·차트·그래프 비중 큼
- 페이지 = 슬라이드 1:1 매핑 가능 (`---` 구분 자연)

**측정 근거**: GT-diff 측정에서 본문 88%+ 보존, 그러나 그래프 데이터 라벨·박스 안 짧은 라벨이 누락되는 패턴 확인. v2 강화 프롬프트로 그래프 데이터(`30%`, `85%`, `3개월 후`)가 ASCII 시각화로 회수됨.

**Fragment**:

```
Pay extra attention to:
- Small numeric labels in graphs/charts (percentages like 30%, 85%, time annotations like "3 months later")
- Box labels inside diagrams (e.g., "Situation:", "Action:", "Question N:")
- Repeated visual markers (Try it, TIP, NOTE, Level 1/2/3)
- Arrow labels describing relationships (e.g., "delegate", "communicate" near directional arrows)
- Abbreviations and tool names inside diagram boxes (e.g., chrome-cdp, MCP)

Do NOT skip any visible text, even if it appears decorative, small, or short.
Pay extra attention to text inside boxes, on charts, and near arrows.
```

**부수 효과 주의**: 시각 보존 압력으로 markdown nested list가 LaTeX 시각 문자(`$\vdash$`, `$\rightarrow$`)로 이탈하는 사례 관찰됨. 후처리 normalize 또는 fragment 추가 정제 검토 영역.

### Case B: 표 중심 PDF — (미정)

본 측정 시점에는 케이스 데이터 없음. 표 변환 실패 케이스 발생 시 fragment 추가.

### Case C: 그림·도식 중심 PDF — (미정)

본 측정 시점에는 케이스 데이터 없음.

### Case D: 스캔 PDF (이미지화된 텍스트, OCR 필요) — (미정)

`pdf-to-md` 스킬의 OCR 분기와 협응 여부 결정 필요.

## Fragment 추가 절차

새 케이스 발생 시:

1. **측정** — `drafts/llm-comparison/{date-case}/`에 GT-diff 측정 디렉토리 생성, 변환 결과 vs GT 비교
2. **회수 검증** — 강화 fragment 후보로 재변환, 회수율 확인
3. **박제** — 본 자산에 Case 섹션 추가:
   - 감지 신호 (PDF 분류 휴리스틱)
   - 측정 근거 (회수율, 사례)
   - Fragment 본문
   - 부수 효과 주의사항
4. **frontmatter `last_case_added` 갱신**

## 사용 예 (파이프라인)

파이프라인이 PDF를 만나면:

```
1. PDF 분류 (감지 신호로 case 판정)
2. base prompt + 해당 case fragment(s) 합성
3. gemini -p "@<pdf> <합성 prompt>"
```

복수 case 신호 동시 발생 시 fragment 합집합으로 합성. 충돌 fragment 발견 시 본 자산에서 우선순위 결정 후 박제.
