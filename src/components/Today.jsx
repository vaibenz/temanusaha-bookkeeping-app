import { addDays, lastNDays, parseDay } from '../lib/dates.js';
import { cashBalance, dailyTotals, daySummary, formatRupiah } from '../lib/finance.js';

function NetChart({ entries, endDay, label }) {
  const totals = dailyTotals(entries);
  const days = lastNDays(endDay, 14);
  const values = days.map((d) => totals.get(d)?.net ?? null);
  const max = Math.max(1, ...values.map((v) => Math.abs(v ?? 0)));
  const W = 320, H = 96, mid = H / 2, bw = W / days.length;
  return (
    <figure className="chart">
      <figcaption>{label}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <line x1="0" x2={W} y1={mid} y2={mid} className="axis" />
        {values.map((v, i) => {
          if (v === null) return <circle key={days[i]} cx={i * bw + bw / 2} cy={mid} r="2" className="gap" />;
          const h = (Math.abs(v) / max) * (mid - 4);
          return (
            <rect key={days[i]} x={i * bw + 3} width={bw - 6} rx="2"
                  y={v >= 0 ? mid - h : mid} height={Math.max(h, 1)}
                  className={v >= 0 ? 'pos' : 'neg'} />
          );
        })}
      </svg>
    </figure>
  );
}

export default function Today({ t, lang, entries, profile, day, setDay, today, onDelete, goRecord }) {
  const s = daySummary(entries, day);
  const list = entries.filter((e) => e.date === day).sort((a, b) => a.createdAt - b.createdAt);
  const till = cashBalance(entries, profile.openingCash, day);
  const dateLabel = parseDay(day).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-GB',
    { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section className="screen">
      <div className="daynav">
        <button className="icon" aria-label={t.prevDay} onClick={() => setDay(addDays(day, -1))}>‹</button>
        <strong>{dateLabel}</strong>
        <button className="icon" aria-label={t.nextDay} disabled={day >= today} onClick={() => setDay(addDays(day, 1))}>›</button>
      </div>

      <article className="summary">
        <h2>{day === today ? t.todaySummary : t.daySummary}</h2>
        <dl>
          <div><dt>{t.sales}</dt><dd className="sales">{formatRupiah(s.sales)}</dd></div>
          <div><dt>{t.expenses}</dt><dd className="expenses">{formatRupiah(s.expenses)}</dd></div>
        </dl>
        <div className={`net ${s.net < 0 ? 'negative' : ''}`}>
          <span>{t.netCashFlow}</span>
          <strong>{formatRupiah(s.net, { signed: true })}</strong>
        </div>
        <p className="till">{t.cashInTill}: <b>{formatRupiah(till)}</b></p>
      </article>

      <NetChart entries={entries} endDay={day} label={t.last14} />

      <h3>{t.entries}</h3>
      {list.length === 0 ? (
        <div className="empty">
          <p>{t.noEntries}</p>
          <button className="btn primary small" onClick={goRecord}>{t.recordFirst}</button>
        </div>
      ) : (
        <ul className="entries">
          {list.map((e) => (
            <li key={e.id}>
              <div>
                <span className="cat">{t.categories[e.category]}</span>
                {e.note && <span className="note">{e.note}</span>}
              </div>
              <span className={e.type === 'sale' ? 'amt in' : 'amt out'}>
                {e.type === 'sale' ? '+' : '-'}{formatRupiah(e.amount).replace('-', '')}
              </span>
              <button className="icon del" aria-label={`${t.delete} ${t.categories[e.category]}`} onClick={() => onDelete(e.id)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
