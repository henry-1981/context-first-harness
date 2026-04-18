---
name: docx
description: >
  MD 파일을 DOCX로 변환. pandoc + python-docx 기반. 템플릿별 스타일 적용.
  Triggers: docx 변환, docx로 만들어, md to docx, DOCX 변환해줘, 워드로 변환
---

# MD→DOCX 변환

MD 파일을 DOCX로 변환한다. 템플릿별 스타일(폰트, 색상, 번호매기기 등) 자동 적용.

## 트리거

자연어 인식:
- "이 MD를 docx로 변환해줘"
- "report.md docx로 만들어"
- "RWE 템플릿으로 docx 만들어줘"
- "워드로 변환해줘"

## 동작

1. 사용자 요청에서 파싱:
   - **파일 경로**: MD 파일 경로 (없으면 질문)
   - **템플릿**: 템플릿명 (없으면 default)
   - **doc_code**: 문서 코드 (rwe 템플릿에서 필요, 없으면 질문)
   - **출력 경로**: 미지정 시 입력 파일과 같은 디렉토리에 `.docx` 확장자

2. 변환 실행:
   ```bash
   cd /c/Project && python -c "
   import sys; sys.path.insert(0, 'doc-convert')
   from convert import convert
   convert('<md_path>', '<output_path>', format='docx', template='<template>', doc_code='<code>')
   "
   ```

3. 결과 전달: "DOCX를 생성했습니다: <output_path>"

## 사용 가능 템플릿

- `default` — 기본 스타일
- `rwe` — RWE 감사 문서 (B스타일, cover 병합, heading 번호매기기)
- `sop` — SOP 문서 (heading 번호매기기)

## 하위호환

기존 `/docx` 커맨드 (`.claude/commands/docx.md`)의 기능을 완전히 대체한다.
기존 커맨드는 rwe 템플릿 고정이었으나, 이제 템플릿 선택이 가능하다.

## 에러 시

- pandoc 미설치 → "pandoc이 필요합니다"
- 빈 파일 → "유효한 마크다운 파일이 아닙니다"
