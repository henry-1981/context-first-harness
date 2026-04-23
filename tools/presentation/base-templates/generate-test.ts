import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { chromium } from 'playwright';

const TEMPLATES_DIR = resolve(import.meta.dirname, 'templates');
const OUTPUT_DIR = resolve(import.meta.dirname, 'output');

function fill(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

const slides: { template: string; data: Record<string, string> }[] = [
  {
    template: 'cover.html',
    data: {
      SERIES: 'SOP 교육 · DP1101 §5.1.3',
      TITLE: '신규 문서 교육',
      SUBTITLE: 'DP0001 품질경영매뉴얼 · DP1304 내부감사',
      INFO1_LABEL: '교육일', INFO1_VALUE: '2026-03-27',
      INFO2_LABEL: '대상', INFO2_VALUE: '데이터부문 전 임직원',
      INFO3_LABEL: '신규 제정', INFO3_VALUE: 'DP0001 V1.0 · DP1304 V1.0',
      FOOTER_LEFT: '카카오헬스케어 · 데이터부문',
      TAG1: 'Playwright', TAG2: 'deviceScaleFactor',
    },
  },
  {
    template: 'two-column-compare.html',
    data: {
      EMOJI: '🎨',
      TITLE: '왜 HTML로 이미지를 만들어요?',
      SUBTITLE: 'AI 이미지 생성 vs HTML 캡처',
      LEFT_BADGE: 'AI 이미지 생성', LEFT_TITLE: 'DALL-E · Midjourney',
      L1_ICON: '❌', L1_TEXT: '텍스트가 제멋대로',
      L2_ICON: '❌', L2_TEXT: '정확한 레이아웃 제어 불가',
      L3_ICON: '❌', L3_TEXT: '매번 다른 결과물',
      L4_ICON: '⚠️', L4_TEXT: '일관된 시리즈 만들기 어려움',
      RIGHT_BADGE: 'HTML + Playwright', RIGHT_TITLE: '코드로 만든 이미지',
      R1_ICON: '✅', R1_TEXT: '텍스트 100% 정확',
      R2_ICON: '✅', R2_TEXT: '픽셀 단위 레이아웃 제어',
      R3_ICON: '✅', R3_TEXT: '같은 입력 → 같은 결과',
      R4_ICON: '🚀', R4_TEXT: '템플릿 1개로 대량 생산',
      BOTTOM_NOTE: '필요한 건 예술 작품이 아니라 <span class="highlight">정보를 담은 카드</span>. 웹 페이지를 만들고, 그걸 사진 찍자.',
      FOOTER_LEFT: '카카오헬스케어 · 데이터부문',
      FOOTER_TAG: 'HTML → PNG 파이프라인',
    },
  },
  {
    template: 'vertical-steps.html',
    data: {
      EMOJI: '🐛',
      TITLE: '삽질 로그 — 3가지 함정',
      SUBTITLE: '처음부터 순조롭지는 않았어요',
      S1_TITLE: '하단 여백의 미스터리',
      S1_BADGE: '원인',
      S1_DESC: 'fullPage: true → viewport 전체 높이만큼 빈 공간 캡처',
      S1_FIX: '.card 요소만 골라서 element screenshot',
      S2_TITLE: 'backdrop-filter 그 녀석',
      S2_BADGE: '원인',
      S2_DESC: 'headless 브라우저에서 blur() 렌더링 실패 → 까만색',
      S2_FIX: 'backdrop-filter 대신 rgba() 반투명 배경색 사용',
      S3_TITLE: '폰트가 안 뜨는 사건',
      S3_BADGE: '원인',
      S3_DESC: 'CDN 폰트 로딩 전에 캡처 → 시스템 폰트로 찍힘',
      S3_FIX: "waitForLoadState('networkidle') → 폰트 로딩 완료 대기",
      FOOTER_LEFT: '카카오헬스케어 · 데이터부문',
      FOOTER_TAG: '삽질 로그',
    },
  },
];

async function main() {
  // Generate HTML files
  for (let i = 0; i < slides.length; i++) {
    const { template, data } = slides[i];
    const html = fill(readFileSync(resolve(TEMPLATES_DIR, template), 'utf8'), data);
    writeFileSync(resolve(OUTPUT_DIR, `slide-${String(i + 1).padStart(2, '0')}.html`), html);
  }

  // Capture PNGs — bbojjak style: 960 viewport + deviceScaleFactor:2 + .card element screenshot
  const browser = await chromium.launch();
  for (let i = 0; i < slides.length; i++) {
    const htmlPath = resolve(OUTPUT_DIR, `slide-${String(i + 1).padStart(2, '0')}.html`);
    const context = await browser.newContext({
      viewport: { width: 960, height: 540 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
    try { await page.evaluate(async () => { if ((document as any).fonts?.ready) await (document as any).fonts.ready; }); } catch {}

    // Element screenshot on .card — just like bbojjak
    const card = await page.$('.card');
    if (card) {
      const buf = await card.screenshot({ type: 'png' });
      writeFileSync(resolve(OUTPUT_DIR, `slide-${String(i + 1).padStart(2, '0')}.png`), buf);
      console.log(`Generated: slide-${String(i + 1).padStart(2, '0')}`);
    } else {
      console.error(`No .card element found in slide-${String(i + 1).padStart(2, '0')}`);
    }
    await page.close();
    await context.close();
  }
  await browser.close();

  // Generate index.html
  let indexHtml = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>Bbojjak Imitation Test</title>
<style>body{font-family:Pretendard,sans-serif;background:#f5f5f5;padding:40px;margin:0}
h1{font-size:24px;margin-bottom:32px}.card{background:white;border-radius:12px;padding:24px;margin-bottom:24px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
img{width:100%;border-radius:8px;border:1px solid #eee}</style></head><body>
<h1>Bbojjak Imitation — 3종 테스트 v2</h1>`;
  for (let i = 0; i < slides.length; i++) {
    const name = slides[i].template.replace('.html', '');
    indexHtml += `<div class="card"><h2>#${i + 1} ${name}</h2><img src="slide-${String(i + 1).padStart(2, '0')}.png"></div>`;
  }
  indexHtml += '</body></html>';
  writeFileSync(resolve(OUTPUT_DIR, 'index.html'), indexHtml);
  console.log('Done! Open: bbojjak-imitation/output/index.html');
}
main();
