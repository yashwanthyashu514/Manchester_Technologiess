import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  Calendar, 
  User, 
  Briefcase, 
  Loader2, 
  FileBadge, 
  ArrowLeft 
} from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

export default function VerifyCertificate() {
  const { certificateNumber } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cert, setCert] = useState(null)

  useEffect(() => {
    if (certificateNumber) {
      verifyCode()
    }
  }, [certificateNumber])

  const verifyCode = async () => {
    setIsLoading(true)
    setError(null)
    setCert(null)

    try {
      const res = await fetch(`/api/internships/verify-certificate/${encodeURIComponent(certificateNumber)}`)
      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Verification check failed.')
      }

      setCert(result.certificate)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Invalid certificate code parameters.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="pt-20">
      <section className="section-padding py-20 max-w-2xl mx-auto">
        
        {isLoading && (
          <div className="py-24 text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
            <p className="text-sm text-text-secondary">Verifying credentials security codes...</p>
          </div>
        )}

        {!isLoading && error && (
          <AnimatedSection>
            <div className="glass-card p-8 text-center border border-red-500/20 bg-red-950/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="heading-md text-red-400 mb-2">Verification Failed</h1>
              <p className="body-md text-text-secondary mb-8 leading-relaxed">
                The certificate number <strong>&ldquo;{certificateNumber}&rdquo;</strong> could not be validated in our secure directory registry database.
              </p>
              
              <div className="flex justify-center gap-4">
                <Link to="/internships">
                  <button className="glow-button-outline px-6 text-xs flex items-center gap-1.5">
                    <ArrowLeft className="w-4 h-4" /> Manchester Internship Program
                  </button>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        )}

        {!isLoading && cert && (
          <AnimatedSection>
            <div className="glass-card p-8 md:p-10 border border-green-500/20 bg-green-950/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />
              
              {/* Success badge banner */}
              <div className="text-center mb-8 border-b border-white/5 pb-6">
                <ShieldCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-2xl font-heading font-black text-green-400 tracking-wider">VERIFIED CREDENTIALS</h1>
                <p className="text-xs text-text-secondary mt-1">Manchester Technologies Verified Directory Registry</p>
              </div>

              {/* Data parameters */}
              <div className="space-y-6 text-xs md:text-sm">
                
                <div className="flex gap-4 items-center bg-background/50 border border-white/5 p-4 rounded-lg">
                  <User className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">Candidate Name</span>
                    <strong className="text-white text-base font-bold">{cert.candidate_name}</strong>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-background/50 border border-white/5 p-4 rounded-lg">
                  <Briefcase className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">Internship Domain</span>
                    <strong className="text-accent text-base font-bold">{cert.domain}</strong>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-background/50 border border-white/5 p-4 rounded-lg">
                  <Calendar className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">Timeline & Duration</span>
                    <span className="text-white font-medium">
                      Completed <strong>{cert.duration}</strong> internship from <strong>{new Date(cert.start_date).toLocaleDateString()}</strong> to <strong>{new Date(cert.end_date).toLocaleDateString()}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 items-center bg-background/50 border border-white/5 p-4 rounded-lg">
                  <FileBadge className="w-5 h-5 text-accent shrink-0" />
                  <div>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider block">Verification Certificate ID</span>
                    <span className="text-white font-bold">{cert.certificate_number}</span>
                  </div>
                </div>
              </div>

              {/* Download link button */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <a 
                  href={`/api/internships/certificate/download/${cert.certificate_number}`}
                  className="glow-button flex items-center justify-center gap-2 px-8 py-3 text-xs self-start"
                >
                  <Download className="w-4 h-4" /> Download PDF Certificate Copy
                </a>
                
                <span className="text-[10px] text-text-muted italic">
                  Issued on: {new Date(cert.created_at).toLocaleDateString()}
                </span>
              </div>

            </div>
          </AnimatedSection>
        )}

      </section>
    </main>
  )
}
