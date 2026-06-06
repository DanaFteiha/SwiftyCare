// ─── Types ─────────────────────────────────────────────────────────────────

export type AbdomenRegionId =
  | 'RUQ' | 'epigastric' | 'LUQ'
  | 'rightFlank' | 'periumbilical' | 'leftFlank'
  | 'RLQ' | 'suprapubic' | 'LLQ';

export type HeadRegionId =
  | 'frontal' | 'temporalLeft' | 'temporalRight'
  | 'occipital' | 'vertex' | 'diffuse';

export type Laterality = 'bilateral' | 'left' | 'right' | 'notApplicable';

export interface LocationSelection {
  regionIds: string[];
  laterality?: Laterality;
}

export type QuestionType =
  | 'singleSelect'
  | 'multiSelect'
  | 'slider'
  | 'boolean'
  | 'locationPicker'
  | 'text';

export interface PathwayOption {
  id: string;
  label: string;
}

export interface PersonalCondition {
  // Restrict the question to a specific gender (e.g. pregnancy red flags).
  gender?: 'male' | 'female';
  // Inclusive lower bound on the patient's age (years).
  minAge?: number;
  // Exclusive upper bound on the patient's age (years).
  // `maxAge: 50` therefore means "age < 50".
  maxAge?: number;
}

export interface PathwayQuestion {
  id: string;
  type: QuestionType;
  label: string;
  options?: PathwayOption[];
  min?: number;
  max?: number;
  maxSelections?: number;
  locationPickerType?: 'abdomen' | 'head';
  condition?: { questionId: string; value: any } | null;
  // Hide the question unless the patient's Step-1 personal info matches.
  // Used for gender/age-specific red-flags (e.g. pregnancy in females < 50).
  personalCondition?: PersonalCondition;
  isRedFlag?: boolean;
  redFlagValues?: any[];
  required?: boolean;
}

export interface PersonalInfoContext {
  gender?: string;
  age?: string;
}

export interface SymptomPathway {
  id: string;
  name: string;
  questions: PathwayQuestion[];
}

export interface SymptomResponseEntry {
  pathwayId: string;
  responses: Record<string, any>;
  locationData?: LocationSelection;
  severity?: number;
  redFlagsTriggered: string[];
}

