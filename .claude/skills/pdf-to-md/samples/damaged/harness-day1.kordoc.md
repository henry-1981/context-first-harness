---
source: "harness-day1.pdf"
pages: 55
method: kordoc
converted: "2026-04-15"
sample_role: damaged
damage_type: word_spacing_broken
---

## AI NATIVE CAMP

# Harness Engineering #1

# AI가잘일하는환경을설계하는기술

### Team Attention이호연

# 이호연

# Builder, Team Attention

## 전) Contents Technologies, Tech Lead

## 전) Terminal X, Tech Lead

## 전) Socar, Senior Data Engineer

## 전) 컨텐츠 크리에이터 (인프런/클래스101수강생10K+)

# Team Attention

대한민국No.1 AI Native Team
Show and Prove · Seoul
01

### 매달 AI해커톤및 행사 기획·운영

### 02 SF · Seoul동시 해커톤"랄프톤"개최

### 90팀+참여

### 03 Show and Prove Club운영

### 실전 Harness, Claude Code as OS등

Ralphton · SF
C A S E S T U D Y

# Harness 셋업을 해드렸더니, 날아다녔다

### 비개발자 디자이너의 AI Native Dashboard도전기

0:00 0:24
2위 대시보드토큰사용량

### 도구가아니라 환경이바뀌면,

### 비개발자도이만큼 할수 있다

W H Y I T M AT T E R S
내 Harness를가지고있다는것 남의 걸가져다 쓰는 것만으로는 부족하다—내 환경으로 흡수할 수있어야한다
| S T O R Y 01 karpathy | 의 CLAUDE.md | 가 바 이 럴됐 다 | S T O R Y 02 gstack 네 ? | 의 QA | 크 롬 인증 import | 가 잘 | 돼 있 |
| --- | --- | --- | --- | --- | --- | --- | --- |
→ "오,내code-review /계획할때도이거좋겠다"
→ "이거내browser agent에도필요한데"
→ subagent형태로뽑아내서내워크플로우에서호 출 되도 록 꽂 음 → 핵 심 로 직 만 베 껴 서 내 browser agent 안에 통합 남의 Harness는 부품.내Harness가 있어야그걸조립할수 있다.
A G E N D A · D A Y 1
이번에다룰내용
| PA RT A — | 개 괄 & | 기 초 | PA RT B — | 실 행 · 검 증 | · 개 선 |
| --- | --- | --- | --- | --- | --- |
| 01 Harness Engineering |  | 이 란 | 1. Nudget | 서비 스 | Harness 데 모 |
| 02 현 | 재 주요 Harness | 생 태 계 읽 기 | 2. 계 획 | (Planning) |  |
| 03 유 | 명 Harness | 들 뜯 어 보 기 | 3. 실 행 | (Orchestration) |  |
| 04 hoyeon Harness |  | 케 이 스 스 터 디 | 4. 검 증 | (Verification) |  |
| 05 6 | 가 지 구 조 화 |  | 5. 개 선 | (Compound) |  |
06 구조 잡기 (Scaffolding)
07 맥 락 (Context Engineering)
H A R N E S S E N G I N E E R I N G이란

# AI가 알잘딱

# 있도록

깔센 일할수만들어주는

# 구조를

# 것

## 프롬프트한줄이아니라, 환경전체를설계해서

## AI가스스로좋은판단을하게만드는일

이미 빠른 테 크 회사들은
Harness를구성하고있다 모델이아니라 환경 설계가 결과를바꾼 네 가지사례
| LangChain +14%p TerminalBench · 52.8→66.5% 같 은 위 → Top 5 | 모 델 , 하 네 | 스 만 바 꿔 30 | 만 드 0 엔 지 니 어 3~7 명 성 | , 5 개 월 로 달 | $9→$200 비 기 능 | → 완 성 | QUALITY . 차 이 는 하 | 네 스 | 전 문 화 된 | 소 형 에 이전 | 트 다 수 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GPT-5.2-Codex | 고 | 정 . 셀 프 검 증 루 |  |  | 싱 글 에 | 이전 트 $9 | 실 패 → 3 에 | 이전 트 |  |  |  |
| 프 + 컨 | 텍 스 트 자 동 | 수 집 + 둠 루 프 탐 | 5 개 월을 쓴 곳 은 코 | 딩 이 아 니 라 하 네 | $200 | 완 전 동 작 . | 간 소 화 $124 | 로 품 질 | 매 스 텝 검 | 증 게 이 트 + | 정 밀 컨 텍 스 트 |
| 지 . |  |  | 스 설 계 . 5 가 지 교 훈 | 전 부 환 경 설 계 . | 유지 . |  |  |  | 관 리 . 하 네 | 스 없 이 는 불 | 가 능 한 규 모 . |
모델교체로5%개선vs하네스설계로15%개선—후자가훨씬현실적이다

BENCHMARK OpenAI
100
줄 · 인간코

SCALE Anthropic
줄 같은모델 , 다른 결과

Stripe THROUGHPUT
1,000
PR/ 주 · 무인 자동 머지

진화 흐름

# 대체가아니라, 포함이다

### Harness Engineering은 Prompt + Context를 감싸는 상위 레이어

Harness Engineering
=Structure / Workflow Engineering
Context Engineering
Prompt Engineering
+아래전부

### "이렇게 말해봐"

+배경지식·메모리· 참고자료·출력포맷
+역할분리·작업흐름·검증게이트· 재사용가능한도구 정 의
Harness Engineering
AI가 혼자서도잘 일할 수있는작업환경을만들어주는 것
| AI 의 01 맥 뭘 해 야 03 작 어 떻 게 | 작 업 환 경 락 하 는 지 — 업 흐 름 일 하 는 지 | 목 표 · 배 — 역 할 · | 경 지 식 · 참 고 자 료 순 서 · 도 구 | 02 제 뭘 하 면 04 검 잘 했 는 지 | 한 안 되 는 지 증 확 인 — | — 규 칙 · 게 이 트 · | — 이 네 금 지 · 경계 테 스 트 · 회 고 | 가 지 를 담는 | 하 나 의 상 자 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
OpenAI· "사람이방향을잡고,에이전트가실행한다"	Anthropic· "규율은스캐폴딩에서드러난다"
H A R N E S S E N G I N E E R I N G이란

# Harness의정의는생각보다넓다

좁은의미의Harness
가드레일설정
CLAUDE.md에DOs/DON'Ts + Hook으로에이전트에제한을건다 예: "테스트없이커밋금지" → Hook이차단 목적별툴셋
Skill + Agent조합으로특정작업을효율적으로수행 예: /bugfix =진단→분석→수정→검증

