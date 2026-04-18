# Wiki Activity Log

wiki의 모든 활동을 시간순으로 기록. LLM이 세션 시작 시 최근 활동을 파악하여 위키 흐름을 이해하는 데 쓴다.

## Schema

```
## [YYYY-MM-DD] action | subject

(필요 시 한두 줄 부연)
```

actions: `ingest`, `query`, `filing`, `lint`, `update`

- **ingest**: 사용자가 sources/에 새 자료 드롭 → LLM이 page 생성
- **query**: 작업 중 wiki 참조 + 답변 합성 (citation 필수)
- **filing**: 대화·작업에서 도출된 가치 있는 지식을 page로 저장
- **lint**: 정합성·교차 참조·stale 감지 검사
- **update**: 기존 page 본문 갱신

---

## [2026-04-18] filing | medical-device-ra-qa-thinking-frame

비개발자 하네스의 첫 사례. 의료기기 RA/QA 업무에서 반복되는 사고 구조를 1부 명시지(자동 적용) + 2부 HITL(확인 필요) 두 층으로 박제. skill + wiki 페어 구조의 첫 instance.
