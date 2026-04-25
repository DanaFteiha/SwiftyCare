import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ScanPage from './pages/ScanPage'
import QuestionnairePage from './pages/QuestionnairePage'
import VitalsEntryPage from './pages/VitalsEntryPage'
import DashboardPage from './pages/DashboardPage'
import CasePage from './pages/CasePage'
import DischargeReportPage from './pages/DischargeReportPage'
import DoctorLoginPage from './pages/DoctorLoginPage'
import DoctorRoute from './components/DoctorRoute'
import NurseLoginPage from './pages/NurseLoginPage'
import NurseDashboardPage from './pages/NurseDashboardPage'
import NurseRoute from './components/NurseRoute'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Patient entry points */}
            <Route path="/" element={<ScanPage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/patient" element={<ScanPage />} />
            <Route path="/questionnaire/:caseId" element={<QuestionnairePage />} />
            <Route path="/patient/questionnaire/:caseId" element={<QuestionnairePage />} />

            {/* Triage (legacy / direct links) */}
            <Route path="/vitals/:caseId" element={<VitalsEntryPage />} />
            <Route path="/triage/vitals/:caseId" element={<VitalsEntryPage />} />

            {/* Nurse */}
            <Route path="/nurse/login" element={<NurseLoginPage />} />
            <Route
              path="/nurse"
              element={
                <NurseRoute>
                  <NurseDashboardPage />
                </NurseRoute>
              }
            />
            <Route
              path="/nurse/case/:caseId/vitals"
              element={
                <NurseRoute>
                  <VitalsEntryPage />
                </NurseRoute>
              }
            />

            {/* Doctor */}
            <Route path="/doctor/login" element={<DoctorLoginPage />} />
            <Route
              path="/doctor"
              element={
                <DoctorRoute>
                  <DashboardPage />
                </DoctorRoute>
              }
            />
            <Route
              path="/doctor/case/:id"
              element={
                <DoctorRoute>
                  <CasePage />
                </DoctorRoute>
              }
            />
            <Route
              path="/doctor/case/:id/discharge-report"
              element={
                <DoctorRoute>
                  <DischargeReportPage />
                </DoctorRoute>
              }
            />
            <Route path="/dashboard" element={<DoctorRoute><DashboardPage /></DoctorRoute>} />
            <Route path="/case/:id" element={<DoctorRoute><CasePage /></DoctorRoute>} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App