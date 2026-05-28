export type CurrencyCode = 'EUR' | 'USD' | 'INR';

export type ShippingZoneCode = 'DE' | 'EU' | 'INTL';

export type ShippingZone = {
  code: ShippingZoneCode;
  label: string;
  countries: string[];
  estimatedDays: string;
  baseRate: number;
  currency: CurrencyCode;
};

export const SHIPPING_ZONES: ShippingZone[] = [
  {
    code: 'DE',
    label: 'Germany',
    countries: ['DE'],
    estimatedDays: '3-5 business days',
    baseRate: 4.9,
    currency: 'EUR',
  },
  {
    code: 'EU',
    label: 'European Union',
    countries: ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'],
    estimatedDays: '4-8 business days',
    baseRate: 9.9,
    currency: 'EUR',
  },
  {
    code: 'INTL',
    label: 'International',
    countries: ['*'],
    estimatedDays: '7-14 business days',
    baseRate: 19.9,
    currency: 'USD',
  },
];

