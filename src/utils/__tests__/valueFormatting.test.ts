import {formatMoney, formatLocalDate} from '../valueFormatting';
it('uses the server currency and device locale rather than dollars', () => {
  expect(formatMoney(1234.5, 'EUR', 'de-DE')).toBe(
    new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(
      1234.5,
    ),
  );
  expect(formatMoney(1234.5, 'JPY', 'en-US')).toBe(
    new Intl.NumberFormat('en-US', {style: 'currency', currency: 'JPY'}).format(
      1234.5,
    ),
  );
});
it('does not guess a currency when unavailable', () => {
  expect(formatMoney(12.5, '', 'de-DE')).toBe('12,50');
});
it('formats dates using the chosen locale and rejects invalid dates', () => {
  expect(
    formatLocalDate(
      '2026-10-13',
      {year: 'numeric', month: '2-digit', day: '2-digit'},
      'de-DE',
    ),
  ).toBe('13.10.2026');
  expect(formatLocalDate('invalid')).toBe('—');
});
