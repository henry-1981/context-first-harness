# References Index

비개발자가 참조하는 **정적 지식**의 박제 위치. AI Agent가 규정·정책·표준 검색 시 이 인덱스부터 참조한다.

## 폴더

| Folder | Description | Documents |
|--------|-------------|-----------|
| [regulations](regulations/INDEX.md) | FDA 규제 체계 3계층 (statute · regulation · guidance) | 153 |

## 사용 패턴

1. 이 파일에서 폴더 확인
2. 하위 INDEX.md로 이동 → 파일 목록 확인
3. 파일 열람

## 콘텐츠 정책

FDA는 공개 서비스이므로 본 레포에는 **statute·regulation을 완전 수록**합니다 (FD&C Act Title 21 Chap 9 Subchap V 117 sections + 21 CFR Subchapter H 35 parts). **Guidance는 전체 494건 중 1건만 sample로 포함**합니다 (Cybersecurity in Medical Devices, 2023).

Guidance sample 1건은 "전수 수록의 대체 목적"이 아니라 **INDEX 드릴다운이 수백 건 중 필요한 1건에 빠르게 도달하는 방식을 시연**하기 위한 설계입니다. 운영 환경에서는 자기 도메인(사업 영역별 guidance, MFDS·EU 등 타 국가 규제)을 이 구조에 맞춰 누적합니다.

## 왜 INDEX 기반 검색인가

규제 레퍼런스를 grep으로 무작정 훑으면 키워드가 수백 파일에 흩뿌려져 있어 신호 대비 잡음이 과해지고 토큰 비용도 폭증합니다. INDEX 트리를 따라 드릴다운하면 경로가 훨씬 짧습니다.

예를 들어 "premarket cybersecurity 요건"을 찾는 경우 다음 3~4번의 INDEX 조회로 목표 문서에 직접 도달합니다.

1. `refs/INDEX.md` → regulations 폴더로
2. `refs/regulations/INDEX.md` → FDA 3계층 중 03-guidance로
3. `refs/regulations/FDA/03-guidance/INDEX.md` → Cybersecurity 문서로
4. 해당 파일 열람

statute 117 sections + regulation 35 parts + guidance 1건을 전수 grep하면 수천 줄을 훑어야 하는 데 비해, INDEX 3단 드릴다운은 **AI Agent가 먼저 참조할 지도**를 제공합니다. 그래서 각 폴더에 INDEX.md가 필수이고, refs/INDEX.md가 진입점 역할을 합니다.

## 컨벤션

- 파일 추가 시 해당 폴더 INDEX.md 갱신 필수
- 한글 파일명은 NFC 정규화 (macOS 출처 NFD 주의)
- 폴더는 영문 kebab-case 또는 region/topic 접두사
