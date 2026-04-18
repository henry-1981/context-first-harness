---
source: "harness-day1.pdf"
pages: 55
method: claude-vision
converted: "2026-04-16"
sample_role: expected
---

<!-- Page 1 -->

AI NATIVE CAMP

# Harness Engineering #1

AI가 잘 일하는 환경을 설계하는 기술

Team Attention 이호연

<!-- Page 2 -->

# 이호연

**Builder, Team Attention**

- 전) Contents Technologies, Tech Lead
- 전) Terminal X, Tech Lead
- 전) Socar, Senior Data Engineer
- 전) 컨텐츠 크리에이터 (인프런/클래스101 수강생 10K+)

<!-- Page 3 -->

# Team Attention

대한민국 No.1 AI Native Team

- **01** 매달 AI 해커톤 및 행사 기획·운영
- **02** SF · Seoul 동시 해커톤 "랄프톤" 개최 **90팀+** 참여
- **03** Show and Prove Club 운영 실전 Harness, Claude Code as OS 등

Show and Prove · Seoul

Ralphton · SF

<!-- Page 4 -->

CASE STUDY

# Harness 셋업을 해드렸더니, 날아다녔다

비개발자 디자이너의 AI Native Dashboard 도전기

**2위** 대시보드 토큰 사용량

> 도구가 아니라 **환경**이 바뀌면,
> 비개발자도 이만큼 할 수 있다

<!-- Page 5 -->

WHY IT MATTERS

# 내 Harness를 가지고 있다는 것

남의 걸 가져다 쓰는 것만으로는 부족하다 — 내 환경으로 **흡수**할 수 있어야 한다

## STORY 01

**karpathy의 CLAUDE.md가 바이럴됐다**

- → "오, **내 code-review / 계획**할 때도 이거 좋겠다"
- → **subagent** 형태로 뽑아내서 내 워크플로우에서 호출되도록 꽂음

## STORY 02

**gstack의 QA 크롬 인증 import가 잘 돼있네?**

- → "이거 **내 browser agent**에도 필요한데"
- → 핵심 로직만 베껴서 내 browser agent 안에 **통합**

> 남의 Harness는 부품. 내 Harness가 있어야 그걸 조립할 수 있다.

<!-- Page 6 -->

AGENDA · DAY 1

# 이번에 다룰 내용

## PART A — 개괄 & 기초

- 01 Harness Engineering이란
- 02 현재 주요 Harness 생태계 읽기
- 03 유명 Harness들 뜯어보기
- 04 hoyeon Harness 케이스 스터디
- 05 6가지 구조화
- 06 구조 잡기 (Scaffolding)
- 07 맥락 (Context Engineering)

## PART B — 실행 · 검증 · 개선

1. Nudget 서비스 Harness 데모
2. 계획 (Planning)
3. 실행 (Orchestration)
4. 검증 (Verification)
5. 개선 (Compound)

<!-- Page 7 -->

HARNESS ENGINEERING이란

# AI가 알잘딱깔센 일할 수 있도록 구조를 만들어주는 것

프롬프트 한 줄이 아니라, **환경 전체**를 설계해서
AI가 스스로 좋은 판단을 하게 만드는 일

<!-- Page 8 -->

이미 빠른 테크 회사들은

# Harness를 구성하고 있다

모델이 아니라 **환경 설계**가 결과를 바꾼 네 가지 사례

| LangChain BENCHMARK | OpenAI SCALE | Anthropic QUALITY | Stripe THROUGHPUT |
| --- | --- | --- | --- |
| **+14%p** TerminalBench · 52.8→66.5% | **100만** 줄·인간 코드 匹출 | **$9→$200** 같은 모델, 다른 결과 | **1,000** PR/주 · 무인 자동 머지 |
| 같은 모델, 하네스만 바꿔 30위 → Top 5 | 엔지니어 3~7명, 5개월로 달성 | 비기능 → 완성. 차이는 하네스 | 전문화된 소형 에이전트 다수 |
| GPT-5.2-Codex 고정, 셀프 검증 루프 + 컨텍스트 자동 수집 + 둠 루프 탐지. | 5개월을 쓴 곳이 코딩이 아니라 하네스 설계. 5차시 교훈 전부 환경 설계. | 싱글 에이전트 $9 실패 → 3에이전트 $200 완전 동작, 간소화 $124로 품질 유지. | 매 스텝 검증 게이트 + 정밀 컨텍스트 관리. 하네스 없이는 불가능한 규모 |

> 모델 교체로 5% 개선 vs 하네스 설계로 15% 개선 — 후자가 훨씬 현실적이다

<!-- Page 9 -->

진화 흐름

# 대체가 아니라, **포함**이다

Harness Engineering은 **Prompt + Context**를 감싸는 상위 레이어

```
Harness Engineering
= Structure / Workflow Engineering + 아래 전부
  └─ Context Engineering
       └─ Prompt Engineering
            "이렇게 말해봐"
       + 배경지식 · 메모리 · 참고자료 · 출력 포맷
  + 역할 분리 · 작업 흐름 · 검증 게이트 · 재사용 가능한 도구
```

<!-- Page 10 -->

정의

# Harness Engineering

AI가 혼자서도 잘 일할 수 있는 **작업 환경**을 만들어주는 것

**AI의 작업 환경** — 이 네 가지를 담는 하나의 상자

| 01 **맥락** | 02 **제한** |
| --- | --- |
| 뭘 해야 하는지 — 목표·배경지식·참고자료 | 뭘 하면 안 되는지 — 규칙·금지·경계 |
| **03 작업 흐름** | **04 검증** |
| 어떻게 일하는지 — 역할·순서·도구 | 잘 했는지 확인 — 게이트·테스트·회고 |

OpenAI · "사람이 방향을 잡고, 에이전트가 실행한다"    Anthropic · "규율은 스캐폴딩에서 드러난다"

<!-- Page 11 -->

HARNESS ENGINEERING이란

# Harness의 정의는 생각보다 넓다

## 좁은 의미의 Harness

**가드레일 설정**
CLAUDE.md에 DOs/DON'Ts + Hook으로 에이전트에 제한을 건다
예: "테스트 없이 커밋 금지" → Hook이 차단

