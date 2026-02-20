import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Save, Globe, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface VitalsData {
  bloodPressure: string;
  pulse: string;
  oxygenSaturation: string;
  temperature: string;
  painScale: string;
}

const initialVitals: VitalsData = {
  bloodPressure: '',
  pulse: '',
  oxygenSaturation: '',
  temperature: '',
  painScale: ''
};

function VitalsEntryPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [vitalsData, setVitalsData] = useState<VitalsData>(initialVitals);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
  };

  const updateVitalsData = (field: string, value: string) => {
    setVitalsData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!vitalsData.bloodPressure.trim()) {
      newErrors.bloodPressure = t('vitals.errors.bloodPressureRequired', 'Blood pressure is required');
    }
    if (!vitalsData.pulse.trim()) {
      newErrors.pulse = t('vitals.errors.pulseRequired', 'Pulse is required');
    }
    if (!vitalsData.oxygenSaturation.trim()) {
      newErrors.oxygenSaturation = t('vitals.errors.oxygenRequired', 'Oxygen saturation is required');
    }
    if (!vitalsData.temperature.trim()) {
      newErrors.temperature = t('vitals.errors.temperatureRequired', 'Temperature is required');
    }
    if (!vitalsData.painScale.trim()) {
      newErrors.painScale = t('vitals.errors.painRequired', 'Pain scale is required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = () => {
    return vitalsData.bloodPressure.trim() !== '' &&
           vitalsData.pulse.trim() !== '' &&
           vitalsData.oxygenSaturation.trim() !== '' &&
           vitalsData.temperature.trim() !== '' &&
           vitalsData.painScale.trim() !== '';
  };

  const submitVitalsMutation = useMutation({
    mutationFn: async (vitals: any) => {
      const response = await apiFetch(`/cases/${caseId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bp: vitals.bloodPressure,
          hr: parseInt(vitals.pulse),
          spo2: parseInt(vitals.oxygenSaturation),
          temp: parseFloat(vitals.temperature),
          painScore: parseInt(vitals.painScale)
        })
      });
      if (!response.ok) throw new Error('Failed to submit vitals');
      return response.json();
    },
    onSuccess: () => {
      console.log('Vitals submitted successfully!');
      navigate(`/doctor/case/${caseId}`);
    },
    onError: (error: Error) => {
      console.error('Error submitting vitals:', error);
      alert(t('vitals.errors.submitError', 'Error submitting vitals. Please check your connection.'));
    }
  });

  const handleSubmit = async () => {
    if (validateForm()) {
      submitVitalsMutation.mutate(vitalsData);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {t('vitals.title', 'Vital Signs Entry')}
              </h1>
            </div>
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>{i18n.language === 'he' ? 'EN' : 'עִבְרִית'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {/* Case Info */}
            <div className="mb-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t('vitals.caseInfo', 'Case Information')}
              </h2>
              <p className="text-gray-600">
                {t('vitals.caseId', 'Case ID')}: <span className="font-medium">{caseId}</span>
              </p>
            </div>

            {/* Vitals Form */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                {t('vitals.formTitle', 'Enter Patient Vital Signs')}
              </h3>

              {/* Blood Pressure */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('vitals.bloodPressure', 'Blood Pressure')} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={vitalsData.bloodPressure}
                    onChange={(e) => updateVitalsData('bloodPressure', e.target.value)}
                    className={`flex-1 ${errors.bloodPressure ? 'border-red-500' : ''}`}
                  />
                  <span className="text-sm text-gray-500">mmHg</span>
                </div>
                <p className="text-xs text-gray-500">{t('vitals.bloodPressurePrompt', 'Enter systolic/diastolic pressure (e.g., 120/80)')}</p>
                {errors.bloodPressure && (
                  <p className="text-sm text-red-600">{errors.bloodPressure}</p>
                )}
              </div>

              {/* Pulse */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('vitals.pulse', 'Pulse')} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={vitalsData.pulse}
                    onChange={(e) => updateVitalsData('pulse', e.target.value)}
                    className={`flex-1 ${errors.pulse ? 'border-red-500' : ''}`}
                  />
                  <span className="text-sm text-gray-500">bpm</span>
                </div>
                <p className="text-xs text-gray-500">{t('vitals.pulsePrompt', 'Enter heart rate in beats per minute')}</p>
                {errors.pulse && (
                  <p className="text-sm text-red-600">{errors.pulse}</p>
                )}
              </div>

              {/* Oxygen Saturation */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('vitals.oxygenSaturation', 'Oxygen Saturation (SpO₂)')} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={vitalsData.oxygenSaturation}
                    onChange={(e) => updateVitalsData('oxygenSaturation', e.target.value)}
                    className={`flex-1 ${errors.oxygenSaturation ? 'border-red-500' : ''}`}
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <p className="text-xs text-gray-500">{t('vitals.oxygenPrompt', 'Enter oxygen saturation percentage')}</p>
                {errors.oxygenSaturation && (
                  <p className="text-sm text-red-600">{errors.oxygenSaturation}</p>
                )}
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('vitals.temperature', 'Temperature')} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={vitalsData.temperature}
                    onChange={(e) => updateVitalsData('temperature', e.target.value)}
                    className={`flex-1 ${errors.temperature ? 'border-red-500' : ''}`}
                  />
                  <span className="text-sm text-gray-500">°C</span>
                </div>
                <p className="text-xs text-gray-500">{t('vitals.temperaturePrompt', 'Enter body temperature in Celsius')}</p>
                {errors.temperature && (
                  <p className="text-sm text-red-600">{errors.temperature}</p>
                )}
              </div>

              {/* Pain Scale */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('vitals.painScale', 'Pain Scale (1–10)')} <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={vitalsData.painScale}
                    onChange={(e) => updateVitalsData('painScale', e.target.value)}
                    className={`flex-1 ${errors.painScale ? 'border-red-500' : ''}`}
                  />
                  <span className="text-sm text-gray-500">1-10</span>
                </div>
                <p className="text-xs text-gray-500">{t('vitals.painPrompt', 'Rate patient\'s pain level from 1 (no pain) to 10 (severe pain)')}</p>
                {errors.painScale && (
                  <p className="text-sm text-red-600">{errors.painScale}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => navigate('/doctor')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('common.back', 'Back')}</span>
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitVitalsMutation.isPending || !isFormValid()}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                {submitVitalsMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{t('vitals.submit', 'Submit Vitals')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm pb-4">
        {t('footer.copyright', '© Swifty Medical 2025. All rights reserved.')}
      </footer>
    </div>
  );
}

export default VitalsEntryPage;