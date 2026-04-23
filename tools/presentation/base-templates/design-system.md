# Design System — Bbojjak Imitation

## Colors
- Page background: `#F5F0EB`
- Card background: `#FFFBF5`
- Card inner bg: `#FFFFFF`
- Text primary: `#2C2420`
- Text secondary: `#8C8580`
- Accent blue: `#3B82F6`
- Accent blue bg: `#EBF5FF`
- Accent pink bg: `#FFF0F0`
- Accent green: `#22C55E`
- Badge dark: `#1E293B`
- Badge accent: `#3B82F6`

## Typography
- Font: Pretendard
- Title: 32-40px, Bold 700
- Subtitle: 18-20px, Regular 400, color secondary
- Card title: 22-26px, Bold 700
- Body: 16-18px, Regular 400
- Caption: 14px, Regular 400, color secondary
- Number (KPI): 48-64px, Bold 700

## Layout
- Viewport: 1920×1080
- Card padding: 60px 80px (outer), 32px (inner cards)
- Card border-radius: 16px (outer), 12px (inner)
- Card border: 1px solid #E8E4E0
- Gap between cards: 24px
- Footer height: 60px

## Structure (every slide)
- Header: emoji (optional) + title + subtitle
- Body: type-specific content
- Footer: left series name, right category label

## Alignment Rules
- Default: left-aligned (full-width content boxes, left-aligned items)
- On user request "중앙정렬": add `.centered` class to `.card`
  - content-box/step cards shrink to fit-content and center via margin: 0 auto
  - Internal layout (icon + text horizontal) is preserved — never stack vertically
- closing: same padding/font scale as other templates (48px 52px, 28px title, 15px body)
  - No min-height constraint — let content determine height

## Capture
- Viewport: 960×540, deviceScaleFactor: 2
- Screenshot: .card element only (not full page)
- Output: 1760px wide PNG, display at 880px CSS for Retina sharpness