**목적별 툴셋**
Skill + Agent 조합으로 특정 작업을 효율적으로 수행
예: /bugfix = 진단 → 분석 → 수정 → 검증

**비개발 영역도 가능**
SEO 감사, 콘텐츠 제작, 리서치 등 개발 외 워크플로우도 설계
예: /geo-audit = 기술+콘텐츠+스키마 병렬 분석

## 이 강의에서 말하는 Harness

특정 스킬이나 에이전트 조합이 아니라,
AI 에이전트의 **작업 환경 자체를 설계**하는 것.

맥락, 제한, 흐름, 검증 — 이 모든 것을 포괄하는 개념.

> Anthropic — "Harness의 모든 구성요소는 모델이 혼자서는 못 하는 것에 대한 가정을 담고 있다."

<!-- Page 12 -->

OUTCOMES

# 이번 캠프에서 이런 게 되면 좋겠다

**01 Harness의 큰 그림과 내가 놓쳤던 부분을 이해한다**
다 듣고 나면 **"별거 없네"** 라고 느껴졌으면 좋겠다 — 뿌연 것들이 걷히는 경험

**02 내가 풀고 있는 문제에 대해 워크플로우를 구축하고 자동화 프로세스로 옮긴다**
남의 Harness를 따라 쓰는 걸 넘어서, **내 문제·내 루틴**에 맞게 재조립할 수 있게

<!-- Page 13 -->

현재 HARNESS 생태계 · 축 변화                                           AXIS 1 / 4

# 모든 것을 하나의 그래프로 연결한다

하네스가 단순 도구가 아니라, **내 지식·도구·에이전트가 물리는 바탕(Substrate)**으로 진화 중 — *Personal Knowledge Graph as Substrate*

**GBrain** MCP-HEAVY
**20 MCP + 7 skills 내장**. 외부 소스로 본인을 알게 하는 Her 스타일. 지식/도구/에이전트가 하나의 바탕 위에 물리게 만드는 전형

**LLM-Wiki** CURATOR
**Karpathy식 자동 위키 큐레이터**. 매 쿼리마다 재추론하는 대신, 축적된 지식 그래프에서 **재사용 → 복리화**

<!-- Page 14 -->

현재 HARNESS 생태계 · 축 변화                                           AXIS 2 / 4

# 자가성장 — 하네스가 자기를 고친다

에이전트가 자기 하네스를 **스스로 수정하는 메타 레이어**가 뜨고 있음 — Self-Improving / Self-Designing Harness

**HyperAgents** META-LAYER
**메타 에이전트가 태스크 에이전트를 개선**. 작업을 실행하는 층 위에, 그 층을 고치는 층을 따로 둠

**Hermes Agent** PERSISTENT
**상주하면서 경험을 스킬로 전환**. 쓰던 걸 기억하고 재사용 가능한 기술로 압축 → 시간이 갈수록 강해짐

<!-- Page 15 -->

현재 HARNESS 생태계 · 축 변화                                           AXIS 3 / 4

# 멀티 에이전트 오케스트레이션

~~Conductor — 한 손으로 지휘~~ → **Orchestrator — 역할·모델·CLI를 찢어서 쓴다**

한 에이전트에게 다 맡기던 시대에서 **세 가지 축으로 분리**하는 시대로: **역할/컨텍스트, 모델 믹스, CLI 믹스**. 각각이 다른 병목을 푼다.

**ROLE + CONTEXT SPLIT**
**일을 쪼개서 여러 명에게**
혼자 다 하면 자기 코드를 자기가 검토해서 실수를 못 본다. 짜는 사람·검사하는 사람을 따로 두자.
예: planner → coder → verifier

**MODEL MIX**
**똑똑한 모델 + 빠른 모델**
Opus는 큰 그림·리뷰. Sonnet/Haiku는 반복 작업. 비용·속도·품질을 같이 잡는다.
예: Opus plan → Sonnet ×N exec
→ claude.com/blog/the-advisor-strategy

**CLI MIX**
**멀티 에이전트 CLI**
풀리는 병목: "이 CLI 하나가 모든 걸 잘하지 않는다." 각 CLI가 **잘하는 일을 그대로 호출**하게 엮는다.
`Claude Code` — 코딩·에이전틱 실행
`Gemini CLI` — 문서·장문 맥락 정리
`Codex` — 복잡한 추론·빠른 속도

<!-- Page 16 -->

현재 HARNESS 생태계 · 축 변화                                           AXIS 4 / 4

# 에이전트 표준화 & 공유 레이어

도구/툴 락인을 넘어서는 **휴대 가능한 에이전트 정의** — "어떤 툴에든 호환"이 여기에 가깝다

**Cross-Agent 호환** PORTABLE
opencode · openclaw · codex · Claude Code 등 다양한 에이전트에서 **동일하게 동작**할 수 있는 harness 셋업

**Skill을 넘어서** EXPAND
스킬 단위를 넘어 **워크플로우·메모리 관리 시스템**까지 — 이식 가능한 구성 요소의 범위가 넓어지는 중

<!-- Page 17 -->

STARTING POINT

# Harness는 어디서부터 시작해야 하나?

> **흔한 함정**    있는 것들을 플러그인으로 하나씩 갖다 쓰다 보면 — 컨텍스트는 비대해지고, 정작 뭘 써야 할지 모르게 된다

## 시작점은 결국 **"내가 뭘 할 것인지 + 무엇을 더 잘하게 하고 싶은지"**

**gstack**
*"Solo shipping at team velocity"*
혼자서 팀처럼 출하하기

**gbrain**
*"Her처럼 내 인생을 아는 AI"*
외부 소스로부터 **본인(사용자)**을 알게 만들기

**oh-my-claudecode**
*"토큰을 태워서 폭발적으로"*
여러 모델을 동원해 무식하게 돌려 문제 해결

<!-- Page 18 -->

A SOBERING QUESTION

# Harness는 **항상** 필요할까요?

