import React, { useState, useEffect, useMemo } from 'react';
import { Calculator, Search, AlertTriangle, Info, Syringe, Activity, ChevronRight, RefreshCw, ChevronDown } from 'lucide-react';

/**
 * ==========================================
 * DATA REPOSITORY (THE KNOWLEDGE BASE)
 * ==========================================
 * Mensimulasikan data dari Stanford Antimicrobial Guide + MIMS + Updates (Antifungals & Antivirals).
 */
const DRUG_DATABASE = {
  // --- ANTIVIRALS (NEW) ---
  "acyclovir-iv": {
    name: "Acyclovir (IV)",
    class: "Antiviral (DNA Polymerase Inhibitor)",
    note: "RISIKO NEFROTOKSIK (Crystal Nephropathy). Pastikan hidrasi adekuat (NS 1L pre/post). Gunakan IBW pada pasien obesitas. Infus lambat > 1 jam.",
    rrt: {
      ihd: "2.5 - 5 mg/kg post-dialysis.",
      crrt: "Treatment: 5-7.5 mg/kg q24h. Prophylaxis: 2.5-5 mg/kg q24h.",
      sled: "5 - 10 mg/kg post-SLED."
    },
    isMultiStrategy: true,
    strategies: {
      "Prophylaxis (BMT / HOM / Immunocompromised)": {
        standard_dose: "5 mg/kg IV q12h (or 250 mg/m2 q12h)",
        adjustments: [
          { max: 50, min: 25, recommendation: "5 mg/kg IV q24h" },
          { max: 24, min: 10, recommendation: "2.5 mg/kg IV q24h" },
          { max: 9, min: 0, recommendation: "2.5 mg/kg IV q48h (or 1.25 mg/kg q24h)" }
        ]
      },
      "Treatment (General / Severe / CNS HSV / VZV)": {
        standard_dose: "10 mg/kg IV q8h",
        adjustments: [
          { max: 50, min: 25, recommendation: "10 mg/kg IV q12h" },
          { max: 24, min: 10, recommendation: "10 mg/kg IV q24h" },
          { max: 9, min: 0, recommendation: "5 mg/kg IV q24h" }
        ]
      }
    }
  },
  "acyclovir-po": {
    name: "Acyclovir (PO)",
    class: "Antiviral (DNA Polymerase Inhibitor)",
    note: "Bioavailabilitas oral rendah (15-30%). Untuk infeksi berat/CNS, selalu gunakan IV. Maintain hydration.",
    rrt: {
      ihd: "Dose after dialysis.",
      crrt: "Adjustment same as CrCl < 10.",
      sled: "Dose after SLED."
    },
    isMultiStrategy: true,
    strategies: {
      "Prophylaxis (BMT / HOM)": {
        standard_dose: "400 - 800 mg PO q12h",
        adjustments: [
          { max: 10, min: 0, recommendation: "200 - 400 mg PO q12h" } // Simplified Stanford logic
        ]
      },
      "Treatment (Mucocutaneous HSV / VZV / Zoster)": {
        standard_dose: "800 mg PO 5x/day (Zoster) OR 400 mg PO q8h (HSV)",
        adjustments: [
          { max: 25, min: 10, recommendation: "Normal dose but extend interval to q8h (Zoster) or q12h (HSV)" },
          { max: 9, min: 0, recommendation: "800 mg q12h (Zoster) or 200 mg q12h (HSV)" }
        ]
      }
    }
  },
  "ganciclovir": {
    name: "Ganciclovir (IV)",
    class: "Antiviral (CMV)",
    note: "PERINGATAN: Myelosuppression (Neutropenia, Thrombocytopenia). Monitor CBC ketat. Gunakan IBW pada obesitas.",
    rrt: {
      ihd: "Induction: 1.25 mg/kg post-HD. Maintenance: 0.6 mg/kg post-HD.",
      crrt: "Induction: 2.5 mg/kg q24h. Maintenance: 1.25 mg/kg q24h.",
      sled: "Induction: 2.5 mg/kg post-SLED. Maintenance: 1.25 mg/kg post-SLED."
    },
    isMultiStrategy: true,
    strategies: {
      "Induction (I) - Active Infection": {
        standard_dose: "5 mg/kg IV q12h",
        adjustments: [
          { max: 69, min: 50, recommendation: "2.5 mg/kg IV q12h" },
          { max: 49, min: 25, recommendation: "2.5 mg/kg IV q24h" },
          { max: 24, min: 10, recommendation: "1.25 mg/kg IV q24h" },
          { max: 9, min: 0, recommendation: "1.25 mg/kg IV 3x/week post-HD" }
        ]
      },
      "Maintenance (M) - Secondary Prophylaxis": {
        standard_dose: "5 mg/kg IV q24h",
        adjustments: [
          { max: 69, min: 50, recommendation: "2.5 mg/kg IV q24h" },
          { max: 49, min: 25, recommendation: "1.25 mg/kg IV q24h" },
          { max: 24, min: 10, recommendation: "0.625 mg/kg IV q24h" },
          { max: 9, min: 0, recommendation: "0.625 mg/kg IV 3x/week post-HD" }
        ]
      }
    }
  },
  "valganciclovir": {
    name: "Valganciclovir (PO)",
    class: "Antiviral (CMV)",
    note: "Prodrug Ganciclovir. 900mg Valganciclovir PO ~ 5mg/kg Ganciclovir IV. Minum dengan makanan. Hati-hati Neutropenia.",
    rrt: {
      ihd: "Induction: 200mg PO post-HD. Maintenance: 100mg PO post-HD (NOTE: Tablets usually 450mg, liquid avail).",
      crrt: "Induction: 450mg PO q24h. Maintenance: 450mg PO q48h.",
      sled: "Dose post-SLED similar to IHD logic."
    },
    isMultiStrategy: true,
    strategies: {
      "Induction (CMV Retinitis/Severe Disease)": {
        standard_dose: "900 mg PO BID",
        adjustments: [
          { max: 59, min: 40, recommendation: "450 mg PO BID" },
          { max: 39, min: 25, recommendation: "450 mg PO q24h" },
          { max: 24, min: 10, recommendation: "450 mg PO q48h" },
          { max: 9, min: 0, recommendation: "Avoid or refer to HD dosing" }
        ]
      },
      "Maintenance / Prophylaxis": {
        standard_dose: "900 mg PO q24h",
        adjustments: [
          { max: 59, min: 40, recommendation: "450 mg PO q24h" },
          { max: 39, min: 25, recommendation: "450 mg PO q48h" },
          { max: 24, min: 10, recommendation: "450 mg PO 2x/week" },
          { max: 9, min: 0, recommendation: "Avoid or refer to HD dosing" }
        ]
      }
    }
  },
  "oseltamivir": {
    name: "Oseltamivir (Tamiflu)",
    class: "Antiviral (Neuraminidase Inhibitor)",
    note: "First line for Influenza A/B. Adjustment starts at CrCl < 60.",
    rrt: {
      ihd: "Tx: 30mg post-HD (or 75mg post every 2nd HD). Px: 30mg post every 2nd HD.",
      crrt: "Tx: 30 mg q12h. Px: 30 mg q24h.",
      sled: "Tx: 30 mg post-SLED."
    },
    isMultiStrategy: true,
    strategies: {
      "Treatment (Influenza A/B)": {
        standard_dose: "75 mg PO BID",
        adjustments: [
          { max: 60, min: 30, recommendation: "30 mg PO BID" },
          { max: 29, min: 10, recommendation: "30 mg PO q24h" }
        ]
      },
      "Prophylaxis": {
        standard_dose: "75 mg PO q24h",
        adjustments: [
          { max: 60, min: 30, recommendation: "30 mg PO q24h" },
          { max: 29, min: 10, recommendation: "30 mg PO q48h" }
        ]
      }
    }
  },

  // --- ANTIFUNGALS (PREVIOUSLY ADDED) ---
  "fluconazole": {
    name: "Fluconazole",
    class: "Antifungal (Azole)",
    note: "Dosis maintenance dikurangi 50% jika CrCl < 50 ml/min. Untuk HD: Berikan dosis PENUH (100%) setelah setiap sesi dialisis. Indikator dosis 400-800mg lazim untuk C.neoformans/Candidemia.",
    rrt: {
      ihd: "Give 100% of indicated dose AFTER each dialysis session.",
      crrt: "Standard dose (400-800 mg q24h). No adjustment needed.",
      sled: "Give 100% of indicated dose AFTER SLED."
    },
    isMultiStrategy: true,
    strategies: {
      "Systemic (Candidemia / Cryptococcal Meningitis)": {
        standard_dose: "400 - 800 mg IV/PO q24h (Loading dose may be required)",
        adjustments: [
          { max: 50, min: 0, recommendation: "200 - 400 mg IV/PO q24h (50% reduction)" }
        ]
      },
      "Mucosal (Oropharyngeal / Esophageal Candidiasis)": {
        standard_dose: "100 - 200 mg IV/PO q24h",
        adjustments: [
          { max: 50, min: 0, recommendation: "50 - 100 mg IV/PO q24h (50% reduction)" }
        ]
      },
      "Vaginal Candidiasis (Uncomplicated)": {
        standard_dose: "150 mg PO x 1 dose",
        adjustments: [
          { max: 50, min: 0, recommendation: "150 mg PO x 1 (No adjustment for single dose)" }
        ]
      }
    }
  },
  "voriconazole": {
    name: "Voriconazole",
    class: "Antifungal (Azole)",
    note: "PERINGATAN FORMULASI IV: Pelarut SBECD menumpuk pada CrCl < 50 ml/min (potensi nefrotoksik). Ganti ke ORAL jika memungkinkan (Bioavailabilitas >96%). Target trough: 2-5.5 mcg/mL. Hati-hati interaksi CYP450.",
    rrt: {
      ihd: "Oral: No adjustment. IV: Avoid if possible due to SBECD. If used, give after HD.",
      crrt: "Oral: Standard dose. IV: No adjustment needed (SBECD removed by CRRT).",
      sled: "Oral: Standard dose. IV: Give after SLED."
    },
    isMultiStrategy: true,
    strategies: {
      "Oral Tablet (Preferred for CrCl < 50)": {
        standard_dose: "200 mg (or 3-4 mg/kg) PO q12h",
        adjustments: [
          { max: 50, min: 0, recommendation: "No renal adjustment required for ORAL form." }
        ]
      },
      "Intravenous (IV) Formulation": {
        standard_dose: "4 mg/kg IV q12h (Maintenance)",
        adjustments: [
          { max: 50, min: 0, recommendation: "SWITCH TO ORAL. (If IV mandatory: Benefit > Risk only. Monitor SCr)." }
        ]
      }
    }
  },
  "caspofungin": {
    name: "Caspofungin",
    class: "Antifungal (Echinocandin)",
    note: "NO RENAL ADJUSTMENT. Penyesuaian dosis hanya untuk gangguan HATI (Child-Pugh B: 35 mg maintenance). Aman untuk ginjal.",
    rrt: {
      ihd: "No adjustment. Dosing not affected by dialysis.",
      crrt: "No adjustment.",
      sled: "No adjustment."
    },
    isMultiStrategy: true,
    strategies: {
      "Invasive Candidiasis / Aspergillosis": {
        standard_dose: "Load 70 mg IV x1, then 50 mg IV q24h",
        adjustments: [
          { max: 30, min: 0, recommendation: "Load 70 mg, then 50 mg q24h (No Renal Adj). Child-Pugh B: 35 mg maint." }
        ]
      },
      "Esophageal Candidiasis": {
        standard_dose: "50 mg IV q24h (No loading dose)",
        adjustments: [
          { max: 30, min: 0, recommendation: "50 mg q24h (No Renal Adj). Child-Pugh B: 35 mg." }
        ]
      }
    }
  },
  "amphotericin-b": {
    name: "Amphotericin B",
    class: "Antifungal (Polyene)",
    note: "SANGAT NEFROTOKSIK (Terutama formulasi konvensional/Deoxycholate). Hydration (Salt Loading) pre/post infus sangat disarankan. Pantau K+ dan Mg++ ketat.",
    rrt: {
      ihd: "Liposomal: No adj. Conventional: No adj, but consider dosing q48h to reduce toxicity burden.",
      crrt: "Standard dose.",
      sled: "Standard dose."
    },
    isMultiStrategy: true,
    strategies: {
      "Liposomal (AmBisome) - Less Nephrotoxic": {
        standard_dose: "3 - 5 mg/kg IV q24h",
        adjustments: [
           { max: 30, min: 0, recommendation: "No dose adjustment defined, but toxicity monitoring essential." }
        ]
      },
      "Conventional (Deoxycholate) - HIGH RISK": {
        standard_dose: "0.5 - 1.0 mg/kg IV q24h",
        adjustments: [
           { max: 50, min: 10, recommendation: "Avoid if possible. Consider salt loading." },
           { max: 10, min: 0, recommendation: "Use Liposomal if available. If strict usage: q24h or q48h." }
        ]
      }
    }
  },

  // --- ANTIBIOTICS (UNCHANGED) ---
  "cefoperazone-sulbactam": {
    name: "Cefoperazone-Sulbactam",
    class: "Cephalosporin / Beta-lactamase Inhibitor",
    note: "Adjustment based on SULBACTAM component (Renal excretion). Cefoperazone (Biliary excretion) needs adjustment only in severe hepatic obstruction. Ratio typically 1:1 or 2:1.",
    rrt: {
      ihd: "Sulbactam is dialyzable. Administer dose AFTER dialysis.",
      crrt: "No strict adjustment required (Standard dose usually safe).",
      sled: "Administer dose AFTER SLED."
    },
    isMultiStrategy: true,
    strategies: {
      "Standard Ratio (1g Cefoperazone : 1g Sulbactam)": {
        standard_dose: "2 g (1g Cef + 1g Sulb) IV q12h",
        adjustments: [
          { max: 30, min: 15, recommendation: "2 g (1g Cef + 1g Sulb) IV q12h (Max Sulbactam 2g/day)" },
          { max: 14, min: 0, recommendation: "1.5 g (1g Cef + 0.5g Sulb) IV q12h OR 2g q24h (Max Sulbactam 1g/day)" }
        ]
      },
      "Ratio 2:1 (1g Cefoperazone : 0.5g Sulbactam)": {
        standard_dose: "1.5 g (1g Cef + 0.5g Sulb) IV q12h",
        adjustments: [
          { max: 30, min: 15, recommendation: "1.5 g IV q12h (Safe range)" },
          { max: 14, min: 0, recommendation: "1.5 g IV q12h (Max Sulbactam 1g/day reached)" }
        ]
      }
    }
  },
  "ampicillin-sulbactam": {
    name: "Ampicillin-Sulbactam",
    class: "Penicillin / Beta-lactamase Inhibitor",
    note: "Rasio Ampicillin:Sulbactam = 2:1. (3g = 2g Ampi + 1g Sulb). Untuk Acinetobacter (ABA), target efikasi berdasarkan komponen Sulbactam (Target high dose).",
    rrt: {
      ihd: "Standard: 1.5 - 3 g IV q24h (Post-HD). ABA: 3 g IV q12h (Post-HD).",
      crrt: "Standard: 3 g IV q12h. ABA: 3 g IV q8h.",
      sled: "3 g IV q24h (Post-SLED)"
    },
    isMultiStrategy: true,
    strategies: {
      "Mild / Uncomplicated": {
        standard_dose: "1.5 - 3 g IV q6h",
        adjustments: [
          { max: 30, min: 15, recommendation: "1.5 - 3 g IV q12h" },
          { max: 14, min: 5, recommendation: "1.5 - 3 g IV q24h" },
          { max: 4, min: 0, recommendation: "1.5 g IV q24h" }
        ]
      },
      "Systemic / Severe Infection": {
        standard_dose: "3 g IV q6h",
        adjustments: [
          { max: 30, min: 15, recommendation: "3 g IV q12h" },
          { max: 14, min: 5, recommendation: "3 g IV q24h" },
          { max: 4, min: 0, recommendation: "1.5 - 3 g IV q24h" }
        ]
      },
      "Acinetobacter (ABA) - High Dose": {
        standard_dose: "3 g IV q4h (Total ~6g Sulbactam/day)",
        adjustments: [
          { max: 50, min: 30, recommendation: "3 g IV q6h" },
          { max: 29, min: 15, recommendation: "3 g IV q8h" },
          { max: 14, min: 0, recommendation: "3 g IV q12h" }
        ]
      }
    }
  },
  "ampicillin": {
    name: "Ampicillin",
    class: "Penicillin",
    note: "Risiko kejang pada dosis tinggi dengan gangguan ginjal. CrCL > 130 may consider increasing dose to 2g IV q4h for mild uncomplicated infections due to enhanced clearance. For meningitis/endovascular/PJI, may consider administering via continuous infusion.",
    rrt: {
      ihd: "1-2 g IV q12-24h (Give after dialysis)",
      crrt: "2 g IV q6-8h",
      sled: "2 g IV q12h"
    },
    isMultiStrategy: true,
    strategies: {
      "Mild / Uncomplicated Infection": {
        standard_dose: "1-2 g IV q6h",
        adjustments: [
          { max: 50, min: 10, recommendation: "1-2 g IV q6-12h" },
          { max: 10, min: 0, recommendation: "1-2 g IV q12-24h" }
        ]
      },
      "Meningitis / Endovascular / PJI (Severe)": {
        standard_dose: "2 g IV q4h",
        adjustments: [
          { max: 50, min: 10, recommendation: "2 g IV q6-8h" },
          { max: 10, min: 0, recommendation: "2 g IV q12h" }
        ]
      }
    }
  },
  "metronidazole": {
    name: "Metronidazole",
    class: "Nitroimidazole",
    note: "Aman untuk ginjal (No Adjustment needed for CrCl reduction), NAMUN metabolit menumpuk pada CrCl < 30 (terutama jika > 1-2 minggu, risiko neuropati/seizure). Perhatikan efek disulfiram-like.",
    rrt: {
      ihd: "Dose after dialysis (Significantly removed by dialysis). Supplement with 250-500mg if dose given pre-dialysis.",
      crrt: "500 mg q8h",
      sled: "500 mg q8h"
    },
    isMultiStrategy: true,
    strategies: {
      "CNS / C.diff / SSTI / Necrotizing Infection": {
        standard_dose: "500 mg IV/PO q8h",
        adjustments: [
          { max: 150, min: 30, recommendation: "500 mg q8h" },
          { max: 29, min: 0, recommendation: "500 mg q8h (Caution: Metabolite accumulation if >1-2 weeks)" }
        ]
      },
      "Intra-abdominal Infection": {
        standard_dose: "500 mg IV/PO q8-12h",
        adjustments: [
           { max: 150, min: 30, recommendation: "500 mg q8-12h" },
           { max: 29, min: 0, recommendation: "500 mg q12h (Conservative dosing recommended)" }
        ]
      },
      "Severe Hepatic Impairment (Child-Pugh C)": {
        standard_dose: "500 mg IV/PO q12h",
        adjustments: [
          { max: 200, min: 0, recommendation: "500 mg q12h (Hepatic Dose Adjustment)" } 
        ]
      }
    }
  },
  "meropenem": {
    name: "Meropenem",
    class: "Carbapenem",
    note: "PERINGATAN UTAMA: Menurunkan kadar Asam Valproat secara signifikan (hindari penggunaan bersamaan). Risiko kejang meningkat pada gangguan ginjal.",
    rrt: {
      ihd: "Dose based on indication (Standard: 500mg / Meningitis: 1g) post-dialysis",
      crrt: "Standard: 1g q12h / Meningitis: 2g q12h",
      sled: "Dose based on indication post-SLED"
    },
    isMultiStrategy: true,
    strategies: {
      "Standard Infection": {
        standard_dose: "1 g IV q8h",
        adjustments: [
          { max: 50, min: 26, recommendation: "1 g IV q12h" },
          { max: 25, min: 10, recommendation: "500 mg IV q12h" },
          { max: 10, min: 0, recommendation: "500 mg IV q24h" }
        ]
      },
      "Meningitis / Cystic Fibrosis": {
        standard_dose: "2 g IV q8h",
        adjustments: [
          { max: 50, min: 26, recommendation: "2 g IV q12h" },
          { max: 25, min: 10, recommendation: "1 g IV q12h" },
          { max: 10, min: 0, recommendation: "1 g IV q24h" }
        ]
      }
    }
  },
  "piperacillin-tazobactam": {
    name: "Piperacillin-Tazobactam",
    class: "Penicillin / Beta-lactamase Inhibitor",
    note: "High sodium content. In select cases (sepsis, deep-seated infection, MIC=16, Obesity >120kg/BMI>40, or Augmented Renal Clearance/CF), consider doses of 4.5 g IV q8h (4h infusion) or q6h.",
    rrt: {
      ihd: "2.25 g IV q8h (Dose after dialysis). Give extra 0.75g dose for severe infections.",
      crrt: "4.5 g IV q8h (Extended Infusion preferred)",
      sled: "2.25 g IV q8h (after SLED)"
    },
    isMultiStrategy: true,
    strategies: {
      "Extended Infusion (4 hours) - PREFERRED": {
        standard_dose: "4.5 g IV q6h (Infuse over 4 hours)",
        adjustments: [
          { max: 90, min: 40, recommendation: "4.5 g IV q8h (Infuse over 4h)" }, 
          { max: 40, min: 20, recommendation: "3.375 g IV q8h (Infuse over 4h)" },
          { max: 20, min: 0, recommendation: "3.375 g IV q12h (Infuse over 4h)" } 
        ]
      },
      "Intermittent Infusion (Traditional)": {
        standard_dose: "4.5 g IV q6h (Infuse over 30 mins)",
        adjustments: [
          { max: 40, min: 20, recommendation: "2.25 g IV q6h (atau 3.375 g q6h untuk infeksi berat)" },
          { max: 20, min: 0, recommendation: "2.25 g IV q8h" }
        ]
      }
    }
  },
  "cefepime": {
    name: "Cefepime",
    class: "Cephalosporin (4th Gen)",
    note: "RISIKO NEUROTOKSISITAS (Non-convulsive Status Epilepticus) tinggi pada gagal ginjal jika dosis tidak diturunkan. Monitor status mental ketat.",
    rrt: {
      ihd: "1 g IV q24h (Dose after dialysis). For Severe/CNS: 1g after each dialysis.",
      crrt: "2 g IV q12h (Severe) or 1 g IV q12h (General)",
      sled: "2 g IV q24h (after SLED)"
    },
    isMultiStrategy: true,
    strategies: {
      "Pulmonary / Neutropenic Fever / CNS / Pseudomonas / Severe": {
        standard_dose: "2 g IV q8h",
        adjustments: [
          { max: 60, min: 30, recommendation: "2 g IV q12h" },
          { max: 29, min: 11, recommendation: "2 g IV q24h" },
          { max: 10, min: 0, recommendation: "1 g IV q24h" }
        ]
      },
      "General / Mild-Moderate (UTI, Skin)": {
        standard_dose: "1 g IV q8h",
        adjustments: [
          { max: 60, min: 30, recommendation: "1 g IV q12h" },
          { max: 29, min: 11, recommendation: "1 g IV q24h" },
          { max: 10, min: 0, recommendation: "500 mg IV q24h" }
        ]
      }
    }
  },
  "levofloxacin": {
    name: "Levofloxacin",
    class: "Fluoroquinolone",
    standard_dose: "750 mg IV/PO q24h",
    note: "Bioavailabilitas oral ~99%. Jangan berikan bersama kation multivalen (Mg, Al, Ca) per oral. Risiko tendinitis dan pemanjangan QT.",
    adjustments: [
      { max: 50, min: 20, recommendation: "750 mg x1, lalu 750 mg q48h" },
      { max: 20, min: 10, recommendation: "750 mg x1, lalu 500 mg q48h" },
      { max: 10, min: 0, recommendation: "750 mg x1, lalu 500 mg q48h" }
    ],
    rrt: {
      ihd: "750 mg x1, lalu 500 mg q48h (Dose after dialysis not required)",
      crrt: "750 mg IV/PO q24h",
      sled: "750 mg x1, lalu 500 mg q48h"
    }
  },
  "vancomycin": {
    name: "Vancomycin",
    class: "Glycopeptide",
    standard_dose: "15-20 mg/kg (Actual BW) IV q12h",
    note: "Target trough level: 15-20 mcg/mL untuk infeksi berat. Wajib TDM (Therapeutic Drug Monitoring). Risiko nefrotoksisitas meningkat dengan Piperacillin-Tazobactam.",
    adjustments: [
      { max: 49, min: 30, recommendation: "15 mg/kg IV q24h" },
      { max: 29, min: 0, recommendation: "15-20 mg/kg IV loading dose, lalu monitor level (random level check)" }
    ],
    rrt: {
      ihd: "Load 20-25 mg/kg. Maintenance berdasarkan pre-dialysis level.",
      crrt: "Load 20-25 mg/kg. Maintenance 10-15 mg/kg q12-24h (tergantung flow rate).",
      sled: "Dose after SLED similar to IHD logic."
    }
  },
  "cotrimoxazole": {
      name: "Cotrimoxazole (TMP/SMX)",
      class: "Sulfonamide",
      note: "Hati-hati hiperkalemia dan peningkatan SCr artifisial (hambatan sekresi tubular). Dosis referensi berdasarkan komponen Trimethoprim (TMP). 1 DS Tab = 160mg TMP.",
      rrt: {
          ihd: "50% of standard dose, administered after dialysis",
          crrt: "Dose as in normal renal function (High sieve coefficient)",
          sled: "50% of standard dose"
      },
      isMultiStrategy: true,
      strategies: {
          "Uncomplicated Cystitis": {
              standard_dose: "1 DS tab PO BID",
              adjustments: [
                  { max: 30, min: 15, recommendation: "1 DS tab PO q24h (50% dose)" },
                  { max: 15, min: 0, recommendation: "Avoid if possible or 1 SS tab PO q24h" }
              ]
          },
          "SSTI / S. aureus (Bone/Joint) / GNB Bacteremia": {
              standard_dose: "8-10 mg/kg/day TMP (approx 2 DS tabs BID)",
              adjustments: [
                  { max: 30, min: 15, recommendation: "4-5 mg/kg/day TMP (50% dose)" },
                  { max: 15, min: 0, recommendation: "Not recommended or 50% dose if essential" }
              ]
          },
          "Stenotrophomonas": {
              standard_dose: "10-15 mg/kg/day TMP divided q8-12h",
              adjustments: [
                  { max: 30, min: 15, recommendation: "5-7.5 mg/kg/day TMP (50% dose)" },
                  { max: 15, min: 0, recommendation: "Not recommended or 50% dose if essential" }
              ]
          },
          "PJP (Pneumocystis jirovecii)": {
              standard_dose: "15-20 mg/kg/day TMP divided q6-8h", 
              adjustments: [
                  { max: 30, min: 15, recommendation: "7.5-10 mg/kg/day TMP (50% dose)" },
                  { max: 15, min: 0, recommendation: "Use with caution. 50% dose." }
              ]
          }
      }
  },
  "ceftazidime": {
    name: "Ceftazidime",
    class: "Cephalosporin (3rd Gen - Anti Pseudomonas)",
    standard_dose: "2 g IV q8h",
    note: "Utama untuk Pseudomonas aeruginosa. Jika hanya untuk Enterobacteriaceae (selain Pseudomonas), dosis 1g q8h mungkin cukup.",
    adjustments: [
      { max: 50, min: 31, recommendation: "1 - 2 g IV q12h" },
      { max: 30, min: 16, recommendation: "1 - 2 g IV q24h" },
      { max: 15, min: 6, recommendation: "500mg - 1 g IV q24h" },
      { max: 5, min: 0, recommendation: "500mg - 1 g IV q48h" }
    ],
    rrt: {
      ihd: "1 g IV post-dialysis",
      crrt: "2 g IV q12h",
      sled: "1 g IV post-SLED"
    }
  },
  "ciprofloxacin": {
    name: "Ciprofloxacin",
    class: "Fluoroquinolone",
    standard_dose: "400 mg IV q8-12h",
    note: "Risiko tendinitis, QT prolongation, dan CNS effects. Hindari pada myasthenia gravis.",
    adjustments: [
      { max: 30, min: 0, recommendation: "400 mg IV q24h (OR 250-500mg PO q24h)" }
    ],
    rrt: {
      ihd: "400 mg IV q24h (or 250-500mg PO q24h) post-dialysis",
      crrt: "400 mg IV q12h (PO 500mg q12h)",
      sled: "400 mg IV q24h post-SLED"
    }
  },
  "gentamicin": {
    name: "Gentamicin",
    class: "Aminoglycoside",
    note: "NEPHROTOXIC & OTOTOXIC. Wajib TDM! Gunakan Ideal Body Weight untuk dosing, kecuali Obese (pakai AdjBW). Extended Interval (High Dose) lebih disukai untuk mengurangi akumulasi kortikal ginjal.",
    isMultiStrategy: true,
    strategies: {
      "Extended Interval (Once Daily) - PREFERRED": {
        standard_dose: "5-7 mg/kg IV q24h",
        adjustments: [
          { max: 60, min: 40, recommendation: "5-7 mg/kg IV q36h" },
          { max: 40, min: 20, recommendation: "5-7 mg/kg IV q48h" },
          { max: 20, min: 0, recommendation: "Dose by level only. Give loading dose 2mg/kg then check random levels." }
        ]
      },
      "Traditional Dosing (Synergy / Endocarditis)": {
        standard_dose: "1 mg/kg IV q8h",
        adjustments: [
          { max: 60, min: 40, recommendation: "1 mg/kg IV q12h" },
          { max: 40, min: 20, recommendation: "1 mg/kg IV q24h" },
          { max: 20, min: 0, recommendation: "Dose by level only" }
        ]
      }
    },
    rrt: {
      ihd: "2 mg/kg after dialysis (Monitor pre-HD levels)",
      crrt: "2.5 mg/kg loading, then 1-2 mg/kg q24-48h (Monitor levels!)",
      sled: "2 mg/kg after SLED"
    }
  }
};

