# Regulations Reference Index

의료기기 규정 참조 DB 패턴. AI Agent가 규정 검색 시 이 인덱스부터 참조.

## 콘텐츠 정책

FDA는 공개 서비스이므로 **statute·regulation은 완전 수록**하고, **guidance는 494건 중 1건만 sample로 포함**합니다. 이 비대칭이 바로 INDEX 기반 검색의 설계 의도를 드러냅니다 — statute·regulation은 "있으니 쓰자"(전수 보유) 관점이고, guidance는 "찾을 수 있다"(INDEX 드릴다운 경로)를 증명하는 포인터 sample입니다.

실제 운영에서는 자기 업무 영역의 guidance와 타 국가 규제(MFDS·EU 등)를 region별·계층별로 추가합니다. 상세 설계 배경은 [`refs/INDEX.md`](../INDEX.md)의 "왜 INDEX 기반 검색인가" 섹션 참조.

## 운영 시 권장 구조

```
regulations/
├── fda/                          # 미국 FDA
│   ├── 01-statute/INDEX.md       # FD&C Act
│   ├── 02-regulation/INDEX.md    # 21 CFR
│   └── 03-guidance/INDEX.md      # FDA Guidance ← 본 레포 sample 위치
├── mfds/                         # 한국 MFDS
│   ├── 01-법령/INDEX.md
│   └── 02-가이드라인/INDEX.md
└── eu/                           # 유럽 EU
    ├── 01-regulation/INDEX.md    # MDR/IVDR
    ├── 02-mdcg/INDEX.md          # MDCG Guidance
    └── 03-meddev/INDEX.md        # MEDDEV
```

## 현재 포함

| Region | Layer | Files | 비고 |
|--------|-------|:-----:|------|
| FDA | [01-statute](FDA/01-statute/INDEX.md) | 117 | FD&C Act Title 21 Chapter 9 Subchapter V (drugs & devices) |
| FDA | [02-regulation](FDA/02-regulation/INDEX.md) | 35 | 21 CFR Subchapter H (medical devices) |
| FDA | [03-guidance](FDA/03-guidance/INDEX.md) | 1 | sample (cybersecurity guidance) |

## 컨벤션

- 각 폴더에 INDEX.md 필수 (파일 목록·메타 요약)
- 파일명은 `{NNN}_{snake_case_title}.md` 형식 (NNN = priority/relevance 번호)
- frontmatter에 source 메타 박제 (docket, instrument, family, converted date 등)