**01 Harness를 만든다는 것은 생각보다 시간이 든다**
투자 대비 효용을 따져보고 들어가야 한다 — 가벼운 문제엔 가벼운 도구가 맞다

**02 성급한 추상화 금지 — 본인의 문제에서 시작하라**
더 발전되지 않은 상태에서 일찍 Harness부터 만들면 **배보다 배꼽이 커진다**. 필요가 먼저, 구조는 그 뒤에

<!-- Page 19 -->

THE PRECONDITION

# 자신의 **시스템에 대한 이해**가 없으면 100% **AI Slop**으로 빠진다

Harness는 **내 작업 방식의 외화(外化)**다. 내가 뭘 하는지, 어디서 막히는지, 무엇을 잘하고 싶은지 모른 채로 만든 Harness는 — 그냥 **그럴듯해 보이는 산출물을 찍어내는 기계**가 된다.

**이해 없이 만든 HARNESS**
남의 베스트 프랙티스를 복붙 → 내 문제와 안 맞는 구조 → 결과물은 많은데 **어느 것도 내 것이 아님**

**이해 위에 쌓은 HARNESS**
내 병목과 반복 패턴을 먼저 안다 → Harness가 **그 간극만 정확히 메운다** → AI가 내 판단을 증폭시킴

> **먼저 자기를 알라.** Harness는 그다음이다 — 순서가 바뀌면 Slop만 쌓인다.

<!-- Page 20 -->

PART A · 04

# 유명 Harness들 **뜯어보기**

각자의 **철학**이 어떻게 **구조와 동작**으로 드러나는가 — 6개를 한 장씩

**01 gstack**
*"Solo = Team via role decomposition"*
실행 · 역할 분리

**02 oh-my-claudecode**
*"Don't learn the harness, just use it"*
실행 · 검증

**03 ouroboros**
*"Stop prompting. Start specifying."*
명확성 · SPEC-FIRST

**04 llm-wiki**
*"Knowledge, compiled once, kept current"*
지식 복리화

**05 gbrain**
*"Memex, except it builds itself"*
개인 메모리 · 자동화

**06 hermes-agent**
*"Lives where you do"*
상주 · 자가성장

<!-- Page 21 -->

유명 HARNESS 뜯어보기 · 1 / 6                                           ↗ github.com/garrytan/gstack

# gstack    [실행 · 역할 분리]

> *"Solo = Team via role decomposition — 혼자서 팀처럼 출하하기"*

## 시그니처 루프

① `/OFFICE-HOURS`
아이디어 검증 — 6개 질문으로 전제 검증 + 디자인 문서 생성
↓
② `/PLAN-CEO-REVIEW` → `/PLAN-ENG-REVIEW`
CEO·엔지니어 관점으로 계획을 두 번 찢어봄
↓
③ **`/REVIEW` + `/QA`**
Diff 리뷰 + **내 Chrome 로그인으로 자동 QA** → 버그 수정
↓
④ `/SHIP`
테스트 · VERSION · CHANGELOG · 커밋 · PR까지 자동

아이디어부터 PR까지 — **역할별 슬래시 체인**으로 한 사람이 팀처럼

## 핵심 동작

**1 역할별 슬래시 체인**
CEO · 엔지니어 · 디자이너 · QA · 릴리스 — **역할이 바뀌면 컨텍스트도 바뀌어** 직렬 실행

**2 로그인된 상태로 자동 QA**
`/setup-browser-cookies` 로 **내 Chrome의 로그인 쿠키를 그대로 가져와** 자동 브라우저가 실제 사용자처럼 테스트 → 버그 원자 커밋으로 고침

**3 가드레일 스킬**
`/careful /freeze /guard` 로 `rm -rf` · force-push · 지정 폴더 편집 잠금을 harness 레벨에 내장

> 역할을 나누면, 하네스 안에 팀이 생긴다

<!-- Page 22 -->

유명 HARNESS 뜯어보기 · 2 / 6                                           ↗ github.com/Yeachan-Heo/oh-my-claudecode

# oh-my-claudecode    [실행 · 검증]

> *"Don't learn the harness, just use it — 배우지 말고 그냥 써라"*

## 시그니처 루프

① 한 줄 커맨드
`ultrawork refactor the API`
↓
② **병렬 에이전트 LAUNCH**
haiku / sonnet / opus 3-tier로 분배
↓
③ VERIFIER 체인
매 스텝마다 검증이 따라붙음
↓
④ 경험을 파일로
`.omc/` learnings · decisions · issues · problems

## 핵심 동작

**1 병렬 실행 + 역할 분리**
`ultrawork` 로 multiple agents 동시 launch, atomic commit 강제. 3-tier model routing (haiku · sonnet · opus)

**2 여러 Orchestration 모드**
작업 성격에 따라 고를 수 있음 — `team mode` (역할별 병렬) · `agent mode` (단일 전문가) · `ralph mode` (반복 루프) 등

**3 검증 내재화**
verifier · code-reviewer · security-reviewer · visual-verdict 를 실행 파이프에 박아 매 스텝마다 검증이 따라붙음

> 실행·검증을 구조에 박고, 지혜는 파일로 누적한다

<!-- Page 23 -->

유명 HARNESS 뜯어보기 · 3 / 6                                           ↗ github.com/Q00/ouroboros

# ouroboros    [명확성 · Spec-first]

> *"Stop prompting. Start specifying — 시키기 전에, 뭘 원하는지부터"*

## 시그니처 루프

① 모호한 요청
"이런 기능 있었으면 좋겠어…"
↓
② **SOCRATIC 질문 루프**
숨은 가정 노출 → Ambiguity ≤ 0.2까지
↓
③ SPEC 고정
immutable Seed — ontology + criteria
↓
④ 실행 + 3-STAGE 검증
Mechanical → Semantic → Consensus

## 핵심 동작

**1 명확성 게이트**
질문으로 **모호함을 먼저 제거** — Spec이 나오기 전엔 코드로 안 넘어간다

**2 비용을 단계적으로**
싼 모델부터 시도, 실패하면 더 비싼 모델로 자동 승급 — 낭비 없이 품질 확보

