# wrap skill — Observations

wrap 스킬 자체의 라이브 운영 관찰·튜닝 로그. 사용자는 거의 보지 않음. 스킬이 자기 진화 참조용.

## [2026-04-17 ~ 2026-04-18] stale next 스캔 라이브 관찰 4회차

**배경**: wrap Phase 3-4가 새 next memory 덮어쓰기만 하고 완료 감지 루프가 없어서 memory가 write-only 저장소화되는 패턴 감지(2026-04-16 심야). Phase 2-7 "stale next 스캔" + 4분류(종료/trim/유지/검토) 도입.

**1회차 (2026-04-17 저녁)**: 6건 수집, 유지 5건, 검토 1건(project_design_refs_next). 병행 세션 auto-commit 발동(778e1a6), `--skip-commit` 필요.

**2회차 (2026-04-17 후속)**: 5건 수집, 전부 "유지" 판정. 분류 기준 OK. 단일 세션 + 명시 commit으로 오염 회피. session_owner 설정 메모리 정상 처리 확인 (동일 owner 세션이라 제외 미발동).

**3회차 (2026-04-18 secall 라벨 큐레이션 wrap)**: 7건 수집 전부 "유지". session_owner 빈 문자열 2건 정상 처리 ("모든 세션 정리 권한"으로 해석). 병렬 세션 충돌(사용자 직접 `c494c83` commit으로 working tree 덮어씀) 관찰 — wrap 시점 감지 불가, 편집 중간 체크포인트가 올바른 위치라는 관찰.

**4회차 (2026-04-18 원칙 3 P2 Chunk 2·3 완료 wrap)**: 8건 수집, 7건 유지 + **1건 종료 판정 첫 실발동** (`project_wiki_principle3_p2_next.md`). 본인 세션이 완수한 next를 스스로 종료 권장하는 첫 사례.

**session_owner 테스트 상태**: 동일 owner 정상 처리 + 빈 문자열 정상 처리 확인. 다른 세션이 소유 메모리 만나는 시나리오는 미관찰. 규약화 보류.

**분류 기준 4회 반복 검증 OK**: 오탐·놓침 없음.

## [2026-04-18] SSOT 전환 — stale next scan 기능 폐지 봉인

spec `2026-04-18-session-entry-ssot-design` 반영. wrap Phase 2-7 "Stale next 스캔" 섹션 전체 삭제 + Phase 3-4 "_next.md write" 섹션 삭제. `_next.md` 카테고리가 사라지면서 이 기능 자체가 무의미.

대체:
- 다음 세션 진입 시그널은 **handoff 단일 SSOT**로 통합
- wrap Phase 2-3 "세션 → Handoff 매핑"이 handoff touch/create/delete 결정
- handoff stale 감지는 **세션 시작 hook**이 전담 (wrap과 타이밍 분리)

위 4회차 관찰 data는 history retention 목적으로만 보존. 이후 stale next scan 관련 튜닝은 수행하지 않는다.
