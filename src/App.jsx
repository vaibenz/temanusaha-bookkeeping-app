import { useEffect, useMemo, useState } from 'react';
import Health from './components/Health.jsx';
import Onboarding from './components/Onboarding.jsx';
import Readiness from './components/Readiness.jsx';
import Record from './components/Record.jsx';
import Today from './components/Today.jsx';
import { dayKey } from './lib/dates.js';
import { sampleEntries, sampleProfile } from './lib/demoData.js';
import { STRINGS } from './lib/i18n.js';
import { clearState, loadState, newId, saveState } from './lib/storage.js';

const TABS = ['today', 'record', 'health', 'ready'];
const TAB_LABEL = { today: 'navToday', record: 'navRecord', health: 'navHealth', ready: 'navReady' };

export default function App() {
  const today = useMemo(() => dayKey(), []);
  const [state, setState] = useState(() => loadState() ?? { profile: null, entries: [], isSample: false });
  const [lang, setLang] = useState(state.profile?.language ?? 'en');
  const [tab, setTab] = useState('today');
  const [day, setDay] = useState(today);
  const t = STRINGS[lang];

  useEffect(() => saveState(state), [state]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const update = (patch) => setState((s) => ({ ...s, ...patch }));
  const addEntry = (e) => update({ entries: [...state.entries, { ...e, id: newId(), createdAt: Date.now() }] });
  const deleteEntry = (id) => update({ entries: state.entries.filter((e) => e.id !== id) });
  const reset = () => {
    if (!window.confirm(t.resetConfirm)) return;
    clearState();
    setState({ profile: null, entries: [], isSample: false });
    setTab('today');
  };

  return (
    <div className="page">
      <aside className="about">
        <p className="brand">TemanUsaha</p>
        <h2>Bookkeeping that turns a warung’s daily trade into a path to its first loan.</h2>
        <p>
          A working demo of the mobile app at the heart of TemanUsaha, our NTU PEAK proposal for Monee. Merchants record
          sales and expenses, see their cash flow, get a health check and learn exactly what stands between them and
          financing from a partner BPR (Bank Perekonomian Rakyat).
        </p>
        <p className="muted small">NTU PEAK 2026, Monee Team 1. Records are stored only in this browser.</p>
      </aside>

      <div className="app">
        <header className="topbar">
          <div>
            <p className="brand">TemanUsaha</p>
            <p className="sub">{state.profile ? state.profile.businessName : t.appTagline}</p>
          </div>
          <div className="lang" role="group" aria-label="Language">
            {['en', 'id'].map((l) => (
              <button key={l} aria-pressed={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {state.isSample && (
          <div className="banner">
            {t.demoBanner} <button className="link" onClick={reset}>{t.reset}</button>
          </div>
        )}

        <main>
          {!state.profile ? (
            <Onboarding t={t} lang={lang}
                        onCreate={(profile) => update({ profile, entries: [], isSample: false })}
                        onSample={() => update({ profile: { ...sampleProfile(), language: lang },
                                                 entries: sampleEntries(today), isSample: true })} />
          ) : (
            <>
              {tab === 'today' && <Today t={t} lang={lang} entries={state.entries} profile={state.profile} day={day}
                                         setDay={setDay} today={today} onDelete={deleteEntry} goRecord={() => setTab('record')} />}
              {tab === 'record' && <Record t={t} today={today} onSave={addEntry} />}
              {tab === 'health' && <Health t={t} entries={state.entries} today={today} />}
              {tab === 'ready' && <Readiness t={t} entries={state.entries} profile={state.profile} today={today} />}
              {!state.isSample && tab === 'ready' && (
                <button className="link reset" onClick={reset}>{t.reset}</button>
              )}
            </>
          )}
        </main>

        {state.profile && (
          <nav className="tabs" aria-label="Main">
            {TABS.map((k) => (
              <button key={k} aria-current={tab === k ? 'page' : undefined} className={tab === k ? 'on' : ''}
                      onClick={() => { setTab(k); if (k === 'today') setDay(today); }}>
                {t[TAB_LABEL[k]]}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