**3 "아직 뭘 모르지?"로 재진입**
한 번에 안 되면 빈틈을 다시 물어 **다음 세대 Spec**으로 루프

> AI가 병목이 아니라, 너의 명확성이 병목이다

<!-- Page 24 -->

유명 HARNESS 뜯어보기 · 4 / 6                                           ↗ gist.github.com/karpathy/442a6bf…

# llm-wiki    · Karpathy    [지식 복리화]

> *"Knowledge, compiled once, kept current — 재추론 대신 축적"*

## 시그니처 루프

① 새 소스 1개 투입
아티클·PDF·회의록 하나
↓
② **10~15개 페이지 동시 편집**
엔티티·컨셉 페이지에 한 번에 반영
↓
③ INDEX·LOG 업데이트
모순 플래그 + cross-reference 강화
↓
④ 위키가 복리로 두꺼워짐
질의 답변도 다시 파일로 축적

## 핵심 동작 (3 오퍼레이션)

**1 Ingest**
1 소스 투입 → 요약 작성 + index 업데이트 + 관련 **엔티티·컨셉 10~15개 동시 수정** + 모순 플래그

**2 Query**
index → drill-down → 답변. **좋은 답변은 다시 위키에 파일링** — 탐색조차 복리화

**3 Lint**
주기적 health-check: stale claim · orphan 페이지 · 누락된 cross-reference · 데이터 갭

> 인간은 소싱·질문, LLM은 bookkeeping

<!-- Page 25 -->

유명 HARNESS 뜯어보기 · 5 / 6                                           ↗ github.com/garrytan/gbrain

# gbrain    [개인 메모리 · 자동화]

> *"Memex, except it builds itself — 브레인은 에이전트가 짓고 유지한다"*

## 시그니처 루프

① 사용자 메시지
"지난주 미팅에서 나온 거 뭐였지?"
↓
② 브레인 먼저 조회
엔티티 감지 → 관련 page 읽기
↓
③ 응답
citation과 함께 답변
↓
④ **새 FACT 기록**
citation + back-link 자동. nightly dream cycle로 정리

## 핵심 동작

**1 내 삶의 모든 소스를 한 곳에**
미팅 · 이메일 · 캘린더 · 음성 · 트윗 — 흩어진 정보를 **하나의 Second Brain**으로 모음

**2 에이전트가 스스로 연결**
각 소스는 recipe로 **subagent가 설치·연동** — 사람은 API key만 주고 빠짐

**3 매 대화가 브레인을 키운다**
대화 전에 읽고, 대화 후에 쓴다 — **시간이 갈수록 나를 더 잘 아는 에이전트**가 됨

> 사람이 포기했던 유지보수를, LLM이 0으로 만든다

<!-- Page 26 -->

유명 HARNESS 뜯어보기 · 6 / 6                                           ↗ github.com/NousResearch/hermes-agent

# hermes-agent    · Nous Research    [Self-Improving AI Agent]

> *"A self-improving AI agent — 쓸수록 스스로 진화하는 에이전트"*

## 시그니처 루프

① 어느 채널이든 메시지
Telegram · Discord · Slack · CLI…
↓
② 상주 에이전트 응답
서버리스 · idle 시 하이버네이트
↓
③ TRAJECTORY 수집
대화·행동 전체 기록
↓
④ **새 SKILL 자동 추출**
경험에서 재사용 가능한 기술 생성 + RL 학습 데이터로 환류

## 핵심 동작

**1 반복 작업을 스킬로 추상화**
자주 하는 일의 흐름을 모아 **재사용 가능한 skill**로 자동 전환

**2 쓸수록 스킬이 다듬어진다**
사용 중 발견되는 개선점이 다시 skill에 반영 — **내 워크플로우가 모양을 잡아간다**

**3 어디서든 같은 에이전트**
Telegram · Discord · Slack … 채널이 달라도 **기억·스킬은 이어진다**

> 쓸수록 하네스가 자기를 고친다

<!-- Page 27 -->

CASE STUDY · 내 HARNESS                                                ↗ github.com/team-attention/hoyeon

# hoyeon — 그냥 **내가 쓰려고 모은 것**

처음부터 "시스템을 만들자"가 아니었다 — **개발하면서 쓰던 것들을 모으고 다듬은 결과물**

## 만든 이유

① 다른 것들 써봐도 **어딘가 제대로 안 돌고 버그가 남** — 내 워크플로우와 미묘하게 어긋남

② 그래서 **내가 개발하면서 쓰던 패턴들**을 하나씩 모으고 개선 → 어느 순간 harness 형태가 됨

③ 목표는 거창하지 않았다 — **"내 손에 맞는 연장"** 하나 갖는 것

<!-- Page 28 -->

MY HYPOTHESIS

# 엔지니어링 Harness의 **가설**

엔지니어링 작업에서 AI가 **제대로 된 결과물**을 내놓게 하려면 — 결국 이 세 가지가 맞물려야 한다

**01 사용자의 Requirements를 명확하게 수집한다**
무엇을 만들어야 하는지부터 정확히 — 모호함은 이후 단계로 증폭된다

**02 빠짐없이 작업하도록 작업 완료의 기준을 촘촘하게 세운다**
"다 됐다"의 정의를 미리 못 박아야 AI가 놓치는 것을 붙잡을 수 있다

**03 검증이 제대로 될 때까지 반복적으로 구현한다**
한 번에 되는 게 아니라 — 검증 통과까지 루프를 돌리는 구조로 설계한다

<!-- Page 29 -->

CASE STUDY · 구성 (1/2)                                                ↗ github.com/team-attention/hoyeon

# 어떻게 구성되어 있나 — 4 그룹의 스킬

역할이 다른 스킬을 **4 그룹**으로 묶어 관리. 코어는 **Engineering**.

**Opinion Collector**
다관점 의견 수렴
`council` · `tribunal`
`deep-interview` · `discuss` · `stepback`

**Research**
외부·내부 정보 수집
`deep-research` (Google Search base)
`dev-scan` (Google · X · Reddit · Thread 순회)
`reference-seek` · `tech-decision`

