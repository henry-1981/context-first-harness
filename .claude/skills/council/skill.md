---
name: council
description: >
  Collect and synthesize opinions from multiple AI agents. 여러 AI 에이전트의 의견을
  수집하고 합성하는 멀티 페르소나 스킬. Use when users say "summon the council",
  "ask other AIs", "council 소환", "다른 AI한테 물어봐", or want multiple AI perspectives
  on a question. Triggers: agent council, 에이전트 카운슬, 멀티 페르소나, 의견 합성,
  council 소환
origin: "Forked from team-attention/plugins-for-claude-natives (MIT License) — https://github.com/team-attention/plugins-for-claude-natives"
---

# Agent Council

여러 관점을 수집하고 하나의 답변으로 합성한다.

## 모드 선택

| | Basic | Extended (권장) |
|---|---|---|
| **동작 방식** | 하나의 AI가 여러 역할을 수행 | 서로 다른 AI 모델이 각자의 관점을 제시 |
| **다양성** | 시뮬레이션 — 같은 모델, 다른 프롬프트 | 실제 — 다른 학습 데이터, 다른 추론 방식 |
| **설정** | 없음 | CLI 설치 + 모델별 인증 |
| **적합한 용도** | 빠른 브레인스토밍, 단순 질문 | 중요한 의사결정, 심층 기술 리뷰, 전략 |

**Extended 모드가 중요한 이유**: 단일 AI가 "비평가 역할"을 하면 자기 자신에게 동의하는 경향이 있다. 서로 다른 모델(GPT, Gemini, GLM)은 학습 데이터, 추론 패턴, 사각지대가 실제로 다르므로 더 강한 이견과 풍부한 합성을 만들어낸다.

**모드 결정 방식**: config 파일을 찾아 읽고, `command` 필드가 있는 멤버가 정의되어 있으면 extended 모드를 사용한다. 그렇지 않으면 basic 모드로 동작한다.

## Step 0: Config 탐색 (필수 — 모드 결정 전 반드시 실행)

**이 단계를 건너뛰면 extended 모드가 있어도 basic으로 fallback하는 오류가 발생한다.**

다음 순서로 `council.config.yaml`을 탐색한다:

1. **스킬 디렉토리**: 이 SKILL.md가 위치한 디렉토리 (예: `~/.claude/skills/council/council.config.yaml`)
2. **프로젝트 루트**: 현재 작업 디렉토리
3. **Glob 전체 탐색**: `Glob("**/council.config.yaml")` — 위 두 곳에 없을 때만

```
Config 탐색 → 파일 발견 → Read로 내용 확인 → members[].command 존재 여부 → 모드 결정
Config 탐색 → 파일 없음 → Basic 모드
```

**구현**: Read 도구로 스킬 디렉토리의 config를 먼저 시도한다. 파일이 없으면 프로젝트 루트, 그래도 없으면 Glob 검색.

## Basic 모드 워크플로우

스크립트나 의존성이 필요 없다. 호스트 에이전트가 모든 것을 처리한다.

1. `council.config.yaml`을 읽는다 (Step 0에서 찾은 파일. 없으면 기본 페르소나 사용)
2. `personas`에 정의된 각 페르소나에 대해:
   - 페르소나의 `system_prompt`를 역할로 적용
   - 해당 관점에서 사용자의 질문에 대한 응답 생성
   - 페르소나 이름과 이모지로 응답 라벨링
3. 모든 페르소나 응답이 생성된 후 합성:
   - 합의점과 이견을 식별
   - 각 관점에서 가장 강력한 논거를 강조
   - 균형 잡힌 최종 권고안 제공

### 기본 페르소나

| Persona | 역할 | Emoji |
|---------|------|-------|
| strategist | 대안 비교, 트레이드오프 강조, 방향 제시 | 💎 |
| critic | 결함, 리스크, 간과된 이슈 식별 (Critical/Warning/Minor) | 🤖 |
| user-advocate | 최종 사용자 관점에서 UX, 가치, 실제 사용성 판단 | 👤 |

### Basic 모드 응답 형식

```
## Council Responses

### 👤 User-Advocate
[사용자 관점의 응답]

### 🤖 Critic
[critic 관점의 응답]

### 💎 Strategist
[strategist 관점의 응답]

## Synthesis
**합의**: [관점 간 일치하는 핵심 사항]
**이견**: [관점 간 불일치하는 사항과 각 입장]
**권고**: [균형 잡힌 최종 권고안]

## Narrator Summary
합성 완료 후, narrator Agent(subagent_type: narrator)를 호출하여 council 결과를 비기술 청중이 이해할 수 있도록 평이하게 설명한다.
```

## Extended 모드 워크플로우

