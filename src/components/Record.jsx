import { useState } from 'react';
import { CATEGORIES, EXPENSE, SALE, formatRupiah } from '../lib/finance.js';

const QUICK = [10000, 25000, 50000, 100000, 500000];

export default function Record({ t, today, onSave }) {
  const [type, setType] = useState(SALE);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.sale[0]);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  const value = Number(amount.replace(/\D/g, '')) || 0;
  const switchType = (next) => {
    setType(next);
    setCategory(CATEGORIES[next][0]);
  };

  const submit = (e) => {
    e.preventDefault();
    if (value <= 0) {
      setError(t.amountError);
      return;
    }
    onSave({ type, amount: value, category, note: note.trim(), date });
    setFlash(`${t.saved}: ${t.categories[category]} ${formatRupiah(value)}`);
    setAmount('');
    setNote('');
    setError('');
  };

  return (
    <section className="screen">
      <h1>{t.recordTitle}</h1>
      <div className="segmented" role="tablist">
        {[SALE, EXPENSE].map((k) => (
          <button key={k} role="tab" aria-selected={type === k} className={type === k ? `on ${k}` : ''}
                  onClick={() => switchType(k)} type="button">{t[k]}</button>
        ))}
      </div>

      <form onSubmit={submit} className="stack">
        <label>
          <span>{t.amount}</span>
          <input className="amount" inputMode="numeric" placeholder="0" aria-invalid={!!error}
                 value={value ? new Intl.NumberFormat('id-ID').format(value) : amount}
                 onChange={(e) => { setAmount(e.target.value); setError(''); }} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="chips">
          {QUICK.map((q) => (
            <button type="button" key={q} className="chip" onClick={() => setAmount(String(value + q))}>
              +{new Intl.NumberFormat('id-ID').format(q)}
            </button>
          ))}
        </div>

        <fieldset>
          <legend>{t.category}</legend>
          <div className="chips">
            {CATEGORIES[type].map((c) => (
              <button type="button" key={c} aria-pressed={category === c}
                      className={`chip ${category === c ? 'selected' : ''}`} onClick={() => setCategory(c)}>
                {t.categories[c]}
              </button>
            ))}
          </div>
          {category === 'personal' && <p className="hint">{t.personalHint}</p>}
        </fieldset>

        <label>
          <span>{t.note}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <label>
          <span>{t.date}</span>
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button className={`btn primary ${type}`} type="submit">{t.save}</button>
        <p className="flash" role="status" aria-live="polite">{flash}</p>
      </form>
    </section>
  );
}
