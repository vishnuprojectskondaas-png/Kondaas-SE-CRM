/**
 * Centralized utility for handling and parsing KSEB Bill strings and ranges
 * Supports formats like:
 * - "2000-4000" or "2000 - 4000"
 * - "3000 to 5000"
 * - "₹4,500 / Bi-monthly"
 * - "3500"
 */

export interface ParsedBill {
  min: number;
  max: number;
  avg: number;
  isRange: boolean;
  raw: string;
}

export function parseKsebBill(billInput: string | number | null | undefined): ParsedBill {
  if (billInput === null || billInput === undefined) {
    return { min: 0, max: 0, avg: 0, isRange: false, raw: '' };
  }

  const raw = String(billInput).trim();
  if (!raw) {
    return { min: 0, max: 0, avg: 0, isRange: false, raw: '' };
  }

  // Extract all number sequences (handles commas like 2,000 and decimals)
  const matches = raw.match(/(\d+(?:,\d+)*(?:\.\d+)?)/g);

  if (matches && matches.length >= 2 && (raw.includes('-') || raw.toLowerCase().includes('to'))) {
    const val1 = parseFloat(matches[0].replace(/,/g, ''));
    const val2 = parseFloat(matches[1].replace(/,/g, ''));
    if (!isNaN(val1) && !isNaN(val2)) {
      const min = Math.min(val1, val2);
      const max = Math.max(val1, val2);
      return {
        min,
        max,
        avg: (min + max) / 2,
        isRange: min !== max,
        raw,
      };
    }
  }

  if (matches && matches.length >= 1) {
    const val = parseFloat(matches[0].replace(/,/g, ''));
    if (!isNaN(val)) {
      return {
        min: val,
        max: val,
        avg: val,
        isRange: false,
        raw,
      };
    }
  }

  return { min: 0, max: 0, avg: 0, isRange: false, raw };
}

/**
 * Calculate estimated Solar kW based on KSEB Bill (rough benchmark: ~₹1,200/mo or ~₹2,400/bi-monthly per kW)
 */
export function estimateSolarFromBill(billInput: string | number | null | undefined): {
  estimatedKwText: string;
  minKw: number;
  maxKw: number;
  avgKw: number;
  annualSavingsText: string;
} {
  const parsed = parseKsebBill(billInput);
  if (parsed.avg <= 0) {
    return {
      estimatedKwText: '0 kW',
      minKw: 0,
      maxKw: 0,
      avgKw: 0,
      annualSavingsText: '₹0',
    };
  }

  // Determine if bi-monthly is mentioned or assume standard bi-monthly billing in Kerala (KSEB)
  const isMonthly = /month(ly)?/i.test(parsed.raw) && !/bi-?monthly/i.test(parsed.raw);
  const monthlyMin = isMonthly ? parsed.min : parsed.min / 2;
  const monthlyMax = isMonthly ? parsed.max : parsed.max / 2;
  const monthlyAvg = isMonthly ? parsed.avg : parsed.avg / 2;

  // 1 kW roughly saves ~₹1,000 to ₹1,200 monthly
  const minKw = Math.max(1, Math.round((monthlyMin / 1100) * 10) / 10);
  const maxKw = Math.max(1, Math.round((monthlyMax / 1100) * 10) / 10);
  const avgKw = Math.max(1, Math.round((monthlyAvg / 1100) * 10) / 10);

  const minSavings = Math.round(monthlyMin * 12 * 0.9);
  const maxSavings = Math.round(monthlyMax * 12 * 0.9);

  let estimatedKwText = `${avgKw} kW`;
  let annualSavingsText = `₹${minSavings.toLocaleString('en-IN')}`;

  if (parsed.isRange) {
    estimatedKwText = `${minKw} - ${maxKw} kW`;
    annualSavingsText = `₹${minSavings.toLocaleString('en-IN')} - ₹${maxSavings.toLocaleString('en-IN')}`;
  }

  return {
    estimatedKwText,
    minKw,
    maxKw,
    avgKw,
    annualSavingsText,
  };
}
