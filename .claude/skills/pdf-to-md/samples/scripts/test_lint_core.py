"""TDD: _lint_core 5개 시그널 함수의 결정적 케이스."""
from __future__ import annotations
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from _lint_core import (cid_health, long_token_ratio, valid_char_ratio,
                         line_length_p99, reference_length_ratio, _is_valid_char)

def test_is_valid_char_letter():
    assert _is_valid_char("가") is True
    assert _is_valid_char("a") is True
    assert _is_valid_char("1") is True
    assert _is_valid_char(".") is True
    assert _is_valid_char(" ") is True

def test_is_valid_char_pua():
    assert _is_valid_char("\ue000") is False  # PUA
    assert _is_valid_char("\u0001") is False  # control

def test_cid_health_perfect():
    assert cid_health("안녕하세요 hello world") == 1.0

def test_cid_health_zero():
    assert cid_health("\ue000\ue001\ue002") == 0.0

def test_cid_health_empty():
    assert cid_health("") == 0.0

def test_long_token_ratio_no_long():
    assert long_token_ratio("짧은 토큰 들 입니다", L=10) == 0.0

def test_long_token_ratio_one_long():
    text = "짧은 토큰 잘일하는환경을설계하는기술"
    r = long_token_ratio(text, L=10)
    assert 0.3 < r < 0.4  # 3 토큰 중 1개

def test_long_token_ratio_empty():
    assert long_token_ratio("", L=10) == 0.0

def test_valid_char_ratio_matches_cid():
    text = "안녕 hello"
    assert valid_char_ratio(text) == cid_health(text)

def test_line_length_p99_short():
    assert line_length_p99("aaa\nbbb\nccc") <= 3

def test_line_length_p99_excludes_blank():
    assert line_length_p99("\n\nabc\n\n") <= 3

def test_line_length_p99_excludes_code_fence():
    text = "short\n```\n" + "x" * 1000 + "\n```\nshort"
    assert line_length_p99(text) <= 10

def test_reference_length_ratio_basic():
    text = "x" * 1000
    r = reference_length_ratio(text, pages=2, baseline=500)
    assert 0.99 < r < 1.01  # 1000 / (2 * 500)

def test_reference_length_ratio_zero_pages():
    assert reference_length_ratio("x", pages=0, baseline=500) == 0.0

if __name__ == "__main__":
    import inspect
    funcs = [f for n, f in inspect.getmembers(sys.modules[__name__], inspect.isfunction) if n.startswith("test_")]
    for f in funcs:
        f()
        print(f"  ✅ {f.__name__}")
    print(f"\n{len(funcs)} tests passed.")
