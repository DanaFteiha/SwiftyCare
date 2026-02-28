import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, ArrowRight, ArrowLeft, CheckCircle, Globe, Heart, Brain, Wind, Pill, Activity, Scissors, Plus, AlertCircle, Check, AlertTriangle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getActiveMedGroups, type MedGroupKey } from '@/config/medicationMapping';
import {
  getPathwaysForIllnesses,
  getRedFlagsForPathway,
  isQuestionVisible,
  type SymptomPathway,
  type LocationSelection,
  type AdaptiveQuestionsData,
  type SymptomResponseEntry,
} from '@/config/symptomPathways';
import AbdomenLocationPicker from '@/components/questionnaire/AbdomenLocationPicker';
import HeadacheLocationPicker from '@/components/questionnaire/HeadacheLocationPicker';

interface QuestionnaireData {
  personalInfo: {
    gender: string;
    age: string;
    maritalStatus: string;
    cognitiveState: string;
    functionalState: string;
  };
  medicalHistory: {
    none: boolean;
    diabetes: boolean;
    hypertension: boolean;
    dyslipidemia: boolean;
    asthma: boolean;
    ischemicHeartDisease: boolean;
    cancer: boolean;
    previousStroke: boolean;
    hypothyroidism: boolean;
    copd: boolean;
    otherDiseases: boolean;
    otherDiseasesText: string;
    previousSurgeries: boolean;
  };
  medications: {
    allergies: {
      hasAllergies: string;
      allergyDetails: string;
    };
    groups: {
      bloodPressure: string[];
      diabetes: string[];
      bloodThinners: string[];
      immunosuppressants: string[];
      miscellaneous: string[];
    };
  };
  currentIllness: {
    chestPain: boolean;
    fever: boolean;
    injuryTrauma: boolean;
    swellingEdema: boolean;
    abdominalPain: boolean;
    shortnessOfBreath: boolean;
    changeInConsciousness: boolean;
    nauseaVomitingDiarrhea: boolean;
    headache: boolean;
    chestPainSternum: boolean;
    dizziness: boolean;
    neckPain: boolean;
    fatigueWeakness: boolean;
    jointPain: boolean;
    painInLimbs: boolean;
    earPain: boolean;
    eyeProblems: boolean;
    backPain: boolean;
    headInjury: boolean;
    injectionSitePain: boolean;
  };
  adaptiveQuestions: {
    chiefComplaint: string;
    currentPathway: string;
    responses: Record<string, any>;
    redFlags: string[];
    completed: boolean;
  };
  symptoms: {
    mainComplaint: string;
    severity: string;
    duration: string;
    additionalSymptoms: string[];
  };
  vitals: {
    bp: string;
    hr: string;
    spo2: string;
    temp: string;
    respRate: string;
    painScore: string;
  };
}

const initialData: QuestionnaireData = {
  personalInfo: {
    gender: '',
    age: '',
    maritalStatus: '',
    cognitiveState: '',
    functionalState: ''
  },
  medicalHistory: {
    none: false,
    diabetes: false,
    hypertension: false,
    dyslipidemia: false,
    asthma: false,
    ischemicHeartDisease: false,
    cancer: false,
    previousStroke: false,
    hypothyroidism: false,
    copd: false,
    otherDiseases: false,
    otherDiseasesText: '',
    previousSurgeries: false
  },
  medications: {
    allergies: {
      hasAllergies: '',
      allergyDetails: ''
    },
    groups: {
      bloodPressure: [],
      diabetes: [],
      bloodThinners: [],
      immunosuppressants: [],
      miscellaneous: []
    }
  },
  currentIllness: {
    chestPain: false,
    fever: false,
    injuryTrauma: false,
    swellingEdema: false,
    abdominalPain: false,
    shortnessOfBreath: false,
    changeInConsciousness: false,
    nauseaVomitingDiarrhea: false,
    headache: false,
    chestPainSternum: false,
    dizziness: false,
    neckPain: false,
    fatigueWeakness: false,
    jointPain: false,
    painInLimbs: false,
    earPain: false,
    eyeProblems: false,
    backPain: false,
    headInjury: false,
    injectionSitePain: false
  },
  adaptiveQuestions: {
    chiefComplaint: '',
    currentPathway: '',
    responses: {},
    redFlags: [],
    completed: false
  },
  symptoms: {
    mainComplaint: '',
    severity: '',
    duration: '',
    additionalSymptoms: []
  },
  vitals: {
    bp: '',
    hr: '',
    spo2: '',
    temp: '',
    respRate: '',
    painScore: ''
  }
};

