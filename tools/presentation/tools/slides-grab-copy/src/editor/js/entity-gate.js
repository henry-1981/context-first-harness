export function replaceTextWithVariable(html, targetText, key) {
  return html.replace(targetText, `{{${key}}}`);
}

export function revertVariable(html, key, originalText) {
  return html.replace(`{{${key}}}`, originalText);
}

export function listVariableTokens(html) {
  return [...html.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((match) => match[1]);
}
