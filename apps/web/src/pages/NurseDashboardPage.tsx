import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Stethoscope,
  Search,
  Globe,
  User,
  Clock,
  Activity,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { clearSession } from '@/lib/auth';

function NurseDashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'awaiting' | 'done'>('awaiting');

  const toggleLanguage = () => {
    i18n.changeLanguage(isRTL ? 'en' : 'he');
  };

  const handleLogout = () => {
    clearSession();
    navigate('/nurse/login', { replace: true });
  };

  const { data: casesResponse, isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const response = await apiFetch('/cases');
      if (!response.ok) throw new Error('Failed to fetch cases');
      return response.json();
    },
    refetchInterval: 15_000, // poll so the nurse sees new arrivals
  });

  const cases = casesResponse?.cases || [];

  const filteredCases = cases.filter((c: any) => {
    const status = c.status || 'awaiting_vitals';
    const matchesTab =
      activeTab === 'awaiting'
        ? status === 'awaiting_vitals'
        : status !== 'awaiting_vitals' && status !== 'cancelled';
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      c.patientName?.toLowerCase().includes(searchLower) ||
      c.nationalId?.includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = isRTL ? 'he-IL' : 'en-US';
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const minutesSince = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    return Math.max(0, Math.floor(diff / 60_000));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('nurseDashboard.loading', 'Loading triage queue...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('nurseDashboard.error', 'Could not load cases.')}</p>
          <Button onClick={() => window.location.reload()}>{t('common.retry', 'Retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t('nurseDashboard.title', 'Triage Board')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {t(
                    'nurseDashboard.subtitle',
                    'Patients waiting for vital signs to be recorded',
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={String(isRTL ? t('language.switchToEnglish') : t('language.switchToHebrew'))}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Globe className="w-4 h-4" />
                <span>{isRTL ? 'EN' : 'עִבְרִית'}</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                aria-label={t('nurseDashboard.actions.logout', 'Log out')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t('nurseDashboard.actions.logout', 'Log out')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs + Search */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden bg-white w-full sm:w-72">
            <button
              type="button"
              onClick={() => setActiveTab('awaiting')}
              className={`px-4 py-2 text-sm font-semibold ${
                activeTab === 'awaiting'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nurseDashboard.tabs.awaiting', 'Awaiting vitals')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('done')}
              className={`px-4 py-2 text-sm font-semibold ${
                activeTab === 'done'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('nurseDashboard.tabs.done', 'Sent to doctor')}
            </button>
          </div>
          <div className="relative flex-1">
            <Search
              className={`absolute ${
                isRTL ? 'right-3' : 'left-3'
              } top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`}
            />
            <Input
              type="text"
              placeholder={t('nurseDashboard.search.placeholder', 'Search by name or ID...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={isRTL ? 'pr-10' : 'pl-10'}
              aria-label={t('nurseDashboard.search.placeholder', 'Search by name or ID')}
            />
          </div>
        </div>

        {/* Cases */}
        {filteredCases.length > 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('nurseDashboard.table.patient', 'Patient')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        {t('nurseDashboard.table.id', 'ID')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        {t('nurseDashboard.table.arrived', 'Arrived')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('nurseDashboard.table.waiting', 'Waiting')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('nurseDashboard.table.actions', 'Action')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCases.map((c: any) => {
                      const minutes = minutesSince(c.createdAt);
                      const waitColor =
                        minutes >= 30
                          ? 'bg-red-100 text-red-800'
                          : minutes >= 15
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800';
                      const status = c.status || 'awaiting_vitals';
                      return (
                        <tr key={c._id} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center me-3 shrink-0">
                                <User className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {c.patientName ||
                                    t('nurseDashboard.unknownPatient', 'Unknown patient')}
                                </div>
                                <div className="text-xs text-gray-500 md:hidden">
                                  {c.nationalId || '—'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                            {c.nationalId || '—'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-gray-400 me-2" />
                              {formatDate(c.createdAt)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            {status === 'awaiting_vitals' ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${waitColor}`}
                              >
                                <Clock className="w-3 h-3" />
                                {t('nurseDashboard.minutes', '{{n}} min', { n: minutes })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                <CheckCircle2 className="w-3 h-3" />
                                {t('nurseDashboard.handedOff', 'Handed off')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                onClick={() =>
                                  navigate(`/nurse/case/${c._id}/vitals`, {
                                    state: { from: 'nurse' },
                                  })
                                }
                                size="sm"
                                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
                              >
                                <Activity className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                  {status === 'awaiting_vitals'
                                    ? t('nurseDashboard.actions.recordVitals', 'Record vitals')
                                    : t('nurseDashboard.actions.updateVitals', 'Update vitals')}
                                </span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="text-center py-16">
              <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('nurseDashboard.empty.title', 'No patients in the queue')}
              </h3>
              <p className="text-gray-500 text-sm">
                {searchTerm
                  ? t('nurseDashboard.empty.noMatch', 'No cases match your search.')
                  : activeTab === 'awaiting'
                  ? t(
                      'nurseDashboard.empty.noAwaiting',
                      'All caught up — no patients are currently waiting for triage.',
                    )
                  : t(
                      'nurseDashboard.empty.noDone',
                      'No cases have been handed off to the doctor yet.',
                    )}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>{t('footer.copyright', '© Swifty Medical 2025. All rights reserved.')}</p>
        </div>
      </div>
    </div>
  );
}

export default NurseDashboardPage;