## 이강의에서말하는 Harness

특정스킬이나에이전트조합이아니라,
AI에이전트의작업환경자체를설계하는것.
맥락,제한, 흐름,검증—이모든것을포괄하는개념.
비개발영역도가능
SEO감사,콘텐츠제작,리서치등개발외워크플로우도설계 예: /geo-audit =기술+콘텐츠+스키마병렬분석
Anthropic— "Harness의모든구성요소는모델이혼자서는못하는것에대한가정을담고있다."
O U T C O M E S

# 이번 캠프에서 이런게 되면 좋겠다

01

# Harness의큰그림과내가놓쳤던부분을이해한다

다듣고나면"별거없네"라고느껴졌으면좋겠다—뿌연것들이걷히는경험
02

# 내가풀고있는문제에대해워크플로우를구축하고자동화프로세스로옮긴다

남의Harness를따라쓰는걸넘어서,내문제· 내루틴에맞게재조립할수있게 현 재 H A R N E S S 생 태 계 · 축 변 화 AXIS 1 / 4
모든것을하나의그래프로연결한다 하네스가 단순 도구가아니라,내지식·도구·에이전트가 물리는바탕(Substrate)으로진화중 —Personal Knowledge Graph
| as Substrate GBrain 20 MCP + 7 skills 스 는 | 타 일 . 지 전 형 | MCP-HEAVY 식 / 도 구 / 에 | 내 장 . 외 부 이전 트 가 | 소 스 로 본 인을 하 나 의 바 탕 | 알 게 하 는 위 에 물리 게 | Her 만 드 | LLM-Wiki Karpathy 신 , 축 | CURATOR 식 자 동 위 키 적 된 지 식 그 래 | 큐 레 이 프 에 서 재 | 터 . 매 쿼 리마 사 용 → 복 | 다 재 추 론 하 는 대 리 화 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
현 재 H A R N E S S 생 태 계 · 축 변 화 AXIS 2 / 4
자가성장 — 하네스가자기를고친다 에이전트가자기 하네스를 스스로 수정하는 메타 레이어가뜨고있음— Self-Improving / Self-Designing Harness
| HyperAgents 메 타 층 | 에 이전 위 에 , 그 | 트 가 태 스 층 을 고 치 | META-LAYER 크 에 이전 는 층 을 따 | 트 를 개 선 . 로 둠 | 작 업 을 실 행하 는 | Hermes Agent 상 주 하 능 한 기 | 면 서 경 험 을 술 로 압 축 | PERSISTENT 스 킬 로 → 시 간 이 | 전 환 . 쓰 던 갈 수 록 강 | 걸 기 억 해 짐 | 하 고 재 사 용 가 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
현 재 H A R N E S S 생 태 계 · 축 변 화 AXIS 3 / 4
멀티에이전트오케스트레이션
Conductor —한손으로지휘 → Orchestrator —역할·모델·CLI를찢어서쓴다 한에이전트에게다맡기던시대에서세가지축으로분리하는시대로:역할/컨텍스트,모델믹스, CLI믹스.각각이다른병목을푼다.
| R O L E + C O N T E X T S P L I T 일을 혼 자 수 를 로 두 예 : planner → coder → verifier | 쪼 개 서 다 하 면 못 본 다 . 자 . | 여 러 명 자 기 코 드 를 짜 는 사 람 | 에 게 자 기가 검 · 검 사 하 는 | 토 해 서 실 사 람 을 따 | M O D E L M I X 똑똑 한 Opus 복 작 업 예 : Opus plan → Sonnet ×N exec → claude.com/blog/the-advisor-strategy | 모 델 + 빠 는 큰 그 림 · 리 . 비 용 · 속 도 · | 른 모 델 뷰 , Sonnet/Haiku 품 질을 같 이 잡 는다 | 는 반 . | C L I M I X 멀 티 풀 리 는 않 는다 게 엮 는다 Claude | 에 이전 트 병 목 : " 이 ." 각 CLI 가 . Code | CLI CLI 하 나 가 잘 하 는 일을 — 코 딩 · 에 | 모 든 걸 잘 그 대 로 이전 틱 실 행 | 하 지 호 출 하 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
Gemini CLI—문서·장문맥락정리
Codex—복잡한추론·빠른속도 현 재 H A R N E S S 생 태 계 · 축 변 화 AXIS 4 / 4
에이전트표준화 & 공유레이어 도구/툴락인을넘어서는휴대가능한 에이전트정의— "어떤 툴에든호환"이여기에 가깝다
| Cross-Agent opencode · openclaw · codex · Claude Code 에 서 | 호환 동 일 하 게 동 작 할 수 | PORTABLE 있 는 harness 셋 업 | 등 다 양 한 | 에 이전 트 | Skill 을 스 킬 단 한 구 성 | 넘 어 서 위 를 넘 어 요 소 의 범 | EXPAND 워 크플 로 우 위 가 넓 어 | · 메모리 지 는 중 | 관 리 시스 템 | 까 지 — 이 식 가 능 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
S TA R T I N G P O I N T
Harness는어디서부터시작해야하나?
흔한함정 있는것들을플러그인으로하나씩갖다쓰다보면—컨텍스트는비대해지고,정작뭘써야할지모르게된다 시작점은결국 "내가뭘할것인지 + 무엇을더잘하게하고싶은지"
| gstack "Solo shipping at team velocity" 혼 자 서 | gbrain oh-my-claudecode 팀 처 럼 출 하하 기 | 적으 로 " 무 식 하 게 | 돌려 문 제 해 |
| --- | --- | --- | --- |

"Her 처럼내인생을아는 AI" " 토큰을태워서폭발 외부 소스로부터 본인 ( 사용자 ) 을알게만들 여러 모델을동원해

A S O B E R I N G Q U E S T I O N
Harness
투자대비효용을따져보고들어가야한다—가벼운문제엔가벼운도구가맞다
02	성급한추상화금지 — 본인의문제에서시작 더 발 전 되 지 않 은 상 태 에 서 일 찍 Harness 부 터 만 들 면 배 조 는 그 뒤 에

는 항상 필요할까요 ?
01 Harness 를만든다는것은 생각보다시간이든다

하라 보다배꼽이커진다 . 필요가먼저 , 구

신의 시스템에대한이해가없으면
AI Slop 으로빠진다