각 멤버가 실제 AI CLI를 병렬로 실행한다 — 역할극이 아닌 진정으로 독립적인 의견을 얻을 수 있다. 최소 하나의 외부 AI CLI가 필요하다.

스크립트 레이어 없이, 호스트 에이전트가 직접 오케스트레이션한다.

### Step 1: 멤버별 프롬프트 구성

config의 각 멤버에 대해 다음을 조합한다:

```
{persona의 system_prompt}

---

{사용자의 원래 질문}
```

### Step 2: 병렬 호출

모든 멤버를 **병렬 Bash 호출**로 동시 실행한다. 멤버의 `type`에 따라 호출 방식이 다르다.

#### CLI 멤버 (`command` 필드가 있는 멤버)

`command` 뒤에 조합된 프롬프트를 마지막 인자로 전달한다:

```bash
# gemini
gemini -p "조합된 전체 프롬프트"

# codex
codex exec "조합된 전체 프롬프트"
```

#### API 멤버 (`type: api` 멤버)

curl로 Anthropic-compatible API를 직접 호출한다. persona의 system_prompt는 `system` 필드로, 사용자 질문은 `messages`로 분리한다:

```bash
response=$(curl -s --max-time {timeout} {endpoint} \
  -H "x-api-key: ${api_key_env의 값}" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "{model}",
    "max_tokens": 4096,
    "system": "{persona의 system_prompt}",
    "messages": [{"role": "user", "content": "{사용자의 원래 질문}"}]
  }' 2>&1)
echo "$response"
```

**주의**: curl 출력을 파이프(`|`)로 직접 파싱하지 말 것. Claude Code의 출력 새니타이징으로 JSON 키의 따옴표가 제거되어 파싱이 실패한다. 반드시 변수에 캡처한 후 처리한다.

응답에서 `.content[0].text`를 추출하여 결과로 사용한다.

#### 호출 유형 판별

```
member.type == "api"  → API 호출 (curl)
member.command 존재    → CLI 호출 (command + prompt)
둘 다 없음             → 건너뜀
```

**실행 규칙**:
- **포그라운드 병렬 호출 필수**: 모든 멤버의 Bash 호출을 하나의 메시지에서 동시에 실행한다 (`run_in_background: false`). `run_in_background: true`로 띄운 뒤 `TaskOutput`으로 대기하는 혼용 패턴은 금지 — 이중 알림(TaskOutput 결과 + task-notification)이 발생한다
- 각 Bash 호출의 timeout은 config의 `settings.timeout` 값(초 → ms 변환)을 사용한다
- CLI가 없거나 API 호출이 실패하면 해당 멤버를 `error`로 기록하고 계속 진행한다
- 일부 멤버가 실패해도 성공한 멤버의 결과로 합성을 진행한다

### Step 3: 결과 수집 및 합성

모든 병렬 호출이 완료되면 chairman(호스트 에이전트)이 결과를 합성한다:
- AI 모델 간 합의와 이견을 식별
- 각 모델이 제공하는 고유한 인사이트를 기록
- 최종 권고안 제공

## 합성 규칙

모든 모드에서 반드시 지켜야 하는 불변 규칙이다.

1. **전원 대표** — 모든 페르소나/멤버의 관점이 합성에 반영되어야 한다. 어떤 응답도 무시하지 않는다
2. **원문 보존** — 사용자의 원래 질문 프레이밍을 왜곡하지 않는다
3. **이견 표면화** — 의견 불일치를 매끄럽게 다듬지 않는다. 이견은 명시적으로 드러낸다
4. **chairman 중립** — chairman은 어떤 단일 관점도 편향되게 지지하지 않는다
5. **출처 명시** — 합성에서 특정 주장을 인용할 때 어떤 페르소나/모델의 의견인지 표기한다

## Extended 모드 응답 형식

```
## Council Results

| Member | Model | Status | Key Insight |
|--------|-------|--------|-------------|
| [name] | [CLI] | done/error | [1문장 핵심 인사이트] |

### [emoji] [member-name] ([model])
[해당 멤버의 전체 응답 요약]

(각 멤버별 반복)

## Chairman Synthesis
**합의**: [모델 간 일치하는 핵심 사항]
**이견**: [모델 간 불일치 — 어떤 모델이 어떤 입장인지 명시]
**고유 인사이트**: [특정 모델만 제기한 중요한 관점]
**권고**: [최종 권고안과 근거]
```

## References

- `references/overview.md` — 워크플로우와 배경
- `references/examples.md` — 사용 예시
- `references/config.md` — 멤버 설정
- `references/setup.md` — 설치 및 셋업 가이드
- `references/troubleshooting.md` — 자주 발생하는 오류와 해결법
- `references/requirements.md` — 의존성 및 CLI 확인
- `references/host-ui.md` — 호스트 UI 체크리스트 가이드
- `references/safety.md` — 안전 관련 참고사항