// NOTE: Symptom pathway config has been extracted to apps/web/src/config/symptomPathways.ts
// The following block is the original config kept in place (no longer used) — will be removed in cleanup
/* eslint-disable */
const _LEGACY_ADAPTIVE_QUESTIONNAIRE_PLACEHOLDER: any = {
  pathways: {
    chestPain: {
      id: 'chestPain',
      name: 'Chest Pain',
      redFlags: ['acuteDistress', 'lossOfConsciousness', 'severePain'],
      questions: {
        painCharacteristics: {
          id: 'painCharacteristics',
          type: 'checkbox',
          label: 'Pain Characteristics',
          options: [
            { id: 'pressing', label: 'Pressing', triggers: [] },
            { id: 'burning', label: 'Burning', triggers: [] },
            { id: 'sharp', label: 'Sharp', triggers: ['radiationQuestions'] },
            { id: 'radiating', label: 'Radiating', triggers: ['radiationDetails'] }
          ]
        },
        location: {
          id: 'location',
          type: 'checkbox',
          label: 'Location',
          options: [
            { id: 'center', label: 'Center', triggers: [] },
            { id: 'leftSide', label: 'Left Side', triggers: ['cardiacQuestions'] },
            { id: 'behindBreastbone', label: 'Behind Breastbone', triggers: ['cardiacQuestions'] }
          ]
        },
        onset: {
          id: 'onset',
          type: 'select',
          label: 'Onset',
          options: [
            { id: 'sudden', label: 'Sudden', triggers: ['acuteQuestions'] },
            { id: 'gradual', label: 'Gradual', triggers: [] },
            { id: 'intermittent', label: 'Intermittent', triggers: [] }
          ]
        },
        duration: {
          id: 'duration',
          type: 'select',
          label: 'Duration',
          options: [
            { id: 'lessThan30min', label: 'Less than 30 minutes', triggers: [] },
            { id: 'min30To2hours', label: '30 minutes to 2 hours', triggers: [] },
            { id: 'moreThan2hours', label: 'More than 2 hours', triggers: [] },
            { id: 'everyHalfHour', label: 'Every half hour', triggers: ['frequencyQuestions'] }
          ]
        },
        radiationDetails: {
          id: 'radiationDetails',
          type: 'text',
          label: 'Radiation Details',
          condition: 'radiating',
          placeholder: 'Where does the pain radiate to?'
        },
        cardiacQuestions: {
          id: 'cardiacQuestions',
          type: 'checkbox',
          label: 'Associated Symptoms',
          condition: 'leftSide|behindBreastbone',
          options: [
            { id: 'shortnessOfBreath', label: 'Shortness of Breath', triggers: ['respiratoryQuestions'] },
            { id: 'nausea', label: 'Nausea', triggers: [] },
            { id: 'sweating', label: 'Sweating', triggers: [] },
            { id: 'dizziness', label: 'Dizziness', triggers: [] }
          ]
        },
        respiratoryQuestions: {
          id: 'respiratoryQuestions',
          type: 'select',
          label: 'Breathing Difficulty',
          condition: 'shortnessOfBreath',
          options: [
            { id: 'mild', label: 'Mild', triggers: [] },
            { id: 'moderate', label: 'Moderate', triggers: [] },
            { id: 'severe', label: 'Severe', triggers: ['redFlag'] }
          ]
        },
        acuteQuestions: {
          id: 'acuteQuestions',
          type: 'checkbox',
          label: 'Acute Symptoms',
          condition: 'sudden',
          options: [
            { id: 'severePain', label: 'Severe Pain (8-10/10)', triggers: ['redFlag'] },
            { id: 'lossOfConsciousness', label: 'Loss of Consciousness', triggers: ['redFlag'] },
            { id: 'acuteDistress', label: 'Acute Distress', triggers: ['redFlag'] }
          ]
        },
        frequencyQuestions: {
          id: 'frequencyQuestions',
          type: 'text',
          label: 'Frequency Details',
          condition: 'everyHalfHour',
          placeholder: 'Describe the frequency pattern'
        }
      }
    },
    fever: {
      id: 'fever',
      name: 'Fever',
      redFlags: ['highFever', 'alteredMentalStatus', 'severeHeadache'],
      questions: {
        temperature: {
          id: 'temperature',
          type: 'select',
          label: 'Temperature Range',
          options: [
            { id: 'lowGrade', label: 'Low Grade (37.1-38.0°C)', triggers: [] },
            { id: 'moderate', label: 'Moderate (38.1-39.0°C)', triggers: [] },
            { id: 'high', label: 'High (39.1-40.0°C)', triggers: ['highFeverQuestions'] },
            { id: 'veryHigh', label: 'Very High (>40.0°C)', triggers: ['redFlag'] }
          ]
        },
        duration: {
          id: 'duration',
          type: 'select',
          label: 'Duration',
          options: [
            { id: 'lessThan24hours', label: 'Less than 24 hours', triggers: [] },
            { id: '1to3days', label: '1-3 days', triggers: [] },
            { id: 'moreThan3days', label: 'More than 3 days', triggers: ['chronicFeverQuestions'] }
          ]
        },
        associatedSymptoms: {
          id: 'associatedSymptoms',
          type: 'checkbox',
          label: 'Associated Symptoms',
          options: [
            { id: 'headache', label: 'Headache', triggers: ['headacheQuestions'] },
            { id: 'bodyAches', label: 'Body Aches', triggers: [] },
            { id: 'chills', label: 'Chills', triggers: [] },
            { id: 'fatigue', label: 'Fatigue', triggers: [] }
          ]
        },
        headacheQuestions: {
          id: 'headacheQuestions',
          type: 'select',
          label: 'Headache Severity',
          condition: 'headache',
          options: [
            { id: 'mild', label: 'Mild', triggers: [] },
            { id: 'moderate', label: 'Moderate', triggers: [] },
            { id: 'severe', label: 'Severe', triggers: ['redFlag'] }
          ]
        },
        highFeverQuestions: {
          id: 'highFeverQuestions',
          type: 'checkbox',
          label: 'High Fever Symptoms',
          condition: 'high',
          options: [
            { id: 'alteredMentalStatus', label: 'Altered Mental Status', triggers: ['redFlag'] },
            { id: 'neckStiffness', label: 'Neck Stiffness', triggers: ['redFlag'] },
            { id: 'rash', label: 'Rash', triggers: ['rashQuestions'] }
          ]
        },
        chronicFeverQuestions: {
          id: 'chronicFeverQuestions',
          type: 'text',
          label: 'Chronic Fever Details',
          condition: 'moreThan3days',
          placeholder: 'Describe any additional symptoms'
        },
        rashQuestions: {
          id: 'rashQuestions',
          type: 'text',
          label: 'Rash Description',
          condition: 'rash',
          placeholder: 'Describe the rash appearance and location'
        }
      }
    },
    abdominalPain: {
      id: 'abdominalPain',
      name: 'Abdominal Pain',
      redFlags: ['severeAbdominalPain', 'rigidAbdomen', 'bloodyStools', 'persistentVomiting'],
      questions: {
        location: {
          id: 'location',
          type: 'select',
          label: 'Pain Location',
          options: [
            { id: 'upperRight', label: 'Upper Right', triggers: ['liverQuestions'] },
            { id: 'upperLeft', label: 'Upper Left', triggers: [] },
            { id: 'lowerRight', label: 'Lower Right', triggers: ['appendicitisQuestions'] },
            { id: 'lowerLeft', label: 'Lower Left', triggers: [] },
            { id: 'epigastric', label: 'Epigastric (Upper Center)', triggers: ['gastricQuestions'] },
            { id: 'periumbilical', label: 'Periumbilical (Around Navel)', triggers: ['appendicitisQuestions'] },
            { id: 'diffuse', label: 'Diffuse (All Over)', triggers: ['diffusePainQuestions'] }
          ]
        },
        painType: {
          id: 'painType',
          type: 'select',
          label: 'Type of Pain',
          options: [
            { id: 'cramping', label: 'Cramping', triggers: [] },
            { id: 'sharp', label: 'Sharp/Stabbing', triggers: ['acutePainQuestions'] },
            { id: 'dull', label: 'Dull/Aching', triggers: [] },
            { id: 'burning', label: 'Burning', triggers: ['gastricQuestions'] },
            { id: 'colicky', label: 'Colicky (Waves)', triggers: [] }
          ]
        },
        severity: {
          id: 'severity',
          type: 'select',
          label: 'Pain Severity (1-10)',
          options: [
            { id: 'mild', label: 'Mild (1-3)', triggers: [] },
            { id: 'moderate', label: 'Moderate (4-6)', triggers: [] },
            { id: 'severe', label: 'Severe (7-10)', triggers: ['redFlag'] }
          ]
        },
        duration: {
          id: 'duration',
          type: 'select',
          label: 'Duration',
          options: [
            { id: 'lessThan1hour', label: 'Less than 1 hour', triggers: [] },
            { id: '1to6hours', label: '1-6 hours', triggers: [] },
            { id: '6to24hours', label: '6-24 hours', triggers: [] },
            { id: 'moreThan24hours', label: 'More than 24 hours', triggers: ['chronicPainQuestions'] }
          ]
        },
        associatedSymptoms: {
          id: 'associatedSymptoms',
          type: 'checkbox',
          label: 'Associated Symptoms',
          options: [
            { id: 'nausea', label: 'Nausea', triggers: [] },
            { id: 'vomiting', label: 'Vomiting', triggers: ['vomitingQuestions'] },
            { id: 'diarrhea', label: 'Diarrhea', triggers: ['diarrheaQuestions'] },
            { id: 'constipation', label: 'Constipation', triggers: [] },
            { id: 'fever', label: 'Fever', triggers: [] },
            { id: 'bloodyStools', label: 'Bloody Stools', triggers: ['redFlag'] },
            { id: 'jaundice', label: 'Jaundice (Yellow Skin)', triggers: ['liverQuestions'] }
          ]
        },
        vomitingQuestions: {
          id: 'vomitingQuestions',
          type: 'select',
          label: 'Vomiting Frequency',
          condition: 'vomiting',
          options: [
            { id: 'occasional', label: 'Occasional (1-2 times)', triggers: [] },
            { id: 'frequent', label: 'Frequent (3-5 times)', triggers: [] },
            { id: 'persistent', label: 'Persistent (Cannot keep anything down)', triggers: ['redFlag'] }
          ]
        },
        diarrheaQuestions: {
          id: 'diarrheaQuestions',
          type: 'select',
          label: 'Diarrhea Characteristics',
          condition: 'diarrhea',
          options: [
            { id: 'watery', label: 'Watery', triggers: [] },
            { id: 'bloody', label: 'Bloody/Mucous', triggers: ['redFlag'] },
            { id: 'frequent', label: 'Very Frequent (>10 times/day)', triggers: ['redFlag'] }
          ]
        },
        appendicitisQuestions: {
          id: 'appendicitisQuestions',
          type: 'checkbox',
          label: 'Additional Symptoms',
          condition: 'lowerRight|periumbilical',
          options: [
            { id: 'reboundTenderness', label: 'Rebound Tenderness', triggers: ['redFlag'] },
            { id: 'rigidAbdomen', label: 'Rigid/Hard Abdomen', triggers: ['redFlag'] },
            { id: 'fever', label: 'Fever', triggers: [] }
          ]
        },
        liverQuestions: {
          id: 'liverQuestions',
          type: 'checkbox',
          label: 'Liver-Related Symptoms',
          condition: 'upperRight|jaundice',
          options: [
            { id: 'darkUrine', label: 'Dark Urine', triggers: [] },
            { id: 'paleStools', label: 'Pale Stools', triggers: [] },
            { id: 'jaundice', label: 'Jaundice', triggers: [] }
          ]
        },
        gastricQuestions: {
          id: 'gastricQuestions',
          type: 'checkbox',
          label: 'Gastric Symptoms',
          condition: 'epigastric|burning',
          options: [
            { id: 'worseAfterEating', label: 'Worse After Eating', triggers: [] },
            { id: 'betterAfterEating', label: 'Better After Eating', triggers: [] },
            { id: 'heartburn', label: 'Heartburn', triggers: [] }
          ]
        },
        diffusePainQuestions: {
          id: 'diffusePainQuestions',
          type: 'checkbox',
          label: 'Diffuse Pain Characteristics',
          condition: 'diffuse',
          options: [
            { id: 'rigidAbdomen', label: 'Rigid/Hard Abdomen', triggers: ['redFlag'] },
            { id: 'fever', label: 'Fever', triggers: [] },
            { id: 'distended', label: 'Distended Abdomen', triggers: [] }
          ]
        },
        acutePainQuestions: {
          id: 'acutePainQuestions',
          type: 'checkbox',
          label: 'Acute Pain Characteristics',
          condition: 'sharp',
          options: [
            { id: 'suddenOnset', label: 'Sudden Onset', triggers: ['redFlag'] },
            { id: 'rigidAbdomen', label: 'Rigid Abdomen', triggers: ['redFlag'] },
            { id: 'fever', label: 'Fever', triggers: [] }
          ]
        },
        chronicPainQuestions: {
          id: 'chronicPainQuestions',
          type: 'text',
          label: 'Chronic Pain Details',
          condition: 'moreThan24hours',
          placeholder: 'Describe the pain pattern and any triggers'
        }
      }
    },
    shortnessOfBreath: {
      id: 'shortnessOfBreath',
      name: 'Shortness of Breath',
      redFlags: ['severeDyspnea', 'cyanosis', 'inabilityToSpeak', 'chestPain'],
      questions: {
        severity: {
          id: 'severity',
          type: 'select',
          label: 'Severity',
          options: [
            { id: 'mild', label: 'Mild (Noticeable with exertion)', triggers: [] },
            { id: 'moderate', label: 'Moderate (With normal activity)', triggers: [] },
            { id: 'severe', label: 'Severe (At rest)', triggers: ['redFlag'] },
            { id: 'extreme', label: 'Extreme (Cannot speak in sentences)', triggers: ['redFlag'] }
          ]
        },
        onset: {
          id: 'onset',
          type: 'select',
          label: 'Onset',
          options: [
            { id: 'sudden', label: 'Sudden (<1 hour)', triggers: ['redFlag'] },
            { id: 'gradual', label: 'Gradual (Hours to days)', triggers: [] },
            { id: 'chronic', label: 'Chronic (Weeks to months)', triggers: ['chronicBreathingQuestions'] }
          ]
        },
        triggers: {
          id: 'triggers',
          type: 'checkbox',
          label: 'Triggers or Worsening Factors',
          options: [
            { id: 'exertion', label: 'Physical Exertion', triggers: [] },
            { id: 'lyingFlat', label: 'Lying Flat', triggers: ['heartFailureQuestions'] },
            { id: 'allergens', label: 'Allergens/Environmental', triggers: ['asthmaQuestions'] },
            { id: 'anxiety', label: 'Anxiety/Stress', triggers: [] },
            { id: 'none', label: 'No Clear Trigger', triggers: [] }
          ]
        },
        associatedSymptoms: {
          id: 'associatedSymptoms',
          type: 'checkbox',
          label: 'Associated Symptoms',
          options: [
            { id: 'chestPain', label: 'Chest Pain', triggers: ['redFlag'] },
            { id: 'wheezing', label: 'Wheezing', triggers: ['asthmaQuestions'] },
            { id: 'cough', label: 'Cough', triggers: ['coughQuestions'] },
            { id: 'fever', label: 'Fever', triggers: [] },
            { id: 'legSwelling', label: 'Leg Swelling', triggers: ['heartFailureQuestions'] },
            { id: 'cyanosis', label: 'Blue Lips/Fingers', triggers: ['redFlag'] },
            { id: 'dizziness', label: 'Dizziness', triggers: [] }
          ]
        },
        asthmaQuestions: {
          id: 'asthmaQuestions',
          type: 'checkbox',
          label: 'Asthma-Related Questions',
          condition: 'wheezing|allergens',
          options: [
            { id: 'knownAsthma', label: 'Known Asthma', triggers: [] },
            { id: 'inhalerUse', label: 'Uses Inhaler', triggers: [] },
            { id: 'noRelief', label: 'Inhaler Not Helping', triggers: ['redFlag'] }
          ]
        },
        coughQuestions: {
          id: 'coughQuestions',
          type: 'select',
          label: 'Cough Characteristics',
          condition: 'cough',
          options: [
            { id: 'dry', label: 'Dry', triggers: [] },
            { id: 'productive', label: 'Productive (With Phlegm)', triggers: ['phlegmQuestions'] },
            { id: 'bloody', label: 'Bloody', triggers: ['redFlag'] }
          ]
        },
        phlegmQuestions: {
          id: 'phlegmQuestions',
          type: 'select',
          label: 'Phlegm Color',
          condition: 'productive',
          options: [
            { id: 'clear', label: 'Clear/White', triggers: [] },
            { id: 'yellow', label: 'Yellow', triggers: [] },
            { id: 'green', label: 'Green', triggers: [] },
            { id: 'bloody', label: 'Bloody', triggers: ['redFlag'] }
          ]
        },
        heartFailureQuestions: {
          id: 'heartFailureQuestions',
          type: 'checkbox',
          label: 'Heart-Related Symptoms',
          condition: 'lyingFlat|legSwelling',
          options: [
            { id: 'orthopnea', label: 'Worse When Lying Down', triggers: [] },
            { id: 'paroxysmal', label: 'Wakes Up Gasping', triggers: ['redFlag'] },
            { id: 'ankleSwelling', label: 'Ankle/Leg Swelling', triggers: [] }
          ]
        },
        chronicBreathingQuestions: {
          id: 'chronicBreathingQuestions',
          type: 'checkbox',
          label: 'Chronic Symptoms',
          condition: 'chronic',
          options: [
            { id: 'smoking', label: 'Smoking History', triggers: [] },
            { id: 'worseOverTime', label: 'Getting Worse Over Time', triggers: [] },
            { id: 'morningCough', label: 'Morning Cough', triggers: [] }
          ]
        }
      }
    },
    headache: {
      id: 'headache',
      name: 'Headache',
      redFlags: ['suddenSevere', 'worstHeadache', 'alteredMentalStatus', 'neckStiffness', 'visualChanges'],
      questions: {
        type: {
          id: 'type',
          type: 'select',
          label: 'Headache Type',
          options: [
            { id: 'tension', label: 'Tension/Pressure', triggers: [] },
            { id: 'throbbing', label: 'Throbbing/Pulsating', triggers: ['migraineQuestions'] },
            { id: 'stabbing', label: 'Sharp/Stabbing', triggers: [] },
            { id: 'pressure', label: 'Pressure/Fullness', triggers: [] }
          ]
        },
        location: {
          id: 'location',
          type: 'select',
          label: 'Location',
          options: [
            { id: 'frontal', label: 'Frontal (Forehead)', triggers: [] },
            { id: 'temporal', label: 'Temporal (Sides)', triggers: ['migraineQuestions'] },
            { id: 'occipital', label: 'Occipital (Back of Head)', triggers: [] },
            { id: 'diffuse', label: 'Diffuse (All Over)', triggers: [] },
            { id: 'unilateral', label: 'One Side Only', triggers: ['migraineQuestions'] }
          ]
        },
        severity: {
          id: 'severity',
          type: 'select',
          label: 'Severity (1-10)',
          options: [
            { id: 'mild', label: 'Mild (1-4)', triggers: [] },
            { id: 'moderate', label: 'Moderate (5-7)', triggers: [] },
            { id: 'severe', label: 'Severe (8-10)', triggers: ['severeHeadacheQuestions'] },
            { id: 'worstEver', label: 'Worst Headache of Life', triggers: ['redFlag'] }
          ]
        },
        onset: {
          id: 'onset',
          type: 'select',
          label: 'Onset',
          options: [
            { id: 'sudden', label: 'Sudden (Seconds to minutes)', triggers: ['redFlag'] },
            { id: 'rapid', label: 'Rapid (Minutes to hours)', triggers: [] },
            { id: 'gradual', label: 'Gradual (Hours to days)', triggers: [] }
          ]
        },
        duration: {
          id: 'duration',
          type: 'select',
          label: 'Duration',
          options: [
            { id: 'minutes', label: 'Minutes', triggers: [] },
            { id: 'hours', label: 'Hours', triggers: [] },
            { id: 'days', label: 'Days', triggers: [] },
            { id: 'chronic', label: 'Chronic/Recurrent', triggers: ['chronicHeadacheQuestions'] }
          ]
        },
        triggers: {
          id: 'triggers',
          type: 'checkbox',
          label: 'Triggers or Associated Factors',
          options: [
            { id: 'stress', label: 'Stress', triggers: [] },
            { id: 'light', label: 'Light Sensitivity', triggers: ['migraineQuestions'] },
            { id: 'sound', label: 'Sound Sensitivity', triggers: ['migraineQuestions'] },
            { id: 'movement', label: 'Worse with Movement', triggers: [] },
            { id: 'recentInjury', label: 'Recent Head Injury', triggers: ['redFlag'] }
          ]
        },
        associatedSymptoms: {
          id: 'associatedSymptoms',
          type: 'checkbox',
          label: 'Associated Symptoms',
          options: [
            { id: 'nausea', label: 'Nausea', triggers: ['migraineQuestions'] },
            { id: 'vomiting', label: 'Vomiting', triggers: ['migraineQuestions'] },
            { id: 'visualChanges', label: 'Visual Changes/Aura', triggers: ['redFlag'] },
            { id: 'neckStiffness', label: 'Neck Stiffness', triggers: ['redFlag'] },
            { id: 'fever', label: 'Fever', triggers: ['redFlag'] },
            { id: 'alteredMentalStatus', label: 'Confusion/Altered Mental Status', triggers: ['redFlag'] },
            { id: 'seizure', label: 'Seizure', triggers: ['redFlag'] }
          ]
        },
        migraineQuestions: {
          id: 'migraineQuestions',
          type: 'checkbox',
          label: 'Migraine Characteristics',
          condition: 'throbbing|temporal|unilateral|light|sound|nausea|vomiting',
          options: [
            { id: 'knownMigraine', label: 'History of Migraines', triggers: [] },
            { id: 'aura', label: 'Aura Before Headache', triggers: [] },
            { id: 'reliefWithRest', label: 'Relief with Rest/Dark Room', triggers: [] }
          ]
        },
        severeHeadacheQuestions: {
          id: 'severeHeadacheQuestions',
          type: 'checkbox',
          label: 'Severe Headache Red Flags',
          condition: 'severe',
          options: [
            { id: 'worstEver', label: 'Worst Headache Ever', triggers: ['redFlag'] },
            { id: 'suddenOnset', label: 'Sudden Onset', triggers: ['redFlag'] },
            { id: 'neckStiffness', label: 'Neck Stiffness', triggers: ['redFlag'] },
            { id: 'fever', label: 'Fever', triggers: ['redFlag'] }
          ]
        },
        chronicHeadacheQuestions: {
          id: 'chronicHeadacheQuestions',
          type: 'text',
          label: 'Chronic Headache Details',
          condition: 'chronic',
          placeholder: 'Describe frequency, pattern, and any known causes'
        }
      }
    },
    injuryTrauma: {
      id: 'injuryTrauma',
      name: 'Injury/Trauma',
      redFlags: ['severeTrauma', 'openWound', 'deformity', 'lossOfSensation', 'inabilityToMove'],
      questions: {
        mechanism: {
          id: 'mechanism',
          type: 'select',
          label: 'Mechanism of Injury',
          options: [
            { id: 'fall', label: 'Fall', triggers: ['fallQuestions'] },
            { id: 'motorVehicle', label: 'Motor Vehicle Accident', triggers: ['redFlag'] },
            { id: 'sports', label: 'Sports Injury', triggers: [] },
            { id: 'assault', label: 'Assault', triggers: ['redFlag'] },
            { id: 'penetrating', label: 'Penetrating Injury', triggers: ['redFlag'] },
            { id: 'crush', label: 'Crush Injury', triggers: ['redFlag'] }
          ]
        },
        bodyPart: {
          id: 'bodyPart',
          type: 'checkbox',
          label: 'Injured Body Part(s)',
          options: [
            { id: 'head', label: 'Head', triggers: ['headInjuryQuestions'] },
            { id: 'neck', label: 'Neck', triggers: ['redFlag'] },
            { id: 'chest', label: 'Chest', triggers: ['redFlag'] },
            { id: 'abdomen', label: 'Abdomen', triggers: ['redFlag'] },
            { id: 'back', label: 'Back/Spine', triggers: ['redFlag'] },
            { id: 'extremity', label: 'Arm/Leg', triggers: ['extremityQuestions'] }
          ]
        },
        severity: {
          id: 'severity',
          type: 'select',
          label: 'Injury Severity',
          options: [
            { id: 'minor', label: 'Minor (Superficial)', triggers: [] },
            { id: 'moderate', label: 'Moderate (Visible Injury)', triggers: [] },
            { id: 'severe', label: 'Severe (Obvious Deformity)', triggers: ['redFlag'] }
          ]
        },
        woundType: {
          id: 'woundType',
          type: 'checkbox',
          label: 'Wound Characteristics',
          options: [
            { id: 'abrasion', label: 'Abrasion/Scrape', triggers: [] },
            { id: 'laceration', label: 'Laceration/Cut', triggers: ['woundQuestions'] },
            { id: 'puncture', label: 'Puncture', triggers: ['redFlag'] },
            { id: 'open', label: 'Open Wound (Bone Visible)', triggers: ['redFlag'] },
            { id: 'bruising', label: 'Bruising/Swelling', triggers: [] }
          ]
        },
        woundQuestions: {
          id: 'woundQuestions',
          type: 'checkbox',
          label: 'Wound Details',
          condition: 'laceration',
          options: [
            { id: 'bleeding', label: 'Active Bleeding', triggers: ['bleedingQuestions'] },
            { id: 'deep', label: 'Deep (>1cm)', triggers: [] },
            { id: 'dirty', label: 'Dirty/Contaminated', triggers: [] }
          ]
        },
        bleedingQuestions: {
          id: 'bleedingQuestions',
          type: 'select',
          label: 'Bleeding Severity',
          condition: 'bleeding',
          options: [
            { id: 'minimal', label: 'Minimal (Stopped)', triggers: [] },
            { id: 'moderate', label: 'Moderate (Controlled)', triggers: [] },
            { id: 'severe', label: 'Severe (Cannot Stop)', triggers: ['redFlag'] }
          ]
        },
        fallQuestions: {
          id: 'fallQuestions',
          type: 'select',
          label: 'Fall Details',
          condition: 'fall',
          options: [
            { id: 'sameLevel', label: 'Same Level', triggers: [] },
            { id: 'height', label: 'From Height (>1 meter)', triggers: ['redFlag'] },
            { id: 'elderly', label: 'Elderly Patient (>65)', triggers: ['redFlag'] }
          ]
        },
        headInjuryQuestions: {
          id: 'headInjuryQuestions',
          type: 'checkbox',
          label: 'Head Injury Symptoms',
          condition: 'head',
          options: [
            { id: 'lossOfConsciousness', label: 'Loss of Consciousness', triggers: ['redFlag'] },
            { id: 'confusion', label: 'Confusion', triggers: ['redFlag'] },
            { id: 'amnesia', label: 'Memory Loss', triggers: [] },
            { id: 'nausea', label: 'Nausea/Vomiting', triggers: [] },
            { id: 'seizure', label: 'Seizure', triggers: ['redFlag'] }
          ]
        },
        extremityQuestions: {
          id: 'extremityQuestions',
          type: 'checkbox',
          label: 'Extremity Injury Assessment',
          condition: 'extremity',
          options: [
            { id: 'deformity', label: 'Deformity', triggers: ['redFlag'] },
            { id: 'cannotMove', label: 'Cannot Move', triggers: ['redFlag'] },
            { id: 'numbness', label: 'Numbness/Loss of Sensation', triggers: ['redFlag'] },
            { id: 'pale', label: 'Pale/Cold', triggers: ['redFlag'] },
            { id: 'swelling', label: 'Swelling', triggers: [] }
          ]
        }
      }
    },
    changeInConsciousness: {
      id: 'changeInConsciousness',
      name: 'Change in Consciousness',
      redFlags: ['completeLoss', 'seizure', 'severeConfusion', 'strokeSymptoms'],
      questions: {
        type: {
          id: 'type',
          type: 'select',
          label: 'Type of Change',
          options: [
            { id: 'fainting', label: 'Fainting/Syncope', triggers: ['syncopeQuestions'] },
            { id: 'confusion', label: 'Confusion', triggers: ['confusionQuestions'] },
            { id: 'drowsiness', label: 'Drowsiness/Lethargy', triggers: ['drowsinessQuestions'] },
            { id: 'unresponsive', label: 'Unresponsive', triggers: ['redFlag'] },
            { id: 'seizure', label: 'Seizure', triggers: ['redFlag'] }
          ]
        },
        duration: {
          id: 'duration',
          type: 'select',
          label: 'Duration',
          options: [
            { id: 'seconds', label: 'Seconds', triggers: [] },
            { id: 'minutes', label: 'Minutes', triggers: [] },
            { id: 'hours', label: 'Hours', triggers: ['redFlag'] },
            { id: 'ongoing', label: 'Ongoing', triggers: ['redFlag'] }
          ]
        },
        triggers: {
          id: 'triggers',
          type: 'checkbox',
          label: 'Triggers or Preceding Events',
          options: [
            { id: 'standing', label: 'Standing Up', triggers: ['syncopeQuestions'] },
            { id: 'exertion', label: 'Physical Exertion', triggers: [] },
            { id: 'pain', label: 'Pain/Emotional Stress', triggers: [] },
            { id: 'medication', label: 'New Medication', triggers: [] },
            { id: 'headInjury', label: 'Head Injury', triggers: ['redFlag'] },
            { id: 'none', label: 'No Clear Trigger', triggers: [] }
          ]
        },
        associatedSymptoms: {
          id: 'associatedSymptoms',
          type: 'checkbox',
          label: 'Associated Symptoms',
          options: [
            { id: 'chestPain', label: 'Chest Pain', triggers: ['redFlag'] },
            { id: 'palpitations', label: 'Palpitations', triggers: [] },
            { id: 'nausea', label: 'Nausea', triggers: [] },
            { id: 'sweating', label: 'Sweating', triggers: [] },
            { id: 'weakness', label: 'Weakness (One Side)', triggers: ['redFlag'] },
            { id: 'speechProblems', label: 'Speech Problems', triggers: ['redFlag'] },
            { id: 'visionProblems', label: 'Vision Problems', triggers: ['redFlag'] }
          ]
        },
        syncopeQuestions: {
          id: 'syncopeQuestions',
          type: 'checkbox',
          label: 'Syncope Details',
          condition: 'fainting|standing',
          options: [
            { id: 'warning', label: 'Warning Signs Before', triggers: [] },
            { id: 'injury', label: 'Injury from Fall', triggers: [] },
            { id: 'rapidRecovery', label: 'Rapid Recovery', triggers: [] },
            { id: 'recurrent', label: 'Recurrent Episodes', triggers: [] }
          ]
        },
        confusionQuestions: {
          id: 'confusionQuestions',
          type: 'select',
          label: 'Confusion Severity',
          condition: 'confusion',
          options: [
            { id: 'mild', label: 'Mild (Disoriented)', triggers: [] },
            { id: 'moderate', label: 'Moderate (Cannot Follow Commands)', triggers: ['redFlag'] },
            { id: 'severe', label: 'Severe (Completely Disoriented)', triggers: ['redFlag'] }
          ]
        },
        drowsinessQuestions: {
          id: 'drowsinessQuestions',
          type: 'checkbox',
          label: 'Drowsiness Characteristics',
          condition: 'drowsiness',
          options: [
            { id: 'difficultToWake', label: 'Difficult to Wake', triggers: ['redFlag'] },
            { id: 'worsening', label: 'Getting Worse', triggers: ['redFlag'] },
            { id: 'fever', label: 'Fever', triggers: [] }
          ]
        }
      }
    },
    nauseaVomitingDiarrhea: {
      id: 'nauseaVomitingDiarrhea',
      name: 'Nausea/Vomiting/Diarrhea',
      redFlags: ['severeDehydration', 'bloodyStools', 'persistentVomiting', 'highFever'],
      questions: {
        symptoms: {
          id: 'symptoms',
          type: 'checkbox',
          label: 'Present Symptoms',
          options: [
            { id: 'nausea', label: 'Nausea', triggers: ['nauseaQuestions'] },
            { id: 'vomiting', label: 'Vomiting', triggers: ['vomitingQuestions'] },
            { id: 'diarrhea', label: 'Diarrhea', triggers: ['diarrheaQuestions'] },
            { id: 'all', label: 'All Three', triggers: ['dehydrationQuestions'] }
          ]
        },
        duration: {
          id: 'duration',
          type: 'select',
          label: 'Duration',
          options: [
            { id: 'hours', label: 'Hours', triggers: [] },
            { id: 'days', label: '1-3 Days', triggers: [] },
            { id: 'moreThan3days', label: 'More than 3 Days', triggers: ['chronicQuestions'] }
          ]
        },
        nauseaQuestions: {
          id: 'nauseaQuestions',
          type: 'select',
          label: 'Nausea Severity',
          condition: 'nausea',
          options: [
            { id: 'mild', label: 'Mild', triggers: [] },
            { id: 'moderate', label: 'Moderate', triggers: [] },
            { id: 'severe', label: 'Severe', triggers: [] }
          ]
        },
        vomitingQuestions: {
          id: 'vomitingQuestions',
          type: 'select',
          label: 'Vomiting Frequency',
          condition: 'vomiting',
          options: [
            { id: 'occasional', label: 'Occasional (1-2 times)', triggers: [] },
            { id: 'frequent', label: 'Frequent (3-5 times)', triggers: [] },
            { id: 'persistent', label: 'Persistent (Cannot keep anything down)', triggers: ['redFlag'] }
          ]
        },
        vomitingContent: {
          id: 'vomitingContent',
          type: 'select',
          label: 'Vomiting Content',
          condition: 'vomiting',
          options: [
            { id: 'food', label: 'Food', triggers: [] },
            { id: 'bile', label: 'Bile (Yellow/Green)', triggers: [] },
            { id: 'blood', label: 'Blood', triggers: ['redFlag'] },
            { id: 'coffeeGrounds', label: 'Coffee Grounds Appearance', triggers: ['redFlag'] }
          ]
        },
        diarrheaQuestions: {
          id: 'diarrheaQuestions',
          type: 'select',
          label: 'Diarrhea Frequency',
          condition: 'diarrhea',
          options: [
            { id: 'few', label: 'Few Times (1-3)', triggers: [] },
            { id: 'many', label: 'Many Times (4-10)', triggers: [] },
            { id: 'veryMany', label: 'Very Many (>10)', triggers: ['redFlag'] }
          ]
        },
        diarrheaCharacteristics: {
          id: 'diarrheaCharacteristics',
          type: 'checkbox',
          label: 'Diarrhea Characteristics',
          condition: 'diarrhea',
          options: [
            { id: 'watery', label: 'Watery', triggers: [] },
            { id: 'bloody', label: 'Bloody', triggers: ['redFlag'] },
            { id: 'mucous', label: 'Mucous', triggers: [] },
            { id: 'foul', label: 'Foul Smelling', triggers: [] }
          ]
        },
        associatedSymptoms: {
          id: 'associatedSymptoms',
          type: 'checkbox',
          label: 'Associated Symptoms',
          options: [
            { id: 'fever', label: 'Fever', triggers: ['feverQuestions'] },
            { id: 'abdominalPain', label: 'Abdominal Pain', triggers: [] },
            { id: 'dehydration', label: 'Signs of Dehydration', triggers: ['dehydrationQuestions'] }
          ]
        },
        feverQuestions: {
          id: 'feverQuestions',
          type: 'select',
          label: 'Fever Severity',
          condition: 'fever',
          options: [
            { id: 'low', label: 'Low Grade', triggers: [] },
            { id: 'moderate', label: 'Moderate', triggers: [] },
            { id: 'high', label: 'High (>39°C)', triggers: ['redFlag'] }
          ]
        },
        dehydrationQuestions: {
          id: 'dehydrationQuestions',
          type: 'checkbox',
          label: 'Dehydration Signs',
          condition: 'dehydration|all',
          options: [
            { id: 'dryMouth', label: 'Dry Mouth', triggers: [] },
            { id: 'noUrine', label: 'No Urine (>8 hours)', triggers: ['redFlag'] },
            { id: 'dizziness', label: 'Dizziness', triggers: [] },
            { id: 'weakness', label: 'Weakness', triggers: [] },
            { id: 'sunkenEyes', label: 'Sunken Eyes', triggers: ['redFlag'] }
          ]
        },
        chronicQuestions: {
          id: 'chronicQuestions',
          type: 'text',
          label: 'Chronic Symptoms Details',
          condition: 'moreThan3days',
          placeholder: 'Describe pattern, triggers, and any known causes'
        }
      }
    },
    backPain: {
      id: 'backPain',
      name: 'Back Pain',
      redFlags: ['caudaEquina', 'trauma', 'severeWeakness', 'saddleAnesthesia'],
      questions: {
        location: {
          id: 'location',
          type: 'select',
          label: 'Pain Location',
          options: [
            { id: 'upper', label: 'Upper Back', triggers: [] },
            { id: 'middle', label: 'Middle Back', triggers: [] },
            { id: 'lower', label: 'Lower Back', triggers: ['lowerBackQuestions'] },
            { id: 'diffuse', label: 'Diffuse (All Over)', triggers: [] }
          ]
        },
        type: {
          id: 'type',
          type: 'select',
          label: 'Type of Pain',
          options: [
            { id: 'aching', label: 'Aching', triggers: [] },
            { id: 'sharp', label: 'Sharp/Stabbing', triggers: [] },
            { id: 'burning', label: 'Burning', triggers: ['nerveQuestions'] },
            { id: 'radiating', label: 'Radiating', triggers: ['nerveQuestions'] }
          ]
        },
        severity: {
          id: 'severity',
          type: 'select',
          label: 'Severity (1-10)',
          options: [
            { id: 'mild', label: 'Mild (1-4)', triggers: [] },
            { id: 'moderate', label: 'Moderate (5-7)', triggers: [] },
            { id: 'severe', label: 'Severe (8-10)', triggers: ['severePainQuestions'] }
          ]
        },
        duration: {
          id: 'duration',
          type: 'select',
          label: 'Duration',
          options: [
            { id: 'acute', label: 'Acute (<6 weeks)', triggers: [] },
            { id: 'subacute', label: 'Subacute (6-12 weeks)', triggers: [] },
            { id: 'chronic', label: 'Chronic (>12 weeks)', triggers: ['chronicBackQuestions'] }
          ]
        },
        triggers: {
          id: 'triggers',
          type: 'checkbox',
          label: 'Triggers or Causes',
          options: [
            { id: 'injury', label: 'Recent Injury', triggers: ['redFlag'] },
            { id: 'lifting', label: 'Lifting', triggers: [] },
            { id: 'movement', label: 'Movement', triggers: [] },
            { id: 'rest', label: 'Worse at Rest', triggers: [] },
            { id: 'none', label: 'No Clear Trigger', triggers: [] }
          ]
        },
        associatedSymptoms: {
          id: 'associatedSymptoms',
          type: 'checkbox',
          label: 'Associated Symptoms',
          options: [
            { id: 'legPain', label: 'Leg Pain', triggers: ['nerveQuestions'] },
            { id: 'numbness', label: 'Numbness', triggers: ['nerveQuestions'] },
            { id: 'weakness', label: 'Weakness in Legs', triggers: ['redFlag'] },
            { id: 'bladderProblems', label: 'Bladder/Bowel Problems', triggers: ['redFlag'] },
            { id: 'saddleAnesthesia', label: 'Saddle Anesthesia', triggers: ['redFlag'] },
            { id: 'fever', label: 'Fever', triggers: ['redFlag'] }
          ]
        },
        lowerBackQuestions: {
          id: 'lowerBackQuestions',
          type: 'checkbox',
          label: 'Lower Back Specific',
          condition: 'lower',
          options: [
            { id: 'sciatica', label: 'Sciatica (Leg Pain)', triggers: ['nerveQuestions'] },
            { id: 'stiffness', label: 'Stiffness', triggers: [] },
            { id: 'worseMorning', label: 'Worse in Morning', triggers: [] }
          ]
        },
        nerveQuestions: {
          id: 'nerveQuestions',
          type: 'checkbox',
          label: 'Nerve-Related Symptoms',
          condition: 'burning|radiating|legPain|numbness|sciatica',
          options: [
            { id: 'radiatesToLeg', label: 'Radiates to Leg', triggers: [] },
            { id: 'worseWithCough', label: 'Worse with Cough/Sneeze', triggers: [] },
            { id: 'numbness', label: 'Numbness/Tingling', triggers: [] }
          ]
        },
        severePainQuestions: {
          id: 'severePainQuestions',
          type: 'checkbox',
          label: 'Severe Pain Red Flags',
          condition: 'severe',
          options: [
            { id: 'trauma', label: 'Recent Trauma', triggers: ['redFlag'] },
            { id: 'caudaEquina', label: 'Cauda Equina Symptoms', triggers: ['redFlag'] },
            { id: 'fever', label: 'Fever', triggers: ['redFlag'] }
          ]
        },
        chronicBackQuestions: {
          id: 'chronicBackQuestions',
          type: 'text',
          label: 'Chronic Back Pain Details',
          condition: 'chronic',
          placeholder: 'Describe pattern, previous treatments, and impact on daily life'
        }
      }
    },
    dizziness: {
      id: 'dizziness',
      name: 'Dizziness',
      redFlags: ['severeVertigo', 'hearingLoss', 'neurologicalSymptoms', 'cardiacSymptoms'],
      questions: {
        type: {
          id: 'type',
          type: 'select',
          label: 'Type of Dizziness',
          options: [
            { id: 'vertigo', label: 'Vertigo (Room Spinning)', triggers: ['vertigoQuestions'] },
            { id: 'lightheaded', label: 'Lightheaded/Faint', triggers: ['lightheadedQuestions'] },
            { id: 'unsteady', label: 'Unsteady/Balance Problems', triggers: ['balanceQuestions'] },
            { id: 'floating', label: 'Floating Sensation', triggers: [] }
          ]
        },
        triggers: {
          id: 'triggers',
          type: 'checkbox',
          label: 'Triggers',
          options: [
            { id: 'positionChange', label: 'Position Change', triggers: ['vertigoQuestions'] },
            { id: 'standing', label: 'Standing Up', triggers: ['lightheadedQuestions'] },
            { id: 'headMovement', label: 'Head Movement', triggers: ['vertigoQuestions'] },
            { id: 'none', label: 'No Clear Trigger', triggers: [] }
          ]
        },
        duration: {
          id: 'duration',
          type: 'select',
          label: 'Duration',
          options: [
            { id: 'seconds', label: 'Seconds', triggers: [] },
            { id: 'minutes', label: 'Minutes', triggers: [] },
            { id: 'hours', label: 'Hours', triggers: [] },
            { id: 'continuous', label: 'Continuous', triggers: ['redFlag'] }
          ]
        },
        associatedSymptoms: {
          id: 'associatedSymptoms',
          type: 'checkbox',
          label: 'Associated Symptoms',
          options: [
            { id: 'nausea', label: 'Nausea', triggers: [] },
            { id: 'vomiting', label: 'Vomiting', triggers: [] },
            { id: 'hearingLoss', label: 'Hearing Loss', triggers: ['redFlag'] },
            { id: 'tinnitus', label: 'Ringing in Ears', triggers: ['vertigoQuestions'] },
            { id: 'headache', label: 'Headache', triggers: [] },
            { id: 'chestPain', label: 'Chest Pain', triggers: ['redFlag'] },
            { id: 'palpitations', label: 'Palpitations', triggers: ['redFlag'] },
            { id: 'weakness', label: 'Weakness (One Side)', triggers: ['redFlag'] },
            { id: 'speechProblems', label: 'Speech Problems', triggers: ['redFlag'] }
          ]
        },
        vertigoQuestions: {
          id: 'vertigoQuestions',
          type: 'checkbox',
          label: 'Vertigo Characteristics',
          condition: 'vertigo|positionChange|headMovement|tinnitus',
          options: [
            { id: 'benign', label: 'Benign Positional (BPPV)', triggers: [] },
            { id: 'severe', label: 'Severe/Disabling', triggers: ['redFlag'] },
            { id: 'recurrent', label: 'Recurrent Episodes', triggers: [] }
          ]
        },
        lightheadedQuestions: {
          id: 'lightheadedQuestions',
          type: 'checkbox',
          label: 'Lightheaded Characteristics',
          condition: 'lightheaded|standing',
          options: [
            { id: 'orthostatic', label: 'Orthostatic (Standing)', triggers: [] },
            { id: 'palpitations', label: 'With Palpitations', triggers: ['redFlag'] },
            { id: 'chestPain', label: 'With Chest Pain', triggers: ['redFlag'] }
          ]
        },
        balanceQuestions: {
          id: 'balanceQuestions',
          type: 'checkbox',
          label: 'Balance Problems',
          condition: 'unsteady',
          options: [
            { id: 'falls', label: 'Falls', triggers: ['redFlag'] },
            { id: 'worsening', label: 'Getting Worse', triggers: ['redFlag'] },
            { id: 'neurological', label: 'Other Neurological Symptoms', triggers: ['redFlag'] }
          ]
        }
      }
    },
    neckPain: {
      id: 'neckPain',
      name: 'Neck Pain',
      redFlags: ['trauma', 'neurologicalSymptoms', 'meningealSigns', 'severeStiffness'],
      questions: {
        type: {
          id: 'type',
          type: 'select',
          label: 'Type of Pain',
          options: [
            { id: 'stiffness', label: 'Stiffness', triggers: ['stiffnessQuestions'] },
            { id: 'aching', label: 'Aching', triggers: [] },
            { id: 'sharp', label: 'Sharp', triggers: [] },
            { id: 'radiating', label: 'Radiating', triggers: ['nerveQuestions'] }
          ]
        },
        triggers: {
          id: 'triggers',
          type: 'checkbox',
          label: 'Triggers or Causes',
          options: [
            { id: 'injury', label: 'Recent Injury', triggers: ['redFlag'] },
            { id: 'whiplash', label: 'Whiplash', triggers: [] },
            { id: 'sleep', label: 'Sleep Position', triggers: [] },
            { id: 'stress', label: 'Stress/Tension', triggers: [] },
            { id: 'none', label: 'No Clear Cause', triggers: [] }
          ]
        },
        associatedSymptoms: {
          id: 'associatedSymptoms',
          type: 'checkbox',
          label: 'Associated Symptoms',
          options: [
            { id: 'headache', label: 'Headache', triggers: [] },
            { id: 'armPain', label: 'Arm Pain', triggers: ['nerveQuestions'] },
            { id: 'numbness', label: 'Numbness', triggers: ['nerveQuestions'] },
            { id: 'weakness', label: 'Weakness', triggers: ['redFlag'] },
            { id: 'fever', label: 'Fever', triggers: ['redFlag'] },
            { id: 'stiffness', label: 'Severe Stiffness', triggers: ['redFlag'] }
          ]
        },
        stiffnessQuestions: {
          id: 'stiffnessQuestions',
          type: 'checkbox',
          label: 'Stiffness Characteristics',
          condition: 'stiffness',
          options: [
            { id: 'cannotTurn', label: 'Cannot Turn Head', triggers: ['redFlag'] },
            { id: 'fever', label: 'With Fever', triggers: ['redFlag'] },
            { id: 'headache', label: 'With Headache', triggers: ['redFlag'] }
          ]
        },
        nerveQuestions: {
          id: 'nerveQuestions',
          type: 'checkbox',
          label: 'Nerve-Related Symptoms',
          condition: 'radiating|armPain|numbness',
          options: [
            { id: 'radiatesToArm', label: 'Radiates to Arm', triggers: [] },
            { id: 'numbness', label: 'Numbness/Tingling', triggers: [] },
            { id: 'weakness', label: 'Weakness in Arm', triggers: ['redFlag'] }
          ]
        }
      }
    },
    eyeProblems: {
      id: 'eyeProblems',
      name: 'Eye Problems',
      redFlags: ['suddenVisionLoss', 'severeEyePain', 'trauma', 'chemicalExposure'],
      questions: {
        type: {
          id: 'type',
          type: 'checkbox',
          label: 'Eye Symptoms',
          options: [
            { id: 'visionLoss', label: 'Sudden Vision Loss', triggers: ['redFlag'] },
            { id: 'blurredVision', label: 'Blurred Vision', triggers: [] },
            { id: 'doubleVision', label: 'Double Vision', triggers: [] },
            { id: 'eyePain', label: 'Eye Pain', triggers: ['painQuestions'] },
            { id: 'redness', label: 'Redness', triggers: [] },
            { id: 'discharge', label: 'Discharge', triggers: [] },
            { id: 'lightSensitivity', label: 'Light Sensitivity', triggers: ['painQuestions'] }
          ]
        },
        onset: {
          id: 'onset',
          type: 'select',
          label: 'Onset',
          options: [
            { id: 'sudden', label: 'Sudden', triggers: ['redFlag'] },
            { id: 'gradual', label: 'Gradual', triggers: [] }
          ]
        },
        laterality: {
          id: 'laterality',
          type: 'select',
          label: 'Which Eye',
          options: [
            { id: 'left', label: 'Left', triggers: [] },
            { id: 'right', label: 'Right', triggers: [] },
            { id: 'both', label: 'Both', triggers: [] }
          ]
        },
        trauma: {
          id: 'trauma',
          type: 'select',
          label: 'Recent Eye Trauma or Chemical Exposure',
          options: [
            { id: 'none', label: 'No', triggers: [] },
            { id: 'trauma', label: 'Trauma', triggers: ['redFlag'] },
            { id: 'chemical', label: 'Chemical Exposure', triggers: ['redFlag'] }
          ]
        },
        painQuestions: {
          id: 'painQuestions',
          type: 'select',
          label: 'Pain Severity',
          condition: 'eyePain|lightSensitivity',
          options: [
            { id: 'mild', label: 'Mild', triggers: [] },
            { id: 'moderate', label: 'Moderate', triggers: [] },
            { id: 'severe', label: 'Severe', triggers: ['redFlag'] }
          ]
        }
      }
    }
  }
};

