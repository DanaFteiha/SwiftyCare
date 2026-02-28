export type MedGroupKey = 'bloodPressure' | 'diabetes' | 'bloodThinners' | 'immunosuppressants' | 'miscellaneous';

export interface Med {
  id: string;
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
  {
    condition: 'diabetes',
    conditionLabel: 'Diabetes',
    groups: [
      {
        id: 'glp1',
        groupKey: 'diabetes',
        label: 'GLP-1 Agonists',
        meds: [
          { id: 'ozempic', brandName: 'Ozempic', genericName: 'semaglutide' },
          { id: 'mounjaro', brandName: 'Mounjaro', genericName: 'tirzepatide' },
          { id: 'victoza', brandName: 'Victoza', genericName: 'liraglutide' },
          { id: 'trulicity', brandName: 'Trulicity', genericName: 'dulaglutide' },
          { id: 'byetta', brandName: 'Byetta', genericName: 'exenatide' },
        ],
      },
      {
        id: 'sglt2',
        groupKey: 'diabetes',
        label: 'SGLT-2 Inhibitors',
        meds: [
          { id: 'jardiance', brandName: 'Jardiance', genericName: 'empagliflozin' },
          { id: 'farxiga', brandName: 'Farxiga', genericName: 'dapagliflozin' },
          { id: 'invokana', brandName: 'Invokana', genericName: 'canagliflozin' },
        ],
      },
      {
        id: 'metformin',
        groupKey: 'diabetes',
        label: 'Metformin',
        meds: [
          { id: 'glucomin', brandName: 'Glucomin', genericName: 'metformin' },
          { id: 'glucophage', brandName: 'Glucophage', genericName: 'metformin' },
        ],
      },
      {
        id: 'insulin',
        groupKey: 'diabetes',
        label: 'Insulin',
        meds: [
          { id: 'lantus', brandName: 'Lantus', genericName: 'insulin glargine' },
          { id: 'basaglar', brandName: 'Basaglar', genericName: 'insulin glargine' },
          { id: 'novorapid', brandName: 'NovoRapid', genericName: 'insulin aspart' },
          { id: 'humalog', brandName: 'Humalog', genericName: 'insulin lispro' },
          { id: 'basalInsulin', brandName: 'Basal Insulin', genericName: 'long-acting insulin' },
          { id: 'shortActingInsulin', brandName: 'Short-Acting Insulin', genericName: 'rapid-acting insulin' },
        ],
      },
    ],
  },
  {
    condition: 'hypertension',
    conditionLabel: 'High Blood Pressure',
    groups: [
      {
        id: 'arbs',
        groupKey: 'bloodPressure',
        label: 'ARBs (Angiotensin Receptor Blockers)',
        meds: [
          { id: 'cozaar', brandName: 'Cozaar', genericName: 'losartan' },
          { id: 'diovan', brandName: 'Diovan', genericName: 'valsartan' },
          { id: 'atacand', brandName: 'Atacand', genericName: 'candesartan' },
          { id: 'micardis', brandName: 'Micardis', genericName: 'telmisartan' },
        ],
      },
      {
        id: 'aceInhibitors',
        groupKey: 'bloodPressure',
        label: 'ACE Inhibitors',
        meds: [
          { id: 'tritace', brandName: 'Tritace', genericName: 'ramipril' },
          { id: 'enalapril', brandName: 'Enalapril', genericName: 'enalapril' },
          { id: 'lisinopril', brandName: 'Lisinopril', genericName: 'lisinopril' },
          { id: 'coversyl', brandName: 'Coversyl', genericName: 'perindopril' },
        ],
      },
      {
        id: 'ccb',
        groupKey: 'bloodPressure',
        label: 'Calcium Channel Blockers',
        meds: [
          { id: 'norvasc', brandName: 'Norvasc', genericName: 'amlodipine' },
          { id: 'nifedipine', brandName: 'Nifedipine', genericName: 'nifedipine' },
          { id: 'adalat', brandName: 'Adalat', genericName: 'nifedipine' },
        ],
      },
      {
        id: 'betaBlockers',
        groupKey: 'bloodPressure',
        label: 'Beta-Blockers',
        meds: [
          { id: 'coreg', brandName: 'Coreg', genericName: 'carvedilol' },
          { id: 'bisoprolol', brandName: 'Bisoprolol', genericName: 'bisoprolol' },
          { id: 'atenolol', brandName: 'Atenolol', genericName: 'atenolol' },
          { id: 'normalol', brandName: 'Normalol', genericName: 'propranolol' },
        ],
      },
      {
        id: 'diuretics',
        groupKey: 'bloodPressure',
        label: 'Diuretics',
        meds: [
          { id: 'spironolactone', brandName: 'Spironolactone', genericName: 'spironolactone' },
          { id: 'fusid', brandName: 'Fusid', genericName: 'furosemide' },
          { id: 'lasix', brandName: 'Lasix', genericName: 'furosemide' },
          { id: 'hct', brandName: 'HCT', genericName: 'hydrochlorothiazide' },
        ],
      },
    ],
  },
  {
    condition: 'dyslipidemia',
    conditionLabel: 'Dyslipidemia',
    groups: [
      {
        id: 'statins',
        groupKey: 'miscellaneous',
        label: 'Statins',
        meds: [
          { id: 'lipitor', brandName: 'Lipitor', genericName: 'atorvastatin' },
          { id: 'crestor', brandName: 'Crestor', genericName: 'rosuvastatin' },
          { id: 'zocor', brandName: 'Zocor', genericName: 'simvastatin' },
          { id: 'pravachol', brandName: 'Pravachol', genericName: 'pravastatin' },
        ],
      },
      {
        id: 'cholesterolOther',
        groupKey: 'miscellaneous',
        label: 'Other Cholesterol Medications',
        meds: [
          { id: 'ezetrol', brandName: 'Ezetrol', genericName: 'ezetimibe' },
          { id: 'repatha', brandName: 'Repatha', genericName: 'evolocumab' },
          { id: 'praluent', brandName: 'Praluent', genericName: 'alirocumab' },
        ],
      },
    ],
  },
  {
    condition: 'ischemicHeartDisease',
    conditionLabel: 'Ischemic Heart Disease',
    groups: [
      {
        id: 'antiplatelet',
        groupKey: 'bloodThinners',
        label: 'Antiplatelets & Anticoagulants',
        meds: [
          { id: 'plavix', brandName: 'Plavix', genericName: 'clopidogrel' },
          { id: 'eliquis', brandName: 'Eliquis', genericName: 'apixaban' },
          { id: 'xarelto', brandName: 'Xarelto', genericName: 'rivaroxaban' },
          { id: 'pradaxa', brandName: 'Pradaxa', genericName: 'dabigatran' },
          { id: 'coumadin', brandName: 'Coumadin', genericName: 'warfarin' },
          { id: 'aspirin', brandName: 'Aspirin', genericName: 'aspirin' },
        ],
      },
      {
        id: 'cardiacOther',
        groupKey: 'bloodThinners',
        label: 'Heart Failure & Cardiac',
        meds: [
          { id: 'entresto', brandName: 'Entresto', genericName: 'sacubitril/valsartan' },
          { id: 'digoxin', brandName: 'Digoxin', genericName: 'digoxin' },
          { id: 'amiodarone', brandName: 'Amiodarone', genericName: 'amiodarone' },
        ],
      },
    ],
  },
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
          { id: 'plavix', brandName: 'Plavix', genericName: 'clopidogrel' },
          { id: 'eliquis', brandName: 'Eliquis', genericName: 'apixaban' },
          { id: 'xarelto', brandName: 'Xarelto', genericName: 'rivaroxaban' },
          { id: 'coumadin', brandName: 'Coumadin', genericName: 'warfarin' },
          { id: 'aspirin', brandName: 'Aspirin', genericName: 'aspirin' },
        ],
      },
    ],
  },
  {
    condition: 'asthma',
    conditionLabel: 'Asthma',
    groups: [
      {
        id: 'asthmaInhalers',
        groupKey: 'miscellaneous',
        label: 'Inhalers & Respiratory',
        meds: [
          { id: 'ventolin', brandName: 'Ventolin', genericName: 'salbutamol' },
          { id: 'budicort', brandName: 'Budicort', genericName: 'budesonide' },
          { id: 'symbicort', brandName: 'Symbicort', genericName: 'budesonide/formoterol' },
          { id: 'seretide', brandName: 'Seretide', genericName: 'fluticasone/salmeterol' },
          { id: 'bricalin', brandName: 'Bricalin', genericName: 'terbutaline' },
          { id: 'aerovent', brandName: 'Aerovent', genericName: 'ipratropium' },
        ],
      },
    ],
  },
  {
    condition: 'copd',
    conditionLabel: 'COPD',
    groups: [
      {
        id: 'copdInhalers',
        groupKey: 'miscellaneous',
        label: 'COPD Inhalers',
        meds: [
          { id: 'spiriva', brandName: 'Spiriva', genericName: 'tiotropium' },
          { id: 'ventolin2', brandName: 'Ventolin', genericName: 'salbutamol' },
          { id: 'budicort2', brandName: 'Budicort', genericName: 'budesonide' },
          { id: 'aerovent2', brandName: 'Aerovent', genericName: 'ipratropium' },
          { id: 'bricalin2', brandName: 'Bricalin', genericName: 'terbutaline' },
          { id: 'hypertonicSaline', brandName: 'Hypertonic Saline', genericName: 'NaCl 3-6%' },
          { id: 'coliracin', brandName: 'Colistin Inhaled', genericName: 'colistin (inhaled)' },
        ],
      },
    ],
  },
  {
    condition: 'hypothyroidism',
    conditionLabel: 'Hypothyroidism',
    groups: [
      {
        id: 'thyroid',
        groupKey: 'miscellaneous',
        label: 'Thyroid Medications',
        meds: [
          { id: 'eltroxi', brandName: 'Eltroxi', genericName: 'levothyroxine' },
          { id: 'synthroid', brandName: 'Synthroid', genericName: 'levothyroxine' },
          { id: 'eutroxsig', brandName: 'Eutroxsig', genericName: 'levothyroxine' },
        ],
      },
    ],
  },
  {
    condition: 'cancer',
    conditionLabel: 'Cancer',
    groups: [
      {
        id: 'immunosuppressantsCancer',
        groupKey: 'immunosuppressants',
        label: 'Immunosuppressants & Biologics',
        meds: [
          { id: 'prednisone', brandName: 'Prednisone', genericName: 'prednisone' },
          { id: 'mtx', brandName: 'MTX', genericName: 'methotrexate' },
          { id: 'rituximab', brandName: 'Rituximab', genericName: 'rituximab' },
          { id: 'actemra', brandName: 'Actemra', genericName: 'tocilizumab' },
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
