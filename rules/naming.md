# rules/naming.md

파일·폴더 명명 및 인코딩 규칙.

## kebab-case 기본

- **파일명**: kebab-case (영문 소문자 + 하이픈)
- **폴더명**: kebab-case (영문)
- **예외**: 프로젝트 루트의 대문자 관습 파일 (README.md, CLAUDE.md, LICENSE 등)

## 날짜 Prefix 패턴

- **노트·회의록**: `notes/YYYY-MM-DD_{topic}.md`
- **spec·plan**: `YYYY-MM-DD-{topic}-{type}.md` (선택)
- **log 항목**: `## [YYYY-MM-DD] action | subject`

## 한글 파일명

### NFD → NFC 변환

- **원칙**: 한글 파일명은 NFC 정규화된 상태로 저장
- **주의**: macOS 출처 파일은 NFD일 가능성 높음 (자소 분리)
- **검증**: refs/에 파일 추가 시 NFC 여부 확인 필요

## 영문 슬러그 규칙

- 활동 유형 접두사 권장: `lecture-` (강의), `committee-` (전문가 협의체), `consulting-` (자문)
- 예: `llm-dmd-guideline/`, `dmd-change-mgmt-guideline/`

## 파일 확장자

- Markdown: `.md`
- 바이너리 원본: 원본 확장자 유지 (.pdf, .hwp, .docx, .xlsx, .xlsm)
- 생성된 docx: `{stem}.docx` (MD와 동일 stem 유지)
- changelog: `{stem}_changelog.md`

## 금지

- 공백 포함 파일명 (한글 공백 포함)
- 특수문자 `!@#$%^&*()+=[]{}|\\:;"'<>,?/` (하이픈과 언더스코어만 허용)
- 대문자 혼용 (예외: README, CLAUDE.md 등 관습 파일)
