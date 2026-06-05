import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Plus, Search, Globe, User, Clock, FileText, LogOut, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { clearSession, hasRole } from '@/lib/auth';

function DashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'he';

  // Language toggle function
  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/doctor/login', { replace: true });
  };

  // Fetch cases from API
  const { data: casesResponse, isLoading, error } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const response = await apiFetch('/cases');
      if (!response.ok) throw new Error('Failed to fetch cases');
      return response.json();
    }
  });

  const cases = casesResponse?.cases || [];

  // "Open" tab shows every non-terminal case (open, in_progress, tests_ordered).
  // "Closed" tab shows finalized + cancelled cases. This matches the new workflow
  // where ordering tests does not close a case.
  const OPEN_STATUSES = ['open', 'in_progress', 'tests_ordered'];
  const CLOSED_STATUSES = ['closed', 'cancelled'];

  const filteredCases = cases.filter((caseItem: any) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      caseItem.patientName?.toLowerCase().includes(searchLower) ||
      caseItem.nationalId?.includes(searchTerm);
    const status = caseItem.status || 'open';
    const matchesTab =
      activeTab === 'open' ? OPEN_STATUSES.includes(status) : CLOSED_STATUSES.includes(status);
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'awaiting_vitals': return 'bg-emerald-100 text-emerald-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-indigo-100 text-indigo-800';
      case 'tests_ordered': return 'bg-amber-100 text-amber-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'awaiting_vitals': return t('dashboard.status.awaiting_vitals', 'Awaiting vitals');
      case 'open': return t('dashboard.status.open', 'Open');
      case 'in_progress': return t('dashboard.status.in_progress', 'In progress');
      case 'tests_ordered': return t('dashboard.status.tests_ordered', 'Tests ordered');
      case 'closed': return t('dashboard.status.closed', 'Closed');
      case 'cancelled': return t('dashboard.status.cancelled', 'Cancelled');
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = isRTL ? 'he-IL' : 'en-US';
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const deleteCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      const response = await apiFetch(`/cases/${caseId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || 'Failed to delete case');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (err: Error) => {
      alert(`${t('dashboard.actions.deleteError', 'Failed to delete case')}\n\n${err.message}`);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loading', 'Loading cases...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{t('dashboard.error', 'Error loading cases')}</p>
          <Button onClick={() => window.location.reload()}>
            {t('dashboard.retry', 'Retry')}
          </Button>
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
              <Shield className="w-8 h-8 text-blue-600 shrink-0" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t('dashboard.title', "Doctor's Dashboard")}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {t('dashboard.subtitle', 'Search and manage medical cases')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={String(isRTL ? t('language.switchToEnglish') : t('language.switchToHebrew'))}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Globe className="w-4 h-4" />
                <span>{isRTL ? 'EN' : 'עִבְרִית'}</span>
              </button>
              {hasRole('admin') && (
                <Button
                  onClick={() => navigate('/admin')}
                  variant="outline"
                  className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Staff</span>
                </Button>
              )}
              <Button
                onClick={() => navigate('/patient')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>{t('dashboard.actions.newCase', 'New Case')}</span>
              </Button>
              <button
                type="button"
                onClick={handleLogout}
                aria-label={t('dashboard.actions.logout', 'Log out')}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('dashboard.actions.logout', 'Log out')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs + Search */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 rounded-lg border border-gray-200 overflow-hidden bg-white w-full sm:w-64">
            <button
              onClick={() => setActiveTab('open')}
              className={`px-4 py-2 text-sm font-semibold ${
                activeTab === 'open' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('dashboard.tabs.open', 'Open')}
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`px-4 py-2 text-sm font-semibold ${
                activeTab === 'closed' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('dashboard.tabs.closed', 'Closed')}
            </button>
          </div>
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
            <Input
              type="text"
              placeholder={t('dashboard.search.placeholder', 'Search by patient name or ID...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={isRTL ? 'pr-10' : 'pl-10'}
              aria-label={t('dashboard.search.placeholder', 'Search by patient name or ID')}
            />
          </div>
        </div>

        {/* Cases Table OR Empty State */}
        {filteredCases.length > 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.table.patientName', 'Patient Name')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        {t('dashboard.table.id', 'ID')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.table.status', 'Status')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        {t('dashboard.table.receptionDate', 'Reception Date')}
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.table.actions', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCases.map((caseItem: any) => (
                      <tr key={caseItem._id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center me-3 shrink-0">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {caseItem.patientName || t('dashboard.unknownPatient', 'Unknown Patient')}
                              </div>
                              <div className="text-xs text-gray-500 md:hidden">
                                {caseItem.nationalId || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">
                          {caseItem.nationalId || '—'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                            {getStatusText(caseItem.status)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 me-2" />
                            {formatDate(caseItem.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              onClick={() => navigate(`/doctor/case/${caseItem._id}`)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="hidden sm:inline">{t('dashboard.actions.openFile', 'Open File')}</span>
                            </Button>
                            <Button
                              onClick={() => {
                                const confirmed = window.confirm(
                                  t('dashboard.actions.deleteConfirm', 'Delete this case? This cannot be undone.')
                                );
                                if (confirmed) {
                                  deleteCaseMutation.mutate(caseItem._id);
                                }
                              }}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              disabled={deleteCaseMutation.isPending}
                            >
                              {t('dashboard.actions.delete', 'Delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="text-center py-16">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('dashboard.empty.title', 'No cases found')}
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                {searchTerm
                  ? t('dashboard.empty.noMatch', 'No cases match your current search criteria.')
                  : activeTab === 'open'
                    ? t('dashboard.empty.noOpen', 'No open cases right now. New cases will appear here.')
                    : t('dashboard.empty.noClosed', 'No closed or cancelled cases yet.')}
              </p>
              <Button
                onClick={() => navigate('/patient')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>{t('dashboard.actions.newCase', 'New Case')}</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>{t('footer.copyright', '© Swifty Medical 2025. All rights reserved.')}</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;