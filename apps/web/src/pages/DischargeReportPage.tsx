import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Wand2,
  AlignLeft,
  CheckCircle2,
  Globe,
  Printer,
  Save,
  AlertTriangle,
  ClipboardCheck,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

function DischargeReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  const [reportText, setReportText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [finalizeConfirm, setFinalizeConfirm] = useState(false);

  // ─── Fetch case ───────────────────────────────────────────────────────────
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const res = await apiFetch(`/cases/${id}`);
      if (!res.ok) throw new Error('Failed to fetch case');
      return res.json();
    },
    enabled: !!id,
  });

  // Pre-fill draft if one exists
  useEffect(() => {
    if (caseData?.dischargeReport?.draft && !reportText) {
      setReportText(caseData.dischargeReport.draft);
    }
  }, [caseData]);

  const isFinalized = caseData?.dischargeReport?.finalized === true;

  // ─── Generate / Improve / Shorten ────────────────────────────────────────
  const aiActionMutation = useMutation({
    mutationFn: async (action: 'generate' | 'improve' | 'shorten') => {
      const res = await apiFetch(`/cases/${id}/discharge-report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'AI generation failed');
      }
      return res.json() as Promise<{ report: string }>;
    },
    onSuccess: (data) => {
      setReportText(data.report);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['case', id] });
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  // ─── Save draft ───────────────────────────────────────────────────────────
  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/cases/${id}/discharge-report`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: reportText }),
      });
      if (!res.ok) throw new Error('Failed to save draft');
      return res.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['case', id] });
    },
  });

  // ─── Finalize ─────────────────────────────────────────────────────────────
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/cases/${id}/discharge-report/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: reportText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Finalization failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setFinalizeConfirm(false);
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  // ─── Print ────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('discharge.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ── Header ── */}
      <div className="bg-white shadow-sm border-b print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/doctor/case/${id}`)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {t('discharge.title', 'Discharge Report')}
                {isFinalized && (
                  <span className="ml-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    {t('discharge.finalized', 'Finalized')}
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500">
                {caseData?.patientName} — ID: {caseData?.nationalId}
              </p>
            </div>
          </div>
          <button
            onClick={() => i18n.changeLanguage(isRTL ? 'en' : 'he')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            <Globe className="w-4 h-4" />
            {isRTL ? 'EN' : 'עִבְרִית'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── AI Action Buttons ── */}
        {!isFinalized && (
          <Card className="print:hidden">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                {t('discharge.aiActions', 'AI Report Tools')}
              </p>
              <div className="flex flex-wrap gap-3">
                {/* 1. Generate Full Report */}
                <button
                  onClick={() => aiActionMutation.mutate('generate')}
                  disabled={aiActionMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
                >
                  {aiActionMutation.isPending && aiActionMutation.variables === 'generate' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {t('discharge.generateFull', 'Generate Full Report')}
                </button>

                {/* 2. Improve Medical Language */}
                <button
                  onClick={() => aiActionMutation.mutate('improve')}
                  disabled={aiActionMutation.isPending || !reportText}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
                >
                  {aiActionMutation.isPending && aiActionMutation.variables === 'improve' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  {t('discharge.improveLanguage', 'Improve Medical Language')}
                </button>

                {/* 3. Shorten Report */}
                <button
                  onClick={() => aiActionMutation.mutate('shorten')}
                  disabled={aiActionMutation.isPending || !reportText}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
                >
                  {aiActionMutation.isPending && aiActionMutation.variables === 'shorten' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <AlignLeft className="w-4 h-4" />
                  )}
                  {t('discharge.shortenReport', 'Shorten Report')}
                </button>
              </div>
              {aiActionMutation.isPending && (
                <p className="mt-3 text-xs text-indigo-600 animate-pulse">
                  {t('discharge.aiGenerating', 'AI is generating the report, please wait...')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Report Editor / Viewer ── */}
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Card header */}
            <div className="flex items-center justify-between print:hidden">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                {t('discharge.reportContent', 'Report Content')}
              </h2>
              {!isFinalized && (
                <div className="flex items-center gap-2">
                  {savedIndicator && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('discharge.saved', 'Saved')}
                    </span>
                  )}
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition"
                    >
                      {t('discharge.edit', 'Edit')}
                    </button>
                  ) : (
                    <button
                      onClick={() => saveDraftMutation.mutate()}
                      disabled={saveDraftMutation.isPending}
                      className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 font-medium px-3 py-1 rounded-md transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveDraftMutation.isPending
                        ? t('discharge.saving', 'Saving...')
                        : t('discharge.saveChanges', 'Save Changes')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Print header */}
            <div className="hidden print:block mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Emergency Department Discharge Summary</h1>
              <p className="text-gray-600 mt-1">
                Patient: {caseData?.patientName} | ID: {caseData?.nationalId}
              </p>
              <p className="text-gray-500 text-sm mt-0.5">
                Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <hr className="mt-4 border-gray-300" />
            </div>

            {reportText ? (
              isEditing ? (
                <textarea
                  value={reportText}
                  onChange={e => setReportText(e.target.value)}
                  rows={24}
                  className="w-full text-sm text-gray-800 leading-relaxed border border-gray-300 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              ) : (
                <div
                  className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-xl p-5 border border-gray-200 min-h-[320px] print:bg-white print:border-0 print:p-0"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  {reportText}
                </div>
              )
            ) : (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">
                  {t('discharge.noReport', 'No report generated yet.')}
                </p>
                <p className="text-xs mt-1">
                  {t('discharge.noReportHint', 'Click "Generate Full Report" above to create one.')}
                </p>
              </div>
            )}

            {/* Finalized stamp */}
            {isFinalized && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>
                  <strong>{t('discharge.finalizedOn', 'Finalized on')}:</strong>{' '}
                  {caseData?.dischargeReport?.finalizedAt
                    ? new Date(caseData.dischargeReport.finalizedAt).toLocaleString()
                    : '—'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Action Footer ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden pb-10">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(`/doctor/case/${id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('discharge.returnToCase', 'Return to Case')}
            </Button>
            {reportText && (
              <Button
                variant="outline"
                onClick={handlePrint}
                className="flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                {t('discharge.print', 'Print / Export PDF')}
              </Button>
            )}
          </div>

          {!isFinalized && reportText && (
            !finalizeConfirm ? (
              <Button
                onClick={() => setFinalizeConfirm(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6"
              >
                <CheckCircle2 className="w-4 h-4" />
                {t('discharge.finalizeDischarge', 'Finalize Discharge')}
              </Button>
            ) : (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-sm font-medium text-amber-800">
                  {t('discharge.confirmFinalize', 'This will close the case. Confirm?')}
                </span>
                <button
                  onClick={() => finalizeMutation.mutate()}
                  disabled={finalizeMutation.isPending}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                >
                  {finalizeMutation.isPending
                    ? t('discharge.finalizing', 'Finalizing...')
                    : t('discharge.confirmYes', 'Yes, Finalize')}
                </button>
                <button
                  onClick={() => setFinalizeConfirm(false)}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition"
                >
                  {t('discharge.cancel', 'Cancel')}
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default DischargeReportPage;
