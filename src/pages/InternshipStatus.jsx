import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  CheckCircle2,
  XCircle,
  UserCheck,
  FileText,
  Star,
  Briefcase,
  RefreshCw,
  Mail,
  Hash,
  User,
  Award
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'

// All possible status stages in order
const STATUS_STAGES = [
  {
    key: 'Submitted',
    label: 'Submitted',
    description: 'Application received and registered in the system.',
    icon: FileText
  },
  {
    key: 'Under Review',
    label: 'Under Review',
    description: 'Our engineering team is reviewing your profile and credentials.',
    icon: Search
  },
  {
    key: 'Shortlisted',
    label: 'Shortlisted',
    description: 'You have been shortlisted for the next selection stage.',
    icon: Star
  },
  {
    key: 'Interview Scheduled',
    label: 'Interview',
    description: 'An interview has been scheduled. Check details below.',
    icon: Calendar
  },
  {
    key: 'Selected',
    label: 'Selected',
    description: 'Congratulations! You have been selected as an intern.',
    icon: UserCheck
  },
  {
    key: 'Active Intern',
    label: 'Active Intern',
    description: 'Project has been assigned. Access your intern workspace.',
    icon: Briefcase
  },
  {
    key: 'Completed',
    label: 'Completed',
    description: 'Internship completed. Certificate available for download.',
    icon: Award
  }
]

// Special terminal status (not part of the progress line)
const REJECTED_STATUS = {
  key: 'Rejected',
  label: 'Rejected',
  description: 'Unfortunately, your application was not selected at this time.',
  icon: XCircle
}

