import { readiness, toCsv } from '../lib/finance.js';

const ICON = { true: '✓', false: '!' };

export default function Readiness({ t, entries, profile, today }) {
  const r = readiness(entries, today);

  const download = () => {
    const blob = new Blob([toCsv(entries, profile)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(profile.businessName || 'records').replace(/\s+/g, '-').toLowerCase()}-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="screen">
      <h1>{t.readyTitle}</h1>
      <div className={`status ${r.status}`}>{t.status[r.status]}</div>

      {r.checks.length > 0 && (
        <ul className="checks">
          {r.checks.map((c) => (
            <li key={c.id} className={c.ok ? 'ok' : 'gap'}>
              <span aria-hidden="true">{ICON[c.ok]}</span>
              {t.checks[c.id]}
            </li>
          ))}
        </ul>
      )}

      <h3>{t.why}</h3>
      <p>{t.whyText[r.status]}</p>

      <h3>{t.nextSteps}</h3>
      <ol className="steps">
        {r.nextSteps.map((s) => <li key={s}>{t.steps[s]}</li>)}
      </ol>

      {entries.length > 0 && (
        <div className="export">
          <button className="btn ghost" onClick={download}>{t.exportCsv}</button>
          <p className="muted small">{t.exportNote}</p>
        </div>
      )}
    </section>
  );
}
