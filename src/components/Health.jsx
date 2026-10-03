import { healthCheck } from '../lib/finance.js';

const PILLARS = ['cashFlow', 'salesExpenses', 'records', 'payments'];

function Meter({ value }) {
  const v = value ?? 0;
  const tone = value === null ? 'none' : v >= 70 ? 'good' : v >= 45 ? 'mid' : 'low';
  return (
    <div className={`meter ${tone}`} role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(v)}>
      <span style={{ width: `${v}%` }} />
    </div>
  );
}

export default function Health({ t, entries, today }) {
  const h = healthCheck(entries, today);
  return (
    <section className="screen">
      <h1>{t.healthTitle}</h1>
      <p className="muted">{t.healthIntro}</p>
      {h.overall !== null && (
        <div className="overall">
          <span>{t.overall}</span>
          <strong>{Math.round(h.overall)}<small>/100</small></strong>
        </div>
      )}
      <ul className="pillars">
        {PILLARS.map((p) => (
          <li key={p}>
            <div className="pillar-head">
              <div>
                <h3>{t.pillars[p][0]}</h3>
                <p className="q">{t.pillars[p][1]}</p>
              </div>
              <span className="score">{h[p] === null ? 'n/a' : Math.round(h[p])}</span>
            </div>
            <Meter value={h[p]} />
            <p className="muted small">{h.stats ? t.explain[p](h.stats) : t.notEnough}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
