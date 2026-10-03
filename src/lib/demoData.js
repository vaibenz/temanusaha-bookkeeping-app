import { addDays, dayKey, parseDay } from './dates.js';
import { newId } from './storage.js';

// A seeded random generator so the sample shop looks the same on every load.
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const round = (n, step = 500) => Math.round(n / step) * step;

/**
 * Ten weeks of a small grocery warung: steady sales with a weekend lift, stock runs every few days,
 * a weekly loan repayment, and some personal spending still paid from the till.
 * Like the Station 4 card in our pitch, it shows stable sales and positive cash flow, but limited
 * history and mixed personal spending, so the merchant lands on the coaching path.
 */
export function sampleProfile() {
  return { businessName: 'Warung Bu Sari', ownerName: 'Sari', businessType: 'warung', district: 'Gunungkidul, DI Yogyakarta',
           openingCash: 1500000, language: 'en' };
}

export function sampleEntries(today = dayKey(), days = 70) {
  const r = rng(20261003);
  const out = [];
  const push = (date, type, category, amount, note = '') =>
    out.push({ id: newId(), date, type, category, amount: round(amount), note, createdAt: out.length });

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    if (i > 0 && r() < 0.06) continue;               // missed days, like a real notebook
    const dow = parseDay(date).getDay();
    const weekend = dow === 0 || dow === 6 ? 1.25 : 1;
    push(date, 'sale', 'groceries', (760000 + r() * 180000) * weekend);
    push(date, 'sale', 'foodDrinks', (180000 + r() * 120000) * weekend);
    if (r() < 0.6) push(date, 'sale', 'phoneCredit', 50000 + r() * 90000);
    if (i % 3 === 1) push(date, 'expense', 'stock', 2300000 + r() * 800000, 'Restock from wholesaler');
    if (dow === 1) push(date, 'expense', 'loanRepayment', 250000, 'Weekly instalment');
    if (r() < 0.35) push(date, 'expense', 'transport', 20000 + r() * 30000);
    if (r() < 0.55) push(date, 'expense', 'personal', 220000 + r() * 200000, 'Household');
    if (parseDay(date).getDate() === 1) push(date, 'expense', 'rent', 600000, 'Kiosk rent');
    if (parseDay(date).getDate() === 10) push(date, 'expense', 'utilities', 180000, 'Electricity');
  }
  return out;
}
