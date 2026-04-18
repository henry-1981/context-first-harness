# rules/binary-files.md

바이너리 문서(docx, xlsx, xlsm, pdf, hwp) 처리 규칙.

## 읽기·쓰기 도구

- **docx**: `python-docx`로 읽기·쓰기. "바이너리라 못 읽는다" 단정 금지
- **xlsx/xlsm**: `openpyxl`로 읽기·쓰기
- **pdf**: 읽기 `pdfplumber` / 쓰기 Playwright HTML→PDF
- **hwp**: Windows에서 HWP MCP (COM 자동화), 한컴오피스 필수

## 도구 우선순위

docx 처리 시:
1. `docx` 스킬 (pandoc + python-docx 기반 MD 변환)
2. `word` MCP 서버 (테이블 셀 편집, 서식)
3. 직접 코딩 (python-docx)

위 3단계 순서 유지. 스킬로 되는 작업을 직접 코딩하지 않는다.

## changelog 규칙

- **의무**: 바이너리 파일 수정 시 `{stem}_changelog.md`를 **동일 디렉토리**에 업데이트
- **최소 기록**: 시트명, 행/셀 위치, before/after 요약, 사용 도구, 수정 일자
- **이유**: git diff로 바이너리 변경 추적 불가, MD 로그가 유일한 기록

## docx 스타일 (사용자 선호)

### 테이블
- 헤더 행: 배경 `#F2F2F2`, bold, 가운데 정렬
- 데이터 행: 배경 없음, 첫 열 가운데 정렬
- 테두리: single, sz=4, full grid
- 너비: 100% (pct 5000)

### Heading
- H1/H2/H3 색상: 검정 통일 (RGBColor 0,0,0)
- H1 → H2 → H3 → bullet (최대 3단계 + 글머리)
- H4 이상은 별도 문서로 분리

### 본문 정렬 (B스타일)
- **본문(body)**: heading 레벨 무관, **H1 기준 왼쪽 마진 정렬** (indent 0)
- 즉, H2/H3 아래 본문도 들여쓰기하지 않음

### 구분선
- 문서 내 구분선(hr) 사용 금지. 섹션은 heading으로만 구분

## Google Docs 업로드

MD → Docs 변환은 **Drive API upload**를 사용한다. `batchUpdate` 금지.

```bash
gws drive files update \
  --params '{"fileId": "DOC_ID"}' \
  --upload "path/to/file.md" \
  --upload-content-type "text/markdown"
```

- `batchUpdate` 금지 이유: 구조 파싱·텍스트 변환·헤딩 위치 계산 스크립트 필요, 표 서식 손실, 인코딩 오류 다발

## HWP MCP 사용 규칙 (Windows)

- **사용 금지 도구:**
  - `hwp_create_complete_document`: 표 포함 시 본문 전체가 하나의 셀로 병합되는 버그
  - `hwp_create_table_with_data`: 표 오브젝트 생성 실패 (silent failure)
- **표 삽입 권장 패턴:** `hwp_insert_table`(빈 표) → `hwp_fill_table_with_data`(데이터 채우기)
- **미지원:** 표 너비 제어 (fork 후 추가 예정)

## 보안

- `.env`, 서비스 계정 JSON 등 시크릿 파일을 Read/cat/Bash로 읽지 않는다 (~/.claude/CLAUDE.md Security 섹션 참조)
