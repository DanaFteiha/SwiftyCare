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
  isRedFlag?: boolean;
  redFlagValues?: any[];
  required?: boolean;
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

export function isQuestionVisible(
  question: PathwayQuestion,
  responses: Record<string, any>
): boolean {
  if (!question.condition) return true;
  const { questionId, value } = question.condition;
  const response = responses[questionId];
  if (Array.isArray(response)) return response.includes(value);
  if (Array.isArray(value)) return value.includes(response);
  return response === value;
}

export function getRedFlagsForPathway(
  pathway: SymptomPathway,
  responses: Record<string, any>
): string[] {
  const flags: string[] = [];
  for (const q of pathway.questions) {
    if (!q.isRedFlag) continue;
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
      id: 'abRadiation',
      type: 'multiSelect',
      label: 'Does the pain spread anywhere?',
      maxSelections: 3,
      options: [
        { id: 'back', label: 'Back' },
        { id: 'rightShoulder', label: 'Right shoulder' },
        { id: 'leftShoulder', label: 'Left shoulder' },
        { id: 'groin', label: 'Groin' },
        { id: 'chest', label: 'Chest' },
        { id: 'none', label: 'Does not spread' },
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
    {
      id: 'abRfPregnancy',
      type: 'boolean',
      label: 'Are you known to be pregnant, or could you be pregnant?',
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
        { id: 'neckStiffness', label: 'Neck stiffness' },
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
      label: 'Do you have fever AND stiff neck together?',
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
      maxSelections: 5,
      options: [
        { id: 'headache', label: 'Headache' },
        { id: 'bodyAches', label: 'Body aches' },
        { id: 'chills', label: 'Chills / Shivering' },
        { id: 'neckStiffness', label: 'Stiff neck' },
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
      label: 'Does the pain spread?',
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
      label: 'Do you have fever along with the stiff neck?',
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

// ─── Pathway Registry ────────────────────────────────────────────────────────

export const SYMPTOM_PATHWAYS: Record<string, SymptomPathway> = {
  abdominalPain: abdominalPainPathway,
  headache: headachePathway,
  chestPain: chestPainPathway,
  fever: feverPathway,
  shortnessOfBreath: shortnessOfBreathPathway,
  dizziness: dizzinessPathway,
  nauseaVomitingDiarrhea: nauseaVomitingDiarrheaPathway,
  injuryTrauma: injuryTraumaPathway,
  changeInConsciousness: changeInConsciousnessPathway,
  backPain: backPainPathway,
  neckPain: neckPainPathway,
  eyeProblems: eyeProblemsPathway,
};

// ─── Symptom to Pathway mapping ──────────────────────────────────────────────

export const SYMPTOM_TO_PATHWAY: Record<string, string> = {
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
  jointPain: 'backPain',
  painInLimbs: 'injuryTrauma',
  earPain: 'fever',
  eyeProblems: 'eyeProblems',
  injectionSitePain: 'injuryTrauma',
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
