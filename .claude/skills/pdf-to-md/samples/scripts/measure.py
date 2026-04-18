"""
pdf-to-md 회귀 자산 signal 측정 + baseline 스냅샷 (1B: 측정만).

사용:
  python measure.py     # 4 샘플 측정 → metrics.json 갱신 + thresholds.yaml baseline_per_layout 갱신
"""

from __future__ import annotations

import json
import sys
from datetime import date
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
from _lint_core import measure_all  # noqa: E402

SAMPLES = Path(__file__).resolve().parent.parent
METRICS_PATH = SAMPLES / "metrics.json"
THRESHOLDS_PATH = SAMPLES / "thresholds.yaml"

SAMPLE_DEFS = [
    # (rel_path, role, layout, pages)
    ("expected/harness-day1.expected.md", "expected", "slide", 55),
    ("expected/anc-harness-s1.expected.md", "expected", "slide", 24),
    ("damaged/harness-day1.kordoc.md", "damaged", "slide", 55),
    ("damaged/anc-harness-s1.kordoc.md", "damaged", "slide", 24),
]


def load_thresholds() -> dict:
    with THRESHOLDS_PATH.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def compute_baseline_per_layout(samples: dict) -> tuple[dict, list]:
    """spec §7.4.2 — expected 샘플의 layout별 평균 chars/page."""
    by_layout: dict[str, list[float]] = {}
    for info in samples.values():
        if info["role"] != "expected":
            continue
        by_layout.setdefault(info["layout"], []).append(info["chars_per_page"])
    baselines = {layout: sum(v) / len(v) for layout, v in by_layout.items()}
    low_conf = [layout for layout, v in by_layout.items() if len(v) == 1]
    return baselines, low_conf


def measure_samples(baselines: dict) -> dict:
    samples = {}
    for rel_path, role, layout, pages in SAMPLE_DEFS:
        path = SAMPLES / rel_path
        if not path.exists():
            print(f"WARN: {rel_path} not found, skipping")
            continue
        baseline = baselines.get(layout, 300)  # seed fallback
        signals = measure_all(path, pages=pages, baseline=baseline, L=10)
        chars = len(path.read_text(encoding="utf-8"))
        samples[rel_path] = {
            "role": role,
            "layout": layout,
            "pages": pages,
            "chars_per_page": chars / pages,
            "signals": signals,
        }
    return samples


def main():
    thresholds = load_thresholds()
    seed_baselines = thresholds.get("baseline_per_layout", {})

    # 1st pass: seed baseline으로 측정
    samples_pass1 = measure_samples(seed_baselines)

    # baseline_per_layout 재계산 (expected 실측 기반)
    new_baselines, low_conf = compute_baseline_per_layout(samples_pass1)

    # thresholds.yaml에 새 baseline 기록 (signal value는 null 유지)
    thresholds["baseline_per_layout"].update(new_baselines)
    if low_conf:
        existing = thresholds.get("baseline_low_confidence", [])
        for l in low_conf:
            if l not in existing:
                existing.append(l)
        thresholds["baseline_low_confidence"] = existing
    thresholds["updated"] = date.today().isoformat()
    with THRESHOLDS_PATH.open("w", encoding="utf-8") as f:
        yaml.safe_dump(thresholds, f, allow_unicode=True, sort_keys=False)

    # 2nd pass: 새 baseline으로 reference_length_ratio 재측정
    samples_final = measure_samples(new_baselines)

    out = {
        "version": int(date.today().strftime("%Y%m%d")),
        "updated": date.today().isoformat(),
        "samples": samples_final,
        "baseline_per_layout": new_baselines,
        "baseline_low_confidence": low_conf,
    }
    with METRICS_PATH.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(f"Wrote {METRICS_PATH}")
    print(f"Wrote {THRESHOLDS_PATH}")
    print(f"Baselines: {new_baselines}")
    if low_conf:
        print(f"[low-conf]  layouts with only 1 expected sample: {low_conf}")


if __name__ == "__main__":
    main()
