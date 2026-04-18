# pdf-to-md 회귀 자산 카탈로그

이 디렉토리는 `pdf-to-md` 스킬의 회귀 검증 자산을 보관한다.

## 구조

| 디렉토리 | 내용 | git tracked? |
|---|---|:---:|
| `inputs/` | 원본 PDF (Layer 2 변환 재현 시에만 필요) | ❌ (.gitignored) |
| `expected/` | 정상 변환 결과 — Layer 1 lint pass 기대 | ✅ |
| `damaged/` | 의도적 손상 변환 결과 — Layer 1 lint fail 기대 | ✅ |
| `scripts/` | 측정·회귀 코드 | ✅ |

## 현재 샘플

| 파일 | 분류 | 출처 | 손상 유형 | 상태 |
|---|---|---|---|:---:|
| `expected/harness-day1.expected.md` | 정상 | day1.pdf Vision 변환 | — | ✅ |
| `damaged/harness-day1.kordoc.md` | 손상 | day1.pdf kordoc 변환 | 띄어쓰기 손상 (spec §1.1 Case A) | ✅ |
| `expected/anc-harness-s1.expected.md` | 정상 | s1.pdf Vision 변환 | — | ✅ |
| `damaged/anc-harness-s1.kordoc.md` | 손상 | s1.pdf kordoc 변환 | CID 매핑 손상 (spec §1.1 Case B) | ✅ |

## 원본 PDF 위치

PDF 원본 복원 필요 시:
- `harness-day1.pdf`: `C:/Project/wiki/sources/articles/harness-day1.pdf`
- `anc-harness-s1.pdf`: `C:/Project/wiki/sources/articles/anc-harness-s1.pdf`

## 샘플 확장 절차 (spec §7.5)

새 손상 유형을 만났을 때:

1. 원본 PDF를 `inputs/`에 배치 (임시)
2. 현재 경로 + Vision 각각으로 변환
3. `damaged/` 또는 `expected/`에 저장
4. `python scripts/measure.py` 실행 → `metrics.json` + `thresholds.yaml`의 `baseline_per_layout` 갱신
5. 신규 heuristic cutoff가 필요하면 `_lint_core.HEURISTICS` + `skill.md` 표 동시 갱신 (signal cutoff는 heuristic 박제라 재측정 대상 아님 — 1B 전환)
6. `python scripts/lint_regression.py` 통과 확인
7. 본 README의 "현재 샘플" 섹션에 항목 추가

## 회귀 실행

```bash
python scripts/lint_regression.py
```

Exit code 0 = 모든 expected pass + 모든 damaged fail.
