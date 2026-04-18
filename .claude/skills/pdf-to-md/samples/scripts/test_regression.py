"""TDD: lint_regression.evaluate() 단위 테스트 — HEURISTICS 기반."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from lint_regression import evaluate  # noqa: E402


# baseline override: test에서 thresholds.yaml 없이 돌리기 + 안정 margin
TEST_BASELINES = {"body": 300, "slide": 300}


def test_perfect_expected_passes():
    """정상 한국어 본문은 expected role에서 pass."""
    text = "안녕하세요. 이것은 정상적인 한국어 문서입니다.\n" * 40  # ~960 chars
    result = evaluate(text, role="expected", pages=1, layout="body", baselines=TEST_BASELINES)
    assert result["pass"] is True, f"expected should pass: {result}"


def test_cid_broken_damaged_fails():
    """PUA/invalid 글리프 본문은 damaged에서 fail (valid_char_ratio 또는 cid_health)."""
    text = "\ue000\ue001\ue002\ue003\ue004\n" * 100  # pure PUA
    result = evaluate(text, role="damaged", pages=1, layout="body", baselines=TEST_BASELINES)
    assert result["pass"] is False, f"damaged should fail: {result}"


def test_long_token_damaged_fails():
    """연속 긴 토큰(L>=10) 본문은 damaged에서 fail (long_token_ratio)."""
    text = ("잘일하는환경을설계하는기술이라는것을생각해보면 " * 30)  # many L>=10 tokens
    result = evaluate(text, role="damaged", pages=1, layout="body", baselines=TEST_BASELINES)
    assert result["pass"] is False, f"damaged should fail: {result}"


def test_drop_damaged_fails():
    """극단 drop 본문은 damaged에서 fail (reference_length_ratio)."""
    text = "짧음\n"  # very small body, baseline 300 → ratio << 0.30
    result = evaluate(text, role="damaged", pages=1, layout="body", baselines=TEST_BASELINES)
    assert result["pass"] is False, f"damaged should fail: {result}"


if __name__ == "__main__":
    import inspect
    funcs = [f for n, f in inspect.getmembers(sys.modules[__name__], inspect.isfunction) if n.startswith("test_")]
    for f in funcs:
        f()
        print(f"  [OK] {f.__name__}")
    print(f"\n{len(funcs)} tests passed.")
