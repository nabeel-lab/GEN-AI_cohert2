import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import AnalysisPage from './pages/AnalysisPage'
import ResultsPage from './pages/ResultsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ConsultantPage from './pages/ConsultantPage'
import ProjectsPage from './pages/ProjectsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProductTour from './components/ProductTour'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const location = useLocation()

    return (
      <AuthProvider>
        <ProductTour />
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
            <Route path="/analyze/:projectId"  element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
            <Route path="/results/:projectId"  element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/consultant" element={<ProtectedRoute><ConsultantPage /></ProtectedRoute>} />
            {/* Catch-all: redirect unknown routes back to home */}
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </AuthProvider>
    )
}
