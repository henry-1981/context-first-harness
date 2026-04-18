"""
pdf-to-md lint core — spec §5.1, §5.4 시그널 정의의 단일 source of truth.

사용처:
- measure.py: metrics.json 갱신
- lint_regression.py: Layer 1 회귀 runner
- skill.md (인라인 복사본): 운영 시 스킬 본문에서 호출

skill.md의 인라인 코드와 이 파일의 함수 body는 **반드시 동일**해야 한다.
이 파일이 source of truth — 차이 발견 시 skill.md 쪽을 맞춘다.
"""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path

# ────────────────────────────────────────────────────────────────────
# 공통 유틸
# ────────────────────────────────────────────────────────────────────

def _is_valid_char(c: str) -> bool:
    """spec §5.1 cid_health, §5.4 V2 valid_char_ratio 공통 정의.
    L (Letter), N (Number), P (Punctuation), Z (Separator) 만 valid.
    PUA·제어 문자(C*)·미할당 코드포인트는 invalid."""
    cat = unicodedata.category(c)
    return cat[0] in ("L", "N", "P", "Z")


def _strip_code_fences(text: str) -> str:
    """V3 line_length_p99 계산 시 펜스드 코드블록 내부 제외."""
    out_lines = []
    in_fence = False
    for line in text.splitlines():
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            continue
        if not in_fence:
            out_lines.append(line)
    return "\n".join(out_lines)


def _strip_frontmatter(text: str) -> str:
    """YAML frontmatter 제거 (lint 측정에서 메타는 제외)."""
    if not text.startswith("---\n"):
        return text
    end = text.find("\n---\n", 4)
    if end == -1:
        return text
    return text[end + 5:]

# ────────────────────────────────────────────────────────────────────
# OBSERVE: cid_health
# ────────────────────────────────────────────────────────────────────

def cid_health(text: str) -> float:
    """spec §5.1 — valid 문자 비율. 0~1, 1=정상."""
    if not text:
        return 0.0
    valid = sum(1 for c in text if _is_valid_char(c))
    return valid / len(text)

# ────────────────────────────────────────────────────────────────────
# VERIFY 시그널
# ────────────────────────────────────────────────────────────────────

def long_token_ratio(text: str, L: int = 10) -> float:
    """V1 — \\S{L,} 매치 ÷ 전체 non-whitespace 토큰 수.
    L은 spec §5.4·§10에 따라 8/10/12 중 민감도 테스트 후 채택."""
    body = _strip_frontmatter(text)
    tokens = body.split()
    if not tokens:
        return 0.0
    pattern = re.compile(rf"\S{{{L},}}")
    long_count = sum(1 for t in tokens if pattern.fullmatch(t))
    return long_count / len(tokens)


def valid_char_ratio(text: str) -> float:
    """V2 — _is_valid_char 비율. cid_health와 정의 동일."""
    body = _strip_frontmatter(text)
    return cid_health(body)


def line_length_p99(text: str) -> int:
    """V3 — 줄 문자수의 99퍼센타일. 공백 줄·코드블록 내부 제외."""
    body = _strip_frontmatter(text)
    body = _strip_code_fences(body)
    lengths = [len(line) for line in body.splitlines() if line.strip()]
    if not lengths:
        return 0
    lengths.sort()
    idx = int(len(lengths) * 0.99)
    if idx >= len(lengths):
        idx = len(lengths) - 1
    return lengths[idx]


def reference_length_ratio(text: str, pages: int, baseline: float) -> float:
    """V6 — actual_chars / (pages × baseline_per_layout[primary_layout]).
    baseline은 thresholds.yaml의 baseline_per_layout에서 호출자가 조회 후 주입."""
    body = _strip_frontmatter(text)
    actual = len(body)
    expected = pages * baseline
    if expected <= 0:
        return 0.0
    return actual / expected

# ────────────────────────────────────────────────────────────────────
# 도메인 heuristic cutoffs (spec §7.4.1) — single source of truth.
# skill.md §Step 4 VERIFY의 HEURISTICS 블록과 반드시 동일해야 한다.
# op: ">" = signal이 cutoff 초과 시 fail, "<" = cutoff 미만 시 fail
# ────────────────────────────────────────────────────────────────────

HEURISTICS = {
    "long_token_ratio":       (">", 0.10),   # T1 — 띄어쓰기 응집
    "valid_char_ratio":       ("<", 0.80),   # T2 — CID 글리프 치환
    "line_length_p99":        (">", 200),    # T3 — 줄바꿈 손상
    "reference_length_ratio": ("<", 0.30),   # T6 — 텍스트 drop
    "cid_health":             ("<", 0.80),   # T_cid — OBSERVE 라우팅 신뢰
}

# ────────────────────────────────────────────────────────────────────
# 묶음 측정
# ────────────────────────────────────────────────────────────────────

def measure_all(md_path: Path, pages: int, baseline: float, L: int = 10) -> dict:
    """주어진 MD 파일에 5개 시그널 모두 측정."""
    text = md_path.read_text(encoding="utf-8")
    return {
        "cid_health": cid_health(_strip_frontmatter(text)),
        "long_token_ratio": long_token_ratio(text, L=L),
        "valid_char_ratio": valid_char_ratio(text),
        "line_length_p99": line_length_p99(text),
        "reference_length_ratio": reference_length_ratio(text, pages, baseline),
    }