T H E P R E C O N D I T I O N
자
100%
Harness는내 작업 방식의 외화(外化)다.내가뭘 하는지,어디서막히는지,무엇을 잘하고 싶은지 모른 채로 만든
Harness는—그냥 그럴듯해보이는 산출물을 찍어내는기계가 된다.
| 이 해 남 과 | 없 이 만 든 의 베 스 트 물 은 많 은 | HARNESS 프 랙 티 스 를 데 어 느 것 | 복붙 → 내 도 내 것 이 | 문 제 와 안 아 님 | 맞 는 구 조 → 결 | 이 해 위 에 내 병 목 확히 메 | 쌓 은 HARNESS 과 반 복 패턴 운 다 → AI 가 | 을 먼 저 내 판 단 | 안 다 → Harness 을 증 폭 시 킴 | 가 그 간극 만 정 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
먼저자기를알라.Harness
PA R T A · 0 4
유명 Harness들뜯어보기 각자의 철학이어떻게구조와 동작으로 드러나는가 — 6개를 한장씩
| 01 |  | 02 |  | 03 |  |
| --- | --- | --- | --- | --- | --- |
| gstack |  | oh-my-claudecode |  | ouroboros |  |
| "Solo = Team via role decomposition" |  | "Don't learn the harness, just use it" |  | "Stop prompting. Start specifying." |  |
| 실 행 · | 역 할 분 리 | 실 행 · | 검 증 | 명 확 성 | · SPEC-FIRST |
| 04 |  | 05 |  | 06 |  |
| llm-wiki |  | gbrain |  | hermes-agent |  |
| "Knowledge, compiled once, kept |  | "Memex, except it builds itself" |  | "Lives where you do" |  |
| current" |  |  |  |  |  |
| 지 식 복 | 리 화 | 개 인 메모리 | · 자 동 화 | 상 주 · | 자 가 성 장 |
유 명 H A R N E S S 뜯 어 보 기 · 1 / 6 ↗ github.com/garrytan/gstack
gstack	실행·역할분리
"Solo = Team via role decomposition — 혼자서 팀처럼출하하기"
| 시 그 ① | 니 처 루 프 /OFFICE-HOURS |  |  | 핵 심 동 작 역 할 별 1 | 슬 래 시 | 체 인 |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
아이디어검증— 6개질문으로전제검증+디자인문서생성
CEO ·엔지니어·디자이너· QA ·릴리스—역할이바뀌면컨텍스
| ② | /PLAN-CEO-REVIEW | ↓ → /PLAN-ENG-REVIEW |  | 트 도 | 바 뀌 어 직 | 렬 실 행 |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
CEO·엔지니어관점으로계획을두번찢어봄
2	로그인된상태로자동QA
| ③ Diff ④ 테 | /REVIEW + /QA 리 뷰 + 내 Chrome /SHIP 스 트 · VERSION · CHANGELOG · | ↓ 로 그 인으 로 자 동 QA ↓ 커 밋 | → 버 그 수 정 · PR 까 지 자 동 | /setup-browser-cookies 대 로 커 밋 으 가 드레 3 /careful | 가 져 와 자 로 고 침 일 스 킬 /freeze | 동 브 라 우저 가 /guard | 로 내 Chrome 실 제 사 용자 로 rm | 의 로 그 처 럼 테 스 트 -rf · force-push · | 인 쿠 키 를 그 → 버 그 원자 지정 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
폴더편집잠금을harness레벨에내장 아이디어부터PR까지—역할별슬래시체인으로한사람이팀처럼 역할을나누면,하네스안에팀이생긴다 유 명 H A R N E S S 뜯 어 보 기 · 2 / 6 ↗ github.com/Yeachan-Heo/oh-my-claudecode
oh-my-claudecode	실행·검증
"Don't learn the harness, just use it — 배우지 말고 그냥 써라"
| 시 그 | 니 처 루 프 |  | 핵 심 동 작 |  |  |  |
| --- | --- | --- | --- | --- | --- | --- |
| ① | 한 줄 커 맨 드 |  | 병 렬 1 | 실 행 + 역 할 분 | 리 |  |
| ultrawork | refactor | the API | ultrawork | 로 multiple agents |  | 동 시 launch, atomic commit 강 |
|  |  | ↓ | 제 . 3-tier model routing (haiku · sonnet · opus) |  |  |  |
②병렬에이전트LAUNCH
haiku / sonnet / opus 3-tier 로 분 배 여 러 2 Orchestration 모 드 작업성격에따라고를수있음— team mode(역할별병렬) ·
↓
agent mode(단일전문가) · ralph mode(반복루프)등
③VERIFIER체인 매스텝마다검증이따라붙음
3	검증내재화
| ④ .omc/ | 경 험 을 파 일 로 learnings · decisions · issues · problems | ↓ | verifier · code-reviewer · security-reviewer · visual-verdict 실 행 | 파 이 프 에 박 아 | 매 스 텝 마 다 | 를 검 증이 따라 붙 음 |
| --- | --- | --- | --- | --- | --- | --- |
한줄로던지고,실행·검증·축적이같은라인에서끝난다실행·검증을구조에박고,지혜는파일로누적한다 유 명 H A R N E S S 뜯 어 보 기 · 3 / 6 ↗ github.com/Q00/ouroboros
ouroboros	명확성· Spec-first
"Stop prompting. Start specifying — 시키기전에,뭘 원하는지부터"
| 시 그 | 니 처 루 프 |  |  |  |  | 핵 심 동 작 |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ① | 모 호 한 요 청 |  |  |  |  | 명 확 1 | 성 게 이 트 |  |  |  |  |
| " 이 | 런 기 능 있 었 으 면 | 좋 겠 어 | …" |  |  | 질 문 | 으 로 모 호 | 함 을 먼 저 제 거 — Spec | 이 나 | 오 기 전 엔 | 코 드 로 안 넘 |
|  |  |  | ↓ |  |  | 어 간 | 다 |  |  |  |  |
②SOCRATIC질문루프 숨 은 가 정 노 출 → Ambiguity ≤ 0.2 까 지 비 용을 2 단 계 적으 로 싼모델부터시도,실패하면더비싼모델로자동승급—낭비없이
↓
품질확보
③SPEC고정
immutable Seed — ontology + criteria
3	"아직뭘모르지?"로재진입
↓
한번에안되면빈틈을다시물어다음세대Spec으로루프
④실행+ 3-STAGE검증
| Mechanical → Semantic → Consensus 요 청 이 | 아 니 라 Spec 에 서부 | 터 시 작 | 한 다 | AI 가 병 | 목 이 아 니 | 라 , 너 의 명 확 성 이 | 병 목 이 | 다 |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
유 명 H A R N E S S 뜯 어 보 기 · 4 / 6 ↗ gist.github.com/karpathy/442a6bf…
llm-wiki · Karpathy	지식복리화
| "Knowledge, compiled once, kept current — |  |  |  | 재 추 론 | 대 신 축 | 적 " |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 시 그 | 니 처 루 프 |  |  |  | 핵 | 심 동 작 | ( 3 오 퍼 레 | 이 션 ) |  |  |  |
| ① | 새 소 스 1 개 투 입 |  |  |  | 1 | Ingest |  |  |  |  |  |
| 아 | 티클 ·PDF· 회 의 록 | 하 나 |  |  |  | 1 소 스 | 투 입 → | 요 약 작 성 + index | 업 데 이 트 | + 관 련 | 엔 티티 · 컨 셉 |
|  |  |  | ↓ |  |  | 10~15 | 개 동 시 | 수 정 + 모 순 플 | 래 그 |  |  |
②10~15개페이지 동시편집 엔 티티 · 컨 셉 페 이지 에 한 번 에 반 영 2 Query
index → drill-down →답변.좋은답변은다시위키에파일링—탐
↓
색조차복리화
③INDEX·LOG업데이트 모순플래그+ cross-reference강화
↓ 3 Lint
주기적health-check: stale claim · orphan페이지·누락된
④ 위 키 가 복 리로 두 꺼 워짐 cross-reference · 데 이 터 갭 질의답변도다시파일로축적
1투입→많은곳이함께갱신.탐색의결과도다시파일로. 인간은소싱·질문,LLM은bookkeeping
유 명 H A R N E S S 뜯 어 보 기 · 5 / 6 ↗ github.com/garrytan/gbrain
gbrain	개인메모리·자동화
"Memex, except it builds itself — 브레인은 에이전트가 짓고 유지한다"
| 시 그 ① " 지 | 니 처 루 프 사 용자 메 시 지 난 주 미 팅 에 서 나 | 온 거 뭐 였 지 ?" ↓ |  | 핵 심 동 작 내 1 미 팅 Second Brain | 삶 의 모 든 · 이 메 일 | 소 스 를 한 곳 에 · 캘 린 더 · 음 성 으 로 모 음 | · 트 윗 — | 흩 어 진 | 정 보 를 하 나 의 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
②브레인먼저조회 엔 티티 감 지 → 관 련 page 읽 기 에 이전 2 트 가 스스 로 연 결 각소스는recipe로subagent가설치·연동—사람은API key만주
| ③ | 응 답 | ↓ |  | 고 | 빠 짐 |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
citation과함께답변
3	매대화가브레인을키운다
↓
대화전에읽고,대화후에쓴다—시간이갈수록나를더잘아는에
| ④ citation + back-link | 새 FACT 기 록 | 자 동 . nightly dream cycle | 로 정 리 | 이전 | 트 가 됨 |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
매대화마다읽고·쓴다.유지보수는cron이맡는다. 사람이포기했던유지보수를,LLM이0으로만든다
| 유 명 H A R N E S S hermes-agent | 뜯 어 보 기 | · 6 / 6 | · Nous Research | Self-Improving AI Agent |  |  | ↗ github.com/NousResearch/hermes-agent |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
"A self-improving AI agent —쓸수록 스스로 진화하는 에이전트"
| 시 그 ① Telegram · Discord · Slack · CLI… ② 서 | 니 처 루 프 어 느 채 널 이 든 메 시 지 상 주 에 이전 트 응 답 버리 스 · idle 시 하 | ↓ 이 버 네 이 트 |  |  | 핵 심 동 작 반 1 자주 쓸수 2 사 | 복 작 업 을 하 는 일의 록 스 킬 이 용 중 발 견 | 스 킬 로 추 상 화 흐 름 을 모 다 듬 어 진 다 되 는 개 선 점이 | 아 재 사 용 다 시 skill | 가 능 한 skill 에 반 영 | 로 자 동 — 네 워 크플 | 전 환 로 우 가 모 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
양을잡아간다
↓
③TRAJECTORY수집
3	어디서든같은에이전트 대화·행동전체기록
Telegram · Discord · Slack …채널이달라도기억·스킬은이어진
↓ 다
④새SKILL자동추출 경험에서재사용가능한기술생성+ RL학습데이터로환류 쓸수 록 skill 수 가 는다 . 사 용이 곧 훈 련 데 이 터 . 쓸수 록 하 네 스 가 자 기 를 고 친 다
C A S E S T U D Y · 내 H A R N E S S
↗ github.com/team-attention/hoyeon

