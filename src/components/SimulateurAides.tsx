import { useState } from 'react';

const travauxOptions = [
  { value: 'isolation-combles', label: 'Isolation combles', mprBase: 25, ceeBase: 12 },
  { value: 'isolation-murs', label: 'Isolation murs extérieurs', mprBase: 75, ceeBase: 20 },
  { value: 'pompe-chaleur', label: 'Pompe à chaleur', mprBase: 5000, ceeBase: 4000 },
  { value: 'panneaux-solaires', label: 'Panneaux solaires', mprBase: 2000, ceeBase: 0 },
  { value: 'chaudiere-biomasse', label: 'Chaudière biomasse', mprBase: 5000, ceeBase: 3500 },
  { value: 'vmc-double-flux', label: 'VMC double flux', mprBase: 2500, ceeBase: 500 },
  { value: 'fenetres', label: 'Fenêtres double vitrage', mprBase: 100, ceeBase: 50 },
];

const revenusMultipliers: Record<string, number> = {
  'tres-modestes': 1.0,
  'modestes': 0.75,
  'intermediaires': 0.5,
  'superieurs': 0.25,
};

export default function SimulateurAides() {
  const [travaux, setTravaux] = useState('');
  const [surface, setSurface] = useState(100);
  const [revenus, setRevenus] = useState('');
  const [result, setResult] = useState<{ mpr: number; cee: number; ecoPtz: boolean } | null>(null);

  function calculate() {
    if (!travaux || !revenus) return;
    const option = travauxOptions.find(t => t.value === travaux);
    if (!option) return;
    const mult = revenusMultipliers[revenus] ?? 0.5;
    const isPerM2 = option.mprBase < 200;
    const mpr = isPerM2 ? Math.round(option.mprBase * surface * mult) : Math.round(option.mprBase * mult);
    const cee = isPerM2 ? Math.round(option.ceeBase * surface) : option.ceeBase;
    const ecoPtz = revenus !== 'superieurs';
    setResult({ mpr, cee, ecoPtz });
  }

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[#b8963e] focus:ring-2 focus:ring-[#b8963e]/20 focus:bg-white";

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#b8963e] to-[#8a6d2b] flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        </div>
        <h3 className="text-xl font-bold" style={{ fontFamily: 'Urbanist, sans-serif', color: '#141824' }}>
          Simulateur d'aides
        </h3>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#141824' }}>Type de travaux</label>
          <select
            value={travaux}
            onChange={e => setTravaux(e.target.value)}
            className={inputClass}
            style={{ color: '#141824' }}
          >
            <option value="">Sélectionnez vos travaux</option>
            {travauxOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#141824' }}>Surface habitable (m²)</label>
          <input
            type="number"
            value={surface}
            onChange={e => setSurface(Number(e.target.value))}
            className={inputClass}
            min={10}
            max={500}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#141824' }}>Revenus fiscaux</label>
          <select
            value={revenus}
            onChange={e => setRevenus(e.target.value)}
            className={inputClass}
            style={{ color: '#141824' }}
          >
            <option value="">Sélectionnez votre tranche</option>
            <option value="tres-modestes">Très modestes</option>
            <option value="modestes">Modestes</option>
            <option value="intermediaires">Intermédiaires</option>
            <option value="superieurs">Supérieurs</option>
          </select>
        </div>

        <button
          onClick={calculate}
          disabled={!travaux || !revenus}
          className="w-full py-3.5 px-6 text-sm font-bold text-white rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#b8963e]/25 hover:-translate-y-0.5 active:translate-y-0"
          style={{ background: 'linear-gradient(135deg, #b8963e, #8a6d2b)' }}
        >
          Calculer mes aides
        </button>
      </div>

      {result && (
        <div className="mt-6 p-5 rounded-2xl border border-[#b8963e]/20" style={{ backgroundColor: '#f5f6fa' }}>
          <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'Urbanist, sans-serif', color: '#141824' }}>
            Estimation de vos aides
          </h4>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100">
              <span className="text-sm font-medium" style={{ color: '#5a6270' }}>MaPrimeRénov&apos;</span>
              <span className="text-lg font-extrabold" style={{ fontFamily: 'Urbanist, sans-serif', color: '#b8963e' }}>
                {result.mpr.toLocaleString('fr-FR')} €
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100">
              <span className="text-sm font-medium" style={{ color: '#5a6270' }}>CEE (primes énergie)</span>
              <span className="text-lg font-extrabold" style={{ fontFamily: 'Urbanist, sans-serif', color: '#b8963e' }}>
                {result.cee.toLocaleString('fr-FR')} €
              </span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-100">
              <span className="text-sm font-medium" style={{ color: '#5a6270' }}>Éco-PTZ</span>
              <span className="text-sm font-bold" style={{ color: result.ecoPtz ? '#b8963e' : '#5a6270' }}>
                {result.ecoPtz ? 'Éligible (jusqu\'à 50 000€)' : 'Non éligible'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #0a1628, #060d1a)' }}>
              <span className="text-sm font-semibold text-white/80">Total estimé</span>
              <span className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                {(result.mpr + result.cee).toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
          <a
            href="/devis/"
            className="mt-5 flex items-center justify-center gap-2 py-3.5 px-6 text-sm font-bold text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#b8963e]/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #b8963e, #8a6d2b)' }}
          >
            Obtenir 3 devis gratuits
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
          <p className="mt-3 text-xs text-center" style={{ color: '#5a6270' }}>
            Montants indicatifs. Les aides réelles dépendent de votre situation.
          </p>
        </div>
      )}
    </div>
  );
}
