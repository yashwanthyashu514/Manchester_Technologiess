import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Mail, Hash, Loader2, AlertCircle, CheckCircle2,
  XCircle, Clock, ArrowRight, RefreshCw, User, Briefcase,
  Calendar, MapPin, UserCheck, ShieldCheck, PenLine, ExternalLink
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'

/* ─── Status Badge ──────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    'Under Review': 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    'Selected':     'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    'Rejected':     'text-red-400 bg-red-400/10 border-red-400/30',
  }
  return (
    <span className={`px-4 py-1.5 rounded-full border text-xs font-bold ${map[status] || 'text-text-muted bg-white/5 border-white/10'}`}>
      {status}
    </span>
  )
}

/* ─── Under Review Card ─────────────────────────────────────────────── */
function UnderReviewCard({ record }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 md:p-8 border border-amber-500/20 bg-amber-950/5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <Clock className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-amber-400 text-lg">Application Under Review</h3>
          <p className="text-xs text-text-secondary mt-1">
            Your application is currently being reviewed by our engineering team.
          </p>
        </div>
      </div>

      <div className="bg-amber-950/20 border border-amber-500/10 rounded-xl p-5 text-sm text-text-secondary leading-relaxed">
        <p>
          Your application is currently <strong className="text-amber-400">under review</strong>. Our team is evaluating your profile,
          skills, and qualifications. Please wait for further updates. You will receive an email notification once a decision has been made.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-text-muted">
        <div>
          <span className="block font-semibold text-[10px] uppercase tracking-wider">Tracking ID</span>
          <span className="font-mono text-accent font-bold">{record.tracking_id}</span>
        </div>
        <div>
          <span className="block font-semibold text-[10px] uppercase tracking-wider">Applied Domain</span>
          <span className="text-white font-medium">{record.domain || '—'}</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Selected Card ─────────────────────────────────────────────────── */
function SelectedCard({ record, email, navigate, termsAccepted, signedAt, certificateId }) {
  const hasAccepted = termsAccepted

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 md:p-8 border border-accent/25 bg-accent/5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/5">
        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <UserCheck className="w-6 h-6 text-accent" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-accent text-xl">🎉 You've Been Selected!</h3>
          <p className="text-xs text-text-secondary mt-1">
            Congratulations! You have been officially selected for the Manchester Technologies Internship Program.
          </p>
        </div>
      </div>

      {/* Offer Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { icon: Briefcase, label: 'Internship Domain', value: record.domain || 'To be confirmed' },
          { icon: User,      label: 'Assigned Mentor',  value: record.mentor || 'To be assigned' },
          { icon: Calendar,  label: 'Start Date',       value: record.start_date || 'To be confirmed' },
          { icon: MapPin,    label: 'Reporting Details', value: record.reporting_details || 'Online / Remote' },
        ].map((item, i) => (
          <div key={i} className="bg-background/40 border border-white/5 rounded-xl p-4 group hover:border-accent/20 transition-all">
            <div className="flex items-center gap-1.5 mb-2">
              <item.icon className="w-3.5 h-3.5 text-accent/70" />
              <span className="text-[10px] text-text-muted uppercase tracking-wider">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-white block">{item.value}</span>
          </div>
        ))}
      </div>

      {record.remarks && (
        <div className="bg-background/40 border border-accent/10 rounded-xl p-4 mb-6 text-xs text-text-secondary">
          <span className="text-accent font-semibold block mb-1">Additional Remarks</span>
          {record.remarks}
        </div>
      )}

      {/* Signed status */}
      {hasAccepted ? (
        <div className="space-y-4">
          <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Offer Accepted & Agreement Signed</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-[10px] text-text-muted">
              <div>
                <span className="block font-semibold">Signed On</span>
                <span className="text-white font-mono">{new Date(signedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              {certificateId && (
                <div>
                  <span className="block font-semibold">Certificate ID</span>
                  <span className="text-accent font-mono font-bold">{certificateId}</span>
                </div>
              )}
            </div>
          </div>
          {certificateId && (
            <button
              onClick={() => navigate(`/internships/verify-signature?cert=${certificateId}`)}
              className="glow-button-outline flex items-center gap-2 px-6 py-3 text-xs"
            >
              <ShieldCheck className="w-4 h-4" /> Verify Signature Certificate
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 text-xs text-accent">
            <strong>Action Required:</strong> Please accept the internship offer and sign the digital agreement to complete your onboarding.
          </div>
          <button
            onClick={() => navigate(`/internships/terms-acceptance?appId=${record.tracking_id}&email=${email}`)}
            id="accept-offer-btn"
            className="glow-button flex items-center gap-2 px-8 py-3 text-sm"
          >
            <PenLine className="w-4 h-4" /> Accept Offer &amp; Sign Agreement <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

/* ─── Rejected Card ─────────────────────────────────────────────────── */
function RejectedCard({ record }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 md:p-8 border border-red-500/20 bg-red-950/5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-28 h-28 bg-red-500/10 rounded-full blur-3xl" />
      <div className="flex items-start gap-4 mb-5">
        <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
          <XCircle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-red-400 text-lg">Application Status: Not Selected</h3>
          <p className="text-xs text-text-secondary mt-1">
            Thank you for your interest in Manchester Technologies.
          </p>
        </div>
      </div>

      <div className="bg-red-950/10 border border-red-500/10 rounded-xl p-5 text-sm text-text-secondary leading-relaxed mb-4">
        <p>
          Thank you for applying to Manchester Technologies. After careful review of your application, we regret to inform you that
          you have <strong className="text-red-400">not been selected</strong> for this internship cycle.
          We appreciate the time and effort you invested in your application. We encourage you to strengthen
          your profile and reapply in a future intake.
        </p>
      </div>

      {record.remarks && (
        <div className="text-xs text-text-secondary bg-background/40 border border-white/5 rounded-xl p-4">
          <span className="font-semibold block mb-1 text-text-muted uppercase tracking-wider text-[10px]">Feedback from Reviewer</span>
          {record.remarks}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Main Page ─────────────────────────────────────────────────────── */
export default function TrackApplicationStatus() {
  const [gmail, setGmail] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const navigate = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!gmail.trim() || !trackingId.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/internships/track-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: gmail.trim(), tracking_id: trackingId.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No matching record found.')
      setResult(data)
    } catch (err) {
      setError(err.message || 'Search failed. Please verify your details and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setGmail('')
    setTrackingId('')
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
            Enter your registered Gmail and Application Tracking ID to view your internship selection status.
          </p>
        </AnimatedSection>

        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Search Form */}
              <div className="glass-card p-6 md:p-8 border border-white/5 mb-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> Registered Gmail Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={gmail}
                        onChange={(e) => setGmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5" /> Application Tracking ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                        placeholder="MT20260001"
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors text-sm font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    id="search-status-btn"
                    className="w-full glow-button py-3 flex items-center justify-center gap-2 text-sm"
                  >
                    {isLoading
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
                      : <><Search className="w-5 h-5" /> Search Status</>
                    }
                  </button>
                </form>

                <p className="text-[10px] text-text-muted mt-4 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-accent/60" />
                  Your Tracking ID (e.g., MT20260001) was sent to your Gmail when you applied. Both fields must match exactly.
                </p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-950/20 border border-red-500/30 p-5 rounded-xl text-red-400 text-sm flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block mb-1">Search Failed</strong>
                      <p className="text-xs">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Info boxes */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: Clock,     label: 'Under Review', desc: 'Application is being evaluated by our team.', color: 'amber' },
                  { icon: CheckCircle2, label: 'Selected',  desc: 'You have been selected! Accept the offer to proceed.', color: 'emerald' },
                  { icon: XCircle,   label: 'Not Selected', desc: 'Application was not selected in this cycle.', color: 'red' },
                ].map((item, i) => (
                  <div key={i} className={`glass-card p-4 border border-${item.color}-500/15 bg-${item.color}-950/5`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-400 mb-2`} />
                    <h4 className={`text-xs font-bold text-${item.color}-400 mb-1`}>{item.label}</h4>
                    <p className="text-[11px] text-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Candidate Summary Card */}
              <div className="glass-card p-6 md:p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-accent/5 rounded-full blur-3xl" />
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">Candidate</span>
                    <h2 className="text-2xl font-heading font-bold text-white mt-1">{result.record.candidate_name}</h2>
                    <span className="text-xs text-text-secondary font-mono mt-1 block">Tracking ID: {result.record.tracking_id}</span>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2">
                    <span className="text-[10px] text-text-muted uppercase">Application Status</span>
                    <StatusBadge status={result.record.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-text-muted block uppercase tracking-wider text-[10px]">Registered Email</span>
                    <span className="text-white font-medium mt-1 block truncate">{result.record.email}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block uppercase tracking-wider text-[10px]">Domain</span>
                    <span className="text-white font-medium mt-1 block">{result.record.domain || '—'}</span>
                  </div>
                  <div>
                    <span className="text-text-muted block uppercase tracking-wider text-[10px]">Last Updated</span>
                    <span className="text-white font-medium mt-1 block">
                      {result.record.updated_at
                        ? new Date(result.record.updated_at).toLocaleDateString('en-IN')
                        : new Date(result.record.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status-specific card */}
              {result.record.status === 'Under Review' && (
                <UnderReviewCard record={result.record} />
              )}
              {result.record.status === 'Selected' && (
                <SelectedCard
                  record={result.record}
                  email={gmail}
                  navigate={navigate}
                  termsAccepted={result.termsAccepted}
                  signedAt={result.signedAt}
                  certificateId={result.certificateId}
                />
              )}
              {result.record.status === 'Rejected' && (
                <RejectedCard record={result.record} />
              )}

              {/* Links */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent transition-colors py-2 px-4 rounded-lg hover:bg-accent/5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Search Another Application
                </button>
                <a
                  href="/internships/verify-signature"
                  className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent transition-colors py-2 px-4 rounded-lg hover:bg-accent/5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Verify Signature Certificate
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </section>
    </main>
  )
}
