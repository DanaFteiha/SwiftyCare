import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, ArrowRight, ArrowLeft, CheckCircle, Globe } from 'lucide-react';
import { apiFetch } from '@/lib/api';

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

// Adaptive Questionnaire Configuration
const ADAPTIVE_QUESTIONNAIRE = {
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

function QuestionnairePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<QuestionnaireData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const totalSteps = 2; // Patient completes 2 steps, vitals are for nurses

  // Language toggle function
  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
  };

  // Toggle detail expansion for adaptive questions
  const toggleDetailExpansion = (questionId: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Validation functions
  const validateAge = (age: string): string | undefined => {
    if (!age.trim()) return t('questionnaire.errors.ageRequired');
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return t('questionnaire.errors.ageInvalid');
    if (ageNum < 0 || ageNum > 120) return t('questionnaire.errors.ageRange');
    return undefined;
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required fields for step 1
    if (!formData.personalInfo.gender.trim()) {
      newErrors.gender = t('questionnaire.errors.genderRequired');
    }
    
    const ageError = validateAge(formData.personalInfo.age);
    if (ageError) {
      newErrors.age = ageError;
    }
    
    if (!formData.personalInfo.maritalStatus.trim()) {
      newErrors.maritalStatus = t('questionnaire.errors.maritalStatusRequired');
    }
    
    if (!formData.personalInfo.cognitiveState.trim()) {
      newErrors.cognitiveState = t('questionnaire.errors.cognitiveStateRequired');
    }
    
    if (!formData.personalInfo.functionalState.trim()) {
      newErrors.functionalState = t('questionnaire.errors.functionalStateRequired');
    }
    
    // Check if at least one medical history option is selected
    const hasMedicalHistory = Object.values(formData.medicalHistory).some(value => 
      typeof value === 'boolean' ? value : false
    );
    if (!hasMedicalHistory) {
      newErrors.medicalHistory = t('questionnaire.errors.medicalHistoryRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isStep1Valid = (): boolean => {
    const hasMedicalHistory = Object.values(formData.medicalHistory).some(value => 
      typeof value === 'boolean' ? value : false
    );
    
    return (
      formData.personalInfo.gender.trim() !== '' &&
      formData.personalInfo.age.trim() !== '' &&
      formData.personalInfo.maritalStatus.trim() !== '' &&
      formData.personalInfo.cognitiveState.trim() !== '' &&
      formData.personalInfo.functionalState.trim() !== '' &&
      !validateAge(formData.personalInfo.age) &&
      hasMedicalHistory
    );
  };

  // Debug logging
  console.log('QuestionnairePage rendered with caseId:', caseId);

  // Fetch case data
  const { data: caseData, isLoading: isLoadingCase, error: caseError } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => apiFetch(`/cases/${caseId}`).then(res => {
      if (!res.ok) {
        throw new Error('Failed to fetch case');
      }
      return res.json();
    }),
    enabled: !!caseId
  });

  // Submit questionnaire mutation
  const submitQuestionnaire = useMutation({
    mutationFn: (answers: any) =>
      apiFetch(`/cases/${caseId}/questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      })
  });


  const updateFormData = (section: keyof QuestionnaireData, field: string, value: any) => {
    console.log(`Updating form data: ${section}.${field} = ${value}`);
    setFormData(prev => {
      const newData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };
      console.log('New form data:', newData);
      return newData;
    });
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) {
      return; // Don't proceed if validation fails
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('Submitting questionnaire...');
      console.log('Form data being submitted:', formData);
      
      // Submit questionnaire only (vitals will be entered by nurse)
      await submitQuestionnaire.mutateAsync(formData);

      // Ensure case status is OPEN after patient completes questionnaire
      await apiFetch(`/cases/${caseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'open' })
      });
      
      console.log('Questionnaire submitted successfully, showing confirmation...');
      setIsSubmitted(true);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      // Show error message to user
      alert('שגיאה בשליחת השאלון. נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Personal Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('questionnaire.personalInfo.title')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('questionnaire.personalInfo.gender')}</label>
            <select
              value={formData.personalInfo.gender}
              onChange={(e) => updateFormData('personalInfo', 'gender', e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>{t('questionnaire.personalInfo.selectGender')}</option>
              <option value="male">{t('questionnaire.personalInfo.male')}</option>
              <option value="female">{t('questionnaire.personalInfo.female')}</option>
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('questionnaire.personalInfo.age')}</label>
            <Input
              type="number"
              min="0"
              max="120"
              value={formData.personalInfo.age}
              onChange={(e) => updateFormData('personalInfo', 'age', e.target.value)}
              placeholder={t('questionnaire.personalInfo.agePlaceholder')}
              className={errors.age ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.age && (
              <p className="text-red-500 text-sm mt-1">{errors.age}</p>
            )}
          </div>

          {/* Marital Status */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('questionnaire.personalInfo.maritalStatus')}</label>
            <select
              value={formData.personalInfo.maritalStatus}
              onChange={(e) => updateFormData('personalInfo', 'maritalStatus', e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>{t('questionnaire.personalInfo.selectMaritalStatus')}</option>
              <option value="married">{t('questionnaire.personalInfo.married')}</option>
              <option value="single">{t('questionnaire.personalInfo.single')}</option>
              <option value="divorced">{t('questionnaire.personalInfo.divorced')}</option>
              <option value="widowed">{t('questionnaire.personalInfo.widowed')}</option>
            </select>
          </div>

          {/* Cognitive State */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('questionnaire.personalInfo.cognitiveState')}</label>
            <select
              value={formData.personalInfo.cognitiveState}
              onChange={(e) => updateFormData('personalInfo', 'cognitiveState', e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>{t('questionnaire.personalInfo.selectCognitiveState')}</option>
              <option value="conscious">{t('questionnaire.personalInfo.conscious')}</option>
              <option value="confused">{t('questionnaire.personalInfo.confused')}</option>
              <option value="unconscious">{t('questionnaire.personalInfo.unconscious')}</option>
            </select>
          </div>

          {/* Functional State */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('questionnaire.personalInfo.functionalState')}</label>
            <select
              value={formData.personalInfo.functionalState}
              onChange={(e) => updateFormData('personalInfo', 'functionalState', e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>{t('questionnaire.personalInfo.selectFunctionalState')}</option>
              <option value="independent">{t('questionnaire.personalInfo.independent')}</option>
              <option value="dependent">{t('questionnaire.personalInfo.dependent')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Medical History Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('questionnaire.medicalHistory.title')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column - 4 items */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.none}
                onChange={(e) => updateFormData('medicalHistory', 'none', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.none')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.diabetes}
                onChange={(e) => updateFormData('medicalHistory', 'diabetes', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.diabetes')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.hypertension}
                onChange={(e) => updateFormData('medicalHistory', 'hypertension', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.hypertension')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.dyslipidemia}
                onChange={(e) => updateFormData('medicalHistory', 'dyslipidemia', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.dyslipidemia')}</span>
            </label>
          </div>

          {/* Middle Column - 4 items */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.asthma}
                onChange={(e) => updateFormData('medicalHistory', 'asthma', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.asthma')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.ischemicHeartDisease}
                onChange={(e) => updateFormData('medicalHistory', 'ischemicHeartDisease', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.ischemicHeartDisease')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.cancer}
                onChange={(e) => updateFormData('medicalHistory', 'cancer', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.cancer')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.previousStroke}
                onChange={(e) => updateFormData('medicalHistory', 'previousStroke', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.previousStroke')}</span>
            </label>
          </div>

          {/* Right Column - 4 items */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.hypothyroidism}
                onChange={(e) => updateFormData('medicalHistory', 'hypothyroidism', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.hypothyroidism')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.copd}
                onChange={(e) => updateFormData('medicalHistory', 'copd', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.copd')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.medicalHistory.previousSurgeries}
                onChange={(e) => updateFormData('medicalHistory', 'previousSurgeries', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.medicalHistory.previousSurgeries')}</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.medicalHistory.otherDiseases}
                  onChange={(e) => updateFormData('medicalHistory', 'otherDiseases', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{t('questionnaire.medicalHistory.otherDiseases')}</span>
              </label>
              {formData.medicalHistory.otherDiseases && (
                <div className="ml-6">
                  <Input
                    value={formData.medicalHistory.otherDiseasesText}
                    onChange={(e) => updateFormData('medicalHistory', 'otherDiseasesText', e.target.value)}
                    placeholder={t('questionnaire.medicalHistory.otherDiseasesPlaceholder')}
                    className="w-full text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {errors.medicalHistory && (
          <p className="text-red-500 text-sm mt-2">{errors.medicalHistory}</p>
        )}
      </div>

      {/* Medications Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('questionnaire.medications.allergies.title')}</h3>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">{t('questionnaire.medications.allergies.question')}</p>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="hasAllergies"
                value="yes"
                checked={formData.medications.allergies.hasAllergies === 'yes'}
                onChange={(e) => updateFormData('medications', 'allergies', { ...formData.medications.allergies, hasAllergies: e.target.value })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{t('questionnaire.medications.allergies.yes')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="hasAllergies"
                value="no"
                checked={formData.medications.allergies.hasAllergies === 'no'}
                onChange={(e) => updateFormData('medications', 'allergies', { ...formData.medications.allergies, hasAllergies: e.target.value })}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">{t('questionnaire.medications.allergies.no')}</span>
            </label>
          </div>
          {formData.medications.allergies.hasAllergies === 'yes' && (
            <div className="mt-3">
              <Input
                value={formData.medications.allergies.allergyDetails}
                onChange={(e) => updateFormData('medications', 'allergies', { ...formData.medications.allergies, allergyDetails: e.target.value })}
                placeholder={t('questionnaire.medications.allergies.detailsPlaceholder')}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Medication Groups Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('questionnaire.medications.groups.title')}</h3>
        
        {/* Blood Pressure Medications */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-800">{t('questionnaire.medications.groups.bloodPressure')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Losartan', 'Ramipril', 'Enalapril', 'Normalol', 'Amiodarone', 'Nifedipine', 'Amlodipine', 'Valsartan', 'Carvedilol', 'Entresto', 'Spironolactone', 'Fusid', 'Bisoprolol'].map((medication) => (
              <label key={medication} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.medications.groups.bloodPressure.includes(medication)}
                  onChange={(e) => {
                    const currentMedications = formData.medications.groups.bloodPressure;
                    const updatedMedications = e.target.checked
                      ? [...currentMedications, medication]
                      : currentMedications.filter((med: string) => med !== medication);
                    updateFormData('medications', 'groups', { ...formData.medications.groups, bloodPressure: updatedMedications });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{medication}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Diabetes Medications */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-800">{t('questionnaire.medications.groups.diabetes')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Short Acting Insulin', 'Empagliflozin', 'Dapagliflozin', 'Disothiazide', 'Glucomin', 'LIRAGLUTIDE', 'Basal Insulin'].map((medication) => (
              <label key={medication} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.medications.groups.diabetes.includes(medication)}
                  onChange={(e) => {
                    const currentMedications = formData.medications.groups.diabetes;
                    const updatedMedications = e.target.checked
                      ? [...currentMedications, medication]
                      : currentMedications.filter((med: string) => med !== medication);
                    updateFormData('medications', 'groups', { ...formData.medications.groups, diabetes: updatedMedications });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{medication}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Blood Thinners */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-800">{t('questionnaire.medications.groups.bloodThinners')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Clopidogrel', 'Warfarin (Coumadin)', 'Digoxin', 'Exenatide', 'Apixaban', 'Rivaroxaban', 'Dabigatran', 'Aspirin'].map((medication) => (
              <label key={medication} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.medications.groups.bloodThinners.includes(medication)}
                  onChange={(e) => {
                    const currentMedications = formData.medications.groups.bloodThinners;
                    const updatedMedications = e.target.checked
                      ? [...currentMedications, medication]
                      : currentMedications.filter((med: string) => med !== medication);
                    updateFormData('medications', 'groups', { ...formData.medications.groups, bloodThinners: updatedMedications });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{medication}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Immunosuppressants */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-800">{t('questionnaire.medications.groups.immunosuppressants')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Prednisone', 'MTX (Methotrexate)', 'Rituximab', 'Actemra'].map((medication) => (
              <label key={medication} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.medications.groups.immunosuppressants.includes(medication)}
                  onChange={(e) => {
                    const currentMedications = formData.medications.groups.immunosuppressants;
                    const updatedMedications = e.target.checked
                      ? [...currentMedications, medication]
                      : currentMedications.filter((med: string) => med !== medication);
                    updateFormData('medications', 'groups', { ...formData.medications.groups, immunosuppressants: updatedMedications });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{medication}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Miscellaneous */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-800">{t('questionnaire.medications.groups.miscellaneous')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Inhaled Coliracin', 'Inhaled Aerovent', 'Inhaled Bricalin', 'Inhaled Ventolin', 'Cipramil', 'Miro', 'Inhaled Budicort', 'Inhaled Hypertonic Saline', 'Eltroxi'].map((medication) => (
              <label key={medication} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.medications.groups.miscellaneous.includes(medication)}
                  onChange={(e) => {
                    const currentMedications = formData.medications.groups.miscellaneous;
                    const updatedMedications = e.target.checked
                      ? [...currentMedications, medication]
                      : currentMedications.filter((med: string) => med !== medication);
                    updateFormData('medications', 'groups', { ...formData.medications.groups, miscellaneous: updatedMedications });
                  }}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{medication}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Current Illness Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('questionnaire.currentIllness.title')}</h3>
        <p className="text-sm text-gray-700">{t('questionnaire.currentIllness.instruction')}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.abdominalPain}
                onChange={(e) => updateFormData('currentIllness', 'abdominalPain', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.abdominalPain')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.fatigueWeakness}
                onChange={(e) => updateFormData('currentIllness', 'fatigueWeakness', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.fatigueWeakness')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.headache}
                onChange={(e) => updateFormData('currentIllness', 'headache', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.headache')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.earPain}
                onChange={(e) => updateFormData('currentIllness', 'earPain', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.earPain')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.eyeProblems}
                onChange={(e) => updateFormData('currentIllness', 'eyeProblems', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.eyeProblems')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.backPain}
                onChange={(e) => updateFormData('currentIllness', 'backPain', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.backPain')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.headInjury}
                onChange={(e) => updateFormData('currentIllness', 'headInjury', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.headInjury')}</span>
            </label>
          </div>

          {/* Middle Column */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.shortnessOfBreath}
                onChange={(e) => updateFormData('currentIllness', 'shortnessOfBreath', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.shortnessOfBreath')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.changeInConsciousness}
                onChange={(e) => updateFormData('currentIllness', 'changeInConsciousness', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.changeInConsciousness')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.nauseaVomitingDiarrhea}
                onChange={(e) => updateFormData('currentIllness', 'nauseaVomitingDiarrhea', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.nauseaVomitingDiarrhea')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.jointPain}
                onChange={(e) => updateFormData('currentIllness', 'jointPain', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.jointPain')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.painInLimbs}
                onChange={(e) => updateFormData('currentIllness', 'painInLimbs', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.painInLimbs')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.injectionSitePain}
                onChange={(e) => updateFormData('currentIllness', 'injectionSitePain', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.injectionSitePain')}</span>
            </label>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.chestPain}
                onChange={(e) => updateFormData('currentIllness', 'chestPain', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.chestPain')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.fever}
                onChange={(e) => updateFormData('currentIllness', 'fever', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.fever')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.injuryTrauma}
                onChange={(e) => updateFormData('currentIllness', 'injuryTrauma', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.injuryTrauma')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.swellingEdema}
                onChange={(e) => updateFormData('currentIllness', 'swellingEdema', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.swellingEdema')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.chestPainSternum}
                onChange={(e) => updateFormData('currentIllness', 'chestPainSternum', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.chestPainSternum')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.dizziness}
                onChange={(e) => updateFormData('currentIllness', 'dizziness', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.dizziness')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.currentIllness.neckPain}
                onChange={(e) => updateFormData('currentIllness', 'neckPain', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">{t('questionnaire.currentIllness.neckPain')}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // Adaptive Questionnaire Logic

  const shouldShowQuestion = (_questionId: string, question: any) => {
    if (!question.condition) return true;
    
    const conditions = question.condition.split('|');
    return conditions.some((condition: string) => {
      // Check if any response matches the condition
      const responses = formData.adaptiveQuestions.responses;
      return Object.values(responses).some(response => {
        if (Array.isArray(response)) {
          return response.includes(condition);
        }
        return response === condition;
      });
    });
  };


  const checkRedFlags = () => {
    const redFlags: string[] = [];
    const responses = formData.adaptiveQuestions.responses;

    // Check for red flag responses
    for (const [_questionId, response] of Object.entries(responses)) {
      if (Array.isArray(response)) {
        if (response.includes('severePain') || response.includes('lossOfConsciousness') || response.includes('acuteDistress')) {
          redFlags.push('redFlag');
        }
      } else if (response === 'severe' || response === 'veryHigh') {
        redFlags.push('redFlag');
      }
    }

    return redFlags;
  };

  const handleAdaptiveResponse = (questionId: string, value: any) => {
    const newResponses = {
      ...formData.adaptiveQuestions.responses,
      [questionId]: value
    };

    const newRedFlags = checkRedFlags();

    updateFormData('adaptiveQuestions', 'responses', newResponses);
    updateFormData('adaptiveQuestions', 'redFlags', newRedFlags);
  };

  const renderAdaptiveQuestion = (question: any) => {
    const currentValue = formData.adaptiveQuestions.responses[question.id] || (question.type === 'checkbox' ? [] : '');

    switch (question.type) {
      case 'checkbox':
        return (
          <div key={question.id} className="space-y-3">
            <h4 className="text-md font-medium text-gray-800">{String(t(`adaptive.${question.id}.label`, question.label))}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {question.options.map((option: any) => (
                <label key={option.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Array.isArray(currentValue) && currentValue.includes(option.id)}
                    onChange={(e) => {
                      const newValue = Array.isArray(currentValue) 
                        ? e.target.checked 
                          ? [...currentValue, option.id]
                          : currentValue.filter((v: string) => v !== option.id)
                        : e.target.checked ? [option.id] : [];
                      handleAdaptiveResponse(question.id, newValue);
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{String(t(`adaptive.${question.id}.${option.id}`, option.label))}</span>
                </label>
              ))}
            </div>
            <button 
              type="button"
              className="text-blue-600 text-sm hover:underline"
              onClick={() => toggleDetailExpansion(question.id)}
            >
              {expandedDetails[question.id] 
                ? t('adaptive.hideDetail', 'Hide detail') 
                : t('adaptive.addDetail', 'Add detail')
              }
            </button>
            {expandedDetails[question.id] && (
              <div className="mt-3">
                <textarea
                  value={formData.adaptiveQuestions.responses[`${question.id}_detail`] || ''}
                  onChange={(e) => handleAdaptiveResponse(`${question.id}_detail`, e.target.value)}
                  placeholder="Please provide additional details..."
                  className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={question.id} className="space-y-3">
            <h4 className="text-md font-medium text-gray-800">{String(t(`adaptive.${question.id}.label`, question.label))}</h4>
            <select
              value={currentValue}
              onChange={(e) => handleAdaptiveResponse(question.id, e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('adaptive.selectOption', 'Select an option')}</option>
              {question.options.map((option: any) => (
                <option key={option.id} value={option.id}>
                  {String(t(`adaptive.${question.id}.${option.id}`, option.label))}
                </option>
              ))}
            </select>
            <button 
              type="button"
              className="text-blue-600 text-sm hover:underline"
              onClick={() => toggleDetailExpansion(question.id)}
            >
              {expandedDetails[question.id] 
                ? t('adaptive.hideDetail', 'Hide detail') 
                : t('adaptive.addDetail', 'Add detail')
              }
            </button>
            {expandedDetails[question.id] && (
              <div className="mt-3">
                <textarea
                  value={formData.adaptiveQuestions.responses[`${question.id}_detail`] || ''}
                  onChange={(e) => handleAdaptiveResponse(`${question.id}_detail`, e.target.value)}
                  placeholder="Please provide additional details..."
                  className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div key={question.id} className="space-y-3">
            <h4 className="text-md font-medium text-gray-800">{String(t(`adaptive.${question.id}.label`, question.label))}</h4>
            <textarea
              value={currentValue}
              onChange={(e) => handleAdaptiveResponse(question.id, e.target.value)}
              placeholder={String(t(`adaptive.${question.id}.placeholder`, question.placeholder))}
              className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderStep2 = () => {
    // Get selected symptoms from Step 1 Current Illness
    const selectedSymptoms = Object.entries(formData.currentIllness)
      .filter(([_key, value]) => value === true)
      .map(([key]) => key);

    // Map symptoms to pathways
    const symptomToPathway: Record<string, string> = {
      chestPain: 'chestPain',
      chestPainSternum: 'chestPain',
      fever: 'fever',
      shortnessOfBreath: 'shortnessOfBreath',
      dizziness: 'dizziness',
      headache: 'headache',
      nauseaVomitingDiarrhea: 'nauseaVomitingDiarrhea',
      abdominalPain: 'abdominalPain',
      injuryTrauma: 'injuryTrauma',
      headInjury: 'injuryTrauma',
      changeInConsciousness: 'changeInConsciousness',
      backPain: 'backPain',
      neckPain: 'neckPain',
      swellingEdema: 'shortnessOfBreath',
      fatigueWeakness: 'fever',
      jointPain: 'fever',
      painInLimbs: 'injuryTrauma',
      earPain: 'fever',
      eyeProblems: 'eyeProblems',
      injectionSitePain: 'injuryTrauma'
    };

    // Get unique pathways based on selected symptoms
    const relevantPathways = [...new Set(selectedSymptoms.map(symptom => symptomToPathway[symptom]).filter(Boolean))];

    if (selectedSymptoms.length === 0) {
      return (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">{t('questionnaire.step2')}</h2>
          <div className="text-center space-y-4">
            <div className="text-gray-500">
              <p className="text-lg">{t('adaptive.noSymptomsSelected', 'No symptoms selected')}</p>
              <p className="text-sm">{t('adaptive.goBackToStep1', 'Please go back to Step 1 and select your symptoms')}</p>
            </div>
            <Button onClick={() => setCurrentStep(1)} variant="outline">
              {t('common.back')} - {t('questionnaire.step1')}
            </Button>
          </div>
        </div>
      );
    }

    // Get all questions from relevant pathways
    const allQuestions: any[] = [];
    const allRedFlags: string[] = [];

    relevantPathways.forEach(pathwayId => {
      const pathway = ADAPTIVE_QUESTIONNAIRE.pathways[pathwayId as keyof typeof ADAPTIVE_QUESTIONNAIRE.pathways];
      if (pathway) {
        allRedFlags.push(...pathway.redFlags);
        Object.entries(pathway.questions).forEach(([questionId, question]) => {
          if (!allQuestions.find(q => q.id === questionId)) {
            allQuestions.push({ ...question, id: questionId, pathway: pathwayId });
          }
        });
      }
    });

    // Check for red flags
    const currentRedFlags = checkRedFlags();

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">{t('questionnaire.step2')}</h2>
        
        {/* Selected Symptoms Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-md font-medium text-blue-900 mb-2">
            {t('adaptive.selectedSymptoms', 'Selected Symptoms')}:
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedSymptoms.map(symptom => (
              <span key={symptom} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {t(`questionnaire.currentIllness.${symptom}`, symptom)}
              </span>
            ))}
          </div>
        </div>

        {/* Red Flag Alert */}
        {currentRedFlags.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="font-medium">{t('adaptive.redFlagAlert', '⚠️ Red Flag Alert')}</span>
            </div>
            <p className="text-sm mt-1">{t('adaptive.redFlagMessage', 'Critical symptoms detected. Immediate medical attention may be required.')}</p>
          </div>
        )}

        {/* Adaptive Questions */}
        <div className="space-y-6">
          {allQuestions.map(question => {
            // Only show questions that should be visible based on current responses
            if (shouldShowQuestion(question.id, question)) {
              return renderAdaptiveQuestion(question);
            }
            return null;
          })}
        </div>

        {/* Additional Details Text Area */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-800">{t('adaptive.additionalDetails', 'Additional Details')}</h4>
          <textarea
            value={formData.adaptiveQuestions.responses.additionalDetails || ''}
            onChange={(e) => handleAdaptiveResponse('additionalDetails', e.target.value)}
            placeholder={t('adaptive.additionalDetailsPlaceholder', 'Please provide any additional information')}
            className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center">{t('questionnaire.step3')}</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">{t('questionnaire.medicalHistory.medications')}</label>
          <Input
            value={formData.medications.allergies.allergyDetails}
            onChange={(e) => updateFormData('medications', 'allergies', { ...formData.medications.allergies, allergyDetails: e.target.value })}
            placeholder={t('questionnaire.medications.allergies.detailsPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">{t('questionnaire.medicalHistory.allergies')}</label>
          <Input
            value={formData.medications.allergies.hasAllergies}
            onChange={(e) => updateFormData('medications', 'allergies', { ...formData.medications.allergies, hasAllergies: e.target.value })}
            placeholder={t('questionnaire.medications.allergies.question')}
          />
        </div>
      </div>
    </div>
  );

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

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3(); // Use the vitals step as step 3
      default: return renderStep1();
    }
  };

  // Loading state
  if (isLoadingCase) {
    console.log('QuestionnairePage: Loading case data...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (caseError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Shield className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600 mb-4">{t('questionnaire.errors.saveError')}</p>
          <Button onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  // No case data
  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Shield className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('case.questionnaire.noData')}</h2>
          <p className="text-gray-600 mb-4">{t('case.questionnaire.noData')}</p>
          <Button onClick={() => navigate('/scan')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Shield className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('questionnaire.confirmationTitle', 'Thank you')}
            </h2>
            <p className="text-gray-600">
              {t(
                'questionnaire.confirmationMessage',
                'Thank you for filling out your information. A doctor will review your case shortly.'
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('QuestionnairePage: Rendering main component with caseData:', caseData);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      {/* Language Toggle Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          {t('language.toggle')}
        </Button>
      </div>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('questionnaire.title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('questionnaire.greeting', { name: caseData?.patientName || 'Patient' })}
          </p>
          <p className="text-sm text-gray-500 mt-1">Case ID: {caseId}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{t('common.step')} {currentStep} {t('common.of')} {totalSteps}</span>
            <span className="text-sm text-gray-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="p-8">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('questionnaire.navigation.previous')}
          </Button>

          {currentStep < 2 ? (
            <Button
              onClick={nextStep}
              disabled={currentStep === 1 && !isStep1Valid()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {t('questionnaire.navigation.next')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              {isSubmitting ? t('questionnaire.navigation.loading') : t('questionnaire.navigation.finish')}
            </Button>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          {t('footer.copyright')}
        </footer>
      </div>
    </div>
  );
}

export default QuestionnairePage;