import type { SiteThemeKey } from '../types';

export interface SiteTheme {
  key: SiteThemeKey;
  name: string;
  description: string;
  swatches: string[];
}

export const siteThemes: SiteTheme[] = [
  {
    key: 'classic-navy',
    name: 'Classic navy',
    description: 'Traditional navy, cream and amber.',
    swatches: ['#173b63', '#f2c230', '#fffdf7'],
  },
  {
    key: 'burgundy-cream',
    name: 'Burgundy cream',
    description: 'Warmer, heritage trade-card colours.',
    swatches: ['#5f1f2e', '#d9a441', '#fff8ed'],
  },
  {
    key: 'forest-cream',
    name: 'Forest cream',
    description: 'Classic green with a calm cream background.',
    swatches: ['#1f4d3a', '#d6b14a', '#fbf7ed'],
  },
  {
    key: 'slate-amber',
    name: 'Slate amber',
    description: 'Softer blue-grey with a strong call button.',
    swatches: ['#334155', '#f59e0b', '#f8fafc'],
  },
];

export const isSiteThemeKey = (value: string): value is SiteThemeKey =>
  siteThemes.some((theme) => theme.key === value);
