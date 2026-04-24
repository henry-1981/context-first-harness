// presentation/.claude/lib/aql-sampler.js

// ISO 2859-1, General Inspection Level II, Acceptance Number 0 (엄격)
const AQL_TABLE = [
  { max: 8, n: 2 },      // A
  { max: 15, n: 3 },     // B
  { max: 25, n: 5 },     // C
  { max: 50, n: 8 },     // D
  { max: 90, n: 13 },    // E
  { max: 150, n: 20 },   // F
  { max: 280, n: 32 },   // G
  { max: 500, n: 50 }    // H
];

export function sampleSize(N) {
  for (const row of AQL_TABLE) {
    if (N <= row.max) return row.n;
  }
  return 50; // 500+ 은 50으로 고정(상한)
}

export function stratifiedSlides(slides, n) {
  if (slides.length === 0) return [];
  if (slides.length <= n) return slides.map(s => s.n);

  const selected = new Set();
  // 1. cover (첫 장)
  selected.add(slides[0].n);
  // 2. 마지막 장
  selected.add(slides[slides.length - 1].n);
  // 3. agenda
  for (const s of slides) if (s.template === 'agenda') selected.add(s.n);
  // 4. 섹션 경계 (section 바뀌는 지점)
  for (let i = 1; i < slides.length; i++) {
    if (slides[i].section != null && slides[i].section !== slides[i - 1].section) {
      selected.add(slides[i].n);
    }
  }
  // 5. 섹션별 첫 장
  const bySection = new Map();
  for (const s of slides) {
    if (s.section == null) continue;
    if (!bySection.has(s.section)) bySection.set(s.section, s.n);
  }
  for (const firstN of bySection.values()) selected.add(firstN);

  // 6. 상한 초과면 우선순위(섹션 첫 장 > 경계 > 마지막 > cover)로 자름 (여기선 단순 랜덤 컷)
  const arr = [...selected];
  if (arr.length > n) {
    return arr.slice(0, n).sort((a, b) => a - b);
  }
  // 7. 미만이면 랜덤 보충
  const remaining = slides.filter(s => !selected.has(s.n)).map(s => s.n);
  while (arr.length < n && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    arr.push(remaining.splice(idx, 1)[0]);
  }
  return arr.sort((a, b) => a - b);
}