function StatusTimeline({ currentStatus }) {
  if (currentStatus === 'Rejected') {
    return (
      <div className="glass-card p-6 md:p-8 border border-red-500/20 bg-red-950/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-red-400 text-base">Application Not Selected</h3>
            <p className="text-xs text-text-secondary">We appreciate your interest in Manchester Technologies.</p>
          </div>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed pl-13 ml-1 border-l-2 border-red-500/20 pl-4">
          Unfortunately your application was not shortlisted in the current intake. We encourage you to strengthen your profile and reapply in a future batch. Thank you for your time.
        </p>
      </div>
    )
  }

  const currentIndex = STATUS_STAGES.findIndex(s => s.key === currentStatus)

  return (
    <div className="glass-card p-6 md:p-8 border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
      <h3 className="font-heading font-bold text-white text-sm mb-6 uppercase tracking-wider">Application Progress</h3>

      {/* Desktop: horizontal stepper */}
      <div className="hidden md:flex items-start relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/5" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-accent transition-all duration-700"
          style={{
            width: currentIndex >= 0
              ? `${(currentIndex / (STATUS_STAGES.length - 1)) * 100}%`
              : '0%'
          }}
        />

        {STATUS_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isPending = idx > currentIndex

          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center relative z-10">
              {/* Circle */}
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-3 transition-all duration-300 ${
                  isCompleted
                    ? 'border-accent bg-accent text-background'
                    : isCurrent
                    ? 'border-accent bg-accent/20 text-accent shadow-[0_0_16px_rgba(200,169,106,0.4)]'
                    : 'border-white/10 bg-background text-text-muted'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <stage.icon className="w-4 h-4" />
                )}
              </motion.div>

              {/* Label */}
              <span className={`text-[9px] font-bold uppercase tracking-wider text-center ${
                isCompleted || isCurrent ? 'text-white' : 'text-text-muted'
              }`}>
                {stage.label}
              </span>

              {/* Current stage description tooltip */}
              {isCurrent && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-14 left-1/2 -translate-x-1/2 w-36 bg-accent/10 border border-accent/20 rounded-lg p-2 text-center z-20"
                >
                  <span className="text-[9px] text-accent leading-tight block">◀ Current Stage ▶</span>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: vertical stepper */}
      <div className="flex md:hidden flex-col gap-0">
        {STATUS_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isLast = idx === STATUS_STAGES.length - 1

          return (
            <div key={stage.key} className="flex items-start gap-4">
              {/* Left: Icon + Connector */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? 'border-accent bg-accent text-background'
                    : isCurrent
                    ? 'border-accent bg-accent/20 text-accent shadow-[0_0_12px_rgba(200,169,106,0.4)]'
                    : 'border-white/10 bg-background text-text-muted'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <stage.icon className="w-3.5 h-3.5" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-8 mt-1 ${isCompleted ? 'bg-accent' : 'bg-white/5'}`} />
                )}
              </div>

              {/* Right: Text */}
              <div className="pb-6">
                <span className={`text-xs font-bold ${isCompleted || isCurrent ? 'text-white' : 'text-text-muted'}`}>
                  {stage.label}
                </span>
                {isCurrent && (
                  <p className="text-[10px] text-accent mt-0.5">{stage.description}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
    if (!email.trim() || !appId.trim()) return

    setIsLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch('/api/internships/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          application_id: appId.trim()
        })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'No application found with the provided Email Address and Application ID.')
      }

      setData(result)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Verification failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setData(null)
    setError(null)
    setEmail('')
    setAppId('')
  }

  // Intern dashboard login (only for Selected / Active Intern)
  const handleInternLogin = async () => {
    setIsLoggingIn(true)
    try {
      const res = await fetch('/api/auth/intern-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          application_id: appId.trim()
        })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to log in to dashboard.')
      }

      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      navigate('/internships/dashboard')
    } catch (err) {
      alert(err.message || 'Failed to initialize intern session.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const getStatusBadge = (status) => {
    const map = {
      'Submitted':           'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      'Pending':             'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
      'Under Review':        'text-orange-400 bg-orange-400/10 border-orange-400/20',
      'Shortlisted':         'text-purple-400 bg-purple-400/10 border-purple-400/20',
      'Interview Scheduled': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      'Selected':            'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      'Rejected':            'text-red-400 bg-red-400/10 border-red-400/20',
      'Active Intern':       'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
      'Completed':           'text-green-400 bg-green-400/10 border-green-400/20',
    }
    return map[status] || 'text-text-muted bg-white/5 border-white/10'
  }

  return (
    <main className="pt-20">
      <section className="section-padding py-16 max-w-4xl mx-auto">

        {/* Header */}
        <AnimatedSection className="text-center mb-10">
          <span className="text-accent text-xs font-semibold tracking-wider uppercase bg-accent/10 px-3 py-1.5 rounded-md">
            Candidate Portal
          </span>
          <h1 className="heading-lg mt-4 mb-2">Track Application Status</h1>
          <p className="body-md text-text-secondary max-w-xl mx-auto">
            Enter your registered email and Application ID to track your internship application status.
          </p>
        </AnimatedSection>

        {/* Search Form */}
        <AnimatePresence mode="wait">
          {!data ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="glass-card p-6 md:p-8 border border-white/5 mb-8">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Registered Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@example.com"
                      className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors text-sm"
                    />
                  </div>

                  <div className="md:col-span-5">
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" /> Application ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={appId}
                      onChange={(e) => setAppId(e.target.value.toUpperCase())}
                      placeholder="MT20260001"
                      className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors text-sm font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      id="track-application-btn"
                      className="w-full glow-button py-3 flex items-center justify-center gap-2"
                    >
                      {isLoading
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <Search className="w-5 h-5" />
                      }
                      <span className="hidden sm:inline">Search</span>
                    </button>
                  </div>
                </form>

                {/* Info tip */}
                <p className="text-[10px] text-text-muted mt-4 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-accent/60" />
                  Your Application ID (e.g., MT20260001) was sent to your email upon applying. Both fields must match the same application record.
                </p>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-950/20 border border-red-500/30 p-5 rounded-xl text-red-400 text-sm flex gap-3 mb-8"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-1">Verification Failed</strong>
                      <p className="text-xs">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* === APPLICATION DETAILS CARD === */}
              <div className="glass-card p-6 md:p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />

                {/* Header Row: Name + Status Badge */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b border-white/5">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">Application Profile</span>
                    <h2 className="text-2xl font-heading font-bold text-white mt-1">{data.application.full_name}</h2>
                    <span className="text-xs text-text-secondary font-mono mt-1 block">ID: {data.application.application_id}</span>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="text-[10px] text-text-muted uppercase">Current Status</span>
                    <span className={`px-4 py-1.5 rounded-full border text-xs font-bold ${getStatusBadge(data.application.status)}`}>
                      {data.application.status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { icon: User,       label: 'Applicant Name',     value: data.application.full_name },
                    { icon: Hash,       label: 'Application ID',      value: data.application.application_id, mono: true },
                    { icon: Mail,       label: 'Email Address',       value: data.application.email },
                    { icon: Briefcase,  label: 'Applied Position',    value: data.application.preferred_domain },
                    { icon: Calendar,   label: 'Date of Application', value: new Date(data.application.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
                    { icon: Clock,      label: 'Last Updated',        value: new Date(data.application.updated_at || data.application.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  ].map((item, i) => (
                    <div key={i} className="bg-background/40 p-4 rounded-xl border border-white/5 group hover:border-accent/20 transition-all">
                      <div className="flex items-center gap-1.5 mb-2">
                        <item.icon className="w-3.5 h-3.5 text-accent/70" />
                        <span className="text-[10px] text-text-muted uppercase tracking-wider">{item.label}</span>
                      </div>
                      <span className={`text-sm font-semibold text-white block truncate ${item.mono ? 'font-mono text-accent' : ''}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* === STATUS PROGRESS TIMELINE === */}
              <StatusTimeline currentStatus={data.application.status} />

              {/* === INTERVIEW DETAILS (when Interview Scheduled) === */}
              {data.application.status === 'Interview Scheduled' && data.interview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 md:p-8 border border-blue-500/20 bg-blue-950/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />

                  <h3 className="font-heading font-bold text-blue-400 text-base mb-5 flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Interview Schedule Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <span className="text-[10px] text-text-muted uppercase block">Date & Time</span>
                          <span className="text-sm font-semibold text-white">
                            {data.interview.interview_date} at {data.interview.interview_time}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <span className="text-[10px] text-text-muted uppercase block">Venue</span>
                          <span className="text-sm font-semibold text-white">{data.interview.venue}</span>
                        </div>
                      </div>
                    </div>

                    {data.interview.online_link && (
                      <div className="flex items-center">
                        <a
                          href={data.interview.online_link}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold p-3 rounded-xl transition-colors text-sm"
                        >
                          <LinkIcon className="w-4 h-4" /> Join Online Meeting
                        </a>
                      </div>
                    )}
                  </div>

                  {data.interview.instructions && (
                    <div className="mt-5 bg-background/60 border border-blue-500/10 p-4 rounded-xl text-xs text-text-secondary leading-relaxed">
                      <strong className="block text-blue-400 mb-2">Candidate Instructions:</strong>
                      {data.interview.instructions}
                    </div>
                  )}
                </motion.div>
              )}
              {/* === SELECTED / ACTIVE INTERN CARD === */}
              {['Selected', 'Active Intern'].includes(data.application.status) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 md:p-8 border border-accent/20 bg-accent/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

                  {data.application.status === 'Selected' && !data.application.termsAccepted ? (
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                          <UserCheck className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-accent text-lg">Internship Selection Approved!</h3>
                          <p className="text-xs text-text-secondary mt-1">
                            Congratulations! You have been selected as an intern. To activate your workspace and complete your onboarding, you must review and digitally sign the internship Terms & Conditions agreement.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/internships/terms-acceptance?appId=${data.application.application_id}&email=${data.application.email}`)}
                        id="proceed-to-tc-btn"
                        className="glow-button flex items-center gap-2 px-8 py-3 text-sm"
                      >
                        Proceed to Terms & Conditions <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {data.application.termsAccepted && (
                        <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Terms & Conditions Signed</span>
                          </div>
                          <p className="text-xs text-text-secondary">
                            You have already accepted and signed the Terms & Conditions.
                          </p>
                          <div className="grid grid-cols-2 gap-4 pt-1 text-[10px] text-text-muted">
                            <div>
                              <span className="block font-semibold">Signed Date</span>
                              <span className="text-white font-mono">{new Date(data.application.signedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                            <div>
                              <span className="block font-semibold">Signed Time</span>
                              <span className="text-white font-mono">{new Date(data.application.signedAt).toLocaleTimeString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                          <UserCheck className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-accent text-lg">Internship Access Granted!</h3>
                          <p className="text-xs text-text-secondary mt-1">
                            Your agreement is complete. Click below to access your personal intern workspace with project tasks, repository links, and mentor feedback.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleInternLogin}
                        disabled={isLoggingIn}
                        id="access-intern-dashboard-btn"
                        className="glow-button flex items-center gap-2 px-8 py-3 text-sm"
                      >
                        {isLoggingIn ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Starting Dashboard...</>
                        ) : (
                          <> Access Intern Dashboard <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* === COMPLETED + CERTIFICATE CARD === */}
              {data.application.status === 'Completed' && data.certificate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 md:p-8 border border-green-500/20 bg-green-950/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />

                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                      <FileBadge className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-green-400 text-lg">Internship Completed!</h3>
                      <p className="text-xs text-text-secondary mt-1">
                        Congratulations on successfully completing your internship program. Your verified certificate is ready for download.
                      </p>
                    </div>
                  </div>

                  <div className="bg-background/50 border border-green-500/10 rounded-xl p-4 mb-5 text-xs text-text-secondary space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Certificate Number:</span>
                      <span className="font-mono font-bold text-white">{data.certificate.certificate_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Domain:</span>
                      <span className="text-white font-medium">{data.certificate.domain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Duration:</span>
                      <span className="text-white">{data.certificate.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Period:</span>
                      <span className="text-white">{data.certificate.start_date} → {data.certificate.end_date}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center">
                    <a
                      href={`/api/internships/certificate/download/${data.certificate.certificate_number}`}
                      id="download-certificate-btn"
                      className="glow-button flex items-center gap-2 px-8 py-3 text-sm"
                    >
                      <Download className="w-4 h-4" /> Download PDF Certificate
                    </a>
                    <a
                      href={`/internships/verify-certificate/${data.certificate.certificate_number}`}
                      className="glow-button-outline flex items-center gap-2 px-6 py-3 text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Verify Online
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Back / New Search button */}
              <div className="flex justify-end">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent transition-colors py-2 px-4 rounded-lg hover:bg-accent/5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Search Another Application
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </section>
    </main>
  )
}
