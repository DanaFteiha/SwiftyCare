import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Translation resources
const resources = {
  en: {
    translation: {
      // ScanPage translations
      welcome: {
        title: "Welcome to SwiftyCare",
        description: "Please enter your details to begin the medical registration process"
      },
      form: {
        title: "Patient Information",
        description: "Please fill in your details below",
        hospital: "Hospital",
        hospitalRequired: "Hospital name is required",
        hospitalMinLength: "Hospital name must contain at least 2 characters",
        hospitalPlaceholder: "Select Hospital",
        fullName: "Full Name",
        fullNameRequired: "Full name is required",
        fullNameMinLength: "Full name must contain at least 2 characters",
        fullNameMaxLength: "Full name cannot exceed 100 characters",
        fullNameInvalid: "Full name can only contain Hebrew, English letters, spaces, hyphens and apostrophes",
        fullNamePlaceholder: "Enter full name",
        nationalId: "National ID",
        nationalIdRequired: "National ID is required",
        nationalIdMinLength: "National ID must contain at least 5 digits",
        nationalIdMaxLength: "National ID cannot exceed 20 digits",
        nationalIdInvalid: "National ID can only contain digits",
        nationalIdPlaceholder: "Enter National ID",
        submitButton: "Start Questionnaire",
        submitButtonLoading: "Creating case...",
        formReady: "Form ready to submit",
        submitError: "Error creating case. Please try again.",
        networkError: "Network error. Please try again."
      },
      hospitals: {
        hadassahEinKerem: "Hadassah Ein Kerem Hospital",
        hadassahMountScopus: "Hadassah Mount Scopus Hospital",
        ichilov: "Ichilov Hospital (Tel Aviv)",
        sheba: "Sheba Hospital (Tel Hashomer)",
        rambam: "Rambam Hospital (Haifa)",
        soroka: "Soroka Hospital (Beer Sheva)",
        kaplan: "Kaplan Hospital (Rehovot)",
        assafHarofeh: "Assaf Harofeh Hospital (Tzrifin)",
        shaareZedek: "Shaare Zedek Hospital (Jerusalem)",
        billinson: "Billinson Hospital (Petah Tikva)",
        meir: "Meir Hospital (Kfar Saba)",
        hillelYaffe: "Hillel Yaffe Hospital (Hadera)",
        nahariya: "Nahariya Hospital",
        poria: "Poria Hospital (Tiberias)",
        ziv: "Ziv Hospital (Safed)",
        barzilai: "Barzilai Hospital (Ashkelon)",
        yoseftal: "Yoseftal Hospital (Eilat)",
        laniado: "Laniado Hospital (Netanya)",
        assuta: "Assuta Hospital (Tel Aviv)",
        herzliyaMedical: "Herzliya Medical Center"
      },
      footer: {
        copyright: "© Swifty Medical 2025. All rights reserved."
      },
      language: {
        toggle: "עִבְרִית"
      },
      
      // QuestionnairePage translations
      questionnaire: {
        title: "Medical Questionnaire",
        subtitle: "Please answer the following questions",
        greeting: "Hello {{name}}, please fill in the following details.",
        step1: "Personal Details & Medical History",
        step2: "Current Symptoms",
        personalInfo: {
          title: "Personal Details",
          age: "Age",
          agePlaceholder: "Enter age",
          gender: "Gender",
          male: "Male",
          female: "Female",
          maritalStatus: "Marital Status",
          married: "Married",
          single: "Single",
          divorced: "Divorced",
          widowed: "Widowed",
          cognitiveState: "Cognitive State",
          conscious: "Conscious",
          confused: "Confused",
          unconscious: "Unconscious",
          functionalState: "Functional State",
          independent: "Independent",
          dependent: "Dependent",
          selectGender: "Select gender",
          selectMaritalStatus: "Select marital status",
          selectCognitiveState: "Select cognitive state",
          selectFunctionalState: "Select functional state"
        },
        medicalHistory: {
          title: "Medical History",
          none: "None",
          diabetes: "Diabetes",
          hypertension: "High Blood Pressure",
          dyslipidemia: "Dyslipidemia",
          asthma: "Asthma",
          ischemicHeartDisease: "Ischemic Heart Disease",
          cancer: "Cancer",
          previousStroke: "Previous Stroke",
          hypothyroidism: "Hypothyroidism",
          copd: "COPD",
          otherDiseases: "Other Underlying Diseases",
          otherDiseasesPlaceholder: "Please specify",
          previousSurgeries: "Previous Surgeries"
        },
        currentIllness: {
          title: "Current Illness",
          instruction: "Please select all relevant symptoms.",
          chestPain: "Chest pain",
          fever: "Fever",
          injuryTrauma: "Injury / Trauma",
          swellingEdema: "Swelling / Edema",
          abdominalPain: "Abdominal pain",
          shortnessOfBreath: "Shortness of breath",
          changeInConsciousness: "Change in consciousness / Fainting",
          nauseaVomitingDiarrhea: "Nausea / Vomiting / Diarrhea",
          headache: "Headache",
          chestPainSternum: "Chest pain (sternum area)",
          dizziness: "Dizziness",
          neckPain: "Neck pain",
          fatigueWeakness: "Fatigue / General weakness / Neurological",
          jointPain: "Joint pain",
          painInLimbs: "Pain in limbs",
          earPain: "Ear pain",
          eyeProblems: "Eye problems",
          backPain: "Back pain",
          headInjury: "Head injury",
          injectionSitePain: "Pain at the injection/blood draw site"
        },
        adaptive: {
          selectChiefComplaint: "Select Chief Complaint",
          detailsFor: "Details for",
          addDetail: "Add detail",
          hideDetail: "Hide detail",
          detailPlaceholder: "Please provide additional details...",
          selectOption: "Select an option",
          additionalDetails: "Additional Details",
          additionalDetailsPlaceholder: "Please provide any additional information",
          redFlagAlert: "⚠️ Red Flag Alert",
          redFlagMessage: "Critical symptoms detected. Immediate medical attention may be required.",
          noSymptomsSelected: "No symptoms selected",
          goBackToStep1: "Please go back to Step 1 and select your symptoms",
          selectedSymptoms: "Selected Symptoms",
          pathways: {
            chestPain: "Chest Pain",
            chestPainDescription: "Pain or discomfort in the chest area",
            fever: "Fever",
            feverDescription: "Elevated body temperature"
          },
          painCharacteristics: {
            label: "Pain Characteristics",
            pressing: "Pressing",
            burning: "Burning",
            sharp: "Sharp",
            radiating: "Radiating"
          },
          location: {
            label: "Location",
            center: "Center",
            leftSide: "Left Side",
            behindBreastbone: "Behind Breastbone"
          },
          onset: {
            label: "Onset",
            sudden: "Sudden",
            gradual: "Gradual",
            intermittent: "Intermittent"
          },
          duration: {
            label: "Duration",
            lessThan30min: "Less than 30 minutes",
            min30To2hours: "30 minutes to 2 hours",
            moreThan2hours: "More than 2 hours",
            everyHalfHour: "Every half hour"
          },
          radiationDetails: {
            label: "Radiation Details",
            placeholder: "Where does the pain radiate to?"
          },
          cardiacQuestions: {
            label: "Associated Symptoms",
            shortnessOfBreath: "Shortness of Breath",
            nausea: "Nausea",
            sweating: "Sweating",
            dizziness: "Dizziness"
          },
          respiratoryQuestions: {
            label: "Breathing Difficulty",
            mild: "Mild",
            moderate: "Moderate",
            severe: "Severe"
          },
          acuteQuestions: {
            label: "Acute Symptoms",
            severePain: "Severe Pain (8-10/10)",
            lossOfConsciousness: "Loss of Consciousness",
            acuteDistress: "Acute Distress"
          },
          frequencyQuestions: {
            label: "Frequency Details",
            placeholder: "Describe the frequency pattern"
          },
          associatedSymptoms: {
            label: "Associated Symptoms",
            headache: "Headache",
            bodyAches: "Body Aches",
            chills: "Chills",
            fatigue: "Fatigue"
          },
          headacheQuestions: {
            label: "Headache Severity",
            mild: "Mild",
            moderate: "Moderate",
            severe: "Severe"
          },
          highFeverQuestions: {
            label: "High Fever Symptoms",
            alteredMentalStatus: "Altered Mental Status",
            neckStiffness: "Neck Stiffness",
            rash: "Rash"
          },
          chronicFeverQuestions: {
            label: "Chronic Fever Details",
            placeholder: "Describe any additional symptoms"
          },
          rashQuestions: {
            label: "Rash Description",
            placeholder: "Describe the rash appearance and location"
          },
          temperature: {
            label: "Temperature Range",
            lowGrade: "Low Grade (37.1-38.0°C)",
            moderate: "Moderate (38.1-39.0°C)",
            high: "High (39.1-40.0°C)",
            veryHigh: "Very High (>40.0°C)"
          }
        },
        medications: {
          allergies: {
            title: "Medication Allergies",
            question: "Are there any drug allergies?",
            yes: "Yes",
            no: "No",
            detailsPlaceholder: "Please specify the allergies"
          },
          groups: {
            title: "Medication Groups",
            bloodPressure: "Blood Pressure",
            diabetes: "Diabetes",
            bloodThinners: "Blood Thinners",
            immunosuppressants: "Immunosuppressants",
            miscellaneous: "Miscellaneous"
          }
        },
        symptoms: {
          chiefComplaint: "Chief Complaint",
          symptomDuration: "How long have you had these symptoms?",
          severity: "Severity (1-10)",
          additionalSymptoms: "Additional Symptoms"
        },
        vitals: {
          bloodPressure: "Blood Pressure",
          heartRate: "Heart Rate",
          temperature: "Temperature",
          oxygenSaturation: "Oxygen Saturation"
        },
        navigation: {
          next: "Next",
          previous: "Previous",
          finish: "Finish",
          loading: "Saving..."
        },
        errors: {
          required: "This field is required",
          invalidFormat: "Invalid format",
          saveError: "Error saving questionnaire. Please try again.",
          ageRequired: "Age is required",
          ageInvalid: "Age must be a valid number",
          ageRange: "Age must be between 0 and 120",
          genderRequired: "Gender is required",
          maritalStatusRequired: "Marital status is required",
          cognitiveStateRequired: "Cognitive state is required",
          functionalStateRequired: "Functional state is required",
          medicalHistoryRequired: "Please select at least one medical history option"
        }
      },
      
      // DashboardPage translations
      dashboard: {
        title: "Physician Dashboard",
        subtitle: "Manage patient cases",
        stats: {
          totalCases: "Total Cases",
          openCases: "Open Cases",
          inProgress: "In Progress",
          closed: "Closed"
        },
        filters: {
          all: "All Cases",
          open: "Open",
          inProgress: "In Progress",
          closed: "Closed",
          cancelled: "Cancelled"
        },
        actions: {
          viewCase: "View Case",
          generateSummary: "Generate AI Summary",
          loading: "Loading...",
          newCase: "New Case"
        },
        noCases: "No cases found",
        loading: "Loading cases..."
      },
      
      // CasePage translations
      case: {
        title: "Case Details",
        tabs: {
          overview: "Overview",
          questionnaire: "Questionnaire",
          vitals: "Vital Signs",
          summary: "AI Summary"
        },
        overview: {
          patientName: "Patient Name",
          nationalId: "National ID",
          status: "Status",
          createdAt: "Created At",
          updatedAt: "Updated At"
        },
        questionnaire: {
          title: "Questionnaire Responses",
          noData: "No questionnaire data available"
        },
        vitals: {
          title: "Vital Signs",
          noData: "No vital signs recorded",
          bloodPressure: "Blood Pressure",
          heartRate: "Heart Rate",
          temperature: "Temperature",
          oxygenSaturation: "Oxygen Saturation",
          respiratoryRate: "Respiratory Rate",
          painScore: "Pain Score"
        },
        summary: {
          title: "AI Medical Summary",
          generate: "Generate Summary",
          generating: "Generating...",
          noSummary: "No summary available",
          error: "Error generating summary"
        },
        actions: {
          backToDashboard: "Back to Dashboard",
          loading: "Loading..."
        }
      },
      
      // Common translations
      common: {
        loading: "Loading...",
        error: "Error",
        success: "Success",
        cancel: "Cancel",
        save: "Save",
        edit: "Edit",
        delete: "Delete",
        confirm: "Confirm",
        back: "Back",
        next: "Next",
        previous: "Previous",
        finish: "Finish",
        close: "Close",
        retry: "Retry",
        step: "Step",
        of: "of",
        evidence: "Evidence",
        urgency: "Urgency",
        high: "high",
        medium: "medium",
        low: "low"
      },
      // AI Diagnosis translations
      aiDiagnosis: {
        diagnoses: {
          acuteMi: "Acute Myocardial Infarction",
          unstableAngina: "Unstable Angina",
          gerd: "Gastroesophageal Reflux Disease",
          musculoskeletalPain: "Musculoskeletal Pain"
        },
        evidence: {
          chestPain: "Chest Pain",
          elevatedTroponin: "Elevated Troponin",
          ecgChanges: "ECG Changes",
          riskFactors: "Risk Factors",
          heartburn: "Heartburn",
          noEcgChanges: "No ECG Changes",
          muscleTenderness: "Muscle Tenderness",
          noCardiacMarkers: "No Cardiac Markers"
        },
        tests: {
          ecg: "ECG",
          troponin: "Troponin",
          ckmb: "CK-MB",
          chestXray: "Chest X-ray",
          echo: "Echocardiogram",
          stressTest: "Stress Test",
          endoscopy: "Endoscopy",
          phMonitor: "pH Monitor",
          muscleTest: "Muscle Function Test"
        },
        testDescriptions: {
          ecg: "Electrocardiogram to assess heart rhythm and electrical activity",
          troponin: "Blood test to detect heart muscle damage",
          ckmb: "Creatine kinase-MB enzyme test for heart damage",
          chestXray: "X-ray imaging of the chest to check for lung/heart issues",
          echo: "Ultrasound of the heart to assess function and structure",
          stressTest: "Exercise test to evaluate heart function under stress",
          endoscopy: "Visual examination of the esophagus and stomach",
          phMonitor: "24-hour monitoring of stomach acid levels",
          muscleTest: "Assessment of muscle strength and function"
        }
      }
    },
    vitals: {
      title: "Vital Signs Entry",
      caseInfo: "Case Information",
      caseId: "Case ID",
      formTitle: "Enter Patient Vital Signs",
      bloodPressure: "Blood Pressure",
      bloodPressurePrompt: "Enter systolic/diastolic pressure (e.g., 120/80)",
      bloodPressurePlaceholder: "120/80",
      pulse: "Pulse",
      pulsePrompt: "Enter heart rate in beats per minute",
      pulsePlaceholder: "80",
      oxygenSaturation: "Oxygen Saturation (SpO₂)",
      oxygenPrompt: "Enter oxygen saturation percentage",
      oxygenPlaceholder: "98",
      temperature: "Temperature",
      temperaturePrompt: "Enter body temperature in Celsius",
      temperaturePlaceholder: "36.7",
      painScale: "Pain Scale (1–10)",
      painPrompt: "Rate patient's pain level from 1 (no pain) to 10 (severe pain)",
      painPlaceholder: "3",
      submit: "Submit Vitals",
      submitting: "Submitting...",
      back: "Back",
      errors: {
        bloodPressureRequired: "Blood pressure is required",
        bloodPressureFormat: "Format: 120/80",
        bloodPressureRange: "Systolic: 70-250, Diastolic: 40-150",
        pulseRequired: "Pulse is required",
        pulseRange: "Pulse must be between 30-200 bpm",
        oxygenRequired: "Oxygen saturation is required",
        oxygenRange: "Oxygen saturation must be between 50-100%",
        temperatureRequired: "Temperature is required",
        temperatureRange: "Temperature must be between 30-45°C",
        painRequired: "Pain scale is required",
        painRange: "Pain scale must be between 1-10",
        submitFailed: "Failed to submit vitals. Please try again.",
        submitError: "Error submitting vitals. Please check your connection."
      }
    },
    dashboard: {
      title: "Doctor's Dashboard",
      subtitle: "Search and manage medical cases",
      loading: "Loading cases...",
      error: "Error loading cases",
      retry: "Retry",
      search: {
        placeholder: "Search by patient name or ID..."
      },
      filters: {
        all: "All Cases",
        pendingDoctorReview: "Waiting for doctor's review",
        inReview: "In Review",
        completed: "Completed",
        cancelled: "Cancelled"
      },
      status: {
        pendingDoctorReview: "Waiting for doctor's review",
        inReview: "In Review",
        completed: "Completed",
        cancelled: "Cancelled"
      },
      table: {
        patientName: "Patient Name",
        id: "ID",
        status: "Status",
        receptionDate: "Reception Date",
        actions: "Actions"
      },
      actions: {
        newCase: "New Case",
        openFile: "Open File"
      },
      empty: {
        title: "No cases found",
        description: "No cases match your current search criteria."
      }
    },
    case: {
      title: "Case Management",
      id: "ID",
      age: "Age",
      status: "Status",
      loading: "Loading case...",
      error: "Error loading case",
      backToDashboard: "Back to Dashboard",
      backToList: "Back to list",
      tabs: {
        summary: "Summary and Vital Signs",
        physical: "Physical Examination",
        diagnosis: "Diagnosis and Tests",
        results: "Results",
        treatment: "Treatment and Summary"
      },
      vitals: {
        title: "Vital Signs",
        description: "Vital signs measurements taken.",
        bloodPressure: "Blood Pressure",
        bloodPressurePlaceholder: "Enter systolic/diastolic (e.g., 120/80)",
        pulse: "Pulse",
        pulsePlaceholder: "Enter heart rate (bpm)",
        oxygenSaturation: "Saturation (SpO2)",
        temperature: "Temperature",
        painScale: "Pain Scale (1-10)",
        save: "Save Vital Signs",
        notRecorded: "Not recorded"
      },
      personalDetails: {
        title: "Personal Details",
        fullName: "Full Name",
        id: "ID No.",
        gender: "Gender",
        age: "Age",
        maritalStatus: "Marital Status",
        cognitiveStatus: "Cognitive Status",
        functionalStatus: "Functional Status",
        notProvided: "Not provided"
      },
      medicalHistory: {
        title: "Medical History",
        backgroundDiseases: "Background Diseases",
        noData: "No medical history data available"
      },
      currentIllness: {
        title: "Current Illness - Complaints and Details",
        noData: "No current illness data available"
      },
      hideDetails: "Hide Details",
      showDetails: "Show Details",
      evidence: "Evidence",
      urgency: "Urgency",
      aiSummary: {
        title: "AI-Generated Symptom & Exam Summary",
        description: "NLP summarization with medical-ontology tagging, red-flag highlighting, and chronic-condition identification",
        noSummary: "No AI summary available yet",
        generate: "Generate AI Summary",
        error: "Failed to generate AI summary. Please try again."
      },
      aiDiagnosis: {
        title: "AI Differential-Diagnosis & Test Recommendations",
        description: "Evidence-weighted diagnosis list with contextual test recommendations",
        noDiagnosis: "No AI diagnosis available yet",
        generate: "Generate Diagnosis",
        error: "Failed to generate AI diagnosis. Please try again.",
        differentialDiagnoses: "Differential Diagnoses",
        testRecommendations: "Test Recommendations",
        orderTests: "Order Selected Tests",
        orderingTests: "Ordering tests: {{tests}}",
        interactiveDiagnoses: "Interactive Diagnosis Review",
        interactiveDescription: "Review and select tests based on the AI analysis above",
        recommendedTests: "Recommended Tests",
        clickToExpand: "Click \"Show Details\" above to view AI diagnosis",
        diagnoses: {
          acuteMi: "Acute Myocardial Infarction",
          unstableAngina: "Unstable Angina",
          gerd: "Gastroesophageal Reflux Disease",
          musculoskeletalPain: "Musculoskeletal Chest Pain"
        },
        tests: {
          ecg: "Electrocardiogram (ECG)",
          troponin: "Cardiac Troponin",
          ckmb: "CK-MB",
          chestXray: "Chest X-Ray",
          echo: "Echocardiogram",
          stressTest: "Stress Test",
          endoscopy: "Upper Endoscopy",
          phMonitor: "pH Monitoring",
          muscleTest: "Muscle Function Test"
        },
        evidence: {
          chestPain: "Chest pain",
          elevatedTroponin: "Elevated troponin",
          ecgChanges: "ECG changes",
          riskFactors: "Risk factors",
          heartburn: "Heartburn",
          noEcgChanges: "No ECG changes",
          muscleTenderness: "Muscle tenderness",
          noCardiacMarkers: "No cardiac markers"
        },
        testDescriptions: {
          ecg: "Assess cardiac rhythm and detect ischemia",
          troponin: "Detect myocardial injury",
          ckmb: "Creatine kinase myocardial band",
          chestXray: "Evaluate lung fields and cardiac silhouette",
          echo: "Assess cardiac function and wall motion",
          stressTest: "Evaluate cardiac function under stress",
          endoscopy: "Evaluate esophageal and gastric conditions",
          phMonitor: "Monitor acid reflux patterns",
          muscleTest: "Evaluate musculoskeletal function"
        }
      }
    }
  },
  he: {
    translation: {
      // ScanPage translations
      welcome: {
        title: "ברוכים הבאים ל-SwiftyCare",
        description: "נא הזן את פרטיך כדי להתחיל בתהליך הרישום הרפואי"
      },
      form: {
        title: "פרטי המטופל",
        description: "נא למלא את הפרטים שלך למטה",
        hospital: "בית חולים",
        hospitalRequired: "שם בית החולים נדרש",
        hospitalMinLength: "שם בית החולים חייב להכיל לפחות 2 תווים",
        hospitalPlaceholder: "בחר בית חולים",
        fullName: "שם מלא",
        fullNameRequired: "שם מלא נדרש",
        fullNameMinLength: "שם מלא חייב להכיל לפחות 2 תווים",
        fullNameMaxLength: "שם מלא לא יכול להכיל יותר מ-100 תווים",
        fullNameInvalid: "שם מלא יכול להכיל רק אותיות עבריות, אנגליות, רווחים, מקפים ואפוסטרופים",
        fullNamePlaceholder: "הזן שם מלא",
        nationalId: "מספר תעודת זהות",
        nationalIdRequired: "מספר תעודת זהות נדרש",
        nationalIdMinLength: "מספר תעודת זהות חייב להכיל לפחות 5 ספרות",
        nationalIdMaxLength: "מספר תעודת זהות לא יכול להכיל יותר מ-20 ספרות",
        nationalIdInvalid: "מספר תעודת זהות יכול להכיל רק ספרות",
        nationalIdPlaceholder: "הזן מספר תעודת זהות",
        submitButton: "התחל שאלון",
        submitButtonLoading: "יוצר מקרה...",
        formReady: "הטופס מוכן לשליחה",
        submitError: "שגיאה ביצירת המקרה. נסה שוב.",
        duplicateCaseError: "נראה שהמקרה הזה כבר קיים. אנא ודא את הפרטים שלך או פנה לתמיכה.",
        networkError: "שגיאת רשת. נסה שוב."
      },
      hospitals: {
        hadassahEinKerem: "בית החולים הדסה עין כרם",
        hadassahMountScopus: "בית החולים הדסה הר הצופים",
        ichilov: "בית החולים איכילוב (תל אביב)",
        sheba: "בית החולים שיבא (תל השומר)",
        rambam: "בית החולים רמב\"ם (חיפה)",
        soroka: "בית החולים סורוקה (באר שבע)",
        kaplan: "בית החולים קפלן (רחובות)",
        assafHarofeh: "בית החולים אסף הרופא (צריפין)",
        shaareZedek: "בית החולים שערי צדק (ירושלים)",
        billinson: "בית החולים בילינסון (פתח תקווה)",
        meir: "בית החולים מאיר (כפר סבא)",
        hillelYaffe: "בית החולים הלל יפה (חדרה)",
        nahariya: "בית החולים נהריה",
        poria: "בית החולים פוריה (טבריה)",
        ziv: "בית החולים זיו (צפת)",
        barzilai: "בית החולים ברזילי (אשקלון)",
        yoseftal: "בית החולים יוספטל (אילת)",
        laniado: "בית החולים לניאדו (נתניה)",
        assuta: "בית החולים אסותא (תל אביב)",
        herzliyaMedical: "בית החולים הרצליה מדיקל סנטר"
      },
      footer: {
        copyright: "© Swifty Medical 2025. כל הזכויות שמורות."
      },
      language: {
        toggle: "EN"
      },
      
      // QuestionnairePage translations
      questionnaire: {
        title: "שאלון רפואי",
        subtitle: "נא ענה על השאלות הבאות",
        greeting: "שלום {{name}}, אנא מלא את הפרטים הבאים.",
        confirmationTitle: "תודה",
        confirmationMessage: "תודה שמילאת את פרטיך. רופא יבדוק את המקרה שלך בקרוב.",
        step1: "פרטים אישיים והיסטוריה רפואית",
        step2: "תסמינים נוכחיים",
        personalInfo: {
          title: "פרטים אישיים",
          age: "גיל",
          agePlaceholder: "הזן גיל",
          gender: "מין",
          selectGender: "בחר מין",
          male: "זכר",
          female: "נקבה",
          maritalStatus: "מצב משפחתי",
          selectMaritalStatus: "בחר מצב משפחתי",
          married: "נשוי/ה",
          single: "רווק/ה",
          divorced: "גרוש/ה",
          widowed: "אלמן/ה",
          cognitiveState: "מצב קוגניטיבי",
          selectCognitiveState: "בחר מצב קוגניטיבי",
          conscious: "צלול",
          confused: "מבולבל",
          unconscious: "לא בהכרה",
          functionalState: "מצב תפקודי",
          selectFunctionalState: "בחר מצב תפקודי",
          independent: "עצמאי",
          dependent: "תלוי"
        },
        medicalHistory: {
          title: "היסטוריה רפואית",
          none: "אין",
          diabetes: "סכרת",
          hypertension: "יתר לחץ דם",
          dyslipidemia: "דיסליפידמיה",
          asthma: "אסטמה",
          ischemicHeartDisease: "מחלת לב איסכמית",
          cancer: "סרטן",
          previousStroke: "שבץ מוחי בעבר",
          hypothyroidism: "תת פעילות של בלוטת התריס",
          copd: "COPD",
          otherDiseases: "מחלות רקע נוספות",
          otherDiseasesPlaceholder: "נא לציין",
          previousSurgeries: "ניתוחים בעבר"
        },
        currentIllness: {
          title: "מחלה נוכחית",
          instruction: "אנא בחר את כל התלונות הרלוונטיות",
          chestPain: "כאבים בחזה",
          fever: "חום",
          injuryTrauma: "פציעות / טראומה",
          swellingEdema: "נפיחויות / גוש",
          abdominalPain: "כאבי בטן",
          shortnessOfBreath: "קוצר נשימה",
          changeInConsciousness: "שינויים במצב הכרה / עילפון",
          nauseaVomitingDiarrhea: "הקאות / שלשולים",
          headache: "כאב ראש",
          chestPainSternum: "כאב חזה (אזור הסטרנום)",
          dizziness: "סחרחורת",
          neckPain: "כאב גרון",
          fatigueWeakness: "חולשה כללית / נוירולוגית",
          jointPain: "כאב במפרקים",
          painInLimbs: "נפיחות בגפיים",
          earPain: "כאב אוזן",
          eyeProblems: "בעיות בעיניים",
          backPain: "כאבי גב",
          headInjury: "חבלת ראש",
          injectionSitePain: "תפיחות/צריבה/דם בשתן"
        },
        adaptive: {
          selectChiefComplaint: "בחר תלונה עיקרית",
          detailsFor: "פירוט עבור",
          addDetail: "הוסף פירוט",
          hideDetail: "הסתר פירוט",
          detailPlaceholder: "נא לספק פרטים נוספים...",
          selectOption: "בחר אפשרות",
          additionalDetails: "פרטים נוספים",
          additionalDetailsPlaceholder: "נא לספק מידע נוסף",
          redFlagAlert: "⚠️ התראת דגל אדום",
          redFlagMessage: "זוהו תסמינים קריטיים. ייתכן שנדרש טיפול רפואי מיידי.",
          noSymptomsSelected: "לא נבחרו תסמינים",
          goBackToStep1: "נא לחזור לשלב 1 ולבחור את התסמינים שלך",
          selectedSymptoms: "תסמינים נבחרים",
          pathways: {
            chestPain: "כאבים בחזה",
            chestPainDescription: "כאב או אי נוחות באזור החזה",
            fever: "חום",
            feverDescription: "טמפרטורת גוף מוגברת"
          },
          painCharacteristics: {
            label: "מאפייני הכאב",
            pressing: "לוחץ",
            burning: "שורף",
            sharp: "דוקר",
            radiating: "מקרין"
          },
          location: {
            label: "מיקום",
            center: "אמצע",
            leftSide: "צד שמאל",
            behindBreastbone: "מאחורי עצם החזה"
          },
          onset: {
            label: "התחלה",
            sudden: "פתאומית",
            gradual: "הדרגתית",
            intermittent: "מקוטעת"
          },
          duration: {
            label: "משך",
            lessThan30min: "פחות מ-30 דקות",
            min30To2hours: "30 דקות עד 2 שעות",
            moreThan2hours: "יותר מ-2 שעות",
            everyHalfHour: "כל חצי שעה"
          },
          radiationDetails: {
            label: "פירוט הקרנה",
            placeholder: "לאן מקרין הכאב?"
          },
          cardiacQuestions: {
            label: "תסמינים נלווים",
            shortnessOfBreath: "קוצר נשימה",
            nausea: "בחילה",
            sweating: "הזעה",
            dizziness: "סחרחורת"
          },
          respiratoryQuestions: {
            label: "קושי נשימתי",
            mild: "קל",
            moderate: "בינוני",
            severe: "חמור"
          },
          acuteQuestions: {
            label: "תסמינים חריפים",
            severePain: "כאב חמור (8-10/10)",
            lossOfConsciousness: "אובדן הכרה",
            acuteDistress: "מצוקה חריפה"
          },
          frequencyQuestions: {
            label: "פירוט תדירות",
            placeholder: "תאר את דפוס התדירות"
          },
          temperature: {
            label: "טווח טמפרטורה",
            lowGrade: "נמוכה (37.1-38.0°C)",
            moderate: "בינונית (38.1-39.0°C)",
            high: "גבוהה (39.1-40.0°C)",
            veryHigh: "גבוהה מאוד (>40.0°C)"
          },
          associatedSymptoms: {
            label: "תסמינים נלווים",
            headache: "כאב ראש",
            bodyAches: "כאבי גוף",
            chills: "צמרמורות",
            fatigue: "עייפות"
          },
          headacheQuestions: {
            label: "חומרת כאב הראש",
            mild: "קל",
            moderate: "בינוני",
            severe: "חמור"
          },
          highFeverQuestions: {
            label: "תסמיני חום גבוה",
            alteredMentalStatus: "שינוי במצב הנפשי",
            neckStiffness: "נוקשות צוואר",
            rash: "פריחה"
          },
          chronicFeverQuestions: {
            label: "פירוט חום כרוני",
            placeholder: "תאר תסמינים נוספים"
          },
          rashQuestions: {
            label: "תיאור פריחה",
            placeholder: "תאר את מראה הפריחה ומיקומה"
          }
        },
        medications: {
          allergies: {
            title: "רגישות לתרופות",
            question: "האם קיימת רגישות לתרופות?",
            yes: "כן",
            no: "לא",
            detailsPlaceholder: "נא לציין את הרגישויות"
          },
          groups: {
            title: "תרופות קבועות",
            bloodPressure: "לחץ דם",
            diabetes: "סוכרת",
            bloodThinners: "דילול דם",
            immunosuppressants: "דיכוי חיסוני",
            miscellaneous: "שונות"
          }
        },
        symptoms: {
          chiefComplaint: "תלונה עיקרית",
          symptomDuration: "כמה זמן יש לך את התסמינים האלה?",
          severity: "חומרה (1-10)",
          additionalSymptoms: "תסמינים נוספים"
        },
        vitals: {
          bloodPressure: "לחץ דם",
          heartRate: "דופק",
          temperature: "טמפרטורה",
          oxygenSaturation: "ריווי חמצן"
        },
        navigation: {
          next: "הבא",
          previous: "הקודם",
          finish: "סיום",
          loading: "שומר..."
        },
        errors: {
          required: "שדה זה נדרש",
          invalidFormat: "פורמט לא תקין",
          saveError: "שגיאה בשמירת השאלון. נסה שוב.",
          ageRequired: "גיל נדרש",
          ageInvalid: "גיל חייב להיות מספר תקין",
          ageRange: "גיל חייב להיות בין 0 ל-120",
          genderRequired: "מין נדרש",
          maritalStatusRequired: "מצב משפחתי נדרש",
          cognitiveStateRequired: "מצב קוגניטיבי נדרש",
          functionalStateRequired: "מצב תפקודי נדרש",
          medicalHistoryRequired: "נא לבחור לפחות אפשרות אחת בהיסטוריה הרפואית"
        }
      },
      
      // DashboardPage translations
      dashboard: {
        title: "לוח בקרה רפואי",
        subtitle: "נהל מקרי חולים",
        stats: {
          totalCases: "סה\"כ מקרים",
          openCases: "מקרים פתוחים",
          inProgress: "בטיפול",
          closed: "סגורים"
        },
        filters: {
          all: "כל המקרים",
          open: "פתוח",
          inProgress: "בטיפול",
          closed: "סגור",
          cancelled: "מבוטל"
        },
        actions: {
          viewCase: "צפה במקרה",
          generateSummary: "צור סיכום AI",
          loading: "טוען...",
          newCase: "מקרה חדש"
        },
        noCases: "לא נמצאו מקרים",
        loading: "טוען מקרים..."
      },
      
      // Common translations
      common: {
        loading: "טוען...",
        error: "שגיאה",
        success: "הצלחה",
        cancel: "ביטול",
        save: "שמור",
        edit: "ערוך",
        delete: "מחק",
        confirm: "אישור",
        back: "חזור",
        next: "הבא",
        previous: "הקודם",
        finish: "סיום",
        close: "סגור",
        retry: "נסה שוב",
        step: "שלב",
        of: "מתוך"
      }
    },
    vitals: {
      title: "הזנת סימנים חיוניים",
      caseInfo: "פרטי המקרה",
      caseId: "מספר מקרה",
      formTitle: "הזן סימנים חיוניים של המטופל",
      bloodPressure: "לחץ דם",
      bloodPressurePrompt: "הזן לחץ סיסטולי/דיאסטולי (לדוגמה: 120/80)",
      bloodPressurePlaceholder: "120/80",
      pulse: "דופק",
      pulsePrompt: "הזן קצב לב בפעימות לדקה",
      pulsePlaceholder: "80",
      oxygenSaturation: "ריווי חמצן (SpO₂)",
      oxygenPrompt: "הזן אחוז ריווי חמצן",
      oxygenPlaceholder: "98",
      temperature: "טמפרטורה",
      temperaturePrompt: "הזן טמפרטורת גוף במעלות צלזיוס",
      temperaturePlaceholder: "36.7",
      painScale: "סולם כאב (1–10)",
      painPrompt: "דרג את רמת הכאב של המטופל מ-1 (ללא כאב) עד 10 (כאב חמור)",
      painPlaceholder: "3",
      submit: "שלח סימנים חיוניים",
      submitting: "שולח...",
      back: "חזור",
      errors: {
        bloodPressureRequired: "נדרש לחץ דם",
        bloodPressureFormat: "פורמט: 120/80",
        bloodPressureRange: "סיסטולי: 70-250, דיאסטולי: 40-150",
        pulseRequired: "נדרש דופק",
        pulseRange: "דופק חייב להיות בין 30-200 פעימות לדקה",
        oxygenRequired: "נדרש ריווי חמצן",
        oxygenRange: "ריווי חמצן חייב להיות בין 50-100%",
        temperatureRequired: "נדרשת טמפרטורה",
        temperatureRange: "טמפרטורה חייבת להיות בין 30-45°C",
        painRequired: "נדרש סולם כאב",
        painRange: "סולם כאב חייב להיות בין 1-10",
        submitFailed: "שליחת הסימנים החיוניים נכשלה. נא לנסות שוב.",
        submitError: "שגיאה בשליחת הסימנים החיוניים. נא לבדוק את החיבור."
      }
    },
    dashboard: {
      title: "לוח בקרה לרופא",
      subtitle: "חיפוש וניהול מקרים רפואיים",
      loading: "טוען מקרים...",
      error: "שגיאה בטעינת מקרים",
      retry: "נסה שוב",
      tabs: {
        open: "פתוח",
        closed: "סגור"
      },
      search: {
        placeholder: "חפש לפי שם מטופל או ת.ז..."
      },
      filters: {
        all: "כל המקרים",
        pendingDoctorReview: "ממתין לבדיקת רופא",
        inReview: "בבדיקה",
        completed: "הושלם",
        cancelled: "בוטל"
      },
      status: {
        open: "פתוח",
        closed: "סגור",
        cancelled: "בוטל"
      },
      table: {
        patientName: "שם מטופל",
        id: "ת.ז.",
        status: "סטטוס",
        receptionDate: "תאריך קבלה",
        actions: "פעולות"
      },
      actions: {
        newCase: "מקרה חדש",
        openFile: "פתח תיק",
        delete: "מחק",
        deleteConfirm: "למחוק את המקרה? פעולה זו לא ניתנת לביטול."
      },
      empty: {
        title: "לא נמצאו מקרים",
        description: "אין מקרים התואמים לקריטריוני החיפוש הנוכחיים."
      }
    },
    case: {
      title: "ניהול מקרה",
      detailsTab: "פרטי מטופל",
      id: "ת.ז",
      age: "גיל",
      status: "סטטוס",
      loading: "טוען מקרה...",
      error: "שגיאה בטעינת מקרה",
      backToDashboard: "חזור ללוח הבקרה",
      backToList: "חזור לרשימה",
      tabs: {
        summary: "תקציר וסימנים חיוניים",
        physical: "בדיקה גופנית",
        diagnosis: "אבחנה ובדיקות",
        results: "תוצאות",
        treatment: "טיפול וסיכום"
      },
      vitals: {
        title: "סימנים חיוניים",
        description: "מדידות הסימנים החיוניים שנלקחו.",
        bloodPressure: "לחץ דם",
        bloodPressurePlaceholder: "הזן סיסטולי/דיאסטולי (לדוגמה: 120/80)",
        pulse: "דופק",
        pulsePlaceholder: "הזן קצב לב (פעימות לדקה)",
        oxygenSaturation: "סטורציה (SpO2)",
        temperature: "טמפרטורה",
        painScale: "סולם כאב (1-10)",
        save: "שמור סימנים חיוניים",
        notRecorded: "לא נרשם"
      },
      personalDetails: {
        title: "פרטים אישיים",
        fullName: "שם מלא",
        id: "מספר תעודת זהות",
        gender: "מין",
        age: "גיל",
        maritalStatus: "מצב משפחתי",
        cognitiveStatus: "מצב קוגניטיבי",
        functionalStatus: "מצב תפקודי",
        notProvided: "לא סופק"
      },
      medicalHistory: {
        title: "היסטוריה רפואית",
        backgroundDiseases: "מחלות רקע",
        noData: "אין נתוני היסטוריה רפואית זמינים"
      },
      currentIllness: {
        title: "מחלה נוכחית - תלונות ופרטים",
        noData: "אין נתוני מחלה נוכחית זמינים"
      },
      hideDetails: "הסתר פרטים",
      showDetails: "הצג פרטים",
      evidence: "ראיות",
      urgency: "דחיפות",
      aiSummary: {
        title: "תקציר תסמינים ובדיקה שנוצר על ידי AI",
        description: "סיכום NLP עם תיוג אונטולוגיה רפואית, הדגשת דגלים אדומים וזיהוי מצבים כרוניים",
        noSummary: "אין תקציר AI זמין עדיין",
        generate: "צור תקציר AI",
        error: "יצירת תקציר AI נכשלה. נא לנסות שוב."
      },
      aiDiagnosis: {
        title: "אבחנה דיפרנציאלית והמלצות בדיקות של AI",
        description: "רשימת אבחנות משוקללת לפי עדויות עם המלצות בדיקות קונטקסטואליות",
        noDiagnosis: "אין אבחנת AI זמינה עדיין",
        generate: "צור אבחנה",
        error: "יצירת אבחנת AI נכשלה. נא לנסות שוב.",
        differentialDiagnoses: "אבחנות דיפרנציאליות",
        testRecommendations: "המלצות בדיקות",
        orderTests: "הזמן בדיקות נבחרות",
        orderingTests: "מזמין בדיקות: {{tests}}",
        interactiveDiagnoses: "סקירת אבחנה אינטראקטיבית",
        interactiveDescription: "סקור ובחר בדיקות בהתבסס על ניתוח ה-AI לעיל",
        recommendedTests: "בדיקות מומלצות",
        clickToExpand: "לחץ על \"הצג פרטים\" למעלה כדי לראות את אבחנת ה-AI",
        caseClosed: "המקרה נסגר. הזמנת בדיקות חסומה.",
        diagnoses: {
          acuteMi: "אוטם שריר הלב החריף",
          unstableAngina: "תעוקת חזה לא יציבה",
          gerd: "מחלת ריפלוקס קיבה-ושט",
          musculoskeletalPain: "כאב חזה שריר-שלדי"
        },
        tests: {
          ecg: "אלקטרוקרדיוגרם (ECG)",
          troponin: "טרופונין לבבי",
          ckmb: "CK-MB",
          chestXray: "צילום חזה",
          echo: "אקוקרדיוגרם",
          stressTest: "בדיקת מאמץ",
          endoscopy: "אנדוסקופיה עליונה",
          phMonitor: "ניטור חומציות",
          muscleTest: "בדיקת תפקוד שרירים"
        },
        evidence: {
          chestPain: "כאבים בחזה",
          elevatedTroponin: "טרופונין מוגבר",
          ecgChanges: "שינויים ב-ECG",
          riskFactors: "גורמי סיכון",
          heartburn: "צרבת",
          noEcgChanges: "אין שינויים ב-ECG",
          muscleTenderness: "רגישות שרירים",
          noCardiacMarkers: "אין סמנים לבביים"
        },
        testDescriptions: {
          ecg: "הערכת קצב הלב וזיהוי איסכמיה",
          troponin: "זיהוי פגיעה בשריר הלב",
          ckmb: "קריאטין קינאז לבבי",
          chestXray: "הערכת שדות הריאות ומבנה הלב",
          echo: "הערכת תפקוד הלב ותנועת הדופן",
          stressTest: "הערכת תפקוד הלב במאמץ",
          endoscopy: "הערכת מצב הוושט והקיבה",
          phMonitor: "ניטור דפוסי ריפלוקס חומצי",
          muscleTest: "הערכת תפקוד שריר-שלד"
        }
      }
    },
    doctorLogin: {
      title: "כניסת רופא",
      subtitle: "הזן קוד גישה כדי להמשיך.",
      passcodePlaceholder: "קוד גישה",
      continue: "המשך",
      invalidCode: "קוד גישה לא תקין."
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // Default to English
    debug: false,
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  })

export default i18n
