import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Plus, Search, Globe, User, Clock, FileText } from 'lucide-react';
import { apiFetch } from '@/lib/api';

function DashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const queryClient = useQueryClient();

  // Language toggle function
  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
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

  const filteredCases = cases.filter((caseItem: any) => {
    const matchesSearch = caseItem.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.nationalId?.includes(searchTerm);
    const matchesTab = activeTab === 'open' ? caseItem.status === 'open' : caseItem.status === 'closed';
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return t('dashboard.status.open', 'Open');
      case 'closed': return t('dashboard.status.closed', 'Closed');
      case 'cancelled': return t('dashboard.status.cancelled', 'Cancelled');
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
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
    <div className="min-h-screen bg-gray-50" dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('dashboard.title', 'Doctor\'s Dashboard')}
                </h1>
                <p className="text-sm text-gray-600">
                  {t('dashboard.subtitle', 'Search and manage medical cases')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>{i18n.language === 'he' ? 'EN' : 'עִבְרִית'}</span>
              </button>
              <Button
                onClick={() => navigate('/patient')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>{t('dashboard.actions.newCase', 'New Case')}</span>
              </Button>
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={t('dashboard.search.placeholder', 'Search by patient name or ID...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cases Table */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.table.patientName', 'Patient Name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.table.id', 'ID')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.table.status', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.table.receptionDate', 'Reception Date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('dashboard.table.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCases.map((caseItem: any) => (
                    <tr key={caseItem._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {caseItem.patientName || 'Unknown Patient'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {caseItem.nationalId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(caseItem.status)}`}>
                          {getStatusText(caseItem.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          {formatDate(caseItem.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => navigate(`/doctor/case/${caseItem._id}`)}
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1"
                          >
                            <FileText className="w-4 h-4" />
                            <span>{t('dashboard.actions.openFile', 'Open File')}</span>
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

        {/* Empty State */}
        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('dashboard.empty.title', 'No cases found')}
            </h3>
            <p className="text-gray-500 mb-4">
              {t('dashboard.empty.description', 'No cases match your current search criteria.')}
            </p>
            <Button
              onClick={() => navigate('/patient')}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>{t('dashboard.actions.newCase', 'New Case')}</span>
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>© Swifty Medical 2025. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;