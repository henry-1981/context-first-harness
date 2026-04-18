#!/usr/bin/env python3
"""Generate weights.png — 비개발자 하네스 가중치 비대칭 시각화.

출력: C:/Project1/assets/weights.png (16:9, 400dpi)
"""
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm

# 한글 폰트
for candidate in ["Malgun Gothic", "NanumGothic", "AppleGothic", "Noto Sans CJK KR"]:
    if any(candidate in f.name for f in fm.fontManager.ttflist):
        plt.rcParams["font.family"] = candidate
        break
plt.rcParams["axes.unicode_minus"] = False

axes = [
    ("맥락 (입력)", 50),
    ("맥락 유지 (누적)", 15),
    ("구조 (폴더·스킬)", 15),
    ("출력 (변환)", 10),
    ("계획·실행·검증", 10),
]
labels = [a[0] for a in axes]
values = [a[1] for a in axes]

# 색상: 50%만 강조, 나머지 회색 그라디언트
colors = ["#1976d2", "#90caf9", "#bbdefb", "#cfd8dc", "#eceff1"]

fig, ax = plt.subplots(figsize=(10, 5.6), dpi=200)
bars = ax.barh(labels, values, color=colors, edgecolor="#333", linewidth=0.8)
ax.invert_yaxis()  # 맥락이 맨 위
ax.set_xlim(0, 55)
ax.set_xlabel("가중치 (%)", fontsize=11)
ax.set_title("비개발자 하네스 6축 가중치 비대칭", fontsize=13, pad=15)

for bar, v in zip(bars, values):
    ax.text(v + 0.8, bar.get_y() + bar.get_height() / 2, f"{v}%",
            va="center", fontsize=11, fontweight="bold")

ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
ax.grid(axis="x", alpha=0.3, linestyle="--")

out = Path("C:/Project1/assets/weights.png")
out.parent.mkdir(parents=True, exist_ok=True)
fig.tight_layout()
fig.savefig(out, dpi=200, bbox_inches="tight", facecolor="white")
print(f"[OK] {out}")
