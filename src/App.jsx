import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import CursorGlow from './components/CursorGlow'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import HeroDataNetwork from './hero-variants/HeroDataNetwork'

// Internship Portal Pages Imports
import InternshipsLanding from './pages/InternshipsLanding'
import InternshipApply from './pages/InternshipApply'
import InternshipStatus from './pages/InternshipStatus'
import AdminInternships from './pages/AdminInternships'
import InternDashboard from './pages/InternDashboard'
import VerifyCertificate from './pages/VerifyCertificate'
import TermsAcceptance from './pages/TermsAcceptance'
import DigitalSignature from './pages/DigitalSignature'
import AdminViewSignedTc from './pages/AdminViewSignedTc'

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
}

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  )
}

function App() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background text-text-primary font-body overflow-x-hidden relative">
      {location.pathname === '/' && <HeroDataNetwork />}
      <CursorGlow />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <AnimatedPage>
                <Home />
              </AnimatedPage>
            }
          />
          <Route
            path="/about"
            element={
              <AnimatedPage>
                <About />
              </AnimatedPage>
            }
          />
          <Route
            path="/services"
            element={
              <AnimatedPage>
                <Services />
              </AnimatedPage>
            }
          />
          <Route
            path="/contact"
            element={
              <AnimatedPage>
                <Contact />
              </AnimatedPage>
            }
          />
          {/* Internship Portal Routes */}
          <Route
            path="/internships"
            element={
              <AnimatedPage>
                <InternshipsLanding />
              </AnimatedPage>
            }
          />
          <Route
            path="/internships/apply"
            element={
              <AnimatedPage>
                <InternshipApply />
              </AnimatedPage>
            }
          />
          <Route
            path="/internships/status"
            element={
              <AnimatedPage>
                <InternshipStatus />
              </AnimatedPage>
            }
          />
          <Route
            path="/admin/internships"
            element={
              <AnimatedPage>
                <AdminInternships />
              </AnimatedPage>
            }
          />
          <Route
            path="/internships/dashboard"
            element={
              <AnimatedPage>
                <InternDashboard />
              </AnimatedPage>
            }
          />
          <Route
            path="/internships/verify-certificate/:certificateNumber"
            element={
              <AnimatedPage>
                <VerifyCertificate />
              </AnimatedPage>
            }
          />
          <Route
            path="/internships/terms-acceptance"
            element={
              <AnimatedPage>
                <TermsAcceptance />
              </AnimatedPage>
            }
          />
          <Route
            path="/internships/digital-signature"
            element={
              <AnimatedPage>
                <DigitalSignature />
              </AnimatedPage>
            }
          />
          <Route
            path="/admin/view-signed-tc/:id"
            element={
              <AnimatedPage>
                <AdminViewSignedTc />
              </AnimatedPage>
            }
          />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  )
}

export default App
