import ServerService from '../services/serverService';
export const formatMoney = (
  value: number,
  currency = ServerService.getInstance().getCurrency(),
  locale?: string,
) => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(
      locale,
      currency
        ? {style: 'currency', currency}
        : {minimumFractionDigits: 2, maximumFractionDigits: 2},
    ).format(value);
  } catch {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
};
export const formatLocalDate = (
  value: string,
  options?: Intl.DateTimeFormatOptions,
  locale?: string,
) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(locale, options);
};