/**
 * ==========================================
 * MEDICAL LOGIC ENGINE
 * ==========================================
 */

// Hitung BMI
const calculateBMI = (weight, height) => {
  if (!weight || !height) return 0;
  const heightM = height / 100;
  return weight / (heightM * heightM);
};

// Hitung IBW (Devine Formula)
const calculateIBW = (height, gender) => {
  if (!height) return 0;
  const inches = height / 2.54;
  const base = gender === 'male' ? 50 : 45.5;
  const result = base + 2.3 * (inches - 60);
  return result > 0 ? result : 0;
};

// Hitung Adjusted BW (untuk Obesitas)
// Rumus: IBW + 0.4(Actual - IBW)
const calculateAdjBW = (weight, ibw) => {
  return ibw + 0.4 * (weight - ibw);
};

// Cockcroft-Gault Engine
const calculateCrCl = (age, weight, creatinine, gender, height) => {
  if (!age || !weight || !creatinine || !height) return null;
  
  const ibw = calculateIBW(height, gender);
  
  let dosingWeight = ibw;
  let weightType = "IBW";

  if (weight < ibw) {
    dosingWeight = weight;
    weightType = "Actual BW (Underweight)";
  } else if (weight > ibw * 1.3) {
    dosingWeight = calculateAdjBW(weight, ibw);
    weightType = "Adjusted BW (Obese)";
  } else {
    dosingWeight = ibw; 
    weightType = "IBW (Normal/Overweight)";
  }

  const constant = gender === 'male' ? 1 : 0.85;
  const result = ((140 - age) * dosingWeight) / (72 * creatinine) * constant;
  
  return { value: result, usedWeight: dosingWeight, weightType };
};

