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