# rules/

모노레포 전역 규칙. Root `CLAUDE.md`에서 `@rules/*.md`로 자동 임포트된다.

## 카탈로그

| 파일 | 적용 범위 | 요약 |
|------|----------|------|
| [content-writing.md](content-writing.md) | 산출물 작성 (대화 제외) | 번역투·AI 슬롭 금지, 사용자 voice, 한영 병기 |
| [naming.md](naming.md) | 파일·폴더·인코딩 | kebab-case, 날짜 prefix, NFD→NFC, PowerShell 한글 |
| [binary-files.md](binary-files.md) | docx/xlsx/xlsm 처리 | 읽기/쓰기 도구, changelog, 스타일 규칙 |
| [qms-sop.md](qms-sop.md) | SOP·QMS 작업 | 단일 소스, MD→docx, 문서 코드 검증, B스타일 |
| [workflow.md](workflow.md) | 모든 작업 | 클론 우선, 관찰 우선, 모드 구분, 법률 완독 |
| [handoff.md](handoff.md) | 세션 간 작업 재개 | 2-location 저장, 자동 스캔, Phase 1~3 조사·제안 프로토콜 |
| [session-entry.md](session-entry.md) | 세션 첫 응답 | handoff-scan 수동 실행 프로토콜, hook 주입 실패 우회 |

## 사용

- **자동 로드**: Root CLAUDE.md가 전부 `@rules/*.md`로 임포트한다. sub CLAUDE.md에서 별도 참조 불필요.
- **Sub 특수 규칙**: 각 sub CLAUDE.md는 도메인 특수 규칙만 둔다. rules/와 중복 금지.
- **충돌 시**: sub CLAUDE.md가 rules/를 오버라이드한다 (CLAUDE.md hierarchy와 동일).

## 신규·수정

1. 새 규칙이 3개 이상 sub에 중복되거나 모든 프로젝트에 적용되면 rules/로 승격
2. 메모리 feedback 중 "자주 위반 + 도메인 무관 + 위반 시 손실"을 만족하면 rules로 승격
3. rules 파일 신설 시 이 INDEX.md + Root CLAUDE.md 양쪽 갱신

## 승격 히스토리

| 날짜 | 작업 | 출처 |
|------|------|------|
| 2026-04-16 | rules/ 최초 신설 (5개 파일) | Root "콘텐츠 작성 규칙", 루트 SKILL.md, 기존 프로젝트 QMS 원칙, 분산된 kebab-case, 메모리 feedback_* 10건 |
| 2026-04-17 | handoff.md 신설 | 다중 프로젝트 세션 간 연속성 체계 설계 (wrap `_next` 패턴 한계 대응) |
| 2026-04-19 | session-entry.md 신설 | SessionStart hook 주입 실패 우회 — rules 계층에서 handoff-scan 수동 실행 프로토콜 박제 |
