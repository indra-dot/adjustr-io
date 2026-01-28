import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, Search, AlertTriangle, Info, Syringe, 
  Activity, RefreshCw, ChevronDown, List, X, ShieldCheck, Pill, Beaker, ChevronRight
} from 'lucide-react';

/**
 * ==========================================
 * MASTER DATA REPOSITORY (ULTIMATE WARD EDITION)
 * ==========================================
 */
const DRUG_DATABASE = {
  // ==========================================
  // I. PENICILLINS
  // ==========================================
  "ampicillin": {
    name: "Ampicillin (IV)",
    class: "Penicillin",
    note: "High sodium load. Meningitis requires aggressive dosing.",
    isMultiStrategy: true,
    strategies: {
      "Mild / Uncomplicated": {
        standard_dose: "1 - 2 g IV q6h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "1 - 2 g IV q6h" },
          { max: 50, min: 10, recommendation: "1 - 2 g IV q6-12h" },
          { max: 9.9, min: 0, recommendation: "1 - 2 g IV q12-24h" }
        ],
        rrt: { ihd: "1 - 2 g post-HD", crrt: "2 g q12h" }
      },
      "Meningitis / Endovascular": {
        standard_dose: "2 g IV q4h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "2 g IV q4h" },
          { max: 50, min: 10, recommendation: "2 g IV q6h" },
          { max: 9.9, min: 0, recommendation: "2 g IV q12h" }
        ],
        rrt: { ihd: "2 g q12h post-HD", crrt: "2 g q6-8h" }
      }
    }
  },
  "ampicillin-sulbactam": {
    name: "Ampicillin-Sulbactam (IV)",
    class: "Penicillin / BLI",
    note: "Dosing based on Ampicillin component (2:1 ratio).",
    isMultiStrategy: true,
    strategies: {
      "Mild Infection": {
        standard_dose: "1.5 g IV q6h",
        adjustments: [
          { max: 500, min: 30, recommendation: "1.5 g IV q6h" },
          { max: 29.9, min: 15, recommendation: "1.5 g IV q12h" },
          { max: 14.9, min: 5, recommendation: "1.5 g IV q24h" }
        ]
      },
      "Systemic / Severe": {
        standard_dose: "3 g IV q6h",
        adjustments: [
          { max: 500, min: 30, recommendation: "3 g IV q6h" },
          { max: 29.9, min: 15, recommendation: "3 g IV q12h" },
          { max: 14.9, min: 5, recommendation: "1.5 - 3 g IV q24h" }
        ],
        rrt: { ihd: "3 g q24h post-HD", crrt: "3 g q8h" }
      },
      "Acinetobacter baumanii (High Dose)": {
        standard_dose: "3 g IV q4h",
        adjustments: [
          { max: 500, min: 30, recommendation: "3 g IV q4h (Target Sulbactam 9g/day)" },
          { max: 29.9, min: 15, recommendation: "3 g IV q8h" },
          { max: 14.9, min: 0, recommendation: "3 g IV q12h" }
        ],
        rrt: { ihd: "3 g q12h post-HD", crrt: "3 g q6h" }
      }
    }
  },
  "penicillin-g": {
    name: "Penicillin G (IV)",
    class: "Penicillin",
    note: "Neurotoxicity risk (seizures) in renal failure.",
    isMultiStrategy: true,
    strategies: {
      "Neurosyphilis / Meningitis": {
        standard_dose: "4 million units IV q4h",
        adjustments: [
          { max: 500, min: 50, recommendation: "4 MU q4h" },
          { max: 49.9, min: 10, recommendation: "4 MU q6-8h" },
          { max: 9.9, min: 0, recommendation: "4 MU q12-18h" }
        ]
      },
      "Endocarditis": {
        standard_dose: "2 - 3 million units IV q4h",
        adjustments: [
          { max: 500, min: 50, recommendation: "2-3 MU q4h" },
          { max: 49.9, min: 10, recommendation: "2-3 MU q6-8h" },
          { max: 9.9, min: 0, recommendation: "2-3 MU q12h" }
        ]
      }
    }
  },
  "piperacillin-tazobactam": {
    name: "Piperacillin-Tazobactam (IV)",
    class: "Penicillin / BLI",
    note: "Extended Infusion (4h) PREFERRED for severe/Pseudomonal infections.",
    isMultiStrategy: true,
    strategies: {
      "Extended Infusion (General/CF/PsA/HAP)": {
        standard_dose: "4.5 g IV q8h (4h EI)",
        adjustments: [
          { max: 500, min: 20.1, recommendation: "4.5 g IV q8h (over 4h)" },
          { max: 20, min: 0, recommendation: "3.375 g IV q12h (over 4h)" }
        ],
        rrt: { ihd: "3.375 g q12h (EI)", crrt: "4.5 g q8h (EI)" }
      },
      "Intermittent 30-min (General)": {
        standard_dose: "3.375 g IV q6h",
        adjustments: [
          { max: 500, min: 40.1, recommendation: "3.375 g IV q6h" },
          { max: 40, min: 20, recommendation: "2.25 g IV q6h" },
          { max: 19.9, min: 0, recommendation: "2.25 g IV q8h" }
        ]
      },
      "Intermittent 30-min (Severe/Sepsis)": {
        standard_dose: "4.5 g IV q6h",
        adjustments: [
          { max: 500, min: 40.1, recommendation: "4.5 g IV q6h" },
          { max: 40, min: 20, recommendation: "3.375 g IV q6h" },
          { max: 19.9, min: 0, recommendation: "2.25 g IV q6h" }
        ],
        rrt: { ihd: "2.25 g q12h post-HD" }
      }
    }
  },

  // ==========================================
  // II. CEPHALOSPORINS
  // ==========================================
  "cefazolin": {
    name: "Cefazolin (IV)",
    class: "Cephalosporin (1st Gen)",
    note: "Drug of choice for MSSA.",
    isMultiStrategy: true,
    strategies: {
      "Mild - Moderate": {
        standard_dose: "1 g q8h",
        adjustments: [
          { max: 500, min: 35, recommendation: "1 g q8h" },
          { max: 34.9, min: 11, recommendation: "1 g q12h" },
          { max: 10.9, min: 0, recommendation: "1 g q24h" }
        ]
      },
      "Severe (Endocarditis/Bacteremia)": {
        standard_dose: "2 g q8h",
        adjustments: [
          { max: 500, min: 35, recommendation: "2 g q8h" },
          { max: 34.9, min: 11, recommendation: "2 g q12h" },
          { max: 10.9, min: 0, recommendation: "1 - 2 g q24h" }
        ],
        rrt: { ihd: "2 g post-HD", crrt: "2 g q12h" }
      }
    }
  },
  "ceftriaxone": {
    name: "Ceftriaxone (IV)",
    class: "Cephalosporin (3rd Gen)",
    note: "NO RENAL ADJUSTMENT. Dual elimination. Meningitis dose is higher.",
    isMultiStrategy: true,
    strategies: {
      "Standard Dose": {
        standard_dose: "1 - 2 g q24h",
        adjustments: [{ max: 500, min: 0, recommendation: "No Adjustment (1-2 g q24h)" }]
      },
      "Meningitis": {
        standard_dose: "2 g q12h",
        adjustments: [{ max: 500, min: 0, recommendation: "2 g q12h (No Adjustment)" }]
      }
    }
  },
  "ceftazidime": {
    name: "Ceftazidime (IV)",
    class: "Cephalosporin (3rd Gen)",
    note: "Neurotoxicity risk in ESRD. Deep renal adjustment grid.",
    isMultiStrategy: true,
    strategies: {
      "Usual Dose": {
        standard_dose: "1 - 2 g IV q8h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "1 - 2 g IV q8h" },
          { max: 50, min: 30, recommendation: "1 - 2 g IV q12h" },
          { max: 29.9, min: 16, recommendation: "1 - 2 g IV q24h" },
          { max: 15.9, min: 6, recommendation: "0.5 - 1 g IV q24h" },
          { max: 5.9, min: 0, recommendation: "0.5 g IV q24h" }
        ],
        rrt: { 
          ihd: "Dose daily (0.5-1g) after HD on HD days. Alt: 1-2g q48-72h or 1g post-HD TIW", 
          crrt: "2 g load, then 1 g q8h (or 2g q12h)" 
        }
      },
      "Severe Dose": {
        standard_dose: "2 g IV q8h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "2 g IV q8h" },
          { max: 50, min: 30, recommendation: "1 - 2 g IV q12h" },
          { max: 29.9, min: 16, recommendation: "1 - 2 g IV q24h" },
          { max: 15.9, min: 6, recommendation: "0.5 - 1 g IV q24h" },
          { max: 5.9, min: 0, recommendation: "0.5 g IV q24h" }
        ],
        rrt: { 
          ihd: "Dose daily (0.5-1g) after HD on HD days", 
          crrt: "2 g load, then 1 g q8h" 
        }
      }
    }
  },
  "cefepime": {
    name: "Cefepime (IV)",
    class: "Cephalosporin (4th Gen)",
    note: "High neurotoxicity risk in CKD. 4h EI preferred for severe.",
    isMultiStrategy: true,
    strategies: {
      "General / UTI": {
        standard_dose: "1 g IV q12h",
        adjustments: [
          { max: 500, min: 60.1, recommendation: "1 g IV q12h" },
          { max: 60, min: 30, recommendation: "1 g IV q24h" },
          { max: 29.9, min: 11, recommendation: "500 mg IV q24h" },
          { max: 10.9, min: 0, recommendation: "250 mg IV q24h" }
        ]
      },
      "Severe / PsA / Febrile Neutropenia": {
        standard_dose: "2 g IV q8h (4h EI)",
        adjustments: [
          { max: 500, min: 60.1, recommendation: "2 g IV q8h (4h EI)" },
          { max: 60, min: 30, recommendation: "2 g IV q12h" },
          { max: 29.9, min: 11, recommendation: "2 g IV q24h" },
          { max: 10.9, min: 0, recommendation: "1 g IV q24h" }
        ],
        rrt: { ihd: "1 g post-HD", crrt: "2 g q12h" }
      }
    }
  },
  "cefoperazone-sulbactam": {
    name: "Cefoperazone-Sulbactam (IV)",
    class: "Cephalosporin (3rd Gen) / BLI",
    note: "MIMS Logic. CrCl < 15: Max Sulbactam 1g/day.",
    isMultiStrategy: true,
    strategies: {
      "Standard (1:1 Ratio)": {
        standard_dose: "2 - 4 g daily (Total)",
        adjustments: [
          { max: 500, min: 30.1, recommendation: "2-4 g daily in divided doses" },
          { max: 30, min: 15, recommendation: "Max 1 g Sulbactam q12h" },
          { max: 14.9, min: 0, recommendation: "Max 0.5 g Sulbactam q12h" }
        ],
        rrt: { ihd: "Dose Post-HD" }
      }
    }
  },

  // ==========================================
  // III. CARBAPENEMS
  // ==========================================
  "meropenem": {
    name: "Meropenem (IV)",
    class: "Carbapenem",
    note: "3-hr EI recommended.",
    isMultiStrategy: true,
    strategies: {
      "Usual (FN, PNA, Intra-abd)": {
        standard_dose: "1 g IV q8h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "1 g IV q8h" },
          { max: 50, min: 26, recommendation: "1 g IV q12h" },
          { max: 25.9, min: 10, recommendation: "500 mg IV q12h" },
          { max: 9.9, min: 0, recommendation: "500 mg IV q24h" }
        ]
      },
      "High Dose (Meningitis/CF/PsA)": {
        standard_dose: "2 g IV q8h",
        adjustments: [
          { max: 500, min: 50.1, recommendation: "2 g IV q8h" },
          { max: 50, min: 26, recommendation: "2 g IV q12h" },
          { max: 25.9, min: 10, recommendation: "1 g IV q12h" },
          { max: 9.9, min: 0, recommendation: "1 g IV q24h" }
        ]
      }
    }
  },
  "imipenem-cilastatin": {
    name: "Imipenem-Cilastatin (IV)",
    class: "Carbapenem",
    note: "Highest seizure risk. SHC Restriction.",
    isMultiStrategy: true,
    strategies: {
      "General Infection": {
        standard_dose: "500 mg q6h or 1 g q8h",
        adjustments: [
          { max: 500, min: 60, recommendation: "500 mg q6h or 1 g q8h" },
          { max: 59.9, min: 30, recommendation: "500 mg q8h" },
          { max: 29.9, min: 15, recommendation: "500 mg q12h" },
          { max: 14.9, min: 0, recommendation: "Not recommended unless dialysis w/in 48h" }
        ]
      },
      "NTM (High Dose)": {
        standard_dose: "1 g q12h",
        adjustments: [
          { max: 500, min: 60, recommendation: "1 g q12h" },
          { max: 59.9, min: 30, recommendation: "750 mg q12h" },
          { max: 29.9, min: 15, recommendation: "500 mg q12h" },
          { max: 14.9, min: 0, recommendation: "250-500 mg q12h" }
        ],
        rrt: { crrt: "1 g load, then 500 mg q6h" }
      }
    }
  },
  "ertapenem": {
    name: "Ertapenem (IV)",
    class: "Carbapenem",
    note: "Stable for outpatient. No coverage for Pseudomonas.",
    standard_dose: "1 g IV q24h",
    adjustments: [
      { max: 500, min: 30, recommendation: "1 g IV q24h" },
      { max: 29.9, min: 0, recommendation: "500 mg IV q24h" }
    ],
    rrt: { ihd: "500 mg post-HD", crrt: "1 g q24h" }
  },

  // ==========================================
  // IV. FLUOROQUINOLONES
  // ==========================================
  "levofloxacin": {
    name: "Levofloxacin (IV/PO)",
    class: "Fluoroquinolone",
    standard_dose: "750 mg q24h",
    adjustments: [
      { max: 500, min: 50, recommendation: "750 mg q24h" },
      { max: 49.9, min: 20, recommendation: "750 mg q48h" },
      { max: 19.9, min: 10, recommendation: "750 mg Load -> 500 mg q48h" },
      { max: 9.9, min: 0, recommendation: "750 mg Load -> 500 mg q48h" }
    ],
    rrt: { ihd: "Load 750, then 500 q48h post-HD", crrt: "750 mg q24-48h" }
  },
  "ciprofloxacin": {
    name: "Ciprofloxacin (IV/PO)",
    class: "Fluoroquinolone",
    standard_dose: "400 mg IV q8-12h",
    adjustments: [
      { max: 500, min: 50, recommendation: "400 mg IV q8-12h" },
      { max: 49.9, min: 30, recommendation: "400 mg IV q12h" },
      { max: 29.9, min: 0, recommendation: "400 mg IV q24h" }
    ]
  },
  "moxifloxacin": {
    name: "Moxifloxacin (IV/PO)",
    class: "Fluoroquinolone",
    note: "No Renal Adjustment. Not for UTI.",
    standard_dose: "400 mg q24h",
    adjustments: [
      { max: 500, min: 0, recommendation: "400 mg q24h (No Adjustment)" }
    ]
  },

  // ==========================================
  // V. AMINOGLYCOSIDES
  // ==========================================
  "gentamicin": {
    name: "Gentamicin (IV)",
    class: "Aminoglycoside",
    note: "Extended Interval (Once Daily) preferred. Monitor levels.",
    isMultiStrategy: true,
    strategies: {
      "Extended Interval (Preferred)": {
        standard_dose: "5 - 7 mg/kg q24h",
        dose_factor: 5, // Default multiplier
        adjustments: [
          { max: 500, min: 60, recommendation: "5-7 mg/kg q24h" },
          { max: 59.9, min: 40, recommendation: "5-7 mg/kg q36h" },
          { max: 39.9, min: 20, recommendation: "5-7 mg/kg q48h" },
          { max: 19.9, min: 0, recommendation: "Dose by levels only" }
        ]
      },
      "Traditional / Synergy": {
        standard_dose: "1.5 - 2 mg/kg q8h",
        dose_factor: 1.5,
        adjustments: [
          { max: 500, min: 60, recommendation: "1.5-2 mg/kg q8h" },
          { max: 59.9, min: 40, recommendation: "1.5-2 mg/kg q12h" },
          { max: 39.9, min: 20, recommendation: "1.5-2 mg/kg q24h" },
          { max: 19.9, min: 0, recommendation: "Load 2mg/kg then by levels" }
        ]
      }
    }
  },
  "amikacin": {
    name: "Amikacin (IV)",
    class: "Aminoglycoside",
    note: "Use IBW (or AdjBW if obese).",
    standard_dose: "15 mg/kg q24h",
    dose_factor: 15,
    adjustments: [
      { max: 500, min: 60, recommendation: "15 mg/kg q24h" },
      { max: 59.9, min: 40, recommendation: "7.5 mg/kg q24h or 15 mg/kg q36h" },
      { max: 39.9, min: 20, recommendation: "7.5 mg/kg q48h" },
      { max: 19.9, min: 0, recommendation: "Load 7.5 mg/kg then by levels" }
    ]
  },

  // ==========================================
  // VI. GLYCOPEPTIDES, LIPOPEPTIDES, OTHERS
  // ==========================================
  "vancomycin": {
    name: "Vancomycin (IV)",
    class: "Glycopeptide",
    note: "Use Actual Body Weight. TDM Mandatory.",
    standard_dose: "15 - 20 mg/kg q8-12h",
    dose_factor: 15,
    adjustments: [
      { max: 500, min: 90, recommendation: "15-20 mg/kg q8-12h" },
      { max: 89.9, min: 50, recommendation: "15-20 mg/kg q12h" },
      { max: 49.9, min: 15, recommendation: "15-20 mg/kg q24h" },
      { max: 14.9, min: 0, recommendation: "Load 20-25mg/kg, then by levels" }
    ],
    rrt: { ihd: "Load 20-25mg/kg, then by levels", crrt: "10-15 mg/kg q12-24h" }
  },
  "daptomycin": {
    name: "Daptomycin (IV)",
    class: "Lipopeptide",
    note: "Do not use for pneumonia. Monitor CPK.",
    isMultiStrategy: true,
    strategies: {
      "SSTI (Skin/Soft Tissue)": {
        standard_dose: "4 mg/kg q24h",
        dose_factor: 4,
        adjustments: [
          { max: 500, min: 30, recommendation: "4 mg/kg q24h" },
          { max: 29.9, min: 0, recommendation: "4 mg/kg q48h" }
        ]
      },
      "Bacteremia / Endovascular": {
        standard_dose: "6 mg/kg q24h",
        dose_factor: 6,
        adjustments: [
          { max: 500, min: 30, recommendation: "6 mg/kg q24h" },
          { max: 29.9, min: 0, recommendation: "6 mg/kg q48h" }
        ]
      },
      "E. Faecium / High Inoculum": {
        standard_dose: "8 - 10 mg/kg q24h",
        dose_factor: 8,
        adjustments: [
          { max: 500, min: 30, recommendation: "8-10 mg/kg q24h" },
          { max: 29.9, min: 0, recommendation: "8-10 mg/kg q48h" }
        ]
      }
    }
  },
  "linezolid": {
    name: "Linezolid (IV/PO)",
    class: "Oxazolidinone",
    note: "No renal adj. Monitor platelets.",
    standard_dose: "600 mg q12h",
    adjustments: [{ max: 500, min: 0, recommendation: "600 mg q12h (No Adjustment)" }]
  },
  "metronidazole": {
    name: "Metronidazole (IV/PO)",
    class: "Nitroimidazole",
    note: "Caution accumulation if CrCl < 30 & used > 2 weeks.",
    isMultiStrategy: true,
    strategies: {
      "CNS / C.diff / Necrotizing": {
        standard_dose: "500 mg q8h",
        adjustments: [
           { max: 500, min: 10, recommendation: "500 mg q8h" },
           { max: 9.9, min: 0, recommendation: "500 mg q12h" }
        ]
      },
      "Intra-abdominal": {
        standard_dose: "500 mg q8-12h",
        adjustments: [{ max: 500, min: 0, recommendation: "500 mg q8-12h" }]
      },
      "Severe Hepatic Impairment": {
        standard_dose: "500 mg q12h",
        adjustments: [{ max: 500, min: 0, recommendation: "500 mg q12h" }]
      }
    }
  },
  "cotrimoxazole": {
    name: "Cotrimoxazole (Oral/IV)",
    class: "Sulfonamide",
    note: "Dosing based on TRIMETHOPRIM (TMP) component. 1 DS Tablet = 160mg TMP.",
    isMultiStrategy: true,
    strategies: {
      "Uncomplicated Cystitis": {
        standard_dose: "160 mg TMP (1 DS Tab) q12h",
        adjustments: [
          { max: 500, min: 30, recommendation: "1 DS Tablet q12h" },
          { max: 29.9, min: 15, recommendation: "1 DS Tablet q24h" },
          { max: 14.9, min: 0, recommendation: "Not recommended" }
        ]
      },
      "SSTI (Skin/Soft Tissue)": {
        standard_dose: "160-320 mg TMP (1-2 DS Tabs) q12h",
        adjustments: [
          { max: 500, min: 30, recommendation: "1-2 DS Tabs q12h" },
          { max: 29.9, min: 15, recommendation: "1 DS Tab q12h" },
          { max: 14.9, min: 0, recommendation: "Not recommended" }
        ]
      },
      "S. Aureus (Bone/Joint)": {
        standard_dose: "3-4 mg/kg/dose TMP q12h",
        dose_factor: 3.5,
        adjustments: [
          { max: 500, min: 30, recommendation: "~3.5 mg/kg TMP q12h" },
          { max: 29.9, min: 15, recommendation: "Reduce dose 50%" }
        ]
      },
      "GNB Bacteremia": {
        standard_dose: "5 mg/kg/dose TMP q12h",
        dose_factor: 5,
        adjustments: [
          { max: 500, min: 30, recommendation: "5 mg/kg TMP q12h" },
          { max: 29.9, min: 15, recommendation: "2.5 mg/kg TMP q12h" }
        ]
      },
      "Stenotrophomonas": {
        standard_dose: "15-20 mg/kg/day TMP div q8h",
        dose_factor: 5, // Per dose (approx)
        adjustments: [
          { max: 500, min: 30, recommendation: "15-20 mg/kg/day div q8h" },
          { max: 29.9, min: 15, recommendation: "Reduce dose 50%" }
        ]
      },
      "PJP Treatment": {
        standard_dose: "15-20 mg/kg/day TMP div q6-8h",
        dose_factor: 5, // Per dose q8h or q6h
        adjustments: [
          { max: 500, min: 30, recommendation: "15-20 mg/kg/day div q6-8h" },
          { max: 29.9, min: 15, recommendation: "Reduce dose 50%" },
          { max: 14.9, min: 0, recommendation: "Not recommended" }
        ]
      }
    }
  },
  "clindamycin": {
    name: "Clindamycin (IV/PO)",
    class: "Lincosamide",
    note: "No renal adjustment. C. diff risk.",
    standard_dose: "600-900 mg q8h",
    adjustments: [{ max: 500, min: 0, recommendation: "600-900 mg q8h (No Adjustment)" }]
  },
  "nitrofurantoin": {
    name: "Nitrofurantoin (PO)",
    class: "Nitrofuran",
    note: "Contraindicated if CrCl < 60 (BEERS). UTI Only.",
    standard_dose: "100 mg BID",
    adjustments: [
      { max: 500, min: 60, recommendation: "100 mg BID" },
      { max: 59.9, min: 0, recommendation: "CONTRAINDICATED" }
    ]
  },

  // ==========================================
  // VII. ANTIVIRALS
  // ==========================================
  "acyclovir-iv": {
    name: "Acyclovir (IV)",
    class: "Antiviral",
    note: "Use IBW (or AdjBW if obese). Maintain hydration.",
    isMultiStrategy: true,
    strategies: {
      "Prophylaxis: BMT": {
        standard_dose: "250 mg/m2 q12h",
        is_bsa: true,
        dose_factor: 250,
        adjustments: [
          { max: 500, min: 50.1, recommendation: "250 mg/m2 q12h" },
          { max: 50, min: 25, recommendation: "125 mg/m2 q12h" },
          { max: 24.9, min: 10, recommendation: "125 mg/m2 q24h" },
          { max: 9.9, min: 0, recommendation: "62.5 mg/m2 q24h" }
        ]
      },
      "Prophylaxis: Heme/Onc": {
        standard_dose: "2 mg/kg q12h",
        dose_factor: 2,
        adjustments: [
          { max: 500, min: 25, recommendation: "2 mg/kg q12h" },
          { max: 24.9, min: 10, recommendation: "2 mg/kg q24h" },
          { max: 9.9, min: 0, recommendation: "1 mg/kg q24h" }
        ]
      },
      "Treatment: General (Mucocutaneous)": {
        standard_dose: "5 mg/kg q8h",
        dose_factor: 5,
        adjustments: [
          { max: 500, min: 50.1, recommendation: "5 mg/kg q8h" },
          { max: 50, min: 25, recommendation: "5 mg/kg q12h" },
          { max: 24.9, min: 10, recommendation: "5 mg/kg q24h" },
          { max: 9.9, min: 0, recommendation: "2.5 mg/kg q24h" }
        ]
      },
      "Treatment: Severe (CNS/VZV/Dissem)": {
        standard_dose: "10 mg/kg q8h",
        dose_factor: 10,
        adjustments: [
          { max: 500, min: 50.1, recommendation: "10 mg/kg q8h" },
          { max: 50, min: 25, recommendation: "10 mg/kg q12h" },
          { max: 24.9, min: 10, recommendation: "10 mg/kg q24h" },
          { max: 9.9, min: 0, recommendation: "5 mg/kg q24h" }
        ]
      }
    }
  },
  "acyclovir-po": {
    name: "Acyclovir (PO)",
    class: "Antiviral",
    isMultiStrategy: true,
    strategies: {
      "Zoster (High Dose)": {
        standard_dose: "800 mg 5x/day",
        adjustments: [
          { max: 500, min: 25.1, recommendation: "800 mg 5x/day" },
          { max: 25, min: 10, recommendation: "800 mg q8h" },
          { max: 9.9, min: 0, recommendation: "800 mg q12h" }
        ]
      },
      "HSV (Standard)": {
        standard_dose: "400 mg q8h",
        adjustments: [
          { max: 500, min: 25.1, recommendation: "400 mg q8h" },
          { max: 25, min: 10, recommendation: "400 mg q12h" },
          { max: 9.9, min: 0, recommendation: "200 mg q12h" }
        ]
      }
    }
  },
  "valacyclovir": {
    name: "Valacyclovir (PO)",
    class: "Antiviral",
    isMultiStrategy: true,
    strategies: {
      "VZV (Zoster)": {
        standard_dose: "1 g q8h",
        adjustments: [
          { max: 500, min: 50, recommendation: "1 g q8h" },
          { max: 49.9, min: 30, recommendation: "1 g q12h" },
          { max: 29.9, min: 10, recommendation: "1 g q24h" },
          { max: 9.9, min: 0, recommendation: "500 mg q24h" }
        ]
      },
      "Genital Herpes": {
        standard_dose: "1 g q12h",
        adjustments: [
          { max: 500, min: 30, recommendation: "1 g q12h" },
          { max: 29.9, min: 10, recommendation: "1 g q24h" },
          { max: 9.9, min: 0, recommendation: "500 mg q24h" }
        ]
      },
      "Herpes Labialis": {
        standard_dose: "2 g q12h x 2 doses (1 Day Treatment)",
        adjustments: [
          { max: 500, min: 50, recommendation: "2 g q12h x 2 doses (1 Day)" },
          { max: 49.9, min: 30, recommendation: "1 g q12h x 2 doses (1 Day)" },
          { max: 29.9, min: 10, recommendation: "500 mg q12h x 2 doses (1 Day)" },
          { max: 9.9, min: 0, recommendation: "500 mg x 1 dose" }
        ]
      }
    }
  },
  "valganciclovir": {
    name: "Valganciclovir (PO)",
    class: "Antiviral",
    isMultiStrategy: true,
    strategies: {
      "Induction": {
        standard_dose: "900 mg q12h",
        adjustments: [
          { max: 500, min: 60, recommendation: "900 mg q12h" },
          { max: 59.9, min: 40, recommendation: "450 mg q12h" },
          { max: 39.9, min: 25, recommendation: "450 mg q24h" },
          { max: 24.9, min: 10, recommendation: "450 mg q48h" },
          { max: 9.9, min: 0, recommendation: "200 mg x 1 post-HD" }
        ]
      },
      "Maintenance": {
        standard_dose: "900 mg q24h",
        adjustments: [
          { max: 500, min: 60, recommendation: "900 mg q24h" },
          { max: 59.9, min: 40, recommendation: "450 mg q24h" },
          { max: 39.9, min: 25, recommendation: "450 mg q48h" },
          { max: 24.9, min: 10, recommendation: "450 mg 2x/week" },
          { max: 9.9, min: 0, recommendation: "100 mg x 1 post-HD" }
        ]
      }
    }
  },
  "ganciclovir": {
    name: "Ganciclovir (IV)",
    class: "Antiviral",
    note: "Hematotoxic. Use IBW.",
    isMultiStrategy: true,
    strategies: {
      "Induction": {
        standard_dose: "5 mg/kg q12h",
        dose_factor: 5,
        adjustments: [
          { max: 500, min: 70, recommendation: "5 mg/kg q12h" },
          { max: 69.9, min: 50, recommendation: "2.5 mg/kg q12h" },
          { max: 49.9, min: 25, recommendation: "2.5 mg/kg q24h" },
          { max: 24.9, min: 10, recommendation: "1.25 mg/kg q24h" },
          { max: 9.9, min: 0, recommendation: "1.25 mg/kg 3x/week post-HD" }
        ]
      },
      "Maintenance": {
        standard_dose: "5 mg/kg q24h",
        dose_factor: 5,
        adjustments: [
          { max: 500, min: 70, recommendation: "5 mg/kg q24h" },
          { max: 69.9, min: 50, recommendation: "2.5 mg/kg q24h" },
          { max: 49.9, min: 25, recommendation: "1.25 mg/kg q24h" },
          { max: 24.9, min: 10, recommendation: "0.625 mg/kg q24h" }
        ]
      }
    }
  },
  "oseltamivir": {
    name: "Oseltamivir (PO)",
    class: "Antiviral",
    isMultiStrategy: true,
    strategies: {
      "Treatment": {
        standard_dose: "75 mg q12h",
        adjustments: [
          { max: 500, min: 61, recommendation: "75 mg q12h" },
          { max: 60, min: 31, recommendation: "30 mg q12h" },
          { max: 30, min: 11, recommendation: "30 mg q24h" },
          { max: 10, min: 0, recommendation: "30 mg x1" }
        ]
      },
      "Prophylaxis": {
        standard_dose: "75 mg q24h",
        adjustments: [
          { max: 500, min: 61, recommendation: "75 mg q24h" },
          { max: 60, min: 31, recommendation: "30 mg q24h" },
          { max: 30, min: 11, recommendation: "30 mg q48h" }
        ]
      }
    }
  },

  // ==========================================
  // VIII. ANTIFUNGALS
  // ==========================================
  "fluconazole": {
    name: "Fluconazole (IV/PO)",
    class: "Antifungal",
    note: "Reduce dose by 50% if CrCl < 50. 100% dose post-HD.",
    isMultiStrategy: true,
    strategies: {
      "Candidemia / Severe": {
        standard_dose: "800 mg Load -> 400-800 mg q24h",
        adjustments: [
          { max: 500, min: 50, recommendation: "800mg Load -> 400-800 mg q24h" },
          { max: 49.9, min: 0, recommendation: "800mg Load -> 200-400 mg q24h" }
        ]
      },
      "Esophageal / UTI": {
        standard_dose: "400 mg q24h",
        adjustments: [
          { max: 500, min: 50, recommendation: "400 mg q24h" },
          { max: 49.9, min: 0, recommendation: "200 mg q24h" }
        ]
      },
      "C. glabrata (SDD)": {
        standard_dose: "800 mg q24h",
        adjustments: [
          { max: 500, min: 50, recommendation: "800 mg q24h" },
          { max: 49.9, min: 0, recommendation: "400 mg q24h" }
        ]
      }
    }
  },
  "voriconazole": {
    name: "Voriconazole (IV/PO)",
    class: "Antifungal",
    note: "IV vehicle accumulates CrCl < 50. Oral preferred.",
    isMultiStrategy: true,
    strategies: {
      "IV": {
        standard_dose: "6mg/kg x2 Load -> 4mg/kg q12h",
        dose_factor: 4, // Maintenance
        adjustments: [{ max: 50, min: 0, recommendation: "Contraindicated (Accumulation). Use PO." }]
      },
      "PO": {
        standard_dose: "400mg x2 Load -> 200mg q12h",
        adjustments: [{ max: 500, min: 0, recommendation: "No adjustment." }]
      }
    }
  },
  "posaconazole": {
    name: "Posaconazole (IV/PO)",
    class: "Antifungal",
    note: "IV vehicle accumulates CrCl < 50. Use PO if possible.",
    standard_dose: "300 mg q24h (after load)",
    adjustments: [
      { max: 500, min: 50, recommendation: "300 mg IV/PO q24h" },
      { max: 49.9, min: 0, recommendation: "Use PO: 300mg PO BID x1 day, then 300mg PO q24h" }
    ]
  },
  "caspofungin": {
    name: "Caspofungin (IV)",
    class: "Antifungal",
    note: "No renal adj. Hepatic adj needed (Child-Pugh B: 35mg).",
    standard_dose: "70 mg Load -> 50 mg q24h",
    adjustments: [{ max: 500, min: 0, recommendation: "No renal adjustment." }]
  },
  "micafungin": {
    name: "Micafungin (IV)",
    class: "Antifungal",
    note: "No renal adjustment.",
    standard_dose: "100 mg q24h",
    adjustments: [{ max: 500, min: 0, recommendation: "100 mg IV q24h" }]
  },
  "amphotericin-b": {
    name: "Amphotericin B",
    class: "Antifungal",
    note: "Nefrotoksik.",
    isMultiStrategy: true,
    strategies: {
      "Liposomal (Ambisome)": {
        standard_dose: "3 - 5 mg/kg q24h",
        dose_factor: 4,
        adjustments: [{ max: 500, min: 0, recommendation: "No fixed adj. Monitor Cr." }]
      },
      "Deoxycholate (Conventional)": {
        standard_dose: "0.5 - 1 mg/kg q24h",
        dose_factor: 0.7,
        adjustments: [{ max: 500, min: 0, recommendation: "Avoid if possible in CKD." }]
      }
    }
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
  
  // SHC Weight Logic:
  // If ABW < IBW -> Use ABW (Actual)
  // If ABW > IBW -> Use Adjusted (IBW + 0.4(Actual - IBW))
  
  let dosingWeight = weight;
  let weightType = "Actual";

  if (weight > ibw) {
    dosingWeight = ibw + 0.4 * (weight - ibw);
    weightType = "Adjusted (Obese)";
  } else {
    dosingWeight = weight;
    weightType = "Actual";
  }

  const constant = gender === 'male' ? 1 : 0.85;
  const bsa = calculateBSA(height, weight);
  const result = ((140 - age) * dosingWeight) / (72 * creatinine) * constant;
  return { value: result, usedWeight: dosingWeight, weightType, bsa, ibw, actualWeight: weight };
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

  const getCalculatedDose = (drug, strategyKey, calc) => {
    if (!calc || !drug) return null;
    
    let strategy = drug;
    if (drug.isMultiStrategy && strategyKey) {
      strategy = drug.strategies[strategyKey];
    }
    
    if (!strategy?.dose_factor) return null;

    // Weight Logic for Dosing
    // Acyclovir/Aminoglycosides/Theophylline often use IBW/AdjBW
    // Vancomycin uses Actual
    let weightToUse = calc.usedWeight; // Default to SHC logic (Adj if Obese)
    
    // Override for Vancomycin (Actual)
    if (drug.name.includes("Vancomycin")) {
      weightToUse = calc.actualWeight;
    }
    // Override for BSA drugs
    if (strategy.is_bsa) {
      const dose = strategy.dose_factor * calc.bsa;
      return `${dose.toFixed(0)} mg`;
    }

    const dose = strategy.dose_factor * weightToUse;
    // Format to grams if > 1000
    if (dose >= 1000) return `${(dose/1000).toFixed(1)} g`;
    return `${dose.toFixed(0)} mg`;
  };

  const getRec = (drug, crclVal, strategyKey) => {
    if (!drug) return "";
    if (!crclVal && crclVal !== 0) return "Lengkapi data pasien...";
    
    const findAdj = (adjustments, val) => {
        return adjustments.find(a => val <= a.max && val >= a.min);
    };

    if (drug.isMultiStrategy) {
      if (!strategyKey || !drug.strategies?.[strategyKey]) return "Syncing Strategy...";
      const strat = drug.strategies[strategyKey];
      const adj = findAdj(strat.adjustments, crclVal);
      return adj ? adj.recommendation : (strat.standard_dose || "Standard Dose");
    }

    const adj = findAdj(drug.adjustments, crclVal);
    return adj ? adj.recommendation : (drug.standard_dose || "Standard Dose");
  };

  const getStatusColor = (val) => {
    if (!val && val !== 0) return 'bg-slate-100 text-slate-400';
    if (val < 30) return 'bg-red-600 text-white shadow-red-200';
    if (val < 60) return 'bg-amber-500 text-white shadow-amber-200';
    return 'bg-green-600 text-white shadow-green-200';
  };

  const calcDoseValue = getCalculatedDose(selectedDrug, selectedStrategy, calculation);

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
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1">
                 <ShieldCheck className="w-3 h-3" /> SHC 2025 Edition + Expanded
              </p>
            </div>
          </div>
          <button onClick={() => setPatient({ age: '', gender: 'male', weight: '', height: '', creatinine: '' })} className="text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 transition-colors flex items-center gap-1 text-white hover:bg-slate-700">
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

                {calcDoseValue && (
                  <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-lg border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1 opacity-70">
                        <Calculator className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Calculated Single Dose</span>
                      </div>
                      <div className="text-2xl font-black tracking-tight">{calcDoseValue}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[9px] uppercase font-bold text-slate-400">Based on</div>
                       <div className="text-sm font-bold text-white">{calculation?.usedWeight.toFixed(1)} kg</div>
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
        <p className="text-[10px] leading-relaxed">Based on Stanford Dosing Guide (Nov 2025) & MIMS (Cefoperazone + Sulbactam).</p>
        <p className="text-[10px] leading-relaxed">This tool is for educational purposes. Clinical judgment required.</p>
        <p className="text-[10px] font-bold uppercase tracking-widest mt-2">© 2026 - IWP I Adjustr.io</p>
      </footer>
    </div>
  );
}
