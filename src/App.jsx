import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Search, AlertTriangle, Info, Syringe, 
  Activity, ChevronRight, RefreshCw, ChevronDown, List, X
} from 'lucide-react';

/**
 * ==========================================
 * DATA REPOSITORY (THE KNOWLEDGE BASE)
 * ==========================================
 * Fully restored 20+ drugs with Internist-level Clinical Pearls.
 */
const DRUG_DATABASE = {
  // --- ANTIVIRALS ---
  "acyclovir-iv": {
    name: "Acyclovir (IV)",
    class: "Antiviral (DNA Polymerase Inhibitor)",
    note: "Risiko Crystal Nephropathy (obstruksi tubulus). Wajib hidrasi agresif (loading NS 500ml-1L). Monitor SCr tiap 48 jam. Infus harus lambat (>1 jam) untuk cegah presipitasi di tubulus renalis.",
    rrt: { ihd: "2.5-5 mg/kg post-dialysis.", crrt: "Tx: 5-7.5 mg/kg q24h. Px: 2.5-5 mg/kg q24h.", sled: "5-10 mg/kg post-SLED." },
    isMultiStrategy: true,
    strategies: {
      "Prophylaxis (BMT / HOM / Immunocompromised)": {
        standard_dose: "5 mg/kg IV q12h",
        adjustments: [
          { max: 200, min: 51, recommendation: "5 mg/kg IV q12h" },
          { max: 50, min: 25, recommendation: "5 mg/kg IV q24h" },
          { max: 24, min: 10, recommendation: "2.5 mg/kg IV q24h" },
          { max: 9, min: 0, recommendation: "2.5 mg/kg IV q48h" }
        ]
      },
      "Treatment (HSV / VZV / Encephalitis)": {
        standard_dose: "10 mg/kg IV q8h",
        adjustments: [
          { max: 200, min: 51, recommendation: "10 mg/kg IV q8h" },
          { max: 50, min: 25, recommendation: "10 mg/kg IV q12h" },
          { max: 24, min: 10, recommendation: "10 mg/kg IV q24h" },
          { max: 9, min: 0, recommendation: "5 mg/kg IV q24h" }
        ]
      }
    }
  },
  "acyclovir-po": {
    name: "Acyclovir (PO)",
    class: "Antiviral",
    note: "Bioavailabilitas oral rendah (15-30%). Penyesuaian dosis krusial pada Zoster (dosis tinggi). Maintain hidrasi untuk mencegah akumulasi di tubulus renal.",
    rrt: { ihd: "Dose after dialysis.", crrt: "Same as CrCl < 10.", sled: "Dose after SLED." },
    isMultiStrategy: true,
    strategies: {
      "Zoster Treatment": {
        standard_dose: "800 mg PO 5x/day",
        adjustments: [
          { max: 200, min: 26, recommendation: "800 mg 5x/day" },
          { max: 25, min: 10, recommendation: "800 mg PO q8h" },
          { max: 9, min: 0, recommendation: "800 mg PO q12h" }
        ]
      },
      "HSV Treatment / Prophylaxis": {
        standard_dose: "400 mg PO q8h",
        adjustments: [
          { max: 200, min: 11, recommendation: "400 mg PO q8h" },
          { max: 10, min: 0, recommendation: "200 mg PO q12h" }
        ]
      }
    }
  },
  "ganciclovir": {
    name: "Ganciclovir (IV)",
    class: "Antiviral (CMV)",
    note: "Dreaded side effect: Myelosuppression (Neutropenia). Gunakan IBW untuk kalkulasi dosis. Monitor CBC rutin tiap 2-3 hari. Induksi krusial untuk CMV retinitis/organ disease.",
    rrt: { ihd: "Induction: 1.25 mg/kg post-HD.", crrt: "Induction: 2.5 mg/kg q24h.", sled: "Induction: 2.5 mg/kg post-SLED." },
    isMultiStrategy: true,
    strategies: {
      "Induction (Active Infection)": {
        standard_dose: "5 mg/kg IV q12h",
        adjustments: [
          { max: 69, min: 50, recommendation: "2.5 mg/kg IV q12h" },
          { max: 49, min: 25, recommendation: "2.5 mg/kg IV q24h" },
          { max: 24, min: 10, recommendation: "1.25 mg/kg IV q24h" },
          { max: 9, min: 0, recommendation: "1.25 mg/kg IV 3x/week post-HD" }
        ]
      },
      "Maintenance (Secondary Px)": {
        standard_dose: "5 mg/kg IV q24h",
        adjustments: [
          { max: 69, min: 50, recommendation: "2.5 mg/kg IV q24h" },
          { max: 49, min: 25, recommendation: "1.25 mg/kg IV q24h" },
          { max: 24, min: 10, recommendation: "0.625 mg/kg IV q24h" }
        ]
      }
    }
  },
  "valganciclovir": {
    name: "Valganciclovir (PO)",
    class: "Antiviral (CMV)",
    note: "Prodrug Ganciclovir (900mg PO ~ 5mg/kg IV). Absorpsi meningkat signifikan dengan makanan lemak tinggi. Risiko toksisitas sumsum tulang sama dengan ganciclovir.",
    rrt: { ihd: "200mg post-HD.", crrt: "450mg q24h-48h.", sled: "Dose post-SLED." },
    isMultiStrategy: true,
    strategies: {
      "Induction (Organ Disease)": {
        standard_dose: "900 mg PO BID",
        adjustments: [
          { max: 59, min: 40, recommendation: "450 mg PO BID" },
          { max: 39, min: 25, recommendation: "450 mg PO q24h" },
          { max: 24, min: 10, recommendation: "450 mg PO q48h" }
        ]
      }
    }
  },
  "oseltamivir": {
    name: "Oseltamivir (PO)",
    class: "Antiviral (Influenza)",
    note: "Neuraminidase inhibitor. Paling efektif jika dimulai <48 jam onset gejala. Penyesuaian dosis dimulai pada CrCl < 60 mL/min.",
    rrt: { ihd: "30mg post-HD.", crrt: "30mg q12h.", sled: "30mg post-SLED." },
    isMultiStrategy: true,
    strategies: {
      "Treatment (Influenza A/B)": {
        standard_dose: "75 mg PO BID",
        adjustments: [
          { max: 60, min: 31, recommendation: "30 mg PO BID" },
          { max: 30, min: 11, recommendation: "30 mg PO q24h" }
        ]
      }
    }
  },

  // --- ANTIFUNGALS ---
  "fluconazole": {
    name: "Fluconazole",
    class: "Antifungal (Azole)",
    note: "Interaksi obat via inhibisi CYP3A4. Risiko perpanjangan QTc. Clearance renal dominan (80%). Loading dose krusial (biasanya 2x dosis maintenance). Post-HD: Berikan 100% dosis.",
    rrt: { ihd: "100% dose AFTER dialysis.", crrt: "Standard dose.", sled: "Standard dose." },
    isMultiStrategy: true,
    strategies: {
      "Systemic Candidiasis": {
        standard_dose: "400 - 800 mg q24h",
        adjustments: [{ max: 50, min: 0, recommendation: "Reduce maintenance dose by 50%." }]
      }
    }
  },
  "voriconazole": {
    name: "Voriconazole",
    class: "Antifungal (Azole)",
    note: "IV formulation: Pelarut SBECD menumpuk pada CrCl < 50, risiko nefrotoksisitas. SWITCH TO ORAL (Bioavailabilitas >96%). Target Trough: 2-5.5 mcg/mL. Pantau fungsi hati (SGOT/SGPT).",
    rrt: { ihd: "Oral: No adj. IV: Give after HD.", crrt: "Standard dose.", sled: "Dose after SLED." },
    isMultiStrategy: true,
    strategies: {
      "Intravenous (IV) Mode": {
        standard_dose: "4 mg/kg IV q12h",
        adjustments: [
          { max: 200, min: 51, recommendation: "4 mg/kg IV q12h" },
          { max: 50, min: 0, recommendation: "SWITCH TO ORAL tablet to avoid SBECD accumulation." }
        ]
      },
      "Oral Tablet": {
        standard_dose: "200 mg PO q12h",
        adjustments: [{ max: 200, min: 0, recommendation: "No Renal Adjustment Required for Oral form." }]
      }
    }
  },
  "caspofungin": {
    name: "Caspofungin",
    class: "Antifungal (Echinocandin)",
    note: "Aman untuk ginjal. Metabolisme di hati. Adjust dosis hanya pada gangguan hati (Child-Pugh B: 35mg maintenance).",
    rrt: { ihd: "No adjustment.", crrt: "No adjustment.", sled: "No adjustment." },
    standard_dose: "Load 70mg, then 50mg q24h",
    adjustments: [{ max: 200, min: 0, recommendation: "No Renal Adjustment Required." }]
  },
  "amphotericin-b": {
    name: "Amphotericin B",
    class: "Antifungal (Polyene)",
    note: "Nefrotoksisitas berat (Vasokonstriksi arteriol aferen). Wajib salt loading (NS 500-1000ml pre/post). Pantau K+ dan Mg++ (risiko hipokalemia berat). Liposomal form lebih aman dibanding Deoxycholate.",
    rrt: { ihd: "No adj.", crrt: "Standard dose.", sled: "Standard dose." },
    isMultiStrategy: true,
    strategies: {
      "Liposomal (AmBisome)": {
        standard_dose: "3 - 5 mg/kg IV q24h",
        adjustments: [{ max: 200, min: 0, recommendation: "No renal adjustment, but monitor SCr closely." }]
      },
      "Conventional (Deoxycholate)": {
        standard_dose: "0.5 - 1.0 mg/kg IV q24h",
        adjustments: [
          { max: 200, min: 11, recommendation: "0.5 - 1.0 mg/kg q24h" },
          { max: 10, min: 0, recommendation: "q24h or q48h. Consider Liposomal." }
        ]
      }
    }
  },

  // --- ANTIBIOTICS ---
  "meropenem": {
    name: "Meropenem",
    class: "Carbapenem",
    note: "Neurotoksisitas krusial. Interaksi fatal dengan Asam Valproat (Valproat turun drastis, risiko seizure). Consider 3-hour infusion untuk optimalisasi PD pada kuman MDR.",
    rrt: { ihd: "Std: 500mg post-HD. Meningitis: 1g post-HD.", crrt: "1g q12h.", sled: "Dose post-SLED." },
    isMultiStrategy: true,
    strategies: {
      "Standard Sepsis": {
        standard_dose: "1 g IV q8h",
        adjustments: [
          { max: 50, min: 26, recommendation: "1 g IV q12h" },
          { max: 25, min: 10, recommendation: "500 mg IV q12h" },
          { max: 9, min: 0, recommendation: "500 mg IV q24h" }
        ]
      },
      "Meningitis / MDR GNB": {
        standard_dose: "2 g IV q8h",
        adjustments: [
          { max: 50, min: 26, recommendation: "2 g IV q12h" },
          { max: 25, min: 10, recommendation: "1 g IV q12h" },
          { max: 9, min: 0, recommendation: "1 g IV q24h" }
        ]
      }
    }
  },
  "piperacillin-tazobactam": {
    name: "Piperacillin-Tazobactam",
    class: "Penicillin / BLI",
    note: "Nephrotoxicity synergism dengan Vancomycin (PIPER study). Extended infusion (4h) disarankan untuk kuman dengan MIC tinggi. Sodium load tinggi (2.8mEq/g).",
    rrt: { ihd: "2.25 g IV q8h post-HD.", crrt: "4.5 g IV q8h (Extended Infusion).", sled: "2.25 g IV q8h." },
    isMultiStrategy: true,
    strategies: {
      "Extended Infusion (4h)": {
        standard_dose: "4.5 g IV q6h",
        adjustments: [
          { max: 40, min: 21, recommendation: "3.375 g IV q8h" },
          { max: 20, min: 0, recommendation: "3.375 g IV q12h" }
        ]
      }
    }
  },
  "cefoperazone-sulbactam": {
    name: "Cefoperazone-Sulbactam",
    class: "Cephalosporin / BLI",
    note: "Cefoperazone ekskresi via empedu, Sulbactam ekskresi via renal. Adjustment dosis didasarkan pada komponen Sulbactam. Max Sulbactam 4g/hari.",
    rrt: { ihd: "Dose post-HD.", crrt: "Standard dose.", sled: "Dose post-SLED." },
    isMultiStrategy: true,
    strategies: {
      "Ratio 1:1 (Max Sulb 4g/day)": {
        standard_dose: "2 g (1g/1g) IV q12h",
        adjustments: [
          { max: 30, min: 15, recommendation: "2 g IV q12h (Max Sulb 2g/day)" },
          { max: 14, min: 0, recommendation: "1.5 g (1g/0.5g) q12h or 2g q24h" }
        ]
      }
    }
  },
  "ampicillin-sulbactam": {
    name: "Ampicillin-Sulbactam",
    class: "Penicillin / BLI",
    note: "Untuk Acinetobacter (ABA), target dosis tinggi Sulbactam (target 6g/hari). Rasio 2:1. Hati-hati risiko neurotoksisitas pada dosis tinggi dengan CrCl rendah.",
    rrt: { ihd: "Std: 1.5-3g post-HD. ABA: 3g q12h post-HD.", crrt: "ABA: 3g q8h.", sled: "3g q24h post-SLED." },
    isMultiStrategy: true,
    strategies: {
      "Mild / Moderate Infection": {
        standard_dose: "1.5 - 3 g IV q6h",
        adjustments: [
          { max: 30, min: 15, recommendation: "1.5 - 3 g IV q12h" },
          { max: 14, min: 0, recommendation: "1.5 - 3 g IV q24h" }
        ]
      },
      "Acinetobacter (ABA) - High Dose": {
        standard_dose: "3 g IV q4h",
        adjustments: [
          { max: 200, min: 31, recommendation: "3 g IV q6h" },
          { max: 30, min: 15, recommendation: "3 g IV q8h" },
          { max: 14, min: 0, recommendation: "3 g IV q12h" }
        ]
      }
    }
  },
  "cefepime": {
    name: "Cefepime",
    class: "Cephalosporin (4th Gen)",
    note: "NCSE (Non-Convulsive Status Epilepticus) via inhibisi GABA-A receptor. Monitor status mental ketat pada CrCl < 30. Anti-Pseudomonal kuat.",
    rrt: { ihd: "1 g q24h post-HD.", crrt: "2 g q12h (Severe Sepsis).", sled: "2 g q24h." },
    isMultiStrategy: true,
    strategies: {
      "Severe / Pseudomonas / CNS": {
        standard_dose: "2 g IV q8h",
        adjustments: [
          { max: 60, min: 30, recommendation: "2 g IV q12h" },
          { max: 29, min: 11, recommendation: "2 g IV q24h" },
          { max: 10, min: 0, recommendation: "1 g IV q24h" }
        ]
      }
    }
  },
  "ceftazidime": {
    name: "Ceftazidime",
    class: "Cephalosporin (3rd Gen)",
    note: "Lini utama anti-pseudomonal. Penyesuaian dosis agresif pada gangguan ginjal untuk cegah toksisitas CNS.",
    rrt: { ihd: "1 g post-HD.", crrt: "2 g q12h.", sled: "1 g post-SLED." },
    standard_dose: "2 g IV q8h",
    adjustments: [
      { max: 50, min: 31, recommendation: "1 - 2 g IV q12h" },
      { max: 30, min: 16, recommendation: "1 - 2 g IV q24h" },
      { max: 15, min: 6, recommendation: "500mg - 1 g IV q24h" }
    ]
  },
  "levofloxacin": {
    name: "Levofloxacin",
    class: "Fluoroquinolone",
    note: "Oral bioavailabilitas ~99% (Dosis PO = IV). Risiko tendinopati, disglikemia, dan QT prolongation. Hindari antasida/kation multivalen saat konsumsi oral.",
    rrt: { ihd: "750mg load, then 500mg q48h.", crrt: "750mg q24h.", sled: "500mg q48h." },
    standard_dose: "750 mg q24h",
    adjustments: [
      { max: 50, min: 20, recommendation: "750 mg x1, then 750 mg q48h" },
      { max: 19, min: 0, recommendation: "750 mg x1, then 500 mg q48h" }
    ]
  },
  "ciprofloxacin": {
    name: "Ciprofloxacin",
    class: "Fluoroquinolone",
    note: "Inhibitor moderat CYP1A2. Risiko tendinitis dan ruptur tendon. Efektif untuk GNB aerobik termasuk Pseudomonas.",
    rrt: { ihd: "400mg q24h post-HD.", crrt: "400mg q12h.", sled: "400mg q24h." },
    standard_dose: "400 mg IV q8-12h",
    adjustments: [
      { max: 30, min: 0, recommendation: "400 mg IV q24h" }
    ]
  },
  "vancomycin": {
    name: "Vancomycin",
    class: "Glycopeptide",
    note: "AUC/MIC target 400-600. TDM krusial untuk mencegah AKI. Load 25-30mg/kg pada sepsis berat/obesitas. Nephrotoxicity meningkat bila digabung Pip-Tazo.",
    rrt: { ihd: "Load 20-25mg/kg. Maint by pre-HD levels.", crrt: "Load 20-25mg/kg, then 10-15mg/kg q12-24h.", sled: "Dose by level." },
    standard_dose: "15 - 20 mg/kg q12h",
    adjustments: [
      { max: 49, min: 30, recommendation: "15 mg/kg IV q24h" },
      { max: 29, min: 0, recommendation: "15-20 mg/kg load, then random level monitoring." }
    ]
  },
  "cotrimoxazole": {
    name: "Cotrimoxazole (TMP/SMX)",
    class: "Sulfonamide",
    note: "Dosis berdasarkan TMP. Risiko hiperkalemia (inhibisi ENaC) dan peningkatan SCr semu (inhibisi sekresi tubular). Penyesuaian dosis mulai pada CrCl < 30.",
    rrt: { ihd: "50% dose post-HD.", crrt: "Standard dose.", sled: "50% dose." },
    isMultiStrategy: true,
    strategies: {
      "PJP Treatment": {
        standard_dose: "15 - 20 mg/kg/day TMP",
        adjustments: [
          { max: 30, min: 15, recommendation: "7.5 - 10 mg/kg/day (50% dose)" }
        ]
      },
      "SSTI / UTI": {
        standard_dose: "1 DS tab PO BID",
        adjustments: [
          { max: 30, min: 15, recommendation: "1 DS tab PO q24h" }
        ]
      }
    }
  },
  "gentamicin": {
    name: "Gentamicin",
    class: "Aminoglycoside",
    note: "Extended interval (Once Daily) mengurangi risiko AKI. Penumpukan di korteks ginjal bersifat saturable. TDM (target trough <1) krusial untuk keamanan jangka panjang.",
    rrt: { ihd: "2 mg/kg post-HD.", crrt: "2.5 mg/kg load, then by levels.", sled: "2 mg/kg post-SLED." },
    isMultiStrategy: true,
    strategies: {
      "Extended Interval": {
        standard_dose: "5 - 7 mg/kg q24h",
        adjustments: [
          { max: 60, min: 40, recommendation: "5 - 7 mg/kg q36h" },
          { max: 39, min: 20, recommendation: "5 - 7 mg/kg q48h" },
          { max: 19, min: 0, recommendation: "Dosing based on TDM Levels only." }
        ]
      }
    }
  },
  "metronidazole": {
    name: "Metronidazole",
    class: "Nitroimidazole",
    note: "Aman untuk ginjal. Metabolit dapat menumpuk pada ESRD tetapi signifikansi klinis minim kecuali penggunaan >2 minggu. Neurotoxicity (neuropati) risiko utama.",
    rrt: { ihd: "Dose post-HD.", crrt: "500mg q8h.", sled: "500mg q8h." },
    standard_dose: "500 mg q8h",
    adjustments: [{ max: 200, min: 0, recommendation: "500 mg q8h (No Renal Adj. needed)" }]
  }
};