**Engineering** ★ 코어
스펙 → 실행 파이프라인
`specify` · `execute` · `ultrawork`
`bugfix` · `scope` · `scaffold` · `qa`

**Loop / Meta**
반복 · 메타 도구
`ralph` (DoD) · `rulph` (rubric)
`compound` · `mirror`

<!-- Page 30 -->

CASE STUDY · 워크플로우 (2/2)                                           ↗ github.com/team-attention/hoyeon

# 어떻게 돌아가나 — 한 흐름

정의 → spec → 실행 → 검증 → 반복 → 축적. 코어(②③④)가 파이프라인의 중심.

① **정의** — 요구가 모호할 때 — `deep-interview` · `discuss`
↓
② **Spec** — `specify` — L0 Goal → L4 Tasks → `spec.json`
↓
③ **실행** — `execute` — dispatch · work 2축
↓
④ **검증** — `verify` — 각 태스크 완료 기준을 agent가 자동 확인
↓
⑤ **반복** — `ralph` (DoD) · `rulph` (rubric 기반 자가 개선)
↓
⑥ **축적** — `compound` — 학습을 `docs/learnings/` 로

<!-- Page 31 -->

CASE STUDY · 다음 스텝                                                 ↗ github.com/team-attention/hoyeon

# 앞으로 어디를 개선할까

지금 구조의 한계를 본 지점 세 가지 — **모델이 좋아진 만큼, 하네스도 얇아지고 있다**

**01 포맷**
**JSON → Markdown**
모델이 처리할 수 있는 컨텍스트가 커짐 → spec을 JSON 틀에 가두지 말고, `.md`로 확장성 있게 — 가독성·편집성 함께 향상

**02 누적**
**Compounding 구조 강화**
auto-memory를 보완. **AI의 시행착오**(작업·실행 중)와 **사람의 시행착오**를 같이 컨텍스트화 — 실수가 다음 세션의 재료가 되도록

**03 검증**
**Verification Hallucination 줄이기**
agent가 더 **스스로 작업·탐색**해서 판단하게. 검증이 허위로 통과되지 않게 — 현재 하네스의 가장 큰 약한 고리

<!-- Page 32 -->

큰 그림

# Harness의 6개 축 — 순환 구조

```
[구조 Scaffolding]  →  [맥락 Context]  →  [계획 Planning]
       ↑                                        ↓
[개선 Compounding] ← [검증 Verification] ← [실행 Execution]
```

- **구조 Scaffolding** — 뭘 깔아두는가
- **맥락 Context** — AI가 뭘 아는가
- **계획 Planning** — 뭘 할지 정하는가
- **실행 Execution** — 어떻게 시키는가
- **검증 Verification** — 어떻게 믿는가
- **개선 Compounding** — 어떻게 나아지는가

<!-- Page 33 -->

큰 그림

# Harness의 **6개 축** — 각자 다른 질문에 답한다

구조 → 맥락 → 계획 → 실행 → 검증 → 개선 → (다시) 구조. 이 순환이 한 바퀴 돌 때마다 Harness가 단단해진다.

**01 구조 · SCAFFOLDING**
*"뭘 깔아두는가?"*
폴더링·도구 배치·경계. `skills/` · `hooks/` · `agents/` · `MCP` 를 user · project · plugin 중 어디에 둘지.

**02 맥락 · CONTEXT**
*"AI가 뭘 아는가?"*
`CLAUDE.md` · auto-memory · rules. 무엇을 기억시키고, 어떻게 점진적으로 노출할지.

**03 계획 · PLANNING**
*"뭘 할지 정하는가?"*
"해줘"가 아니라 spec/plan으로. `AskUserQuestion` · 요구 분해로 모호성을 먼저 없앤다.

**04 실행 · EXECUTION**
*"어떻게 시키는가?"*
혼자 / 부하 파견 / 팀. subagent·orchestration으로 작업을 어떻게 배치할지.

**05 검증 · VERIFICATION**
*"어떻게 믿는가?"*
기준 · 분리된 관점 · 독립 검증자. 컨텍스트와 모델을 나눠서 스스로를 속이지 않게.

**06 개선 · COMPOUNDING**
*"어떻게 나아지는가?"*
관측 → 단순화 → 축적. 세션의 학습과 규칙을 다음 세션으로 복리화.

<!-- Page 34 -->

# 01

# 구조 (Scaffolding)

프로젝트 구조, 도구 배치, 경계 설정 — 한 번 해두면 계속 쓰는 것

<!-- Page 35 -->

구조(SCAFFOLDING)

# 프로젝트 구조 설계

**1 Monorepo로 묶기**
소스코드, 문서, 테스트, 설정을 하나의 프로젝트에서 관리. AI가 전체 맥락을 한눈에 파악할 수 있다.

**2 역할별 폴더링**
목적이 명확한 폴더 구조. AI가 어디에 뭘 넣어야 하는지 바로 안다.

**3 아키텍처가 퀄리티를 결정**
코드의 아키텍처가 잘 잡혀 있으면, 시간이 갈수록 AI 산출물의 퀄리티가 올라간다.
*clean arch → consistent output*

> 프로젝트 구조를 잘 설계하면, **AI는 그 구조에 맞춰 따라간다**

<!-- Page 36 -->

구조(SCAFFOLDING)

# Agent의 **output 폴더**도 구조로 잡기

AI는 작업할 때마다 파일을 쏟아낸다 — **수집한 데이터, 분석 결과, 세션 간 핸드오프 메모**.
둘 곳이 없으면 **소스 트리 여기저기에 흩어지고** 다음 세션에서 사라진다.

**COLLECT · 수집 데이터**
스크래핑·로그·샘플 등 **원본 그대로** 쌓아두는 곳. 재가공은 다른 폴더에서.
`.dev/data/`

**ANALYZE · 분석 결과**
리서치·요약·리포트. **사람이 읽을 수 있는 산출물**. 재생성 가능해도 따로 보관.
`.dev/reports/`

**HANDOFF · 세션 핸드오프**
spec·TODO·lesson-learned 등 **다음 에이전트에게 넘기는 메모**. 대화 밖에서도 컨텍스트가 산다.
`.dev/handoff/`

