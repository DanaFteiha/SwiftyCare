import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Heart, FileText, Globe, Brain, Eye, EyeOff, Stethoscope, TestTube, CheckCircle } from 'lucide-react';

function CasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  
  
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
  const [isDiagnosisExpanded, setIsDiagnosisExpanded] = useState(true);

  // Language toggle function
  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
  };

  // Fetch case data
  const { data: caseData, isLoading: caseLoading, error: caseError } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/cases/${id}`);
      if (!response.ok) throw new Error('Failed to fetch case');
      return response.json();
    },
    enabled: !!id
  });

  // Fetch questionnaire data
  const { data: questionnaireData } = useQuery({
    queryKey: ['questionnaire', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/cases/${id}/questionnaire`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!id
  });

  // Generate AI summary mutation
  const generateSummary = useMutation({
    mutationFn: async () => {
      const response = await fetch(`http://localhost:3001/cases/${id}/summary`, {
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
      const response = await fetch(`http://localhost:3001/cases/${id}/diagnosis`, {
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
    console.log('Toggling test:', testId, 'Current selection:', selectedTests);
    setSelectedTests(prev => {
      const newSelection = prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId];
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  // Mock AI diagnosis data - in real implementation, this would come from the API
  const mockDiagnoses = [
    { id: '1', nameKey: 'aiDiagnosis.diagnoses.acuteMi', probability: 85, evidenceKeys: ['aiDiagnosis.evidence.chestPain', 'aiDiagnosis.evidence.elevatedTroponin', 'aiDiagnosis.evidence.ecgChanges'] },
    { id: '2', nameKey: 'aiDiagnosis.diagnoses.unstableAngina', probability: 70, evidenceKeys: ['aiDiagnosis.evidence.chestPain', 'aiDiagnosis.evidence.riskFactors', 'aiDiagnosis.evidence.ecgChanges'] },
    { id: '3', nameKey: 'aiDiagnosis.diagnoses.gerd', probability: 45, evidenceKeys: ['aiDiagnosis.evidence.chestPain', 'aiDiagnosis.evidence.heartburn', 'aiDiagnosis.evidence.noEcgChanges'] },
    { id: '4', nameKey: 'aiDiagnosis.diagnoses.musculoskeletalPain', probability: 30, evidenceKeys: ['aiDiagnosis.evidence.chestPain', 'aiDiagnosis.evidence.muscleTenderness', 'aiDiagnosis.evidence.noCardiacMarkers'] }
  ];

  const mockTests = [
    { id: 'ecg', nameKey: 'aiDiagnosis.tests.ecg', urgency: 'high', descriptionKey: 'aiDiagnosis.testDescriptions.ecg', diagnosisId: '1' },
    { id: 'troponin', nameKey: 'aiDiagnosis.tests.troponin', urgency: 'high', descriptionKey: 'aiDiagnosis.testDescriptions.troponin', diagnosisId: '1' },
    { id: 'ckmb', nameKey: 'aiDiagnosis.tests.ckmb', urgency: 'medium', descriptionKey: 'aiDiagnosis.testDescriptions.ckmb', diagnosisId: '1' },
    { id: 'chest-xray', nameKey: 'aiDiagnosis.tests.chestXray', urgency: 'medium', descriptionKey: 'aiDiagnosis.testDescriptions.chestXray', diagnosisId: '2' },
    { id: 'echo', nameKey: 'aiDiagnosis.tests.echo', urgency: 'low', descriptionKey: 'aiDiagnosis.testDescriptions.echo', diagnosisId: '2' },
    { id: 'stress-test', nameKey: 'aiDiagnosis.tests.stressTest', urgency: 'low', descriptionKey: 'aiDiagnosis.testDescriptions.stressTest', diagnosisId: '2' },
    { id: 'endoscopy', nameKey: 'aiDiagnosis.tests.endoscopy', urgency: 'low', descriptionKey: 'aiDiagnosis.testDescriptions.endoscopy', diagnosisId: '3' },
    { id: 'ph-monitor', nameKey: 'aiDiagnosis.tests.phMonitor', urgency: 'low', descriptionKey: 'aiDiagnosis.testDescriptions.phMonitor', diagnosisId: '3' },
    { id: 'muscle-test', nameKey: 'aiDiagnosis.tests.muscleTest', urgency: 'low', descriptionKey: 'aiDiagnosis.testDescriptions.muscleTest', diagnosisId: '4' }
  ];

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
          <Button onClick={() => navigate('/dashboard')}>
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
                  {t('case.title', 'Case Management')}: {caseData.patientName}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Vital Signs (View Only) */}
          <div className="space-y-6">
            <Card>
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
            <Card>
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
            <Card>
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
            <Card>
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

          {/* Right Column - AI Summary & Diagnosis */}
          <div className="space-y-6">
            {/* AI-Generated Symptom & Exam Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <Brain className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('case.aiSummary.title', 'AI-Generated Symptom & Exam Summary')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    className={`flex items-center ${i18n.language === 'he' ? 'space-x-reverse space-x-1' : 'space-x-1'} text-blue-600 hover:text-blue-800 text-sm font-medium`}
                  >
                    {isSummaryExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{isSummaryExpanded ? t('case.hideDetails', 'Hide Details') : t('case.showDetails', 'Show Details')}</span>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  {t('case.aiSummary.description', 'NLP summarization with medical-ontology tagging, red-flag highlighting, and chronic-condition identification')}
                </p>

                {isSummaryExpanded && (
                  caseData.summary ? (
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
                  )
                )}
              </CardContent>
            </Card>

            {/* AI Differential-Diagnosis & Test Recommendations */}
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
                    {/* AI Diagnosis Content */}
                    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <div dangerouslySetInnerHTML={{ __html: formatAIText(caseData.aiDiagnosis) }} />
                    </div>
                    
                    {/* Interactive Differential Diagnoses */}
                    <div className="mt-8 border-t pt-6">
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                        <TestTube className="w-5 h-5 text-orange-600 mr-2" />
                        {t('case.aiDiagnosis.interactiveDiagnoses', 'Interactive Diagnosis Review')}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {t('case.aiDiagnosis.interactiveDescription', 'Review and select tests based on the AI analysis above')}
                      </p>
                      
                      <div className="space-y-4">
                        {mockDiagnoses.map((diag) => (
                          <div key={diag.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-medium text-gray-800">{t(diag.nameKey, diag.nameKey)}</p>
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                                {diag.probability}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {t('common.evidence', 'Evidence')}: {diag.evidenceKeys.map(key => t(key)).join(', ')}
                            </p>
                            
                            {/* Related Tests */}
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                                {t('case.aiDiagnosis.recommendedTests', 'Recommended Tests')}:
                              </p>
                              {mockTests
                                .filter(test => test.diagnosisId === diag.id)
                                .map((test) => (
                                  <div key={test.id} className="flex items-center bg-white p-2 rounded border border-gray-200 hover:bg-gray-50">
                                    <input
                                      type="checkbox"
                                      id={`test-${test.id}`}
                                      checked={selectedTests.includes(test.id)}
                                      onChange={() => toggleTestSelection(test.id)}
                                      className="h-4 w-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                    />
                                    <label htmlFor={`test-${test.id}`} className="ml-3 text-sm flex-1 cursor-pointer">
                                      <div className="font-medium text-gray-800">{t(test.nameKey)}</div>
                                      <p className="text-gray-600">
                                        {t('common.urgency', 'Urgency')}: 
                                        <span className={`font-semibold ml-1 ${
                                          test.urgency === 'high' ? 'text-red-600' : 
                                          test.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                          {t(`common.${test.urgency}`, test.urgency)}
                                        </span>
                                      </p>
                                      <p className="text-gray-600">{t(test.descriptionKey)}</p>
                                    </label>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 flex justify-end">
                        <Button 
                          onClick={() => alert(t('aiDiagnosis.orderingTests', 'Ordering tests: {{tests}}', { tests: selectedTests.join(', ') }))}
                          disabled={selectedTests.length === 0} 
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {t('aiDiagnosis.orderTests', 'Order Selected Tests')}
                        </Button>
                      </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default CasePage;