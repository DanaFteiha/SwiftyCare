import { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

// ─── Medical Report Renderer ─────────────────────────────────────────────────
// Parses the plain-text narrative and adds clinical visual emphasis.

const CLINICAL_VALUE_RE =
  /\b(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L|%|°C|°F|bpm|\/min|mmHg|mg|mcg|units?|IU\/L|g\/dL|mEq\/L|U\/L|L|mL)\b/gi;

// Terms that should be bolded + subtly highlighted
const DIAGNOSIS_TERMS = [
  'diabetes', 'hypertension', 'hyperglycemia', 'hypoglycemia', 'ketoacidosis', 'dka',
  'myocardial infarction', 'angina', 'stroke', 'copd', 'asthma', 'pneumonia',
  'sepsis', 'appendicitis', 'cholecystitis', 'pancreatitis', 'pulmonary embolism',
  'deep vein thrombosis', 'heart failure', 'atrial fibrillation', 'arrhythmia',
  'fracture', 'laceration', 'contusion', 'trauma', 'hypoxia', 'hypothyroidism',
  'hyperthyroidism', 'anemia', 'infection', 'urinary tract infection',
];

const RECOMMENDATION_TRIGGERS = [
  'recommend', 'advise', 'instructed', 'follow.?up', 'return to', 'monitor',
  'continue', 'prescribed', 'started on', 'refer', 'consult',
];

const TREATMENT_TRIGGERS = [
  'received', 'administered', 'given', 'treated with', 'initiated', 'started',
  'therapy', 'infusion', 'injection',
];

function highlightParagraph(text: string): React.ReactNode[] {
  // Split by clinical value pattern and interleave highlighted spans
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Highlight clinical numeric values first
  const segments = remaining.split(CLINICAL_VALUE_RE);
  // CLINICAL_VALUE_RE has 2 capture groups → segments = [before, num, unit, before, num, unit, ...]
  for (let i = 0; i < segments.length; i++) {
    if (i % 3 === 0) {
      // Plain text — apply diagnosis term highlighting
      const plain = segments[i];
      if (!plain) continue;
      const lowerPlain = plain.toLowerCase();
      let hasDx = false;
      for (const term of DIAGNOSIS_TERMS) {
        if (lowerPlain.includes(term)) { hasDx = true; break; }
      }
      if (hasDx) {
        // Bold diagnosis terms inline
        let highlighted = plain;
        for (const term of DIAGNOSIS_TERMS) {
          const re = new RegExp(`\\b(${term})\\b`, 'gi');
          highlighted = highlighted.replace(re, '##BOLD##$1##/BOLD##');
        }
        const boldParts = highlighted.split(/(##BOLD##.*?##\/BOLD##)/);
        boldParts.forEach((bp) => {
          if (bp.startsWith('##BOLD##')) {
            parts.push(
              <strong key={`dx-${key++}`} className="font-semibold text-gray-900">
                {bp.replace('##BOLD##', '').replace('##/BOLD##', '')}
              </strong>
            );
          } else if (bp) {
            parts.push(<span key={`tx-${key++}`}>{bp}</span>);
          }
        });
      } else {
        parts.push(<span key={`s-${key++}`}>{plain}</span>);
      }
    } else if (i % 3 === 1) {
      // numeric value
      const num = segments[i];
      const unit = segments[i + 1];
      parts.push(
        <span
          key={`cv-${key++}`}
          className="inline-flex items-baseline gap-0.5 px-1 py-0 rounded bg-blue-50 border border-blue-100 text-blue-800 font-semibold text-[0.8em]"
        >
          {num}
          <span className="font-normal text-blue-600 text-[0.9em]">{unit}</span>
        </span>
      );
      i++; // skip the unit segment
    }
  }

  return parts;
}

// Section heading detection: matches **Heading Text** at start of a line/paragraph
const SECTION_HEADING_RE = /^\*\*(.+?)\*\*\s*$/;

// Section-specific styling map
const SECTION_STYLES: Record<string, { border: string; bg: string; label: string }> = {
  'patient summary':                  { border: 'border-indigo-400', bg: 'bg-indigo-50',  label: 'text-indigo-800' },
  'relevant medical history':         { border: 'border-violet-400', bg: 'bg-violet-50',  label: 'text-violet-800' },
  'presenting complaint':             { border: 'border-orange-400', bg: 'bg-orange-50',  label: 'text-orange-800' },
  'clinical evaluation':              { border: 'border-blue-400',   bg: 'bg-blue-50',    label: 'text-blue-800'   },
  'investigation summary':            { border: 'border-cyan-400',   bg: 'bg-cyan-50',    label: 'text-cyan-800'   },
  'investigations performed':         { border: 'border-cyan-400',   bg: 'bg-cyan-50',    label: 'text-cyan-800'   },
  'investigations performed / ordered':{ border: 'border-cyan-400',  bg: 'bg-cyan-50',    label: 'text-cyan-800'   },
  'key findings and results':         { border: 'border-red-400',    bg: 'bg-red-50',     label: 'text-red-800'    },
  'key findings':                     { border: 'border-red-400',    bg: 'bg-red-50',     label: 'text-red-800'    },
  'treatment administered':           { border: 'border-blue-300',   bg: 'bg-blue-50',    label: 'text-blue-700'   },
  'clinical impression':              { border: 'border-purple-400', bg: 'bg-purple-50',  label: 'text-purple-800' },
  'recommended follow-up investigations':{ border: 'border-teal-400',bg: 'bg-teal-50',    label: 'text-teal-800'   },
  'recommended follow-up':            { border: 'border-teal-400',   bg: 'bg-teal-50',    label: 'text-teal-800'   },
  'discharge recommendations':        { border: 'border-emerald-400',bg: 'bg-emerald-50', label: 'text-emerald-800'},
  'disposition':                      { border: 'border-gray-400',   bg: 'bg-gray-100',   label: 'text-gray-700'   },
};

function getSectionStyle(heading: string) {
  const key = heading.toLowerCase().trim();
  for (const [pattern, style] of Object.entries(SECTION_STYLES)) {
    if (key.includes(pattern)) return style;
  }
  return { border: 'border-gray-300', bg: 'bg-gray-50', label: 'text-gray-700' };
}

function MedicalReportRenderer({ text }: { text: string }) {
  // Split by newlines, keeping empty lines as paragraph separators
  const lines = text.split(/\n/);

  // Group lines into sections: { heading?: string; paragraphs: string[] }
  type Section = { heading: string | null; paragraphs: string[] };
  const sections: Section[] = [];
  let current: Section = { heading: null, paragraphs: [] };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const headingMatch = line.match(SECTION_HEADING_RE);
    if (headingMatch) {
      // Push current section if it has content
      if (current.paragraphs.length > 0 || current.heading) {
        sections.push(current);
      }
      current = { heading: headingMatch[1], paragraphs: [] };
    } else {
      current.paragraphs.push(line);
    }
  }
  if (current.paragraphs.length > 0 || current.heading) {
    sections.push(current);
  }

  // If no section headings were detected, fall back to paragraph rendering
  const hasSections = sections.some(s => s.heading !== null);

  if (!hasSections) {
    // Legacy / plain-text fallback
    const paragraphs = text.split(/\n+/).filter(p => p.trim());
    return (
      <div className="space-y-3 text-sm leading-relaxed text-gray-800 print:text-xs">
        {paragraphs.map((para, idx) => {
          const isRecommendation = RECOMMENDATION_TRIGGERS.some(t => new RegExp(t, 'i').test(para));
          const isTreatment = TREATMENT_TRIGGERS.some(t => new RegExp(t, 'i').test(para));
          const isDemographics = idx === 0;
          let containerClass = 'text-gray-800';
          let borderClass = '';
          if (isDemographics) {
            containerClass = 'font-medium text-gray-900';
          } else if (isRecommendation) {
            borderClass = 'border-l-4 border-emerald-400 pl-3 bg-emerald-50 rounded-r-lg py-2 pr-2';
          } else if (isTreatment) {
            borderClass = 'border-l-4 border-blue-300 pl-3';
          }
          return (
            <p key={idx} className={`${containerClass} ${borderClass}`}>
              {isDemographics ? renderDemographics(para) : highlightParagraph(para)}
            </p>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4 print:space-y-3">
      {sections.map((section, si) => {
        const style = section.heading ? getSectionStyle(section.heading) : null;
        return (
          <div key={si} className="print:break-inside-avoid">
            {section.heading && style && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-l-4 ${style.border} ${style.bg} mb-1`}>
                <span className={`text-xs font-bold uppercase tracking-wide ${style.label}`}>
                  {section.heading}
                </span>
              </div>
            )}
            <div className={`space-y-1.5 ${section.heading && style ? `pl-3 border-l-4 ${style.border} border-opacity-30` : ''}`}>
              {section.paragraphs.map((para, pi) => {
                const isFirst = si === 0 && pi === 0;
                return (
                  <p key={pi} className={`text-sm leading-relaxed text-gray-800 ${isFirst ? 'font-medium' : ''}`}>
                    {isFirst ? renderDemographics(para) : highlightParagraph(para)}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Specially render the first demographics paragraph: highlight age+gender
function renderDemographics(text: string): React.ReactNode {
  // Match "63-year-old female" or "63 year old male" patterns
  const ageGenderRe = /(\d{1,3})[- ]year[- ]old\s+(male|female|man|woman|patient)/i;
  const match = text.match(ageGenderRe);
  if (!match) return <span className="font-semibold">{text}</span>;

  const before = text.slice(0, match.index ?? 0);
  const matched = match[0];
  const after = text.slice((match.index ?? 0) + matched.length);

  return (
    <>
      {before && <span className="font-semibold">{before}</span>}
      <span className="inline-flex items-baseline gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-[0.9em]">
        {matched}
      </span>
      {after && <span className="font-semibold">{after}</span>}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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
  // Explicit regeneration guard: must confirm before overwriting existing report
  const [regenerateConfirm, setRegenerateConfirm] = useState(false);

  // ─── Fetch case ──────────────────────────────────────────────────────────
  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const res = await apiFetch(`/cases/${id}`);
      if (!res.ok) throw new Error('Failed to fetch case');
      return res.json();
    },
    enabled: !!id,
  });

  // Restore draft from server on first load — never overwrite local edits
  useEffect(() => {
    if (caseData?.dischargeReport?.draft && !reportText) {
      setReportText(caseData.dischargeReport.draft);
    }
  }, [caseData?.dischargeReport?.draft]);

  const isFinalized = caseData?.dischargeReport?.finalized === true;
  const hasReport = reportText.trim().length > 0;

  // ─── AI Action ───────────────────────────────────────────────────────────
  const aiActionMutation = useMutation({
    mutationFn: async (action: 'generate' | 'improve' | 'shorten') => {
      const res = await apiFetch(`/cases/${id}/discharge-report/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          // Always send current frontend text so manual edits are preserved
          currentText: reportText || undefined,
        }),
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
      setRegenerateConfirm(false);
      queryClient.invalidateQueries({ queryKey: ['case', id] });
    },
    onError: (err: Error) => {
      alert(err.message);
      setRegenerateConfirm(false);
    },
  });

  // ─── Save draft ──────────────────────────────────────────────────────────
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

  // ─── Finalize ────────────────────────────────────────────────────────────
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

  const handlePrint = useCallback(() => window.print(), []);

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

  const isPending = aiActionMutation.isPending;
  const activeAction = aiActionMutation.variables;

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

        {/* ── AI Tools Panel ── */}
        {!isFinalized && (
          <Card className="print:hidden">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                {t('discharge.aiActions', 'AI Report Tools')}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                {hasReport
                  ? t('discharge.aiActionsHint', 'Improve or shorten the existing report. Your edits are preserved.')
                  : t('discharge.aiActionsHintEmpty', 'Generate a report using all available case data.')}
              </p>

              <div className="flex flex-wrap gap-3">
                {/* ── No report yet: show Generate button ── */}
                {!hasReport && (
                  <button
                    onClick={() => aiActionMutation.mutate('generate')}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
                  >
                    {isPending && activeAction === 'generate' ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {t('discharge.generateFull', 'Generate Full Report')}
                  </button>
                )}

                {/* ── Report exists: Improve + Shorten ── */}
                {hasReport && (
                  <>
                    <button
                      onClick={() => aiActionMutation.mutate('improve')}
                      disabled={isPending}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
                    >
                      {isPending && activeAction === 'improve' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      {t('discharge.improveLanguage', 'Improve Medical Language')}
                    </button>

                    <button
                      onClick={() => aiActionMutation.mutate('shorten')}
                      disabled={isPending}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition disabled:opacity-60"
                    >
                      {isPending && activeAction === 'shorten' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <AlignLeft className="w-4 h-4" />
                      )}
                      {t('discharge.shortenReport', 'Shorten Report')}
                    </button>

                    {/* ── Explicit Regenerate (destructive — confirmation required) ── */}
                    {!regenerateConfirm ? (
                      <button
                        onClick={() => setRegenerateConfirm(true)}
                        disabled={isPending}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 text-sm font-semibold shadow-sm transition disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        {t('discharge.regenerate', 'Regenerate from Scratch')}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-medium text-amber-800">
                          {t('discharge.regenerateWarning', 'This will replace the current report.')}
                        </span>
                        <button
                          onClick={() => aiActionMutation.mutate('generate')}
                          disabled={isPending}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition"
                        >
                          {isPending && activeAction === 'generate'
                            ? t('discharge.generating', 'Generating...')
                            : t('discharge.confirmRegenerate', 'Yes, Regenerate')}
                        </button>
                        <button
                          onClick={() => setRegenerateConfirm(false)}
                          className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition"
                        >
                          {t('discharge.cancel', 'Cancel')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {isPending && (
                <p className="mt-3 text-xs text-indigo-600 animate-pulse flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  {activeAction === 'improve'
                    ? t('discharge.aiImproving', 'Improving medical language...')
                    : activeAction === 'shorten'
                    ? t('discharge.aiShortening', 'Creating concise version...')
                    : t('discharge.aiGenerating', 'Generating discharge report...')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Report Card ── */}
        <Card>
          <CardContent className="p-6 space-y-4">

            {/* Card header */}
            <div className="flex items-center justify-between print:hidden">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-blue-600" />
                {t('discharge.reportCardTitle', 'Discharge Report')}
              </h2>
              {!isFinalized && hasReport && (
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1 rounded-md hover:bg-gray-100 transition"
                      >
                        {t('discharge.cancelEdit', 'Cancel')}
                      </button>
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
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section count badge */}
            {hasReport && !isEditing && (
              <div className="flex items-center gap-2 text-xs text-gray-400 pb-1 border-b border-gray-100 print:hidden">
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold">
                  {t('discharge.structuredReport', 'Structured Discharge Record')}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700">
                  {t('discharge.legendValues', 'Clinical Values')}
                </span>
                <span className="font-semibold text-gray-700">{t('discharge.legendDx', 'Diagnosis Terms')}</span>
              </div>
            )}

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

            {/* Content */}
            {hasReport ? (
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
                  className="bg-white rounded-xl p-5 border border-gray-200 min-h-[320px] print:border-0 print:p-0"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <MedicalReportRenderer text={reportText} />
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
            {hasReport && (
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

          {!isFinalized && hasReport && (
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
