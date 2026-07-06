import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
import ResultsPage from './pages/ResultsPage'
import AnalyticsPage from './pages/AnalyticsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/"         element={<LandingPage />} />
      <Route path="/analyze"  element={<AnalysisPage />} />
      <Route path="/results"  element={<ResultsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      {/* Catch-all: redirect unknown routes back to home */}
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  )
}
