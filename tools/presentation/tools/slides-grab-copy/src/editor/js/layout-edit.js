export function moveBlock(block, x, y) {
  return { ...block, x, y };
}

export function resizeBlock(block, width, height) {
  return { ...block, width, height };
}

export function deleteBlock(blocks, id) {
  return blocks.filter((block) => block.id !== id);
}

export function restoreBlock(blocks, block, index = blocks.length) {
  const next = [...blocks];
  next.splice(index, 0, block);
  return next;
}
