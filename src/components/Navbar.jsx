import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/services', label: 'Services' },
  { path: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

          {/* ✅ TOP BAR (Logo + Button) */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.jpeg"
                alt="Manchester Technology Logo"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <span className="font-heading font-bold text-xl tracking-tight">
                Manchester<span className="text-accent">Tech</span>
              </span>
            </Link>

            {/* Button visible on mobile also */}
            <div className="md:hidden">
              <Link to="/contact">
                <button className="glow-button text-xs px-4 py-2">
                  Start
                </button>
              </Link>
            </div>
          </div>

          {/* ✅ NAV LINKS (ALWAYS VISIBLE) */}
          <div className="flex justify-center items-center gap-6 mt-4 md:mt-0">
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
    </motion.nav>
  )
}