# hoyeon — 그냥내가쓰려고모은것

## 처음부터"시스템을 만들자"가 아니었다 —개발하면서 쓰던 것들을 모으고 다듬은 결과물

만든 이유

## ① 다른 것들 써봐도 어딘가 제대로 안 돌고 버그가 남—내 워크플로우와 미묘하게어긋남

## ② 그래서 내가 개발하면서쓰던패턴들을 하나씩 모으고 개선 →어느순간harness 형태가 됨

## ③ 목표는 거창하지않았다—"내

손에 맞는 연장 " 하나 갖는 것

지니어링 Harness 의 가설 니어링작업에서 AI 가제대로된 결과물을내놓게하려면 — 결국이세가지가맞물려야한다

M Y H Y P O T H E S I S

# 엔

### 엔지

01 사용자의 Requirements 를명확하게수집한다 무엇을만들어야하는지부터정확히 — 모호함은이후단계로증폭된다

02

## 빠짐없이작업하도록 작업완료의기준을촘촘하게 세운다

"다됐다"의정의를미리못박아야AI가놓치는것을붙잡을수있다
03

## 검증이제대로될때까지반복적으로구현한다

한번에되는게아니라—검증통과까지루프를돌리는구조로설계한다
C A S E S T U D Y · 구 성 ( 1 / 2 ) ↗ github.com/team-attention/hoyeon
어떻게구성되어있나 — 4 그룹의스킬 역할이다른스킬을 4그룹으로묶어관리.코어는Engineering.
| Opinion Collector 다 관 점 council deep-interview Engineering 스 펙 specify bugfix | 의 견 수 렴 · tribunal · ★ → 실 행 파 이 프 라 인 · execute · scope · | discuss 코 어 · ultrawork scaffold | · stepback · qa | Research 외 부 · 내 deep-research dev-scan reference-seek Loop / Meta 반 복 · ralph compound | 부 정 보 수 집 (Google 메 타 도 구 (DoD) · · mirror | (Google Search · X · Reddit · tech-decision rulph (rubric) | base) · Thread | 순 회 ) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
C A S E S T U D Y · 워 크 플 로 우 ( 2 / 2 ) ↗ github.com/team-attention/hoyeon
어떻게돌아가나 — 한흐름 정의→ spec →실행 →검증→ 반복 →축적.코어(②③④)가 파이프라인의중심.
| ① ② ③ ④ ⑤ ⑥ | 정의 Spec 실 행 검 증 반 복 축 적 | 요 구가 specify execute verify ralph compound | 모 호 할 때 — L0 Goal → L4 Tasks → — dispatch · work 2 — 각 (DoD) · — | — deep-interview 태 스 크 완 rulph 학 습 을 docs/learnings/ | 축 료 기 준을 agent (rubric 기 | · discuss ↓ spec.json ↓ ↓ 가 자 동 ↓ 반 자 가 개 ↓ 로 | 확 인 선 ) |
| --- | --- | --- | --- | --- | --- | --- | --- |
C A S E S T U D Y · 다 음 스 텝 ↗ github.com/team-attention/hoyeon
앞으로어디를개선할까 지금 구조의 한계를본 지점 세가지—모델이좋아진 만큼, 하네스도 얇아지고 있다
| 포 맷 |  |  |  | 누 적 |  |  | 검 증 |  |  | 03 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| JSON → | Markdown |  |  | Compounding | 구 |  | Verification Hallucination |  |  |  |
|  |  |  |  |  |  |  | 줄이 기 |  |  |  |
| 모 델 이 처 리 할 | 수 있 는 | 컨 텍 스 트 가 | 커 짐 | auto-memory | 를 보 완 . AI 의 | 시 행 착 오 ( 작 |  |  |  |  |
| → spec 을 JSON | 틀 에 | 가 두 지 말 고 | .md | 업 · 실 행 | 중 ) 와 사 람 의 시 행 착 | 오 를 같 이 컨 | agent 가 | 더 스스 로 | 작 업 · 탐 | 색 해 서 판 단 하 |
| 로 확 장 성 있 | 게 — 가 독 | 성 · 편 집 성 | 함 께 향 | 텍 스 트 화 | — 실수 가 다 음 세션 | 의 재 료 가 | 게 . 검 증이 | 허 위 로 | 통 과 되 지 | 않 게 — 현 재 |
| 상 |  |  |  | 되도 록 |  |  | 하 네 스 | 의 가 장 큰 | 약 한 고 리 |  |

