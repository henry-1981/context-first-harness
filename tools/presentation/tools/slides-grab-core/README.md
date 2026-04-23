# slides-grab-core

`slides-grab`와 `slides-grab-copy`가 공유하는 최소 기반 모듈.

공유 책임:

- 슬라이드 목록 조회
- iframe 렌더링용 파일 서빙
- HTML save endpoint
- SSE 기반 파일 변경 알림

의도적으로 제외한 책임:

- Layer 1 inline editing
- Layer 2 AI editing
- bbox selection
- entity gate
- layout editing
