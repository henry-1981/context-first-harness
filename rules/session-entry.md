# rules/session-entry.md

세션 시작 시 Claude가 사용자의 첫 메시지에 응답하기 전 적용하는 프로토콜.

## 세션 첫 응답 프로토콜

### 1. 첫 실행 (첫 메시지 수신 직후, 응답 전)

다음 Bash 명령을 실행한다:

```bash
python .claude/hooks/session-start-handoff-scan.py < /dev/null
```

- 출력은 JSON. 구조: `{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "<markdown>"}}`
- `additionalContext` 필드에 handoff 4섹션 markdown이 담겨 있다

### 2. 첫 응답 형식

`additionalContext`의 섹션을 파싱해 다음 형식으로 첫 응답을 시작한다:

```
안녕하세요.

SessionStart hook이 감지한 상태 요약:
- 진입 후보 (ready) N건: {이름, 이름, ...}
- 휴면 N건: {이름 (blocked/scheduled), ...}
- Stale·손상: {N건 or 없음}

어떤 작업으로 들어갈까요? 후보 중 하나 고르셔도 되고, 새 주제로 시작하셔도 됩니다.
```

각 handoff 이름은 파일명 기준 (`.md` 확장자 제외).

### 3. hands off 예외 — 단순 메시지는 프로토콜 생략

사용자 첫 메시지가 즉답 가능한 단순 요청이면 위 프로토콜을 **생략**하고 바로 응답한다.

- **적용 (프로토콜 실행)**: 새 작업 착수·주제 시작, 직전 세션 연속 재개 표지("어디까지 했지", "그거 다시 보자"), 맥락 필요 여부 모호한 질문, 의사결정 요청
- **생략 (hands off)**: "이 경로 확인", "한 줄 수정", "파일 읽어봐", "docx 변환해줘" 등 scan이 불필요한 즉답형 요청

판단 모호 시 실행 쪽으로 기운다 — 스캔 결과가 답변에 섞여 노이즈가 되기보다 사용자가 "필요 없다" 신호를 주는 게 비용이 낮기 때문.

### 4. 배경 — Claude Code hook 주입 실패 우회

`.claude/settings.json`의 SessionStart hook은 스크립트 발화 + stdout JSON 생성까지 정상 작동하지만, Claude Code가 `additionalContext`를 system-reminder에 주입하지 않는 것으로 관찰됐다 (플러그인 scope hook은 주입되지만 프로젝트 scope는 안 됨, 원인 불명). 이 프로토콜은 hook 주입 실패를 우회해 rules 계층에서 같은 효과를 낸다.
