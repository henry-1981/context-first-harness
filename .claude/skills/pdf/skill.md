---
name: pdf
description: >
  MD 파일을 PDF로 다이렉트 변환. Playwright 기반 HTML→PDF 렌더링.
  Triggers: pdf 변환, PDF로 만들어, md to pdf, PDF 변환해줘
---

# MD→PDF 변환

MD 파일을 PDF로 변환한다. DOCX를 거치지 않는 다이렉트 변환.

## 트리거

자연어 인식:
- "이 MD를 PDF로 만들어줘"
- "report.md PDF로 변환해"
- "SOP 템플릿으로 PDF 만들어"
- "PDF 변환해줘"

## 동작

1. 사용자 요청에서 파싱:
   - **파일 경로**: MD 파일 경로 (없으면 질문)
   - **템플릿**: 템플릿명 (없으면 default)
   - **출력 경로**: 미지정 시 입력 파일과 같은 디렉토리에 `.pdf` 확장자

2. 변환 실행:
   ```bash
   cd /c/Project && python -c "
   import sys; sys.path.insert(0, 'doc-convert')
   from convert import convert
   convert('<md_path>', '<output_path>', format='pdf', template='<template>')
   "
   ```

3. 결과 전달: "PDF를 생성했습니다: <output_path>"

## 사용 가능 템플릿

- `default` — 기본 (Malgun Gothic, A4)
- `rwe` — RWE 감사 문서
- `sop` — SOP 문서

## 에러 시

- Chromium 미설치 → "playwright install chromium 실행이 필요합니다"
- 빈 파일 → "유효한 마크다운 파일이 아닙니다"
