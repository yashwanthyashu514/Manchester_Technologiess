import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, ShieldAlert, Search, Hash, Loader2,
  User, Briefcase, Calendar, AlertCircle, CheckCircle2,
  ArrowLeft, RefreshCw, PenLine
} from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

export default function VerifySignature() {
  const [searchParams] = useSearchParams()
  const [certId, setCertId] = useState(searchParams.get('cert') || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  // Auto-search if cert param passed in URL
  useState(() => {
    const certFromUrl = searchParams.get('cert')
    if (certFromUrl) {
      handleSearch(null, certFromUrl)
    }
  })

  async function handleSearch(e, overrideCert) {
    if (e) e.preventDefault()
    const idToSearch = (overrideCert || certId).trim().toUpperCase()
    if (!idToSearch) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/internships/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cert_id: idToSearch })
      })
      const data = await res.json()

      if (!res.ok || !data.valid) {
        throw new Error(data.error || 'No matching signature record found for this Certificate ID.')
      }
      setResult(data.signature)
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the Certificate ID and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError(null)
    setCertId('')
  }

  return (
    <main className="pt-20">
      <section className="section-padding py-16 max-w-3xl mx-auto">

        {/* Header */}
        <AnimatedSection className="text-center mb-10">
          <span className="text-accent text-xs font-semibold tracking-wider uppercase bg-accent/10 px-3 py-1.5 rounded-md">
            Signature Verification Portal
          </span>
          <h1 className="heading-lg mt-4 mb-2">Verify Internship Signature</h1>
          <p className="body-md text-text-secondary max-w-xl mx-auto">
            Enter an Application ID to verify the authenticity of a digital internship agreement signature.
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
                  <div>
                    <label className="block text-xs font-bold text-text-secondary uppercase mb-2 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5" /> Application ID *
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        required
                        value={certId}
                        onChange={(e) => setCertId(e.target.value.toUpperCase())}
                        placeholder="MT20260001"
                        id="cert-id-input"
                        className="flex-1 bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors text-sm font-mono tracking-wider"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !certId.trim()}
                        id="verify-signature-btn"
                        className={`glow-button px-6 py-3 flex items-center gap-2 text-sm shrink-0 ${
                          (!certId.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isLoading
                          ? <Loader2 className="w-5 h-5 animate-spin" />
                          : <Search className="w-5 h-5" />
                        }
                        <span className="hidden sm:inline">Verify</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-text-muted flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5 text-accent/60" />
                    Enter the Application ID (e.g., MT20260001) associated with the signed internship agreement.
                  </p>
                </form>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="glass-card p-6 border border-red-500/20 bg-red-950/5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl" />
                    <div className="flex items-start gap-4">
                      <ShieldAlert className="w-10 h-10 text-red-400 shrink-0" />
                      <div>
                        <h3 className="font-heading font-bold text-red-400 text-base mb-1">Invalid Signature</h3>
                        <p className="text-sm text-text-secondary">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* How it works */}
              <div className="mt-8 glass-card p-6 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent" /> How Signature Verification Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { num: '01', label: 'Enter Application ID', desc: 'Input the Application ID from your selection status email or dashboard.' },
                    { num: '02', label: 'Verify in Real-Time', desc: 'Our system cross-checks the ID against our secure immutable ledger.' },
                    { num: '03', label: 'View Details',         desc: 'See candidate name, domain, and exact signing timestamp.' },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-3">
                      <span className="text-accent font-heading font-black text-2xl opacity-40 shrink-0">{step.num}</span>
                      <div>
                        <h4 className="text-xs font-bold text-white mb-1">{step.label}</h4>
                        <p className="text-[11px] text-text-secondary leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-4 text-xs">
                <Link to="/internships/track-status" className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Track Application Status
                </Link>
                <Link to="/internships" className="flex items-center gap-1.5 text-text-secondary hover:text-accent transition-colors">
                  Internship Program
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Valid Badge Banner */}
              <div className="glass-card p-8 md:p-10 border border-emerald-500/20 bg-emerald-950/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />

                {/* Verified Header */}
                <div className="text-center mb-8 pb-6 border-b border-white/5">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4"
                  >
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </motion.div>
                  <h1 className="text-2xl font-heading font-black text-emerald-400 tracking-wider">VALID SIGNATURE</h1>
                  <p className="text-xs text-text-secondary mt-1">
                    Manchester Technologies Verified Digital Signature Registry
                  </p>
                </div>

                {/* Signature Details */}
                <div className="space-y-4">
                  {[
                    { icon: User,      label: 'Candidate Name',      value: result.candidate_name },
                    { icon: Briefcase, label: 'Internship Domain',   value: result.domain || 'N/A' },
                    { icon: Hash,      label: 'Application ID',       value: result.application_id },
                    {
                      icon: Calendar,
                      label: 'Signed On',
                      value: new Date(result.signed_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      }) + ' IST'
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-center bg-background/50 border border-white/5 p-4 rounded-xl">
                      <item.icon className="w-5 h-5 text-accent shrink-0" />
                      <div>
                        <span className="text-[10px] text-text-muted uppercase tracking-wider block">{item.label}</span>
                        <strong className={`text-base font-bold block mt-0.5 ${item.accent ? 'text-accent font-mono' : 'text-white'}`}>
                          {item.value}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Security note */}
                <div className="mt-6 bg-emerald-950/20 border border-emerald-500/10 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-text-secondary">
                    This signature has been cryptographically verified in the Manchester Technologies secure immutable ledger.
                    The record cannot be altered or tampered with after signing.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent transition-colors py-2 px-4 rounded-lg hover:bg-accent/5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Verify Another Certificate
                </button>
                <Link
                  to="/internships"
                  className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent transition-colors py-2 px-4 rounded-lg hover:bg-accent/5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Internship Program
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </section>
    </main>
  )
}
