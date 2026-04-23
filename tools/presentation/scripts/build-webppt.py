#!/usr/bin/env python3
"""Build a single-file Web PPT from individual slide HTML files.

Uses <template> elements + Shadow DOM for CSS isolation, JS for viewport scaling.
"""

import glob
import os
import re
import sys


# CSS properties to strip from body {} block (viewport centering artifacts)
STRIP_PROPERTIES = {
    "position", "top", "left", "right", "bottom",
    "transform", "transform-origin",
    "flex-shrink", "--s",
    "margin", "margin-top", "margin-left", "margin-right", "margin-bottom",
}


def parse_slide(filepath: str) -> dict:
    """Parse a slide HTML file, extracting style and body content.

    Returns dict with keys: style, body, imports, warnings.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        raw = f.read()

    warnings = []
    name = os.path.basename(filepath)

    # Extract <style> content
    style_match = re.search(r"<style[^>]*>(.*?)</style>", raw, re.DOTALL)
    if style_match:
        style = style_match.group(1)
    else:
        warnings.append(f"{name}: no <style> tag found")
        style = ""

    # Extract <body> inner HTML
    body_match = re.search(r"<body[^>]*>(.*?)</body>", raw, re.DOTALL)
    if body_match:
        body = body_match.group(1).strip()
    else:
        warnings.append(f"{name}: no <body> tag found")
        body = ""

    # Remove <script> tags from body
    body = re.sub(r"<script[^>]*>.*?</script>", "", body, flags=re.DOTALL).strip()

    # Extract @import URLs
    imports = re.findall(r"""@import\s+url\(\s*['"]?([^'")\s]+)['"]?\s*\)""", style)

    # Process CSS
    style = strip_viewport_css(style)

    return {"style": style, "body": body, "imports": imports, "warnings": warnings}


def strip_viewport_css(css: str) -> str:
    """Remove viewport centering CSS, transform body {} to .slide-root {}."""

    # Remove entire html { ... } block (standalone)
    css = re.sub(r"(?<![,\w])html\s*\{[^}]*\}", "", css)

    # Transform "html, body { ... }" combined selectors
    css = re.sub(r"html\s*,\s*body\s*\{", ".slide-root {", css)

    # Transform body { ... } -> .slide-root { ... } with property filtering (ALL occurrences)
    def transform_body_block(match):
        block_content = match.group(1)
        declarations = re.split(r";", block_content)
        kept = []
        for decl in declarations:
            decl = decl.strip()
            if not decl:
                continue
            prop_match = re.match(r"([a-zA-Z\-]+)\s*:", decl)
            if prop_match:
                prop_name = prop_match.group(1).strip()
                if prop_name in STRIP_PROPERTIES:
                    continue
            kept.append("  " + decl + ";")
        return ".slide-root {\n" + "\n".join(kept) + "\n}"

    css = re.sub(r"(?<![,\w\-])body\s*\{([^}]*)\}", transform_body_block, css)

    # Transform body.classname {} -> .slide-root.classname {}
    css = re.sub(r"(?<![,\w\-])body(\.[a-zA-Z][\w\-]*)", r".slide-root\1", css)

    # Transform body > selector, body ~ selector, etc. -> .slide-root combinator
    css = re.sub(r"(?<![,\w\-])body\s*([>~+])\s*", r".slide-root \1 ", css)

    # Transform body::before/::after -> .slide-root::before/::after
    css = re.sub(r"(?<![,\w\-])body(::(?:before|after))\s*\{", r".slide-root\1 {", css)

    # Shadow DOM: :root doesn't work — remap to .slide-root for CSS custom properties
    css = re.sub(r":root\s*\{", ".slide-root {", css)

    # Append base .slide-root sizing
    css += "\n.slide-root { width: 1920px; height: 1080px; overflow: hidden; position: relative; }\n"

    return css


def build_output(slides: list, title: str) -> str:
    """Build the final single-file HTML output."""
    total = len(slides)

    # Deduplicate @import URLs across all slides
    seen_urls = []
    url_set = set()
    for s in slides:
        for url in s["imports"]:
            if url not in url_set:
                url_set.add(url)
                seen_urls.append(url)

    # Build <link> tags for deduplicated fonts
    link_tags = "\n".join(
        f'<link rel="stylesheet" href="{url}">' for url in seen_urls
    )

    # Build slide wrappers
    wrappers = "\n".join(
        f'<div class="slide-wrapper" id="sw-{i}" style="display:none"></div>'
        for i in range(total)
    )

    # Build <template> elements
    templates = []
    for i, s in enumerate(slides):
        templates.append(
            f'<template id="slide-{i}">'
            f'<style>{s["style"]}</style>'
            f'<div class="slide-root">{s["body"]}</div>'
            f'</template>'
        )
    template_block = "\n".join(templates)

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
{link_tags}
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: 100%; height: 100%; overflow: hidden; background: #000; }}
.slide-wrapper {{
  position: absolute; top: 50%; left: 50%;
  width: 1920px; height: 1080px;
  transform-origin: center center;
}}
.nav-hint {{ position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  color: rgba(255,255,255,0.4); font: 14px sans-serif; z-index: 9999; pointer-events: none;
  transition: opacity 0.3s; }}
.page-indicator {{ position: fixed; bottom: 20px; right: 30px;
  color: rgba(255,255,255,0.5); font: 16px sans-serif; z-index: 9999; pointer-events: none;
  display: none; }}
.page-indicator.visible {{ display: block; }}
</style>
</head>
<body>
{wrappers}

{template_block}

<div class="nav-hint" id="navHint">\u2190 \u2192 \ud0a4\ub85c \uc774\ub3d9 \xb7 F \uc804\uccb4\ud654\uba74 \xb7 I \ud398\uc774\uc9c0 \ud45c\uc2dc</div>
<div class="page-indicator" id="pageIndicator"></div>

<script>
const TOTAL = {total};
let current = 0;

// Attach shadow DOM from templates
document.querySelectorAll('.slide-wrapper').forEach((wrapper, i) => {{
  const tmpl = document.getElementById('slide-' + i);
  const shadow = wrapper.attachShadow({{ mode: 'open' }});
  shadow.appendChild(tmpl.content.cloneNode(true));
}});

// JS-based scaling
function updateScale() {{
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  document.querySelectorAll('.slide-wrapper').forEach(w => {{
    w.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }});
}}
updateScale();
window.addEventListener('resize', updateScale);

function showSlide(idx) {{
  if (idx < 0 || idx >= TOTAL) return;
  document.querySelectorAll('.slide-wrapper').forEach((w, i) => {{
    w.style.display = i === idx ? 'block' : 'none';
  }});
  current = idx;
  document.getElementById('pageIndicator').textContent = (current + 1) + ' / ' + TOTAL;
}}

document.addEventListener('keydown', (e) => {{
  if (e.key === 'ArrowRight' || e.key === ' ') {{ e.preventDefault(); showSlide(current + 1); }}
  if (e.key === 'ArrowLeft') {{ e.preventDefault(); showSlide(current - 1); }}
  if (e.key === 'f' || e.key === 'F') {{
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  }}
  if (e.key === 'i' || e.key === 'I') {{
    document.getElementById('pageIndicator').classList.toggle('visible');
  }}
}});

setTimeout(() => {{ document.getElementById('navHint').style.opacity = '0'; }}, 5000);
showSlide(0);
</script>
</body>
</html>"""