/**
 * ==========================================
 * MEDICAL LOGIC ENGINE
 * ==========================================
 */
const calculateIBW = (height, gender) => {
  if (!height) return 0;
  const inches = height / 2.54;
  const base = gender === 'male' ? 50 : 45.5;
  return base + 2.3 * (inches - 60);
};

const calculateAdjBW = (weight, ibw) => ibw + 0.4 * (weight - ibw);

const calculateCrCl = (age, weight, creatinine, gender, height) => {
  if (!age || !weight || !creatinine || !height || creatinine <= 0) return null;
  const ibw = calculateIBW(height, gender);
  let dosingWeight = weight < ibw ? weight : (weight > ibw * 1.3 ? calculateAdjBW(weight, ibw) : ibw);
  let weightType = weight < ibw ? "Actual (Underweight)" : (weight > ibw * 1.3 ? "Adjusted (Obese)" : "IBW");
  const constant = gender === 'male' ? 1 : 0.85;
  const result = ((140 - age) * dosingWeight) / (72 * creatinine) * constant;
  return { value: result, usedWeight: dosingWeight, weightType };
};

/**
 * ==========================================
 * MAIN APP COMPONENT
 * ==========================================
 */
export default function App() {
  const [patient, setPatient] = useState({ age: '', gender: 'male', weight: '', height: '', creatinine: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrugId, setSelectedDrugId] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [showInventory, setShowInventory] = useState(false);

  const calculation = useMemo(() => calculateCrCl(
    parseFloat(patient.age), parseFloat(patient.weight), 
    parseFloat(patient.creatinine), patient.gender, parseFloat(patient.height)
  ), [patient]);

  const filteredDrugs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return Object.keys(DRUG_DATABASE).filter(key => 
      DRUG_DATABASE[key].name.toLowerCase().includes(term) ||
      DRUG_DATABASE[key].class.toLowerCase().includes(term)
    ).sort();
  }, [searchTerm]);

  const selectedDrug = selectedDrugId ? DRUG_DATABASE[selectedDrugId] : null;

  useEffect(() => {
    if (selectedDrug?.isMultiStrategy) {
      setSelectedStrategy(Object.keys(selectedDrug.strategies)[0]);
    } else {
      setSelectedStrategy(null);
    }
  }, [selectedDrugId, selectedDrug]);

  const getRec = (drug, crclVal, strategyKey) => {
    if (!drug) return "";
    if (!crclVal && crclVal !== 0) return "Lengkapi data pasien...";
    if (drug.isMultiStrategy && !strategyKey) return "Pilih strategi...";
    const strategy = drug.isMultiStrategy ? drug.strategies[strategyKey] : drug;
    if (!strategy?.adjustments) return drug.standard_dose || "Dosis Standar";
    const adj = strategy.adjustments.find(a => crclVal <= a.max && crclVal >= a.min);
    return adj ? adj.recommendation : (strategy.standard_dose || "Dosis Standar");
  };

  const getStatusColor = (val) => {
    if (!val && val !== 0) return 'bg-slate-100 text-slate-400';
    if (val < 30) return 'bg-red-600 text-white';
    if (val < 60) return 'bg-amber-500 text-white';
    return 'bg-green-600 text-white';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <header className="bg-slate-900 text-white p-6 shadow-xl sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg"><Activity className="h-6 w-6" /></div>
            <div>
              <h1 className="text-2xl font-black tracking-tight flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                Adjustr.io 
                <span className="text-blue-500 text-[10px] font-bold uppercase tracking-wider">for medical professional only</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Comprehensive Dosing Engine</p>
            </div>
          </div>
          <button onClick={() => setPatient({ age: '', gender: 'male', weight: '', height: '', creatinine: '' })} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition-colors flex items-center gap-1 text-white">
            <RefreshCw className="h-3 w-3" /> Reset
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {/* PATIENT PARAMS */}
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {['male', 'female'].map(g => (
                  <button key={g} onClick={() => setPatient(p => ({...p, gender: g}))} className={`py-2 rounded-xl text-xs font-bold capitalize transition-all ${patient.gender === g ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>{g}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Usia</label>
              <input type="number" value={patient.age} onChange={e => setPatient(p => ({...p, age: e.target.value}))} className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Tahun" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">BB (kg)</label>
              <input type="number" value={patient.weight} onChange={e => setPatient(p => ({...p, weight: e.target.value}))} className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">TB (cm)</label>
              <input type="number" value={patient.height} onChange={e => setPatient(p => ({...p, height: e.target.value}))} className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Serum Kreatinin (mg/dL)</label>
              <input type="number" step="0.01" value={patient.creatinine} onChange={e => setPatient(p => ({...p, creatinine: e.target.value}))} className="w-full bg-slate-100 border-none ring-1 ring-blue-200 rounded-xl p-3 text-xl font-black text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none shadow-inner" />
            </div>
          </div>

          <div className={`p-6 transition-all duration-700 shadow-inner ${getStatusColor(calculation?.value)}`}>
            {calculation ? (
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Est. CrCl (Cockcroft-Gault)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter">{calculation.value.toFixed(1)}</span>
                    <span className="text-sm opacity-80 font-bold">mL/min</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase opacity-80">Dosing Weight</p>
                  <p className="text-lg font-black">{calculation.usedWeight.toFixed(1)} kg</p>
                  <p className="text-[10px] opacity-70 italic">{calculation.weightType}</p>
                </div>
              </div>
            ) : <div className="flex items-center justify-center gap-2 py-4 font-bold text-sm"><Info className="h-4 w-4" /> Masukkan parameter pasien...</div>}
          </div>
        </section>

        {/* DRUG SELECTOR & DATABASE BUTTON */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input type="text" placeholder="Cari Obat..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setSelectedDrugId(null);}} className="w-full pl-12 pr-4 py-4 rounded-3xl border-none ring-1 ring-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium" />
            </div>
            <button 
              onClick={() => setShowInventory(true)}
              className="px-6 py-4 bg-white border border-slate-200 rounded-3xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-bold text-slate-700 whitespace-nowrap"
            >
              <List className="h-5 w-5 text-blue-600" />
              Lihat Database Obat
            </button>
          </div>

          {!selectedDrugId && searchTerm && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {filteredDrugs.length > 0 ? filteredDrugs.map(id => (
                <button key={id} onClick={() => {setSelectedDrugId(id); setSearchTerm('');}} className="w-full text-left p-4 hover:bg-blue-50 flex items-center justify-between group transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-800 group-hover:text-blue-700">{DRUG_DATABASE[id].name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{DRUG_DATABASE[id].class}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-blue-500" />
                </button>
              )) : <div className="p-8 text-center text-slate-400 italic">No drugs found.</div>}
            </div>
          )}

          {selectedDrug && (
            <div className="bg-white rounded-3xl shadow-2xl border-t-8 border-blue-600 animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedDrug.name}</h2>
                    <button onClick={() => setSelectedDrugId(null)} className="p-1 hover:bg-slate-200 rounded text-slate-400 transition-colors"><RefreshCw className="h-3 w-3" /></button>
                  </div>
                  <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-md uppercase tracking-wider">{selectedDrug.class}</span>
                </div>
                <Syringe className="h-8 w-8 text-blue-100" />
              </div>

              <div className="p-6 space-y-6">
                {selectedDrug.isMultiStrategy && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Strategy</label>
                    <div className="relative">
                      <select value={selectedStrategy || ''} onChange={e => setSelectedStrategy(e.target.value)} className="w-full appearance-none bg-slate-100 border-none ring-1 ring-slate-200 p-3 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                        {Object.keys(selectedDrug.strategies).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-4 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
                  <div className="flex items-center gap-2 mb-3 opacity-80">
                    <Activity className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Recommended Adjusted Dose</span>
                  </div>
                  <div className="text-2xl font-black leading-tight">
                    {getRec(selectedDrug, calculation?.value, selectedStrategy)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedDrug.rrt).map(([key, val]) => (
                    <div key={key} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{key}</p>
                      <p className="text-[11px] font-bold text-slate-700 leading-tight">{val}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 bg-amber-50 p-5 rounded-2xl border border-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div className="text-sm text-amber-900">
                    <p className="font-black text-[10px] uppercase tracking-widest mb-1 text-amber-700">Expert Clinical Pearls</p>
                    <p className="leading-relaxed opacity-90 italic">{selectedDrug.note}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* DATABASE INVENTORY MODAL */}
      {showInventory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Database Obat</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{Object.keys(DRUG_DATABASE).length} Item Tersedia</p>
              </div>
              <button onClick={() => setShowInventory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
              {Object.keys(DRUG_DATABASE).sort().map(id => (
                <button 
                  key={id} 
                  onClick={() => { setSelectedDrugId(id); setShowInventory(false); setSearchTerm(''); }}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="block font-bold text-slate-800 group-hover:text-blue-700">{DRUG_DATABASE[id].name}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{DRUG_DATABASE[id].class}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-2xl mx-auto px-6 text-center mt-12 space-y-2 opacity-60">
        <p className="text-[10px] leading-relaxed">Based on Stanford Health Care Antimicrobial Dosing Reference Guide (mostly) & MIMS (Cefoperazone + Sulbactam).</p>
        <p className="text-[10px] leading-relaxed">This tool is for educational purposes. Clinical judgment required.</p>
        <p className="text-[10px] font-bold uppercase tracking-widest mt-2">© 2026 - IWP I Adjustr.io</p>
      </footer>
    </div>
  );
}