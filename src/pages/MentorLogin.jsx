import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

export default function MentorLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (token && user.role === 'mentor') {
      navigate('/mentor/dashboard')
    }
  }, [navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/mentor-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      navigate('/mentor/dashboard')
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="pt-28 pb-20 min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background visual effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <section className="section-padding max-w-md w-full relative z-10 mx-auto">
        <AnimatedSection>
          <div className="glass-card p-8 border border-white/5 relative overflow-hidden bg-white/[0.02] backdrop-blur-xl rounded-2xl shadow-2xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/20">
                <Lock className="w-6 h-6 text-accent" />
              </div>
              <h1 className="heading-md text-white font-heading font-bold text-2xl">Mentor Portal</h1>
              <p className="text-xs text-text-secondary mt-2">Manchester Technologies Internship Mentorship</p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-950/20 border border-red-500/30 p-4 rounded-xl text-xs text-red-400 mb-6 flex gap-3 items-start"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Mentor Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-text-muted absolute left-3 top-3.5" />
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-accent focus:outline-none text-sm transition-all focus:ring-1 focus:ring-accent/20"
                    placeholder="mentor@manchestertechnologies.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Secure Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-text-muted absolute left-3 top-3.5" />
                  <input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-accent focus:outline-none text-sm transition-all focus:ring-1 focus:ring-accent/20"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full glow-button py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Authenticate Portal Session
              </button>
            </form>

            <div className="text-center mt-6">
              <span className="text-[10px] text-text-muted uppercase tracking-wider">Manchester Technologies Onboarding System v2.0</span>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </main>
  )
}
