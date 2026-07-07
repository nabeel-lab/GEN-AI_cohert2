import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
import ResultsPage from './pages/ResultsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ConsultantPage from './pages/ConsultantPage'
import ProductTour from './components/ProductTour'

export default function App() {
  const location = useLocation()

  return (
    <>
      <ProductTour />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/"         element={<LandingPage />} />
          <Route path="/analyze"  element={<AnalysisPage />} />
          <Route path="/results"  element={<ResultsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/consultant" element={<ConsultantPage />} />
          {/* Catch-all: redirect unknown routes back to home */}
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
