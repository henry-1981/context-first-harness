#!/usr/bin/env python3
"""Generate weights.png — 개발자 6축 vs 비개발자 재정의 비교 시각화.

출력: C:/Project1/assets/weights.png
"""
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import matplotlib.patches as mpatches

# 한글 폰트
for candidate in ["Malgun Gothic", "NanumGothic", "AppleGothic", "Noto Sans CJK KR"]:
    if any(candidate in f.name for f in fm.fontManager.ttflist):
        plt.rcParams["font.family"] = candidate
        break
plt.rcParams["axes.unicode_minus"] = False

# 개발자 6축 (균등)
dev_axes = [
    ("개선 (Compounding)", 16.7),
    ("검증 (Verification)", 16.7),
    ("실행 (Execution)",   16.7),
    ("계획 (Planning)",    16.7),
    ("맥락 (Context)",     16.7),
    ("구조 (Scaffolding)", 16.7),
]
# 비개발자 재정의 (매핑 순서 맞춤)
ndev_axes = [
    ("맥락 유지(누적)\n← 개선",       15),
    ("계획·실행·검증 합산\n← 계획+실행+검증", 10),
    ("출력(변환)\n← 실행",            10),
    ("← (계획에 통합)",               0),   # 계획 축 — 통합됨 (표시용)
    ("맥락(입력)\n← 맥락",            50),
    ("구조(폴더·스킬)\n← 구조",       15),
]

# 색상 매핑 (축별 고유 색)
axis_colors = {
    "구조":  "#90caf9",   # 파랑 계열
    "맥락":  "#1976d2",   # 진파랑 (가장 강조)
    "계획":  "#ef9a9a",   # 연빨강
    "실행":  "#ffcc80",   # 주황
    "검증":  "#ef9a9a",   # 연빨강 (계획+검증 합산)
    "개선":  "#a5d6a7",   # 녹색
    "통합":  "#e0e0e0",   # 회색 (사라진 축)
}

dev_colors  = [axis_colors["개선"], axis_colors["검증"], axis_colors["실행"],
               axis_colors["계획"],  axis_colors["맥락"], axis_colors["구조"]]
ndev_colors = [axis_colors["개선"],  axis_colors["검증"],  axis_colors["실행"],
               axis_colors["통합"],  axis_colors["맥락"], axis_colors["구조"]]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), sharey=False)
fig.subplots_adjust(wspace=0.45)

def draw_bars(ax, axes_data, colors, title, show_pct=True):
    labels = [a[0] for a in axes_data]
    values = [a[1] for a in axes_data]
    bars = ax.barh(labels, values, color=colors, edgecolor="#555", linewidth=0.7, height=0.65)
    ax.invert_yaxis()
    ax.set_xlim(0, 58)
    ax.set_xlabel("가중치 (%)", fontsize=10)
    ax.set_title(title, fontsize=12, pad=12, fontweight="bold")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.grid(axis="x", alpha=0.25, linestyle="--")
    if show_pct:
        for bar, v in zip(bars, values):
            if v > 0:
                ax.text(v + 0.8, bar.get_y() + bar.get_height() / 2,
                        f"{v:.0f}%", va="center", fontsize=10, fontweight="bold")

draw_bars(ax1, dev_axes,  dev_colors,  "개발자 하네스 6축 (균등 가중)")
draw_bars(ax2, ndev_axes, ndev_colors, "비개발자 재정의 (맥락 중심)")

# 범례
legend_items = [
    mpatches.Patch(color=axis_colors["맥락"],  label="맥락 — 16.7% -> 50%  (대폭 확대)"),
    mpatches.Patch(color=axis_colors["구조"],  label="구조 — 16.7% -> 15%  (유사)"),
    mpatches.Patch(color=axis_colors["개선"],  label="개선 -> 맥락 유지 15%  (재명명)"),
    mpatches.Patch(color=axis_colors["실행"],  label="실행 -> 출력 10%  (축소)"),
    mpatches.Patch(color=axis_colors["검증"],  label="계획+실행+검증 -> 합산 10%  (3축 통합)"),
    mpatches.Patch(color=axis_colors["통합"],  label="(계획 축 독립 소멸)"),
]
fig.legend(handles=legend_items, loc="lower center", ncol=3,
           fontsize=9, framealpha=0.9,
           bbox_to_anchor=(0.5, -0.05))

fig.suptitle("하네스 6축 — 개발자 vs 비개발자 가중치 비교", fontsize=13, y=1.02)

out = Path("C:/Project1/assets/weights.png")
fig.savefig(out, dpi=150, bbox_inches="tight", facecolor="white")
print(f"[OK] {out}  ({out.stat().st_size/1024:.1f}KB)")
