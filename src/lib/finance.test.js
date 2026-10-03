import { describe, expect, it } from 'vitest';
import { addDays } from './dates.js';
import { sampleEntries } from './demoData.js';
import { cashBalance, daySummary, formatRupiah, healthCheck, readiness, toCsv } from './finance.js';

const TODAY = '2026-10-03';
const e = (date, type, amount, category = type === 'sale' ? 'groceries' : 'stock', note = '') =>
  ({ id: `${date}${type}${amount}${category}`, date, type, amount, category, note, createdAt: 0 });

// A tidy shop: records every day for 100 days, steady sales, no personal spending.
const tidy = Array.from({ length: 100 }, (_, i) => {
  const d = addDays(TODAY, -i);
  return [e(d, 'sale', 1000000), e(d, 'expense', 600000)];
}).flat();

describe('daily summary', () => {
  it('matches the pitch deck example', () => {
    const s = daySummary([e(TODAY, 'sale', 1250000), e(TODAY, 'expense', 720000)], TODAY);
    expect(s).toMatchObject({ sales: 1250000, expenses: 720000, net: 530000 });
    expect(formatRupiah(s.net, { signed: true })).toBe('+Rp 530.000');
  });

  it('tracks cash in the till from the opening balance', () => {
    expect(cashBalance([e(TODAY, 'sale', 500000), e(TODAY, 'expense', 200000)], 1000000)).toBe(1300000);
  });
});

describe('health check', () => {
  it('scores a tidy shop highly on every pillar', () => {
    const h = healthCheck(tidy, TODAY);
    expect(h.records).toBe(100);
    expect(h.cashFlow).toBe(100);
    expect(h.salesExpenses).toBe(100);
    expect(h.payments).toBe(100);
  });

  it('penalises personal spending from the till', () => {
    const mixed = [...tidy, e(TODAY, 'expense', 3000000, 'personal')];
    expect(healthCheck(mixed, TODAY).payments).toBeLessThan(100);
  });

  it('returns nulls before anything is recorded', () => {
    expect(healthCheck([], TODAY).overall).toBeNull();
  });
});

describe('financing readiness', () => {
  it('marks a tidy three-month history as ready', () => {
    const r = readiness(tidy, TODAY);
    expect(r.status).toBe('ready');
    expect(r.nextSteps).toEqual(['applyBpr']);
  });

  it('asks a new merchant to keep three months of records', () => {
    const r = readiness(tidy.filter((x) => x.date > addDays(TODAY, -20)), TODAY);
    expect(r.checks.find((c) => c.id === 'history').ok).toBe(false);
    expect(r.nextSteps).toContain('keepRecords');
  });

  it('puts the sample warung on the coaching path, not straight to a loan', () => {
    const r = readiness(sampleEntries(TODAY), TODAY);
    expect(['almost', 'notYet']).toContain(r.status);
    expect(r.nextSteps.at(-1)).toBe('returnReview');
  });
});

describe('BPR export', () => {
  it('writes a fixed header and escapes commas', () => {
    const csv = toCsv([e(TODAY, 'sale', 1000, 'groceries', 'rice, eggs')], { businessName: 'Warung A' });
    const [head, row] = csv.split('\n');
    expect(head).toBe('date,type,category,amount_idr,note,business_name,business_type,district');
    expect(row).toContain('"rice, eggs"');
  });
});
