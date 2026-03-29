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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-lg">
      <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Urbanist, sans-serif', color: '#1B2521' }}>
        Estimez vos aides en 30 secondes
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1B2521' }}>Type de travaux</label>
          <select
            value={travaux}
            onChange={e => setTravaux(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            style={{ color: '#1B2521' }}
          >
            <option value="">Sélectionnez vos travaux</option>
            {travauxOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1B2521' }}>Surface habitable (m²)</label>
          <input
            type="number"
            value={surface}
            onChange={e => setSurface(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            min={10}
            max={500}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#1B2521' }}>Revenus fiscaux</label>
          <select
            value={revenus}
            onChange={e => setRevenus(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none"
            style={{ color: '#1B2521' }}
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
          className="w-full py-3 px-6 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50"
          style={{ backgroundColor: '#52B788' }}
        >
          Calculer mes aides
        </button>
      </div>

      {result && (
        <div className="mt-6 p-5 rounded-xl" style={{ backgroundColor: '#F0FAF4' }}>
          <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'Urbanist, sans-serif', color: '#1B2521' }}>
            Estimation de vos aides
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium" style={{ color: '#1B2521' }}>MaPrimeRénov&apos;</span>
              <span className="text-lg font-bold" style={{ fontFamily: 'Urbanist, sans-serif', color: '#F4A261' }}>
                {result.mpr.toLocaleString('fr-FR')} €
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium" style={{ color: '#1B2521' }}>CEE (primes énergie)</span>
              <span className="text-lg font-bold" style={{ fontFamily: 'Urbanist, sans-serif', color: '#F4A261' }}>
                {result.cee.toLocaleString('fr-FR')} €
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-lg">
              <span className="text-sm font-medium" style={{ color: '#1B2521' }}>Éco-PTZ</span>
              <span className="text-sm font-bold" style={{ color: result.ecoPtz ? '#52B788' : '#6B7280' }}>
                {result.ecoPtz ? 'Éligible (jusqu\'à 50 000€)' : 'Non éligible'}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#1B4332' }}>
              <span className="text-sm font-semibold text-white">Total estimé</span>
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'Urbanist, sans-serif' }}>
                {(result.mpr + result.cee).toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>
          <a
            href="/devis/"
            className="mt-4 block text-center py-3 px-6 text-sm font-semibold text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#F4A261' }}
          >
            Obtenir 3 devis gratuits
          </a>
          <p className="mt-3 text-xs text-center" style={{ color: '#6B7280' }}>
            Montants indicatifs. Les aides réelles dépendent de votre situation.
          </p>
        </div>
      )}
    </div>
  );
}