> AI가 **어디에 쌓을지 모르면 아무 데나 쌓는다** — 자리를 먼저 만들어 두자

<!-- Page 37 -->

구조(SCAFFOLDING)

# 뭘 깔아두는가?

구조 = 폴더링 · 도구 배치 · 경계. 세 질문으로 쪼개면 명확해진다.

**1 FOLDERING**
**사람의 문서 · AI의 문서를 어떻게 나눌까**
코드·문서·테스트·AI 설정이 섞이지 않게. 이름은 자유, 원칙은 **역할별 격리**.

**2 PLACEMENT**
**도구를 어디에 둘까**
`Skills` · `Hooks` · `Agents` · `MCP`
같은 도구라도 user · project · plugin 어디에 두냐에 따라 공유 범위가 달라진다.

**3 BOUNDARY**
**AI가 뭘 알고 어디까지 하게 할까**
`CLAUDE.md`로 알리고, permission으로 허용하고, hook으로 막는다.

> 정답은 없다. **처음엔 모아두고, 문제가 느껴질 때 쪼개라** — 미리 나누지 말고, 불편해진 지점부터 분리하는 방식을 고민한다.

<!-- Page 38 -->

Q1 · FOLDERING

# 사람의 문서 vs AI의 문서 — 분리해서 관리

분리하지 않으면, 사람이 관리를 멈춘 순간 AI도 엉뚱한 맥락으로 일한다

## 사람이 관리 · 비즈니스의 진실

**`docs/`**
- 비즈니스 룰 · 도메인 정의
- 체크리스트 · 온보딩 가이드
- 아키텍처 · 의사결정 기록

## AI가 남기는 기록 · 작업의 흔적

**`.dev/`**
- learnings · troubleshooting 기록
- 작업 로그 · 디버깅 히스토리
- 실험 결과 · 스크래치패드

---

아래 설정 파일들이 위 문서를 참조하고 지탱한다

**`CLAUDE.md`**
프로젝트 지도 (~100줄)
docs/와 rules/로 포인팅

**`.claude/rules/`**
코딩 규칙·테스트 컨벤션
glob 패턴으로 조건부 로드

**`.claude/skills/`**
반복 작업 레시피
`/commit`, `/review` 등

**...**
hooks, agents, MCP, plugins 등

> 위: 콘텐츠(사람+AI) / 아래: 설정(AI 행동 규칙). **docs/는 사람의 책임**

<!-- Page 39 -->

Q2 · PLACEMENT

# 어디에 둘까 — User · Project · Plugin

판단 기준: **나만 쓰나 · 팀이 쓰나 · 세상에 공유하나**

| 도구 | User `~/.claude/` | Project `.claude/` (git 커밋) | Plugin `.claude-plugin/plugin.json` |
| --- | --- | --- | --- |
| **Skills** `/command` | 내 개인 루틴 `/commit`, `/wrap` | 프로젝트 컨벤션 기반 `/deploy-staging` | 팀·커뮤니티 배포 `/my-plugin:review` |
| **Hooks** 자동화 | 보편적 알림·차단 (내 모든 프로젝트) | 프로젝트 금지사항 (팀 전체 적용) | 번들된 자동화 (plugin과 함께 on/off) |
| **Agents** 전문가 | 개인 전문가 풀 (리뷰어, 디버거) | 도메인 전문가 (이 프로젝트 아키텍트) | 재사용 에이전트 (공유 가능한 역할) |
| **MCP** 외부 연결 | 내 개인 계정 (Gmail, Notion) | 팀 공용 시스템 `.mcp.json` 체크인 | plugin 내부 제공 (설치 시 자동) |

> **승격 전략 — 표준형(`.claude/`)으로 시작 → Plugin으로 올리기**
> Plugin으로 승격할 때는 **user · project 레벨 중복부터 정리**. 같은 skill·hook이 두 곳에 남으면 충돌·블랙박스의 원인이 된다.

<!-- Page 40 -->

Q3 · BOUNDARY

# 경계 설정하기

AI가 뭘 알고, 어디까지 하고, 뭘 하면 안 되는지를 정해주는 것

| 뭘 알려줄까 | CLAUDE.md에 프로젝트 규칙, 코딩 스타일, 금기사항 작성 | `CLAUDE.md` · `rules/` |
| --- | --- | --- |
| **어디까지 허용할까** | Permission Mode로 자동 허용 범위 설정 (plan / auto / bypass) | `settings.json` |
| 뭘 막을까 | Hook으로 위험한 명령을 실행 전에 자동 차단 | `.claude/hooks/` |

> **TIP · Hook 블랙박스 주의 — plugin 많이 깔수록 위험해진다**
> Plugin·user·project 설정이 합쳐지면 hook이 중복·충돌해 **원인 모를 버그**가 된다. 주기적으로 `/hooks` 로 점검 — 출처 라벨(`User` · `Project` · `Plugin`)이 표시된다. **내가 깐 건 내가 책임진다**는 원칙으로, 안 쓰는 plugin·hook은 비워라.

<!-- Page 41 -->

Q3 · BOUNDARY — DEEP DIVE

**TIP**

# 복잡도 있는 프로젝트라면 — 코드 아키텍처가 AI 품질을 결정한다

CLAUDE.md·rules·hook은 경계를 잡아주지만, **코드 구조 자체가 엉망이면 AI도 엉망으로 짠다**. 레이어·의존성 방향·모듈 경계가 명확할수록 AI는 기존 패턴을 복제해 일관되게 짠다.

**만들 게 구체화되어 있다면**
**처음에 아키텍처를 잡고 시작하라**
도메인·레이어 분리, 폴더 경계, 의존성 방향을 **미리 결정**. AI가 새 기능을 추가할 때 **기존 패턴을 복제**하는 방식으로 움직이도록.
*초기 한 번의 설계가 수백 번의 수정을 절약한다*

**AI가 말을 안 들을 때**
**코드 수준에서 아키텍처를 재점검하라**
같은 지시를 해도 결과가 엉키면 대부분 **코드 구조의 문제**. 규칙을 더 쓰지 말고 **리팩토링 계획**부터 세워라 — 경계가 없는 곳엔 규칙도 안 먹는다.
*규칙 추가 << 구조 정리*

