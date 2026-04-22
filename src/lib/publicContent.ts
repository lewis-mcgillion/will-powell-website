export const visibleByOrder = <T extends { sortOrder: number; isVisible: boolean }>(items: T[]) =>
  items.filter((item) => item.isVisible).sort((a, b) => a.sortOrder - b.sortOrder);

export const getList = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

export const hasPlaceholder = (value = '') => {
  const normalized = value.trim().toLowerCase();
  return (
    /\[(phone number|whats?app number|area|town)\]/i.test(value) ||
    normalized.includes('will@example.com') ||
    (normalized.startsWith('add ') && normalized.includes('will')) ||
    (normalized.startsWith('add ') && normalized.includes('main brands')) ||
    normalized.startsWith('add the towns')
  );
};

export const publicText = (value: string) => (value.trim() && !hasPlaceholder(value) ? value.trim() : '');

export const phoneHref = (phone: string) => {
  if (!publicText(phone)) return undefined;
  const digits = phone.replace(/[^\d+]/g, '');
  return digits.replace(/\D/g, '').length >= 7 ? `tel:${digits}` : undefined;
};
