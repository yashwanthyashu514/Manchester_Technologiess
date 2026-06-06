import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  FileBadge, 
  Download, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Clock,
  Github,
  BookOpen,
  UserCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'

export default function InternshipStatus() {
  const [email, setEmail] = useState('')
  const [appId, setAppId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!email || !appId) return

    setIsLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch('/api/internships/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          application_id: appId.trim()
        })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch application status.')
      }

      setData(result)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Verification failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle selection redirect to Intern Dashboard (logs in by generating JWT)
  const handleInternLogin = async () => {
    setIsLoggingIn(true)
    try {
      const res = await fetch('/api/auth/intern-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          application_id: appId.trim()
        })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to log in to dashboard.')
      }

      // Save token & user
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))

      // Navigate to Intern Dashboard
      navigate('/internships/dashboard')
    } catch (err) {
      alert(err.message || 'Failed to initialize intern session.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'Under Review': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'Shortlisted': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'Interview Scheduled': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'Selected': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'Rejected': return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'Active Intern': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
      case 'Completed': return 'text-green-400 bg-green-400/10 border-green-400/20'
      default: return 'text-text-muted bg-white/5 border-white/10'
    }
  }

  return (
    <main className="pt-20">
      <section className="section-padding py-16 max-w-4xl mx-auto">
        
        {/* Title */}
        <AnimatedSection className="text-center mb-10">
          <span className="text-accent text-xs font-semibold tracking-wider uppercase bg-accent/10 px-3 py-1.5 rounded-md">
            Candidate Portal
          </span>
          <h1 className="heading-lg mt-4 mb-2">Track Application Status</h1>
          <p className="body-md text-text-secondary">
            Enter your details to track interview details, projects, and download completion certificates.
          </p>
        </AnimatedSection>

        {/* Input Form */}
        <AnimatedSection>
          <div className="glass-card p-6 md:p-8 border border-white/5 mb-8">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Registered Email Address</label>
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Application ID</label>
                <input 
                  type="text" required value={appId} onChange={(e) => setAppId(e.target.value)}
                  placeholder="MTI-2026-0001"
                  className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <button 
                  type="submit" disabled={isLoading}
                  className="w-full glow-button py-3 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  Search
                </button>
              </div>
            </form>
          </div>
        </AnimatedSection>

        {/* Error Alert */}
        {error && (
          <AnimatedSection>
            <div className="bg-red-950/20 border border-red-500/30 p-5 rounded-xl text-red-400 text-sm flex gap-3 mb-8">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-1">Search Failed</strong>
                <p>{error}</p>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Data Output Display */}
        {data && (
          <AnimatedSection>
            <div className="space-y-6">
              
              {/* Application Details */}
              <div className="glass-card p-6 md:p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
                  <div>
                    <span className="text-xs text-text-muted uppercase block">Applicant Profile</span>
                    <h2 className="text-xl font-heading font-bold text-white mt-1">{data.application.full_name}</h2>
                    <span className="text-xs text-text-secondary mt-1 block">ID: {data.application.application_id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">Status:</span>
                    <span className={`px-4 py-1.5 rounded-full border text-xs font-bold ${getStatusColor(data.application.status)}`}>
                      {data.application.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-background/40 p-4 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Specialization</span>
                    <span className="text-sm font-semibold text-white">{data.application.preferred_domain}</span>
                  </div>

                  <div className="bg-background/40 p-4 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Preferred Duration</span>
                    <span className="text-sm font-semibold text-white">{data.application.preferred_duration}</span>
                  </div>

                  <div className="bg-background/40 p-4 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Date Submitted</span>
                    <span className="text-sm font-semibold text-white">
                      {new Date(data.application.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Specific Cards */}
              
              {/* INTERVIEW SCHEDULE CARD */}
              {data.application.status === 'Interview Scheduled' && data.interview && (
                <div className="glass-card p-6 md:p-8 border border-blue-500/20 bg-blue-950/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
                  
                  <h3 className="font-heading font-bold text-blue-400 text-lg mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Interview Schedule Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-text-secondary text-sm">
                        <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Date & Time: <strong>{data.interview.interview_date}</strong> at <strong>{data.interview.interview_time}</strong></span>
                      </div>

                      <div className="flex items-center gap-3 text-text-secondary text-sm">
                        <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Venue: <strong>{data.interview.venue}</strong></span>
                      </div>
                    </div>

                    {data.interview.online_link && (
                      <div className="flex flex-col justify-center">
                        <a 
                          href={data.interview.online_link} target="_blank" rel="noreferrer"
                          className="flex items-center justify-center gap-2 bg-blue-500 text-white font-bold p-3 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          <LinkIcon className="w-4 h-4" /> Join Online Meeting
                        </a>
                      </div>
                    )}
                  </div>

                  {data.interview.instructions && (
                    <div className="bg-background/80 border border-blue-500/10 p-4 rounded-lg text-xs text-text-secondary leading-relaxed">
                      <strong className="block text-blue-400 mb-1">Candidate Instructions:</strong>
                      {data.interview.instructions}
                    </div>
                  )}
                </div>
              )}

              {/* SELECTED OR ACTIVE INTERN CARD */}
              {['Selected', 'Active Intern'].includes(data.application.status) && (
                <div className="glass-card p-6 md:p-8 border border-accent/20 bg-accent/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
                  
                  <h3 className="font-heading font-bold text-accent text-lg mb-2 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" /> Internship Access Granted!
                  </h3>
                  
                  <p className="text-xs text-text-secondary mb-6 max-w-xl">
                    Congratulations! Your application has been approved. You have been assigned to development tasks. Click below to launch your personal intern dashboard.
                  </p>

                  <button
                    onClick={handleInternLogin}
                    disabled={isLoggingIn}
                    className="glow-button flex items-center gap-2 px-8 py-3 text-xs"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Starting Dashboard...
                      </>
                    ) : (
                      <>
                        Access Intern Dashboard <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* COMPLETED CARD (Certificate Download) */}
              {data.application.status === 'Completed' && data.certificate && (
                <div className="glass-card p-6 md:p-8 border border-green-500/20 bg-green-950/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
                  
                  <h3 className="font-heading font-bold text-green-400 text-lg mb-2 flex items-center gap-2">
                    <FileBadge className="w-5 h-5" /> Internship Completed Successfully!
                  </h3>
                  
                  <p className="text-xs text-text-secondary mb-6 max-w-xl">
                    Congratulations on successfully completing your internship project. Your certificate is verified and available for download.
                  </p>

                  <div className="flex flex-wrap gap-4 items-center">
                    <a 
                      href={`/api/internships/certificate/download/${data.certificate.certificate_number}`}
                      className="glow-button flex items-center gap-2 px-8 py-3 text-xs"
                    >
                      <Download className="w-4 h-4" /> Download PDF Certificate
                    </a>
                    
                    <span className="text-xs text-text-muted">
                      Certificate No: <strong>{data.certificate.certificate_number}</strong>
                    </span>
                  </div>
                </div>
              )}

            </div>
          </AnimatedSection>
        )}

      </section>
    </main>
  )
}