조강화

큰 그림
Harness의 6개축 — 순환구조
|  | 구 조 Scaffolding 뭘 깔 아 두 ↑ 개 선 Compounding 어 떻 게 나 아 | → 는 가 ← 지 는 가 | 맥 락 → Context AI 가 뭘 아 는 가 검 증 ← Verification 어 떻 게 믿 는 가 | 계 획 Planning 뭘 할 지 정 하 는 가 ↓ 실 행 Execution 어 떻 게 시 키 는 가 |
| --- | --- | --- | --- | --- |
큰 그림
Harness의 6개축 — 각자다른질문에답한다 구조→맥락→계획→실행→검증→개선→ (다시)구조. 이순환이한바퀴돌때마다Harness가단단해진다.
|  |  |  | 01 |  |  |  |  | 02 |  |  |  |  | 03 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 구 조 |  |  |  | 맥 락 |  |  |  |  | 계 획 |  |  |  |  |
| SCAFFOLDING |  |  |  | CONTEXT |  |  |  |  | PLANNING |  |  |  |  |
| " 뭘 깔 | 아 두 는 가 ?" |  |  | "AI 가 | 뭘 아 는 가 ?" |  |  |  | " 뭘 할 지 | 정 하 는 가 ?" |  |  |  |
| 폴 더 링 | · 도 구 배 치 · | 경계 . skills/ · hooks/ |  | CLAUDE.md | ·auto-memory·rules. |  | 무 | 엇 을 기 억 | " 해 줘 " 가 | 아 니 라 spec/plan | 으 로 . |  |  |
| · agents/ | · MCP | 를 user · project · plugin | 중 | 시 키 고 | , 어 떻 게 점진적으 | 로 노 | 출 할 지 . |  | AskUserQuestion |  | · 요 구 분 | 해 로 모 호 | 성 을 먼 저 |
| 어 디 에 | 둘 지 . |  |  |  |  |  |  |  | 없앤 다 . |  |  |  |  |
|  |  |  | 04 |  |  |  |  | 05 |  |  |  |  | 06 |
| 실 행 |  |  |  | 검 증 |  |  |  |  | 개 선 |  |  |  |  |
| EXECUTION |  |  |  | VERIFICATION |  |  |  |  | COMPOUNDING |  |  |  |  |
| " 어 떻 게 | 시 키 는 가 | ?" |  | " 어 떻 게 | 믿 는 가 ?" |  |  |  | " 어 떻 게 | 나 아 지 는 가 | ?" |  |  |
혼자/부하파견/팀. subagent·orchestration으로	기준·분리된관점·독립검증자.컨텍스트와모델	관측→단순화→축적.세션의학습과규칙을다음 작 업 을 어 떻 게 배 치 할 지 . 을 나눠 서 스스 로를 속 이지 않 게 . 세션 으 로 복 리 화 .
01

# 구조(Scaffolding)

# 프로젝트구조, 도구배치, 경계설정 — 한번해두면계속쓰는것

