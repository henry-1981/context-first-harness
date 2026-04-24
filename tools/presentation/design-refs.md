# Design References

프레젠테이션 디자인 품질 개선을 위한 레퍼런스 모음.

---

## Skills / Frameworks

### Anthropic frontend-design Plugin
- **링크**: https://github.com/anthropics/claude-code/tree/main/plugins/frontend-design
- **요약**: Anthropic이 만든 "AI slop 방지" 프론트엔드 디자인 스킬. 코딩 전 Bold aesthetic direction(brutalist, maximalist, luxury 등 극단 선택)을 먼저 확정하고, 기억에 남는 포인트 하나를 명확히 한 뒤 production-grade 코드로 실행.
- **핵심 원칙**:
  - 타이포그래피: Inter/Roboto/Arial 금지 → 캐릭터 있는 폰트
  - 색상: 지배색 + 날카로운 포인트 색. CSS 변수로 일관성
  - 모션: 잘 구성된 페이지 로드 한 번 > 흩어진 마이크로 인터랙션
  - 레이아웃: 비대칭, 겹침, 대각선 흐름, 그리드 이탈
  - 배경: 단색 금지 → 그라디언트 메시, 노이즈 텍스처, 기하 패턴
- **관련**: [Frontend Aesthetics Cookbook](https://github.com/anthropics/claude-cookbooks/blob/main/coding/prompting_for_frontend_aesthetics.ipynb)
- **적용 가능**: visual-designer 에이전트 개선, 자유 모드 aesthetic direction 도입

### Impeccable
- **링크**: https://impeccable.style
- **설치**: `npx skills add pbakaus/impeccable`
- **요약**: AI 코딩 도구(Claude Code, Cursor 등)의 디자인 능력을 향상시키는 스킬 팩. "Design fluency for AI harnesses" — 디자인 어휘가 없는 사람도 전문적 결과를 뽑을 수 있도록 디자인 언어를 커맨드로 패키징.
- **20개 슬래시 커맨드 (주요)**:
  - `/polish` — 전반적 디자인 개선
  - `/audit` — 5차원 평가, P0-P3 심각도 등급
  - `/critique` — Nielsen 10 휴리스틱 기반 평가
  - `/typeset` — 타이포그래피 수정
  - `/arrange` — 레이아웃·간격 개선
  - `/overdrive` — 기술적 시각 효과
  - `/distill` — 복잡성 축소
- **특징**: `.impeccable.md`로 프로젝트 디자인 컨텍스트 자동 수집, 안티패턴 큐레이션 내장
- **적용 가능**: visual-designer 개선 시 커맨드 체계 참조, `/audit` 방식으로 deck-reviewer 평가 기준 보강

### Taste Skill
- **링크**: https://github.com/Leonxlnx/taste-skill (공식: https://tasteskill.dev)
- **설치**: `npx skills add https://github.com/Leonxlnx/taste-skill`
- **요약**: AI가 generic/boring 인터페이스 대신 modern·premium 디자인을 생성하도록 유도하는 스킬 컬렉션. 단일 파일이 아닌 7가지 특화 변형 제공 + 3개 숫자 다이얼로 출력 강도 조절.
- **3-dial 파라미터 시스템** (각 1-10):
  - `DESIGN_VARIANCE` — 레이아웃 실험성 (1-3: Clean/centered | 8-10: Asymmetric/modern)
  - `MOTION_INTENSITY` — 애니메이션 양 (1-3: Simple hover | 8-10: Magnetic/scroll-triggered)
  - `VISUAL_DENSITY` — 화면 정보 밀도 (1-3: Spacious/luxury | 8-10: Dense dashboards)
- **7가지 스킬 변형**:
  - `taste-skill` — 메인 (레이아웃·타이포·색상·간격·모션 전반)
  - `redesign-skill` — 기존 프로젝트 감사·개선
  - `soft-skill` — 고급 소프트 UI (프리미엄 폰트, 여백, 스프링 애니메이션)
  - `minimalist-skill` — Notion·Linear 스타일, 모노크롬
  - `brutalist-skill` — 스위스 타이포 + CRT 터미널 혼합 (BETA)
  - `output-skill` — placeholder·미완성 코드 방지
  - `stitch-skill` — Google Stitch 호환 시맨틱 디자인 룰
- **적용 가능**: visual-designer에 3-dial 개념 도입 → 슬라이드 스타일 강도를 사용자가 숫자로 지정

### Better Icons
- **링크**: https://github.com/better-auth/better-icons
- **설치**: `npx skills add better-auth/better-icons` (MCP 서버: `npx better-icons setup`)
- **요약**: 150+ 아이콘 컬렉션에서 20만 개 아이콘을 검색·가져오는 MCP 서버 + CLI. AI 에이전트가 아이콘 이름을 모르거나 SVG를 채팅에 인라인으로 붙여넣는 문제를 해결. 프로젝트 아이콘 파일에 직접 동기화해 토큰도 절약.
- **주요 MCP 도구**:
  - `search_icons` — 150+ 컬렉션 전체 검색 (컬렉션·카테고리 필터)
  - `get_icon` / `get_icons` — SVG·React/JSX·Iconify·URL 포맷으로 반환, 배치 지원
  - `sync_icon` — 아이콘 가져오기 + 프로젝트 아이콘 파일에 자동 추가 (추천 워크플로우)
  - `recommend_icons` — 용도 설명 → 아이콘 추천
  - `find_similar_icons` — 동일 아이콘의 다른 컬렉션 변형 탐색
  - `scan_project_icons` — 현재 프로젝트에 이미 있는 아이콘 스캔
- **주요 컬렉션**: mdi(7,000+), lucide(1,500+), tabler(5,000+), phosphor(9,000+), simple-icons(로고 3,000+) 등
- **특징**: 사용 컬렉션 자동 학습 → 다음 검색에서 우선 노출. React/Vue/Svelte/Solid/SVG 멀티 프레임워크 지원
- **적용 가능**: 슬라이드 HTML에 아이콘 삽입 시 visual-designer → MCP 통해 정확한 SVG 가져오기. 토큰 낭비 방지

### UI Design Brain
- **링크**: https://github.com/carmahhawwari/ui-design-brain
- **설치**: `git clone` → `~/.cursor/skills/ui-design-brain/` (또는 프로젝트 `.cursor/skills/`)
- **요약**: 60+ UI 컴포넌트별 베스트 프랙티스·레이아웃 패턴·안티패턴을 담은 스킬. [component.gallery](https://component.gallery) 기반으로 큐레이션. AI가 컴포넌트를 "추측"하지 않고 실제 디자인 시스템 지식으로 생성하도록 유도.
- **5가지 디자인 방향 프리셋**:
  - `Modern SaaS` — 기본값, 깔끔·여유·전문적
  - `Apple-level Minimal` — 극도의 여백, 초미니멀
  - `Enterprise / Corporate` — 정보 밀집, 키보드 탐색 최적화
  - `Creative / Portfolio` — Bold, 에디토리얼 타이포그래피
  - `Data Dashboard` — 데이터 스캔 가독성 최적화
- **60개 컴포넌트 커버**: Accordion, Alert, Avatar, Badge, Button, Card, Modal, Table, Toast, Tabs, Stepper, Empty state 등 전 범위
- **핵심 디자인 원칙**:
  - 절제 우선 — 요소 수 줄이고 여백을 기능으로
  - 타이포그래피로 위계 — 디스플레이·바디 폰트 대비 극대화
  - 색상 포인트 하나 — 뉴트럴 팔레트 + 강한 액센트 1개
  - 8px 그리드 — 간격이 곧 구조
  - 접근성 필수 — WCAG AA, 포커스 인디케이터, 시맨틱 HTML
  - AI 슬롭 금지 — 보라+흰색 그라디언트, Inter 기본값, 균등 카드 그리드 금지
- **적용 가능**: visual-designer 슬라이드 컴포넌트(표·배지·카드·아이콘 등) 설계 시 참조

### UI UX Pro Max
- **링크**: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (공식: https://uupm.cc)
- **설치**: `npm install -g uipro-cli` → `uipro init --ai claude`
- **요약**: 161개 산업별 추론 규칙으로 디자인 시스템을 자동 생성하는 AI 스킬. 제품 유형 입력 → 스타일·배색·타이포·효과·안티패턴+체크리스트까지 완성 세트 출력.
- **규모**:
  - 67가지 UI 스타일 (Glassmorphism, Claymorphism, Brutalism, Bento Grid, AI-Native UI 등)
  - 161가지 배색 팔레트 (산업별 1:1 대응)
  - 57가지 폰트 페어링 (Google Fonts 임포트 포함)
  - 161개 산업 추론 규칙 (Healthcare, Fintech, SaaS, Wellness 등)
  - 99개 UX 가이드라인
- **디자인 시스템 생성 파이프라인** (5개 병렬 검색):
  1. 제품 유형 매칭 (161 카테고리)
  2. 스타일 추천 (67 스타일, BM25 랭킹)
  3. 배색 선택 (산업별 팔레트)
  4. 랜딩 패턴 (24 패턴)
  5. 타이포그래피 페어링 (57 조합)
- **출력 포함**: 패턴 + 스타일 + 색상 + 타이포 + 핵심 효과 + 안티패턴 + 납품 전 체크리스트
- **Master + Override 패턴**: `design-system/MASTER.md` 저장 후 페이지별 `pages/xxx.md`로 오버라이드 — 세션 간 디자인 일관성 유지
- **CLI 검색**: `python3 search.py "fintech banking" --design-system -f markdown`
- **적용 가능**: visual-designer 자유 모드에서 슬라이드 주제(헬스케어·SaaS 등)별 디자인 시스템 자동 생성 참조

### Vercel Agent Skills — web-design-guidelines
- **링크**: https://github.com/vercel-labs/agent-skills (규칙 원본: https://github.com/vercel-labs/web-interface-guidelines)
- **설치**: `npx skills add vercel-labs/agent-skills`
- **요약**: Vercel Engineering이 정리한 100+ 항목 UI 심사 규칙. AI 에이전트가 UI 코드를 감사할 때 이 규칙셋을 가져와 `file:line` 포맷으로 위반 리포트 출력. 매번 최신 규칙을 fetch해서 적용.
- **11개 카테고리 + 주요 규칙**:
  - `Accessibility` — icon 버튼 aria-label, 시맨틱 HTML 우선, aria-live, skip link
  - `Focus States` — focus-visible:ring-*, outline-none 금지 (대체 없으면)
  - `Forms` — autocomplete, paste 차단 금지, 에러 인라인 표시, 첫 에러로 포커스 이동
  - `Animation` — prefers-reduced-motion 준수, transform/opacity만 애니메이션, `transition: all` 금지
  - `Typography` — `…` not `...`, 곡선 따옴표, tabular-nums, text-wrap: balance
  - `Performance` — 50개+ 목록 가상화, layout read 렌더 중 금지, preconnect
  - `Navigation & State` — URL이 상태 반영, 파괴적 액션은 확인 모달 또는 undo
  - `Touch & Interaction` — touch-action: manipulation, overscroll-behavior: contain
  - `Dark Mode` — color-scheme: dark, theme-color meta
  - `Content & Copy` — 능동태, Title Case, 구체적 버튼 라벨("Save API Key" not "Continue")
  - `Anti-patterns` — user-scalable=no, transition:all, outline-none, div+onClick 금지
- **추가 스킬**: `react-best-practices`(40+ 규칙), `react-view-transitions`, `composition-patterns`
- **적용 가능**: deck-reviewer 에이전트의 HTML 슬라이드 품질 체크에 이 규칙셋 부분 이식 (접근성·타이포·애니메이션 섹션)

### Designer Skills Collection
- **링크**: https://github.com/Owl-Listener/designer-skills
- **설치**: `/plugin marketplace add Owl-Listener/designer-skills` → `/plugin` Discover 탭
- **요약**: 디자이너 전체 워크플로를 63개 스킬 + 27개 커맨드로 패키징한 Claude Code 플러그인 컬렉션. 스킬(도메인 지식 단위)과 커맨드(여러 스킬을 연결하는 워크플로)를 구분한 구조.
- **8개 플러그인**:
  | 플러그인 | 스킬 | 커맨드 | 내용 |
  |---|---|---|---|
  | `design-research` | 10 | 4 | 페르소나, 공감 지도, 여정 지도, 인터뷰, 사용성 테스트 |
  | `design-systems` | 8 | 3 | 토큰, 컴포넌트, 접근성, 테마, 문서화 |
  | `ux-strategy` | 8 | 3 | 경쟁 분석, 디자인 원칙, 경험 매핑 |
  | `ui-design` | 9 | 4 | 레이아웃 그리드, 색상 시스템, 타이포, 반응형, 데이터 시각화 |
  | `interaction-design` | 7 | 3 | 마이크로 애니메이션, 상태 머신, 제스처, 에러 처리 |
  | `prototyping-testing` | 8 | 4 | 프로토타이핑 전략, 사용성 테스트, 휴리스틱 평가, A/B |
  | `design-ops` | 7 | 3 | 크리틱 프레임워크, 핸드오프 스펙, 스프린트 계획 |
  | `designer-toolkit` | 6 | 3 | 디자인 근거 작성, 발표 구성, 케이스 스터디 |
- **주요 커맨드**:
  - `/ui-design:color-palette` — 접근성 체크 포함 전체 색상 팔레트 생성
  - `/ui-design:type-system` — 완성 타이포그래피 시스템 생성
  - `/design-systems:audit-system` — 일관성·접근성 감사
  - `/prototyping-testing:evaluate` — 휴리스틱 평가 실행
  - `/designer-toolkit:build-presentation` — 발표 구조화
  - `/designer-toolkit:write-rationale` — 디자인 결정 근거 문서화
- **적용 가능**: `/designer-toolkit:build-presentation`은 presentation 파이프라인과 직접 연결 가능. `/ui-design:color-palette`, `/ui-design:type-system`은 visual-designer 자유 모드 품질 보강에 활용

### UI Skills (ibelick)
- **링크**: https://github.com/ibelick/ui-skills (공식: https://ui-skills.com)
- **설치**: `npx skills add ibelick/ui-skills` 또는 `npx ui-skills add --all`
- **요약**: AI가 만든 인터페이스를 다듬는 4개 집중 스킬. 범위가 좁고 규칙이 날카로운 게 특징 — `<file>` 인수를 주면 위반 항목·이유·구체 수정안을 라인 단위로 출력.
- **4개 스킬**:
  - `/baseline-ui` — Tailwind 일관성 베이스라인. 애니메이션(`transform`/`opacity`만, 200ms 이하), 컴포넌트 접근성(Base UI·Radix·React Aria), `h-dvh` 강제, paste 차단 금지 등
  - `/fixing-accessibility` — 접근성 8개 우선순위 감사. accessible name(critical) → 키보드 접근(critical) → 포커스/다이얼로그(critical) → 시맨틱(high) → 폼·에러(high) → 라이브 알림 → 대비·상태 → 미디어·모션
  - `/fixing-metadata` — 타이틀·설명·canonical·OG·Twitter card·favicon·JSON-LD 감사. 중복 메타 critical, 소셜 카드 4순위
  - `/fixing-motion-performance` — 애니메이션 성능 감사. 레이아웃 읽기/쓰기 인터리빙 금지, scrollTop 기반 애니메이션 금지, rAF 루프 종료 조건 필수, 다중 애니메이션 시스템 혼용 금지
- **규칙 포맷**: 위반 라인 인용 → 이유 1문장 → 코드 수정안 (최소 변경 원칙)
- **적용 가능**: `/baseline-ui`·`/fixing-accessibility` 규칙을 deck-reviewer HTML 슬라이드 감사에 이식. `/fixing-motion-performance`는 슬라이드 CSS 애니메이션 품질 체크에 직접 활용

### Design Plugin (design-and-refine)
- **링크**: https://github.com/0xdesign/design-plugin
- **설치**: `/plugin marketplace add 0xdesign/design-plugin` → `/plugin install design-and-refine@design-plugins`
- **요약**: 단일 컴포넌트/페이지에 대해 5가지 변형을 동시 생성 → 브라우저 나란히 비교 → Figma 스타일 피드백 → 합성 → 반복하는 UI 이터레이션 루프. 목업이 아닌 실제 작동 코드로 생성.
- **워크플로**:
  1. **Preflight** — 프레임워크·스타일 시스템 자동 감지
  2. **Style inference** — Tailwind config·CSS 변수에서 디자인 토큰 읽기
  3. **Interview** — 대상·페인포인트·영감·사용자·핵심 태스크 인터뷰
  4. **Generation** — 5가지 변형 (정보 위계·레이아웃 모델·밀도·인터랙션 패턴·시각 표현 각각 다르게)
  5. **Review** — `/__design_lab` 라우트에서 나란히 비교
  6. **Feedback** — Figma 스타일 오버레이로 요소별 클릭 코멘트 → 구조화 피드백 전달
  7. **Finalize** — 임시 파일 전체 삭제 + `DESIGN_PLAN.md` 생성
- **영구 산출물**: `DESIGN_PLAN.md`(구현 단계·컴포넌트 API·접근성 체크리스트), `DESIGN_MEMORY.md`(스타일 결정 캡처, 다음 세션 가속)
- **특징**: 기존 디자인 시스템 자동 반영, 임시 파일 흔적 없이 정리, "Linear의 밀도", "Stripe의 명료함" 같은 레퍼런스 언급 지원
- **적용 가능**: presentation A/B 테스트 파이프라인(Phase 3)과 구조가 동일 — 변형 생성→비교→피드백→합성. `DESIGN_MEMORY.md` 패턴을 슬라이드 세션 간 스타일 일관성 유지에 응용 가능

### Super Design
- **링크**: https://github.com/superdesigndev/superdesign (공식: https://superdesign.dev)
- **설치**: Cursor / VS Code 익스텐션 마켓플레이스. Claude Code에는 rules 자동 추가 방식.
- **요약**: IDE 내장 오픈소스 디자인 에이전트. 자연어 프롬프트 → UI 목업·컴포넌트·와이어프레임 생성. 항상 3개 병렬 변형을 동시 생성해 빠른 이터레이션 지원. `.superdesign/design_iterations/` 폴더에 HTML로 저장.
- **시스템 프롬프트 핵심 디자인 원칙**:
  - 역할: **senior front-end designer** — 픽셀·간격·폰트·색상 모두 주시
  - 스타일: **elegant minimalism + functional design**의 완벽한 균형
  - **Well-proportioned white space** — 넓은 여백으로 클린 레이아웃
  - 명확한 정보 위계 — 미묘한 그림자 + 모듈형 카드 레이아웃
  - **Refined rounded corners**
  - 텍스트는 **흑백만** (black or white)
  - **4pt 또는 8pt 간격 시스템** — 모든 margin·padding·line-height·크기는 정확한 배수
  - Tailwind CSS CDN, 이미지 없이 CSS placeholder만
  - 반응형 필수 (모바일·태블릿·데스크톱 모두 완벽)
- **워크플로**: 프롬프트 → 3개 병렬 변형 생성 → SuperDesign 캔버스에서 나란히 비교 → 선택·이터레이션
- **Chrome 익스텐션**: 웹사이트 UI 클론 기능 별도 제공
- **적용 가능**: 8pt 그리드·흑백 텍스트·refined rounded corners 원칙을 슬라이드 visual-designer 기본 제약으로 이식. 3개 병렬 변형 패턴은 Phase 3 A/B 확장에 참조

### Make Interfaces Feel Better
- **링크**: https://github.com/jakubkrehel/make-interfaces-feel-better
- **설치**: `npx skills add jakubkrehel/make-interfaces-feel-better`
- **원문 아티클**: https://jakub.kr/writing/details-that-make-interfaces-feel-better
- **요약**: 인터페이스 체감 품질을 올리는 작은 디테일들을 코드 수준 규칙으로 정리한 스킬. 단일 큰 변화가 아닌 복리로 쌓이는 작은 원칙들의 집합.
- **16개 핵심 원칙**:
  - **Concentric Border Radius** — 중첩 요소: `outer radius = inner radius + padding`. 불일치가 가장 흔한 "이상한 느낌"의 원인
  - **Optical Alignment** — 기하학적 중앙 정렬이 어색하면 광학적으로 조정 (아이콘·삼각형·비대칭 아이콘)
  - **Shadows over Borders** — 여러 겹 투명 `box-shadow`로 자연스러운 깊이. 보더는 배경색에 고정됨
  - **Interruptible Animations** — 인터랙티브 상태 변화는 CSS transition (중단 가능), 1회 시퀀스는 keyframe
  - **Split & Stagger Enter** — 컨테이너 통째 애니메이션 금지. 시맨틱 단위로 나눠 ~100ms 딜레이 스태거
  - **Subtle Exit** — 퇴장은 입장보다 부드럽게. 전체 height 대신 고정 `translateY` 소량
  - **Contextual Icon Animation** — scale `0.25→1`, opacity `0→1`, blur `4px→0`. spring bounce 반드시 `0`
  - **Font Smoothing** — macOS root에 `-webkit-font-smoothing: antialiased`
  - **Tabular Numbers** — 동적 숫자에 `font-variant-numeric: tabular-nums` (레이아웃 시프트 방지)
  - **Text Wrapping** — 헤딩: `text-wrap: balance`, 본문: `text-wrap: pretty`
  - **Image Outlines** — 이미지에 저투명도 `1px outline`으로 일관된 깊이감
  - **Scale on Press** — 버튼 클릭 시 `scale(0.96)`. 항상 0.96, 0.95 미만 금지
  - **Skip Load Animation** — `AnimatePresence`에 `initial={false}`로 첫 렌더 진입 애니메이션 방지
  - `transition: all` 절대 금지 — 정확한 property 명시
  - `will-change` 아껴쓰기 — transform/opacity/filter만, first-frame stutter 때만
  - **Hit Area 최소 40×40px** — 작은 컨트롤은 pseudo-element로 확장
- **4개 참조 파일**: typography.md / surfaces.md / animations.md / performance.md
- **적용 가능**: visual-designer 슬라이드 HTML에 tabular-nums·text-wrap·concentric radius·shadow 즉시 적용. deck-reviewer 체크리스트에 16항목 Review Checklist 이식

---

## Presentation / Slide Design

_(추가 예정)_

---

## Color & Typography

_(추가 예정)_

---

## Motion & Animation

_(추가 예정)_

---

## Layout & Composition

_(추가 예정)_
