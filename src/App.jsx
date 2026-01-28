import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Search, AlertTriangle, Info, Syringe, 
  Activity, ChevronRight, RefreshCw, ChevronDown, List, X
} from 'lucide-react';

/**
 * ==========================================
 * MASTER DATA REPOSITORY (TOTAL 24 DRUGS)
 * ==========================================
 */
const DRUG_DATABASE = {
  // --- PENICILLINS & BLI ---
  "ampicillin": {
    name: "Ampicillin (IV)",
    class: "Penicillin",
    note: "ARC (CrCl > 130) berisiko therapeutic failure; pertimbangkan q4h atau Continuous Infusion pada infeksi berat (Meningitis/PJI).",
    isMultiStrategy: true,
    strategies: {
      "Mild / Uncomplicated": {
        standard_dose: "1 - 2 g IV q6h",
        adjustments: [
          { max: 500, min: 131, recommendation: "Consider 2 g IV q4h (ARC)" },
          { max: 130, min: 50.1, recommendation: "1 - 2 g IV q6h" },
          { max: 50, min: 30, recommendation: "1 - 2 g IV q8h" },
          { max: 29.9, min: 15, recommendation: "1 - 2 g IV q12h" },
          { max: 14.9, min: 0, recommendation: "1 - 2 g IV q24h" }
        ],
        rrt: { ihd: "1 - 2 g post-HD", crrt: "2 g q8-12h", sled: "2 g q12h" }
      },
      "Severe (Meningitis/PJI)": {
        standard_dose: "2 g IV q4h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "2 g IV q4h" },
          { max: 50, min: 30, recommendation: "2 g IV q6h" },
          { max: 29.9, min: 15, recommendation: "2 g IV q8h" },
          { max: 14.9, min: 0, recommendation: "2 g IV q12h" }
        ]
      }
    }
  },
  "ampicillin-sulbactam": {
    name: "Ampicillin-Sulbactam (IV)",
    class: "Penicillin / BLI",
    note: "Rasio 2:1 (e.g. 3g = 2g Ampi / 1g Sulb). Untuk Acinetobacter (ABA), target Sulbactam 6-9g per hari sangat krusial.",
    isMultiStrategy: true,
    strategies: {
      "Mild Infection": {
        standard_dose: "1.5 g IV q6h",
        adjustments: [
          { max: 500, min: 30.1, recommendation: "1.5 g IV q6h" },
          { max: 30, min: 15, recommendation: "1.5 g IV q12h" },
          { max: 14.9, min: 0, recommendation: "1.5 g IV q24h" }
        ]
      },
      "Systemic / Severe": {
        standard_dose: "3 g IV q6h",
        adjustments: [
          { max: 500, min: 30.1, recommendation: "3 g IV q6h" },
          { max: 30, min: 15, recommendation: "3 g IV q12h" },
          { max: 14.9, min: 0, recommendation: "1.5 - 3 g IV q24h" }
        ],
        rrt: { ihd: "1.5-3g q24h post-HD", crrt: "3g q12h", sled: "3g q24h" }
      },
      "Acinetobacter (ABA)": {
        standard_dose: "3 g IV q4h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "3 g IV q4h" },
          { max: 50, min: 30.1, recommendation: "3 g IV q6h" },
          { max: 30, min: 15, recommendation: "3 g IV q8h" },
          { max: 14.9, min: 0, recommendation: "3 g IV q12h" }
        ],
        rrt: { ihd: "3 g q12h post-HD", crrt: "3 g q6h", sled: "3 g q12h" }
      }
    }
  },
  "piperacillin-tazobactam": {
    name: "Piperacillin-Tazobactam (IV)",
    class: "Penicillin / BLI",
    note: "Extended infusion (EI) 4-jam disarankan. High clearance (>120): pertimbangkan EI q6h. Synergistic nephrotoxicity dengan Vancomycin.",
    isMultiStrategy: true,
    strategies: {
      "Extended Infusion (4-hr EI)": {
        standard_dose: "3.375 - 4.5 g q8h (4h EI)",
        adjustments: [
          { max: 500, min: 20.1, recommendation: "3.375 - 4.5 g IV q8h (4h EI). [SDD: 4.5g]" },
          { max: 20, min: 0, recommendation: "3.375 g IV q12h (4h EI)" }
        ],
        rrt: { ihd: "2.25g q12h post-HD", crrt: "4.5g q8h (EI)", sled: "3.375g q12h (EI)" }
      },
      "Intermittent (30-min) - Severe": {
        standard_dose: "4.5 g IV q6h",
        adjustments: [
          { max: 500, min: 40.1, recommendation: "4.5 g IV q6h" },
          { max: 40, min: 20, recommendation: "3.375 g IV q6h" },
          { max: 19.9, min: 0, recommendation: "2.25 g IV q6h" }
        ]
      }
    }
  },

  // --- CARBAPENEMS ---
  "meropenem": {
    name: "Meropenem (IV)",
    class: "Carbapenem",
    note: "Administered over a 3-hr extended infusion. CrCl >= 130: consider 2g q8h EI. Interaksi fatal dengan Valproat.",
    isMultiStrategy: true,
    strategies: {
      "Usual (FN, PNA, PsA)": {
        standard_dose: "1 g IV q8h (3h EI)",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "1 g IV q8h (3h EI)" },
          { max: 50, min: 26, recommendation: "1 g IV q12h (3h EI)" },
          { max: 25.9, min: 10, recommendation: "500 mg IV q12h (3h EI)" },
          { max: 9.9, min: 0, recommendation: "500 mg IV q24h (3h EI)" }
        ],
        rrt: { ihd: "500 mg q24h post-HD", crrt: "1 g q8h (3h EI)", sled: "1 g q12h (3h EI)" }
      },
      "CNS / CF / Meningitis": {
        standard_dose: "2 g IV q8h (3h EI)",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "2 g IV q8h (3h EI)" },
          { max: 50, min: 26, recommendation: "2 g IV q12h (3h EI)" },
          { max: 25.9, min: 10, recommendation: "1 g IV q12h (3h EI)" },
          { max: 9.9, min: 0, recommendation: "1 g IV q24h (3h EI)" }
        ],
        rrt: { ihd: "1 g q24h post-HD", crrt: "2 g q12h (3h EI)", sled: "1 g q12h (3h EI)" }
      }
    }
  },

  // --- CEPHALOSPORINS ---
  "ceftazidime": {
    name: "Ceftazidime (IV)",
    class: "Cephalosporin (3rd Gen)",
    note: "Anti-pseudomonal. Grids mendalam pada ESRD (sampai CrCl < 5) utk mitigasi neurotoksisitas.",
    isMultiStrategy: true,
    strategies: {
      "Usual Regimen": {
        standard_dose: "1 - 2 g IV q8h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "1 - 2 g IV q8h" },
          { max: 50, min: 30.1, recommendation: "1 - 2 g IV q12h" },
          { max: 30, min: 16, recommendation: "1 - 2 g IV q24h" },
          { max: 15.9, min: 6, recommendation: "0.5 - 1 g IV q24h" },
          { max: 5.9, min: 0, recommendation: "0.5 g IV q24h" }
        ],
        rrt: { ihd: "0.5-1g post-HD", crrt: "2g load, 1g q8h", sled: "1g post-SLED" }
      },
      "Severe Regimen": {
        standard_dose: "2 g IV q8h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "2 g IV q8h" },
          { max: 50, min: 30.1, recommendation: "1 - 2 g IV q12h" },
          { max: 30, min: 16, recommendation: "2 g IV q24h" },
          { max: 15.9, min: 6, recommendation: "0.5 - 1 g IV q24h" },
          { max: 5.9, min: 0, recommendation: "0.5 g IV q24h" }
        ]
      }
    }
  },
  "cefepime": {
    name: "Cefepime (IV)",
    class: "Cephalosporin (4th Gen)",
    note: "EI (4h) mandatory. Target CrCl grid: >60, 30-60, 11-29, <10.",
    isMultiStrategy: true,
    strategies: {
      "General Infection": {
        standard_dose: "1 g q8h or 2 g q12h (4h EI)",
        adjustments: [
          { max: 500, min: 61, recommendation: "1 g q8h or 2 g q12h (4h EI)" },
          { max: 60, min: 30, recommendation: "1 g q12h or 2 g q24h (4h EI)" },
          { max: 29.9, min: 11, recommendation: "1 g q24h (4h EI)" },
          { max: 10.9, min: 0, recommendation: "500 mg q24h (4h EI)" }
        ]
      },
      "Severe / PsA / CNS": {
        standard_dose: "2 g q8h (4h EI)",
        adjustments: [
          { max: 500, min: 61, recommendation: "2 g q8h (4h EI)" },
          { max: 60, min: 30, recommendation: "2 g q12h (4h EI)" },
          { max: 29.9, min: 11, recommendation: "1 g q12h (4h EI)" },
          { max: 10.9, min: 0, recommendation: "1 g q24h (4h EI)" }
        ]
      }
    }
  },
  "cefoperazone-sulbactam": {
    name: "Cefoperazone-Sulbactam (IV)",
    class: "Cephalosporin (3rd Gen) / BLI",
    note: "MIMS Logic: CrCl < 15 max Sulbactam 1g/hari. CrCl 15-30 max Sulbactam 2g/hari. Wajib POST-HD.",
    isMultiStrategy: true,
    strategies: {
      "Severe / Refractory (Ratio 1:1)": {
        standard_dose: "Up to 8 g (4g/4g) daily",
        adjustments: [
          { max: 500, min: 30.1, recommendation: "4 g (2g/2g) IV q12h (Max Sulb 4g/day)" },
          { max: 30, min: 15, recommendation: "Max 1 g Sulbactam q12h -> 2 g (1g/1g) IV q12h" },
          { max: 14.99, min: 0, recommendation: "Max 0.5 g Sulbactam q12h -> 1 g (0.5g/0.5g) IV q12h" }
        ]
      }
    }
  },

  // --- ANTIVIRALS ---
  "acyclovir-iv": {
    name: "Acyclovir (IV)",
    class: "Antiviral",
    note: "RISIKO NEFROTOKSIK TINGGI. Wajib hidrasi agresif. Gunakan BSA (mg/m2) untuk BMT.",
    isMultiStrategy: true,
    strategies: {
      "Treatment: Severe (CNS/VZV)": {
        standard_dose: "10 mg/kg q8h",
        adjustments: [
          { max: 500, min: 51, recommendation: "10 mg/kg q8h" },
          { max: 50, min: 25, recommendation: "10 mg/kg q12h" },
          { max: 24.9, min: 10, recommendation: "10 mg/kg q24h" },
          { max: 9.9, min: 0, recommendation: "5 mg/kg q24h" }
        ],
        rrt: { ihd: "5 mg/kg post-HD", crrt: "10 mg/kg q12h", sled: "5 mg/kg" }
      },
      "Treatment: General (HSV)": {
        standard_dose: "5 mg/kg q8h",
        adjustments: [
          { max: 500, min: 51, recommendation: "5 mg/kg q8h" },
          { max: 50, min: 25, recommendation: "5 mg/kg q12h" },
          { max: 24.9, min: 10, recommendation: "5 mg/kg q24h" },
          { max: 9.9, min: 0, recommendation: "2.5 mg/kg q24h" }
        ]
      },
      "Prophylaxis: BMT (BSA)": {
        standard_dose: "250 mg/m2 q12h",
        adjustments: [
          { max: 500, min: 51, recommendation: "250 mg/m2 q12h" },
          { max: 50, min: 25, recommendation: "125 mg/m2 q12h" },
          { max: 24.9, min: 10, recommendation: "125 mg/m2 q24h" },
          { max: 9.9, min: 0, recommendation: "62.5 mg/m2 q24h" }
        ]
      },
      "Prophylaxis: Hem-Onc": {
        standard_dose: "2 mg/kg q12h",
        adjustments: [
          { max: 500, min: 25, recommendation: "2 mg/kg q12h" },
          { max: 24.9, min: 10, recommendation: "2 mg/kg q24h" },
          { max: 9.9, min: 0, recommendation: "1 mg/kg q24h" }
        ]
      }
    }
  },
  "acyclovir-po": {
    name: "Acyclovir (PO/IO)",
    class: "Antiviral",
    note: "Bioavailabilitas oral rendah (15-30%). Maintain hidrasi.",
    isMultiStrategy: true,
    strategies: {
      "Treatment: Zoster (800mg)": {
        standard_dose: "800 mg 5x daily (q4h)",
        adjustments: [
          { max: 500, min: 25.1, recommendation: "800 mg 5x daily" },
          { max: 25, min: 10.1, recommendation: "800 mg q8h" },
          { max: 10, min: 0, recommendation: "800 mg q12h" }
        ]
      },
      "Treatment: HSV (400mg)": {
        standard_dose: "400 mg q8h (or 200mg 5x daily)",
        adjustments: [
          { max: 500, min: 25.1, recommendation: "400 mg q8h" },
          { max: 25, min: 10.1, recommendation: "200 mg q8h" },
          { max: 10, min: 0, recommendation: "200 mg q12h" }
        ]
      }
    }
  },
  "valacyclovir": {
    name: "Valacyclovir (PO)",
    class: "Antiviral",
    note: "Prodrug Acyclovir. Bioavailabilitas sngt baik. Post-HD: berikan dosis daily.",
    isMultiStrategy: true,
    strategies: {
      "VZV (Zoster)": {
        standard_dose: "1 g q8h",
        adjustments: [
          { max: 50, min: 30.1, recommendation: "1 g PO q12h" },
          { max: 30, min: 10, recommendation: "1 g PO q24h" },
          { max: 9.9, min: 0, recommendation: "500 mg PO q24h" }
        ],
        rrt: { ihd: "500 mg post-HD" }
      },
      "Genital Herpes": {
        standard_dose: "1 g q12h",
        adjustments: [
          { max: 30, min: 10, recommendation: "1 g q24h" },
          { max: 9.9, min: 0, recommendation: "500 mg q24h" }
        ]
      }
    }
  },
  "valganciclovir": {
    name: "Valganciclovir (PO)",
    class: "Antiviral",
    note: "Risiko Myelosupresi tinggi. Monitor CBC.",
    isMultiStrategy: true,
    strategies: {
      "Induction (14-21d)": {
        standard_dose: "900 mg q12h",
        adjustments: [
          { max: 59.9, min: 40, recommendation: "450 mg q12h" },
          { max: 39.9, min: 25, recommendation: "450 mg q24h" },
          { max: 24.9, min: 10, recommendation: "450 mg q48h" },
          { max: 9.9, min: 0, recommendation: "200 mg 3x/week post-HD" }
        ]
      },
      "Maintenance": {
        standard_dose: "900 mg q24h",
        adjustments: [
          { max: 59.9, min: 40, recommendation: "450 mg q24h" },
          { max: 39.9, min: 25, recommendation: "450 mg q48h" },
          { max: 24.9, min: 10, recommendation: "450 mg twice/week" }
        ]
      }
    }
  },

  // --- ANTIFUNGALS ---
  "fluconazole": {
    name: "Fluconazole (IV/PO)",
    class: "Antifungal",
    note: "Maintenance dose turun 50% jika CrCl < 50. Post-HD berikan 100% dosis.",
    isMultiStrategy: true,
    strategies: {
      "Oropharyngeal / Peritonitis": {
        standard_dose: "Load 200mg, then 100-200mg daily",
        adjustments: [
          { max: 50, min: 30, recommendation: "Load 200mg, then 100mg q24h" },
          { max: 29.9, min: 0, recommendation: "Load 200mg, then 200mg q48h" }
        ],
        rrt: { ihd: "Dose q48h post-HD", crrt: "Load 400mg, then 100-200mg daily" }
      },
      "Severe (Candidemia/CNS)": {
        standard_dose: "Load 800mg, then 400-800mg daily",
        adjustments: [
          { max: 50, min: 30, recommendation: "Load 800mg, then 200-400mg q24h" },
          { max: 29.9, min: 0, recommendation: "Load 800mg, then 400-800mg post-HD" }
        ]
      },
      "C. glabrata (SDD)": {
        standard_dose: "800 mg daily",
        adjustments: [
          { max: 50, min: 30, recommendation: "Load 800mg, then 400mg daily" },
          { max: 29.9, min: 0, recommendation: "Load 800mg, then 800mg post-HD" }
        ]
      },
      "Esophageal / Osteo": {
        standard_dose: "400 mg daily",
        adjustments: [
          { max: 50, min: 30, recommendation: "Load 400mg, 200mg daily" }
        ]
      }
    }
  },
  "voriconazole": {
    name: "Voriconazole (IV/PO)",
    class: "Antifungal",
    note: "IV solvent (Cyclodextrin) toxic pada CrCl < 50; switch ke PO (1:1 conversion).",
    isMultiStrategy: true,
    strategies: {
      "Intravenous": {
        standard_dose: "6 mg/kg q12h x2, then 4 mg/kg q12h",
        adjustments: [{ max: 50, min: 0, recommendation: "Switch to PO if CrCl < 50." }]
      },
      "Oral (PO)": {
        standard_dose: "400 mg q12h x2, then 200 mg q12h",
        adjustments: [{ max: 500, min: 0, recommendation: "No renal adjustment." }]
      }
    }
  },
  "caspofungin": {
    name: "Caspofungin (IV)",
    class: "Antifungal",
    note: "Aman ginjal. Child-Pugh B/C no adj. Endocarditis target 150mg daily.",
    standard_dose: "70mg load, then 50mg daily",
    adjustments: [{ max: 500, min: 0, recommendation: "No renal adjustment required." }]
  },
  "amphotericin-b": {
    name: "Amphotericin B (IV)",
    class: "Antifungal",
    note: "Nefrotoksik arterial. Salt loading NS 10-15 ml/kg pre-infusion wajib.",
    standard_dose: "3 - 5 mg/kg daily (Liposomal)",
    adjustments: [{ max: 500, min: 0, recommendation: "Monitor SCr closely." }]
  },

  // --- OTHERS ---
  "metronidazole": {
    name: "Metronidazole (IV/PO)",
    class: "Nitroimidazole",
    note: "Risiko akumulasi metabolit pada CrCl < 30. Monitor neuropati.",
    isMultiStrategy: true,
    strategies: {
      "CNS / C.diff / Sepsis": {
        standard_dose: "500 mg q8h",
        adjustments: [{ max: 29.9, min: 0, recommendation: "500 mg q8h (Monitor accumulation)" }]
      },
      "Intra-abdominal": {
        standard_dose: "500 mg q8-12h",
        adjustments: [{ max: 500, min: 0, recommendation: "500 mg q8-12h" }]
      },
      "Hepatic Impairment": {
        standard_dose: "500 mg q12h",
        adjustments: [{ max: 500, min: 0, recommendation: "500 mg q12h" }]
      }
    }
  },
  "vancomycin": {
    name: "Vancomycin (IV)",
    class: "Glycopeptide",
    note: "Target AUC/MIC 400-600. TDM mandatory. Load 25-30mg/kg.",
    standard_dose: "15 - 20 mg/kg q12h",
    adjustments: [{ max: 30, min: 0, recommendation: "Load, then by level (Pre-HD)." }],
    rrt: { ihd: "By Level pre-HD", crrt: "10-15mg/kg q12-24h" }
  },
  "gentamicin": {
    name: "Gentamicin (IV)",
    class: "Aminoglycoside",
    note: "Once Daily dosing disarankan (Extended Interval). Trough target < 1.",
    standard_dose: "5 - 7 mg/kg daily",
    adjustments: [{ max: 60, min: 0, recommendation: "Dosing based on TDM levels." }]
  },
  "levofloxacin": {
    name: "Levofloxacin (IV/PO)",
    class: "Fluoroquinolone",
    note: "Bioavailabilitas PO sngt tinggi. Risiko tendinitis.",
    standard_dose: "750 mg daily",
    adjustments: [{ max: 50, min: 20, recommendation: "750mg Load, then 750mg q48h" }, { max: 19.9, min: 0, recommendation: "750mg Load, then 500mg q48h" }]
  },
  "ciprofloxacin": {
    name: "Ciprofloxacin (IV/PO)",
    class: "Fluoroquinolone",
    note: "Potent CYP1A2 inhibitor. Avoid antacids.",
    standard_dose: "400 mg q8-12h",
    adjustments: [{ max: 30, min: 0, recommendation: "400 mg q24h" }]
  },
  "cotrimoxazole": {
    name: "Cotrimoxazole (IV/PO)",
    class: "Sulfonamide",
    note: "Risiko hiperkalemia berat. PJP dose target 15-20mg/kg TMP.",
    standard_dose: "15 - 20 mg/kg TMP daily",
    adjustments: [{ max: 30, min: 15, recommendation: "Reduce dose by 50%" }]
  },
  "oseltamivir": {
    name: "Oseltamivir (PO)",
    class: "Antiviral",
    standard_dose: "75 mg BID",
    adjustments: [{ max: 60, min: 31, recommendation: "30 mg BID" }, { max: 30, min: 11, recommendation: "30 mg daily" }]
  },
  "ganciclovir": {
    name: "Ganciclovir (IV)",
    class: "Antiviral",
    note: "Hematotoksik. Gunakan IBW pada obesitas.",
    standard_dose: "5 mg/kg q12h (Induction)",
    adjustments: [{ max: 69, min: 50, recommendation: "2.5 mg/kg q12h" }, { max: 49, min: 25, recommendation: "2.5 mg/kg q24h" }, { max: 24.9, min: 10, recommendation: "1.25 mg/kg q24h" }]
  },
  "linezolid": {
    name: "Linezolid (IV/PO)",
    class: "Oxazolidinone",
    note: "No renal adj. Monitor trombositopenia (setelah > 10 hari).",
    standard_dose: "600 mg BID",
    adjustments: [{ max: 500, min: 0, recommendation: "No renal adjustment required." }]
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

const calculateBSA = (height, weight) => {
  if (!height || !weight) return 0;
  return Math.sqrt((height * weight) / 3600);
};

const calculateCrCl = (age, weight, creatinine, gender, height) => {
  if (!age || !weight || !creatinine || !height || creatinine <= 0) return null;
  const ibw = calculateIBW(height, gender);
  let dosingWeight = weight < ibw ? weight : (weight > ibw * 1.3 ? ibw + 0.4 * (weight - ibw) : ibw);
  let weightType = weight < ibw ? "Actual" : (weight > ibw * 1.3 ? "Adjusted" : "IBW");
  const constant = gender === 'male' ? 1 : 0.85;
  const bsa = calculateBSA(height, weight);
  const result = ((140 - age) * dosingWeight) / (72 * creatinine) * constant;
  return { value: result, usedWeight: dosingWeight, weightType, bsa };
};

/**
 * ==========================================
 * MAIN UI COMPONENT
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

  const drugEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return Object.keys(DRUG_DATABASE).filter(key => 
      DRUG_DATABASE[key].name.toLowerCase().includes(term) ||
      DRUG_DATABASE[key].class.toLowerCase().includes(term)
    ).sort();
  }, [searchTerm]);

  const selectedDrug = selectedDrugId ? DRUG_DATABASE[selectedDrugId] : null;

  useEffect(() => {
    if (selectedDrug?.isMultiStrategy) {
      const keys = Object.keys(selectedDrug.strategies);
      if (keys.length > 0) setSelectedStrategy(keys[0]);
    } else {
      setSelectedStrategy(null);
    }
  }, [selectedDrugId]);

  const currentRRT = useMemo(() => {
    if (!selectedDrug) return null;
    if (selectedDrug.isMultiStrategy && selectedStrategy && selectedDrug.strategies[selectedStrategy]) {
      return selectedDrug.strategies[selectedStrategy].rrt || selectedDrug.rrt;
    }
    return selectedDrug.rrt;
  }, [selectedDrug, selectedStrategy]);

  const getRec = (drug, crclVal, strategyKey) => {
    if (!drug) return "";
    if (!crclVal && crclVal !== 0) return "Lengkapi data pasien...";
    
    if (drug.isMultiStrategy) {
      if (!strategyKey || !drug.strategies?.[strategyKey]) return "Syncing Strategy...";
      const strat = drug.strategies[strategyKey];
      if (!strat.adjustments) return strat.standard_dose;
      const adj = strat.adjustments.find(a => crclVal <= a.max && crclVal >= a.min);
      return adj ? adj.recommendation : (strat.standard_dose || "Standard Dose");
    }

    if (!drug.adjustments) return drug.standard_dose;
    const adj = drug.adjustments.find(a => crclVal <= a.max && crclVal >= a.min);
    return adj ? adj.recommendation : (drug.standard_dose || "Standard Dose");
  };

  const getStatusColor = (val) => {
    if (!val && val !== 0) return 'bg-slate-100 text-slate-400';
    if (val < 30) return 'bg-red-600 text-white shadow-red-200';
    if (val < 60) return 'bg-amber-500 text-white shadow-amber-200';
    return 'bg-green-600 text-white shadow-green-200';
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
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Dosing Intelligence Engine</p>
            </div>
          </div>
          <button onClick={() => setPatient({ age: '', gender: 'male', weight: '', height: '', creatinine: '' })} className="text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 transition-colors flex items-center gap-1 text-white hover:bg-slate-700 transition-all">
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
                  <button key={g} onClick={() => setPatient(p => ({...p, gender: g}))} className={`py-2 rounded-xl text-xs font-bold transition-all ${patient.gender === g ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}>{g}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Usia (tahun)</label>
              <input type="number" value={patient.age} onChange={e => setPatient(p => ({...p, age: e.target.value}))} className="w-full bg-slate-50 border ring-1 ring-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Tahun" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">BB (kg)</label>
              <input type="number" value={patient.weight} onChange={e => setPatient(p => ({...p, weight: e.target.value}))} className="w-full bg-slate-50 border ring-1 ring-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">TB (cm)</label>
              <input type="number" value={patient.height} onChange={e => setPatient(p => ({...p, height: e.target.value}))} className="w-full bg-slate-50 border ring-1 ring-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Serum Kreatinin (mg/dL)</label>
              <input type="number" step="0.01" value={patient.creatinine} onChange={e => setPatient(p => ({...p, creatinine: e.target.value}))} className="w-full bg-slate-100 border ring-1 ring-blue-200 rounded-xl p-3 text-xl font-black text-blue-700 outline-none shadow-inner focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>

          <div className={`p-6 transition-all duration-700 shadow-inner ${getStatusColor(calculation?.value)}`}>
            {calculation ? (
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Est. CrCl (Cockcroft-Gault)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter">{calculation.value.toFixed(1)}</span>
                    <span className="text-sm font-bold">mL/min</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div>
                    <p className="text-[9px] font-bold uppercase opacity-70">BSA (Mosteller)</p>
                    <p className="text-sm font-black leading-none">{calculation.bsa.toFixed(2)} m2</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase opacity-70">Dosing Mass</p>
                    <p className="text-sm font-black leading-none">{calculation.usedWeight.toFixed(1)} kg ({calculation.weightType})</p>
                  </div>
                </div>
              </div>
            ) : <div className="flex items-center justify-center gap-2 py-4 font-bold text-sm text-slate-400"><Info className="h-4 w-4" /> Masukkan parameter pasien...</div>}
          </div>
        </section>

        {/* SEARCH & INVENTORY */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input type="text" placeholder="Cari Obat..." value={searchTerm} onChange={e => {setSearchTerm(e.target.value); setSelectedDrugId(null);}} className="w-full pl-12 pr-4 py-4 rounded-3xl border ring-1 ring-slate-200 outline-none font-medium shadow-sm focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
            <button onClick={() => setShowInventory(true)} className="px-6 py-4 bg-white border border-slate-200 rounded-3xl shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-bold text-slate-700 whitespace-nowrap">
              <List className="h-5 w-5 text-blue-600" /> Database
            </button>
          </div>

          {!selectedDrugId && searchTerm && (
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-50 max-h-80 overflow-y-auto z-40">
              {drugEntries.length > 0 ? drugEntries.map(id => (
                <button key={id} onClick={() => {setSelectedDrugId(id); setSearchTerm('');}} className="w-full text-left p-4 hover:bg-blue-50 flex items-center justify-between group transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-800">{DRUG_DATABASE[id].name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{DRUG_DATABASE[id].class}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-blue-500" />
                </button>
              )) : <div className="p-8 text-center text-slate-400 italic">No drugs found.</div>}
            </div>
          )}

          {selectedDrug && (
            <div className="bg-white rounded-3xl shadow-2xl border-t-8 border-blue-600 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedDrug.name}</h2>
                    <button onClick={() => setSelectedDrugId(null)} className="p-1 hover:bg-slate-200 rounded transition-colors"><RefreshCw className="h-3 w-3 text-slate-400" /></button>
                  </div>
                  <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded-md uppercase tracking-wider">{selectedDrug.class}</span>
                </div>
                <Syringe className="h-8 w-8 text-blue-100" />
              </div>

              <div className="p-6 space-y-6">
                {selectedDrug.isMultiStrategy && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regimen Strategy</label>
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
                    <span className="text-[10px] font-black uppercase tracking-widest">Renal Adjusted Maintenance Dose</span>
                  </div>
                  <div className="text-3xl font-black leading-tight">
                    {getRec(selectedDrug, calculation?.value, selectedStrategy)}
                  </div>
                </div>

                {currentRRT && (
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(currentRRT).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{key}</p>
                        <p className="text-[11px] font-bold text-slate-700 leading-tight">{val}</p>
                      </div>
                    ))}
                  </div>
                )}

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

      {showInventory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Drug Inventory ({Object.keys(DRUG_DATABASE).length})</h3>
              <button onClick={() => setShowInventory(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="h-6 w-6 text-slate-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
              {Object.keys(DRUG_DATABASE).sort().map(id => (
                <button key={id} onClick={() => { setSelectedDrugId(id); setShowInventory(false); setSearchTerm(''); }} className="w-full text-left p-3 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-between group">
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

      <footer className="max-w-2xl mx-auto px-6 text-center mt-12 space-y-2 opacity-60 pb-8">
        <p className="text-[10px] leading-relaxed">Based on Stanford Dosing Guide & MIMS (Cefoperazone + Sulbactam).</p>
        <p className="text-[10px] leading-relaxed">This tool is for educational purposes. Clinical judgment required.</p>
        <p className="text-[10px] font-bold uppercase tracking-widest mt-2">© 2026 - IWP I Adjustr.io</p>
      </footer>
    </div>
  );
}