구조( S C A F F O L D I N G )
프로젝트구조설계
| 1 |  |  |  | 2 |  |  |  | 3 |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Monorepo | 로 묶 | 기 |  | 역 할 | 별 폴 더 | 링 |  | 아 키텍 | 처 가 퀄 | 리 티 를 | 결 정 |
| 소 스 | 코 드 , 문 서 , 테 스 | 트 , 설 정을 | 하 나 의 | 목 적이 | 명 확 한 | 폴 더 구 조 . AI | 가 어 디 에 | 코 드 의 | 아 키텍 처 | 가 잘 잡 | 혀 있으 면 , 시 간 |
| 프 로 | 젝 트 에 서 관 리 . AI | 가 전 체 | 맥 락 을 한 | 뭘 넣 | 어야 하 는 | 지 바로 안 | 다 . | 이 갈 | 수 록 AI 산 | 출 물 의 퀄 | 리 티 가 올 라 간 |
| 눈 에 | 파 악 할 수 있 다 . |  |  |  |  |  |  | 다 . |  |  |  |
|  |  |  |  |  |  |  |  | clean | arch → | consistent |  |
|  |  |  |  |  |  |  |  | output |  |  |  |
프로젝트 구조를 잘 설계하면,AI는 그구조에 맞춰따라간다 구조( S C A F F O L D I N G )
Agent의 output 폴더도구조로잡기
AI는작업할때마다파일을쏟아낸다—수집한데이터,분석결과,세션간핸드오프메모.
둘곳이없으면소스트리여기저기에흩어지고다음세션에서사라진다.
| C O L L EC T 수 집 스 크 두 는 | 데 이 터 래 핑 · 로 그 · 곳 . 재 가공 | 샘 플 등 원 은 다 른 폴 | 본 그 대 로 쌓아 더 에 서 . | A N A LY Z E 분석 결과 리 서 치 · 요 약 · 리 산 출 물 . 재 생성 | 포트 . 사 람 이 읽을 가 능 해 도 따 로 | 수 있 는 보 관 . | H A N D O F F 세션 핸 드 오 spec·TODO·lesson-learned 이전 트 에 게 넘 | 프 기 는 메모 . 대 | 등 다 음 에 화 밖 에 서 도 컨 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
텍스트가산다.
.dev/data/ .dev/reports/ .dev/handoff/
무데나쌓는다—자리를먼저만들어두자

AI 가어디에쌓을지모르면아

구조( S C A F F O L D I N G )
뭘깔아두는가?
구조 =폴더링 ·도구배치·경계.세질문으로 쪼개면명확해진다.
| FOLDERING |  |  |  | PLACEMENT |  | BOUNDARY |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  | 1 |  | 2 |  |  |  | 3 |
| 사 람 | 의 문 | 서 · |  | 도 구 를 | 어 디 에 둘 까 | AI 가 | 뭘 알 고 |  |  |
| AI 의 | 문 서 | 를 어 떻 | 게 나눌 까 | Skills · Hooks · Agents · MCP |  | 어 디 | 까 지 하 게 | 할 까 |  |
| 코 드 | · 문 서 · 테 스 | 트 ·AI 설 정이 | 섞 이지 않 |  |  | CLAUDE.md | 로 알 | 리 고 , permission | 으 로 |
| 게 . 이 | 름 은 자유 | , 원 칙 은 역 | 할 별 격 리 . |  |  | 허 용 하 | 고 , hook 으 로 | 막 는다 . |  |
같은도구라도user · project · plugin
어디에두냐에따라공유범위가달라진 다 .
정답은없다. 처음엔모아두고,문제가느껴질때쪼개라—미리나누지말고,불편해진지점부터분리하는방식을고민한다.
Q 1 · F O L D E R I N G
사람의문서 vs AI의문서 — 분리해서 관리 분리하지않으면,사람이관리를멈춘순간AI도엉뚱한맥락으로일한다
| 사 람 docs/ 비 체 아 | 이 관 리 · 비 즈 즈 니 스 룰 · 도 크 리 스 트 · 온 키텍 처 · 의 사 | 니 스 의 진 실 메 인 정의 보 딩 가 이 드 결 정 기 록 |  |  | AI 가 남 기 .dev/ learnings · troubleshooting 작 업 로 실 험 결과 | 는 기 록 · 작 업 그 · 디 버 깅 히 · 스 크 래 치 | 의 흔 적 기 록 스 토 리 패 드 |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
아래설정파일들이위문서를참조하고지탱한다
|  | CLAUDE.md 프 로 젝 트 지 도 docs/ 와 rules/ | (~100 줄 ) 로 포 인 팅 | .claude/rules/ 코 딩 규 glob 패턴 | 칙 · 테 스 트 컨 벤 션 으 로 조 건 부 로 드 | .claude/skills/ 반 /commit, /review | 복 작 업 레 시 피 | 등 | ... hooks, agents, MCP, plugins 등 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
위:콘텐츠(사람+AI) /아래:설정(AI행동규칙).docs/는사람의책임

| 디에둘까<br>기준 : 나만 쓰나 · 팀이쓰나 | — User · Project · Plugin<br>· 세상에공유하나 |  |  |
| --- | --- | --- | --- |
| 구 User<br>~/.claude/<br>내개인루<br>/commit | Project<br>.claude/ (git 커밋 )<br>틴 프로젝트컨벤션기반<br>, /wrap /deploy-staging | Plugin<br>.claude-plugin/plugin.json<br>팀 · 커뮤니티배포<br>/my-plugin:review |  |
| 보편적알<br>동화 ( 내모든프 | 림 · 차단 프로젝트금기사항<br>로젝트 ) ( 팀 전체 적용 ) | 번들된자동화<br>(plugin 과함께 on/off) |  |
| 개인전문<br>문가 ( 리뷰어 , 디 | 가 풀 도메인전문가<br>버거 ) ( 이 프로젝트아키텍트 ) | 재사용에이전트<br>( 공유 가능한역할 ) |  |

