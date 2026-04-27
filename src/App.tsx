import React, { useState, useMemo } from 'react';
import { simulatePkvGkv, PkvGkvInputs } from './engine';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';

function formatCurrency(val: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(val);
}

const JAEG_2026 = 73800;

export default function App() {
  const [inputs, setInputs] = useState<PkvGkvInputs>({
    currentAge: 30,
    retirementAge: 67,
    lifeExpectancy: 90,
    grossIncome: 85000,
    estimatedPension: 0,
    pkvPremium: 600,
    pkvBet: 0,
    etfYield: 6.0,
    gkvMaxRate: 24.0,
    pkvInflation: 3.5,
    salaryGrowth: 2.5,
    // 2.3 — Pflegeversicherung & Familienplanung
    hasChildren: false,
    numberOfChildren: 0,
    pkvKindBeitrag: 150,
    pkvKinderDauer: 20,
    // 1.1 — GKV-Zusatzversicherung
    gkvZusatzBeitrag: 0,
    gkvZusatzInflation: 5.0,
    // 4.1 — Schock-Event
    simulateShockEvent: false,
    shockEventAge: 50,
    // 2.1 — PKV-Inflation in der Rentenphase
    pkvInflationRetirement: 2.5,
    // 3.1 — Reale Werte
    assumedInflation: 2.0,
  });

  // 3.1 — Toggle: Nominal vs. Real
  const [showRealValues, setShowRealValues] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setInputs(prev => ({ ...prev, [name]: checked }));
    } else {
      setInputs(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    }
  };

  const results = useMemo(() => simulatePkvGkv(inputs), [inputs]);

  const depotKey = showRealValues ? 'depotValueReal' : 'depotValue';
  const finalDepot = showRealValues
    ? results.yearlyData[results.yearlyData.length - 1]?.depotValueReal ?? results.finalDeltaDepot
    : results.finalDeltaDepot;

  return (
    <div className="w-full px-4 md:px-8 xl:px-12 py-4 md:py-8 font-sans text-ink bg-bg min-h-screen">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-display font-bold text-ink mb-2">
          GKV vs. PKV: Der Lebenszyklus-Rechner
        </h1>
        <p className="text-muted">
          Interaktiver Rechner — Stand 2026. Steuern, Inflation, Rentenbesteuerung & Abgeltungsteuer
          sind modelliert.
        </p>
      </header>

      {/* 2.6 — JAEG-Warnung */}
      {!results.isPkvEligible && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm">
          <strong>Hinweis:</strong> Bei einem Bruttogehalt unter{' '}
          {formatCurrency(JAEG_2026)} (Versicherungspflichtgrenze 2026) ist eine PKV als
          Angestellter in der Regel nicht möglich. Das Ergebnis ist rein hypothetisch.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-12 gap-8">

        {/* ── Sidebar Inputs ── */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">

          {/* Persönliche Daten */}
          <div className="bg-white p-5 rounded-lg border border-border shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber mb-4">
              Persönliche Daten
            </h2>
            <div className="space-y-4">
              <label className="block">
                <span className="input-label">Alter heute</span>
                <input type="number" name="currentAge" value={inputs.currentAge}
                  onChange={handleChange} className="input-field" />
              </label>
              <label className="block">
                <span className="input-label">Renteneintritt (Alter)</span>
                <input type="number" name="retirementAge" value={inputs.retirementAge}
                  onChange={handleChange} className="input-field" />
              </label>
              <label className="block">
                <span className="input-label">Lebenserwartung (Alter)</span>
                <input type="number" name="lifeExpectancy" value={inputs.lifeExpectancy}
                  onChange={handleChange} className="input-field" />
              </label>
              <label className="block">
                <span className="input-label">Bruttoeinkommen (€/Jahr)</span>
                <input type="number" name="grossIncome" value={inputs.grossIncome}
                  onChange={handleChange} className="input-field" step="1000" />
              </label>
              <label className="block">
                <span className="input-label">Erwartete Rente (€/Monat, optional)</span>
                <input type="number" name="estimatedPension"
                  value={inputs.estimatedPension || ''}
                  onChange={handleChange} placeholder="z.B. 2500"
                  className="input-field" step="100" />
              </label>
              {/* 2.3 — Kinder */}
              <div className="flex items-center gap-3 pt-1">
                <input type="checkbox" name="hasChildren" id="hasChildren"
                  checked={inputs.hasChildren} onChange={handleChange}
                  className="w-4 h-4 accent-amber" />
                <label htmlFor="hasChildren" className="input-label cursor-pointer">
                  Kinder vorhanden
                </label>
              </div>
              {inputs.hasChildren && (
                <div className="space-y-4 pt-2 border-t border-border mt-2">
                  <label className="block">
                    <span className="input-label">Kinder unter 25 (Anzahl)</span>
                    <input type="number" name="numberOfChildren"
                      value={inputs.numberOfChildren}
                      onChange={handleChange} className="input-field" min="1" max="10" />
                  </label>
                  <label className="block">
                    <span className="input-label">PKV-Beitrag pro Kind (€/Monat)</span>
                    <input type="number" name="pkvKindBeitrag"
                      value={inputs.pkvKindBeitrag}
                      onChange={handleChange} className="input-field" step="10" />
                    <span className="text-xs text-muted">
                      In der GKV beitragsfrei. In der PKV voll aus dem Netto zu zahlen (wenn AG-Zuschuss Max erreicht).
                    </span>
                  </label>
                  <label className="block">
                    <span className="input-label">Dauer der Kinder-Versicherung (Jahre ab heute)</span>
                    <input type="number" name="pkvKinderDauer"
                      value={inputs.pkvKinderDauer}
                      onChange={handleChange} className="input-field" step="1" />
                    <span className="text-xs text-muted">
                      Wie lange werden die Kinderbeiträge noch gezahlt?
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* PKV Angebot */}
          <div className="bg-white p-5 rounded-lg border border-border shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber mb-4">
              PKV Angebot
            </h2>
            <div className="space-y-4">
              <label className="block">
                <span className="input-label">Monatsbeitrag inkl. 10 %-Zuschlag (€)</span>
                <input type="number" name="pkvPremium" value={inputs.pkvPremium}
                  onChange={handleChange} className="input-field" step="10" />
              </label>
              <label className="block">
                <span className="input-label">Beitragsentlastung im Alter (€/Monat)</span>
                <input type="number" name="pkvBet" value={inputs.pkvBet}
                  onChange={handleChange} className="input-field" step="10" />
              </label>
            </div>
          </div>

          {/* Leistungsniveau Angleichen (GKV-Zusatz) */}
          <div className="bg-white p-5 rounded-lg border border-border shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber mb-4">
              Leistungsniveau (GKV-Zusatz)
            </h2>
            <div className="space-y-4">
              <label className="block">
                <span className="input-label">Zusatzversicherungen (€/Monat)</span>
                <input type="number" name="gkvZusatzBeitrag" value={inputs.gkvZusatzBeitrag}
                  onChange={handleChange} className="input-field" step="10" />
                <span className="text-xs text-muted">
                  Krankenhaus 1-Bett, Zahnzusatz etc. für den GKV-Versicherten, um das PKV-Niveau zu erreichen.
                </span>
              </label>
              <label className="block">
                <span className="input-label">Zusatz-Kostensteigerung (% p.a.)</span>
                <input type="number" name="gkvZusatzInflation" value={inputs.gkvZusatzInflation}
                  onChange={handleChange} className="input-field" step="0.5" />
                <span className="text-xs text-muted">
                  Meist nach Art der Schadenversicherung ohne Altersrückstellungen kalkuliert (z.B. 5%).
                </span>
              </label>
            </div>
          </div>

          {/* Annahmen & Dynamik */}
          <div className="bg-white p-5 rounded-lg border border-border shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber mb-4">
              Annahmen & Dynamik
            </h2>
            <div className="space-y-4">
              <label className="block">
                <span className="input-label">ETF Rendite (% p.a.)</span>
                <input type="number" name="etfYield" value={inputs.etfYield}
                  onChange={handleChange} className="input-field" step="0.1" />
              </label>
              <label className="block">
                <span className="input-label">Ziel-GKV-Satz 2040, inkl. PV (%) </span>
                <input type="number" name="gkvMaxRate" value={inputs.gkvMaxRate}
                  onChange={handleChange} className="input-field" step="0.5" />
              </label>
              <label className="block">
                <span className="input-label">PKV Kostensteigerung (% p.a.)</span>
                <input type="number" name="pkvInflation" value={inputs.pkvInflation}
                  onChange={handleChange} className="input-field" step="0.1" />
              </label>
              <label className="block">
                <span className="input-label">Lohnwachstum (% p.a.)</span>
                <input type="number" name="salaryGrowth" value={inputs.salaryGrowth}
                  onChange={handleChange} className="input-field" step="0.1" />
              </label>

              {/* 2.1 — PKV-Inflation in der Rentenphase */}
              <label className="block">
                <span className="input-label">PKV Kostensteigerung i.d. Rente (% p.a.)</span>
                <input type="number" name="pkvInflationRetirement" value={inputs.pkvInflationRetirement}
                  onChange={handleChange} className="input-field" step="0.1" />
                <span className="text-xs text-muted">
                  Durch Altersrückstellungen meist geringer als in der Erwerbsphase.
                </span>
              </label>

              {/* 3.1 — Allgemeine Inflation */}
              <label className="block">
                <span className="input-label">Allgemeine Inflation (% p.a.)</span>
                <input type="number" name="assumedInflation" value={inputs.assumedInflation}
                  onChange={handleChange} className="input-field" step="0.1" />
                <span className="text-xs text-muted">Für Kaufkraftkorrektur (Real-Ansicht)</span>
              </label>
            </div>
          </div>

          {/* Schock-Event (Risikoszenario) */}
          <div className="bg-white p-5 rounded-lg border border-red-100 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-4 flex items-center gap-2">
              <span>⚠️</span> Schock-Event
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" name="simulateShockEvent" id="simulateShockEvent"
                  checked={inputs.simulateShockEvent} onChange={handleChange}
                  className="w-4 h-4 accent-red-500" />
                <label htmlFor="simulateShockEvent" className="input-label cursor-pointer text-red-600">
                  Langzeiterkrankung simulieren (1 Jahr)
                </label>
              </div>
              {inputs.simulateShockEvent && (
                <div className="pt-2">
                  <label className="block">
                    <span className="input-label">Alter bei Erkrankung</span>
                    <input type="number" name="shockEventAge" value={inputs.shockEventAge}
                      onChange={handleChange} className="input-field border-red-200 focus:border-red-500 focus:ring-red-500" min={inputs.currentAge} max={inputs.retirementAge - 1} />
                    <span className="text-xs text-red-500/80 block mt-1">
                      GKV zahlt nach 6 Wochen Krankengeld (beitragsfrei!). 
                      PKV-Beitrag muss dagegen vom Netto voll (ohne AG-Zuschuss) weiterbezahlt werden!
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="lg:col-span-8 xl:col-span-6 space-y-8">

          {/* Chart 1: Depot-Entwicklung */}
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-ink">Entwicklung des Delta-Depots</h3>
              {/* 3.1 — Toggle Nominal / Real */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setShowRealValues(false)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    !showRealValues
                      ? 'bg-amber text-white'
                      : 'bg-gray-100 text-muted hover:bg-gray-200'
                  }`}
                >
                  Nominal
                </button>
                <button
                  onClick={() => setShowRealValues(true)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    showRealValues
                      ? 'bg-amber text-white'
                      : 'bg-gray-100 text-muted hover:bg-gray-200'
                  }`}
                >
                  Real ({inputs.assumedInflation} %)
                </button>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={results.yearlyData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDepot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4821A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4821A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="age" tickFormatter={(v) => `${v} J.`} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={60} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(label) => `Alter: ${label} Jahre`}
                  />
                  <Area
                    type="monotone"
                    dataKey={depotKey}
                    name={showRealValues ? 'Depot (real)' : 'Depot (nominal)'}
                    stroke="#D4821A"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorDepot)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted mt-4">
              Das Depot baut sich durch die PKV-Ersparnis in der Erwerbsphase auf. Ab Alter{' '}
              {inputs.retirementAge} wird es entspart (inkl. Abgeltungsteuer auf Kursgewinne).
              {showRealValues && ` Inflationsbereinigt mit ${inputs.assumedInflation} % p.a.`}
            </p>
          </div>

          {/* Chart 2: Monatliche Belastung */}
          <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
            <h3 className="font-bold mb-6 text-ink">Monatliche Belastung (Netto)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={results.yearlyData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="age" tickFormatter={(v) => `${v} J.`} />
                  <YAxis tickFormatter={(v) => `${v} €`} width={60} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(label) => `Alter: ${label} Jahre`}
                  />
                  <Legend />
                  <Line
                    type="monotone" dataKey="gkvCost" name="GKV Beitrag"
                    stroke="#3B82F6" strokeWidth={2} dot={false}
                  />
                  <Line
                    type="monotone" dataKey="pkvCost" name="PKV Beitrag"
                    stroke="#EF4444" strokeWidth={2} dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted mt-4">
              Knick bei Alter {inputs.retirementAge}: Renteneintritt (Wegfall AG-Zuschuss, KTG-Entfall
              bei PKV). Knick bei Alter 61: Wegfall des 10 %-Zuschlags (§ 12 Abs. 4a VAG).
            </p>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="lg:col-span-12 xl:col-span-3 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-4">

          <div className={`p-5 rounded-lg border shadow-sm ${
            results.depotZeroAge ? 'bg-red-50 border-red-200' : 'bg-amber-lt border-amber'
          }`}>
            <div className={`text-xs font-bold uppercase mb-1 ${
              results.depotZeroAge ? 'text-red-700' : 'text-amber-dk'
            }`}>
              {results.depotZeroAge
                ? 'Depot aufgebraucht mit'
                : `Delta-Depot (Alter ${inputs.lifeExpectancy})`}
            </div>
            <div className={`text-3xl font-display font-bold ${
              results.depotZeroAge ? 'text-red-600' : 'text-amber-dk'
            }`}>
              {results.depotZeroAge
                ? `${results.depotZeroAge} Jahren`
                : formatCurrency(finalDepot)}
            </div>
            <div className={`text-xs mt-2 ${
              results.depotZeroAge ? 'text-red-500' : 'text-amber-dk/80'
            }`}>
              {results.depotZeroAge
                ? 'PKV-Mehrkosten im Alter können nicht mehr durch Ersparnisse gedeckt werden.'
                : showRealValues
                  ? 'Kaufkraftbereinigtes Restdepot am Ende der Lebenserwartung.'
                  : 'Nominales Restdepot am Ende der Lebenserwartung.'}
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-bold uppercase text-muted mb-4 border-b border-border pb-2">
              Bei Renteneintritt ({inputs.retirementAge} J.)
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted">PKV Beitrag (Netto)</div>
                <div className="text-lg font-bold text-ink">
                  {formatCurrency(results.firstYearPkvCostRetirement)} / Monat
                </div>
              </div>
              <div>
                <div className="text-xs text-muted">GKV Beitrag (Netto)</div>
                <div className="text-lg font-bold text-ink">
                  {formatCurrency(results.firstYearGkvCostRetirement)} / Monat
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-border shadow-sm">
            <h3 className="text-sm font-bold uppercase text-muted mb-4 border-b border-border pb-2">
              Total Cost (Lebenszeit)
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted">Kosten PKV gesamt</div>
                <div className="text-lg font-bold text-ink">{formatCurrency(results.tcoPkv)}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Kosten GKV gesamt</div>
                <div className="text-lg font-bold text-ink">{formatCurrency(results.tcoGkv)}</div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted">GKV Mehrkosten</div>
                <div className="text-lg font-bold text-amber">
                  {formatCurrency(results.tcoGkv - results.tcoPkv)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Transparenz-Box ── */}
        <div className="lg:col-span-12 mt-4">
          <div className="bg-white p-6 md:p-8 rounded-lg border border-border shadow-sm">
            <h3 className="text-xl font-display font-bold text-ink mb-6 flex items-center gap-2">
              <span className="text-amber">ℹ️</span> Transparenz: Die Annahmen unter der Haube
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-ink-soft leading-relaxed">
              <div>
                <h4 className="font-bold text-ink mb-3 uppercase tracking-wider text-xs">
                  1. Steuern & Erwerbsphase
                </h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>
                    <strong>Einkommensteuer 2026:</strong> Tarif nach Steuerfortentwicklungsgesetz
                    (Grundfreibetrag 12.348 €, Spitzensteuersatz 42 %, Reichensteuer 45 %).
                  </li>
                  <li>
                    <strong>GKV-Absetzbarkeit:</strong> KV-Anteil zu 96 % (4 %-Kürzung wegen
                    Krankengeldbezug, § 10 Abs. 1 Nr. 3 EStG), PV-Anteil zu 100 %.
                  </li>
                  <li>
                    <strong>PKV-Absetzbarkeit:</strong> 80 % des Beitrags (Basisabsicherung),
                    abzüglich steuerfreiem AG-Zuschuss.
                  </li>
                  <li>
                    <strong>BBG 2026:</strong> 66.150 €/Jahr (aktualisiert von 62.100 €).
                  </li>
                  <li>
                    <strong>JAEG 2026:</strong> 73.800 € — PKV-Option nur oberhalb möglich.
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-ink mb-3 uppercase tracking-wider text-xs">
                  2. PKV-Mechanik
                </h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>
                    <strong>10 %-Zuschlag:</strong> Entfällt mit vollendetem 60. Lebensjahr (§ 12
                    Abs. 4a VAG) — nicht erst beim Renteneintritt. Der eingegebene Beitrag gilt
                    als inkl. Zuschlag.
                  </li>
                  <li>
                    <strong>Renteneintritt:</strong> Nur das Krankentagegeld entfällt (ca. −6 %).
                    Der 10 %-Zuschlag wurde bereits mit 60 entfernt.
                  </li>
                  <li>
                    <strong>PKV-Inflation im Alter:</strong> Ist im Modell separat als absoluter Prozentsatz einstellbar (z.B. 2,5 % p.a.), da gesetzliche und tarifliche Altersrückstellungen die Beitragssteigerungen dämpfen.
                  </li>
                  <li>
                    <strong>Abgeltungsteuer:</strong> Beim Depot-Verzehr wird die effektive
                    Abgeltungsteuer auf den Kursgewinn-Anteil (18,46 % nach Teilfreistellung)
                    berücksichtigt.
                  </li>
                  <li>
                    <strong>DRV-Zuschuss:</strong> § 106 SGB VI — halber KV-Satz auf Bruttorente,
                    gedeckelt auf 50 % des tatsächlichen PKV-Beitrags.
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-ink mb-3 uppercase tracking-wider text-xs">
                  3. GKV & Rente
                </h4>
                <ul className="list-disc pl-4 space-y-2">
                  <li>
                    <strong>GKV-Start 2026:</strong> KV 17,3 % + PV 3,6 % = 20,9 % (Basis: mit
                    Kindern). Kinderlose zahlen +0,6 % Kinderlosenzuschlag.
                  </li>
                  <li>
                    <strong>Demografie-Rampe:</strong> Linearer Anstieg bis 2040 auf den eingestellten
                    Ziel-Satz.
                  </li>
                  <li>
                    <strong>Rentenbesteuerung:</strong> Besteuerungsanteil nach Rentenbeginn-Jahr
                    (z. B. 2063 → 100 %). Rentenfreibetrag wird im ersten Rentenjahr nominal
                    festgeschrieben (§ 22 EStG).
                  </li>
                  <li>
                    <strong>PKV-Basistarif (Notnagel):</strong> Wenn das Delta-Depot in der Rente aufgebraucht ist (Bankrott), wird der PKV-Beitrag hart auf den gesetzlichen GKV-Höchstbeitrag gedeckelt. Das entspricht einem Wechsel in den PKV-Basistarif.
                  </li>
                  <li>
                    <strong>Schock-Event (Langzeiterkrankung):</strong> Bei Simulation wird ein ganzes Jahr berechnet, in dem nach 6 Wochen Lohnfortzahlung das Krankengeld/Krankentagegeld greift. Während der GKV-Versicherte beitragsfrei ist, muss in der PKV der volle Beitrag (ohne AG-Zuschuss) weitergezahlt werden.
                  </li>
                  <li>
                    <strong>Real-Ansicht:</strong> Das Depot wird mit der eingestellten
                    allgemeinen Inflation kaufkraftbereinigt.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