// Custom Kidney Icon Component (Updated for better visuals)
const KidneyIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Stylized Kidney Bean Shape with Hilum Indentation */}
    <path d="M16.5 4c-1.7 0-3.3.8-4.5 2.2C10.8 4.8 9.2 4 7.5 4 4.5 4 2 6.5 2 9.5c0 4.5 6 9.5 10 9.5s10-5 10-9.5C22 6.5 19.5 4 16.5 4z" />
    <path d="M12 17c-2.5 0-6-3.5-6-7.5 0-1.5 1-2.5 1.5-2.5s.5.5.5 1c0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5c0-.5.1-1 .5-1 .5 0 1.5 1 1.5 2.5 0 4-3.5 7.5-6 7.5z" opacity="0.5" />
  </svg>
);

export default function RenalDoseApp() {
  const [patient, setPatient] = useState({
    age: '',
    gender: 'male',
    weight: '', // kg
    height: '', // cm
    creatinine: '' // mg/dL
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDrugId, setSelectedDrugId] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);

  const calculation = useMemo(() => {
    return calculateCrCl(
      parseFloat(patient.age),
      parseFloat(patient.weight),
      parseFloat(patient.creatinine),
      patient.gender,
      parseFloat(patient.height)
    );
  }, [patient]);

  const drugList = useMemo(() => {
    return Object.keys(DRUG_DATABASE).filter(key => 
      DRUG_DATABASE[key].name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const selectedDrug = selectedDrugId ? DRUG_DATABASE[selectedDrugId] : null;

  useEffect(() => {
    if (selectedDrug && selectedDrug.isMultiStrategy) {
      const firstKey = Object.keys(selectedDrug.strategies)[0];
      setSelectedStrategy(firstKey);
    } else {
      setSelectedStrategy(null);
    }
  }, [selectedDrugId, selectedDrug]);

  const getRecommendation = (drug, crclVal, strategyKey) => {
    if (!crclVal && crclVal !== 0) return "Menunggu hasil CrCl...";
    
    let adjustments = [];
    let stdDose = "";

    if (drug.isMultiStrategy && strategyKey) {
      const strat = drug.strategies[strategyKey];
      adjustments = strat.adjustments;
      stdDose = strat.standard_dose;
    } else {
      adjustments = drug.adjustments;
      stdDose = drug.standard_dose;
    }

    // Default logic: If CrCl > defined Max in adjustments, use Standard Dose.
    const maxDefined = Math.max(...adjustments.map(a => a.max));
    
    if (crclVal > maxDefined) return stdDose;

    const adjustment = adjustments.find(adj => crclVal <= adj.max && crclVal >= adj.min);
    
    if (adjustment) return adjustment.recommendation;
    
    // Fallback if not covered in ranges (should be rare if ranges are 0-100+)
    return "Konsul farmasi klinis / ID Consultant";
  };

  const getCurrentStandardDose = () => {
    if (!selectedDrug) return "";
    if (selectedDrug.isMultiStrategy && selectedStrategy) {
      return selectedDrug.strategies[selectedStrategy].standard_dose;
    }
    return selectedDrug.standard_dose;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* HEADER */}
      <header className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🫘</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Adjustr.io</h1>
              <p className="text-xs text-blue-200 opacity-80">Stanford-based Dosing Guide</p>
            </div>
          </div>
          <div className="text-xs bg-blue-800 px-2 py-1 rounded border border-blue-700">
            For Medical Professionals Only
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-6">
        
        {/* SECTION 1: PATIENT CALCULATOR */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-slate-600" />
            <h2 className="font-semibold text-slate-700">Patient Parameters</h2>
          </div>
          
          <div className="p-4 grid grid-cols-2 gap-4">
            {/* Inputs */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Gender</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPatient({...patient, gender: 'male'})}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${patient.gender === 'male' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Male
                </button>
                <button 
                  onClick={() => setPatient({...patient, gender: 'female'})}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${patient.gender === 'female' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Fem
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Age (years)</label>
              <input type="number" name="age" value={patient.age} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 55" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Weight (kg)</label>
              <input type="number" name="weight" value={patient.weight} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 70" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Height (cm)</label>
              <input type="number" name="height" value={patient.height} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 170" />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500">Serum Creatinine (mg/dL)</label>
              <div className="relative">
                <input type="number" step="0.1" name="creatinine" value={patient.creatinine} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="e.g. 1.2" />
                <Activity className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* RESULTS BAR */}
          <div className="bg-slate-50 p-4 border-t border-slate-200">
             {calculation ? (
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-xs text-slate-500 font-medium">Est. CrCl (Cockcroft-Gault)</p>
                   <p className={`text-2xl font-bold ${calculation.value < 30 ? 'text-red-600' : calculation.value < 50 ? 'text-amber-600' : 'text-green-600'}`}>
                     {calculation.value.toFixed(1)} <span className="text-sm font-normal text-slate-500">mL/min</span>
                   </p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-slate-400">Weight used: <span className="font-semibold text-slate-600">{calculation.weightType}</span></p>
                    <p className="text-xs text-slate-400">Mass: <span className="font-semibold text-slate-600">{calculation.usedWeight.toFixed(1)} kg</span></p>
                 </div>
               </div>
             ) : (
               <div className="text-center py-2 text-slate-400 text-sm flex items-center justify-center gap-2">
                 <Info className="h-4 w-4" />
                 Enter parameters to calculate CrCl
               </div>
             )}
          </div>
        </div>

        {/* SECTION 2: DRUG SELECTOR */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input 
              type="text" 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search Antibiotic (e.g. Meropenem, Levo...)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedDrugId(null); 
              }}
            />
          </div>

          {/* Drug List (If searching or nothing selected) */}
          {!selectedDrugId && searchTerm && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
              {drugList.length > 0 ? (
                drugList.map(key => (
                  <button 
                    key={key} 
                    onClick={() => setSelectedDrugId(key)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-700 group-hover:text-blue-700">{DRUG_DATABASE[key].name}</p>
                      <p className="text-xs text-slate-500">{DRUG_DATABASE[key].class}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-sm">No drugs found.</div>
              )}
            </div>
          )}
        </div>

        {/* SECTION 3: DOSING RESULT CARD */}
        {selectedDrug && (
          <div className="bg-white rounded-xl shadow-lg border-t-4 border-blue-600 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="p-5 border-b border-slate-100 flex justify-between items-start">
               <div>
                 <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   {selectedDrug.name}
                   <button onClick={() => setSelectedDrugId(null)} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded hover:bg-slate-200 ml-2">Change</button>
                 </h2>
                 <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                   {selectedDrug.class}
                 </span>
               </div>
               <Syringe className="h-6 w-6 text-blue-500 opacity-20" />
             </div>

             <div className="p-5 space-y-6">
               
               {/* STRATEGY SELECTOR */}
               {selectedDrug.isMultiStrategy && (
                 <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Select Clinical Indication / Dose Strategy</label>
                    <div className="relative">
                      <select 
                        value={selectedStrategy || ''}
                        onChange={(e) => setSelectedStrategy(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500 text-sm"
                      >
                        {Object.keys(selectedDrug.strategies).map(strat => (
                          <option key={strat} value={strat}>{strat}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                 </div>
               )}

               {/* Main Recommendation */}
               <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                 <h3 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-2">
                   <Activity className="h-4 w-4" /> 
                   Renal Adjustment (CrCl: {calculation ? calculation.value.toFixed(0) : '?'})
                 </h3>
                 <p className="text-lg font-bold text-blue-800">
                   {calculation ? getRecommendation(selectedDrug, calculation.value, selectedStrategy) : "Please complete patient data"}
                 </p>
                 <p className="text-xs text-blue-600 mt-2">
                   Standard Dose: {getCurrentStandardDose()}
                 </p>
               </div>

               {/* Dialysis Section */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 <div className="bg-slate-50 p-3 rounded border border-slate-100">
                   <p className="text-xs font-bold text-slate-500 uppercase mb-1">IHD (Hemodialysis)</p>
                   <p className="text-sm text-slate-700 font-medium">{selectedDrug.rrt.ihd}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded border border-slate-100">
                   <p className="text-xs font-bold text-slate-500 uppercase mb-1">CRRT (CVVH/D)</p>
                   <p className="text-sm text-slate-700 font-medium">{selectedDrug.rrt.crrt}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded border border-slate-100">
                   <p className="text-xs font-bold text-slate-500 uppercase mb-1">SLED</p>
                   <p className="text-sm text-slate-700 font-medium">{selectedDrug.rrt.sled}</p>
                 </div>
               </div>

               {/* Clinical Pearl / Notes */}
               <div className="flex gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
                 <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                 <div className="text-sm text-amber-800">
                   <span className="font-bold block text-xs uppercase mb-1">Clinical Pearl & Safety</span>
                   {selectedDrug.note}
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center text-xs text-slate-400 pb-8 pt-4">
          <p>Based on Stanford Health Care Antimicrobial Dosing Reference Guide (mostly) & MIMS (Cefoperazone + Sulbactam).</p>
          <p>This tool is for educational purposes. Clinical judgment required.</p>
          <p className="mt-2 font-medium">© 2026 - IWP I Adjustr.io</p>
        </div>

      </main>
    </div>
  );
}