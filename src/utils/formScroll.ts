/** Move only enough to show the focused control and its nearby results. */
export const focusedScrollOffset = (
  offset: number,
  viewportTop: number,
  viewportHeight: number,
  inputTop: number,
  inputHeight: number,
  spaceBelow: number,
) => {
  const top = viewportTop + 12;
  const bottom = viewportTop + viewportHeight - 12;
  const reserved = Math.min(
    spaceBelow,
    Math.max(0, viewportHeight - inputHeight - 24),
  );
  if (inputTop < top) {
    return Math.max(0, offset + inputTop - top);
  }
  const overflow = inputTop + inputHeight + reserved - bottom;
  return overflow > 0 ? offset + overflow : offset;
};
