// =============================================================================
// PKV vs. GKV Lebenszyklus-Engine
// Stand: 2026-04 | Alle Werte nach aktuellem Steuer- und Sozialversicherungsrecht
// =============================================================================

// -----------------------------------------------------------------------------
// 1. EINKOMMENSTEUER-TARIFE
// -----------------------------------------------------------------------------

/** Einkommensteuertarif 2024 — für Rückwärtskompatibilität erhalten */
export function calculateIncomeTax2024(taxableIncome: number): number {
  const x = Math.floor(taxableIncome);
  if (x <= 11604) return 0;
  if (x <= 17005) { const y = (x - 11604) / 10000; return Math.round((922.98 * y + 1400) * y); }
  if (x <= 66760) { const z = (x - 17005) / 10000; return Math.round((181.19 * z + 2397) * z + 1025.38); }
  if (x <= 277825) return Math.round(0.42 * x - 10602.13);
  return Math.round(0.45 * x - 18936.88);
}

/**
 * Einkommensteuertarif 2026 (§ 32a EStG, Steuerfortentwicklungsgesetz)
 * Grundfreibetrag: 12.348 €
 * Zone 1: 12.348 – 17.443 € | Zone 2: 17.444 – 68.481 €
 * Spitzensteuersatz: 42 % ab 68.482 € | Reichensteuer: 45 % ab 277.826 €
 *
 * Koeffizienten berechnet für Kontinuität an den Zonengrenzen:
 * - Zone 1: Grenzsteuersatz 14 % → ~24 % (a=978, b=1400)
 * - Zone 2: Grenzsteuersatz 24 % → 42 %  (a=177, b=2397, offset=968)
 */
export function calculateIncomeTax2026(taxableIncome: number): number {
  const x = Math.floor(taxableIncome);
  if (x <= 12347) return 0;
  if (x <= 17443) { const y = (x - 12347) / 10000; return Math.round((978 * y + 1400) * y); }
  if (x <= 68481) { const z = (x - 17443) / 10000; return Math.round((177 * z + 2397) * z + 968); }
  if (x <= 277825) return Math.round(0.42 * x - 10950);
  return Math.round(0.45 * x - 19285);
}

/**
 * Einheitliche Dispatch-Funktion. Verwendet 2026-Tarif für alle Jahre >= 2026.
 * Kein Solidaritätszuschlag, kein Splittingtarif, keine Kirchensteuer.
 */
export function calculateIncomeTax(taxableIncome: number, year: number = 2026): number {
  if (year <= 2024) return calculateIncomeTax2024(taxableIncome);
  return calculateIncomeTax2026(taxableIncome);
}

// -----------------------------------------------------------------------------
// 2. RENTENBESTEUERUNG (§ 22 EStG, Wachstumschancengesetz 2024)
// -----------------------------------------------------------------------------

/**
 * Besteuerungsanteil der gesetzlichen Rente nach Rentenbeginn-Jahr.
 *
 * Wachstumschancengesetz (März 2024): ab 2023 jährlich +0,5 Prozentpunkte,
 * Vollbesteuerung (100 %) erst ab Rentenbeginn 2058 — nicht ab 2040!
 *
 * Der Rentenfreibetrag wird im ersten Rentenjahr nominal festgeschrieben
 * und gilt für alle Folgejahre (§ 22 EStG).
 */
export function getTaxableShare(retirementYear: number): number {
  if (retirementYear <= 2023) return 0.825;
  if (retirementYear >= 2058) return 1.0;
  return 0.825 + (retirementYear - 2023) * 0.005;
}

// -----------------------------------------------------------------------------
// 3. PFLEGEVERSICHERUNG (§ 55 SGB XI, ab 2025)
// -----------------------------------------------------------------------------

/**
 * Berechnet die PV-Beitragssätze abhängig von Jahr, Kinderzahl und Alter.
 *
 * - Base-Satz: 3,4 % bis 2024, 3,6 % ab 2025
 * - Kinderlosenzuschlag: +0,6 % für Personen ohne Kinder ab 23 Jahren (voller AN-Anteil)
 * - Kinderabschlag: −0,25 % pro Kind (2.–5. Kind), max. −1,0 % (§ 55 Abs. 3a SGB XI)
 * - AG trägt immer halben Base-Satz (1,8 % ab 2025). Kinderlos-Zuschlag + Kinderabschlag: voller AN-Anteil.
 *
 * @returns gesamt: voller Satz (für Rentner; kein AG-Splitting)
 *          arbeitnehmer: AN-Anteil inkl. Kinderlos-Zuschlag / -abschlag
 */
