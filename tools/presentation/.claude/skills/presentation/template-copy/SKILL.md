---
name: presentation:template-copy
description: "레퍼런스 슬라이드/덱을 템플릿으로 복제하는 스킬. HTML, WebPPT HTML, PNG, PDF, PPTX를 읽어 structure-aware extraction 후 base-templates로 저장합니다."
---

# presentation:template-copy

`slides-grab-copy`를 사용해 레퍼런스 슬라이드를 템플릿 자산으로 저장한다.

## 입력

- 단일 HTML
- WebPPT HTML
- PNG
- PDF
- PPTX

## 규칙

- `PPT_WORKSPACE_ROOT`는 필수다
- `PPT_COPY_PORT`는 선택이며 기본값은 `3556`
- `moai-office/pptx-designer`는 optional reference다
- spec drift는 `docs/superpowers/plans/2026-04-22-presentation-template-copy/spec-delta-template.md`에 먼저 기록한다

## 기동

```bash
bash tools/slides-grab-copy/start.sh "${PPT_COPY_PORT:-3556}" "<slides-dir>" "<state-path-or-empty>"
```

## 종료

```bash
bash tools/slides-grab-copy/stop.sh "${PPT_COPY_PORT:-3556}"
```

## 저장 목표

- `base-templates/templates-slide-{archetype}/{slot}.html`