export interface AdaptiveQuestionsData {
  completedPathways: SymptomResponseEntry[];
  overallRedFlags: string[];
  completed: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// Evaluate the optional `personalCondition` against the patient's Step-1
// answers. Returns true when the question should remain visible.
function matchesPersonalCondition(
  condition: PersonalCondition | undefined,
  personalInfo: PersonalInfoContext | undefined
): boolean {
  if (!condition) return true;
  if (condition.gender && personalInfo?.gender !== condition.gender) {
    return false;
  }
  if (condition.minAge != null || condition.maxAge != null) {
    const rawAge = personalInfo?.age;
    const ageNum = rawAge !== undefined && rawAge !== '' ? Number(rawAge) : NaN;
    if (!Number.isFinite(ageNum)) return false;
    if (condition.minAge != null && ageNum < condition.minAge) return false;
    if (condition.maxAge != null && ageNum >= condition.maxAge) return false;
  }
  return true;
}

export function isQuestionVisible(
  question: PathwayQuestion,
  responses: Record<string, any>,
  personalInfo?: PersonalInfoContext
): boolean {
  // First filter on patient demographics (Step 1) — keeps gender/age specific
  // questions like "could you be pregnant?" out of the form when they don't apply.
  if (!matchesPersonalCondition(question.personalCondition, personalInfo)) {
    return false;
  }
  if (!question.condition) return true;
  const { questionId, value } = question.condition;
  const response = responses[questionId];
  if (Array.isArray(response)) return response.includes(value);
  if (Array.isArray(value)) return value.includes(response);
  return response === value;
}

export function getRedFlagsForPathway(
  pathway: SymptomPathway,
  responses: Record<string, any>,
  personalInfo?: PersonalInfoContext
): string[] {
  const flags: string[] = [];
  for (const q of pathway.questions) {
    if (!q.isRedFlag) continue;
    // Skip red-flag scoring for questions that wouldn't even be shown to this
    // patient — otherwise a stale "yes" answer could keep firing the flag
    // after demographics change.
    if (!matchesPersonalCondition(q.personalCondition, personalInfo)) continue;
    const val = responses[q.id];
    if (val === undefined || val === null) continue;
    if (q.type === 'slider') {
      const threshold = q.redFlagValues?.[0] ?? 8;
      if (typeof val === 'number' && val >= threshold) flags.push(q.id);
    } else if (q.type === 'multiSelect' && Array.isArray(val)) {
      if (q.redFlagValues?.some(rv => val.includes(rv))) flags.push(q.id);
    } else {
      if (q.redFlagValues?.includes(val)) flags.push(q.id);
    }
  }
  return flags;
}

// ─── Full Pathway: Abdominal Pain (OPQRST + red flags) ──────────────────────

const abdominalPainPathway: SymptomPathway = {
  id: 'abdominalPain',
  name: 'Abdominal Pain',
  questions: [
    {
      id: 'abPainLocation',
      type: 'locationPicker',
      locationPickerType: 'abdomen',
      label: 'Where is the pain located?',
      required: true,
    },
    {
      id: 'abOnsetWhen',
      type: 'singleSelect',
      label: 'When did the pain start?',
      options: [
        { id: 'today', label: 'Today' },
        { id: '1to3days', label: '1–3 days ago' },
        { id: '3to7days', label: '3–7 days ago' },
        { id: 'overWeek', label: 'More than a week ago' },
      ],
      required: true,
    },
    {
      id: 'abOnsetType',
      type: 'singleSelect',
      label: 'How did the pain start?',
      options: [
        { id: 'sudden', label: 'Sudden (came on quickly)' },
        { id: 'gradual', label: 'Gradual (built up slowly)' },
      ],
      required: true,
    },
    {
      id: 'abCharacter',
      type: 'singleSelect',
      label: 'How would you describe the pain?',
      options: [
        { id: 'sharp', label: 'Sharp / Stabbing' },
        { id: 'crampy', label: 'Crampy / Colicky' },
        { id: 'dull', label: 'Dull / Aching' },
        { id: 'burning', label: 'Burning' },
        { id: 'pressure', label: 'Pressure / Squeezing' },
      ],
      required: true,
    },
    {
      id: 'abSeverity',
      type: 'slider',
      label: 'Pain severity (0 = no pain, 10 = worst imaginable)',
      min: 0,
      max: 10,
      required: true,
      isRedFlag: true,
      redFlagValues: [8],
    },
    {
      // First ask the simple yes/no — the location follow-up is conditional
      // on a "yes" answer to keep the form short for patients without radiation.
      id: 'abRadiation',
      type: 'boolean',
      label: 'Does the pain radiate?',
      required: true,
    },
    {
      id: 'abRadiationWhere',
      type: 'multiSelect',
      label: 'Where does the pain radiate to?',
      maxSelections: 3,
      condition: { questionId: 'abRadiation', value: true },
      options: [
        { id: 'back', label: 'Back' },
        { id: 'rightShoulder', label: 'Right shoulder' },
        { id: 'leftShoulder', label: 'Left shoulder' },
        { id: 'groin', label: 'Groin' },
        { id: 'chest', label: 'Chest' },
      ],
    },
    {
      id: 'abAggravating',
      type: 'multiSelect',
      label: 'What makes the pain worse?',
      maxSelections: 4,
      options: [
        { id: 'eating', label: 'Eating' },
        { id: 'movement', label: 'Movement' },
        { id: 'deepBreath', label: 'Deep breathing' },
        { id: 'lyingFlat', label: 'Lying flat' },
        { id: 'nothing', label: 'Nothing specific' },
      ],
    },
    {
      id: 'abRelieving',
      type: 'multiSelect',
      label: 'What helps relieve the pain?',
      maxSelections: 4,
      options: [
        { id: 'eating', label: 'Eating' },
        { id: 'antacids', label: 'Antacids' },
        { id: 'passingGas', label: 'Passing gas / stool' },
        { id: 'lyingStill', label: 'Lying still' },
        { id: 'nothing', label: 'Nothing helps' },
      ],
    },
    {
      id: 'abAssociated',
      type: 'multiSelect',
      label: 'Any other symptoms you are experiencing?',
      maxSelections: 5,
      options: [
        { id: 'nausea', label: 'Nausea' },
        { id: 'vomiting', label: 'Vomiting' },
        { id: 'diarrhea', label: 'Diarrhea' },
        { id: 'constipation', label: 'Constipation' },
        { id: 'fever', label: 'Fever' },
        { id: 'jaundice', label: 'Yellowing of skin/eyes (jaundice)' },
        { id: 'bloodStool', label: 'Blood in stool' },
        { id: 'darkUrine', label: 'Dark urine' },
        { id: 'lossOfAppetite', label: 'Loss of appetite' },
        { id: 'bloating', label: 'Bloating' },
      ],
    },
    {
      // Pregnancy red-flag is asked first because positive pregnancy status
      // changes the differential for abdominal pain dramatically (ectopic,
      // appendicitis presenting atypically, etc.). Only shown to females
      // of typical childbearing age.
      id: 'abRfPregnancy',
      type: 'boolean',
      label: 'Are you known to be pregnant, or could you be pregnant?',
      isRedFlag: true,
      redFlagValues: [true],
      personalCondition: { gender: 'female', maxAge: 50 },
    },
    {
      id: 'abRfFever',
      type: 'boolean',
      label: 'Do you have a fever above 38.5°C (101.3°F)?',
      isRedFlag: true,
      redFlagValues: [true],
    },
    {
      id: 'abRfBlood',
      type: 'boolean',
      label: 'Is there any blood in your vomit or stool?',
      isRedFlag: true,
      redFlagValues: [true],
    },
    {
      id: 'abRfUnableToEat',
      type: 'boolean',
      label: 'Have you been unable to eat or drink anything for more than 24 hours?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Full Pathway: Headache (OPQRST + SNNOOP10-inspired) ────────────────────

const headachePathway: SymptomPathway = {
  id: 'headache',
  name: 'Headache',
  questions: [
    {
      id: 'hdLocation',
      type: 'locationPicker',
      locationPickerType: 'head',
      label: 'Where on your head is the pain?',
      required: true,
    },
    {
      id: 'hdOnsetWhen',
      type: 'singleSelect',
      label: 'When did the headache start?',
      options: [
        { id: 'today', label: 'Today' },
        { id: '1to3days', label: '1–3 days ago' },
        { id: '3to7days', label: '3–7 days ago' },
        { id: 'overWeek', label: 'More than a week ago' },
      ],
      required: true,
    },
    {
      id: 'hdOnsetType',
      type: 'singleSelect',
      label: 'How did it start?',
      options: [
        { id: 'thunderclap', label: 'Thunderclap — reached maximum intensity within seconds' },
        { id: 'gradual', label: 'Gradual — built up over minutes or hours' },
      ],
      required: true,
      isRedFlag: true,
      redFlagValues: ['thunderclap'],
    },
    {
      id: 'hdCharacter',
      type: 'singleSelect',
      label: 'What does the headache feel like?',
      options: [
        { id: 'throbbing', label: 'Throbbing / Pulsating' },
        { id: 'pressure', label: 'Pressure / Squeezing (band-like)' },
        { id: 'sharp', label: 'Sharp / Stabbing' },
        { id: 'dull', label: 'Dull / Constant aching' },
      ],
      required: true,
    },
    {
      id: 'hdSeverity',
      type: 'slider',
      label: 'Headache severity (0 = no pain, 10 = worst imaginable)',
      min: 0,
      max: 10,
      required: true,
      isRedFlag: true,
      redFlagValues: [9],
    },
    {
      id: 'hdPattern',
      type: 'singleSelect',
      label: 'What is the pattern of your headache?',
      options: [
        { id: 'constant', label: 'Constant' },
        { id: 'comesAndGoes', label: 'Comes and goes' },
        { id: 'worsening', label: 'Getting progressively worse' },
      ],
    },
    {
      id: 'hdAggravating',
      type: 'multiSelect',
      label: 'What makes the headache worse?',
      maxSelections: 4,
      options: [
        { id: 'light', label: 'Light sensitivity (photophobia)' },
        { id: 'noise', label: 'Noise sensitivity (phonophobia)' },
        { id: 'movement', label: 'Movement / physical activity' },
        { id: 'bending', label: 'Bending forward' },
        { id: 'nothing', label: 'Nothing specific' },
      ],
    },
    {
      id: 'hdAssociated',
      type: 'multiSelect',
      label: 'Any other symptoms you are experiencing?',
      maxSelections: 5,
      options: [
        { id: 'nausea', label: 'Nausea or vomiting' },
        { id: 'visualAura', label: 'Visual aura (zig-zags, blind spot)' },
        { id: 'neckStiffness', label: 'Neck / occipital pain' },
        { id: 'fever', label: 'Fever' },
        { id: 'dizziness', label: 'Dizziness' },
        { id: 'weakness', label: 'Weakness or numbness' },
        { id: 'slurredSpeech', label: 'Slurred speech' },
        { id: 'eyeRedness', label: 'Eye redness or pain' },
      ],
    },
    {
      id: 'hdRfWorstEver',
      type: 'boolean',
      label: 'Is this the worst headache of your life?',
      isRedFlag: true,
      redFlagValues: [true],
    },
    {
      id: 'hdRfNewType',
      type: 'boolean',
      label: 'Is this a new type of headache you have never had before?',
      isRedFlag: true,
      redFlagValues: [true],
    },
    {
      id: 'hdRfFeverNeck',
      type: 'boolean',
      label: 'Do you have fever AND neck pain together?',
      isRedFlag: true,
      redFlagValues: [true],
    },
    {
      id: 'hdRfConfusion',
      type: 'boolean',
      label: 'Are you experiencing confusion or decreased alertness?',
      isRedFlag: true,
      redFlagValues: [true],
    },
    {
      id: 'hdRfWeakness',
      type: 'boolean',
      label: 'Any new weakness, numbness, or difficulty speaking?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Simplified Pathway: Chest Pain ─────────────────────────────────────────

const chestPainPathway: SymptomPathway = {
  id: 'chestPain',
  name: 'Chest Pain',
  questions: [
    {
      id: 'cpCharacter',
      type: 'singleSelect',
      label: 'How would you describe the chest pain?',
      options: [
        { id: 'pressing', label: 'Pressing / Heavy' },
        { id: 'burning', label: 'Burning' },
        { id: 'sharp', label: 'Sharp / Stabbing' },
        { id: 'tight', label: 'Tight / Squeezing' },
      ],
      required: true,
    },
    {
      id: 'cpSeverity',
      type: 'slider',
      label: 'Pain severity (0 = no pain, 10 = worst imaginable)',
      min: 0,
      max: 10,
      required: true,
      isRedFlag: true,
      redFlagValues: [8],
    },
    {
      id: 'cpOnset',
      type: 'singleSelect',
      label: 'When did the chest pain start?',
      options: [
        { id: 'sudden', label: 'Sudden' },
        { id: 'gradual', label: 'Gradual' },
        { id: 'intermittent', label: 'Comes and goes' },
      ],
    },
    {
      id: 'cpAssociated',
      type: 'multiSelect',
      label: 'Do you have any of these associated symptoms?',
      maxSelections: 4,
      options: [
        { id: 'shortnessOfBreath', label: 'Shortness of breath' },
        { id: 'nausea', label: 'Nausea or vomiting' },
        { id: 'sweating', label: 'Sweating' },
        { id: 'leftArm', label: 'Pain in left arm / shoulder' },
        { id: 'jaw', label: 'Pain in jaw / neck' },
        { id: 'dizziness', label: 'Dizziness' },
      ],
    },
    {
      id: 'cpSimilarPast',
      type: 'boolean',
      label: 'Have you had similar pains in the past to this pain?',
      required: true,
    },
    {
      id: 'cpRfRadiation',
      type: 'boolean',
      label: 'Does the pain spread to your arm, jaw, or back?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Simplified Pathway: Fever ───────────────────────────────────────────────

const feverPathway: SymptomPathway = {
  id: 'fever',
  name: 'Fever',
  questions: [
    {
      id: 'fvTemperature',
      type: 'singleSelect',
      label: 'What is your approximate temperature?',
      options: [
        { id: 'lowGrade', label: 'Low grade (37.1–38.0°C / 98.8–100.4°F)' },
        { id: 'moderate', label: 'Moderate (38.1–39.0°C / 100.6–102.2°F)' },
        { id: 'high', label: 'High (39.1–40.0°C / 102.4–104°F)' },
        { id: 'veryHigh', label: 'Very high (above 40°C / 104°F)' },
      ],
      required: true,
      isRedFlag: true,
      redFlagValues: ['veryHigh'],
    },
    {
      id: 'fvDuration',
      type: 'singleSelect',
      label: 'How long have you had the fever?',
      options: [
        { id: 'lessThan24h', label: 'Less than 24 hours' },
        { id: '1to3days', label: '1–3 days' },
        { id: 'moreThan3days', label: 'More than 3 days' },
      ],
      required: true,
    },
    {
      id: 'fvAssociated',
      type: 'multiSelect',
      label: 'Any other symptoms along with the fever?',
      maxSelections: 10,
      options: [
        { id: 'dysuria', label: 'Burning with urination' },
        { id: 'cough', label: 'Cough' },
        { id: 'abdominalPain', label: 'Abdominal pain' },
        { id: 'flankPain', label: 'Flank pain' },
        { id: 'earPain', label: 'Ear pain' },
        { id: 'soreThroat', label: 'Sore throat' },
        { id: 'legRednessSwellingPain', label: 'Leg redness, swelling, or pain' },
        { id: 'diarrhea', label: 'Diarrhea' },
        { id: 'vomiting', label: 'Vomiting' },
        { id: 'rhinorrhea', label: 'Runny nose' },
        { id: 'chestPain', label: 'Chest pain' },
        { id: 'shortnessOfBreath', label: 'Shortness of breath' },
        { id: 'syncope', label: 'Fainting / syncope' },
        { id: 'jaundice', label: 'Jaundice (yellowing of skin or eyes)' },
        { id: 'headache', label: 'Headache' },
        { id: 'bodyAches', label: 'Body aches' },
        { id: 'chills', label: 'Chills / Shivering' },
        { id: 'neckStiffness', label: 'Neck pain' },
        { id: 'rash', label: 'Rash' },
        { id: 'fatigue', label: 'Fatigue / Weakness' },
      ],
    },
    {
      id: 'fvRfAlteredMental',
      type: 'boolean',
      label: 'Is there any confusion, altered consciousness, or inability to wake up?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Simplified Pathway: Cough ──────────────────────────────────────────────

const coughPathway: SymptomPathway = {
  id: 'cough',
  name: 'Cough',
  questions: [
    {
      id: 'ckDuration',
      type: 'singleSelect',
      label: 'How long have you had the cough?',
      options: [
        { id: 'lessThan24h', label: 'Less than 24 hours' },
        { id: '1to7days', label: '1–7 days' },
        { id: 'moreThan7days', label: 'More than a week' },
      ],
      required: true,
    },
    {
      id: 'ckCharacter',
      type: 'singleSelect',
      label: 'What kind of cough is it?',
      options: [
        { id: 'dry', label: 'Dry cough (no phlegm)' },
        { id: 'productiveClear', label: 'Productive — clear or white phlegm' },
        { id: 'productiveColored', label: 'Productive — yellow or green phlegm' },
        { id: 'bloody', label: 'Blood in sputum' },
      ],
      required: true,
      isRedFlag: true,
      redFlagValues: ['bloody'],
    },
    {
      id: 'ckOnset',
      type: 'singleSelect',
      label: 'How did it start?',
      options: [
        { id: 'sudden', label: 'Sudden (within hours)' },
        { id: 'gradual', label: 'Gradual (over days)' },
      ],
    },
    {
      id: 'ckAssociated',
      type: 'multiSelect',
      label: 'Any other symptoms with the cough?',
      maxSelections: 4,
      options: [
        { id: 'shortnessOfBreath', label: 'Shortness of breath' },
        { id: 'chestPain', label: 'Chest pain' },
        { id: 'fever', label: 'Fever' },
        { id: 'wheezing', label: 'Wheezing' },
        { id: 'soreThroat', label: 'Sore throat' },
        { id: 'runnyNose', label: 'Runny nose' },
      ],
      isRedFlag: true,
      redFlagValues: ['shortnessOfBreath', 'chestPain'],
    },
    {
      id: 'ckRfHighFever',
      type: 'boolean',
      label: 'Do you have high fever (above 39°C / 102°F)?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Simplified Pathway: Shortness of Breath ────────────────────────────────

const shortnessOfBreathPathway: SymptomPathway = {
  id: 'shortnessOfBreath',
  name: 'Shortness of Breath',
  questions: [
    {
      id: 'sobSeverity',
      type: 'singleSelect',
      label: 'How severe is your shortness of breath?',
      options: [
        { id: 'mild', label: 'Mild — only with exertion' },
        { id: 'moderate', label: 'Moderate — with normal activities' },
        { id: 'severe', label: 'Severe — at rest' },
        { id: 'cantSpeak', label: 'Cannot speak in full sentences' },
      ],
      required: true,
      isRedFlag: true,
      redFlagValues: ['severe', 'cantSpeak'],
    },
    {
      id: 'sobOnset',
      type: 'singleSelect',
      label: 'How did it start?',
      options: [
        { id: 'sudden', label: 'Sudden (within minutes)' },
        { id: 'gradual', label: 'Gradual (hours to days)' },
        { id: 'chronic', label: 'Chronic (weeks to months)' },
      ],
      isRedFlag: true,
      redFlagValues: ['sudden'],
    },
    {
      id: 'sobTriggers',
      type: 'multiSelect',
      label: 'What triggers or worsens the breathing difficulty?',
      maxSelections: 3,
      options: [
        { id: 'exertion', label: 'Physical exertion' },
        { id: 'lyingFlat', label: 'Lying flat' },
        { id: 'allergens', label: 'Allergens / Environment' },
        { id: 'noTrigger', label: 'No clear trigger' },
      ],
    },
    {
      id: 'sobAssociated',
      type: 'multiSelect',
      label: 'Any associated symptoms?',
      maxSelections: 4,
      options: [
        { id: 'chestPain', label: 'Chest pain' },
        { id: 'wheezing', label: 'Wheezing' },
        { id: 'cough', label: 'Cough' },
        { id: 'blueLips', label: 'Blue lips or fingertips' },
        { id: 'legSwelling', label: 'Leg swelling' },
      ],
      isRedFlag: true,
      redFlagValues: ['chestPain', 'blueLips'],
    },
  ],
};

// ─── Simplified Pathway: Dizziness ──────────────────────────────────────────

const dizzinessPathway: SymptomPathway = {
  id: 'dizziness',
  name: 'Dizziness',
  questions: [
    {
      id: 'dzType',
      type: 'singleSelect',
      label: 'What kind of dizziness are you experiencing?',
      options: [
        { id: 'vertigo', label: 'Vertigo — spinning sensation' },
        { id: 'lightheaded', label: 'Lightheadedness — feeling faint' },
        { id: 'imbalance', label: 'Imbalance — unsteady when walking' },
      ],
      required: true,
    },
    {
      id: 'dzOnset',
      type: 'singleSelect',
      label: 'How did it start?',
      options: [
        { id: 'sudden', label: 'Sudden' },
        { id: 'gradual', label: 'Gradual' },
      ],
    },
    {
      id: 'dzAssociated',
      type: 'multiSelect',
      label: 'Any associated symptoms?',
      maxSelections: 4,
      options: [
        { id: 'nausea', label: 'Nausea or vomiting' },
        { id: 'hearingLoss', label: 'Hearing loss' },
        { id: 'tinnitus', label: 'Ringing in ears (tinnitus)' },
        { id: 'headache', label: 'Headache' },
        { id: 'doubleVision', label: 'Double vision' },
        { id: 'weakness', label: 'Weakness or numbness' },
      ],
      isRedFlag: true,
      redFlagValues: ['doubleVision', 'weakness'],
    },
    {
      id: 'dzRfFaint',
      type: 'boolean',
      label: 'Did you faint or lose consciousness?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Simplified Pathway: Nausea / Vomiting / Diarrhea ───────────────────────

const nauseaVomitingDiarrheaPathway: SymptomPathway = {
  id: 'nauseaVomitingDiarrhea',
  name: 'Nausea / Vomiting / Diarrhea',
  questions: [
    {
      id: 'nvdPrimary',
      type: 'multiSelect',
      label: 'Which of the following are you experiencing?',
      maxSelections: 3,
      options: [
        { id: 'nausea', label: 'Nausea' },
        { id: 'vomiting', label: 'Vomiting' },
        { id: 'diarrhea', label: 'Diarrhea' },
      ],
      required: true,
    },
    {
      id: 'nvdSeverity',
      type: 'singleSelect',
      label: 'How severe is it?',
      options: [
        { id: 'mild', label: 'Mild — manageable' },
        { id: 'moderate', label: 'Moderate — affecting daily activities' },
        { id: 'severe', label: 'Severe — unable to function' },
      ],
    },
    {
      id: 'nvdDuration',
      type: 'singleSelect',
      label: 'How long have you had these symptoms?',
      options: [
        { id: 'lessThan6h', label: 'Less than 6 hours' },
        { id: '6to24h', label: '6–24 hours' },
        { id: 'moreThan24h', label: 'More than 24 hours' },
      ],
    },
    {
      id: 'nvdAssociated',
      type: 'multiSelect',
      label: 'Any of the following as well?',
      maxSelections: 4,
      options: [
        { id: 'bloodInVomit', label: 'Blood in vomit' },
        { id: 'bloodInStool', label: 'Blood in stool' },
        { id: 'fever', label: 'Fever' },
        { id: 'abdominalPain', label: 'Abdominal pain' },
      ],
      isRedFlag: true,
      redFlagValues: ['bloodInVomit', 'bloodInStool'],
    },
    {
      id: 'nvdRfFluids',
      type: 'boolean',
      label: 'Are you unable to keep any fluids down?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Simplified Pathway: Injury / Trauma ────────────────────────────────────

const injuryTraumaPathway: SymptomPathway = {
  id: 'injuryTrauma',
  name: 'Injury / Trauma',
  questions: [
    {
      id: 'itMechanism',
      type: 'singleSelect',
      label: 'How did the injury occur?',
      options: [
        { id: 'fall', label: 'Fall' },
        { id: 'motorVehicle', label: 'Motor vehicle accident' },
        { id: 'sports', label: 'Sports / Recreation' },
        { id: 'blunt', label: 'Hit by object' },
        { id: 'other', label: 'Other' },
      ],
      required: true,
    },
    {
      id: 'itBodyPart',
      type: 'multiSelect',
      label: 'Which body parts are affected?',
      maxSelections: 5,
      options: [
        { id: 'head', label: 'Head' },
        { id: 'neck', label: 'Neck' },
        { id: 'chest', label: 'Chest' },
        { id: 'abdomen', label: 'Abdomen' },
        { id: 'back', label: 'Back / Spine' },
        { id: 'upperLimb', label: 'Arm / Hand' },
        { id: 'lowerLimb', label: 'Leg / Foot' },
      ],
    },
    {
      id: 'itSeverity',
      type: 'slider',
      label: 'Pain severity (0 = no pain, 10 = worst imaginable)',
      min: 0,
      max: 10,
      required: true,
      isRedFlag: true,
      redFlagValues: [7],
    },
    {
      id: 'itRfConsciousness',
      type: 'boolean',
      label: 'Did you lose consciousness at any point?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Simplified Pathway: Change in Consciousness ────────────────────────────

const changeInConsciousnessPathway: SymptomPathway = {
  id: 'changeInConsciousness',
  name: 'Change in Consciousness',
  questions: [
    {
      id: 'cocDuration',
      type: 'singleSelect',
      label: 'How long did / has the episode lasted?',
      options: [
        { id: 'lessThan1min', label: 'Less than 1 minute' },
        { id: '1to5min', label: '1–5 minutes' },
        { id: 'moreThan5min', label: 'More than 5 minutes' },
        { id: 'stillOngoing', label: 'Still ongoing' },
      ],
      required: true,
      isRedFlag: true,
      redFlagValues: ['moreThan5min', 'stillOngoing'],
    },
    {
      id: 'cocPreceding',
      type: 'multiSelect',
      label: 'What preceded the episode?',
      maxSelections: 3,
      options: [
        { id: 'chestPain', label: 'Chest pain' },
        { id: 'headache', label: 'Severe headache' },
        { id: 'dizziness', label: 'Dizziness' },
        { id: 'nothing', label: 'No warning' },
      ],
    },
    {
      id: 'cocRecovery',
      type: 'singleSelect',
      label: 'How is the recovery?',
      options: [
        { id: 'full', label: 'Full recovery' },
        { id: 'partial', label: 'Partial recovery' },
        { id: 'notRecovered', label: 'Not yet recovered' },
      ],
      isRedFlag: true,
      redFlagValues: ['notRecovered'],
    },
    {
      id: 'cocRfRepeated',
      type: 'boolean',
      label: 'Has this happened more than once?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Simplified Pathway: Back Pain ──────────────────────────────────────────

const backPainPathway: SymptomPathway = {
  id: 'backPain',
  name: 'Back Pain',
  questions: [
    {
      id: 'bpLocation',
      type: 'singleSelect',
      label: 'Where is the back pain?',
      options: [
        { id: 'upperBack', label: 'Upper back' },
        { id: 'lowerBack', label: 'Lower back' },
        { id: 'radiatingToLegs', label: 'Lower back radiating to legs' },
      ],
      required: true,
    },
    {
      id: 'bpOnset',
      type: 'singleSelect',
      label: 'When did it start?',
      options: [
        { id: 'sudden', label: 'Sudden (after injury/movement)' },
        { id: 'gradual', label: 'Gradual (no clear cause)' },
        { id: 'chronic', label: 'Chronic (more than 6 weeks)' },
      ],
    },
    {
      id: 'bpSeverity',
      type: 'slider',
      label: 'Pain severity (0 = no pain, 10 = worst imaginable)',
      min: 0,
      max: 10,
      required: true,
      isRedFlag: true,
      redFlagValues: [8],
    },
    {
      id: 'bpAssociated',
      type: 'multiSelect',
      label: 'Any associated symptoms?',
      maxSelections: 4,
      options: [
        { id: 'numbnessLegs', label: 'Numbness / tingling in legs' },
        { id: 'bladderIssues', label: 'Bladder or bowel problems' },
        { id: 'fever', label: 'Fever' },
        { id: 'recentInjury', label: 'Recent injury or fall' },
      ],
      isRedFlag: true,
      redFlagValues: ['bladderIssues'],
    },
  ],
};

// ─── Pathway: Flank Pain ────────────────────────────────────────────────────

const flankPainPathway: SymptomPathway = {
  id: 'flankPain',
  name: 'Flank Pain',
  questions: [
    {
      id: 'fpSide',
      type: 'singleSelect',
      label: 'Which side is the pain on?',
      options: [
        { id: 'right', label: 'Right flank' },
        { id: 'left', label: 'Left flank' },
        { id: 'both', label: 'Both sides' },
      ],
      required: true,
    },
    {
      id: 'fpCharacter',
      type: 'singleSelect',
      label: 'How would you describe the pain?',
      options: [
        { id: 'colicky', label: 'Colicky (comes in waves)' },
        { id: 'constant', label: 'Constant dull pain' },
        { id: 'sharp', label: 'Sharp / stabbing' },
      ],
      required: true,
    },
    {
      id: 'fpSeverity',
      type: 'slider',
      label: 'Pain severity (0 = no pain, 10 = worst imaginable)',
      min: 0,
      max: 10,
      required: true,
      isRedFlag: true,
      redFlagValues: [8],
    },
    {
      id: 'fpOnset',
      type: 'singleSelect',
      label: 'When did it start?',
      options: [
        { id: 'sudden', label: 'Sudden' },
        { id: 'gradual', label: 'Gradual' },
        { id: 'intermittent', label: 'Comes and goes' },
      ],
    },
    {
      id: 'fpAssociated',
      type: 'multiSelect',
      label: 'Any associated symptoms?',
      maxSelections: 5,
      options: [
        { id: 'dysuria', label: 'Burning with urination' },
        { id: 'hematuria', label: 'Blood in urine' },
        { id: 'fever', label: 'Fever' },
        { id: 'nausea', label: 'Nausea or vomiting' },
        { id: 'urinaryFrequency', label: 'Urinary frequency / urgency' },
      ],
      isRedFlag: true,
      redFlagValues: ['hematuria', 'fever'],
    },
  ],
};

// ─── Pathway: Joint Pain ────────────────────────────────────────────────────

const jointPainPathway: SymptomPathway = {
  id: 'jointPain',
  name: 'Joint Pain',
  questions: [
    {
      id: 'jpJoint',
      type: 'singleSelect',
      label: 'Which joint is affected?',
      options: [
        { id: 'knee', label: 'Knee' },
        { id: 'hip', label: 'Hip' },
        { id: 'shoulder', label: 'Shoulder' },
        { id: 'wristHand', label: 'Wrist / hand' },
        { id: 'ankleFoot', label: 'Ankle / foot' },
        { id: 'elbow', label: 'Elbow' },
        { id: 'multiple', label: 'Multiple joints' },
      ],
      required: true,
    },
    {
      id: 'jpOnset',
      type: 'singleSelect',
      label: 'How did it start?',
      options: [
        { id: 'sudden', label: 'Sudden' },
        { id: 'gradual', label: 'Gradual' },
        { id: 'afterInjury', label: 'After injury or fall' },
      ],
      required: true,
    },
    {
      id: 'jpSeverity',
      type: 'slider',
      label: 'Pain severity (0 = no pain, 10 = worst imaginable)',
      min: 0,
      max: 10,
      required: true,
      isRedFlag: true,
      redFlagValues: [8],
    },
    {
      id: 'jpSwelling',
      type: 'boolean',
      label: 'Is the joint swollen?',
      required: true,
    },
    {
      id: 'jpAssociated',
      type: 'multiSelect',
      label: 'Any associated symptoms?',
      maxSelections: 5,
      options: [
        { id: 'fever', label: 'Fever' },
        { id: 'rednessWarmth', label: 'Redness / warmth over the joint' },
        { id: 'stiffness', label: 'Stiffness (especially in the morning)' },
        { id: 'limitedMovement', label: 'Limited range of movement' },
        { id: 'trauma', label: 'Recent injury or fall' },
      ],
      isRedFlag: true,
      redFlagValues: ['fever', 'rednessWarmth'],
    },
  ],
};

// ─── Pathway: Limb Pain ─────────────────────────────────────────────────────

const painInLimbsPathway: SymptomPathway = {
  id: 'painInLimbs',
  name: 'Limb Pain',
  questions: [
    {
      id: 'plLimb',
      type: 'singleSelect',
      label: 'Which limb is painful?',
      options: [
        { id: 'upperArm', label: 'Arm / hand' },
        { id: 'lowerLeg', label: 'Leg / foot' },
        { id: 'multiple', label: 'Multiple limbs' },
      ],
      required: true,
    },
    {
      id: 'plSide',
      type: 'singleSelect',
      label: 'Which side?',
      options: [
        { id: 'left', label: 'Left' },
        { id: 'right', label: 'Right' },
        { id: 'both', label: 'Both sides' },
      ],
      required: true,
    },
    {
      id: 'plOnset',
      type: 'singleSelect',
      label: 'How did it start?',
      options: [
        { id: 'sudden', label: 'Sudden' },
        { id: 'gradual', label: 'Gradual' },
        { id: 'afterInjury', label: 'After injury or fall' },
      ],
      required: true,
    },
    {
      id: 'plSeverity',
      type: 'slider',
      label: 'Pain severity (0 = no pain, 10 = worst imaginable)',
      min: 0,
      max: 10,
      required: true,
      isRedFlag: true,
      redFlagValues: [8],
    },
    {
      id: 'plAssociated',
      type: 'multiSelect',
      label: 'Any associated symptoms?',
      maxSelections: 5,
      options: [
        { id: 'swelling', label: 'Swelling' },
        { id: 'redness', label: 'Redness / warmth' },
        { id: 'numbness', label: 'Numbness / tingling' },
        { id: 'weakness', label: 'Weakness' },
        { id: 'fever', label: 'Fever' },
      ],
      isRedFlag: true,
      redFlagValues: ['fever', 'weakness'],
    },
  ],
};

// ─── Pathway: Ear Pain ──────────────────────────────────────────────────────

const earPainPathway: SymptomPathway = {
  id: 'earPain',
  name: 'Ear Pain',
  questions: [
    {
      id: 'eaLaterality',
      type: 'singleSelect',
      label: 'Which ear is painful?',
      options: [
        { id: 'left', label: 'Left ear' },
        { id: 'right', label: 'Right ear' },
        { id: 'both', label: 'Both ears' },
      ],
      required: true,
    },
    {
      id: 'eaOnset',
      type: 'singleSelect',
      label: 'How did it start?',
      options: [
        { id: 'sudden', label: 'Sudden' },
        { id: 'gradual', label: 'Gradual' },
        { id: 'afterCold', label: 'After cold / upper respiratory infection' },
      ],
      required: true,
    },
    {
      id: 'eaSeverity',
      type: 'slider',
      label: 'Pain severity (0 = no pain, 10 = worst imaginable)',
      min: 0,
      max: 10,
      required: true,
      isRedFlag: true,
      redFlagValues: [8],
    },
    {
      id: 'eaAssociated',
      type: 'multiSelect',
      label: 'Any associated symptoms?',
      maxSelections: 5,
      options: [
        { id: 'fever', label: 'Fever' },
        { id: 'hearingLoss', label: 'Hearing loss / muffled hearing' },
        { id: 'discharge', label: 'Ear discharge' },
        { id: 'soreThroat', label: 'Sore throat' },
        { id: 'dizziness', label: 'Dizziness / vertigo' },
      ],
      isRedFlag: true,
      redFlagValues: ['hearingLoss', 'fever'],
    },
  ],
};

// ─── Simplified Pathway: Neck Pain ──────────────────────────────────────────

const neckPainPathway: SymptomPathway = {
  id: 'neckPain',
  name: 'Neck Pain',
  questions: [
    {
      id: 'npOnset',
      type: 'singleSelect',
      label: 'How did the neck pain start?',
      options: [
        { id: 'sudden', label: 'Sudden (after injury)' },
        { id: 'gradual', label: 'Gradual' },
        { id: 'wakingUp', label: 'Woke up with it' },
      ],
      required: true,
    },
    {
      id: 'npCharacter',
      type: 'singleSelect',
      label: 'How does it feel?',
      options: [
        { id: 'stiff', label: 'Stiff / Limited movement' },
        { id: 'sharp', label: 'Sharp pain' },
        { id: 'aching', label: 'Dull aching' },
        { id: 'burning', label: 'Burning' },
      ],
    },
    {
      id: 'npRadiation',
      type: 'singleSelect',
      label: 'Does the pain radiate?',
      options: [
        { id: 'none', label: 'No, stays in neck' },
        { id: 'toArm', label: 'Yes, to arm / hand' },
        { id: 'toHead', label: 'Yes, to head' },
        { id: 'both', label: 'Both arms' },
      ],
    },
    {
      id: 'npRfMeningism',
      type: 'boolean',
      label: 'Do you have fever along with the neck pain?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Simplified Pathway: Eye Problems ───────────────────────────────────────

const eyeProblemsPathway: SymptomPathway = {
  id: 'eyeProblems',
  name: 'Eye Problems',
  questions: [
    {
      id: 'epSymptoms',
      type: 'multiSelect',
      label: 'Which eye symptoms are you experiencing?',
      maxSelections: 4,
      options: [
        { id: 'redness', label: 'Redness' },
        { id: 'pain', label: 'Eye pain' },
        { id: 'visionChange', label: 'Vision change / blurring' },
        { id: 'discharge', label: 'Discharge / watery eye' },
        { id: 'doubleVision', label: 'Double vision' },
      ],
      required: true,
    },
    {
      id: 'epLaterality',
      type: 'singleSelect',
      label: 'Which eye is affected?',
      options: [
        { id: 'left', label: 'Left eye' },
        { id: 'right', label: 'Right eye' },
        { id: 'both', label: 'Both eyes' },
      ],
    },
    {
      id: 'epOnset',
      type: 'singleSelect',
      label: 'How did it start?',
      options: [
        { id: 'sudden', label: 'Sudden' },
        { id: 'gradual', label: 'Gradual' },
      ],
    },
    {
      id: 'epRfVisionLoss',
      type: 'boolean',
      label: 'Is there sudden loss or significant decrease in vision?',
      isRedFlag: true,
      redFlagValues: [true],
    },
    {
      id: 'epRfTrauma',
      type: 'boolean',
      label: 'Was there any recent eye trauma or chemical exposure?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Pathway: Fatigue / Weakness ────────────────────────────────────────────

const fatigueWeaknessPathway: SymptomPathway = {
  id: 'fatigueWeakness',
  name: 'Fatigue / Weakness',
  questions: [
    {
      id: 'fwOnset',
      type: 'singleSelect',
      label: 'How did the fatigue or weakness start?',
      options: [
        { id: 'sudden', label: 'Sudden (within hours)' },
        { id: 'gradual', label: 'Gradual (over days or weeks)' },
        { id: 'chronic', label: 'Long-standing (months or more)' },
      ],
      required: true,
      isRedFlag: true,
      redFlagValues: ['sudden'],
    },
    {
      id: 'fwSeverity',
      type: 'singleSelect',
      label: 'How much is it limiting your daily activities?',
      options: [
        { id: 'mild', label: 'Mild — I can do most things with some effort' },
        { id: 'moderate', label: 'Moderate — I struggle with normal activities' },
        { id: 'severe', label: 'Severe — I can barely get out of bed' },
      ],
      required: true,
      isRedFlag: true,
      redFlagValues: ['severe'],
    },
    {
      id: 'fwAssociated',
      type: 'multiSelect',
      label: 'Any associated symptoms?',
      maxSelections: 6,
      options: [
        { id: 'shortnessOfBreath', label: 'Shortness of breath' },
        { id: 'chestPain', label: 'Chest pain or palpitations' },
        { id: 'dizziness', label: 'Dizziness or lightheadedness' },
        { id: 'fever', label: 'Fever or chills' },
        { id: 'weightLoss', label: 'Unintentional weight loss' },
        { id: 'nightSweats', label: 'Night sweats' },
        { id: 'legSwelling', label: 'Leg swelling' },
        { id: 'paleness', label: 'Paleness or pallor' },
      ],
      isRedFlag: true,
      redFlagValues: ['shortnessOfBreath', 'chestPain'],
    },
    {
      id: 'fwRfNeurologicalWeakness',
      type: 'boolean',
      label: 'Is there sudden weakness or numbness on one side of the body?',
      isRedFlag: true,
      redFlagValues: [true],
    },
    {
      id: 'fwRfConsciousness',
      type: 'boolean',
      label: 'Did you lose consciousness or nearly faint?',
      isRedFlag: true,
      redFlagValues: [true],
    },
  ],
};

// ─── Pathway: Rash ───────────────────────────────────────────────────────────

const rashPathway: SymptomPathway = {
  id: 'rash',
  name: 'Rash',
  questions: [
    {
      id: 'rsAppearance',
      type: 'singleSelect',
      label: 'How would you describe the rash?',
      options: [
        { id: 'flat', label: 'Flat red or pink patches' },
        { id: 'raised', label: 'Raised bumps or welts (hives)' },
        { id: 'blistered', label: 'Blisters or fluid-filled lesions' },
        { id: 'purpura', label: 'Purple / red spots that do not blanch' },
        { id: 'scaling', label: 'Scaling or flaking skin' },
      ],
      required: true,
      isRedFlag: true,
      redFlagValues: ['purpura'],
    },
    {
      id: 'rsOnset',
      type: 'singleSelect',
      label: 'When did the rash appear?',
      options: [
        { id: 'today', label: 'Today' },
        { id: '1to3days', label: '1–3 days ago' },
        { id: 'overWeek', label: 'More than a week ago' },
      ],
      required: true,
    },
    {
      id: 'rsLocation',
      type: 'multiSelect',
      label: 'Where is the rash located?',
      maxSelections: 4,
      options: [
        { id: 'face', label: 'Face' },
        { id: 'trunk', label: 'Trunk (chest / back)' },
        { id: 'arms', label: 'Arms / hands' },
        { id: 'legs', label: 'Legs / feet' },
        { id: 'widespread', label: 'Widespread / whole body' },
      ],
      isRedFlag: true,
      redFlagValues: ['widespread'],
    },
    {
      id: 'rsAssociated',
      type: 'multiSelect',
      label: 'Any associated symptoms?',
      maxSelections: 5,
      options: [
        { id: 'itch', label: 'Itching' },
        { id: 'pain', label: 'Pain or burning at rash site' },
        { id: 'fever', label: 'Fever' },
        { id: 'jointPain', label: 'Joint pain' },
        { id: 'shortnessOfBreath', label: 'Difficulty breathing or throat tightness' },
      ],
      isRedFlag: true,
      redFlagValues: ['shortnessOfBreath'],
    },
    {
      id: 'rsRfAnaphylaxis',
      type: 'boolean',
      label: 'Do you have swelling of the lips, tongue, or throat — or difficulty swallowing?',
      isRedFlag: true,
      redFlagValues: [true],
    },
    {
      id: 'rsRecentMedication',
      type: 'boolean',
      label: 'Did you recently start a new medication, food, or have an insect sting?',
    },
  ],
};

// ─── Pathway Registry ────────────────────────────────────────────────────────

export const SYMPTOM_PATHWAYS: Record<string, SymptomPathway> = {
  abdominalPain: abdominalPainPathway,
  headache: headachePathway,
  chestPain: chestPainPathway,
  fever: feverPathway,
  cough: coughPathway,
  shortnessOfBreath: shortnessOfBreathPathway,
  dizziness: dizzinessPathway,
  nauseaVomitingDiarrhea: nauseaVomitingDiarrheaPathway,
  injuryTrauma: injuryTraumaPathway,
  changeInConsciousness: changeInConsciousnessPathway,
  backPain: backPainPathway,
  flankPain: flankPainPathway,
  jointPain: jointPainPathway,
  painInLimbs: painInLimbsPathway,
  earPain: earPainPathway,
  neckPain: neckPainPathway,
  eyeProblems: eyeProblemsPathway,
  fatigueWeakness: fatigueWeaknessPathway,
  rash: rashPathway,
};

// ─── Symptom to Pathway mapping ──────────────────────────────────────────────

export const SYMPTOM_TO_PATHWAY: Record<string, string> = {
  // ── Original mappings (chestPainSternum removed from complaints UI) ──
  chestPain: 'chestPain',
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
  fatigueWeakness: 'fatigueWeakness',
  jointPain: 'jointPain',
  painInLimbs: 'painInLimbs',
  earPain: 'earPain',
  eyeProblems: 'eyeProblems',
  injectionSitePain: 'injuryTrauma',
  // ── New complaint keys ──
  flankPain: 'flankPain',
  cough: 'cough',
  vomiting: 'nauseaVomitingDiarrhea',  // same GI pathway
  diarrhea: 'nauseaVomitingDiarrhea',  // same GI pathway
  rash: 'rash',
  syncope: 'changeInConsciousness',    // syncope → consciousness pathway
  alteredMentalStatus: 'changeInConsciousness', // → consciousness pathway
  // abnormalBloodTests has no specific adaptive pathway — no mapping
};

// ─── Helper: Get active pathways for selected illnesses ─────────────────────

export function getPathwaysForIllnesses(
  currentIllness: Record<string, boolean | string>
): SymptomPathway[] {
  const selectedSymptoms = Object.entries(currentIllness)
    .filter(([, value]) => value === true)
    .map(([key]) => key);

  const pathwayIds = [
    ...new Set(
      selectedSymptoms
        .map(symptom => SYMPTOM_TO_PATHWAY[symptom])
        .filter(Boolean)
    ),
  ];

  return pathwayIds
    .map(id => SYMPTOM_PATHWAYS[id])
    .filter(Boolean) as SymptomPathway[];
}
