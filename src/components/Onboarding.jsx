import { useState } from 'react';

export default function Onboarding({ t, lang, onCreate, onSample }) {
  const [form, setForm] = useState({ businessName: '', ownerName: '', businessType: 'warung', district: '', openingCash: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.businessName.trim()) {
      setError(t.businessName);
      return;
    }
    onCreate({ ...form, openingCash: Number(form.openingCash.replace(/\D/g, '')) || 0, language: lang });
  };

  return (
    <section className="screen onboarding">
      <h1>{t.setupTitle}</h1>
      <p className="muted">{t.setupIntro}</p>
      <form onSubmit={submit} className="stack">
        <label>
          <span>{t.businessName}</span>
          <input value={form.businessName} onChange={set('businessName')} aria-invalid={!!error} autoFocus />
        </label>
        <label>
          <span>{t.ownerName}</span>
          <input value={form.ownerName} onChange={set('ownerName')} />
        </label>
        <label>
          <span>{t.businessType}</span>
          <select value={form.businessType} onChange={set('businessType')}>
            {Object.entries(t.types).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>
          <span>{t.district}</span>
          <input value={form.district} onChange={set('district')} />
        </label>
        <label>
          <span>{t.openingCash}</span>
          <input inputMode="numeric" value={form.openingCash} onChange={set('openingCash')} placeholder="0" />
        </label>
        <button className="btn primary" type="submit">{t.createProfile}</button>
        <button className="btn ghost" type="button" onClick={onSample}>{t.trySample}</button>
      </form>
    </section>
  );
}
