export type MedGroupKey = 'bloodPressure' | 'diabetes' | 'bloodThinners' | 'immunosuppressants' | 'miscellaneous' | 'cardiac';

export interface Med {
  id: string;
  // displayName supports "Brand / Generic" slash-grouped aliases for the same medication
  brandName: string;
  genericName?: string;
}

export interface MedGroup {
  id: string;
  groupKey: MedGroupKey;
  label: string;
  meds: Med[];
}

export interface ConditionMedConfig {
  condition: string;
  conditionLabel: string;
  groups: MedGroup[];
}

export const MEDICATION_MAPPING: ConditionMedConfig[] = [
  // ─── Diabetes ──────────────────────────────────────────────────────────────
  {
    condition: 'diabetes',
    conditionLabel: 'Diabetes',
    groups: [
      {
        id: 'glp1',
        groupKey: 'diabetes',
        label: 'GLP-1 Agonists',
        meds: [
          { id: 'ozempic',    brandName: 'Ozempic',    genericName: 'semaglutide' },
          // Wegovy replaces Byetta (Byetta/exenatide removed per product update)
          { id: 'wegovy',     brandName: 'Wegovy',     genericName: 'semaglutide (weight management)' },
          { id: 'mounjaro',   brandName: 'Mounjaro',   genericName: 'tirzepatide' },
          { id: 'victoza',    brandName: 'Victoza',    genericName: 'liraglutide' },
          { id: 'trulicity',  brandName: 'Trulicity',  genericName: 'dulaglutide' },
        ],
      },
      {
        id: 'sglt2',
        groupKey: 'diabetes',
        label: 'SGLT-2 Inhibitors',
        meds: [
          { id: 'jardiance',  brandName: 'Jardiance',  genericName: 'empagliflozin' },
          { id: 'farxiga',    brandName: 'Farxiga',    genericName: 'dapagliflozin' },
          { id: 'invokana',   brandName: 'Invokana',   genericName: 'canagliflozin' },
        ],
      },
      {
        id: 'metformin',
        groupKey: 'diabetes',
        label: 'Metformin',
        meds: [
          // Metformin variants grouped with slashes — same active ingredient
          { id: 'metformin_group', brandName: 'Glucomin / Glucophage / Metformin', genericName: 'metformin' },
        ],
      },
      {
        id: 'insulin',
        groupKey: 'diabetes',
        label: 'Insulin',
        meds: [
          { id: 'lantus',              brandName: 'Lantus',               genericName: 'insulin glargine' },
          { id: 'basaglar',            brandName: 'Basaglar',             genericName: 'insulin glargine' },
          { id: 'novorapid',           brandName: 'NovoRapid',            genericName: 'insulin aspart' },
          { id: 'humalog',             brandName: 'Humalog',              genericName: 'insulin lispro' },
          { id: 'basalInsulin',        brandName: 'Basal Insulin',        genericName: 'long-acting insulin' },
          { id: 'shortActingInsulin',  brandName: 'Short-Acting Insulin', genericName: 'rapid-acting insulin' },
        ],
      },
      {
        // Combined / combination diabetes medications
        id: 'combinedDiabetesMeds',
        groupKey: 'diabetes',
        label: 'Combined Diabetes Medications',
        meds: [
          { id: 'jardiance_duo', brandName: 'Jardiance Duo', genericName: 'empagliflozin/metformin' },
          { id: 'janumet',       brandName: 'Janumet',       genericName: 'sitagliptin/metformin' },
          { id: 'duplex',        brandName: 'Duplex',        genericName: 'combination tablet' },
        ],
      },
    ],
  },

  // ─── High Blood Pressure ───────────────────────────────────────────────────
  {
    condition: 'hypertension',
    conditionLabel: 'High Blood Pressure',
    groups: [
      {
        id: 'arbs',
        groupKey: 'bloodPressure',
        label: 'ARBs (Angiotensin Receptor Blockers)',
        meds: [
          // Cozaar replaced by Losdex/Losartan grouped alias
          { id: 'losartan',   brandName: 'Losdex / Losartan', genericName: 'losartan' },
          { id: 'diovan',     brandName: 'Diovan',            genericName: 'valsartan' },
          { id: 'atacand',    brandName: 'Atacand',           genericName: 'candesartan' },
          // Micardis (telmisartan) removed per product update
        ],
      },
      {
        id: 'aceInhibitors',
        groupKey: 'bloodPressure',
        label: 'ACE Inhibitors',
        meds: [
          { id: 'tritace',   brandName: 'Tritace',           genericName: 'ramipril' },
          // Enalapril grouped with Israeli brand Enaldex
          { id: 'enalapril', brandName: 'Enaldex / Enalapril', genericName: 'enalapril' },
          // Lisinopril with Oxar (Israeli brand for lisinopril); Coversyl/perindopril replaced
          { id: 'lisinopril', brandName: 'Oxar / Lisinopril', genericName: 'lisinopril' },
          // Captopril added
          { id: 'captopril', brandName: 'Captopril',         genericName: 'captopril' },
        ],
      },
      {
        id: 'ccb',
        groupKey: 'bloodPressure',
        label: 'Calcium Channel Blockers',
        meds: [
          // Norvasc + Amlo (Israeli brand for amlodipine) grouped together
          { id: 'amlodipine',    brandName: 'Norvasc / Amlo',       genericName: 'amlodipine' },
          // Nifedipine variants (Adalat is a brand) grouped
          { id: 'nifedipine',    brandName: 'Adalat / Nifedipine',  genericName: 'nifedipine' },
          // Lercanidipine brands
          { id: 'lercanidipine', brandName: 'Vasodip / Lercapress', genericName: 'lercanidipine' },
          // Verapamil with Israeli brand Ikacor
          { id: 'verapamil',     brandName: 'Ikacor / Verapamil',   genericName: 'verapamil' },
          // Diltiazem with Israeli brand Dilitam
          { id: 'diltiazem',     brandName: 'Diltiazem / Dilitam',  genericName: 'diltiazem' },
        ],
      },
      {
        id: 'betaBlockers',
        groupKey: 'bloodPressure',
        label: 'Beta-Blockers',
        meds: [
          // Carvedilol — Coreg replaced by Carvidexon/Carvedilol grouped alias
          { id: 'carvedilol',    brandName: 'Carvidexon / Carvedilol', genericName: 'carvedilol' },
          // Bisoprolol with Israeli brand Cardiloc
          { id: 'bisoprolol',    brandName: 'Bisoprolol / Cardiloc',   genericName: 'bisoprolol' },
          { id: 'atenolol',      brandName: 'Atenolol',                genericName: 'atenolol' },
          // Propranolol brands grouped (Normalol, Propranolol, Deralin — same molecule)
          { id: 'propranolol',   brandName: 'Normalol / Propranolol / Deralin', genericName: 'propranolol' },
        ],
      },
      {
        id: 'diuretics',
        groupKey: 'bloodPressure',
        label: 'Diuretics',
        meds: [
          // Spironolactone + Aldactone (brand alias) grouped together
          { id: 'spironolactone', brandName: 'Spironolactone / Aldactone', genericName: 'spironolactone' },
          { id: 'fusid',          brandName: 'Fusid',                      genericName: 'furosemide' },
          // Lasix removed (duplicate furosemide brand — Fusid kept)
          { id: 'hct',            brandName: 'HCT',                        genericName: 'hydrochlorothiazide' },
          // Thiazides added as a class entry
          { id: 'thiazides',      brandName: 'Thiazides',                  genericName: 'thiazide diuretics' },
        ],
      },
    ],
  },

  // ─── High Blood Lipids (renamed from Dyslipidemia) ────────────────────────
  {
    // condition key preserved for backward compatibility with saved data
    condition: 'dyslipidemia',
    // conditionLabel updated to "High Blood Lipids" per product requirement
    conditionLabel: 'High Blood Lipids',
    groups: [
      {
        id: 'statins',
        groupKey: 'miscellaneous',
        label: 'Statins',
        meds: [
          { id: 'lipitor',      brandName: 'Lipitor',     genericName: 'atorvastatin' },
          { id: 'crestor',      brandName: 'Crestor',     genericName: 'rosuvastatin' },
          // Zocor (simvastatin brand) removed; Simvastatin generic added
          { id: 'simvastatin',  brandName: 'Simvastatin', genericName: 'simvastatin' },
          // Pravachol removed; Pravlip (pravastatin brand) added
          { id: 'pravlip',      brandName: 'Pravlip',     genericName: 'pravastatin' },
          // Azcor (atorvastatin/rosuvastatin Israeli brand) added
          { id: 'azcor',        brandName: 'Azcor',       genericName: 'atorvastatin' },
        ],
      },
      {
        id: 'cholesterolOther',
        groupKey: 'miscellaneous',
        label: 'Other Cholesterol Medications',
        meds: [
          { id: 'ezetrol',   brandName: 'Ezetrol',   genericName: 'ezetimibe' },
          { id: 'repatha',   brandName: 'Repatha',   genericName: 'evolocumab' },
          { id: 'praluent',  brandName: 'Praluent',  genericName: 'alirocumab' },
        ],
      },
    ],
  },

  // ─── Ischemic Heart Disease ────────────────────────────────────────────────
  {
    condition: 'ischemicHeartDisease',
    conditionLabel: 'Ischemic Heart Disease',
    groups: [
      {
        id: 'antiplatelet',
        groupKey: 'bloodThinners',
        label: 'Antiplatelets & Anticoagulants',
        meds: [
          { id: 'plavix',    brandName: 'Plavix',             genericName: 'clopidogrel' },
          // Brilinta added
          { id: 'brilinta',  brandName: 'Brilinta',           genericName: 'ticagrelor' },
          // Effient added
          { id: 'effient',   brandName: 'Effient',            genericName: 'prasugrel' },
          { id: 'eliquis',   brandName: 'Eliquis',            genericName: 'apixaban' },
          { id: 'xarelto',   brandName: 'Xarelto',            genericName: 'rivaroxaban' },
          { id: 'pradaxa',   brandName: 'Pradaxa',            genericName: 'dabigatran' },
          { id: 'coumadin',  brandName: 'Coumadin',           genericName: 'warfarin' },
          // Aspirin + Cartia (aspirin brand) grouped
          { id: 'aspirin',   brandName: 'Aspirin / Cartia',   genericName: 'aspirin' },
        ],
      },
      {
        id: 'cardiacOther',
        groupKey: 'cardiac',
        label: 'Cardiac Medications',
        meds: [
          { id: 'entresto',   brandName: 'Entresto',          genericName: 'sacubitril/valsartan' },
          { id: 'digoxin',    brandName: 'Digoxin',           genericName: 'digoxin' },
          // Amiodarone with Israeli brand Procor
          { id: 'amiodarone', brandName: 'Procor / Amiodarone', genericName: 'amiodarone' },
          // Antiarrhythmics added
          { id: 'multaq',     brandName: 'Multaq',            genericName: 'dronedarone' },
          { id: 'rytmex',     brandName: 'Rytmex',            genericName: 'propafenone' },
        ],
      },
    ],
  },

  // ─── Previous Stroke ──────────────────────────────────────────────────────
  {
    condition: 'previousStroke',
    conditionLabel: 'Previous Stroke',
    groups: [
      {
        // same id as ischemicHeartDisease → deduplicates if both selected
        id: 'antiplatelet',
        groupKey: 'bloodThinners',
        label: 'Antiplatelets & Anticoagulants',
        meds: [
          { id: 'plavix',   brandName: 'Plavix',           genericName: 'clopidogrel' },
          { id: 'brilinta', brandName: 'Brilinta',         genericName: 'ticagrelor' },
          { id: 'eliquis',  brandName: 'Eliquis',          genericName: 'apixaban' },
          { id: 'xarelto',  brandName: 'Xarelto',          genericName: 'rivaroxaban' },
          { id: 'coumadin', brandName: 'Coumadin',         genericName: 'warfarin' },
          { id: 'aspirin',  brandName: 'Aspirin / Cartia', genericName: 'aspirin' },
        ],
      },
    ],
  },

  // ─── Heart Failure (new condition) ────────────────────────────────────────
  {
    condition: 'heartFailure',
    conditionLabel: 'Heart Failure',
    groups: [
      {
        id: 'heartFailureMeds',
        groupKey: 'cardiac',
        label: 'Heart Failure Medications',
        meds: [
          { id: 'entresto_hf',   brandName: 'Entresto',                   genericName: 'sacubitril/valsartan' },
          { id: 'digoxin_hf',    brandName: 'Digoxin',                    genericName: 'digoxin' },
          { id: 'carvedilol_hf', brandName: 'Carvidexon / Carvedilol',    genericName: 'carvedilol' },
          { id: 'bisoprolol_hf', brandName: 'Bisoprolol / Cardiloc',      genericName: 'bisoprolol' },
          { id: 'furosemide_hf', brandName: 'Fusid',                      genericName: 'furosemide' },
          { id: 'spirono_hf',    brandName: 'Spironolactone / Aldactone', genericName: 'spironolactone' },
        ],
      },
    ],
  },

  // ─── Atrial Fibrillation (new condition) ──────────────────────────────────
  {
    condition: 'atrialFibrillation',
    conditionLabel: 'Atrial Fibrillation',
    groups: [
      {
        // Shares id with antiplatelet group → deduplicates if ischemic heart disease also selected
        id: 'antiplatelet',
        groupKey: 'bloodThinners',
        label: 'Anticoagulants',
        meds: [
          { id: 'eliquis',  brandName: 'Eliquis',  genericName: 'apixaban' },
          { id: 'xarelto',  brandName: 'Xarelto',  genericName: 'rivaroxaban' },
          { id: 'pradaxa',  brandName: 'Pradaxa',  genericName: 'dabigatran' },
          { id: 'coumadin', brandName: 'Coumadin', genericName: 'warfarin' },
        ],
      },
      {
        id: 'afibRateRhythm',
        groupKey: 'cardiac',
        label: 'Rate & Rhythm Control',
        meds: [
          { id: 'digoxin_af',    brandName: 'Digoxin',              genericName: 'digoxin' },
          { id: 'bisoprolol_af', brandName: 'Bisoprolol / Cardiloc', genericName: 'bisoprolol' },
          { id: 'amiodarone_af', brandName: 'Procor / Amiodarone',  genericName: 'amiodarone' },
          { id: 'multaq_af',     brandName: 'Multaq',               genericName: 'dronedarone' },
        ],
      },
    ],
  },

  // ─── Asthma ───────────────────────────────────────────────────────────────
  {
    condition: 'asthma',
    conditionLabel: 'Asthma',
    groups: [
      {
        id: 'asthmaInhalers',
        groupKey: 'miscellaneous',
        label: 'Inhalers & Respiratory',
        meds: [
          { id: 'ventolin',   brandName: 'Ventolin',   genericName: 'salbutamol' },
          { id: 'budicort',   brandName: 'Budicort',   genericName: 'budesonide' },
          { id: 'symbicort',  brandName: 'Symbicort',  genericName: 'budesonide/formoterol' },
          { id: 'seretide',   brandName: 'Seretide',   genericName: 'fluticasone/salmeterol' },
          { id: 'bricalin',   brandName: 'Bricalin',   genericName: 'terbutaline' },
          { id: 'aerovent',   brandName: 'Aerovent',   genericName: 'ipratropium' },
        ],
      },
    ],
  },

  // ─── COPD ─────────────────────────────────────────────────────────────────
  {
    condition: 'copd',
    conditionLabel: 'COPD',
    groups: [
      {
        id: 'copdInhalers',
        groupKey: 'miscellaneous',
        label: 'COPD Inhalers',
        meds: [
          { id: 'spiriva',          brandName: 'Spiriva',            genericName: 'tiotropium' },
          { id: 'ventolin2',        brandName: 'Ventolin',           genericName: 'salbutamol' },
          { id: 'budicort2',        brandName: 'Budicort',           genericName: 'budesonide' },
          { id: 'aerovent2',        brandName: 'Aerovent',           genericName: 'ipratropium' },
          { id: 'bricalin2',        brandName: 'Bricalin',           genericName: 'terbutaline' },
          { id: 'hypertonicSaline', brandName: 'Hypertonic Saline',  genericName: 'NaCl 3-6%' },
          { id: 'coliracin',        brandName: 'Colistin Inhaled',   genericName: 'colistin (inhaled)' },
        ],
      },
    ],
  },

  // ─── Hypothyroidism ───────────────────────────────────────────────────────
  {
    condition: 'hypothyroidism',
    conditionLabel: 'Hypothyroidism',
    groups: [
      {
        id: 'thyroid',
        groupKey: 'miscellaneous',
        label: 'Thyroid Medications',
        meds: [
          { id: 'eltroxi',    brandName: 'Eltroxi',    genericName: 'levothyroxine' },
          { id: 'synthroid',  brandName: 'Synthroid',  genericName: 'levothyroxine' },
          { id: 'eutroxsig',  brandName: 'Eutroxsig',  genericName: 'levothyroxine' },
        ],
      },
    ],
  },

  // ─── Cancer ───────────────────────────────────────────────────────────────
  {
    condition: 'cancer',
    conditionLabel: 'Cancer',
    groups: [
      {
        id: 'immunosuppressantsCancer',
        groupKey: 'immunosuppressants',
        label: 'Immunosuppressants & Biologics',
        meds: [
          { id: 'prednisone',  brandName: 'Prednisone',  genericName: 'prednisone' },
          { id: 'mtx',         brandName: 'MTX',         genericName: 'methotrexate' },
          { id: 'rituximab',   brandName: 'Rituximab',   genericName: 'rituximab' },
          { id: 'actemra',     brandName: 'Actemra',     genericName: 'tocilizumab' },
        ],
      },
    ],
  },

  // ─── Immunocompromised (new condition) ────────────────────────────────────
  {
    condition: 'immunocompromised',
    conditionLabel: 'Immunocompromised',
    groups: [
      {
        id: 'immunosuppressantsGeneral',
        groupKey: 'immunosuppressants',
        label: 'Immunosuppressants',
        meds: [
          { id: 'prednisone_ic', brandName: 'Prednisone',  genericName: 'prednisone' },
          { id: 'mtx_ic',        brandName: 'MTX',         genericName: 'methotrexate' },
          { id: 'rituximab_ic',  brandName: 'Rituximab',   genericName: 'rituximab' },
        ],
      },
    ],
  },
];

export type ActiveMedGroup = MedGroup & { conditionLabel: string };

export function getActiveMedGroups(
  medicalHistory: Record<string, boolean | string>
): ActiveMedGroup[] {
  const seenIds = new Set<string>();
  const result: ActiveMedGroup[] = [];

  for (const condConfig of MEDICATION_MAPPING) {
    if (medicalHistory[condConfig.condition] === true) {
      for (const group of condConfig.groups) {
        if (!seenIds.has(group.id)) {
          seenIds.add(group.id);
          result.push({ ...group, conditionLabel: condConfig.conditionLabel });
        }
      }
    }
  }

  return result;
}
