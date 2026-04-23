function stripInlineStyles(html) {
  return html
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\scolor="[^"]*"/gi, '')
    .replace(/\sbgcolor="[^"]*"/gi, '');
}

export function applyDirectionSkeleton({ html, direction }) {
  const stripped = stripInlineStyles(html)
    .replace(/background:[^;"']+;?/gi, '')
    .replace(/font-family:[^;"']+;?/gi, '')
    .replace(/color:[^;"']+;?/gi, '');

  return [
    `<div class="reference-skeleton" data-direction="${direction}">`,
    stripped,
    '</div>',
  ].join('');
}