> **핵심:** AI 품질 = Harness 설정 × **코드 아키텍처**. 둘 중 한쪽이 0이면 곱도 0이다.

<!-- Page 42 -->

**TRY IT**    구조(Scaffolding)

# 구조 설계를 도와주는 스킬

처음 프로젝트를 셋업할 때, 그리고 기존 Harness를 점검할 때

## `/scaffold`
SKILL · HARNESS PLUGIN

프로젝트 초기 구성을 자동으로 잡아주는 스킬. CLAUDE.md, rules, 폴더 구조까지 한 번에 생성.
[Link]

## `/check-harness`
SKILL · HARNESS PLUGIN

현재 프로젝트의 Harness 상태를 체크리스트로 진단. 빠진 설정, 개선 포인트를 알려준다.
[Link]

## `/skill-creator`
ANTHROPIC 공식 PLUGIN

스킬을 만들고 성능을 높이세요. Anthropic에서 제공하는 공식 스킬 생성 도구.
[Link]

> **Harness 플러그인**을 user 레벨(`~/.claude/`)에 설치하면 모든 프로젝트에서 `/scaffold`, `/check-harness`를 바로 쓸 수 있습니다

<!-- Page 43 -->

# 02

# 맥락

CLAUDE.md, 규칙, 점진적 노출 — AI가 뭘 알고 일하는가

<!-- Page 44 -->

맥락

# 설정 파일 한눈에 보기

아래로 갈수록 범위가 좁고, 우선순위가 높습니다 · 하위 파일은 상위를 자동 상속

```
~/.claude/CLAUDE.md                [나만 적용 · 모든 프로젝트]
└── my-app/
    ├── CLAUDE.md                  [팀 공유 · Git 커밋]
    ├── .claude/
    │   └── rules/                 [주제별 분리 · glob으로 조건부 적용]
    │       ├── code-style.md      (*.ts, *.tsx)
    │       ├── testing.md         (*.test.*, __tests__/**)
    │       └── security.md        (**/auth/**, *.sql)
    └── src/auth/
        └── CLAUDE.md              [이 폴더 작업 시에만 자동 로드]
```

<!-- Page 45 -->

맥락(CONTEXT ENGINEERING)

# 설정 파일 상속 구조 — 하위가 상위를 덮어쓴다

| USER | `~/.claude/CLAUDE.md` | 모든 프로젝트 공통 (내 습관, 스타일) |
| --- | --- | --- |
|  | ↓ 상속 |  |
| **PROJECT** | `my-app/CLAUDE.md` | 이 프로젝트 전용 (스택, 컨벤션) |
|  | ↓ 상속 + 오버라이드 |  |
| FOLDER | `src/auth/CLAUDE.md` | 이 폴더 작업 시만 (특수 규칙) |

**예: User에 "camelCase 사용"**
→ 모든 프로젝트에 적용

**예: Project에 "snake_case 사용"**
→ 이 프로젝트만 snake_case
**Project가 User를 오버라이드**

**예: auth/에 "JWT만 사용"**
→ auth 폴더 작업 시만 적용
**가장 좁은 범위가 우선**

<!-- Page 46 -->

맥락

# CLAUDE.md 실전 가이드

| User | **내 작업 습관**, 선호하는 코딩 스타일, 공통 규칙 |
| --- | --- |
| **Project** | **이 프로젝트의 기술 스택**, 컨벤션, 중요한 제약 |
| Folder | **특정 모듈의 특수한 규칙** |

> **팁:** "최대 200줄 정도를 유지하며 계속 업데이트하라. 너무 길어지면 AI 성능이 급격히 저하된다."

<!-- Page 47 -->

맥락

# 맥락 관리의 핵심 원칙

**Progressive Disclosure**
필요한 것만 필요할 때 보여주기.
다음 슬라이드에서 자세히.

