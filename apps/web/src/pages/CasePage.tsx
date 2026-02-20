import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Heart, FileText, Globe, Brain, Eye, EyeOff, Stethoscope, TestTube, CheckCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

function CasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  
  
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isDiagnosisExpanded, setIsDiagnosisExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'diagnosis' | 'details'>('details');

  // Language toggle function
  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
  };

  // Fetch case data
  const { data: caseData, isLoading: caseLoading, error: caseError } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const response = await apiFetch(`/cases/${id}`);
      if (!response.ok) throw new Error('Failed to fetch case');
      return response.json();
    },
    enabled: !!id
  });

  // Fetch questionnaire data
  const { data: questionnaireData } = useQuery({
    queryKey: ['questionnaire', id],
    queryFn: async () => {
      const response = await apiFetch(`/cases/${id}/questionnaire`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!id
  });

  // Generate AI summary mutation
  const generateSummary = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/cases/${id}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to generate summary');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
    },
    onError: (error: Error) => {
      console.error('Error generating summary:', error);
      alert(t('case.aiSummary.error', 'Failed to generate AI summary. Please try again.'));
    }
  });

  // Generate AI diagnosis mutation
  const generateDiagnosis = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`/cases/${id}/diagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to generate diagnosis');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
    },
    onError: (error: Error) => {
      console.error('Error generating diagnosis:', error);
      alert(t('case.aiDiagnosis.error', 'Failed to generate AI diagnosis. Please try again.'));
    }
  });

  const orderTestsMutation = useMutation({
    mutationFn: async (tests: string[]) => {
      const response = await apiFetch(`/cases/${id}/order-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tests })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Failed to order tests');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      alert(`Success — Tests for ${caseData?.patientName || 'patient'} have been ordered.`);
      navigate('/doctor');
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to order tests');
    }
  });

  const formatAIText = (text: string) => {
    let formatted = text;
    
    // Remove ALL dashes from the entire text first (more aggressive)
    formatted = formatted.replace(/^- /gm, '');
    formatted = formatted.replace(/^-/gm, '');
    formatted = formatted.replace(/ - /g, ' ');
    
    // Convert **text** to <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert ### headers to styled headers
    formatted = formatted.replace(/### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-2 mb-1">$1</h3>');
    
    // Convert ## headers to styled headers
    formatted = formatted.replace(/## (.+)$/gm, '<h2 class="text-xl font-semibold text-gray-900 mt-3 mb-2">$1</h2>');
    
    // Convert # headers to styled headers
    formatted = formatted.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-2">$1</h1>');
    
    // Convert --- to horizontal rule
    formatted = formatted.replace(/^---$/gm, '<hr class="my-2 border-gray-300"/>');
    
    // Handle bullet points - find all lines starting with - and group them
    const lines = formatted.split('\n');
    const processedLines = [];
    let inBulletList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim().startsWith('- ')) {
        if (!inBulletList) {
          processedLines.push('<ul class="list-disc list-inside space-y-0 my-0.5 ml-4">');
          inBulletList = true;
        }
        const bulletText = line.replace(/^- (.+)$/, '$1');
        processedLines.push(`<li class="ml-0">${bulletText}</li>`);
      } else {
        if (inBulletList) {
          processedLines.push('</ul>');
          inBulletList = false;
        }
        processedLines.push(line);
      }
    }
    
    // Close any remaining bullet list
    if (inBulletList) {
      processedLines.push('</ul>');
    }
    
    formatted = processedLines.join('\n');
    
    // Convert remaining line breaks to <br> with minimal spacing
    formatted = formatted.replace(/\n/g, '<br/>');
    
    return formatted;
  };

  const toggleTestSelection = (testId: string) => {
    setSelectedTests(prev =>
      prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
    );
  };

  useEffect(() => {
    if (caseData?.status === 'closed') {
      const ordered = Array.isArray(caseData.orderedTests) ? caseData.orderedTests : [];
      setSelectedTests(ordered);
    }
  }, [caseData?.status, caseData?.orderedTests]);

  type ParsedDiagnosis = {
    name: string;
    probability?: number;
    evidence: string[];
  };

  type ParsedTest = {
    id: string;
    name: string;
    urgency?: 'high' | 'medium' | 'low';
    rationale?: string;
  };

  const parseInteractiveDiagnosis = (text: string | undefined | null) => {
    if (!text) {
      return { diagnoses: [] as ParsedDiagnosis[], tests: [] as ParsedTest[] };
    }

    const stripMarkdown = (value: string) =>
      value.replace(/\*\*(.*?)\*\*/g, '$1').replace(/[`*_]/g, '').trim();

    const lines = text
      .split('\n')
      .map(line => stripMarkdown(line))
      .filter(Boolean);

    const isSectionHeader = (line: string, keywords: string[]) =>
      keywords.some(keyword => line.toLowerCase().includes(keyword));

    let currentSection: 'diagnoses' | 'tests' | null = null;
    let collectingEvidence = false;
    const diagnoses: ParsedDiagnosis[] = [];
    const tests: ParsedTest[] = [];

    const toSlug = (value: string) =>
      value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    for (const line of lines) {
      if (isSectionHeader(line, ['differential diagnos', 'diagnoses'])) {
        currentSection = 'diagnoses';
        collectingEvidence = false;
        continue;
      }
      if (isSectionHeader(line, ['recommended tests', 'test recommendations', 'diagnostic tests', 'tests'])) {
        currentSection = 'tests';
        collectingEvidence = false;
        continue;
      }

      if (currentSection === 'diagnoses') {
        if (collectingEvidence) {
          if (line.toLowerCase().startsWith('probability')) {
            const percentMatch = line.match(/(\d{1,3})\s*%/);
            if (percentMatch && diagnoses.length > 0) {
              diagnoses[diagnoses.length - 1].probability = Number(percentMatch[1]);
            }
          } else if (line.toLowerCase().startsWith('supporting evidence')) {
            collectingEvidence = true;
          } else if (diagnoses.length > 0) {
            diagnoses[diagnoses.length - 1].evidence.push(line);
          }
          continue;
        }

        const nameMatch = line.match(/^\d+[\).]\s*(.+)$/) || line.match(/^-?\s*(.+)$/);
        if (nameMatch && !line.toLowerCase().startsWith('probability') && !line.toLowerCase().startsWith('supporting')) {
          const name = nameMatch[1].trim();
          const percentMatch = name.match(/(\d{1,3})\s*%/);
          const probability = percentMatch ? Number(percentMatch[1]) : undefined;
          const cleanedName = name.replace(/\s*-\s*\d{1,3}\s*%/g, '').trim();
          diagnoses.push({ name: cleanedName, probability, evidence: [] });
          collectingEvidence = false;
          continue;
        }

        if (line.toLowerCase().startsWith('probability')) {
          const percentMatch = line.match(/(\d{1,3})\s*%/);
          if (percentMatch && diagnoses.length > 0) {
            diagnoses[diagnoses.length - 1].probability = Number(percentMatch[1]);
          }
          continue;
        }

        if (line.toLowerCase().startsWith('supporting evidence')) {
          collectingEvidence = true;
          continue;
        }

        if (collectingEvidence && diagnoses.length > 0) {
          diagnoses[diagnoses.length - 1].evidence.push(line);
        }
        continue;
      }

      if (currentSection === 'tests') {
        if (line.toLowerCase().startsWith('urgency:')) {
          const urgencyMatch = line.match(/\b(high|medium|low)\b/i);
          if (urgencyMatch && tests.length > 0) {
            tests[tests.length - 1].urgency = urgencyMatch[1].toLowerCase() as ParsedTest['urgency'];
          }
          continue;
        }

        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('summary') || lowerLine.startsWith('probability')) {
          continue;
        }
        if (line.endsWith(':')) {
          continue;
        }

        const testNameMatch = line.match(/^\d+[\).]\s*(.+)$/) || line.match(/^-?\s*(.+)$/);
        if (testNameMatch) {
          const rawName = testNameMatch[1].trim();
          const name = rawName.replace(/\(.*?\)/g, '').trim();
          const startsWithTest = /^(x-?ray|ct|mri|ultrasound|ecg|ekg|physical exam|examination|labs?|blood test|urine test|urinalysis|cbc|cmp|culture|panel|imaging|scan|test)\b/i.test(
            name
          );
          const explanatoryPrefix = /^(risk factors?|can present|absence of|common in|pain score|mri is|ct scan is|x-?ray is|a thorough|physical examination is|assessment is)/i.test(
            name
          );
          if (name && startsWithTest && !explanatoryPrefix) {
            tests.push({ id: toSlug(name), name });
          }
        }
      }
    }

    return { diagnoses, tests };
  };

  const interactiveData = useMemo(
    () => parseInteractiveDiagnosis(caseData?.aiDiagnosis),
    [caseData?.aiDiagnosis]
  );

  if (caseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('case.loading', 'Loading case...')}</p>
        </div>
      </div>
    );
  }

  if (caseError || !caseData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('case.error', 'Error loading case')}</p>
          <Button onClick={() => navigate('/doctor')}>
            {t('case.backToDashboard', 'Back to Dashboard')}
          </Button>
        </div>
      </div>
    );
  }

  // Extract questionnaire data
  const personalInfo = questionnaireData?.answers?.personalInfo || {};
  const medicalHistory = questionnaireData?.answers?.medicalHistory || {};
  const currentIllness = questionnaireData?.answers?.currentIllness || {};

  return (
    <div className="min-h-screen bg-gray-50" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('case.title', 'Medical Summary')}: {caseData.patientName}
                </h1>
                <p className="text-sm text-gray-600">
                  {t('case.id', 'ID')}: {caseData.nationalId}, {t('case.age', 'Age')}: {personalInfo.age || 'N/A'}, {t('case.status', 'Status')}: {caseData.status}
                </p>
              </div>
            </div>
            <button
              onClick={toggleLanguage}
              className={`flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-2' : 'space-x-2'} px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors`}
            >
              <Globe className="w-4 h-4" />
              <span>{i18n.language === 'he' ? 'EN' : 'עִבְרִית'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 rounded-lg border border-gray-200 overflow-hidden bg-white">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-semibold border-b sm:border-b-0 sm:border-r ${
              activeTab === 'details'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t('case.detailsTab', 'Patient Details')}
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-3 text-sm font-semibold border-b sm:border-b-0 sm:border-r ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t('case.aiSummary.title', 'AI-Generated Symptom & Exam Summary')}
          </button>
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`px-4 py-3 text-sm font-semibold border-b sm:border-b-0 ${
              activeTab === 'diagnosis'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t('case.aiDiagnosis.title', 'AI Differential-Diagnosis & Test Recommendations')}
          </button>
          </div>
        </div>

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="order-2">
              <CardContent className="p-6">
                <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <Heart className="w-5 h-5 text-red-600" />
                  {t('case.vitals.title', 'Vital Signs')}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {t('case.vitals.description', 'Vital signs measurements taken.')}
                </p>

                <div className="space-y-4">
                  {/* Blood Pressure */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('case.vitals.bloodPressure', 'Blood Pressure')}
                    </label>
                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {caseData.vitals?.bp || t('case.vitals.notRecorded', 'Not recorded')}
                    </div>
                  </div>

                  {/* Pulse */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('case.vitals.pulse', 'Pulse')}
                    </label>
                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {caseData.vitals?.hr ? `${caseData.vitals.hr} bpm` : t('case.vitals.notRecorded', 'Not recorded')}
                    </div>
                  </div>

                  {/* Oxygen Saturation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('case.vitals.oxygenSaturation', 'Saturation (SpO2)')}
                    </label>
                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {caseData.vitals?.spo2 ? `${caseData.vitals.spo2}%` : t('case.vitals.notRecorded', 'Not recorded')}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('case.vitals.temperature', 'Temperature')}
                    </label>
                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {caseData.vitals?.temp ? `${caseData.vitals.temp}°C` : t('case.vitals.notRecorded', 'Not recorded')}
                    </div>
                  </div>

                  {/* Pain Scale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('case.vitals.painScale', 'Pain Scale (1-10)')}
                    </label>
                    <div className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                      {caseData.vitals?.painScore ? `${caseData.vitals.painScore}/10` : t('case.vitals.notRecorded', 'Not recorded')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Details */}
            <Card className="order-1">
              <CardContent className="p-6">
                <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <User className="w-5 h-5 text-blue-600" />
                  {t('case.personalDetails.title', 'Personal Details')}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">{t('case.personalDetails.fullName', 'Full Name')}:</span>
                    <span className="text-sm text-gray-900">{caseData.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">{t('case.personalDetails.id', 'ID No.')}:</span>
                    <span className="text-sm text-gray-900">{caseData.nationalId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">{t('case.personalDetails.gender', 'Gender')}:</span>
                    <span className="text-sm text-gray-900">{personalInfo.gender ? String(t(`questionnaire.personalInfo.gender.${personalInfo.gender}`, personalInfo.gender)) : String(t('case.personalDetails.notProvided', 'Not provided'))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">{t('case.personalDetails.age', 'Age')}:</span>
                    <span className="text-sm text-gray-900">{personalInfo.age || String(t('case.personalDetails.notProvided', 'Not provided'))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">{t('case.personalDetails.maritalStatus', 'Marital Status')}:</span>
                    <span className="text-sm text-gray-900">{personalInfo.maritalStatus ? String(t(`questionnaire.personalInfo.maritalStatus.${personalInfo.maritalStatus}`, personalInfo.maritalStatus)) : String(t('case.personalDetails.notProvided', 'Not provided'))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">{t('case.personalDetails.cognitiveStatus', 'Cognitive Status')}:</span>
                    <span className="text-sm text-gray-900">{personalInfo.cognitiveState ? String(t(`questionnaire.personalInfo.cognitiveState.${personalInfo.cognitiveState}`, personalInfo.cognitiveState)) : String(t('case.personalDetails.notProvided', 'Not provided'))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">{t('case.personalDetails.functionalStatus', 'Functional Status')}:</span>
                    <span className="text-sm text-gray-900">{personalInfo.functionalState ? String(t(`questionnaire.personalInfo.functionalState.${personalInfo.functionalState}`, personalInfo.functionalState)) : String(t('case.personalDetails.notProvided', 'Not provided'))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical History */}
            <Card className="order-3">
              <CardContent className="p-6">
                <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <Stethoscope className="w-5 h-5 text-green-600" />
                  {t('case.medicalHistory.title', 'Medical History')}
                </h3>
                {Object.keys(medicalHistory).length > 0 && Object.values(medicalHistory).some(value => value === true) ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-3">{t('case.medicalHistory.backgroundDiseases', 'Background Diseases')}:</p>
                    <ul className="space-y-1">
                      {Object.entries(medicalHistory)
                        .filter(([key, value]) => value === true && key !== 'none')
                        .map(([key]) => (
                          <li key={key} className="flex items-center">
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            <span className="text-sm text-gray-900">{t(`questionnaire.medicalHistory.${key}`, key)}</span>
                          </li>
                        ))}
                    </ul>
                    {medicalHistory.none && (
                      <div className="flex items-center mt-3">
                        <CheckCircle className="w-4 h-4 text-gray-600 mr-2" />
                        <span className="text-sm text-gray-600">{t('questionnaire.medicalHistory.none', 'None')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{t('case.medicalHistory.noData', 'No medical history data available')}</p>
                )}
              </CardContent>
            </Card>

            {/* Current Illness - Complaints and Details */}
            <Card className="order-4">
              <CardContent className="p-6">
                <h3 className={`text-lg font-semibold text-gray-900 mb-4 flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <FileText className="w-5 h-5 text-purple-600" />
                  {t('case.currentIllness.title', 'Current Illness - Complaints and Details')}
                </h3>
                {Object.keys(currentIllness).length > 0 && Object.values(currentIllness).some(value => value === true) ? (
                  <div className="space-y-2">
                    <ul className="space-y-1">
                      {Object.entries(currentIllness)
                        .filter(([, value]) => value === true)
                        .map(([key], index) => (
                          <li key={key} className="flex items-center">
                            <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                              {index + 1}
                            </div>
                            <span className="text-sm text-gray-900">{t(`questionnaire.currentIllness.${key}`, key)}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">{t('case.currentIllness.noData', 'No current illness data available')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

          {/* Right Column - AI Summary & Diagnosis */}
        {(activeTab === 'summary' || activeTab === 'diagnosis') && (
          <div className="space-y-6">
            {/* AI-Generated Symptom & Exam Summary */}
              {activeTab === 'summary' && (
            <Card>
              <CardContent className="p-6">
                    <div className="flex items-start mb-4">
                  <div className={`flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('case.aiSummary.title', 'AI-Generated Symptom & Exam Summary')}
                    </h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  {t('case.aiSummary.description', 'NLP summarization with medical-ontology tagging, red-flag highlighting, and chronic-condition identification')}
                </p>

                    {caseData.summary ? (
                    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <div dangerouslySetInnerHTML={{ __html: formatAIText(caseData.summary) }} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        {t('case.aiSummary.noSummary', 'No AI summary available yet')}
                      </p>
                      <div className="flex justify-center">
                        <Button
                          onClick={() => generateSummary.mutate()}
                          disabled={generateSummary.isPending}
                          className={`flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}
                        >
                          {generateSummary.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Brain className="w-4 h-4" />
                          )}
                          <span>{t('case.aiSummary.generate', 'Generate AI Summary')}</span>
                        </Button>
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>
              )}

            {/* AI Differential-Diagnosis & Test Recommendations */}
              {activeTab === 'diagnosis' && (
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <TestTube className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('case.aiDiagnosis.title', 'AI Differential-Diagnosis & Test Recommendations')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsDiagnosisExpanded(!isDiagnosisExpanded)}
                    className={`flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-1' : 'space-x-1'} text-blue-600 hover:text-blue-800 text-sm font-medium`}
                  >
                    {isDiagnosisExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{isDiagnosisExpanded ? t('case.hideDetails', 'Hide Details') : t('case.showDetails', 'Show Details')}</span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  {t('case.aiDiagnosis.description', 'Evidence-weighted diagnosis list with contextual test recommendations')}
                </p>

                {isDiagnosisExpanded && caseData.aiDiagnosis ? (
                  <div className="space-y-6">
                    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <div dangerouslySetInnerHTML={{ __html: formatAIText(caseData.aiDiagnosis) }} />
                    </div>
                    
                    <div className="mt-8 border-t pt-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                        <TestTube className="w-5 h-5 text-orange-600 mr-2" />
                        {t('case.aiDiagnosis.interactiveDiagnoses', 'Interactive Diagnosis Review')}
                      </h4>

                          {interactiveData.diagnoses.length === 0 && interactiveData.tests.length === 0 ? (
                            <p className="text-sm text-gray-600">
                              {t(
                                'case.aiDiagnosis.interactiveUnavailable',
                                'Interactive review requires recognizable diagnosis and test lists in the AI output.'
                              )}
                            </p>
                          ) : (
                            <div className="space-y-6">
                              {caseData?.status === 'closed' && (
                                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                  {t('case.aiDiagnosis.caseClosed', 'Case is closed. Ordering tests is disabled.')}
                                </div>
                              )}
                              {interactiveData.diagnoses.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                    {t('case.aiDiagnosis.differentialDiagnoses', 'Differential Diagnoses')}:
                                  </p>
                                  <div className="space-y-3">
                                    {interactiveData.diagnoses.map((diag, index) => (
                                      <div key={`${diag.name}-${index}`} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                        <div className="flex items-center justify-between">
                                          <p className="font-semibold text-gray-900">{diag.name}</p>
                                          {typeof diag.probability === 'number' && (
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                              {diag.probability}%
                                            </span>
                                          )}
                                        </div>
                                        {diag.evidence.length > 0 && (
                                          <div className="mt-3 text-sm text-gray-600">
                                            <span className="font-medium text-gray-700">
                                              {t('common.evidence', 'Supporting Evidence')}:
                                            </span>{' '}
                                            <span className="leading-relaxed">{diag.evidence.join(' ')}</span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                          {interactiveData.tests.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                {t('case.aiDiagnosis.recommendedTests', 'Recommended Tests')}:
                              </p>
                                  {interactiveData.tests.map(test => (
                                  <div key={test.id} className="flex items-center bg-white p-2 rounded border border-gray-200 hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      id={`test-${test.id}`}
                                      checked={selectedTests.includes(test.id)}
                                      onChange={() => toggleTestSelection(test.id)}
                                      disabled={caseData?.status === 'closed'}
                                      className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                    />
                                    <label htmlFor={`test-${test.id}`} className="ml-3 text-sm flex-1 cursor-pointer">
                                        <div className="font-medium text-gray-800">{test.name}</div>
                                        {test.urgency && (
                                      <p className="text-gray-600">
                                            {t('common.urgency', 'Urgency')}:{' '}
                                            <span
                                              className={`font-semibold ml-1 ${
                                                test.urgency === 'high'
                                                  ? 'text-red-600'
                                                  : test.urgency === 'medium'
                                                  ? 'text-yellow-600'
                                                  : 'text-green-600'
                                              }`}
                                            >
                                          {t(`common.${test.urgency}`, test.urgency)}
                                        </span>
                                      </p>
                                        )}
                                        {test.rationale && <p className="text-gray-600">{test.rationale}</p>}
                                    </label>
                                  </div>
                                ))}

                                  <div className="mt-4 flex justify-end">
                                    <Button
                                      onClick={() => orderTestsMutation.mutate(selectedTests)}
                                      disabled={
                                        selectedTests.length === 0 ||
                                        orderTestsMutation.isPending ||
                                        caseData?.status === 'closed'
                                      }
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {orderTestsMutation.isPending
                                        ? t('aiDiagnosis.orderingTests', 'Ordering tests...')
                                        : t('aiDiagnosis.orderTests', 'Order Selected Tests')}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                    </div>
                  </div>
                ) : !isDiagnosisExpanded ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">
                      {t('case.aiDiagnosis.clickToExpand', 'Click "Show Details" above to view AI diagnosis')}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">
                      {t('case.aiDiagnosis.noDiagnosis', 'No AI diagnosis available yet')}
                    </p>
                    <div className="flex justify-center">
                      <Button
                        onClick={() => generateDiagnosis.mutate()}
                        disabled={generateDiagnosis.isPending}
                        className={`flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-2' : 'space-x-2'}`}
                      >
                        {generateDiagnosis.isPending ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Brain className="w-4 h-4" />
                        )}
                        <span>{t('case.aiDiagnosis.generate', 'Generate Diagnosis')}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CasePage;