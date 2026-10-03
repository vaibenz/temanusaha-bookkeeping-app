import { addDays, daysBetween, lastNDays } from './dates.js';

export const SALE = 'sale';
export const EXPENSE = 'expense';

export const CATEGORIES = {
  sale: ['groceries', 'foodDrinks', 'phoneCredit', 'otherSale'],
  expense: ['stock', 'rent', 'utilities', 'transport', 'loanRepayment', 'personal', 'otherExpense'],
};

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function dailyTotals(entries) {
  const map = new Map();
  for (const e of entries) {
    const t = map.get(e.date) ?? { sales: 0, expenses: 0, net: 0, count: 0 };
    if (e.type === SALE) t.sales += e.amount;
    else t.expenses += e.amount;
    t.net = t.sales - t.expenses;
    t.count += 1;
    map.set(e.date, t);
  }
  return map;
}

export function daySummary(entries, day) {
  return dailyTotals(entries).get(day) ?? { sales: 0, expenses: 0, net: 0, count: 0 };
}

export function cashBalance(entries, openingCash = 0, upToDay) {
  return entries
    .filter((e) => !upToDay || e.date <= upToDay)
    .reduce((bal, e) => bal + (e.type === SALE ? e.amount : -e.amount), openingCash);
}

export function firstEntryDay(entries) {
  return entries.reduce((min, e) => (!min || e.date < min ? e.date : min), null);
}

/**
 * The four pillars from the Financial Health Check station.
 * Each score is 0 to 100, or null when there is not enough data to judge yet.
 */
export function healthCheck(entries, today, windowDays = 30) {
  const first = firstEntryDay(entries);
  if (!first) {
    return { cashFlow: null, salesExpenses: null, records: null, payments: null, overall: null, stats: null };
  }
  const historyDays = daysBetween(first, today) + 1;
  const span = Math.min(windowDays, historyDays);
  const days = lastNDays(today, span);
  const totals = dailyTotals(entries);
  const inWindow = entries.filter((e) => e.date >= days[0] && e.date <= today);

  // Records: did they log consistently?
  const recordedDays = days.filter((d) => totals.has(d)).length;
  const records = (recordedDays / span) * 100;

  // Cash flow: enough cash, consistently? Share of recorded days that ended positive.
  const recorded = days.filter((d) => totals.has(d)).map((d) => totals.get(d));
  const positiveDays = recorded.filter((t) => t.net >= 0).length;
  const netTotal = recorded.reduce((s, t) => s + t.net, 0);
  const cashFlow = recorded.length ? (positiveDays / recorded.length) * 100 : null;

  // Sales and expenses: are weekly sales stable? Uses coefficient of variation of weekly totals.
  const weeks = [];
  for (let end = today; daysBetween(first, end) >= 6 && weeks.length < 4; end = addDays(end, -7)) {
    weeks.push(lastNDays(end, 7).reduce((s, d) => s + (totals.get(d)?.sales ?? 0), 0));
  }
  let salesExpenses = null;
  let salesCv = null;
  if (weeks.length >= 2) {
    const mean = weeks.reduce((a, b) => a + b, 0) / weeks.length;
    const sd = Math.sqrt(weeks.reduce((s, w) => s + (w - mean) ** 2, 0) / weeks.length);
    salesCv = mean > 0 ? sd / mean : 1;
    salesExpenses = clamp(100 * (1 - salesCv / 0.5));
  }

  // Payments: responsible money habits. Personal spending mixed into the till pulls this down.
  const expenses = inWindow.filter((e) => e.type === EXPENSE);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const personal = expenses.filter((e) => e.category === 'personal').reduce((s, e) => s + e.amount, 0);
  const personalShare = expenseTotal ? personal / expenseTotal : 0;
  const repayments = expenses.filter((e) => e.category === 'loanRepayment').length;
  const payments = expenses.length ? clamp(100 * (1 - personalShare / 0.25)) : null;

  const scores = [cashFlow, salesExpenses, records, payments].filter((s) => s !== null);
  const overall = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  return {
    cashFlow, salesExpenses, records, payments, overall,
    stats: { historyDays, span, recordedDays, positiveDays, recordedCount: recorded.length,
             netTotal, salesCv, personalShare, repayments },
  };
}

export const READINESS_RULES = {
  minHistoryDays: 90,       // three months of records, as on the Financing Readiness card
  minRecordsScore: 70,
  minCashFlowScore: 60,
  minSalesScore: 60,
  maxPersonalShare: 0.1,
};

/**
 * Financing Readiness: four checks, a status and concrete next steps.
 * Status follows the station card: every check passes = ready, one gap = almost, more = not yet.
 */
export function readiness(entries, today, rules = READINESS_RULES) {
  const h = healthCheck(entries, today);
  if (!h.stats) {
    return { status: 'empty', checks: [], nextSteps: ['startRecording'], health: h };
  }
  const s = h.stats;
  const checks = [
    { id: 'stableSales', ok: h.salesExpenses !== null && h.salesExpenses >= rules.minSalesScore },
    { id: 'positiveCashFlow', ok: s.netTotal > 0 && (h.cashFlow ?? 0) >= rules.minCashFlowScore },
    { id: 'history', ok: s.historyDays >= rules.minHistoryDays && h.records >= rules.minRecordsScore },
    { id: 'separated', ok: s.personalShare <= rules.maxPersonalShare },
  ];
  const gaps = checks.filter((c) => !c.ok).length;
  const status = gaps === 0 ? 'ready' : gaps === 1 ? 'almost' : 'notYet';

  const stepFor = { separated: 'separateMoney', history: 'keepRecords', positiveCashFlow: 'improveCashFlow',
                    stableSales: 'steadySales' };
  const order = ['separated', 'history', 'positiveCashFlow', 'stableSales'];
  const nextSteps = order.filter((id) => !checks.find((c) => c.id === id).ok).map((id) => stepFor[id]);
  nextSteps.push(status === 'ready' ? 'applyBpr' : 'returnReview');

  return { status, checks, nextSteps, health: h };
}

/** One row per entry in a fixed column order, so every partner BPR receives the same format. */
export function toCsv(entries, profile) {
  const header = ['date', 'type', 'category', 'amount_idr', 'note', 'business_name', 'business_type', 'district'];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .map((e) => [e.date, e.type, e.category, e.amount, e.note, profile?.businessName,
                 profile?.businessType, profile?.district].map(esc).join(','));
  return [header.join(','), ...rows].join('\n');
}

export function formatRupiah(n, { signed = false } = {}) {
  const abs = new Intl.NumberFormat('id-ID').format(Math.round(Math.abs(n)));
  const sign = n < 0 ? '-' : signed && n > 0 ? '+' : '';
  return `${sign}Rp ${abs}`;
}