**.claude/rules/**
상황별 세분화된 규칙.
CLAUDE.md가 길어지면 분리.

**Scope 계층**
User / Project / Folder 각 레벨에 맞는 정보 배치.

> "한꺼번에 다 주면 AI도 헷갈린다"

<!-- Page 48 -->

맥락

# Progressive Disclosure

내용을 다 때려넣지 말고, "이런 상황에서는 이걸 참고해"라고 안내해서 필요한 것만 읽게 한다

## SKILL.md 또는 CLAUDE.md 안에서

```
코드 작성 시 → references/code-style.md 참고
테스트 시 → references/testing-guide.md 참고
API 설계 시 → references/api-convention.md 참고
배포 시 → references/deploy-checklist.md 참고
```

**핵심 아이디어**
프롬프트에 **"이 상황에서는 이 문서를 읽어"**
라고 가이드를 주면 AI가 동적으로
필요한 문서만 읽는다

## 폴더 구조로 구성

```
my-skill/
  SKILL.md
  references/
    code-style.md
    testing-guide.md
    api-convention.md
    deploy-checklist.md

CLAUDE.md  (핵심만 30줄)
docs/
  architecture.md
  conventions.md
```

> SKILL/CLAUDE.md에 다 넣는 게 아니라 **폴더로 분리하고 상황별로 참조시킨다** → 컨텍스트 절약

<!-- Page 49 -->

맥락(CONTEXT ENGINEERING)

# 세션 맥락 관리 — 쌓이면 비워라

| ~20% ████ | 쾌적 | `/clear` | 컨텍스트 완전 초기화. 다른 주제로 전환할 때. |
| --- | --- | --- | --- |
| ~50% ████████ | `/compact` | `/compact` | 오래된 대화를 요약·압축. 같은 주제를 이어갈 때. |
| ~80% ████████████ | /clear 또는 새 세션 | `handoff` | 현재 세션의 맥락을 파일로 저장 → 새 세션에서 이어받기. 맥락 손실 없이 전환. |

**내 기준: 20~30% 되면 새로 시작**
아예 다른 맥락의 작업을 하게 되면 /clear. 이어가야 하면 handoff로 맥락을 넘긴다.

> 컨텍스트는 **채우는 것만큼 비우는 것**도 중요하다

<!-- Page 50 -->

맥락

# .claude/rules/ 가이드

CLAUDE.md가 길어지면 주제별로 분리 + glob 패턴으로 자동 매칭

## 작동 방식

`.claude/rules/` 폴더에 .md 파일을 놓으면 Claude Code가 자동으로 읽습니다. 파일명에 **glob 패턴**을 넣으면 해당 파일 작업 시에만 로드됩니다.

```
# .claude/rules/ 구조
code-style.md   # 항상 로드
testing.md      # 항상 로드
react-*.md      # *.tsx 작업 시만
api-design.md   # routes/ 작업 시만
```

규칙 파일 상단에 **glob 패턴**을 지정하면 조건부 로드가 됩니다.

## 예시

**security.md**
```
glob: **/*.sql, **/auth/**
```
.env 직접 수정 금지, SQL은 반드시 parameterized query

**testing.md**
```
glob: **/*.test.*, **/__tests__/**
```
커버리지 80%+, mock 최소화, 통합테스트 우선

**code-style.md**
(항상 로드)
함수 20줄 이내, camelCase, 주석은 영어

<!-- Page 51 -->

맥락(CONTEXT ENGINEERING)

# 주기적으로 점검하기

**Skill · MCP는 Context를 먹는다**
Skill, MCP는 생각보다 context를 많이 차지하고 pollution이 생길 수 있다. 안 쓰는 것들은 주기적으로 점검해서 정리하기.

```
/context 로 현재 사용량 확인
```

**CLAUDE.md가 비대해질 때**
관리 안 되면 중복·대치되는 내용이 쌓인다. AI한테 직접 점검을 시키자.

> "CLAUDE.md, .claude/rules를 분석해서 논리적으로 문제가 없는지 + 중복되거나 대치되는 내용은 없는지 분석해줘"

```
/context — 카테고리별 토큰 사용량 확인
Context Usage
claude-opus-4-6[1m]
61.2k/1M tokens (6%)

Estimated usage by category:
- System prompt: 6.3k tokens (0.6%)
- System tools:  7.2k tokens (0.7%)
- Custom agents: 3.6k tokens (0.4%)
- Memory files:  473 tokens (0.0%)
- Skills:        7.3k tokens (0.7%)
- Messages:     41.2k tokens (4.1%)
- Free space:    908.8k tokens (90.1%)
- Autocompact buffer: 33k tokens (3.3%)

MCP tools · /mcp (loaded on-demand)
```

> 쌓는 것만큼 **점검하고 비우는 것**도 Context Engineering이다

<!-- Page 52 -->

맥락(CONTEXT ENGINEERING)

# 컨텍스트 효율 = **분리 + 독립**

**PRINCIPLE 01**
**특성별로 분리한다**
규칙·이력·문서·툴 결과를 한 바구니에 담지 말 것. **목적이 다른 컨텍스트는 파일·레이어도 달라야** 한다.

**PRINCIPLE 02**
**작업자는 독립적 컨텍스트를 가진다**
메인 세션에 전부 싣지 말고 **subagent를 역할별로 띄워** 각자의 시야만 갖게 하라. 오염이 번지지 않는다.

> 코드 탐색 · 리서치 · 검증 · 실행 — 각자의 눈으로 보게 하면 **메인 컨텍스트가 가벼워진다**

<!-- Page 53 -->

맥락(CONTEXT ENGINEERING)

# Memory System — 사람의 손 vs AI의 손

**HUMAN-CURATED**
**CLAUDE.md**
사람이 통제권을 가지는 계층. 프로젝트 규칙, 원칙, 네이밍 컨벤션처럼 **변하지 않아야 하는 것**을 둔다. 리뷰 가능한 문서.

**AUTO-ACCUMULATED**
**Auto-memory**
세션을 거치며 AI가 스스로 쌓는 계층. 사용자 성향, 과거 피드백, 반복되는 실수 등 **경험 기반 지식**. 리뷰 부담은 낮지만 오염 주기 관리 필요.

```
대안: claude-mem — 외부 저장소 + 압축 요약
```

> 규칙은 **CLAUDE.md**에, 경험은 **Auto-memory**에. 섞이면 **둘 다 오염된다**.

<!-- Page 54 -->

맥락(CONTEXT ENGINEERING)

# Context 계층화 — 어디에 무엇을 쌓을 것인가

**Git 커밋 히스토리** (코드의 timeline)
**왜 바꿨는가**가 남는 유일한 레이어. 커밋 메시지 품질이 곧 다음 세션의 컨텍스트 품질이다.

**Agent Task 히스토리** (spec · troubleshooting · lesson learned)
spec file list로 작업 단위를 기록하고, 진행 중 부딪친 troubleshooting · lesson learned를 남긴다. 다음 에이전트가 "같은 삽질"을 반복하지 않게 하는 레이어.

**Human Documents** (사람이 직접 관리)
예: `docs/monitoring.md`, `docs/deployment.md`, `docs/onboarding.md` — 운영 가이드와 의사결정 기록. **AI가 함부로 못 건드리게** 두고, 사람이 권한을 쥔다.

> 세 레이어가 **따로 쌓이고, 필요할 때만 합쳐져야** 컨텍스트가 가벼워진다

<!-- Page 55 -->

맥락(CONTEXT ENGINEERING) · TOKEN SAVING

# 토큰 절감 — rtk

github.com/rtk-ai/rtk

**WHAT IT DOES**
자주 쓰는 dev 명령의 출력을 중간에서 필터링해 **토큰을 60-90% 줄여준다**. Rust 단일 바이너리, 의존성 없음.

`rtk init -g` 한 번이면 Claude Code가 실행하는 bash 명령에 자동으로 적용된다.

**SUPPORTED COMMANDS**
- `git` status · log · diff · push
- `files` ls · read · find · grep
- `test` pytest · go test · cargo test
- `build` tsc · lint · ruff · cargo build
- `ops` docker ps · kubectl logs
- `meta` rtk gain · rtk discover

> **쌓지 않는 것**도 컨텍스트 설계다
