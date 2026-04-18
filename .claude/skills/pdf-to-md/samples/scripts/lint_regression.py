"""
pdf-to-md Layer 1 회귀 runner — spec §7.2 (1B 전환판).

실행:
  python lint_regression.py             # 4 샘플 회귀 체크
  python lint_regression.py --verbose   # 상세 signal 출력

Exit code:
  0 — 모든 expected pass + 모든 damaged fail
  1 — 회귀 위반 (expected fail 또는 damaged pass)
  2 — 환경 오류 (thresholds.yaml 없음 등)

1B 설계:
- cutoff는 _lint_core.HEURISTICS (single source)
- thresholds.yaml은 baseline_per_layout만 참조 (signal value/advisory 로직 없음)
- L=10 고정
"""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
from _lint_core import measure_all, HEURISTICS  # noqa: E402

SAMPLES = Path(__file__).resolve().parent.parent
THRESHOLDS_PATH = SAMPLES / "thresholds.yaml"

SAMPLE_DEFS = [
    ("expected/harness-day1.expected.md", "expected", "slide", 55),
    ("expected/anc-harness-s1.expected.md", "expected", "slide", 24),
    ("damaged/harness-day1.kordoc.md", "damaged", "slide", 55),
    ("damaged/anc-harness-s1.kordoc.md", "damaged", "slide", 24),
]


def load_baselines() -> dict:
    if not THRESHOLDS_PATH.exists():
        print(f"ERROR: {THRESHOLDS_PATH} not found. Run measure.py first.", file=sys.stderr)
        sys.exit(2)
    with THRESHOLDS_PATH.open(encoding="utf-8") as f:
        t = yaml.safe_load(f)
    return t.get("baseline_per_layout", {})


def evaluate(text: str, role: str, pages: int, layout: str,
             baselines: dict | None = None) -> dict:
    """spec §5.4 — 본문을 HEURISTICS로 평가.

    Returns: {"pass": bool, "signals": {...}, "failed": [...]}
    """
    if baselines is None:
        baselines = load_baselines()
    baseline = baselines.get(layout, 300)

    with tempfile.NamedTemporaryFile(mode="w", suffix=".md",
                                     encoding="utf-8", delete=False) as tf:
        tf.write(text)
        tmp = Path(tf.name)
    try:
        signals = measure_all(tmp, pages=pages, baseline=baseline, L=10)
    finally:
        tmp.unlink()

    failed = []
    for name, (op, cutoff) in HEURISTICS.items():
        val = signals.get(name)
        if val is None:
            continue
        if op == ">" and val > cutoff:
            failed.append(name)
        elif op == "<" and val < cutoff:
            failed.append(name)

    return {"pass": not failed, "signals": signals, "failed": failed}


def evaluate_file(path: Path, role: str, pages: int, layout: str,
                  baselines: dict) -> dict:
    text = path.read_text(encoding="utf-8")
    return evaluate(text, role=role, pages=pages, layout=layout, baselines=baselines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    baselines = load_baselines()
    violations = []

    for rel_path, role, layout, pages in SAMPLE_DEFS:
        path = SAMPLES / rel_path
        if not path.exists():
            print(f"[skip]  {rel_path}: file missing")
            continue
        result = evaluate_file(path, role=role, pages=pages,
                               layout=layout, baselines=baselines)

        if role == "expected" and not result["pass"]:
            violations.append((rel_path, "expected_failed_lint", result["failed"]))
            status = "FAIL (expected fails lint)"
        elif role == "damaged" and result["pass"]:
            violations.append((rel_path, "damaged_passed_lint", []))
            status = "FAIL (damaged passes lint - regression)"
        else:
            status = "OK"

        print(f"{status:40s}  {rel_path}  failed={result['failed']}")
        if args.verbose:
            for k, v in result["signals"].items():
                print(f"    {k} = {v}")

    if violations:
        print(f"\n{len(violations)} regression violation(s):")
        for path, kind, failed in violations:
            print(f"  - {path}: {kind} (failed={failed})")
        sys.exit(1)

    print("\nAll regression checks passed.")
    sys.exit(0)


if __name__ == "__main__":
    main()