// ─── Wizard screen constants ───────────────────────────────────────────────
const SCREEN_PERSONAL   = 0;
const SCREEN_HISTORY    = 1;
const SCREEN_ALLERGIES  = 2;
const SCREEN_MED_START  = 3; // dynamic: 3, 4, 5, … one per active med group

// Medical-history condition icon map
const conditionIcons: Record<string, React.ReactNode> = {
  none:               <AlertCircle className="w-4 h-4" />,
  diabetes:           <Pill className="w-4 h-4" />,
  hypertension:       <Heart className="w-4 h-4" />,
  dyslipidemia:       <Activity className="w-4 h-4" />,
  asthma:             <Wind className="w-4 h-4" />,
  ischemicHeartDisease:<Heart className="w-4 h-4" />,
  cancer:             <Activity className="w-4 h-4" />,
  previousStroke:     <Brain className="w-4 h-4" />,
  hypothyroidism:     <Pill className="w-4 h-4" />,
  copd:               <Wind className="w-4 h-4" />,
  otherDiseases:      <Plus className="w-4 h-4" />,
  previousSurgeries:  <Scissors className="w-4 h-4" />,
};

function QuestionnairePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  // Outer step: 1 = Step-1 wizard, 2 = Adaptive questions
  const [currentStep, setCurrentStep] = useState(1);
  // Inner screen within Step 1
  const [screen, setScreen] = useState(0);
  const [formData, setFormData] = useState<QuestionnaireData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  // "Other" med free-text per group id (not committed to formData until submit)
  const [otherMedInputs, setOtherMedInputs] = useState<Record<string, string>>({});
  // Step 2: which pathway sub-step we're on (0-indexed)
  const [step2PathwayIndex, setStep2PathwayIndex] = useState(0);
  // Step 2: responses per pathway (pathwayId → { questionId → value })
  const [pathwayResponses, setPathwayResponses] = useState<Record<string, Record<string, any>>>({});

  const isRTL = i18n.language === 'he';

  // ─── Derived values ────────────────────────────────────────────────────────
  const activeMedGroups = useMemo(
    () => getActiveMedGroups(formData.medicalHistory as Record<string, boolean | string>),
    [formData.medicalHistory]
  );
  const SCREEN_ILLNESS = SCREEN_MED_START + activeMedGroups.length;

  // Progress stage (0-4) for the 5-dot indicator
  const progressStage = useMemo(() => {
    if (screen <= SCREEN_PERSONAL) return 0;
    if (screen === SCREEN_HISTORY) return 1;
    if (screen === SCREEN_ALLERGIES) return 2;
    if (screen >= SCREEN_MED_START && screen < SCREEN_ILLNESS) return 3;
    return 4;
  }, [screen, SCREEN_ILLNESS]);

  const selectedIllnessCount = useMemo(
    () => Object.values(formData.currentIllness).filter(Boolean).length,
    [formData.currentIllness]
  );

  const activePathways = useMemo(
    () => getPathwaysForIllnesses(formData.currentIllness as Record<string, boolean | string>),
    [formData.currentIllness]
  );

  // Reset pathway index if illnesses change and index is out of bounds
  useEffect(() => {
    if (step2PathwayIndex >= activePathways.length && activePathways.length > 0) {
      setStep2PathwayIndex(0);
    }
  }, [activePathways.length, step2PathwayIndex]);

  // ─── Language toggle ───────────────────────────────────────────────────────
  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'he' ? 'en' : 'he');
  };

  // ─── Form data helpers ─────────────────────────────────────────────────────
  const updateFormData = (section: keyof QuestionnaireData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as any), [field]: value },
    }));
  };

  const toggleMedication = (groupKey: MedGroupKey, brandName: string, checked: boolean) => {
    const current = formData.medications.groups[groupKey];
    const updated = checked ? [...current, brandName] : current.filter(m => m !== brandName);
    updateFormData('medications', 'groups', { ...formData.medications.groups, [groupKey]: updated });
  };

  const toggleIllness = (key: keyof QuestionnaireData['currentIllness'], checked: boolean) => {
    if (checked && selectedIllnessCount >= 2) return;
    updateFormData('currentIllness', key, checked);
  };

  // ─── Per-screen validation ─────────────────────────────────────────────────
  const validateAge = (age: string): string | undefined => {
    if (!age.trim()) return t('questionnaire.errors.ageRequired');
    const n = parseInt(age);
    if (isNaN(n)) return t('questionnaire.errors.ageInvalid');
    if (n < 0 || n > 120) return t('questionnaire.errors.ageRange');
    return undefined;
  };

  const validatePersonalScreen = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.personalInfo.gender) errs.gender = t('questionnaire.errors.genderRequired');
    const ageErr = validateAge(formData.personalInfo.age);
    if (ageErr) errs.age = ageErr;
    if (!formData.personalInfo.maritalStatus) errs.maritalStatus = t('questionnaire.errors.maritalStatusRequired');
    if (!formData.personalInfo.cognitiveState) errs.cognitiveState = t('questionnaire.errors.cognitiveStateRequired');
    if (!formData.personalInfo.functionalState) errs.functionalState = t('questionnaire.errors.functionalStateRequired');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateHistoryScreen = (): boolean => {
    const has = Object.values(formData.medicalHistory).some(v => v === true);
    if (!has) {
      setErrors({ medicalHistory: t('questionnaire.errors.medicalHistoryRequired') });
      return false;
    }
    return true;
  };

  const validateAllergiesScreen = (): boolean => {
    if (!formData.medications.allergies.hasAllergies) {
      setErrors({ allergies: t('questionnaire.errors.allergiesRequired') });
      return false;
    }
    return true;
  };

  const validateIllnessScreen = (): boolean => {
    if (selectedIllnessCount === 0) {
      setErrors({ illness: t('questionnaire.errors.illnessRequired') });
      return false;
    }
    return true;
  };

  // isPersonalValid — used for live Next-button disable state on Screen A
  const isPersonalValid =
    !!formData.personalInfo.gender &&
    !!formData.personalInfo.age &&
    !validateAge(formData.personalInfo.age) &&
    !!formData.personalInfo.maritalStatus &&
    !!formData.personalInfo.cognitiveState &&
    !!formData.personalInfo.functionalState;

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const { data: caseData, isLoading: isLoadingCase, error: caseError } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () =>
      apiFetch(`/cases/${caseId}`).then(res => {
        if (!res.ok) throw new Error('Failed to fetch case');
        return res.json();
      }),
    enabled: !!caseId,
  });

  const submitQuestionnaire = useMutation({
    mutationFn: (answers: any) =>
      apiFetch(`/cases/${caseId}/questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      }),
  });

  // ─── Navigation ────────────────────────────────────────────────────────────
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleNext = () => {
    setErrors({});
    if (currentStep === 1) {
      if (screen === SCREEN_PERSONAL) {
        if (!validatePersonalScreen()) return;
        setScreen(SCREEN_HISTORY);
      } else if (screen === SCREEN_HISTORY) {
        if (!validateHistoryScreen()) return;
        setScreen(SCREEN_ALLERGIES);
      } else if (screen === SCREEN_ALLERGIES) {
        if (!validateAllergiesScreen()) return;
        setScreen(activeMedGroups.length > 0 ? SCREEN_MED_START : SCREEN_ILLNESS);
      } else if (screen >= SCREEN_MED_START && screen < SCREEN_ILLNESS) {
        setScreen(screen + 1);
      } else if (screen === SCREEN_ILLNESS) {
        if (!validateIllnessScreen()) return;
        setStep2PathwayIndex(0);
        setCurrentStep(2);
      }
    } else {
      // Step 2: navigate sub-steps or submit on last
      if (step2PathwayIndex < activePathways.length - 1) {
        setStep2PathwayIndex(prev => prev + 1);
      } else {
        handleSubmit();
        return;
      }
    }
    scrollTop();
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep === 2) {
      if (step2PathwayIndex > 0) {
        setStep2PathwayIndex(prev => prev - 1);
      } else {
        setCurrentStep(1);
        setScreen(SCREEN_ILLNESS);
      }
      scrollTop();
      return;
    }
    if (screen > 0) {
      setScreen(screen - 1);
      scrollTop();
    }
  };

  const buildAdaptiveQuestionsData = (): AdaptiveQuestionsData => {
    const completedPathways: SymptomResponseEntry[] = activePathways.map(pathway => {
      const responses = pathwayResponses[pathway.id] || {};
      const redFlagsTriggered = getRedFlagsForPathway(pathway, responses);
      const severityQ = pathway.questions.find(q => q.type === 'slider');
      const locationQ = pathway.questions.find(q => q.type === 'locationPicker');
      return {
        pathwayId: pathway.id,
        responses,
        locationData: locationQ ? (responses[locationQ.id] as LocationSelection) : undefined,
        severity: severityQ ? (responses[severityQ.id] as number) : undefined,
        redFlagsTriggered,
      };
    });
    const overallRedFlags = [...new Set(completedPathways.flatMap(p => p.redFlagsTriggered))];
    return { completedPathways, overallRedFlags, completed: true };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const mergedGroups = { ...formData.medications.groups };
      for (const group of activeMedGroups) {
        const text = otherMedInputs[group.id]?.trim();
        if (text) {
          const entry = `Other: ${text}`;
          if (!mergedGroups[group.groupKey as MedGroupKey].includes(entry)) {
            mergedGroups[group.groupKey as MedGroupKey] = [
              ...mergedGroups[group.groupKey as MedGroupKey],
              entry,
            ];
          }
        }
      }
      const payload = {
        ...formData,
        medications: { ...formData.medications, groups: mergedGroups },
        adaptiveQuestions: buildAdaptiveQuestionsData(),
      };
      await submitQuestionnaire.mutateAsync(payload);
      await apiFetch(`/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open' }),
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(t('questionnaire.errors.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Step-1 progress indicator ────────────────────────────────────────────
  const renderProgressDots = () => {
    const stages = [
      t('questionnaire.wizard.personalDetails'),
      t('questionnaire.wizard.medicalHistory'),
      t('questionnaire.wizard.allergies'),
      t('questionnaire.wizard.medications'),
      t('questionnaire.wizard.currentIllness'),
    ];
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {stages.map((label, i) => {
            const isCompleted = i < progressStage;
            const isCurrent   = i === progressStage;
            return (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {i > 0 && (
                    <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  )}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                      ${isCompleted ? 'bg-blue-500 text-white'
                        : isCurrent  ? 'bg-white border-2 border-blue-500 text-blue-600'
                        : 'bg-gray-200 text-gray-400'}`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < stages.length - 1 && (
                    <div className={`flex-1 h-0.5 ${i < progressStage ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  )}
                </div>
                <span className={`mt-1 text-xs text-center leading-tight hidden sm:block
                  ${isCurrent ? 'text-blue-600 font-medium' : isCompleted ? 'text-blue-400' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Screen A: Personal Details ────────────────────────────────────────────
  const renderScreenA = () => {
    type RadioOption = { value: string; label: string };
    const RadioCards = ({
      field,
      options,
      value,
      error,
    }: {
      field: keyof QuestionnaireData['personalInfo'];
      options: RadioOption[];
      value: string;
      error?: string;
    }) => (
      <div>
        <div className="grid grid-cols-2 gap-2">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateFormData('personalInfo', field, opt.value)}
              className={`px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                ${value === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
            >
              {value === opt.value && <Check className="inline w-3.5 h-3.5 mr-1 text-blue-500" />}
              {opt.label}
            </button>
          ))}
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{t('questionnaire.personalInfo.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('questionnaire.wizard.personalSubtitle')}</p>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">{t('questionnaire.personalInfo.gender')}</label>
          <RadioCards
            field="gender"
            value={formData.personalInfo.gender}
            error={errors.gender}
            options={[
              { value: 'male',   label: t('questionnaire.personalInfo.male') },
              { value: 'female', label: t('questionnaire.personalInfo.female') },
            ]}
          />
        </div>

        {/* Age */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">{t('questionnaire.personalInfo.age')}</label>
          <Input
            type="number"
            min="0"
            max="120"
            value={formData.personalInfo.age}
            onChange={(e) => updateFormData('personalInfo', 'age', e.target.value)}
            placeholder={t('questionnaire.personalInfo.agePlaceholder')}
            className={`text-base h-12 ${errors.age ? 'border-red-500' : ''}`}
          />
          {errors.age && <p className="text-red-500 text-xs">{errors.age}</p>}
        </div>

        {/* Marital Status */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">{t('questionnaire.personalInfo.maritalStatus')}</label>
          <RadioCards
            field="maritalStatus"
            value={formData.personalInfo.maritalStatus}
            error={errors.maritalStatus}
            options={[
              { value: 'married',  label: t('questionnaire.personalInfo.married') },
              { value: 'single',   label: t('questionnaire.personalInfo.single') },
              { value: 'divorced', label: t('questionnaire.personalInfo.divorced') },
              { value: 'widowed',  label: t('questionnaire.personalInfo.widowed') },
            ]}
          />
        </div>

        {/* Cognitive State */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">{t('questionnaire.personalInfo.cognitiveState')}</label>
          <RadioCards
            field="cognitiveState"
            value={formData.personalInfo.cognitiveState}
            error={errors.cognitiveState}
            options={[
              { value: 'conscious',   label: t('questionnaire.personalInfo.conscious') },
              { value: 'confused',    label: t('questionnaire.personalInfo.confused') },
              { value: 'unconscious', label: t('questionnaire.personalInfo.unconscious') },
            ]}
          />
        </div>

        {/* Functional State */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">{t('questionnaire.personalInfo.functionalState')}</label>
          <RadioCards
            field="functionalState"
            value={formData.personalInfo.functionalState}
            error={errors.functionalState}
            options={[
              { value: 'independent', label: t('questionnaire.personalInfo.independent') },
              { value: 'dependent',   label: t('questionnaire.personalInfo.dependent') },
            ]}
          />
        </div>
      </div>
    );
  };

  // ─── Screen B: Medical History ─────────────────────────────────────────────
  const renderScreenB = () => {
    const conditions: Array<{ key: keyof QuestionnaireData['medicalHistory']; labelKey: string }> = [
      { key: 'none',                labelKey: 'questionnaire.medicalHistory.none' },
      { key: 'diabetes',            labelKey: 'questionnaire.medicalHistory.diabetes' },
      { key: 'hypertension',        labelKey: 'questionnaire.medicalHistory.hypertension' },
      { key: 'dyslipidemia',        labelKey: 'questionnaire.medicalHistory.dyslipidemia' },
      { key: 'asthma',              labelKey: 'questionnaire.medicalHistory.asthma' },
      { key: 'ischemicHeartDisease',labelKey: 'questionnaire.medicalHistory.ischemicHeartDisease' },
      { key: 'cancer',              labelKey: 'questionnaire.medicalHistory.cancer' },
      { key: 'previousStroke',      labelKey: 'questionnaire.medicalHistory.previousStroke' },
      { key: 'hypothyroidism',      labelKey: 'questionnaire.medicalHistory.hypothyroidism' },
      { key: 'copd',                labelKey: 'questionnaire.medicalHistory.copd' },
      { key: 'previousSurgeries',   labelKey: 'questionnaire.medicalHistory.previousSurgeries' },
      { key: 'otherDiseases',       labelKey: 'questionnaire.medicalHistory.otherDiseases' },
    ];

    const handleConditionToggle = (key: keyof QuestionnaireData['medicalHistory'], checked: boolean) => {
      if (key === 'none' && checked) {
        // Deselect all others when "None" is selected
        setFormData(prev => ({
          ...prev,
          medicalHistory: {
            none: true,
            diabetes: false,
            hypertension: false,
            dyslipidemia: false,
            asthma: false,
            ischemicHeartDisease: false,
            cancer: false,
            previousStroke: false,
            hypothyroidism: false,
            copd: false,
            otherDiseases: false,
            otherDiseasesText: '',
            previousSurgeries: false,
          },
        }));
      } else {
        if (checked) {
          // Deselect "None" if a condition is selected
          updateFormData('medicalHistory', 'none', false);
        }
        updateFormData('medicalHistory', key, checked);
      }
    };

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{t('questionnaire.medicalHistory.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('questionnaire.wizard.historySubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {conditions.map(({ key, labelKey }) => {
            const isChecked = !!formData.medicalHistory[key];
            const isNoneKey = key === 'none';
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleConditionToggle(key, !isChecked)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                  ${isChecked
                    ? isNoneKey
                      ? 'border-gray-400 bg-gray-50 text-gray-700'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
              >
                <span className={`shrink-0 ${isChecked ? (isNoneKey ? 'text-gray-500' : 'text-blue-500') : 'text-gray-400'}`}>
                  {conditionIcons[key]}
                </span>
                <span className="flex-1">{t(labelKey)}</span>
                {isChecked && <Check className="shrink-0 w-4 h-4 text-current" />}
              </button>
            );
          })}
        </div>

        {/* Other diseases textarea (animated reveal) */}
        {formData.medicalHistory.otherDiseases && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              {t('questionnaire.medicalHistory.otherDiseasesPlaceholder')}
            </label>
            <textarea
              value={formData.medicalHistory.otherDiseasesText}
              onChange={e => updateFormData('medicalHistory', 'otherDiseasesText', e.target.value)}
              placeholder={t('questionnaire.medicalHistory.otherDiseasesPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {errors.medicalHistory && (
          <p className="text-red-500 text-sm">{errors.medicalHistory}</p>
        )}
      </div>
    );
  };

  // ─── Screen C: Medication Allergies ───────────────────────────────────────
  const renderScreenC = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-gray-900">{t('questionnaire.medications.allergies.title')}</h3>
        <p className="text-sm text-gray-500 mt-1">{t('questionnaire.wizard.allergiesSubtitle')}</p>
      </div>

      <p className="text-base text-gray-700 font-medium">{t('questionnaire.medications.allergies.question')}</p>

      <div className="grid grid-cols-2 gap-3">
        {(['yes', 'no'] as const).map(val => {
          const selected = formData.medications.allergies.hasAllergies === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() =>
                updateFormData('medications', 'allergies', {
                  ...formData.medications.allergies,
                  hasAllergies: val,
                })
              }
              className={`py-4 rounded-xl border-2 text-base font-semibold transition-all
                ${selected
                  ? val === 'yes'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
            >
              {selected && <Check className="inline w-4 h-4 mr-1" />}
              {val === 'yes' ? t('questionnaire.medications.allergies.yes') : t('questionnaire.medications.allergies.no')}
            </button>
          );
        })}
      </div>

      {errors.allergies && <p className="text-red-500 text-sm">{errors.allergies}</p>}

      {formData.medications.allergies.hasAllergies === 'yes' && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">
            {t('questionnaire.wizard.allergyDetailsLabel')}
          </label>
          <textarea
            value={formData.medications.allergies.allergyDetails}
            onChange={e =>
              updateFormData('medications', 'allergies', {
                ...formData.medications.allergies,
                allergyDetails: e.target.value,
              })
            }
            placeholder={t('questionnaire.medications.allergies.detailsPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}
    </div>
  );

  // ─── Screen D: Dynamic Medication Group ───────────────────────────────────
  const renderScreenD = (groupIndex: number) => {
    const group = activeMedGroups[groupIndex];
    if (!group) return null;
    const groupKey = group.groupKey as MedGroupKey;

    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-1">
            {group.conditionLabel}
          </p>
          <h3 className="text-xl font-bold text-gray-900">{group.label}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('questionnaire.wizard.medicationsSubtitle')}</p>
        </div>

        <div className="space-y-2">
          {group.meds.map(med => {
            const selected = formData.medications.groups[groupKey].includes(med.brandName);
            return (
              <button
                key={med.id}
                type="button"
                onClick={() => toggleMedication(groupKey, med.brandName, !selected)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                  ${selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-blue-300'}`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                  ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">{med.brandName}</span>
                  {med.genericName && (
                    <span className="text-xs text-gray-500 ml-1">({med.genericName})</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Other free-text field */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-600">{t('questionnaire.medGroup.otherLabel')}</label>
          <Input
            value={otherMedInputs[group.id] ?? ''}
            onChange={e => setOtherMedInputs(prev => ({ ...prev, [group.id]: e.target.value }))}
            placeholder={t('questionnaire.medGroup.otherPlaceholder')}
            className="text-sm"
          />
        </div>

        <p className="text-xs text-gray-400">{t('questionnaire.wizard.medicationsOptional')}</p>
      </div>
    );
  };

  // ─── Screen E: Current Illness ─────────────────────────────────────────────
  const renderScreenE = () => {
    const illnesses: Array<{ key: keyof QuestionnaireData['currentIllness']; labelKey: string }> = [
      { key: 'chestPain',              labelKey: 'questionnaire.currentIllness.chestPain' },
      { key: 'chestPainSternum',       labelKey: 'questionnaire.currentIllness.chestPainSternum' },
      { key: 'shortnessOfBreath',      labelKey: 'questionnaire.currentIllness.shortnessOfBreath' },
      { key: 'fever',                  labelKey: 'questionnaire.currentIllness.fever' },
      { key: 'abdominalPain',          labelKey: 'questionnaire.currentIllness.abdominalPain' },
      { key: 'headache',               labelKey: 'questionnaire.currentIllness.headache' },
      { key: 'dizziness',              labelKey: 'questionnaire.currentIllness.dizziness' },
      { key: 'nauseaVomitingDiarrhea', labelKey: 'questionnaire.currentIllness.nauseaVomitingDiarrhea' },
      { key: 'changeInConsciousness',  labelKey: 'questionnaire.currentIllness.changeInConsciousness' },
      { key: 'fatigueWeakness',        labelKey: 'questionnaire.currentIllness.fatigueWeakness' },
      { key: 'injuryTrauma',           labelKey: 'questionnaire.currentIllness.injuryTrauma' },
      { key: 'headInjury',             labelKey: 'questionnaire.currentIllness.headInjury' },
      { key: 'backPain',               labelKey: 'questionnaire.currentIllness.backPain' },
      { key: 'neckPain',               labelKey: 'questionnaire.currentIllness.neckPain' },
      { key: 'jointPain',              labelKey: 'questionnaire.currentIllness.jointPain' },
      { key: 'painInLimbs',            labelKey: 'questionnaire.currentIllness.painInLimbs' },
      { key: 'swellingEdema',          labelKey: 'questionnaire.currentIllness.swellingEdema' },
      { key: 'eyeProblems',            labelKey: 'questionnaire.currentIllness.eyeProblems' },
      { key: 'earPain',                labelKey: 'questionnaire.currentIllness.earPain' },
      { key: 'injectionSitePain',      labelKey: 'questionnaire.currentIllness.injectionSitePain' },
    ];

    const atMax = selectedIllnessCount >= 2;

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{t('questionnaire.currentIllness.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('questionnaire.wizard.illnessSubtitle')}</p>
        </div>

        {/* Max-2 warning banner */}
        {atMax && (
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-700 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {t('questionnaire.currentIllness.maxSelected')}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {illnesses.map(({ key, labelKey }) => {
            const selected = !!formData.currentIllness[key];
            const disabled = atMax && !selected;
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => toggleIllness(key, !selected)}
                className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                  ${selected
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : disabled
                    ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0
                  ${selected ? 'bg-blue-500 border-blue-500' : disabled ? 'border-gray-200' : 'border-gray-300'}`}>
                  {selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="flex-1">{t(labelKey)}</span>
              </button>
            );
          })}
        </div>

        {errors.illness && <p className="text-red-500 text-sm">{errors.illness}</p>}
      </div>
    );
  };

  // ─── Step 1 wizard dispatcher ──────────────────────────────────────────────
  const renderStep1 = () => {
    if (screen === SCREEN_PERSONAL)  return renderScreenA();
    if (screen === SCREEN_HISTORY)   return renderScreenB();
    if (screen === SCREEN_ALLERGIES) return renderScreenC();
    if (screen >= SCREEN_MED_START && screen < SCREEN_ILLNESS) {
      return renderScreenD(screen - SCREEN_MED_START);
    }
    if (screen === SCREEN_ILLNESS)   return renderScreenE();
    return renderScreenA();
  };

  // ─── Step 2: pathway response helpers ─────────────────────────────────────

  const updatePathwayResponse = (pathwayId: string, questionId: string, value: any) => {
    setPathwayResponses(prev => ({
      ...prev,
      [pathwayId]: { ...(prev[pathwayId] || {}), [questionId]: value },
    }));
  };

  const togglePathwayMultiSelect = (
    pathwayId: string,
    questionId: string,
    optionId: string,
    maxSelections?: number
  ) => {
    setPathwayResponses(prev => {
      const current = ((prev[pathwayId] || {})[questionId] as string[]) || [];
      let updated: string[];
      if (current.includes(optionId)) {
        updated = current.filter(id => id !== optionId);
      } else {
        if (maxSelections && current.length >= maxSelections) return prev;
        updated = [...current, optionId];
      }
      return { ...prev, [pathwayId]: { ...(prev[pathwayId] || {}), [questionId]: updated } };
    });
  };

  // ─── Step 2: question renderer ─────────────────────────────────────────────

  const renderPathwayQuestion = (
    question: SymptomPathway['questions'][number],
    responses: Record<string, any>,
    pathwayId: string
  ) => {
    const val = responses[question.id];
    const isRedFlagTriggered = (() => {
      if (!question.isRedFlag) return false;
      if (val === undefined || val === null) return false;
      if (question.type === 'slider') {
        const threshold = question.redFlagValues?.[0] ?? 8;
        return typeof val === 'number' && val >= threshold;
      }
      if (question.type === 'multiSelect' && Array.isArray(val)) {
        return question.redFlagValues?.some(rv => val.includes(rv)) ?? false;
      }
      return question.redFlagValues?.includes(val) ?? false;
    })();

    const labelClass = `block text-sm font-semibold text-gray-700 mb-2 ${isRedFlagTriggered ? 'text-red-600' : ''}`;

    switch (question.type) {
      case 'singleSelect':
        return (
          <div key={question.id} className="space-y-2">
            <label className={labelClass}>
              {isRedFlagTriggered && <AlertTriangle className="inline w-3.5 h-3.5 mr-1 text-red-500" />}
              {t(`questionnaire.pathway.${pathwayId}.${question.id}`, question.label)}
              {question.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {question.options?.map(opt => {
                const selected = val === opt.id;
                const isOptRedFlag = question.isRedFlag && question.redFlagValues?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updatePathwayResponse(pathwayId, question.id, opt.id)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left
                      ${selected
                        ? isOptRedFlag
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
                  >
                    {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    {isOptRedFlag && !selected && <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />}
                    <span className="flex-1">{t(`questionnaire.pathway.${pathwayId}.${question.id}.${opt.id}`, opt.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'multiSelect': {
        const selectedArr = (val as string[]) || [];
        const atMax = question.maxSelections != null && selectedArr.length >= question.maxSelections;
        return (
          <div key={question.id} className="space-y-2">
            <label className={labelClass}>
              {t(`questionnaire.pathway.${pathwayId}.${question.id}`, question.label)}
              {question.maxSelections && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({selectedArr.length}/{question.maxSelections})
                </span>
              )}
            </label>
            {atMax && (
              <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                {t('questionnaire.step2.maxSelected', `Max ${question.maxSelections} selections reached`)}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {question.options?.map(opt => {
                const isChecked = selectedArr.includes(opt.id);
                const isOptRedFlag = question.isRedFlag && question.redFlagValues?.includes(opt.id);
                const isDisabled = atMax && !isChecked;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => togglePathwayMultiSelect(pathwayId, question.id, opt.id, question.maxSelections)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left
                      ${isChecked
                        ? isOptRedFlag
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-blue-500 bg-blue-50 text-blue-700'
                        : isDisabled
                          ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                      ${isChecked ? (isOptRedFlag ? 'bg-red-500 border-red-500' : 'bg-blue-500 border-blue-500') : 'border-gray-300'}`}>
                      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="flex-1">{t(`questionnaire.pathway.${pathwayId}.${question.id}.${opt.id}`, opt.label)}</span>
                    {isOptRedFlag && isChecked && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'slider': {
        const sliderVal = (val as number) ?? 5;
        const sliderColor =
          sliderVal >= 8 ? 'text-red-600' : sliderVal >= 5 ? 'text-amber-600' : 'text-green-600';
        return (
          <div key={question.id} className="space-y-3">
            <label className={labelClass}>
              {t(`questionnaire.pathway.${pathwayId}.${question.id}`, question.label)}
              {question.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={question.min ?? 0}
                max={question.max ?? 10}
                step={1}
                value={sliderVal}
                onChange={e => updatePathwayResponse(pathwayId, question.id, Number(e.target.value))}
                className="flex-1 h-2 rounded-lg cursor-pointer accent-blue-600 bg-gray-200"
              />
              <span className={`text-2xl font-bold w-10 text-center tabular-nums ${sliderColor}`}>
                {sliderVal}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{t('questionnaire.step2.sliderNone', 'None')}</span>
              <span className="text-amber-500">{t('questionnaire.step2.sliderModerate', 'Moderate')}</span>
              <span className="text-red-500">{t('questionnaire.step2.sliderWorst', 'Worst')}</span>
            </div>
            {isRedFlagTriggered && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 font-medium">
                  {t('questionnaire.step2.highSeverityWarning', 'Severity level indicates urgent care may be needed')}
                </p>
              </div>
            )}
          </div>
        );
      }

      case 'boolean': {
        return (
          <div key={question.id} className="space-y-2">
            <label className={`block text-sm font-semibold ${question.isRedFlag ? 'text-gray-700' : 'text-gray-700'} mb-2`}>
              {question.isRedFlag && <AlertTriangle className="inline w-3.5 h-3.5 mr-1 text-amber-500" />}
              {t(`questionnaire.pathway.${pathwayId}.${question.id}`, question.label)}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([true, false] as const).map(boolVal => {
                const isSelected = val === boolVal;
                const isThisRedFlag = question.isRedFlag && question.redFlagValues?.includes(boolVal);
                return (
                  <button
                    key={String(boolVal)}
                    type="button"
                    onClick={() => updatePathwayResponse(pathwayId, question.id, boolVal)}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all
                      ${isSelected
                        ? isThisRedFlag
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}
                  >
                    {isSelected && <Check className="inline w-4 h-4 mr-1" />}
                    {boolVal
                      ? t('questionnaire.step2.yes', 'Yes')
                      : t('questionnaire.step2.no', 'No')}
                  </button>
                );
              })}
            </div>
            {isRedFlagTriggered && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg mt-1">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-600 font-medium">
                  {t('questionnaire.step2.redFlagWarning', 'This symptom requires immediate medical attention')}
                </p>
              </div>
            )}
          </div>
        );
      }

      case 'locationPicker': {
        const locVal = val as LocationSelection | undefined;
        if (question.locationPickerType === 'abdomen') {
          return (
            <div key={question.id} className="space-y-2">
              <label className={labelClass}>
                {t(`questionnaire.pathway.${pathwayId}.${question.id}`, question.label)}
                {question.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <AbdomenLocationPicker
                value={locVal}
                onChange={v => updatePathwayResponse(pathwayId, question.id, v)}
              />
            </div>
          );
        }
        if (question.locationPickerType === 'head') {
          return (
            <div key={question.id} className="space-y-2">
              <label className={labelClass}>
                {t(`questionnaire.pathway.${pathwayId}.${question.id}`, question.label)}
                {question.required && <span className="text-red-400 ml-1">*</span>}
              </label>
              <HeadacheLocationPicker
                value={locVal}
                onChange={v => updatePathwayResponse(pathwayId, question.id, v)}
              />
            </div>
          );
        }
        return null;
      }

      case 'text':
        return (
          <div key={question.id} className="space-y-2">
            <label className={labelClass}>
              {t(`questionnaire.pathway.${pathwayId}.${question.id}`, question.label)}
            </label>
            <textarea
              value={(val as string) || ''}
              onChange={e => updatePathwayResponse(pathwayId, question.id, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Step 2: main renderer ─────────────────────────────────────────────────

  const renderStep2 = () => {
    if (activePathways.length === 0) {
      return (
        <div className="space-y-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">{t('questionnaire.step2.symptoms', 'Current Symptoms')}</h2>
          <div className="text-gray-500 space-y-2">
            <p className="text-base">{t('adaptive.noSymptomsSelected', 'No symptoms selected')}</p>
            <p className="text-sm">{t('adaptive.goBackToStep1', 'Please go back and select your symptoms')}</p>
          </div>
          <Button onClick={() => { setCurrentStep(1); setScreen(SCREEN_ILLNESS); }} variant="outline">
            {t('common.back')}
          </Button>
        </div>
      );
    }

    const currentPathway = activePathways[step2PathwayIndex];
    if (!currentPathway) return null;

    const responses = pathwayResponses[currentPathway.id] || {};
    const redFlagsForPathway = getRedFlagsForPathway(currentPathway, responses);
    const visibleQuestions = currentPathway.questions.filter(q => isQuestionVisible(q, responses));


    return (
      <div className="space-y-6">
        {/* Pathway header */}
        <div className="space-y-3">
          {/* Progress dots for multiple pathways */}
          {activePathways.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {activePathways.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === step2PathwayIndex
                      ? 'w-6 bg-blue-500'
                      : idx < step2PathwayIndex
                        ? 'w-2 bg-blue-300'
                        : 'w-2 bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                {activePathways.length > 1
                  ? t('questionnaire.step2.pathwayOf', `Symptom ${step2PathwayIndex + 1} of ${activePathways.length}`, { current: step2PathwayIndex + 1, total: activePathways.length })
                  : t('questionnaire.step2.symptoms', 'Current Symptoms')
                }
              </p>
              <h2 className="text-xl font-bold text-gray-900">
                {t(`questionnaire.currentIllness.${currentPathway.id}`, currentPathway.name)}
              </h2>
            </div>
            {activePathways.length > 1 && (
              <span className="text-sm text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                {step2PathwayIndex + 1} / {activePathways.length}
              </span>
            )}
          </div>
        </div>

        {/* Red flag banner */}
        {redFlagsForPathway.length > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-300 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">
                {t('adaptive.redFlagAlert', '⚠️ Red Flag Alert')}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {t('adaptive.redFlagMessage', 'Critical symptoms detected. Please inform the medical staff immediately.')}
              </p>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {visibleQuestions.map(question => renderPathwayQuestion(question, responses, currentPathway.id))}
        </div>

        {/* Optional additional details */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="block text-sm font-semibold text-gray-700">
            {t('adaptive.additionalDetails', 'Additional Details')}
            <span className="ml-1 text-xs font-normal text-gray-400">({t('questionnaire.step2.optional', 'optional')})</span>
          </label>
          <textarea
            value={(responses['_additionalDetails'] as string) || ''}
            onChange={e => updatePathwayResponse(currentPathway.id, '_additionalDetails', e.target.value)}
            placeholder={t('adaptive.additionalDetailsPlaceholder', 'Any other information you would like to share...')}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>
    );
  };

  // Unused renderStep4 function - commented out to avoid linting warnings
  /*
  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">{t('questionnaire.step4')}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t('questionnaire.vitals.bloodPressure')}</label>
          <Input
            value={formData.vitals.bp}
            onChange={(e) => updateFormData('vitals', 'bp', e.target.value)}
            placeholder="120/80"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('questionnaire.vitals.heartRate')}</label>
          <Input
            value={formData.vitals.hr}
            onChange={(e) => updateFormData('vitals', 'hr', e.target.value)}
            placeholder="80"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('questionnaire.vitals.oxygenSaturation')}</label>
          <Input
            value={formData.vitals.spo2}
            onChange={(e) => updateFormData('vitals', 'spo2', e.target.value)}
            placeholder="98"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('questionnaire.vitals.temperature')}</label>
          <Input
            value={formData.vitals.temp}
            onChange={(e) => updateFormData('vitals', 'temp', e.target.value)}
            placeholder="36.7"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('case.vitals.respiratoryRate')}</label>
          <Input
            value={formData.vitals.respRate}
            onChange={(e) => updateFormData('vitals', 'respRate', e.target.value)}
            placeholder="16"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('case.vitals.painScore')}</label>
          <Input
            type="number"
            min="1"
            max="10"
            value={formData.vitals.painScore}
            onChange={(e) => updateFormData('vitals', 'painScore', e.target.value)}
            placeholder="2"
          />
        </div>
      </div>
    </div>
  );
  */

  // ─── Render dispatcher ─────────────────────────────────────────────────────
  const renderContent = () => {
    if (currentStep === 1) return renderStep1();
    return renderStep2();
  };

  // ─── Loading / error / submitted states ────────────────────────────────────
  if (isLoadingCase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (caseError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600 mb-4">{t('questionnaire.errors.saveError')}</p>
          <Button onClick={() => window.location.reload()}>{t('common.retry')}</Button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('case.questionnaire.noData')}</h2>
          <Button onClick={() => navigate('/scan')}>{t('common.back')}</Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">
              {t('questionnaire.confirmationTitle', 'Thank you')}
            </h2>
            <p className="text-gray-600">
              {t('questionnaire.confirmationMessage', 'Thank you for filling out your information. A doctor will review your case shortly.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Next button label / disabled logic ────────────────────────────────────
  const isLastScreen =
    currentStep === 2 &&
    (activePathways.length === 0 || step2PathwayIndex >= activePathways.length - 1);
  const isNextDisabled =
    (currentStep === 1 && screen === SCREEN_PERSONAL && !isPersonalValid) ||
    (currentStep === 1 && screen === SCREEN_ILLNESS && selectedIllnessCount === 0);

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Language Toggle */}
      <div className={`fixed top-4 ${isRTL ? 'left-4' : 'right-4'} z-10`}>
        <Button variant="outline" size="sm" onClick={toggleLanguage} className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t('language.toggle')}
        </Button>
      </div>

      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <Shield className="h-10 w-10 text-blue-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">{t('questionnaire.title')}</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t('questionnaire.greeting', { name: caseData?.patientName || 'Patient' })}
          </p>
        </div>

        {/* Step 1 Progress dots / Step 2 progress bar */}
        {currentStep === 1
          ? renderProgressDots()
          : (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600 font-medium">{t('questionnaire.step2.symptoms', 'Current Symptoms')}</span>
                <span className="text-sm text-gray-400">
                  {activePathways.length > 1
                    ? `${step2PathwayIndex + 1} / ${activePathways.length}`
                    : 'Step 2 of 2'
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: activePathways.length > 1
                      ? `${((step2PathwayIndex + 1) / activePathways.length) * 100}%`
                      : '100%'
                  }}
                />
              </div>
            </div>
          )}

        {/* Form Card */}
        <Card className="shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {renderContent()}
          </CardContent>
        </Card>

        {/* Sticky Navigation */}
        <div className="flex justify-between mt-6 gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 && screen === SCREEN_PERSONAL}
            className="flex items-center gap-2 min-w-[100px]"
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {t('questionnaire.navigation.previous')}
          </Button>

          <Button
            onClick={handleNext}
            disabled={isNextDisabled || isSubmitting}
            className={`flex items-center gap-2 min-w-[100px] ${
              isLastScreen
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {t('questionnaire.navigation.loading')}
              </>
            ) : isLastScreen ? (
              <>
                <CheckCircle className="h-4 w-4" />
                {t('questionnaire.navigation.finish')}
              </>
            ) : (
              <>
                {t('questionnaire.navigation.next')}
                {isRTL ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-400 text-xs">
          {t('footer.copyright')}
        </footer>
      </div>
    </div>
  );
}

export default QuestionnairePage;