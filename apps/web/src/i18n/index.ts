import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Translation resources. All keys live under the default `translation` namespace
// so `useTranslation()` in pages works out of the box for both EN and HE.
const resources = {
  "en": {
    "translation": {
      "welcome": {
        "title": "Welcome to SwiftyCare",
        "description": "Please enter your details to begin the medical registration process"
      },
      "form": {
        "title": "Patient Information",
        "description": "Please fill in your details below",
        "hospital": "Hospital",
        "hospitalRequired": "Hospital name is required",
        "hospitalMinLength": "Hospital name must contain at least 2 characters",
        "hospitalPlaceholder": "Select Hospital",
        "fullName": "Full Name",
        "fullNameRequired": "Full name is required",
        "fullNameMinLength": "Full name must contain at least 2 characters",
        "fullNameMaxLength": "Full name cannot exceed 100 characters",
        "fullNameInvalid": "Full name can only contain Hebrew, English letters, spaces, hyphens and apostrophes",
        "fullNamePlaceholder": "Enter full name",
        "nationalId": "National ID",
        "nationalIdRequired": "National ID is required",
        "nationalIdMinLength": "National ID must contain at least 5 digits",
        "nationalIdMaxLength": "National ID cannot exceed 20 digits",
        "nationalIdInvalid": "National ID can only contain digits",
        "nationalIdPlaceholder": "Enter National ID",
        "submitButton": "Start Questionnaire",
        "submitButtonLoading": "Creating case...",
        "formReady": "Form ready to submit",
        "submitError": "Error creating case. Please try again.",
        "networkError": "Network error. Please try again.",
        "duplicateCaseError": "It looks like this case already exists. Please verify your details or contact support.",
        "timeoutError": "The server is taking too long to respond. Please try again in a moment."
      },
      "hospitals": {
        "hadassahEinKerem": "Hadassah Ein Kerem Hospital",
        "hadassahMountScopus": "Hadassah Mount Scopus Hospital",
        "ichilov": "Ichilov Hospital (Tel Aviv)",
        "sheba": "Sheba Hospital (Tel Hashomer)",
        "rambam": "Rambam Hospital (Haifa)",
        "soroka": "Soroka Hospital (Beer Sheva)",
        "kaplan": "Kaplan Hospital (Rehovot)",
        "assafHarofeh": "Assaf Harofeh Hospital (Tzrifin)",
        "shaareZedek": "Shaare Zedek Hospital (Jerusalem)",
        "billinson": "Billinson Hospital (Petah Tikva)",
        "meir": "Meir Hospital (Kfar Saba)",
        "hillelYaffe": "Hillel Yaffe Hospital (Hadera)",
        "nahariya": "Nahariya Hospital",
        "poria": "Poria Hospital (Tiberias)",
        "ziv": "Ziv Hospital (Safed)",
        "barzilai": "Barzilai Hospital (Ashkelon)",
        "yoseftal": "Yoseftal Hospital (Eilat)",
        "laniado": "Laniado Hospital (Netanya)",
        "assuta": "Assuta Hospital (Tel Aviv)",
        "herzliyaMedical": "Herzliya Medical Center"
      },
      "footer": {
        "copyright": "© Swifty Medical 2025. All rights reserved."
      },
      "language": {
        "toggle": "עִבְרִית",
        "switchToHebrew": "Switch to Hebrew",
        "switchToEnglish": "Switch to English"
      },
      "questionnaire": {
        "title": "Medical Questionnaire",
        "subtitle": "Please answer the following questions",
        "greeting": "Hello {{name}}, please fill in the following details.",
        "step1": "Personal Details & Medical History",
        "personalInfo": {
          "title": "Personal Details",
          "age": "Age",
          "agePlaceholder": "Enter age",
          "gender": "Gender",
          "male": "Male",
          "female": "Female",
          "maritalStatus": "Marital Status",
          "married": "Married",
          "single": "Single",
          "divorced": "Divorced",
          "widowed": "Widowed",
          "formFilledBy": "Who is filling out this form?",
          "selfCompleted": "Self-completed",
          "completedByCompanion": "Completed by companion / caregiver",
          "cognitiveState": "Cognitive State",
          "cognitivelyIntact": "Cognitively Intact",
          "cognitivelyImpaired": "Cognitively Impaired",
          "memoryDecline": "Memory Decline",
          "conscious": "Conscious",
          "confused": "Confused",
          "unconscious": "Unconscious",
          "functionalState": "Functional State",
          "independent": "Independent",
          "dependent": "Dependent",
          "selectGender": "Select gender",
          "selectMaritalStatus": "Select marital status",
          "selectCognitiveState": "Select cognitive state",
          "selectFunctionalState": "Select functional state"
        },
        "medicalHistory": {
          "title": "Medical History",
          "none": "None",
          "diabetes": "Diabetes",
          "hypertension": "High Blood Pressure",
          "dyslipidemia": "High Blood Lipids",
          "asthma": "Asthma",
          "ischemicHeartDisease": "Ischemic Heart Disease",
          "heartFailure": "Heart Failure",
          "atrialFibrillation": "Atrial Fibrillation",
          "cancer": "Cancer",
          "cancerDetails": "Cancer Details",
          "cancerStatus": "Cancer Status",
          "cancerStatus_active": "Active",
          "cancerStatus_pastHistory": "Past History",
          "cancerType": "Cancer Type",
          "cancerTypePlaceholder": "e.g. Breast, Lung, Colon...",
          "previousStroke": "Previous Stroke",
          "hypothyroidism": "Hypothyroidism",
          "copd": "COPD",
          "renalFailure": "Renal Failure",
          "smoking": "Smoking",
          "immunocompromised": "Immunocompromised",
          "otherDiseases": "Other Underlying Diseases",
          "otherDiseasesPlaceholder": "Please specify",
          "previousSurgeries": "Previous Surgeries"
        },
        "currentIllness": {
          "title": "Current Illness",
          "instruction": "Please select all relevant symptoms.",
          "chestPain": "Chest pain",
          "headache": "Headache",
          "abdominalPain": "Abdominal pain",
          "backPain": "Back pain",
          "flankPain": "Flank pain",
          "neckPain": "Neck pain",
          "jointPain": "Joint pain",
          "painInLimbs": "Pain in limbs",
          "earPain": "Ear pain",
          "injectionSitePain": "Pain at the injection/blood draw site",
          "fever": "Fever",
          "shortnessOfBreath": "Shortness of breath",
          "cough": "Cough",
          "nausea": "Nausea",
          "vomiting": "Vomiting",
          "diarrhea": "Diarrhea",
          "rash": "Rash",
          "dizziness": "Dizziness",
          "fatigueWeakness": "General weakness",
          "syncope": "Syncope (Fainting)",
          "alteredMentalStatus": "Altered Mental Status",
          "changeInConsciousness": "Change in consciousness",
          "swellingEdema": "Swelling / Edema",
          "eyeProblems": "Eye problems",
          "injuryTrauma": "Injury / Trauma",
          "headInjury": "Head injury",
          "abnormalBloodTests": "Abnormal blood test results",
          "maxSelected": "Maximum 2 conditions selected — deselect one to choose another"
        },
        "adaptive": {
          "selectChiefComplaint": "Select Chief Complaint",
          "detailsFor": "Details for",
          "addDetail": "Add detail",
          "hideDetail": "Hide detail",
          "detailPlaceholder": "Please provide additional details...",
          "selectOption": "Select an option",
          "additionalDetails": "Additional Details",
          "additionalDetailsPlaceholder": "Please provide any additional information",
          "redFlagAlert": "⚠️ Red Flag Alert",
          "redFlagMessage": "Critical symptoms detected. Immediate medical attention may be required.",
          "noSymptomsSelected": "No symptoms selected",
          "goBackToStep1": "Please go back to Step 1 and select your symptoms",
          "selectedSymptoms": "Selected Symptoms",
          "pathways": {
            "chestPain": "Chest Pain",
            "chestPainDescription": "Pain or discomfort in the chest area",
            "fever": "Fever",
            "feverDescription": "Elevated body temperature"
          },
          "painCharacteristics": {
            "label": "Pain Characteristics",
            "pressing": "Pressing",
            "burning": "Burning",
            "sharp": "Sharp",
            "radiating": "Radiating"
          },
          "location": {
            "label": "Location",
            "center": "Center",
            "leftSide": "Left Side",
            "behindBreastbone": "Behind Breastbone"
          },
          "onset": {
            "label": "Onset",
            "sudden": "Sudden",
            "gradual": "Gradual",
            "intermittent": "Intermittent"
          },
          "duration": {
            "label": "Duration",
            "lessThan30min": "Less than 30 minutes",
            "min30To2hours": "30 minutes to 2 hours",
            "moreThan2hours": "More than 2 hours",
            "everyHalfHour": "Every half hour"
          },
          "radiationDetails": {
            "label": "Radiation Details",
            "placeholder": "Where does the pain radiate to?"
          },
          "cardiacQuestions": {
            "label": "Associated Symptoms",
            "shortnessOfBreath": "Shortness of Breath",
            "nausea": "Nausea",
            "sweating": "Sweating",
            "dizziness": "Dizziness"
          },
          "respiratoryQuestions": {
            "label": "Breathing Difficulty",
            "mild": "Mild",
            "moderate": "Moderate",
            "severe": "Severe"
          },
          "acuteQuestions": {
            "label": "Acute Symptoms",
            "severePain": "Severe Pain (8-10/10)",
            "lossOfConsciousness": "Loss of Consciousness",
            "acuteDistress": "Acute Distress"
          },
          "frequencyQuestions": {
            "label": "Frequency Details",
            "placeholder": "Describe the frequency pattern"
          },
          "associatedSymptoms": {
            "label": "Associated Symptoms",
            "headache": "Headache",
            "bodyAches": "Body Aches",
            "chills": "Chills",
            "fatigue": "Fatigue"
          },
          "headacheQuestions": {
            "label": "Headache Severity",
            "mild": "Mild",
            "moderate": "Moderate",
            "severe": "Severe"
          },
          "highFeverQuestions": {
            "label": "High Fever Symptoms",
            "alteredMentalStatus": "Altered Mental Status",
            "neckStiffness": "Neck / Occipital Pain",
            "rash": "Rash"
          },
          "chronicFeverQuestions": {
            "label": "Chronic Fever Details",
            "placeholder": "Describe any additional symptoms"
          },
          "rashQuestions": {
            "label": "Rash Description",
            "placeholder": "Describe the rash appearance and location"
          },
          "temperature": {
            "label": "Temperature Range",
            "lowGrade": "Low Grade (37.1-38.0°C)",
            "moderate": "Moderate (38.1-39.0°C)",
            "high": "High (39.1-40.0°C)",
            "veryHigh": "Very High (>40.0°C)"
          }
        },
        "medications": {
          "allergies": {
            "title": "Medication Allergies",
            "question": "Are there any drug allergies?",
            "yes": "Yes",
            "no": "No",
            "detailsPlaceholder": "Please specify the allergies"
          },
          "doesNotRemember": "I do not remember my medications",
          "doesNotRememberNote": "The doctor will be informed that medication history is unavailable.",
          "groups": {
            "title": "Medication Groups",
            "bloodPressure": "Blood Pressure",
            "diabetes": "Diabetes",
            "bloodThinners": "Blood Thinners",
            "immunosuppressants": "Immunosuppressants",
            "miscellaneous": "Miscellaneous",
            "cardiac": "Cardiac"
          }
        },
        "symptoms": {
          "chiefComplaint": "Chief Complaint",
          "symptomDuration": "How long have you had these symptoms?",
          "severity": "Severity (1-10)",
          "additionalSymptoms": "Additional Symptoms"
        },
        "vitals": {
          "bloodPressure": "Blood Pressure",
          "heartRate": "Heart Rate",
          "temperature": "Temperature",
          "oxygenSaturation": "Oxygen Saturation"
        },
        "navigation": {
          "next": "Next",
          "previous": "Previous",
          "finish": "Finish",
          "loading": "Saving..."
        },
        "wizard": {
          "personalDetails": "Personal",
          "medicalHistory": "History",
          "allergies": "Allergies",
          "medications": "Medications",
          "currentIllness": "Illness",
          "personalSubtitle": "Tell us a bit about yourself",
          "historySubtitle": "Select all conditions that apply to you",
          "allergiesSubtitle": "Drug allergy information",
          "medicationsSubtitle": "Select any medications you currently take (optional)",
          "medicationsOptional": "This section is optional — skip if none apply",
          "illnessSubtitle": "Select up to 2 main reasons for your visit today",
          "allergyDetailsLabel": "Please describe your allergies"
        },
        "medGroup": {
          "otherLabel": "Other (please specify)",
          "otherPlaceholder": "Enter medication name"
        },
        "confirmationTitle": "Thank you",
        "confirmationMessage": "Thank you for filling out your information. A doctor will review your case shortly.",
        "step2": {
          "symptoms": "Current Symptoms",
          "optional": "optional",
          "stepIndicator": "Step 2 of 2",
          "pathwayOf": "Symptom {{current}} of {{total}}",
          "yes": "Yes",
          "no": "No",
          "sliderNone": "None",
          "sliderModerate": "Moderate",
          "sliderWorst": "Worst",
          "maxSelected": "Maximum selections reached",
          "highSeverityWarning": "Severity level indicates urgent care may be needed",
          "redFlagWarning": "This symptom requires immediate medical attention",
          "abdominalPain": {
            "painLocation": "Where is the pain located?",
            "onsetWhen": "When did the pain start?",
            "onsetToday": "Today",
            "onset1to3": "1–3 days ago",
            "onset3to7": "3–7 days ago",
            "onsetOverWeek": "More than a week ago",
            "onsetType": "How did the pain start?",
            "onsetSudden": "Sudden (came on quickly)",
            "onsetGradual": "Gradual (built up slowly)",
            "character": "How would you describe the pain?",
            "charSharp": "Sharp / Stabbing",
            "charCrampy": "Crampy / Colicky",
            "charDull": "Dull / Aching",
            "charBurning": "Burning",
            "charPressure": "Pressure / Squeezing",
            "radiation": "Does the pain spread anywhere?",
            "radBack": "Back",
            "radRightShoulder": "Right shoulder",
            "radLeftShoulder": "Left shoulder",
            "radGroin": "Groin",
            "radChest": "Chest",
            "radNone": "Does not spread",
            "aggravating": "What makes the pain worse?",
            "aggEating": "Eating",
            "aggMovement": "Movement",
            "aggDeepBreath": "Deep breathing",
            "aggLyingFlat": "Lying flat",
            "relieving": "What helps relieve the pain?",
            "relEating": "Eating",
            "relAntacids": "Antacids",
            "relPassingGas": "Passing gas / stool",
            "relLyingStill": "Lying still",
            "associated": "Any other symptoms you are experiencing?",
            "assocConstipation": "Constipation",
            "assocJaundice": "Yellowing of skin/eyes (jaundice)",
            "assocBloodStool": "Blood in stool",
            "assocDarkUrine": "Dark urine",
            "assocLossOfAppetite": "Loss of appetite",
            "assocBloating": "Bloating",
            "rfFever": "Do you have a fever above 38.5°C?",
            "rfBlood": "Is there any blood in your vomit or stool?",
            "rfUnableToEat": "Have you been unable to eat or drink for more than 24 hours?",
            "rfPregnancy": "Are you known to be pregnant, or could you be pregnant?"
          },
          "headache": {
            "location": "Where on your head is the pain?",
            "onsetWhen": "When did the headache start?",
            "onsetType": "How did it start?",
            "onsetThunderclap": "Thunderclap — reached maximum intensity within seconds",
            "onsetGradual": "Gradual — built up over minutes or hours",
            "character": "What does the headache feel like?",
            "charThrobbing": "Throbbing / Pulsating",
            "charPressure": "Pressure / Squeezing (band-like)",
            "charSharp": "Sharp / Stabbing",
            "charDull": "Dull / Constant aching",
            "pattern": "What is the pattern of your headache?",
            "patternConstant": "Constant",
            "patternComesAndGoes": "Comes and goes",
            "patternWorsening": "Getting progressively worse",
            "aggravating": "What makes the headache worse?",
            "aggLight": "Light sensitivity (photophobia)",
            "aggNoise": "Noise sensitivity (phonophobia)",
            "aggMovement": "Movement / physical activity",
            "aggBending": "Bending forward",
            "associated": "Any other symptoms you are experiencing?",
            "assocNausea": "Nausea or vomiting",
            "assocVisualAura": "Visual aura (zig-zags, blind spot)",
            "assocNeckStiffness": "Neck / occipital pain",
            "assocFever": "Fever",
            "assocDizziness": "Dizziness",
            "assocWeakness": "Weakness or numbness",
            "assocSlurredSpeech": "Slurred speech",
            "assocEyeRedness": "Eye redness or pain",
            "rfWorstEver": "Is this the worst headache of your life?",
            "rfNewType": "Is this a new type of headache you have never had before?",
            "rfFeverNeck": "Do you have fever AND neck pain together?",
            "rfConfusion": "Are you experiencing confusion or decreased alertness?",
            "rfWeakness": "Any new weakness, numbness, or difficulty speaking?"
          },
          "sliderTapToRate": "Drag the slider to rate"
        },
        "errors": {
          "required": "This field is required",
          "invalidFormat": "Invalid format",
          "saveError": "Error saving questionnaire. Please try again.",
          "ageRequired": "Age is required",
          "ageInvalid": "Age must be a valid number",
          "ageRange": "Age must be between 0 and 120",
          "formFilledByRequired": "Please indicate who is filling this form",
          "genderRequired": "Gender is required",
          "maritalStatusRequired": "Marital status is required",
          "cognitiveStateRequired": "Cognitive state is required",
          "functionalStateRequired": "Functional state is required",
          "medicalHistoryRequired": "Please select at least one medical history option",
          "allergiesRequired": "Please indicate whether you have allergies",
          "illnessRequired": "Please select at least one symptom",
          "pathwayRequired": "Please answer all required questions marked with *",
          "loadError": "We could not load your case. Please check your connection and try again.",
          "caseNotFound": "Case not found",
          "caseNotFoundHint": "The patient case you are looking for does not exist or has been removed."
        },
        "step4": "Vital Signs",
        "defaultPatientName": "Patient",
        "pathway": {
          "abdominalPain": {
            "abPainLocation": { "q": "Where is the pain located?" },
            "abOnsetWhen": {
              "q": "When did the pain start?",
              "today": "Today",
              "1to3days": "1–3 days ago",
              "3to7days": "3–7 days ago",
              "overWeek": "More than a week ago"
            },
            "abOnsetType": {
              "q": "How did the pain start?",
              "sudden": "Sudden (came on quickly)",
              "gradual": "Gradual (built up slowly)"
            },
            "abCharacter": {
              "q": "How would you describe the pain?",
              "sharp": "Sharp / Stabbing",
              "crampy": "Crampy / Colicky",
              "dull": "Dull / Aching",
              "burning": "Burning",
              "pressure": "Pressure / Squeezing"
            },
            "abSeverity": { "q": "Pain severity (0 = no pain, 10 = worst imaginable)" },
            "abRadiation": { "q": "Does the pain radiate?" },
            "abRadiationWhere": {
              "q": "Where does the pain radiate to?",
              "back": "Back",
              "rightShoulder": "Right shoulder",
              "leftShoulder": "Left shoulder",
              "groin": "Groin",
              "chest": "Chest"
            },
            "abAggravating": {
              "q": "What makes the pain worse?",
              "eating": "Eating",
              "movement": "Movement",
              "deepBreath": "Deep breathing",
              "lyingFlat": "Lying flat",
              "nothing": "Nothing specific"
            },
            "abRelieving": {
              "q": "What helps relieve the pain?",
              "eating": "Eating",
              "antacids": "Antacids",
              "passingGas": "Passing gas / stool",
              "lyingStill": "Lying still",
              "nothing": "Nothing helps"
            },
            "abAssociated": {
              "q": "Any other symptoms you are experiencing?",
              "nausea": "Nausea",
              "vomiting": "Vomiting",
              "diarrhea": "Diarrhea",
              "constipation": "Constipation",
              "fever": "Fever",
              "jaundice": "Yellowing of skin/eyes (jaundice)",
              "bloodStool": "Blood in stool",
              "darkUrine": "Dark urine",
              "lossOfAppetite": "Loss of appetite",
              "bloating": "Bloating"
            },
            "abRfFever": { "q": "Do you have a fever above 38.5°C (101.3°F)?" },
            "abRfBlood": { "q": "Is there any blood in your vomit or stool?" },
            "abRfUnableToEat": { "q": "Have you been unable to eat or drink anything for more than 24 hours?" },
            "abRfPregnancy": { "q": "Are you known to be pregnant, or could you be pregnant?" }
          },
          "headache": {
            "hdLocation": { "q": "Where on your head is the pain?" },
            "hdOnsetWhen": {
              "q": "When did the headache start?",
              "today": "Today",
              "1to3days": "1–3 days ago",
              "3to7days": "3–7 days ago",
              "overWeek": "More than a week ago"
            },
            "hdOnsetType": {
              "q": "How did it start?",
              "thunderclap": "Thunderclap — reached maximum intensity within seconds",
              "gradual": "Gradual — built up over minutes or hours"
            },
            "hdCharacter": {
              "q": "What does the headache feel like?",
              "throbbing": "Throbbing / Pulsating",
              "pressure": "Pressure / Squeezing (band-like)",
              "sharp": "Sharp / Stabbing",
              "dull": "Dull / Constant aching"
            },
            "hdSeverity": { "q": "Headache severity (0 = no pain, 10 = worst imaginable)" },
            "hdPattern": {
              "q": "What is the pattern of your headache?",
              "constant": "Constant",
              "comesAndGoes": "Comes and goes",
              "worsening": "Getting progressively worse"
            },
            "hdAggravating": {
              "q": "What makes the headache worse?",
              "light": "Light sensitivity (photophobia)",
              "noise": "Noise sensitivity (phonophobia)",
              "movement": "Movement / physical activity",
              "bending": "Bending forward",
              "nothing": "Nothing specific"
            },
            "hdAssociated": {
              "q": "Any other symptoms you are experiencing?",
              "nausea": "Nausea or vomiting",
              "visualAura": "Visual aura (zig-zags, blind spot)",
              "neckStiffness": "Neck / occipital pain",
              "fever": "Fever",
              "dizziness": "Dizziness",
              "weakness": "Weakness or numbness",
              "slurredSpeech": "Slurred speech",
              "eyeRedness": "Eye redness or pain"
            },
            "hdRfWorstEver": { "q": "Is this the worst headache of your life?" },
            "hdRfNewType": { "q": "Is this a new type of headache you have never had before?" },
            "hdRfFeverNeck": { "q": "Do you have fever AND neck pain together?" },
            "hdRfConfusion": { "q": "Are you experiencing confusion or decreased alertness?" },
            "hdRfWeakness": { "q": "Any new weakness, numbness, or difficulty speaking?" }
          },
          "chestPain": {
            "cpCharacter": {
              "q": "How would you describe the chest pain?",
              "pressing": "Pressing / Heavy",
              "burning": "Burning",
              "sharp": "Sharp / Stabbing",
              "tight": "Tight / Squeezing"
            },
            "cpSeverity": { "q": "Pain severity (0 = no pain, 10 = worst imaginable)" },
            "cpOnset": {
              "q": "When did the chest pain start?",
              "sudden": "Sudden",
              "gradual": "Gradual",
              "intermittent": "Comes and goes"
            },
            "cpAssociated": {
              "q": "Do you have any of these associated symptoms?",
              "shortnessOfBreath": "Shortness of breath",
              "nausea": "Nausea or vomiting",
              "sweating": "Sweating",
              "leftArm": "Pain in left arm / shoulder",
              "jaw": "Pain in jaw / neck",
              "dizziness": "Dizziness"
            },
            "cpSimilarPast": { "q": "Have you had similar pains in the past to this pain?" },
            "cpRfRadiation": { "q": "Does the pain radiate to your arm, jaw, or back?" }
          },
          "fever": {
            "fvTemperature": {
              "q": "What is your approximate temperature?",
              "lowGrade": "Low grade (37.1–38.0°C / 98.8–100.4°F)",
              "moderate": "Moderate (38.1–39.0°C / 100.6–102.2°F)",
              "high": "High (39.1–40.0°C / 102.4–104°F)",
              "veryHigh": "Very high (above 40°C / 104°F)"
            },
            "fvDuration": {
              "q": "How long have you had the fever?",
              "lessThan24h": "Less than 24 hours",
              "1to3days": "1–3 days",
              "moreThan3days": "More than 3 days"
            },
            "fvAssociated": {
              "q": "Any other symptoms along with the fever?",
              "dysuria": "Burning with urination",
              "cough": "Cough",
              "abdominalPain": "Abdominal pain",
              "flankPain": "Flank pain",
              "earPain": "Ear pain",
              "soreThroat": "Sore throat",
              "legRednessSwellingPain": "Leg redness, swelling, or pain",
              "diarrhea": "Diarrhea",
              "vomiting": "Vomiting",
              "rhinorrhea": "Runny nose",
              "chestPain": "Chest pain",
              "shortnessOfBreath": "Shortness of breath",
              "syncope": "Fainting / syncope",
              "jaundice": "Jaundice (yellowing of skin or eyes)",
              "headache": "Headache",
              "bodyAches": "Body aches",
              "chills": "Chills / Shivering",
              "neckStiffness": "Neck pain",
              "rash": "Rash",
              "fatigue": "Fatigue / Weakness"
            },
            "fvRfAlteredMental": { "q": "Is there any confusion, altered consciousness, or inability to wake up?" }
          },
          "cough": {
            "ckDuration": {
              "q": "How long have you had the cough?",
              "lessThan24h": "Less than 24 hours",
              "1to7days": "1–7 days",
              "moreThan7days": "More than a week"
            },
            "ckCharacter": {
              "q": "What kind of cough is it?",
              "dry": "Dry cough (no phlegm)",
              "productiveClear": "Productive — clear or white phlegm",
              "productiveColored": "Productive — yellow or green phlegm",
              "bloody": "Blood in sputum"
            },
            "ckOnset": {
              "q": "How did it start?",
              "sudden": "Sudden (within hours)",
              "gradual": "Gradual (over days)"
            },
            "ckAssociated": {
              "q": "Any other symptoms with the cough?",
              "shortnessOfBreath": "Shortness of breath",
              "chestPain": "Chest pain",
              "fever": "Fever",
              "wheezing": "Wheezing",
              "soreThroat": "Sore throat",
              "runnyNose": "Runny nose"
            },
            "ckRfHighFever": { "q": "Do you have high fever (above 39°C / 102°F)?" }
          },
          "shortnessOfBreath": {
            "sobSeverity": {
              "q": "How severe is your shortness of breath?",
              "mild": "Mild — only with exertion",
              "moderate": "Moderate — with normal activities",
              "severe": "Severe — at rest",
              "cantSpeak": "Cannot speak in full sentences"
            },
            "sobOnset": {
              "q": "How did it start?",
              "sudden": "Sudden (within minutes)",
              "gradual": "Gradual (hours to days)",
              "chronic": "Chronic (weeks to months)"
            },
            "sobTriggers": {
              "q": "What triggers or worsens the breathing difficulty?",
              "exertion": "Physical exertion",
              "lyingFlat": "Lying flat",
              "allergens": "Allergens / Environment",
              "noTrigger": "No clear trigger"
            },
            "sobAssociated": {
              "q": "Any associated symptoms?",
              "chestPain": "Chest pain",
              "wheezing": "Wheezing",
              "cough": "Cough",
              "blueLips": "Blue lips or fingertips",
              "legSwelling": "Leg swelling"
            }
          },
          "dizziness": {
            "dzType": {
              "q": "What kind of dizziness are you experiencing?",
              "vertigo": "Vertigo — spinning sensation",
              "lightheaded": "Lightheadedness — feeling faint",
              "imbalance": "Imbalance — unsteady when walking"
            },
            "dzOnset": {
              "q": "How did it start?",
              "sudden": "Sudden",
              "gradual": "Gradual"
            },
            "dzAssociated": {
              "q": "Any associated symptoms?",
              "nausea": "Nausea or vomiting",
              "hearingLoss": "Hearing loss",
              "tinnitus": "Ringing in ears (tinnitus)",
              "headache": "Headache",
              "doubleVision": "Double vision",
              "weakness": "Weakness or numbness"
            },
            "dzRfFaint": { "q": "Did you faint or lose consciousness?" }
          },
          "nauseaVomitingDiarrhea": {
            "nvdPrimary": {
              "q": "Which of the following are you experiencing?",
              "nausea": "Nausea",
              "vomiting": "Vomiting",
              "diarrhea": "Diarrhea"
            },
            "nvdSeverity": {
              "q": "How severe is it?",
              "mild": "Mild — manageable",
              "moderate": "Moderate — affecting daily activities",
              "severe": "Severe — unable to function"
            },
            "nvdDuration": {
              "q": "How long have you had these symptoms?",
              "lessThan6h": "Less than 6 hours",
              "6to24h": "6–24 hours",
              "moreThan24h": "More than 24 hours"
            },
            "nvdAssociated": {
              "q": "Any of the following as well?",
              "bloodInVomit": "Blood in vomit",
              "bloodInStool": "Blood in stool",
              "fever": "Fever",
              "abdominalPain": "Abdominal pain"
            },
            "nvdRfFluids": { "q": "Are you unable to keep any fluids down?" }
          },
          "injuryTrauma": {
            "itMechanism": {
              "q": "How did the injury occur?",
              "fall": "Fall",
              "motorVehicle": "Motor vehicle accident",
              "sports": "Sports / Recreation",
              "blunt": "Hit by object",
              "other": "Other"
            },
            "itBodyPart": {
              "q": "Which body parts are affected?",
              "head": "Head",
              "neck": "Neck",
              "chest": "Chest",
              "abdomen": "Abdomen",
              "back": "Back / Spine",
              "upperLimb": "Arm / Hand",
              "lowerLimb": "Leg / Foot"
            },
            "itSeverity": { "q": "Pain severity (0 = no pain, 10 = worst imaginable)" },
            "itRfConsciousness": { "q": "Did you lose consciousness at any point?" }
          },
          "changeInConsciousness": {
            "cocDuration": {
              "q": "How long did / has the episode lasted?",
              "lessThan1min": "Less than 1 minute",
              "1to5min": "1–5 minutes",
              "moreThan5min": "More than 5 minutes",
              "stillOngoing": "Still ongoing"
            },
            "cocPreceding": {
              "q": "What preceded the episode?",
              "chestPain": "Chest pain",
              "headache": "Severe headache",
              "dizziness": "Dizziness",
              "nothing": "No warning"
            },
            "cocRecovery": {
              "q": "How is the recovery?",
              "full": "Full recovery",
              "partial": "Partial recovery",
              "notRecovered": "Not yet recovered"
            },
            "cocRfRepeated": { "q": "Has this happened more than once?" }
          },
          "backPain": {
            "bpLocation": {
              "q": "Where is the back pain?",
              "upperBack": "Upper back",
              "lowerBack": "Lower back",
              "radiatingToLegs": "Lower back radiating to legs"
            },
            "bpOnset": {
              "q": "When did it start?",
              "sudden": "Sudden (after injury/movement)",
              "gradual": "Gradual (no clear cause)",
              "chronic": "Chronic (more than 6 weeks)"
            },
            "bpSeverity": { "q": "Pain severity (0 = no pain, 10 = worst imaginable)" },
            "bpAssociated": {
              "q": "Any associated symptoms?",
              "numbnessLegs": "Numbness / tingling in legs",
              "bladderIssues": "Bladder or bowel problems",
              "fever": "Fever",
              "recentInjury": "Recent injury or fall"
            }
          },
          "flankPain": {
            "fpSide": {
              "q": "Which side is the pain on?",
              "right": "Right flank",
              "left": "Left flank",
              "both": "Both sides"
            },
            "fpCharacter": {
              "q": "How would you describe the pain?",
              "colicky": "Colicky (comes in waves)",
              "constant": "Constant dull pain",
              "sharp": "Sharp / stabbing"
            },
            "fpSeverity": { "q": "Pain severity (0 = no pain, 10 = worst imaginable)" },
            "fpOnset": {
              "q": "When did it start?",
              "sudden": "Sudden",
              "gradual": "Gradual",
              "intermittent": "Comes and goes"
            },
            "fpAssociated": {
              "q": "Any associated symptoms?",
              "dysuria": "Burning with urination",
              "hematuria": "Blood in urine",
              "fever": "Fever",
              "nausea": "Nausea or vomiting",
              "urinaryFrequency": "Urinary frequency / urgency"
            }
          },
          "jointPain": {
            "jpJoint": {
              "q": "Which joint is affected?",
              "knee": "Knee",
              "hip": "Hip",
              "shoulder": "Shoulder",
              "wristHand": "Wrist / hand",
              "ankleFoot": "Ankle / foot",
              "elbow": "Elbow",
              "multiple": "Multiple joints"
            },
            "jpOnset": {
              "q": "How did it start?",
              "sudden": "Sudden",
              "gradual": "Gradual",
              "afterInjury": "After injury or fall"
            },
            "jpSeverity": { "q": "Pain severity (0 = no pain, 10 = worst imaginable)" },
            "jpSwelling": { "q": "Is the joint swollen?" },
            "jpAssociated": {
              "q": "Any associated symptoms?",
              "fever": "Fever",
              "rednessWarmth": "Redness / warmth over the joint",
              "stiffness": "Stiffness (especially in the morning)",
              "limitedMovement": "Limited range of movement",
              "trauma": "Recent injury or fall"
            }
          },
          "painInLimbs": {
            "plLimb": {
              "q": "Which limb is painful?",
              "upperArm": "Arm / hand",
              "lowerLeg": "Leg / foot",
              "multiple": "Multiple limbs"
            },
            "plSide": {
              "q": "Which side?",
              "left": "Left",
              "right": "Right",
              "both": "Both sides"
            },
            "plOnset": {
              "q": "How did it start?",
              "sudden": "Sudden",
              "gradual": "Gradual",
              "afterInjury": "After injury or fall"
            },
            "plSeverity": { "q": "Pain severity (0 = no pain, 10 = worst imaginable)" },
            "plAssociated": {
              "q": "Any associated symptoms?",
              "swelling": "Swelling",
              "redness": "Redness / warmth",
              "numbness": "Numbness / tingling",
              "weakness": "Weakness",
              "fever": "Fever"
            }
          },
          "earPain": {
            "eaLaterality": {
              "q": "Which ear is painful?",
              "left": "Left ear",
              "right": "Right ear",
              "both": "Both ears"
            },
            "eaOnset": {
              "q": "How did it start?",
              "sudden": "Sudden",
              "gradual": "Gradual",
              "afterCold": "After cold / upper respiratory infection"
            },
            "eaSeverity": { "q": "Pain severity (0 = no pain, 10 = worst imaginable)" },
            "eaAssociated": {
              "q": "Any associated symptoms?",
              "fever": "Fever",
              "hearingLoss": "Hearing loss / muffled hearing",
              "discharge": "Ear discharge",
              "soreThroat": "Sore throat",
              "dizziness": "Dizziness / vertigo"
            }
          },
          "neckPain": {
            "npOnset": {
              "q": "How did the neck pain start?",
              "sudden": "Sudden (after injury)",
              "gradual": "Gradual",
              "wakingUp": "Woke up with it"
            },
            "npCharacter": {
              "q": "How does it feel?",
              "stiff": "Stiff / Limited movement",
              "sharp": "Sharp pain",
              "aching": "Dull aching",
              "burning": "Burning"
            },
            "npRadiation": {
              "q": "Does the pain radiate?",
              "none": "No, stays in neck",
              "toArm": "Yes, to arm / hand",
              "toHead": "Yes, to head",
              "both": "Both arms"
            },
            "npRfMeningism": { "q": "Do you have fever along with the neck pain?" }
          },
          "eyeProblems": {
            "epSymptoms": {
              "q": "Which eye symptoms are you experiencing?",
              "redness": "Redness",
              "pain": "Eye pain",
              "visionChange": "Vision change / blurring",
              "discharge": "Discharge / watery eye",
              "doubleVision": "Double vision"
            },
            "epLaterality": {
              "q": "Which eye is affected?",
              "left": "Left eye",
              "right": "Right eye",
              "both": "Both eyes"
            },
            "epOnset": {
              "q": "How did it start?",
              "sudden": "Sudden",
              "gradual": "Gradual"
            },
            "epRfVisionLoss": { "q": "Is there sudden loss or significant decrease in vision?" },
            "epRfTrauma": { "q": "Was there any recent eye trauma or chemical exposure?" }
          }
        }
      },
      "dashboard": {
        "title": "Doctor's Dashboard",
        "subtitle": "Search and manage medical cases",
        "loading": "Loading cases...",
        "error": "Error loading cases",
        "retry": "Retry",
        "search": {
          "placeholder": "Search by patient name or ID..."
        },
        "filters": {
          "all": "All Cases",
          "pendingDoctorReview": "Waiting for doctor's review",
          "inReview": "In Review",
          "completed": "Completed",
          "cancelled": "Cancelled"
        },
        "status": {
          "pendingDoctorReview": "Waiting for doctor's review",
          "inReview": "In Review",
          "completed": "Completed",
          "cancelled": "Cancelled",
          "awaiting_vitals": "Awaiting vitals",
          "open": "Open",
          "in_progress": "In progress",
          "tests_ordered": "Tests ordered",
          "closed": "Closed"
        },
        "table": {
          "patientName": "Patient Name",
          "id": "ID",
          "status": "Status",
          "receptionDate": "Reception Date",
          "actions": "Actions"
        },
        "actions": {
          "newCase": "New Case",
          "openFile": "Open File",
          "delete": "Delete",
          "deleteConfirm": "Delete this case? This cannot be undone.",
          "deleteError": "Failed to delete case",
          "logout": "Log out"
        },
        "empty": {
          "title": "No cases found",
          "description": "No cases match your current search criteria.",
          "noMatch": "No cases match your current search criteria.",
          "noOpen": "No open cases right now. New cases will appear here.",
          "noClosed": "No closed or cancelled cases yet."
        },
        "unknownPatient": "Unknown Patient",
        "tabs": {
          "open": "Open",
          "closed": "Closed"
        }
      },
      "case": {
        "title": "Case Management",
        "id": "ID",
        "age": "Age",
        "status": "Status",
        "loading": "Loading case...",
        "error": "Error loading case",
        "backToDashboard": "Back to Dashboard",
        "backToList": "Back to list",
        "statusLabel": {
          "open": "Open",
          "in_progress": "In Progress",
          "tests_ordered": "Tests Ordered",
          "closed": "Closed",
          "cancelled": "Cancelled"
        },
        "testsOrderedBanner": "Tests have been ordered.",
        "testsOrderedHint": "Review the results when available, then prepare and finalize the discharge report to close this case.",
        "closedBanner": "This case has been closed. The discharge report has been finalized.",
        "tabs": {
          "summary": "Summary and Vital Signs",
          "physical": "Physical Examination",
          "diagnosis": "Diagnosis and Tests",
          "results": "Results",
          "treatment": "Treatment and Summary"
        },
        "vitals": {
          "title": "Vital Signs",
          "description": "Vital signs measurements taken.",
          "bloodPressure": "Blood Pressure",
          "bloodPressurePlaceholder": "Enter systolic/diastolic (e.g., 120/80)",
          "pulse": "Pulse",
          "pulsePlaceholder": "Enter heart rate (bpm)",
          "oxygenSaturation": "Saturation (SpO2)",
          "temperature": "Temperature",
          "painScale": "Pain Scale (1-10)",
          "save": "Save Vital Signs",
          "notRecorded": "Not recorded",
          "respiratoryRate": "Respiratory Rate",
          "painScore": "Pain Score"
        },
        "personalDetails": {
          "title": "Personal Details",
          "fullName": "Full Name",
          "id": "ID No.",
          "gender": "Gender",
          "age": "Age",
          "maritalStatus": "Marital Status",
          "cognitiveStatus": "Cognitive Status",
          "functionalStatus": "Functional Status",
          "notProvided": "Not provided"
        },
        "medicalHistory": {
          "title": "Medical History",
          "backgroundDiseases": "Background Diseases",
          "noData": "No medical history data available"
        },
        "currentIllness": {
          "title": "Current Illness - Complaints and Details",
          "noData": "No current illness data available"
        },
        "hideDetails": "Hide Details",
        "showDetails": "Show Details",
        "evidence": "Evidence",
        "urgency": "Urgency",
        "aiSummary": {
          "title": "AI-Generated Symptom & Exam Summary",
          "description": "NLP summarization with medical-ontology tagging, red-flag highlighting, and chronic-condition identification",
          "noSummary": "No AI summary available yet",
          "generate": "Generate AI Summary",
          "error": "Failed to generate AI summary. Please try again.",
          "timeout": "Generation is taking longer than expected. The summary may already be ready — the page will refresh automatically."
        },
        "aiDiagnosis": {
          "title": "AI Differential-Diagnosis & Test Recommendations",
          "description": "Evidence-weighted diagnosis list with contextual test recommendations",
          "noDiagnosis": "No AI diagnosis available yet",
          "generate": "Generate Diagnosis",
          "error": "Failed to generate AI diagnosis. Please try again.",
          "timeout": "Generation is taking longer than expected. The diagnosis may already be ready — the page will refresh automatically.",
          "ordered": "Tests for {{name}} have been ordered.",
          "orderError": "Failed to order tests.",
          "differentialDiagnoses": "Differential Diagnoses",
          "testRecommendations": "Test Recommendations",
          "orderTests": "Order Selected Tests",
          "orderingTests": "Ordering tests: {{tests}}",
          "interactiveDiagnoses": "Interactive Diagnosis Review",
          "interactiveDescription": "Review and select tests based on the AI analysis above",
          "recommendedTests": "Recommended Tests",
          "otherTest": "Other (specify)",
          "otherTestPlaceholder": "Enter test name or description...",
          "caseClosed": "Case is closed. Ordering tests is disabled.",
          "testsOrdered": "Tests have been ordered. You can update the selection before finalizing the discharge report.",
          "clickToExpand": "Click \"Show Details\" above to view AI diagnosis",
          "diagnoses": {
            "acuteMi": "Acute Myocardial Infarction",
            "unstableAngina": "Unstable Angina",
            "gerd": "Gastroesophageal Reflux Disease",
            "musculoskeletalPain": "Musculoskeletal Chest Pain"
          },
          "tests": {
            "ecg": "Electrocardiogram (ECG)",
            "troponin": "Cardiac Troponin",
            "ckmb": "CK-MB",
            "chestXray": "Chest X-Ray",
            "echo": "Echocardiogram",
            "stressTest": "Stress Test",
            "endoscopy": "Upper Endoscopy",
            "phMonitor": "pH Monitoring",
            "muscleTest": "Muscle Function Test"
          },
          "evidence": {
            "chestPain": "Chest pain",
            "elevatedTroponin": "Elevated troponin",
            "ecgChanges": "ECG changes",
            "riskFactors": "Risk factors",
            "heartburn": "Heartburn",
            "noEcgChanges": "No ECG changes",
            "muscleTenderness": "Muscle tenderness",
            "noCardiacMarkers": "No cardiac markers"
          },
          "testDescriptions": {
            "ecg": "Assess cardiac rhythm and detect ischemia",
            "troponin": "Detect myocardial injury",
            "ckmb": "Creatine kinase myocardial band",
            "chestXray": "Evaluate lung fields and cardiac silhouette",
            "echo": "Assess cardiac function and wall motion",
            "stressTest": "Evaluate cardiac function under stress",
            "endoscopy": "Evaluate esophageal and gastric conditions",
            "phMonitor": "Monitor acid reflux patterns",
            "muscleTest": "Evaluate musculoskeletal function"
          },
          "interactiveUnavailable": "Interactive review requires recognizable diagnosis and test lists in the AI output."
        },
        "detailsTab": "Patient Details"
      },
      "common": {
        "loading": "Loading...",
        "error": "Error",
        "success": "Success",
        "cancel": "Cancel",
        "save": "Save",
        "edit": "Edit",
        "delete": "Delete",
        "confirm": "Confirm",
        "back": "Back",
        "backAriaLabel": "Back",
        "next": "Next",
        "previous": "Previous",
        "finish": "Finish",
        "close": "Close",
        "retry": "Retry",
        "step": "Step",
        "of": "of",
        "evidence": "Evidence",
        "supportingEvidence": "Supporting Evidence",
        "urgency": "Urgency",
        "high": "high",
        "medium": "medium",
        "low": "low",
        "backToDashboard": "Back to Dashboard"
      },
      "vitals": {
        "title": "Vital Signs Entry",
        "caseInfo": "Case Information",
        "caseId": "Case ID",
        "formTitle": "Enter Patient Vital Signs",
        "bloodPressure": "Blood Pressure",
        "bloodPressurePrompt": "Enter systolic/diastolic pressure (e.g., 120/80)",
        "bloodPressurePlaceholder": "120/80",
        "pulse": "Pulse",
        "pulsePrompt": "Enter heart rate in beats per minute",
        "pulsePlaceholder": "80",
        "oxygenSaturation": "Oxygen Saturation (SpO₂)",
        "oxygenPrompt": "Enter oxygen saturation percentage",
        "oxygenPlaceholder": "98",
        "temperature": "Temperature",
        "temperaturePrompt": "Enter body temperature in Celsius",
        "temperaturePlaceholder": "36.7",
        "painScale": "Pain Scale (1–10)",
        "painPrompt": "Rate patient's pain level from 1 (no pain) to 10 (severe pain)",
        "painPlaceholder": "3",
        "submit": "Submit Vitals",
        "submitting": "Submitting...",
        "back": "Back",
        "errors": {
          "bloodPressureRequired": "Blood pressure is required",
          "bloodPressureFormat": "Format: 120/80",
          "bloodPressureRange": "Systolic: 70-250, Diastolic: 40-150",
          "pulseRequired": "Pulse is required",
          "pulseRange": "Pulse must be between 30-200 bpm",
          "oxygenRequired": "Oxygen saturation is required",
          "oxygenRange": "Oxygen saturation must be between 50-100%",
          "temperatureRequired": "Temperature is required",
          "temperatureRange": "Temperature must be between 30-45°C",
          "painRequired": "Pain scale is required",
          "painRange": "Pain scale must be between 1-10",
          "submitFailed": "Failed to submit vitals. Please try again.",
          "submitError": "Error submitting vitals. Please check your connection.",
          "timeout": "The request timed out. Please check your connection and try again."
        }
      },
      "discharge": {
        "title": "Discharge Report",
        "proceedButton": "Proceed to Discharge Report",
        "prepareReport": "Prepare Discharge Report",
        "viewReport": "View Discharge Report",
        "loading": "Loading...",
        "finalized": "Finalized",
        "finalizedOn": "Finalized on",
        "aiActions": "AI Report Tools",
        "aiActionsHint": "Improve or shorten the existing report. Your edits are preserved.",
        "aiActionsHintEmpty": "Generate a report using all available case data.",
        "generateFull": "Generate Full Report",
        "improveLanguage": "Improve Medical Language",
        "shortenReport": "Shorten Report",
        "regenerate": "Regenerate from Scratch",
        "regenerateWarning": "This will replace the current report.",
        "confirmRegenerate": "Yes, Regenerate",
        "generating": "Generating...",
        "aiGenerating": "Generating structured discharge record...",
        "aiGeneratingHint": "This may take up to 30 seconds — please keep this page open.",
        "generationTimeout": "Generation is taking longer than expected. The report may already be ready — the page will refresh automatically.",
        "aiImproving": "Improving medical language...",
        "aiShortening": "Creating concise version...",
        "reportCardTitle": "Discharge Report",
        "reportContent": "Report Content",
        "edit": "Edit",
        "cancelEdit": "Cancel",
        "saveChanges": "Save Changes",
        "saving": "Saving...",
        "saved": "Saved",
        "legend": "Key",
        "structuredReport": "Structured Discharge Record",
        "legendDemo": "Demographics",
        "legendValues": "Clinical Values",
        "legendRecs": "Recommendations",
        "legendTreatment": "Treatment",
        "legendDx": "Diagnosis Terms",
        "noReport": "No report generated yet.",
        "noReportHint": "Click \"Generate Full Report\" above to create one.",
        "returnToCase": "Return to Case",
        "print": "Print / Export PDF",
        "finalizeDischarge": "Finalize Discharge",
        "confirmFinalize": "This will close the case. Confirm?",
        "confirmYes": "Yes, Finalize",
        "cancel": "Cancel",
        "finalizing": "Finalizing...",
        "loadErrorTitle": "Could not load case",
        "loadErrorDescription": "We were unable to load this discharge report. Please check your connection and try again.",
        "printTitle": "Emergency Department Discharge Summary",
        "patient": "Patient",
        "idLabel": "ID",
        "dateLabel": "Date"
      },
      "nurseLogin": {
        "title": "Nurse Access",
        "subtitle": "Enter your access code to continue.",
        "passcodePlaceholder": "Access code",
        "continue": "Continue",
        "invalidCode": "Invalid access code."
      },
      "nurseDashboard": {
        "title": "Triage Board",
        "subtitle": "Patients waiting for vital signs to be recorded",
        "loading": "Loading triage queue...",
        "error": "Could not load cases.",
        "unknownPatient": "Unknown patient",
        "minutes": "{{n}} min",
        "handedOff": "Handed off",
        "tabs": {
          "awaiting": "Awaiting vitals",
          "done": "Sent to doctor"
        },
        "search": {
          "placeholder": "Search by name or ID..."
        },
        "table": {
          "patient": "Patient",
          "id": "ID",
          "arrived": "Arrived",
          "waiting": "Waiting",
          "actions": "Action"
        },
        "actions": {
          "recordVitals": "Record vitals",
          "updateVitals": "Update vitals",
          "logout": "Log out"
        },
        "empty": {
          "title": "No patients in the queue",
          "noMatch": "No cases match your search.",
          "noAwaiting": "All caught up — no patients are currently waiting for triage.",
          "noDone": "No cases have been handed off to the doctor yet."
        }
      },
      "doctorLogin": {
        "title": "Doctor Access",
        "subtitle": "Enter your access code to continue.",
        "passcodePlaceholder": "Access code",
        "continue": "Continue",
        "invalidCode": "Invalid access code."
      }
    }
  },
  "he": {
    "translation": {
      "welcome": {
        "title": "ברוכים הבאים ל-SwiftyCare",
        "description": "נא הזן את פרטיך כדי להתחיל בתהליך הרישום הרפואי"
      },
      "form": {
        "title": "פרטי המטופל",
        "description": "נא למלא את הפרטים שלך למטה",
        "hospital": "בית חולים",
        "hospitalRequired": "שם בית החולים נדרש",
        "hospitalMinLength": "שם בית החולים חייב להכיל לפחות 2 תווים",
        "hospitalPlaceholder": "בחר בית חולים",
        "fullName": "שם מלא",
        "fullNameRequired": "שם מלא נדרש",
        "fullNameMinLength": "שם מלא חייב להכיל לפחות 2 תווים",
        "fullNameMaxLength": "שם מלא לא יכול להכיל יותר מ-100 תווים",
        "fullNameInvalid": "שם מלא יכול להכיל רק אותיות עבריות, אנגליות, רווחים, מקפים ואפוסטרופים",
        "fullNamePlaceholder": "הזן שם מלא",
        "nationalId": "מספר תעודת זהות",
        "nationalIdRequired": "מספר תעודת זהות נדרש",
        "nationalIdMinLength": "מספר תעודת זהות חייב להכיל לפחות 5 ספרות",
        "nationalIdMaxLength": "מספר תעודת זהות לא יכול להכיל יותר מ-20 ספרות",
        "nationalIdInvalid": "מספר תעודת זהות יכול להכיל רק ספרות",
        "nationalIdPlaceholder": "הזן מספר תעודת זהות",
        "submitButton": "התחל שאלון",
        "submitButtonLoading": "יוצר מקרה...",
        "formReady": "הטופס מוכן לשליחה",
        "submitError": "שגיאה ביצירת המקרה. נסה שוב.",
        "duplicateCaseError": "נראה שהמקרה הזה כבר קיים. אנא ודא את הפרטים שלך או פנה לתמיכה.",
        "networkError": "שגיאת רשת. נסה שוב.",
        "timeoutError": "תגובת השרת אורכת זמן רב מדי. אנא נסה שוב בעוד רגע."
      },
      "hospitals": {
        "hadassahEinKerem": "בית החולים הדסה עין כרם",
        "hadassahMountScopus": "בית החולים הדסה הר הצופים",
        "ichilov": "בית החולים איכילוב (תל אביב)",
        "sheba": "בית החולים שיבא (תל השומר)",
        "rambam": "בית החולים רמב\"ם (חיפה)",
        "soroka": "בית החולים סורוקה (באר שבע)",
        "kaplan": "בית החולים קפלן (רחובות)",
        "assafHarofeh": "בית החולים אסף הרופא (צריפין)",
        "shaareZedek": "בית החולים שערי צדק (ירושלים)",
        "billinson": "בית החולים בילינסון (פתח תקווה)",
        "meir": "בית החולים מאיר (כפר סבא)",
        "hillelYaffe": "בית החולים הלל יפה (חדרה)",
        "nahariya": "בית החולים נהריה",
        "poria": "בית החולים פוריה (טבריה)",
        "ziv": "בית החולים זיו (צפת)",
        "barzilai": "בית החולים ברזילי (אשקלון)",
        "yoseftal": "בית החולים יוספטל (אילת)",
        "laniado": "בית החולים לניאדו (נתניה)",
        "assuta": "בית החולים אסותא (תל אביב)",
        "herzliyaMedical": "בית החולים הרצליה מדיקל סנטר"
      },
      "footer": {
        "copyright": "© Swifty Medical 2025. כל הזכויות שמורות."
      },
      "language": {
        "toggle": "EN",
        "switchToHebrew": "החלף לעברית",
        "switchToEnglish": "החלף לאנגלית"
      },
      "questionnaire": {
        "title": "שאלון רפואי",
        "subtitle": "נא ענה על השאלות הבאות",
        "greeting": "שלום {{name}}, אנא מלא את הפרטים הבאים.",
        "step1": "פרטים אישיים והיסטוריה רפואית",
        "personalInfo": {
          "title": "פרטים אישיים",
          "age": "גיל",
          "agePlaceholder": "הזן גיל",
          "gender": "מין",
          "selectGender": "בחר מין",
          "male": "זכר",
          "female": "נקבה",
          "maritalStatus": "מצב משפחתי",
          "selectMaritalStatus": "בחר מצב משפחתי",
          "married": "נשוי/ה",
          "single": "רווק/ה",
          "divorced": "גרוש/ה",
          "widowed": "אלמן/ה",
          "formFilledBy": "מי ממלא את הטופס?",
          "selfCompleted": "ממולא בידי המטופל/ת עצמו/ה",
          "completedByCompanion": "ממולא בידי מלווה / מטפל/ת",
          "cognitiveState": "מצב קוגניטיבי",
          "selectCognitiveState": "בחר מצב קוגניטיבי",
          "cognitivelyIntact": "שמור קוגניטיבית",
          "cognitivelyImpaired": "ירוד קוגניטיבית",
          "memoryDecline": "ירידה בזיכרון",
          "conscious": "צלול",
          "confused": "מבולבל",
          "unconscious": "לא בהכרה",
          "functionalState": "מצב תפקודי",
          "selectFunctionalState": "בחר מצב תפקודי",
          "independent": "עצמאי",
          "dependent": "תלוי"
        },
        "medicalHistory": {
          "title": "היסטוריה רפואית",
          "none": "אין",
          "diabetes": "סכרת",
          "hypertension": "יתר לחץ דם",
          "dyslipidemia": "שומני דם גבוהים",
          "asthma": "אסטמה",
          "ischemicHeartDisease": "מחלת לב איסכמית",
          "heartFailure": "אי ספיקת לב",
          "atrialFibrillation": "פרפור פרוזדורים",
          "cancer": "סרטן",
          "cancerDetails": "פרטי הסרטן",
          "cancerStatus": "סטטוס הסרטן",
          "cancerStatus_active": "פעיל",
          "cancerStatus_pastHistory": "היסטוריה בעבר",
          "cancerType": "סוג הסרטן",
          "cancerTypePlaceholder": "לדוגמה: שד, ריאות, מעי גס...",
          "previousStroke": "שבץ מוחי בעבר",
          "hypothyroidism": "תת פעילות של בלוטת התריס",
          "copd": "COPD",
          "renalFailure": "אי ספיקת כליות",
          "smoking": "עישון",
          "immunocompromised": "כשל חיסוני / מדוכא חיסונית",
          "otherDiseases": "מחלות רקע נוספות",
          "otherDiseasesPlaceholder": "נא לציין",
          "previousSurgeries": "ניתוחים בעבר"
        },
        "currentIllness": {
          "title": "מחלה נוכחית",
          "instruction": "אנא בחר את כל התלונות הרלוונטיות",
          "chestPain": "כאבים בחזה",
          "headache": "כאב ראש",
          "abdominalPain": "כאבי בטן",
          "backPain": "כאבי גב",
          "flankPain": "כאב מותן",
          "neckPain": "כאב צוואר",
          "jointPain": "כאב במפרקים",
          "painInLimbs": "כאב בגפיים",
          "earPain": "כאב אוזן",
          "injectionSitePain": "כאב באתר ניקור / בדיקת דם",
          "fever": "חום",
          "shortnessOfBreath": "קוצר נשימה",
          "cough": "שיעול",
          "nausea": "בחילה",
          "vomiting": "הקאות",
          "diarrhea": "שלשול",
          "rash": "פריחה",
          "dizziness": "סחרחורת",
          "fatigueWeakness": "חולשה כללית",
          "syncope": "סינקופה (עילפון)",
          "alteredMentalStatus": "שינוי במצב ההכרה",
          "changeInConsciousness": "שינוי ברמת ההכרה",
          "swellingEdema": "נפיחות / בצקת",
          "eyeProblems": "בעיות בעיניים",
          "injuryTrauma": "פציעה / טראומה",
          "headInjury": "חבלת ראש",
          "abnormalBloodTests": "תוצאות בדיקות דם חריגות",
          "maxSelected": "נבחרו 2 מצבים — בטל בחירה אחת כדי לבחור אחרת"
        },
        "adaptive": {
          "selectChiefComplaint": "בחר תלונה עיקרית",
          "detailsFor": "פירוט עבור",
          "addDetail": "הוסף פירוט",
          "hideDetail": "הסתר פירוט",
          "detailPlaceholder": "נא לספק פרטים נוספים...",
          "selectOption": "בחר אפשרות",
          "additionalDetails": "פרטים נוספים",
          "additionalDetailsPlaceholder": "נא לספק מידע נוסף",
          "redFlagAlert": "⚠️ התראת דגל אדום",
          "redFlagMessage": "זוהו תסמינים קריטיים. ייתכן שנדרש טיפול רפואי מיידי.",
          "noSymptomsSelected": "לא נבחרו תסמינים",
          "goBackToStep1": "נא לחזור לשלב 1 ולבחור את התסמינים שלך",
          "selectedSymptoms": "תסמינים נבחרים",
          "pathways": {
            "chestPain": "כאבים בחזה",
            "chestPainDescription": "כאב או אי נוחות באזור החזה",
            "fever": "חום",
            "feverDescription": "טמפרטורת גוף מוגברת"
          },
          "painCharacteristics": {
            "label": "מאפייני הכאב",
            "pressing": "לוחץ",
            "burning": "שורף",
            "sharp": "דוקר",
            "radiating": "מקרין"
          },
          "location": {
            "label": "מיקום",
            "center": "אמצע",
            "leftSide": "צד שמאל",
            "behindBreastbone": "מאחורי עצם החזה"
          },
          "onset": {
            "label": "התחלה",
            "sudden": "פתאומית",
            "gradual": "הדרגתית",
            "intermittent": "מקוטעת"
          },
          "duration": {
            "label": "משך",
            "lessThan30min": "פחות מ-30 דקות",
            "min30To2hours": "30 דקות עד 2 שעות",
            "moreThan2hours": "יותר מ-2 שעות",
            "everyHalfHour": "כל חצי שעה"
          },
          "radiationDetails": {
            "label": "פירוט הקרנה",
            "placeholder": "לאן מקרין הכאב?"
          },
          "cardiacQuestions": {
            "label": "תסמינים נלווים",
            "shortnessOfBreath": "קוצר נשימה",
            "nausea": "בחילה",
            "sweating": "הזעה",
            "dizziness": "סחרחורת"
          },
          "respiratoryQuestions": {
            "label": "קושי נשימתי",
            "mild": "קל",
            "moderate": "בינוני",
            "severe": "חמור"
          },
          "acuteQuestions": {
            "label": "תסמינים חריפים",
            "severePain": "כאב חמור (8-10/10)",
            "lossOfConsciousness": "אובדן הכרה",
            "acuteDistress": "מצוקה חריפה"
          },
          "frequencyQuestions": {
            "label": "פירוט תדירות",
            "placeholder": "תאר את דפוס התדירות"
          },
          "temperature": {
            "label": "טווח טמפרטורה",
            "lowGrade": "נמוכה (37.1-38.0°C)",
            "moderate": "בינונית (38.1-39.0°C)",
            "high": "גבוהה (39.1-40.0°C)",
            "veryHigh": "גבוהה מאוד (>40.0°C)"
          },
          "associatedSymptoms": {
            "label": "תסמינים נלווים",
            "headache": "כאב ראש",
            "bodyAches": "כאבי גוף",
            "chills": "צמרמורות",
            "fatigue": "עייפות"
          },
          "headacheQuestions": {
            "label": "חומרת כאב הראש",
            "mild": "קל",
            "moderate": "בינוני",
            "severe": "חמור"
          },
          "highFeverQuestions": {
            "label": "תסמיני חום גבוה",
            "alteredMentalStatus": "שינוי במצב הנפשי",
            "neckStiffness": "כאב בעורף",
            "rash": "פריחה"
          },
          "chronicFeverQuestions": {
            "label": "פירוט חום כרוני",
            "placeholder": "תאר תסמינים נוספים"
          },
          "rashQuestions": {
            "label": "תיאור פריחה",
            "placeholder": "תאר את מראה הפריחה ומיקומה"
          }
        },
        "medications": {
          "allergies": {
            "title": "רגישות לתרופות",
            "question": "האם קיימת רגישות לתרופות?",
            "yes": "כן",
            "no": "לא",
            "detailsPlaceholder": "נא לציין את הרגישויות"
          },
          "doesNotRemember": "אינני זוכר/ת את התרופות שלי",
          "doesNotRememberNote": "הרופא יקבל הודעה שהיסטוריית התרופות אינה זמינה.",
          "groups": {
            "title": "תרופות קבועות",
            "bloodPressure": "לחץ דם",
            "diabetes": "סוכרת",
            "bloodThinners": "דילול דם",
            "immunosuppressants": "דיכוי חיסוני",
            "miscellaneous": "שונות",
            "cardiac": "לב"
          }
        },
        "symptoms": {
          "chiefComplaint": "תלונה עיקרית",
          "symptomDuration": "כמה זמן יש לך את התסמינים האלה?",
          "severity": "חומרה (1-10)",
          "additionalSymptoms": "תסמינים נוספים"
        },
        "vitals": {
          "bloodPressure": "לחץ דם",
          "heartRate": "דופק",
          "temperature": "טמפרטורה",
          "oxygenSaturation": "ריווי חמצן"
        },
        "navigation": {
          "next": "הבא",
          "previous": "הקודם",
          "finish": "סיום",
          "loading": "שומר..."
        },
        "wizard": {
          "personalDetails": "פרטים",
          "medicalHistory": "היסטוריה",
          "allergies": "אלרגיות",
          "medications": "תרופות",
          "currentIllness": "מחלה",
          "personalSubtitle": "ספר לנו קצת על עצמך",
          "historySubtitle": "בחר את כל המצבים הרלוונטיים",
          "allergiesSubtitle": "מידע על רגישות לתרופות",
          "medicationsSubtitle": "בחר תרופות שאתה נוטל כעת (אופציונלי)",
          "medicationsOptional": "סעיף זה הוא אופציונלי — דלג אם לא רלוונטי",
          "illnessSubtitle": "בחר עד 2 סיבות עיקריות לביקורך היום",
          "allergyDetailsLabel": "אנא תאר את האלרגיות שלך"
        },
        "medGroup": {
          "otherLabel": "אחר (אנא ציין)",
          "otherPlaceholder": "הזן שם תרופה"
        },
        "confirmationTitle": "תודה",
        "confirmationMessage": "תודה שמילאת את פרטיך. רופא יבדוק את המקרה שלך בקרוב.",
        "step2": {
          "symptoms": "תסמינים נוכחיים",
          "optional": "אופציונלי",
          "stepIndicator": "שלב 2 מתוך 2",
          "pathwayOf": "תסמין {{current}} מתוך {{total}}",
          "yes": "כן",
          "no": "לא",
          "sliderNone": "ללא",
          "sliderModerate": "בינוני",
          "sliderWorst": "חמור מאוד",
          "maxSelected": "הגעת למספר הבחירות המקסימלי",
          "highSeverityWarning": "רמת חומרה זו עשויה להצביע על צורך בטיפול דחוף",
          "redFlagWarning": "תסמין זה דורש תשומת לב רפואית מיידית",
          "abdominalPain": {
            "painLocation": "איפה ממוקם הכאב?",
            "onsetWhen": "מתי התחיל הכאב?",
            "onsetToday": "היום",
            "onset1to3": "לפני 1–3 ימים",
            "onset3to7": "לפני 3–7 ימים",
            "onsetOverWeek": "לפני יותר מ-7 ימים",
            "onsetType": "איך התחיל הכאב?",
            "onsetSudden": "פתאומי (התחיל במהירות)",
            "onsetGradual": "הדרגתי (התפתח לאט)",
            "character": "כיצד תתאר את הכאב?",
            "charSharp": "חד / דוקר",
            "charCrampy": "עוויתי / קוליקי",
            "charDull": "עמום / מכאיב",
            "charBurning": "צורב",
            "charPressure": "לוחץ / מועך",
            "radiation": "האם הכאב מקרין לאחר?",
            "radBack": "גב",
            "radRightShoulder": "כתף ימין",
            "radLeftShoulder": "כתף שמאל",
            "radGroin": "מפשעה",
            "radChest": "חזה",
            "radNone": "לא מקרין",
            "aggravating": "מה מחמיר את הכאב?",
            "aggEating": "אכילה",
            "aggMovement": "תנועה",
            "aggDeepBreath": "נשימה עמוקה",
            "aggLyingFlat": "שכיבה על הגב",
            "relieving": "מה מקל על הכאב?",
            "relEating": "אכילה",
            "relAntacids": "נוגדי חומצה",
            "relPassingGas": "גרוז / עשיית צרכים",
            "relLyingStill": "שכיבה ללא תנועה",
            "associated": "האם יש תסמינים נוספים?",
            "assocConstipation": "עצירות",
            "assocJaundice": "צהבת (צהוב בעור/עיניים)",
            "assocBloodStool": "דם בצואה",
            "assocDarkUrine": "שתן כהה",
            "assocLossOfAppetite": "חוסר תיאבון",
            "assocBloating": "נפיחות בבטן",
            "rfFever": "האם יש לך חום מעל 38.5°C?",
            "rfBlood": "האם יש דם בהקאה או בצואה?",
            "rfUnableToEat": "האם לא הצלחת לאכול או לשתות יותר מ-24 שעות?",
            "rfPregnancy": "האם את בהריון, או שייתכן שאת בהריון?"
          },
          "headache": {
            "location": "היכן בראשך ממוקם הכאב?",
            "onsetWhen": "מתי התחיל כאב הראש?",
            "onsetType": "כיצד התחיל?",
            "onsetThunderclap": "כרעם — הגיע לשיא העוצמה תוך שניות",
            "onsetGradual": "הדרגתי — התפתח לאט",
            "character": "כיצד מרגיש כאב הראש?",
            "charThrobbing": "פועם / מתקתק",
            "charPressure": "לחץ / הידוק (כמו חגורה)",
            "charSharp": "חד / דוקר",
            "charDull": "עמום / קבוע",
            "pattern": "מהו דפוס כאב הראש?",
            "patternConstant": "קבוע",
            "patternComesAndGoes": "בא והולך",
            "patternWorsening": "מחמיר בהדרגה",
            "aggravating": "מה מחמיר את כאב הראש?",
            "aggLight": "רגישות לאור (פוטופוביה)",
            "aggNoise": "רגישות לרעש (פונופוביה)",
            "aggMovement": "תנועה / פעילות גופנית",
            "aggBending": "כיפוף קדימה",
            "associated": "האם יש תסמינים נוספים?",
            "assocNausea": "בחילה או הקאות",
            "assocVisualAura": "הילה ויזואלית (זיג-זג, נקודה עיוורת)",
            "assocNeckStiffness": "כאב בעורף",
            "assocFever": "חום",
            "assocDizziness": "סחרחורת",
            "assocWeakness": "חולשה או חוסר תחושה",
            "assocSlurredSpeech": "ערפול דיבור",
            "assocEyeRedness": "אדמומיות או כאב בעין",
            "rfWorstEver": "האם זהו כאב הראש הגרוע ביותר בחייך?",
            "rfNewType": "האם זהו סוג כאב ראש חדש שמעולם לא חווית?",
            "rfFeverNeck": "האם יש לך גם חום וגם כאב בעורף?",
            "rfConfusion": "האם אתה חווה בלבול או ירידה בהכרה?",
            "rfWeakness": "האם יש חולשה חדשה, חוסר תחושה, או קושי בדיבור?"
          },
          "sliderTapToRate": "גרור את הסליידר כדי לדרג"
        },
        "errors": {
          "required": "שדה זה נדרש",
          "invalidFormat": "פורמט לא תקין",
          "saveError": "שגיאה בשמירת השאלון. נסה שוב.",
          "ageRequired": "גיל נדרש",
          "ageInvalid": "גיל חייב להיות מספר תקין",
          "ageRange": "גיל חייב להיות בין 0 ל-120",
          "formFilledByRequired": "נא לציין מי ממלא את הטופס",
          "genderRequired": "מין נדרש",
          "maritalStatusRequired": "מצב משפחתי נדרש",
          "cognitiveStateRequired": "מצב קוגניטיבי נדרש",
          "functionalStateRequired": "מצב תפקודי נדרש",
          "medicalHistoryRequired": "נא לבחור לפחות אפשרות אחת בהיסטוריה הרפואית",
          "allergiesRequired": "נא לציין אם יש לך אלרגיות",
          "illnessRequired": "נא לבחור לפחות תסמין אחד",
          "pathwayRequired": "נא לענות על כל השאלות הנדרשות המסומנות ב-*",
          "loadError": "לא הצלחנו לטעון את המקרה שלך. אנא בדוק את החיבור ונסה שוב.",
          "caseNotFound": "המקרה לא נמצא",
          "caseNotFoundHint": "המקרה שאתה מחפש אינו קיים או הוסר."
        },
        "step4": "סימנים חיוניים",
        "defaultPatientName": "מטופל",
        "pathway": {
          "abdominalPain": {
            "abPainLocation": { "q": "היכן ממוקם הכאב?" },
            "abOnsetWhen": {
              "q": "מתי התחיל הכאב?",
              "today": "היום",
              "1to3days": "לפני 1–3 ימים",
              "3to7days": "לפני 3–7 ימים",
              "overWeek": "לפני יותר משבוע"
            },
            "abOnsetType": {
              "q": "איך התחיל הכאב?",
              "sudden": "פתאומי (התפתח במהירות)",
              "gradual": "הדרגתי (התפתח לאט)"
            },
            "abCharacter": {
              "q": "איך היית מתאר את הכאב?",
              "sharp": "חד / דוקר",
              "crampy": "התכווצויות / קוליק",
              "dull": "עמום / כואב",
              "burning": "שורף",
              "pressure": "לחץ / סחיטה"
            },
            "abSeverity": { "q": "עוצמת הכאב (0 = ללא כאב, 10 = הגרוע ביותר)" },
            "abRadiation": { "q": "האם הכאב מקרין?" },
            "abRadiationWhere": {
              "q": "לאן הכאב מקרין?",
              "back": "גב",
              "rightShoulder": "כתף ימין",
              "leftShoulder": "כתף שמאל",
              "groin": "מפשעה",
              "chest": "חזה"
            },
            "abAggravating": {
              "q": "מה מחמיר את הכאב?",
              "eating": "אכילה",
              "movement": "תנועה",
              "deepBreath": "נשימה עמוקה",
              "lyingFlat": "שכיבה שטוחה",
              "nothing": "שום דבר מסוים"
            },
            "abRelieving": {
              "q": "מה מקל על הכאב?",
              "eating": "אכילה",
              "antacids": "תרופות נגד צרבת",
              "passingGas": "יציאת גזים / צואה",
              "lyingStill": "שכיבה ללא תנועה",
              "nothing": "שום דבר לא עוזר"
            },
            "abAssociated": {
              "q": "תסמינים נוספים שאתה חווה?",
              "nausea": "בחילה",
              "vomiting": "הקאות",
              "diarrhea": "שלשול",
              "constipation": "עצירות",
              "fever": "חום",
              "jaundice": "הצהבה של העור/עיניים (צהבת)",
              "bloodStool": "דם בצואה",
              "darkUrine": "שתן כהה",
              "lossOfAppetite": "אובדן תיאבון",
              "bloating": "נפיחות"
            },
            "abRfFever": { "q": "האם יש לך חום מעל 38.5°C?" },
            "abRfBlood": { "q": "האם יש דם בהקאה או בצואה?" },
            "abRfUnableToEat": { "q": "האם לא הצלחת לאכול או לשתות במשך יותר מ-24 שעות?" },
            "abRfPregnancy": { "q": "האם את ידועה כהרה או ייתכן שאת בהריון?" }
          },
          "headache": {
            "hdLocation": { "q": "היכן בראש ממוקם הכאב?" },
            "hdOnsetWhen": {
              "q": "מתי התחיל כאב הראש?",
              "today": "היום",
              "1to3days": "לפני 1–3 ימים",
              "3to7days": "לפני 3–7 ימים",
              "overWeek": "לפני יותר משבוע"
            },
            "hdOnsetType": {
              "q": "איך זה התחיל?",
              "thunderclap": "בום רעם — הגיע לשיא תוך שניות",
              "gradual": "הדרגתי — התפתח במהלך דקות או שעות"
            },
            "hdCharacter": {
              "q": "איך מרגיש כאב הראש?",
              "throbbing": "הולם / פועם",
              "pressure": "לחץ / סחיטה (כמו סרט)",
              "sharp": "חד / דוקר",
              "dull": "עמום / כאב מתמשך"
            },
            "hdSeverity": { "q": "עוצמת כאב הראש (0 = ללא כאב, 10 = הגרוע ביותר)" },
            "hdPattern": {
              "q": "מה דפוס כאב הראש שלך?",
              "constant": "מתמשך",
              "comesAndGoes": "בא והולך",
              "worsening": "מחמיר בהדרגה"
            },
            "hdAggravating": {
              "q": "מה מחמיר את כאב הראש?",
              "light": "רגישות לאור (פוטופוביה)",
              "noise": "רגישות לרעש (פונופוביה)",
              "movement": "תנועה / פעילות גופנית",
              "bending": "הטיה קדימה",
              "nothing": "שום דבר מסוים"
            },
            "hdAssociated": {
              "q": "תסמינים נוספים שאתה חווה?",
              "nausea": "בחילה או הקאות",
              "visualAura": "אאורה ויזואלית (זיגזגים, נקודה עיוורת)",
              "neckStiffness": "כאב בעורף",
              "fever": "חום",
              "dizziness": "סחרחורת",
              "weakness": "חולשה או חוסר תחושה",
              "slurredSpeech": "דיבור לא ברור",
              "eyeRedness": "אדמומיות או כאב בעין"
            },
            "hdRfWorstEver": { "q": "האם זהו כאב הראש הגרוע ביותר בחייך?" },
            "hdRfNewType": { "q": "האם זהו סוג חדש של כאב ראש שלא חווית בעבר?" },
            "hdRfFeverNeck": { "q": "האם יש לך חום וגם כאב בעורף יחד?" },
            "hdRfConfusion": { "q": "האם אתה חווה בלבול או ירידה בערנות?" },
            "hdRfWeakness": { "q": "האם יש חולשה חדשה, חוסר תחושה או קושי בדיבור?" }
          },
          "chestPain": {
            "cpCharacter": {
              "q": "איך היית מתאר את הכאב בחזה?",
              "pressing": "לוחץ / כבד",
              "burning": "שורף",
              "sharp": "חד / דוקר",
              "tight": "הדוק / סוחט"
            },
            "cpSeverity": { "q": "עוצמת הכאב (0 = ללא כאב, 10 = הגרוע ביותר)" },
            "cpOnset": {
              "q": "מתי התחיל הכאב בחזה?",
              "sudden": "פתאומי",
              "gradual": "הדרגתי",
              "intermittent": "בא והולך"
            },
            "cpAssociated": {
              "q": "האם יש לך תסמינים נלווים?",
              "shortnessOfBreath": "קוצר נשימה",
              "nausea": "בחילה או הקאות",
              "sweating": "הזעה",
              "leftArm": "כאב בזרוע / כתף שמאל",
              "jaw": "כאב בלסת / צוואר",
              "dizziness": "סחרחורת"
            },
            "cpSimilarPast": { "q": "האם היה לך כאבים דומים בעבר לכאב הזה?" },
            "cpRfRadiation": { "q": "האם הכאב מקרין לזרוע, ללסת או לגב?" }
          },
          "fever": {
            "fvTemperature": {
              "q": "מהי הטמפרטורה המשוערת שלך?",
              "lowGrade": "נמוך (37.1–38.0°C)",
              "moderate": "בינוני (38.1–39.0°C)",
              "high": "גבוה (39.1–40.0°C)",
              "veryHigh": "גבוה מאוד (מעל 40°C)"
            },
            "fvDuration": {
              "q": "כמה זמן יש לך חום?",
              "lessThan24h": "פחות מ-24 שעות",
              "1to3days": "1–3 ימים",
              "moreThan3days": "יותר מ-3 ימים"
            },
            "fvAssociated": {
              "q": "תסמינים נוספים יחד עם החום?",
              "dysuria": "צריבה במתן שתן",
              "cough": "שיעול",
              "abdominalPain": "כאבי בטן",
              "flankPain": "כאב מותן",
              "earPain": "כאב אוזן",
              "soreThroat": "כאב גרון",
              "legRednessSwellingPain": "אודם / נפיחות / כאבים ברגל",
              "diarrhea": "שלשולים",
              "vomiting": "הקאות",
              "rhinorrhea": "נזלת",
              "chestPain": "כאבים בחזה",
              "shortnessOfBreath": "קושי בנשימה",
              "syncope": "עלפון",
              "jaundice": "צהבת",
              "headache": "כאב ראש",
              "bodyAches": "כאבי גוף",
              "chills": "צמרמורות / רעידות",
              "neckStiffness": "כאב בעורף",
              "rash": "פריחה",
              "fatigue": "עייפות / חולשה"
            },
            "fvRfAlteredMental": { "q": "האם יש בלבול, שינוי בהכרה או חוסר יכולת להתעורר?" }
          },
          "cough": {
            "ckDuration": {
              "q": "כמה זמן יש לך שיעול?",
              "lessThan24h": "פחות מ-24 שעות",
              "1to7days": "1–7 ימים",
              "moreThan7days": "יותר משבוע"
            },
            "ckCharacter": {
              "q": "איזה סוג שיעול?",
              "dry": "שיעול יבש (ללא ליחה)",
              "productiveClear": "שיעול עם ליחה — שקופה או לבנה",
              "productiveColored": "שיעול עם ליחה — צהובה או ירוקה",
              "bloody": "דם בליחה"
            },
            "ckOnset": {
              "q": "איך זה התחיל?",
              "sudden": "פתאומי (בתוך שעות)",
              "gradual": "הדרגתי (ימים)"
            },
            "ckAssociated": {
              "q": "תסמינים נוספים יחד עם השיעול?",
              "shortnessOfBreath": "קוצר נשימה",
              "chestPain": "כאב בחזה",
              "fever": "חום",
              "wheezing": "צפצופים",
              "soreThroat": "כאב גרון",
              "runnyNose": "נזלת"
            },
            "ckRfHighFever": { "q": "האם יש לך חום גבוה (מעל 39°C)?" }
          },
          "shortnessOfBreath": {
            "sobSeverity": {
              "q": "מה חומרת קוצר הנשימה שלך?",
              "mild": "קל — רק במאמץ",
              "moderate": "בינוני — בפעילויות רגילות",
              "severe": "חמור — במנוחה",
              "cantSpeak": "לא יכול לדבר במשפטים שלמים"
            },
            "sobOnset": {
              "q": "איך זה התחיל?",
              "sudden": "פתאומי (תוך דקות)",
              "gradual": "הדרגתי (שעות עד ימים)",
              "chronic": "כרוני (שבועות עד חודשים)"
            },
            "sobTriggers": {
              "q": "מה מעורר או מחמיר את קושי הנשימה?",
              "exertion": "מאמץ גופני",
              "lyingFlat": "שכיבה שטוחה",
              "allergens": "אלרגנים / סביבה",
              "noTrigger": "אין גורם ברור"
            },
            "sobAssociated": {
              "q": "תסמינים נלווים?",
              "chestPain": "כאב בחזה",
              "wheezing": "צפצופים",
              "cough": "שיעול",
              "blueLips": "שפתיים או קצות אצבעות כחולות",
              "legSwelling": "נפיחות ברגליים"
            }
          },
          "dizziness": {
            "dzType": {
              "q": "איזה סוג סחרחורת אתה חווה?",
              "vertigo": "ורטיגו — תחושת סחרור",
              "lightheaded": "סחרחורת — תחושת חולשה",
              "imbalance": "חוסר איזון — חוסר יציבות בהליכה"
            },
            "dzOnset": {
              "q": "איך זה התחיל?",
              "sudden": "פתאומי",
              "gradual": "הדרגתי"
            },
            "dzAssociated": {
              "q": "תסמינים נלווים?",
              "nausea": "בחילה או הקאות",
              "hearingLoss": "אובדן שמיעה",
              "tinnitus": "צלצולים באוזניים (טיניטוס)",
              "headache": "כאב ראש",
              "doubleVision": "ראייה כפולה",
              "weakness": "חולשה או חוסר תחושה"
            },
            "dzRfFaint": { "q": "האם התעלפת או איבדת הכרה?" }
          },
          "nauseaVomitingDiarrhea": {
            "nvdPrimary": {
              "q": "מה מהבאים אתה חווה?",
              "nausea": "בחילה",
              "vomiting": "הקאות",
              "diarrhea": "שלשול"
            },
            "nvdSeverity": {
              "q": "מה חומרת זה?",
              "mild": "קל — ניתן להתמודד",
              "moderate": "בינוני — משפיע על פעילויות יומיומיות",
              "severe": "חמור — לא מסוגל לתפקד"
            },
            "nvdDuration": {
              "q": "כמה זמן יש לך את התסמינים?",
              "lessThan6h": "פחות מ-6 שעות",
              "6to24h": "6–24 שעות",
              "moreThan24h": "יותר מ-24 שעות"
            },
            "nvdAssociated": {
              "q": "גם מהבאים?",
              "bloodInVomit": "דם בהקאה",
              "bloodInStool": "דם בצואה",
              "fever": "חום",
              "abdominalPain": "כאב בטן"
            },
            "nvdRfFluids": { "q": "האם אינך יכול להחזיק נוזלים בקיבה?" }
          },
          "injuryTrauma": {
            "itMechanism": {
              "q": "איך אירעה הפציעה?",
              "fall": "נפילה",
              "motorVehicle": "תאונת רכב",
              "sports": "ספורט / פנאי",
              "blunt": "מכה מחפץ",
              "other": "אחר"
            },
            "itBodyPart": {
              "q": "אילו חלקי גוף נפגעו?",
              "head": "ראש",
              "neck": "צוואר",
              "chest": "חזה",
              "abdomen": "בטן",
              "back": "גב / עמוד שדרה",
              "upperLimb": "זרוע / יד",
              "lowerLimb": "רגל / כף רגל"
            },
            "itSeverity": { "q": "עוצמת הכאב (0 = ללא כאב, 10 = הגרוע ביותר)" },
            "itRfConsciousness": { "q": "האם איבדת הכרה בשלב כלשהו?" }
          },
          "changeInConsciousness": {
            "cocDuration": {
              "q": "כמה זמן ארע / נמשך האירוע?",
              "lessThan1min": "פחות מדקה אחת",
              "1to5min": "1–5 דקות",
              "moreThan5min": "יותר מ-5 דקות",
              "stillOngoing": "עדיין נמשך"
            },
            "cocPreceding": {
              "q": "מה קדם לאירוע?",
              "chestPain": "כאב בחזה",
              "headache": "כאב ראש חמור",
              "dizziness": "סחרחורת",
              "nothing": "ללא אזהרה"
            },
            "cocRecovery": {
              "q": "איך ההחלמה?",
              "full": "החלמה מלאה",
              "partial": "החלמה חלקית",
              "notRecovered": "עדיין לא החלים"
            },
            "cocRfRepeated": { "q": "האם זה קרה יותר מפעם אחת?" }
          },
          "backPain": {
            "bpLocation": {
              "q": "היכן ממוקם כאב הגב?",
              "upperBack": "גב עליון",
              "lowerBack": "גב תחתון",
              "radiatingToLegs": "גב תחתון מתפשט לרגליים"
            },
            "bpOnset": {
              "q": "מתי זה התחיל?",
              "sudden": "פתאומי (לאחר פציעה/תנועה)",
              "gradual": "הדרגתי (ללא סיבה ברורה)",
              "chronic": "כרוני (יותר מ-6 שבועות)"
            },
            "bpSeverity": { "q": "עוצמת הכאב (0 = ללא כאב, 10 = הגרוע ביותר)" },
            "bpAssociated": {
              "q": "תסמינים נלווים?",
              "numbnessLegs": "חוסר תחושה / עקצוצים ברגליים",
              "bladderIssues": "בעיות בשלפוחית או במעיים",
              "fever": "חום",
              "recentInjury": "פציעה או נפילה לאחרונה"
            }
          },
          "flankPain": {
            "fpSide": {
              "q": "באיזה צד הכאב?",
              "right": "מותן ימין",
              "left": "מותן שמאל",
              "both": "שני הצדדים"
            },
            "fpCharacter": {
              "q": "איך היית מתאר את הכאב?",
              "colicky": "קוליקי (בגלים)",
              "constant": "כאב עמום קבוע",
              "sharp": "חד / דוקר"
            },
            "fpSeverity": { "q": "עוצמת הכאב (0 = ללא כאב, 10 = הגרוע ביותר)" },
            "fpOnset": {
              "q": "מתי התחיל הכאב?",
              "sudden": "פתאומי",
              "gradual": "הדרגתי",
              "intermittent": "בא והולך"
            },
            "fpAssociated": {
              "q": "תסמינים נלווים?",
              "dysuria": "צריבה במתן שתן",
              "hematuria": "דם בשתן",
              "fever": "חום",
              "nausea": "בחילה או הקאות",
              "urinaryFrequency": "תכיפות / דחיפות במתן שתן"
            }
          },
          "jointPain": {
            "jpJoint": {
              "q": "איזה מפרק נפגע?",
              "knee": "ברך",
              "hip": "ירך",
              "shoulder": "כתף",
              "wristHand": "שורש כף יד / כף יד",
              "ankleFoot": "קרסול / כף רגל",
              "elbow": "מרפק",
              "multiple": "מספר מפרקים"
            },
            "jpOnset": {
              "q": "איך זה התחיל?",
              "sudden": "פתאומי",
              "gradual": "הדרגתי",
              "afterInjury": "לאחר פציעה או נפילה"
            },
            "jpSeverity": { "q": "עוצמת הכאב (0 = ללא כאב, 10 = הגרוע ביותר)" },
            "jpSwelling": { "q": "האם יש נפיחות במפרק?" },
            "jpAssociated": {
              "q": "תסמינים נלווים?",
              "fever": "חום",
              "rednessWarmth": "אדמומיות / חום מקומי במפרק",
              "stiffness": "נוקשות (במיוחד בבוקר)",
              "limitedMovement": "הגבלת טווח תנועה",
              "trauma": "פציעה או נפילה לאחרונה"
            }
          },
          "painInLimbs": {
            "plLimb": {
              "q": "באיזו גפה הכאב?",
              "upperArm": "זרוע / יד",
              "lowerLeg": "רגל / כף רגל",
              "multiple": "מספר גפיים"
            },
            "plSide": {
              "q": "באיזה צד?",
              "left": "שמאל",
              "right": "ימין",
              "both": "שני הצדדים"
            },
            "plOnset": {
              "q": "איך זה התחיל?",
              "sudden": "פתאומי",
              "gradual": "הדרגתי",
              "afterInjury": "לאחר פציעה או נפילה"
            },
            "plSeverity": { "q": "עוצמת הכאב (0 = ללא כאב, 10 = הגרוע ביותר)" },
            "plAssociated": {
              "q": "תסמינים נלווים?",
              "swelling": "נפיחות",
              "redness": "אדמומיות / חום מקומי",
              "numbness": "חוסר תחושה / עקצוצים",
              "weakness": "חולשה",
              "fever": "חום"
            }
          },
          "earPain": {
            "eaLaterality": {
              "q": "באיזו אוזן הכאב?",
              "left": "אוזן שמאל",
              "right": "אוזן ימין",
              "both": "שתי האוזניים"
            },
            "eaOnset": {
              "q": "איך זה התחיל?",
              "sudden": "פתאומי",
              "gradual": "הדרגתי",
              "afterCold": "לאחר הצטננות / דלקת דרכי נשימה עליונות"
            },
            "eaSeverity": { "q": "עוצמת הכאב (0 = ללא כאב, 10 = הגרוע ביותר)" },
            "eaAssociated": {
              "q": "תסמינים נלווים?",
              "fever": "חום",
              "hearingLoss": "ירידה בשמיעה / שמיעה מעומעמת",
              "discharge": "הפרשה מהאוזן",
              "soreThroat": "כאב גרון",
              "dizziness": "סחרחורת / ורטיגו"
            }
          },
          "neckPain": {
            "npOnset": {
              "q": "איך התחיל הכאב בצוואר?",
              "sudden": "פתאומי (לאחר פציעה)",
              "gradual": "הדרגתי",
              "wakingUp": "התעוררתי עם זה"
            },
            "npCharacter": {
              "q": "איך זה מרגיש?",
              "stiff": "נוקשה / תנועה מוגבלת",
              "sharp": "כאב חד",
              "aching": "כאב עמום",
              "burning": "שורף"
            },
            "npRadiation": {
              "q": "האם הכאב מקרין?",
              "none": "לא, נשאר בצוואר",
              "toArm": "כן, לזרוע / יד",
              "toHead": "כן, לראש",
              "both": "שתי הזרועות"
            },
            "npRfMeningism": { "q": "האם יש לך חום יחד עם כאב בעורף?" }
          },
          "eyeProblems": {
            "epSymptoms": {
              "q": "אילו תסמיני עין אתה חווה?",
              "redness": "אדמומיות",
              "pain": "כאב בעין",
              "visionChange": "שינוי בראייה / טשטוש",
              "discharge": "הפרשה / עין דומעת",
              "doubleVision": "ראייה כפולה"
            },
            "epLaterality": {
              "q": "איזו עין נפגעה?",
              "left": "עין שמאל",
              "right": "עין ימין",
              "both": "שתי העיניים"
            },
            "epOnset": {
              "q": "איך זה התחיל?",
              "sudden": "פתאומי",
              "gradual": "הדרגתי"
            },
            "epRfVisionLoss": { "q": "האם יש אובדן פתאומי או ירידה משמעותית בראייה?" },
            "epRfTrauma": { "q": "האם הייתה פגיעה לעין או חשיפה כימית לאחרונה?" }
          }
        }
      },
      "dashboard": {
        "title": "לוח בקרה לרופא",
        "subtitle": "חיפוש וניהול מקרים רפואיים",
        "loading": "טוען מקרים...",
        "error": "שגיאה בטעינת מקרים",
        "retry": "נסה שוב",
        "tabs": {
          "open": "פתוח",
          "closed": "סגור"
        },
        "search": {
          "placeholder": "חפש לפי שם מטופל או ת.ז..."
        },
        "filters": {
          "all": "כל המקרים",
          "pendingDoctorReview": "ממתין לבדיקת רופא",
          "inReview": "בבדיקה",
          "completed": "הושלם",
          "cancelled": "בוטל"
        },
        "status": {
          "open": "פתוח",
          "closed": "סגור",
          "cancelled": "בוטל",
          "awaiting_vitals": "ממתין למדדים",
          "in_progress": "בטיפול",
          "tests_ordered": "הוזמנו בדיקות",
          "pendingDoctorReview": "ממתין לבדיקת רופא",
          "inReview": "בבדיקה",
          "completed": "הושלם"
        },
        "table": {
          "patientName": "שם מטופל",
          "id": "ת.ז.",
          "status": "סטטוס",
          "receptionDate": "תאריך קבלה",
          "actions": "פעולות"
        },
        "actions": {
          "newCase": "מקרה חדש",
          "openFile": "פתח תיק",
          "delete": "מחק",
          "deleteConfirm": "למחוק את המקרה? פעולה זו לא ניתנת לביטול.",
          "deleteError": "מחיקת המקרה נכשלה",
          "logout": "התנתק"
        },
        "empty": {
          "title": "לא נמצאו מקרים",
          "description": "אין מקרים התואמים לקריטריוני החיפוש הנוכחיים.",
          "noMatch": "אין מקרים התואמים את החיפוש.",
          "noOpen": "אין כרגע מקרים פתוחים. מקרים חדשים יופיעו כאן.",
          "noClosed": "אין עדיין מקרים סגורים או מבוטלים."
        },
        "unknownPatient": "מטופל לא ידוע"
      },
      "common": {
        "loading": "טוען...",
        "error": "שגיאה",
        "success": "הצלחה",
        "cancel": "ביטול",
        "save": "שמור",
        "edit": "ערוך",
        "delete": "מחק",
        "confirm": "אישור",
        "back": "חזור",
        "backAriaLabel": "חזור",
        "next": "הבא",
        "previous": "הקודם",
        "finish": "סיום",
        "close": "סגור",
        "retry": "נסה שוב",
        "step": "שלב",
        "of": "מתוך",
        "evidence": "ראיות",
        "supportingEvidence": "ראיות תומכות",
        "urgency": "דחיפות",
        "high": "גבוהה",
        "medium": "בינונית",
        "low": "נמוכה",
        "backToDashboard": "חזור ללוח הבקרה"
      },
      "vitals": {
        "title": "הזנת סימנים חיוניים",
        "caseInfo": "פרטי המקרה",
        "caseId": "מספר מקרה",
        "formTitle": "הזן סימנים חיוניים של המטופל",
        "bloodPressure": "לחץ דם",
        "bloodPressurePrompt": "הזן לחץ סיסטולי/דיאסטולי (לדוגמה: 120/80)",
        "bloodPressurePlaceholder": "120/80",
        "pulse": "דופק",
        "pulsePrompt": "הזן קצב לב בפעימות לדקה",
        "pulsePlaceholder": "80",
        "oxygenSaturation": "ריווי חמצן (SpO₂)",
        "oxygenPrompt": "הזן אחוז ריווי חמצן",
        "oxygenPlaceholder": "98",
        "temperature": "טמפרטורה",
        "temperaturePrompt": "הזן טמפרטורת גוף במעלות צלזיוס",
        "temperaturePlaceholder": "36.7",
        "painScale": "סולם כאב (1–10)",
        "painPrompt": "דרג את רמת הכאב של המטופל מ-1 (ללא כאב) עד 10 (כאב חמור)",
        "painPlaceholder": "3",
        "submit": "שלח סימנים חיוניים",
        "submitting": "שולח...",
        "back": "חזור",
        "errors": {
          "bloodPressureRequired": "נדרש לחץ דם",
          "bloodPressureFormat": "פורמט: 120/80",
          "bloodPressureRange": "סיסטולי: 70-250, דיאסטולי: 40-150",
          "pulseRequired": "נדרש דופק",
          "pulseRange": "דופק חייב להיות בין 30-200 פעימות לדקה",
          "oxygenRequired": "נדרש ריווי חמצן",
          "oxygenRange": "ריווי חמצן חייב להיות בין 50-100%",
          "temperatureRequired": "נדרשת טמפרטורה",
          "temperatureRange": "טמפרטורה חייבת להיות בין 30-45°C",
          "painRequired": "נדרש סולם כאב",
          "painRange": "סולם כאב חייב להיות בין 1-10",
          "submitFailed": "שליחת הסימנים החיוניים נכשלה. נא לנסות שוב.",
          "submitError": "שגיאה בשליחת הסימנים החיוניים. נא לבדוק את החיבור.",
          "timeout": "תם הזמן הקצוב לבקשה. אנא בדוק את החיבור ונסה שוב."
        }
      },
      "case": {
        "title": "ניהול מקרה",
        "detailsTab": "פרטי מטופל",
        "id": "ת.ז",
        "age": "גיל",
        "status": "סטטוס",
        "loading": "טוען מקרה...",
        "error": "שגיאה בטעינת מקרה",
        "backToDashboard": "חזור ללוח הבקרה",
        "backToList": "חזור לרשימה",
        "statusLabel": {
          "open": "פתוח",
          "in_progress": "בטיפול",
          "tests_ordered": "בדיקות הוזמנו",
          "closed": "סגור",
          "cancelled": "בוטל"
        },
        "testsOrderedBanner": "הבדיקות הוזמנו.",
        "testsOrderedHint": "בדוק את התוצאות כשיהיו זמינות, לאחר מכן הכן וסיים את דוח השחרור כדי לסגור את המקרה.",
        "closedBanner": "מקרה זה נסגר. דוח השחרור הושלם.",
        "tabs": {
          "summary": "תקציר וסימנים חיוניים",
          "physical": "בדיקה גופנית",
          "diagnosis": "אבחנה ובדיקות",
          "results": "תוצאות",
          "treatment": "טיפול וסיכום"
        },
        "vitals": {
          "title": "סימנים חיוניים",
          "description": "מדידות הסימנים החיוניים שנלקחו.",
          "bloodPressure": "לחץ דם",
          "bloodPressurePlaceholder": "הזן סיסטולי/דיאסטולי (לדוגמה: 120/80)",
          "pulse": "דופק",
          "pulsePlaceholder": "הזן קצב לב (פעימות לדקה)",
          "oxygenSaturation": "סטורציה (SpO2)",
          "temperature": "טמפרטורה",
          "painScale": "סולם כאב (1-10)",
          "save": "שמור סימנים חיוניים",
          "notRecorded": "לא נרשם",
          "respiratoryRate": "קצב נשימה",
          "painScore": "דירוג כאב"
        },
        "personalDetails": {
          "title": "פרטים אישיים",
          "fullName": "שם מלא",
          "id": "מספר תעודת זהות",
          "gender": "מין",
          "age": "גיל",
          "maritalStatus": "מצב משפחתי",
          "cognitiveStatus": "מצב קוגניטיבי",
          "functionalStatus": "מצב תפקודי",
          "notProvided": "לא סופק"
        },
        "medicalHistory": {
          "title": "היסטוריה רפואית",
          "backgroundDiseases": "מחלות רקע",
          "noData": "אין נתוני היסטוריה רפואית זמינים"
        },
        "currentIllness": {
          "title": "מחלה נוכחית - תלונות ופרטים",
          "noData": "אין נתוני מחלה נוכחית זמינים"
        },
        "hideDetails": "הסתר פרטים",
        "showDetails": "הצג פרטים",
        "evidence": "ראיות",
        "urgency": "דחיפות",
        "aiSummary": {
          "title": "תקציר תסמינים ובדיקה שנוצר על ידי AI",
          "description": "סיכום NLP עם תיוג אונטולוגיה רפואית, הדגשת דגלים אדומים וזיהוי מצבים כרוניים",
          "noSummary": "אין תקציר AI זמין עדיין",
          "generate": "צור תקציר AI",
          "error": "יצירת תקציר AI נכשלה. נא לנסות שוב.",
          "timeout": "היצירה אורכת יותר מהצפוי. ייתכן שהתקציר כבר מוכן — הדף יתרענן באופן אוטומטי."
        },
        "aiDiagnosis": {
          "title": "אבחנה דיפרנציאלית והמלצות בדיקות של AI",
          "description": "רשימת אבחנות משוקללת לפי עדויות עם המלצות בדיקות קונטקסטואליות",
          "noDiagnosis": "אין אבחנת AI זמינה עדיין",
          "generate": "צור אבחנה",
          "error": "יצירת אבחנת AI נכשלה. נא לנסות שוב.",
          "timeout": "היצירה אורכת יותר מהצפוי. ייתכן שהאבחנה כבר מוכנה — הדף יתרענן באופן אוטומטי.",
          "ordered": "הבדיקות עבור {{name}} הוזמנו.",
          "orderError": "הזמנת הבדיקות נכשלה.",
          "differentialDiagnoses": "אבחנות דיפרנציאליות",
          "testRecommendations": "המלצות בדיקות",
          "orderTests": "הזמן בדיקות נבחרות",
          "orderingTests": "מזמין בדיקות: {{tests}}",
          "interactiveDiagnoses": "סקירת אבחנה אינטראקטיבית",
          "interactiveDescription": "סקור ובחר בדיקות בהתבסס על ניתוח ה-AI לעיל",
          "recommendedTests": "בדיקות מומלצות",
          "otherTest": "אחר (ציין)",
          "otherTestPlaceholder": "הזן שם הבדיקה או תיאור...",
          "clickToExpand": "לחץ על \"הצג פרטים\" למעלה כדי לראות את אבחנת ה-AI",
          "caseClosed": "המקרה נסגר. הזמנת בדיקות חסומה.",
          "testsOrdered": "הבדיקות הוזמנו. ניתן לעדכן את הבחירה לפני סיום דוח השחרור.",
          "diagnoses": {
            "acuteMi": "אוטם שריר הלב החריף",
            "unstableAngina": "תעוקת חזה לא יציבה",
            "gerd": "מחלת ריפלוקס קיבה-ושט",
            "musculoskeletalPain": "כאב חזה שריר-שלדי"
          },
          "tests": {
            "ecg": "אלקטרוקרדיוגרם (ECG)",
            "troponin": "טרופונין לבבי",
            "ckmb": "CK-MB",
            "chestXray": "צילום חזה",
            "echo": "אקוקרדיוגרם",
            "stressTest": "בדיקת מאמץ",
            "endoscopy": "אנדוסקופיה עליונה",
            "phMonitor": "ניטור חומציות",
            "muscleTest": "בדיקת תפקוד שרירים"
          },
          "evidence": {
            "chestPain": "כאבים בחזה",
            "elevatedTroponin": "טרופונין מוגבר",
            "ecgChanges": "שינויים ב-ECG",
            "riskFactors": "גורמי סיכון",
            "heartburn": "צרבת",
            "noEcgChanges": "אין שינויים ב-ECG",
            "muscleTenderness": "רגישות שרירים",
            "noCardiacMarkers": "אין סמנים לבביים"
          },
          "testDescriptions": {
            "ecg": "הערכת קצב הלב וזיהוי איסכמיה",
            "troponin": "זיהוי פגיעה בשריר הלב",
            "ckmb": "קריאטין קינאז לבבי",
            "chestXray": "הערכת שדות הריאות ומבנה הלב",
            "echo": "הערכת תפקוד הלב ותנועת הדופן",
            "stressTest": "הערכת תפקוד הלב במאמץ",
            "endoscopy": "הערכת מצב הוושט והקיבה",
            "phMonitor": "ניטור דפוסי ריפלוקס חומצי",
            "muscleTest": "הערכת תפקוד שריר-שלד"
          },
          "interactiveUnavailable": "הסקירה האינטראקטיבית דורשת רשימות אבחנה ובדיקות הניתנות לזיהוי בפלט ה-AI."
        }
      },
      "discharge": {
        "title": "דוח שחרור",
        "proceedButton": "המשך לדוח שחרור",
        "prepareReport": "הכן דוח שחרור",
        "viewReport": "צפה בדוח השחרור",
        "loading": "טוען...",
        "finalized": "הושלם",
        "finalizedOn": "הושלם ב",
        "aiActions": "כלי AI לדוח",
        "aiActionsHint": "שפר או קצר את הדוח הקיים. עריכותיך נשמרות.",
        "aiActionsHintEmpty": "צור דוח על בסיס כל נתוני המקרה הזמינים.",
        "generateFull": "צור דוח מלא",
        "improveLanguage": "שפר שפה רפואית",
        "shortenReport": "קצר את הדוח",
        "regenerate": "צור מחדש מהתחלה",
        "regenerateWarning": "פעולה זו תחליף את הדוח הנוכחי.",
        "confirmRegenerate": "כן, צור מחדש",
        "generating": "יוצר...",
        "aiGenerating": "מייצר רשומת שחרור מובנית...",
        "aiGeneratingHint": "הפעולה עשויה לקחת עד 30 שניות — אנא השאר דף זה פתוח.",
        "generationTimeout": "היצירה לוקחת יותר זמן מהצפוי. הדוח עשוי כבר להיות מוכן — הדף יתרענן אוטומטית.",
        "aiImproving": "משפר את השפה הרפואית...",
        "aiShortening": "יוצר גרסה קצרה...",
        "reportCardTitle": "דוח שחרור",
        "reportContent": "תוכן הדוח",
        "edit": "ערוך",
        "cancelEdit": "ביטול",
        "saveChanges": "שמור שינויים",
        "saving": "שומר...",
        "saved": "נשמר",
        "legend": "מקרא",
        "structuredReport": "רשומת שחרור מובנית",
        "legendDemo": "פרטים דמוגרפיים",
        "legendValues": "ערכים קליניים",
        "legendRecs": "המלצות",
        "legendTreatment": "טיפול",
        "legendDx": "אבחנות",
        "noReport": "טרם נוצר דוח.",
        "noReportHint": "לחץ על \"צור דוח מלא\" למעלה ליצירת דוח.",
        "returnToCase": "חזור למקרה",
        "print": "הדפס / ייצא PDF",
        "finalizeDischarge": "סיים שחרור",
        "confirmFinalize": "פעולה זו תסגור את המקרה. לאשר?",
        "confirmYes": "כן, סיים",
        "cancel": "ביטול",
        "finalizing": "מסיים...",
        "loadErrorTitle": "טעינת המקרה נכשלה",
        "loadErrorDescription": "לא הצלחנו לטעון את דוח השחרור. בדוק את החיבור ונסה שוב.",
        "printTitle": "סיכום שחרור ממלר\"ד",
        "patient": "מטופל",
        "idLabel": "ת.ז.",
        "dateLabel": "תאריך"
      },
      "nurseLogin": {
        "title": "כניסת אחות",
        "subtitle": "הזן קוד גישה כדי להמשיך.",
        "passcodePlaceholder": "קוד גישה",
        "continue": "המשך",
        "invalidCode": "קוד גישה לא תקין."
      },
      "nurseDashboard": {
        "title": "לוח טריאז'",
        "subtitle": "מטופלים הממתינים לרישום מדדי חיים",
        "loading": "טוען את תור הטריאז'...",
        "error": "טעינת המקרים נכשלה.",
        "unknownPatient": "מטופל לא ידוע",
        "minutes": "{{n}} דק׳",
        "handedOff": "הועבר לרופא",
        "tabs": {
          "awaiting": "ממתינים למדדים",
          "done": "נשלחו לרופא"
        },
        "search": {
          "placeholder": "חיפוש לפי שם או ת.ז..."
        },
        "table": {
          "patient": "מטופל",
          "id": "ת.ז.",
          "arrived": "הגיע ב",
          "waiting": "המתנה",
          "actions": "פעולה"
        },
        "actions": {
          "recordVitals": "רשום מדדים",
          "updateVitals": "עדכן מדדים",
          "logout": "התנתק"
        },
        "empty": {
          "title": "אין מטופלים בתור",
          "noMatch": "אין מקרים התואמים את החיפוש.",
          "noAwaiting": "הכל מעודכן — אין כרגע מטופלים הממתינים לטריאז'.",
          "noDone": "טרם הועברו מקרים לרופא."
        }
      },
      "doctorLogin": {
        "title": "כניסת רופא",
        "subtitle": "הזן קוד גישה כדי להמשיך.",
        "passcodePlaceholder": "קוד גישה",
        "continue": "המשך",
        "invalidCode": "קוד גישה לא תקין."
      }
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Hebrew is the primary language. We only fall back to English when a
    // specific key is missing from the Hebrew bundle.
    fallbackLng: 'he',
    // Skip navigator/browser sniffing — most clients speak Hebrew and we want
    // a deterministic default. Users can still switch via the language toggle,
    // which persists to localStorage.
    debug: false,

    detection: {
      order: ['localStorage', 'htmlTag'],
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },
  })

export default i18n