export function getPvRate(
  hasChildren: boolean,
  numKids: number,
  age: number,
  year: number
): { gesamt: number; arbeitnehmer: number } {
  const base = year >= 2025 ? 0.036 : 0.034;
  const kinderlosZuschlag = !hasChildren && age >= 23 ? 0.006 : 0;
  // Abschlag für das 2.–5. Kind: je 0,25 %, max. 1,0 %
  const kinderAbschlag = hasChildren && numKids >= 2
    ? Math.min(0.0025 * (numKids - 1), 0.01)
    : 0;
  const gesamt = base + kinderlosZuschlag - kinderAbschlag;
  // AN trägt Hälfte des Base-Satzes + vollen Kinderlosenzuschlag − Kinderabschlag
  const arbeitnehmer = base / 2 + kinderlosZuschlag - kinderAbschlag;
  return { gesamt, arbeitnehmer };
}

// -----------------------------------------------------------------------------
// 4. INTERFACES
// -----------------------------------------------------------------------------

export interface PkvGkvInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  grossIncome: number;
  estimatedPension: number;       // Erwartete GRV-Rente (€/Monat, heutiger Wert)
  pkvPremium: number;             // PKV-Monatsbeitrag inkl. 10 %-Zuschlag (§ 12 Abs. 4a VAG)
  pkvBet: number;                 // Beitragsentlastungstarif im Alter (€/Monat)
  etfYield: number;               // ETF-Rendite (% p.a.)
  gkvMaxRate: number;             // Ziel-Gesamtbeitragssatz GKV+PV 2040 (%), Basis: mit Kindern
  pkvInflation: number;           // PKV-Kostensteigerung (% p.a.)
  salaryGrowth: number;           // Lohnwachstum (% p.a.)
  // 2.3 — Pflegeversicherung
  hasChildren: boolean;
  numberOfChildren: number;       // Kinder unter 25
  // 2.1 — PKV-Inflation in der Rentenphase
  pkvInflationRetirement: number; // (% p.a.), Default 2.5
  assumedInflation: number;       // Allgemeine Inflation für Real-Deflator (% p.a.), Default 2.0
}

export interface YearlyData {
  age: number;
  depotValue: number;
  depotValueReal: number;  // 3.1: inflationsbereinigt
  gkvCost: number;
  pkvCost: number;
  netDelta: number;
}

export interface PkvGkvResults {
  tcoGkv: number;
  tcoPkv: number;
  finalDeltaDepot: number;
  depotZeroAge: number | null;
  firstYearPkvCostRetirement: number;
  firstYearGkvCostRetirement: number;
  yearlyData: YearlyData[];
  isPkvEligible: boolean;         // 2.6: JAEG-Prüfung
}

// -----------------------------------------------------------------------------
// 5. KONSTANTEN
// -----------------------------------------------------------------------------

/** Beitragsbemessungsgrenze GKV 2026 (West, BMAS) */
const BBG_2026 = 66150;

/** KV-Beitragssatz 2026: 14,6 % allgemein + 2,7 % Durchschnittszusatzbeitrag */
const KV_RATE_2026 = 0.173;

/** PV-Basis 2026 (mit Kindern, als Rampen-Ankerpunkt für den Total-GKV-Satz) */
const PV_BASELINE_2026 = 0.036;

/** Startpunkt Demografie-Rampe: KV 17,3 % + PV 3,6 % = 20,9 % */
const START_TOTAL_RATE_2026 = KV_RATE_2026 + PV_BASELINE_2026;

/** Jahresarbeitsentgeltgrenze 2026 */
const JAEG_2026 = 73800;

/**
 * Effektive Abgeltungsteuer auf Aktien-ETF-Entnahmen:
 * 26,375 % (inkl. Soli) × 0,7 (Teilfreistellung Aktien-ETF) = 18,46 %
 * Davon wird nur der Gewinnanteil besteuert.
 */
const ABGST_EFFECTIVE = 0.1846;

// -----------------------------------------------------------------------------
// 6. HAUPTSIMULATION
// -----------------------------------------------------------------------------