Q 2 · P L A C E M E N T
어 판단 도
Skills
/command
Hooks
자
Agents
전
| MCP 외 부 연 결 | 내 개 인 계 정 (Gmail, Notion) | 팀 공 용 시스 .mcp.json | 템 체 크 인 | plugin 내 부 제 공 ( 설 치 시 자 동 ) |
| --- | --- | --- | --- | --- |
승격전략—표준형(.claude/)으로시작→ Plugin으로올리기
Plugin으로승격할때는user · project레벨중복부터정리.같은skill·hook이두곳에남으면충돌·블랙박스의원인이된다.
Q 3 · B O U N D A R Y
경계설정하기
AI가뭘알고, 어디까지하고,뭘하면안되는지를정해주는것
| 뭘 어 디 뭘 | 알 려 줄 까 까 지 허 용 할 까 막 을 까 | CLAUDE.md Permission Mode Hook | 에 프 로 젝 트 로 자 으 로 위 험 한 명 령 을 | 규 칙 , 코 동 허 용 범 실 행 전 에 | 딩 스 타 일 , 금기 위 설 정 (plan / auto / bypass) 자 동 차 단 | 사 항 작 성 CLAUDE.md · rules/ settings.json .claude/hooks/ |
| --- | --- | --- | --- | --- | --- | --- |
TIP Hook블랙박스주의— plugin많이깔수록위험해진다
Plugin·user·project설정이합쳐지면hook이중복·충돌해원인모를버그가된다.주기적으로 /hooks로점검—출처라벨( User · Project ·
Plugin)이표시된다.내가깐건내가책임진다는원칙으로,안쓰는plugin·hook은비워라.
Q 3 · B O U N D A R Y — D E E P D I V E
TIP
복잡도있는프로젝트라면 — 코드아키텍처가 AI 품질을결정한다
CLAUDE.md·rules·hook은경계를잡아주지만,코드구조자체가엉망이면AI도엉망으로짠다.레이어·의존성방향·모듈경계가명확할수록AI
는기존패턴을복제해일관되게짠다.
| 만 들 처 잡 도 능 초 | 게 구 체 화 음 에 아 키텍 고 시 작 하 메 인 · 레 이 어 을 추 가 할 때 기 한 번 의 설 | 되 어 있 다 면 처 를 라 분 리 , 폴 기 존 패턴 계가 수 백 | 더 경계 , 의존 을 복 제 하 번 의 수 정을 | 성 방 향 을 는 방 식 으 절 약 한 다 | 미리 결 정 로 움직이 도 | . AI 가 새 기 록 . | AI 가 말 코 드 아 키텍 같 은 지 쓰 지 말 먹 는다 규 칙 추 가 | 을 안 들 을 수 준 에 서 처 를 재점 시 를 해 도 고 리 팩토 링 . << 구 조 정 | 때 검 하 라 결과가 엉 키 계 획 부 터 리 | 면 대 부분 세 워 라 — | 코 드 구 조의 경계가 없 는 | 문 제 . 규 곳 엔 규 칙 | 칙 을 더 도 안 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
핵심:AI품질= Harness설정×코드아키텍처.둘중한쪽이0이면곱도0이다.
T R Y I T	구조(Scaffolding)
구조 설계를 도와주는스킬 처음프로젝트를셋업할때,그리고기존Harness를점검할때
| /scaffold SKILL · HARNESS PLUGIN 프 로 젝 트 킬 . CLAUDE.md, rules, 번 에 생성 [Link] | 초 기 구 성 을 . | 자 동 으 로 폴 더 | 잡 아 주 는 스 구 조 까 지 한 | /check-harness SKILL · HARNESS PLUGIN 현 재 프 로 젝 트 의 트 로 진 단 . 빠 진 다 . [Link] | Harness 설 정 , 개 | 상 태 를 선 포 인 트 | 체 크 리 스 를 알 려 준 | /skill-creator ANTHROPIC 스 킬 을 에 서 제 [Link] | 공 식 PLUGIN 만 들 고 성 능 을 공 하 는 공 식 | 높 이 세 요 . Anthropic 스 킬 생성 도 구 . |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
Harness플러그인을user레벨(~/.claude/)에설치하면모든프로젝트에서/scaffold,/check-harness를바로쓸수있습니다
02

# 맥락

# CLAUDE.md,

# 규칙, 점진적노출 — AI가뭘알고일하는가

