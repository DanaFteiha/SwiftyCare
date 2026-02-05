import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ScanPage from './pages/ScanPage'
import QuestionnairePage from './pages/QuestionnairePage'
import VitalsEntryPage from './pages/VitalsEntryPage'
import DashboardPage from './pages/DashboardPage'
import CasePage from './pages/CasePage'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<ScanPage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/questionnaire/:caseId" element={<QuestionnairePage />} />
            <Route path="/vitals/:caseId" element={<VitalsEntryPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/case/:id" element={<CasePage />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App