export function simulatePkvGkv(inputs: PkvGkvInputs): PkvGkvResults {
  // -- Depot-Tracking --
  let currentDepot = 0;
  let capitalInvested = 0;  // 2.2: Eingezahltes Kapital (für Gewinnanteil-Berechnung)

  // -- TCO-Akkumulatoren --
  let tcoGkv = 0;
  let tcoPkv = 0;
  let depotZeroAge: number | null = null;

  // -- Dynamische Größen --
  let currentSalary = inputs.grossIncome;
  let currentBbg = BBG_2026;
  let currentPkvPremium = inputs.pkvPremium * 12; // Jahresbeitrag, inkl. 10 %-Zuschlag

  const yieldFactor = 1 + inputs.etfYield / 100;

  // 1.1 — 10 %-Zuschlag: entfällt mit vollendetem 60. Lebensjahr (ab Alter 61)
  let pkvSurchargeActive = inputs.currentAge < 61;

  // 2.5 — KTG-Faktor: wird einmalig beim Renteneintritt angewendet
  let ktgApplied = false;

  // -- Rentenphase-Tracking --
  let projectedPension = inputs.estimatedPension > 0 ? inputs.estimatedPension * 12 : 0;
  let retirementPension = 0;

  // 1.4 — Rentenbesteuerungsanteil und Rentenfreibetrag
  const retirementYear = 2026 + (inputs.retirementAge - inputs.currentAge);
  const taxableShare = getTaxableShare(retirementYear);
  let rentenfreibetrag = 0;  // wird im ersten Rentenjahr nominal festgeschrieben

  // -- KPI-Erfassung --
  let firstYearPkvCostRetirement = 0;
  let firstYearGkvCostRetirement = 0;

  const yearlyData: YearlyData[] = [];

  // ============================================================================
  // HAUPTSCHLEIFE
  // ============================================================================
  for (let age = inputs.currentAge; age <= inputs.lifeExpectancy; age++) {
    const currentYear = 2026 + (age - inputs.currentAge);
    let monthlyGkv = 0;
    let monthlyPkv = 0;
    let netDelta = 0;

    // 1.1 — Zuschlag entfällt am Beginn des 61. Lebensjahrs
    if (age === 61 && pkvSurchargeActive) {
      currentPkvPremium /= 1.10;
      pkvSurchargeActive = false;
    }

    // 2.5 — KTG entfällt beim Renteneintritt (nur Krankentagegeld, ~6 %)
    // Hinweis: 0.85 im Altcode repräsentierte 10 %-Zuschlag + KTG.
    // Zuschlag wird jetzt separat bei 61 entfernt → nur noch KTG (~6 %) verbleiben.
    if (age === inputs.retirementAge && !ktgApplied) {
      currentPkvPremium *= 0.94;
      ktgApplied = true;
    }

    // -- GKV Demografie-Rampe (KV-Anteil wächst von 2026 bis 2040) --
    const maxRateTarget = inputs.gkvMaxRate / 100;
    // Rampe wächst den KV-Anteil linear: Start-KV + anteiliger Weg zum Ziel (abzügl. Basis-PV)
    const maxKvRate = Math.max(KV_RATE_2026, maxRateTarget - PV_BASELINE_2026);
    let kvRateRamped: number;
    if (currentYear < 2040) {
      const progress = Math.max(0, Math.min(1, (currentYear - 2026) / 14));
      kvRateRamped = KV_RATE_2026 + (maxKvRate - KV_RATE_2026) * progress;
    } else {
      kvRateRamped = maxKvRate;
    }

    // 2.3 — PV-Rate personen- und jahresspezifisch (inkl. Kinderlosenzuschlag)
    const pvRates = getPvRate(inputs.hasChildren, inputs.numberOfChildren, age, currentYear);

    // Gesamte GKV-Rate (KV + PV) für diesen Versicherten in diesem Jahr
    const personTotalGkvRate = kvRateRamped + pvRates.gesamt;

    // =========================================================================
    if (age < inputs.retirementAge) {
      // -----------------------------------------------------------------------
      // ERWERBSPHASE
      // -----------------------------------------------------------------------
      const assessableIncome = Math.min(currentSalary, currentBbg);

      // 1.2 — KV und PV getrennt für steuerliche Absetzbarkeit
      const kvCostEmployee = (assessableIncome * kvRateRamped) / 2;
      // PV-Arbeitnehmeranteil: inkl. Kinderlosenzuschlag / Kinderabschlag
      const pvCostEmployee = pvRates.arbeitnehmer * assessableIncome;
      const gkvCostEmployee = kvCostEmployee + pvCostEmployee;

      // 1.2 — § 10 Abs. 1 Nr. 3 Satz 4 EStG: KV-Anteil um 4 % kürzen (Krankengeldbezug)
      const gkvDeductible = kvCostEmployee * 0.96 + pvCostEmployee;

      // PKV-Arbeitgeberzuschuss (gedeckelt auf 50 % des fiktiven GKV-Höchstbeitrags)
      const maxAgZuschuss = (currentBbg * personTotalGkvRate) / 2;
      const actualAgZuschuss = Math.min(currentPkvPremium / 2, maxAgZuschuss);
      const pkvCostEmployee = currentPkvPremium - actualAgZuschuss;

      // Steuerberechnung GKV (1.2: gkvDeductible statt vollem gkvCostEmployee)
      const taxGkv = calculateIncomeTax(
        Math.max(0, currentSalary - gkvDeductible),
        currentYear
      );

      // Steuerberechnung PKV: 80 % Basisabsicherung, abzgl. steuerfreier AG-Zuschuss
      const pkvBasisabsicherung = currentPkvPremium * 0.8;
      const pkvDeductible = Math.max(0, pkvBasisabsicherung - actualAgZuschuss);
      const taxPkv = calculateIncomeTax(
        Math.max(0, currentSalary - pkvDeductible),
        currentYear
      );

      const netIncomeGkv = currentSalary - gkvCostEmployee - taxGkv;
      const netIncomePkv = currentSalary - pkvCostEmployee - taxPkv;

      tcoGkv += gkvCostEmployee;
      tcoPkv += pkvCostEmployee;

      netDelta = netIncomePkv - netIncomeGkv;

      // 2.2 — Depot mit Abgeltungsteuer-Tracking
      { const r = applyDepotGrowth(currentDepot, capitalInvested, netDelta, yieldFactor);
        currentDepot = r.depot; capitalInvested = r.capital; }

      monthlyGkv = gkvCostEmployee / 12;
      monthlyPkv = pkvCostEmployee / 12;

      // Dynamik für nächstes Jahr
      currentSalary *= 1 + inputs.salaryGrowth / 100;
      currentBbg *= 1 + inputs.salaryGrowth / 100;
      currentPkvPremium *= 1 + inputs.pkvInflation / 100;

      if (projectedPension > 0) {
        projectedPension *= 1 + inputs.salaryGrowth / 100;
      }
      // Fallback: 48 % des letzten Bruttogehalts
      retirementPension = projectedPension > 0 ? projectedPension : currentSalary * 0.48;

    } else {
      // -----------------------------------------------------------------------
      // RENTENPHASE
      // -----------------------------------------------------------------------

      // 1.4 — Rentenfreibetrag im ersten Rentenjahr nominal festschreiben (§ 22 EStG)
      if (rentenfreibetrag === 0 && retirementPension > 0) {
        rentenfreibetrag = retirementPension * (1 - taxableShare);
      }

      // 2.4 — KVdR (§ 248 SGB V): halber KV-Satz auf Bruttorente, RV-Träger trägt andere Hälfte.
      // Pflegeversicherung: voller Satz vom Rentner (kein AG-Splitting in der Rente).
      const retireeKvBurden = kvRateRamped / 2;
      const retireePvRate = pvRates.gesamt; // voller Satz
      const retireeGkvBurden = retireeKvBurden + retireePvRate;
      const gkvCostRetiree = retirementPension * retireeGkvBurden;

      // 2.5 — DRV-Zuschuss (§ 106 SGB VI): halber KV-Satz auf Bruttorente,
      // gedeckelt auf 50 % des tatsächlichen PKV-Beitrags (currentPkvPremium bereits reduziert).
      let drvZuschuss = retirementPension * (kvRateRamped / 2);
      const maxZuschuss = currentPkvPremium / 2;
      drvZuschuss = Math.min(drvZuschuss, maxZuschuss);

      // BET abziehen, DRV-Zuschuss abziehen
      const pkvCostRetiree = Math.max(0, currentPkvPremium - inputs.pkvBet * 12 - drvZuschuss);

      // 1.4 — Rentenbesteuerung: Rentenfreibetrag abziehen (festgeschrieben)
      const taxableGkv = Math.max(0, retirementPension - rentenfreibetrag - gkvCostRetiree);
      const taxGkv = calculateIncomeTax(taxableGkv, currentYear);

      const pkvBasisRetiree = currentPkvPremium * 0.8;
      const pkvDeductibleRetiree = Math.max(0, pkvBasisRetiree - drvZuschuss);
      const taxablePkv = Math.max(0, retirementPension - rentenfreibetrag - pkvDeductibleRetiree);
      const taxPkv = calculateIncomeTax(taxablePkv, currentYear);

      const netIncomeGkv = retirementPension - gkvCostRetiree - taxGkv;
      const netIncomePkv = retirementPension - pkvCostRetiree - taxPkv;

      tcoGkv += gkvCostRetiree;
      tcoPkv += pkvCostRetiree;

      netDelta = netIncomePkv - netIncomeGkv;

      // 2.2 — Depot-Verzehr mit Abgeltungsteuer auf Kursgewinne
      const depotResult = applyDepotGrowth(currentDepot, capitalInvested, netDelta, yieldFactor);
      currentDepot = depotResult.depot;
      capitalInvested = depotResult.capital;

      monthlyGkv = gkvCostRetiree / 12;
      monthlyPkv = pkvCostRetiree / 12;

      // KPIs beim ersten Rentenjahr festhalten
      if (firstYearPkvCostRetirement === 0 && firstYearGkvCostRetirement === 0) {
        firstYearPkvCostRetirement = monthlyPkv;
        firstYearGkvCostRetirement = monthlyGkv;
      }

      // 2.1 — PKV-Inflation in der Rentenphase (durch Altersrückstellungen idR niedriger als in der Erwerbsphase)
      currentPkvPremium *= 1 + inputs.pkvInflationRetirement / 100;

      const pensionGrowth = Math.max(0, inputs.salaryGrowth - 0.5);
      retirementPension *= 1 + pensionGrowth / 100;
    }

    // Depot-Bankrott prüfen
    if (currentDepot < 0 && depotZeroAge === null) {
      depotZeroAge = age;
    }

    // 3.1 — Real-Deflator für Kaufkraftkorrektur
    const years = age - inputs.currentAge;
    const realDeflator = Math.pow(1 + inputs.assumedInflation / 100, years);

    yearlyData.push({
      age,
      depotValue: Math.round(currentDepot),
      depotValueReal: Math.round(currentDepot / realDeflator),
      gkvCost: Math.round(monthlyGkv),
      pkvCost: Math.round(monthlyPkv),
      netDelta: Math.round(netDelta / 12),
    });
  }

  return {
    tcoGkv,
    tcoPkv,
    finalDeltaDepot: currentDepot,
    depotZeroAge,
    firstYearPkvCostRetirement,
    firstYearGkvCostRetirement,
    yearlyData,
    isPkvEligible: inputs.grossIncome >= JAEG_2026,
  };
}

