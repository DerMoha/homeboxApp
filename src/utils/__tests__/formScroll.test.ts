import {focusedScrollOffset} from '../formScroll';
it('leaves an already visible field and results in place', () => {
  expect(focusedScrollOffset(200, 100, 400, 150, 52, 160)).toBe(200);
});
it('keeps location matches above the keyboard with the search input', () => {
  const next = focusedScrollOffset(0, 100, 400, 400, 52, 160);
  expect(400 - next + 52 + 160).toBeLessThanOrEqual(488);
  expect(400 - next).toBeGreaterThanOrEqual(112);
});
it('moves back only enough when the focused field is above the viewport', () => {
  expect(focusedScrollOffset(300, 100, 400, 80, 52, 24)).toBe(268);
});
it('keeps the input visible on a short viewport instead of scrolling past it', () => {
  const next = focusedScrollOffset(0, 100, 120, 170, 52, 160);
  expect(170 - next).toBeGreaterThanOrEqual(112);
});