맥락 설정파일한눈에보기 아래로갈수록범위가좁고, 우선순위가높습니다·하위파일은상위를자동상속
~/.claude/CLAUDE.md	나만적용·모든프로젝트
| │ └─ | my-app/ |  |  |
| --- | --- | --- | --- |
├─ CLAUDE.md	팀공유· Git커밋
├─ .claude/
│	└─ rules/	주제별분리· glob으로조건부적용
|  | │ │ │ └─ src/auth/ | ├─ code-style.md ├─ testing.md └─ security.md | *.ts, *.tsx *.test.*, __tests__/** **/auth/**, *.sql |
| --- | --- | --- | --- |
└─ CLAUDE.md	이폴더작업시에만자동로드 맥락( C O N T E X T E N G I N E E R I N G )
설정 파일 상속구조 — 하위가 상위를덮어쓴다
|  | USER PROJECT | ~/.claude/CLAUDE.md my-app/CLAUDE.md |  | ↓ 상속 | 모 든 프 로 이 프 로 젝 | 젝 트 공 통 ( 트 전용 ( 스 | 내 습 관 , 스 타 택 , 컨 벤 션 ) | 일 ) |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
↓상속+오버라이드
| 예 : User → 모 든 | FOLDER 에 "camelCase 프 로 젝 트 에 적용 | src/auth/CLAUDE.md 사 용 " | 예 : Project → 이 Project | 에 "snake_case 프 로 젝 트 만 snake_case 가 User 를 오 버 라 이 드 | 이 폴 더 작 사 용 " | 업 시 만 ( 특 | 수 규 칙 ) 예 : auth/ → auth 가 장 좁은 | 에 "JWT 폴 더 범 위 가 | 만 사 용 " 작 업 시 만 적용 우 선 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
맥락
CLAUDE.md 실전 가이드
| User Project Folder | 내 작 업 이 프 로 특 정 모 | 습 관 , 젝 트 의 듈 의 특 | 선 호 하 기 술 스 수 한 규 | 는 코 딩 택 , 컨 벤 칙 | 스 타 일 , 션 , 중요 | 공 통 규 칙 한 제 약 |
| --- | --- | --- | --- | --- | --- | --- |
팁:"최대200줄정도를유지하며 계속 업데이트하라. 너무길어지면 AI 성능이 급격히 저하된다."
맥락 맥락관리의핵심원칙
| Progressive Disclosure 필 요 한 다 음 | 것 만 필 슬 라 이 드 에 | 요 할 때 보 서 자 세 히 | 여 주 기 . . | .claude/rules/ 상 황 별 CLAUDE.md | 세분 화 된 가 | 규 칙 . 길 어 지 면 | 분 리 . | Scope User / Project / Folder 맞 는 | 계 층 정 보 배 치 . | 각 레 벨 에 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
"한꺼번에다주면 AI도헷갈린다"
맥락
Progressive Disclosure
내용을다때려넣지말고, "이런상황에서는이걸참고해"라고안내해서필요한것만읽게한다 폴더구조로구성
SKILL.md또는CLAUDE.md안에서
| 코 드 테 스 API 배 포 핵 심 | 작 성 시 트 시 → 설 계 시 시 → references/deploy-checklist.md 아 이 디 | → references/code-style.md references/testing-guide.md → references/api-convention.md 어 | 참 고 참 고 참 고 참 고 → | my-skill/ SKILL.md references/ code-style.md testing-guide.md api-convention.md deploy-checklist.md |
| --- | --- | --- | --- | --- |
프롬프트에 "이 상황에서는 이 문서를 읽어"
라고 가이드를 주면 AI가 동적으로
CLAUDE.md (핵심만 30줄)
필요한 문서만 읽는다
|  |  |  |  | docs/ architecture.md conventions.md |
| --- | --- | --- | --- | --- |
SKILL/CLAUDE.md에다넣는게아니라폴더로분리하고상황별로참조시킨다→컨텍스트절약 맥락( C O N T E X T E N G I N E E R I N G )
세션맥락 관리 — 쌓이면비워라
|  | ~20% ~50% ~80% | 쾌 적 /compact /clear 또 는 새 세션 | /clear /compact handoff | 컨 텍 스 오 래된 현 재 세션 | 트 완 전 초 기 대 화 를 요 약 의 맥 락 을 | 화 . 다 른 주제 · 압 축 . 같 은 파 일 로 저장 | 로 전 환 주제 를 이 → 새 세션 | 할 때 . 어 갈 때 . 에 서 이 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
어받기.맥락손실없이전환.
내기준: 20~30%되면새로시작 아예다른맥락의작업을하게되면/clear.이어가야하면handoff로맥락 을넘긴다.
컨텍스트는채우는것만큼비우는것도중요하다 맥락
.claude/rules/ 가이드
CLAUDE.md가길어지면주제별로분리+ glob패턴으로자동매칭 작동 방식	예시
.claude/rules/폴더에.md파일을놓으면Claude Code가자동으로읽
security.md
습니다.파일명에glob패턴을넣으면해당파일작업시에만로드됩니
| 다 . |  | glob: .env 직접 | **/*.sql, 수 정 금 | **/auth/** 지 , SQL 은 반 | 드 시 parameterized query |
| --- | --- | --- | --- | --- | --- |
# .claude/rules/ 구조
| code-style.md | # 항 상 로 드 | testing.md glob: | **/*.test.*, | **/__tests__/** |  |
| --- | --- | --- | --- | --- | --- |
| testing.md # | 항 상 로 드 | 커 버리 | 지 80%+, mock | 최 소 화 | , 통합테 스 트 우 선 |
react-*.md # *.tsx 작업 시만
api-design.md # routes/ 작업 시만
code-style.md
(항상 로드)
규칙파일상단에glob 패턴을지정하면조건부로드가됩니다.
함수20줄이내, camelCase,주석은영어 맥락( C O N T E X T E N G I N E E R I N G )

# 주기적으로 점검하기

### Skill · MCP는 Context를먹는다

Skill, MCP는생각보다context를많이차지하고pollution이생길수있다.안쓰는것들은주 기적으로점검해서정리하기.
/context 로 현재 사용량 확인

### CLAUDE.md가 비대해질때

관리안되면중복·대치되는내용이쌓인다. AI한테직접점검을시키자.
"CLAUDE.md, .claude/rules를 분석해서 논리적으로 문제가 없는지 + 중복되거나 대치되는 내용은 없는지 분석해줘"
/context —카테고리별토큰사용량확인 쌓는것만큼점검하고비우는것도Context Engineering이다 맥락( C O N T E X T E N G I N E E R I N G )
컨텍스트효율 = 분리 + 독립
| PRINCIPLE 01 |  |  |  |  |  | PRINCIPLE 02 |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 특 성별 | 로 분 | 리 한 다 |  |  |  | 작 업 자 | 는 독 립 | 적 컨 텍 | 스 트 를 | 가 진 다 |  |
| 규 칙 | · 이 력 · 문 서 | · 툴 결과 | 를 한 바 | 구 니 에 담 지 | 말 것 . 목 적이 다 | 메 인 세션 | 에 전 부 | 싣 지 말 고 | subagent | 를 역 할 | 별 로 띄 워 각 자의 |
| 른 컨 | 텍 스 트 는 파 | 일 · 레 이 | 어 도 달 라 야 | 한 다 . |  | 시야 만 | 갖게 하 라 | . 오염 이 번 | 지지 않 는다 | . |  |
코드 탐색 ·리서치 ·검증·실행—각자의눈으로 보게하면메인컨텍스트가가벼워진다 맥락( C O N T E X T E N G I N E E R I N G )
Memory System — 사람의손 vs AI의손
| H U M A N - C U R AT E D CLAUDE.md 사 람 이 럼 변 | 통 제 권 을 하 지 않아야 | 가 지 는 하 는 것 | 계 층 . 프 로 을 둔 다 . 리 | 젝 트 규 칙 , 원 뷰 가 능 한 문 | 칙 , 네 이 밍 서 . | 컨 벤 션 처 | AU T O -AC C U M U L AT E D Auto-memory 세션 을 거 치 며 복 되 는 실수 등 필 요 . | AI 가 스스 로 경 험 기 반 | 쌓 는 계 지 식 . 리 뷰 | 층 . 사 용자 부 담 은 | 성 향 , 과거 낮 지 만 오염 | 피 드 백 , 반 주 기 관 리 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
대안: claude-mem — 외부 저장소 + 압축 요약 규칙은CLAUDE.md에,경험은Auto-memory에.섞이면둘다오염된다.
맥락( C O N T E X T E N G I N E E R I N G )
Context 계층화 — 어디에무엇을쌓을것인가
Git커밋히스토리 왜바꿨는가가남는유일한레이어.커밋메시지품질이곧다음세션의컨텍스트품질이다.
코드의timeline
Agent Task 히 스 토 리 spec file list 로 작 업 단 위 를 기 록 하 고 , 진 행 중 부 딪 친 troubleshooting · lesson learned 를 남 긴
spec · troubleshooting · lesson learned	다.다음에이전트가"같은삽질"을반복하지않게하는레이어.
| Human Documents 사 람 | 이 직접 관 리 |  | 예 : docs/monitoring.md 결 정 기 록 . | AI 가 함 부 로 | , docs/deployment.md 못 건 드 | 리 게 두 고 , | 사 람 이 권 한 | , docs/onboarding.md 을 쥔 다 . | — 운 영 가 | 이 드 와 의 사 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
세레이어가따로쌓이

고 , 필요할때만합쳐져야컨텍스트가가벼워진다

맥락( C O N T E X T E N G I N E E R I N G ) · T O K E N S AV I N G
토큰절감 — rtk
| github.com/rtk-ai/rtk WHAT IT DOES |  |  |  |  |  |  | S U P P O RT E D C O M M A N D S |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 자주 | 쓰 는 dev | 명 령 의 | 출 력 을 중 | 간 에 서 필터 | 링 해 토큰 | 을 60 | git status | · log | · diff | · push |
90%줄여준다. Rust단일바이너리, 의존성없음.
files ls · read · find · grep
`rtk init -g` 한 번 이 면 Claude Code 가 실 행하 는 bash 명 령 에 test pytest · go test · cargo test
자동으로적용된다.
build tsc · lint · ruff · cargo build
ops docker ps · kubectl logs
meta rtk gain · rtk discover
쌓지않는것도컨텍스트설계다