// -----------------------------------------------------------------------------
// 7. HILFSFUNKTION: DEPOT-WACHSTUM MIT ABGELTUNGSTEUER (2.2)
// -----------------------------------------------------------------------------

/**
 * Verwaltet Depot-Wachstum und Entnahme mit korrekter Abgeltungsteuer.
 *
 * Beim Einzahlen (netDelta >= 0): Kapital wächst, Depot + Einzahlung × Rendite.
 * Beim Entnehmen (netDelta < 0): Brutto-Entnahme wird um Abgeltungsteuer auf
 * den Kursgewinn-Anteil erhöht, sodass der Nettoempfang exakt |netDelta| ergibt.
 *
 * Steuerparameter:
 *   26,375 % AbgSt+Soli × 70 % (Teilfreistellung Aktien-ETF) = 18,46 % effektiv
 *   Davon nur der Gewinnanteil: gainFraction = (Depot − Einstandswert) / Depot
 *
 * @returns neues depot und neues capitalInvested
 */
function applyDepotGrowth(
  depot: number,
  capital: number,
  netDelta: number,
  yieldFactor: number
): { depot: number; capital: number } {
  if (netDelta >= 0) {
    // Einzahlung: Kapital erhöht sich
    return {
      depot: (depot + netDelta) * yieldFactor,
      capital: capital + netDelta,
    };
  }

  // Entnahme: Abgeltungsteuer auf Kursgewinne
  const gainFraction = depot > 0
    ? Math.max(0, Math.min(1, (depot - capital) / depot))
    : 0;

  // Bruttobetrag, der entnommen werden muss, damit nach Abgeltungsteuer netDelta ankommt:
  // Netto = Brutto × (1 - gainFraction × ABGST_EFFECTIVE)  →  Brutto = Netto / (1 - ...)
  const taxFactor = 1 - gainFraction * ABGST_EFFECTIVE;
  const grossWithdrawal = taxFactor > 0.01 ? netDelta / taxFactor : netDelta; // netDelta ist negativ

  // Kapitalanteil der Entnahme proportional reduzieren
  const withdrawalRatio = depot > 0
    ? Math.min(1, Math.abs(grossWithdrawal) / depot)
    : 0;
  const newCapital = Math.max(0, capital * (1 - withdrawalRatio));

  return {
    depot: (depot + grossWithdrawal) * yieldFactor,
    capital: newCapital,
  };
}
