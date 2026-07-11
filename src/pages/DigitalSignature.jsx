import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Edit3, CheckCircle2, ShieldAlert, Loader2, RefreshCw, Trash2, Save, Download } from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

export default function DigitalSignature() {
  const [searchParams] = useSearchParams()
  const appId = searchParams.get('appId') || ''
  const email = searchParams.get('email') || ''
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [eligibilityError, setEligibilityError] = useState(null)
  const [applicationData, setApplicationData] = useState(null)
  
  // Canvas State
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [lineWidth, setLineWidth] = useState(2.5)
  const [strokeStyle, setStrokeStyle] = useState('#ffffff') // white drawing on dark background

  // Post Submission Success Screen
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signedDetails, setSignedDetails] = useState(null)

  // 1. Verify Eligibility
  useEffect(() => {
    if (!appId || !email) {
      setEligibilityError('Missing required credentials. Please return to the status page and try again.')
      setIsLoading(false)
      return
    }

    const checkEligibility = async () => {
      try {
        const res = await fetch('/api/internships/verify-tc-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, application_id: appId })
        })
        const result = await res.json()
        if (!res.ok) {
          throw new Error(result.error || 'Failed to verify eligibility.')
        }

        if (result.termsAccepted) {
          // Already signed
          setSignedDetails({
            signedAt: result.signedAt,
            application_id: result.application.application_id
          })
          setIsLoading(false)
          return
        }

        setApplicationData(result.application)
      } catch (err) {
        setEligibilityError(err.message || 'Failed to authenticate session.')
      } finally {
        setIsLoading(false)
      }
    }

    checkEligibility()
  }, [appId, email])

  // 2. Initialize Canvas Events
  useEffect(() => {
    if (isLoading || eligibilityError || !applicationData || signedDetails) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Match canvas width/height to parent size on resize
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      canvas.width = parent.clientWidth
      canvas.height = 300
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = strokeStyle
      ctx.lineWidth = lineWidth
      // Keep clear drawing state
      setHasDrawn(false)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [isLoading, eligibilityError, applicationData, signedDetails, strokeStyle, lineWidth])

  // 3. Drawing Helpers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    // Touch event vs Mouse event
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }
  }

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)

    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    setIsDrawing(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    
    // Prevent scrolling when drawing on touch screens
    if (e.cancelable) e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const coords = getCoordinates(e)

    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  // 4. Save Signature
  const handleSaveSignature = async () => {
    if (!hasDrawn) return

    setIsSubmitting(true)
    const canvas = canvasRef.current
    const signatureImage = canvas.toDataURL('image/png')

    // Collect browser and device details
    const browserInfo = navigator.userAgent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    const deviceInfo = `${isMobile ? 'Mobile' : 'Desktop'} | Platform: ${navigator.platform || 'N/A'} | Viewport: ${window.innerWidth}x${window.innerHeight}`

    try {
      const res = await fetch('/api/internships/submit-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          application_id: appId.trim(),
          signatureImage,
          browserInfo,
          deviceInfo
        })
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit signature.')
      }

      setSignedDetails({
        signedAt: result.signedAt,
        application_id: result.application_id
      })
    } catch (err) {
      alert(err.message || 'Failed to record signature. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-text-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 font-semibold">Loading Signature Panel...</span>
      </div>
    )
  }

  if (eligibilityError) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center px-4">
        <div className="glass-card max-w-md p-8 border border-red-500/20 text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-heading font-bold text-red-400">Access Restricted</h2>
          <p className="text-sm text-text-secondary">{eligibilityError}</p>
          <button
            onClick={() => navigate('/internships/status')}
            className="glow-button px-6 py-2.5 text-xs mx-auto block"
          >
            Go Back
          </button>
        </div>
      </main>
    )
  }

  // Success Confirmation Screen
  if (signedDetails) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-lg w-full p-8 border border-emerald-500/20 relative overflow-hidden text-center space-y-6 shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
          
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-heading font-bold text-white">Terms & Conditions Successfully Accepted</h1>
            <p className="text-xs text-text-secondary">
              Your digital signature and acceptance record have been logged securely in our internship ledger.
            </p>
          </div>

          {/* Details Box */}
          <div className="bg-background/80 border border-white/5 rounded-xl p-5 text-left text-xs space-y-3 font-mono">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-text-muted">Tracking ID:</span>
              <span className="text-accent font-bold">{signedDetails.application_id}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-text-muted">Signed Date:</span>
              <span className="text-white">{new Date(signedDetails.signedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Signed Time:</span>
              <span className="text-white">{new Date(signedDetails.signedAt).toLocaleTimeString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <button
              onClick={() => navigate(`/internships/status?appId=${appId}&email=${email}`)}
              className="w-full glow-button py-3 text-xs"
            >
              Go to Candidate Workspace
            </button>
            <p className="text-[10px] text-text-muted">
              Note: A copy of this signed agreement is available to the administration team for your final onboarding review.
            </p>
          </div>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen pb-16">
      <section className="section-padding py-8 max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <AnimatedSection className="text-center">
          <span className="text-accent text-xs font-semibold tracking-wider uppercase bg-accent/10 px-3 py-1.5 rounded-md">
            Step 2 of 2: Digital Signature
          </span>
          <h1 className="heading-md mt-4 text-white">Provide Digital Signature</h1>
          <p className="body-sm text-text-secondary mt-2">
            Use your mouse, touch screen, or stylus to draw your official signature manually in the box below.
          </p>
        </AnimatedSection>

        {/* Warning Banner */}
        <div className="bg-accent/5 border border-accent/20 p-4 rounded-xl text-xs text-accent leading-relaxed flex gap-2.5">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <strong>Draw manually only</strong>
            <p className="text-[11px] text-text-secondary mt-0.5">Typed signatures or copy-pasted files are strictly prohibited. The signature image is secured with cryptographic verification. Your IP address and device fingerprint will be attached permanently.</p>
          </div>
        </div>

        {/* Canvas Drawing Board */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-accent" /> Signature Drawing Canvas
            </span>
            {hasDrawn && (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Signature Captured
              </span>
            )}
          </div>

          <div className="relative border border-white/10 rounded-xl overflow-hidden bg-zinc-950/80 shadow-inner">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair block w-full touch-none"
            />
            
            {/* Guide line */}
            <div className="absolute left-6 right-6 bottom-12 border-t border-dashed border-white/20 flex justify-between px-2 text-[9px] text-white/30 pointer-events-none select-none">
              <span>DRAW SIGNATURE HERE</span>
              <span>KEEP INSIDE BOUNDS</span>
            </div>
          </div>
        </div>

        {/* Board Controls */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={clearCanvas}
              disabled={!hasDrawn}
              className={`glow-button-outline px-4 py-2.5 text-xs flex items-center gap-1.5 ${
                !hasDrawn ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <Trash2 className="w-4 h-4" /> Clear Canvas
            </button>
            
            {hasDrawn && (
              <button
                onClick={clearCanvas}
                className="text-xs text-text-muted hover:text-white transition-colors"
              >
                Re-sign Option
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/internships/terms-acceptance?appId=${appId}&email=${email}`)}
              className="px-5 py-2.5 rounded-lg border border-white/10 text-xs text-text-secondary hover:text-white transition-colors"
            >
              Back to Terms
            </button>
            
            <button
              onClick={handleSaveSignature}
              disabled={!hasDrawn || isSubmitting}
              className={`glow-button px-6 py-2.5 text-xs flex items-center gap-2 ${
                (!hasDrawn || isSubmitting) ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Storing Ledger...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Signature & Complete</>
              )}
            </button>
          </div>
        </div>

      </section>
    </main>
  )
}