def main():
    if len(sys.argv) < 2:
        print("Usage: python build-webppt.py <slides_dir> [output] [title]")
        sys.exit(1)

    slides_dir = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "output.html"
    title = sys.argv[3] if len(sys.argv) > 3 else "Presentation"

    slide_files = sorted(glob.glob(os.path.join(slides_dir, "slide-*.html")))

    if not slide_files:
        print(f"Error: no slide-*.html files found in {slides_dir}")
        sys.exit(1)

    slides = []
    all_warnings = []
    for f in slide_files:
        parsed = parse_slide(f)
        slides.append(parsed)
        all_warnings.extend(parsed["warnings"])

    output = build_output(slides, title)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(output)

    # Collect unique font URLs for summary
    font_urls = []
    seen = set()
    for s in slides:
        for url in s["imports"]:
            if url not in seen:
                seen.add(url)
                font_urls.append(url)

    # Summary
    size_kb = os.path.getsize(output_path) / 1024
    print(f"Slides:   {len(slides)}")
    if all_warnings:
        print(f"Warnings: {len(all_warnings)}")
        for w in all_warnings:
            print(f"  - {w}")
    if font_urls:
        print(f"Fonts:    {len(font_urls)}")
        for url in font_urls:
            print(f"  - {url}")
    print(f"Size:     {size_kb:.1f} KB")
    print(f"Output:   {output_path}")


if __name__ == "__main__":
    main()
