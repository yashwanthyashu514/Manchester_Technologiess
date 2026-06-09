import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/services', label: 'Services' },
  { path: '/internships', label: 'Internships' },
  { path: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogoClick = (e) => {
    e.preventDefault()
    window.logoClicks = (window.logoClicks || 0) + 1

    if (window.logoClickTimer) {
      clearTimeout(window.logoClickTimer)
    }

    if (window.logoClicks === 3) {
      window.logoClicks = 0
      navigate('/admin/internships')
    } else {
      window.logoClickTimer = setTimeout(() => {
        window.logoClicks = 0
        navigate('/')
      }, 500)
    }
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on route changes
  useEffect(() => {
    setIsOpen(false)
  }, [location.pathname])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-background/90 backdrop-blur-lg border-b border-white/5'
          : 'bg-transparent'
      }`}
    >
      <div className="section-padding max-w-7xl mx-auto">

        {/* 🔥 MAIN WRAPPER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4">

          {/* ✅ TOP BAR (Logo + Controls) */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div onClick={handleLogoClick} className="flex items-center gap-2 cursor-pointer">
              <img
                src="/logo.jpeg"
                alt="Manchester Technology Logo"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <span className="font-heading font-bold text-xl tracking-tight">
                Manchester<span className="text-accent">Tech</span>
              </span>
            </div>

            {/* Mobile Controls (Start Button + Hamburger Toggle) */}
            <div className="flex items-center gap-3 md:hidden">
              <Link to="/contact">
                <button className="glow-button text-xs px-4 py-2">
                  Start
                </button>
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-text-secondary hover:text-text-primary focus:outline-none transition-colors"
                aria-label="Toggle Menu"
              >
                {isOpen ? <X className="w-6 h-6 text-accent" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* ✅ NAV LINKS (DESKTOP) */}
          <div className="hidden md:flex justify-center items-center gap-6 mt-4 md:mt-0">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-3 py-1.5 text-sm font-medium transition-colors duration-200 rounded-lg ${
                  location.pathname === link.path
                    ? 'text-accent'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {link.label}

                {location.pathname === link.path && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-accent/10 rounded-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* ✅ DESKTOP BUTTON */}
          <div className="hidden md:block">
            <Link to="/contact">
              <button className="glow-button text-sm px-6 py-2.5">
                Start Your Project
              </button>
            </Link>
          </div>

        </div>
      </div>

      {/* ✅ MOBILE DRAWER MENU */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-white/5 overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className={`block py-2 text-lg font-medium transition-colors duration-200 ${
                      location.pathname === link.path
                        ? 'text-accent border-l-2 border-accent pl-3'
                        : 'text-text-secondary hover:text-text-primary pl-3'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
                className="pt-4 border-t border-white/5"
              >
                <Link to="/contact" className="w-full">
                  <button className="glow-button w-full py-3 text-sm">
                    Start Your Project
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}