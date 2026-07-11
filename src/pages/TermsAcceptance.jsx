import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, CheckCircle2, ShieldAlert, Loader2, AlertCircle, Check } from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

export default function TermsAcceptance() {
  const [searchParams] = useSearchParams()
  const appId = searchParams.get('appId') || ''
  const email = searchParams.get('email') || ''
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [eligibilityError, setEligibilityError] = useState(null)
  const [applicationData, setApplicationData] = useState(null)

  // PDF Loading & Rendering
  const [pdfDoc, setPdfDoc] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [pagesRendered, setPagesRendered] = useState([])
  const [scrollProgress, setScrollProgress] = useState(0)
  const [pdfReadComplete, setPdfReadComplete] = useState(false)

  // Checkboxes & Buttons
  const [confirmRead, setConfirmRead] = useState(false)
  const [confirmAgree, setConfirmAgree] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const viewerContainerRef = useRef(null)
  const bottomMarkerRef = useRef(null)

  // 1. Verify Eligibility on Load
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
          navigate(`/internships/status?appId=${appId}&email=${email}`)
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
  }, [appId, email, navigate])

  // 2. Load PDF.js from CDN dynamically
  useEffect(() => {
    if (isLoading || eligibilityError || !applicationData) return

    const loadPdfJs = async () => {
      if (window.pdfjsLib) {
        initPdf('/manchestertechnologiestandc.pdf')
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js'
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'
        initPdf('/manchestertechnologiestandc.pdf')
      }
      script.onerror = () => {
        setEligibilityError('Failed to load PDF library. Please check your internet connection.')
      }
      document.head.appendChild(script)
    }

    loadPdfJs()
  }, [isLoading, eligibilityError, applicationData])

  const initPdf = async (pdfUrl) => {
    try {
      const loadingTask = window.pdfjsLib.getDocument(pdfUrl)
      const pdf = await loadingTask.promise
      setPdfDoc(pdf)
      setNumPages(pdf.numPages)
      
      const renderedPagesArray = []
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        renderedPagesArray.push(pageNum)
      }
      setPagesRendered(renderedPagesArray)
    } catch (err) {
      console.error('PDF.js loading error:', err)
      setEligibilityError('Failed to load Terms & Conditions document.')
    }
  }

  // 3. Render page canvas helper (Crisp rendering + auto scaling)
  const PdfPageCanvas = ({ pageNumber, pdfDocument }) => {
    const canvasRef = useRef(null)

    useEffect(() => {
      if (!pdfDocument || !canvasRef.current) return

      let renderTask = null;
      const renderPage = async () => {
        try {
          const page = await pdfDocument.getPage(pageNumber)
          const canvas = canvasRef.current
          const context = canvas.getContext('2d')

          // Calculate viewport based on container width
          const parentWidth = viewerContainerRef.current ? viewerContainerRef.current.clientWidth - 48 : 600
          const initialViewport = page.getViewport({ scale: 1 })
          const scale = parentWidth / initialViewport.width
          const viewport = page.getViewport({ scale: scale })

          // High-DPI/Retina Screen Scaling
          const dpr = window.devicePixelRatio || 1
          canvas.width = viewport.width * dpr
          canvas.height = viewport.height * dpr
          canvas.style.width = `${viewport.width}px`
          canvas.style.height = `${viewport.height}px`

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            transform: [dpr, 0, 0, dpr, 0, 0] // Apply scale transformation
          }

          renderTask = page.render(renderContext)
          await renderTask.promise
        } catch (err) {
          if (err.name !== 'RenderingCancelledException') {
            console.error('Error rendering page:', err)
          }
        }
      }

      renderPage()

      return () => {
        if (renderTask) {
          renderTask.cancel()
        }
      }
    }, [pageNumber, pdfDocument])

    return (
      <div className="bg-white p-2 md:p-4 rounded-lg shadow-xl border border-white/5 mb-6 flex justify-center overflow-x-auto">
        <canvas ref={canvasRef} className="max-w-full block" />
      </div>
    )
  }

  // 4. Scroll Tracking
  const handleScroll = () => {
    if (!viewerContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = viewerContainerRef.current

    if (scrollHeight - clientHeight <= 0) return

    // Calculate percentage based on scroll position
    const currentProgress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100))
    setScrollProgress(currentProgress)
  }

  // 5. IntersectionObserver for absolute bottom detection
  useEffect(() => {
    if (!pdfDoc || pagesRendered.length === 0) return

    const observerOptions = {
      root: viewerContainerRef.current,
      rootMargin: '0px 0px 50px 0px', // Trigger slightly before reaching bottom for better UX
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setPdfReadComplete(true)
          setScrollProgress(100)
        }
      })
    }, observerOptions)

    const target = bottomMarkerRef.current
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [pdfDoc, pagesRendered])

  // Verify responsive resize rendering of canvases
  useEffect(() => {
    const handleResize = () => {
      if (pdfDoc) {
        setPdfDoc(doc => doc)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [pdfDoc])

  const handleProceed = () => {
    if (!pdfReadComplete || !confirmRead || !confirmAgree) return
    setShowModal(true)
  }

  const handleConfirmSign = () => {
    setShowModal(false)
    navigate(`/internships/digital-signature?appId=${appId}&email=${email}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-text-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 font-semibold">Authenticating credentials...</span>
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
  return (
    <main className="pt-20 min-h-screen pb-16">
      {/* Custom Styles for premium custom scrollbar and scroll momentum on Safari/iOS */}
      <style dangerouslySetInnerHTML={{__html: `
        .pdf-viewer-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .pdf-viewer-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .pdf-viewer-scroll::-webkit-scrollbar-thumb {
          background: rgba(200, 169, 106, 0.3);
          border-radius: 4px;
        }
        .pdf-viewer-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(200, 169, 106, 0.6);
        }
      `}} />

      <section className="section-padding py-8 max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <AnimatedSection className="text-center">
          <span className="text-accent text-xs font-semibold tracking-wider uppercase bg-accent/10 px-3 py-1.5 rounded-md">
            Step 1 of 2: Terms Review
          </span>
          <h1 className="heading-md mt-4 text-white">Terms & Conditions Acceptance</h1>
          <p className="body-sm text-text-secondary max-w-xl mx-auto mt-2">
            Please read the Manchester Technologies Internship Agreement. Scroll through the document in its entirety to unlock the acceptance checkboxes.
          </p>
        </AnimatedSection>

        {/* Candidate & Document Quick Metadata */}
        <div className="glass-card p-4 border border-white/5 flex flex-wrap gap-6 items-center justify-between text-xs">
          <div>
            <span className="text-text-muted block">Applicant Name</span>
            <span className="text-white font-bold">{applicationData?.full_name}</span>
          </div>
          <div>
            <span className="text-text-muted block">Tracking ID</span>
            <span className="text-accent font-mono font-bold">{applicationData?.application_id}</span>
          </div>
          <div>
            <span className="text-text-muted block">Document Version</span>
            <span className="text-white font-semibold">1.0.0 (MT-TC-2026)</span>
          </div>
        </div>

        {/* Scroll Progress Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-accent" /> Document Reading Progress
            </span>
            <span className={`font-mono font-bold ${pdfReadComplete ? 'text-emerald-400' : 'text-accent'}`}>
              {pdfReadComplete ? 'Reading Complete (100%)' : `${scrollProgress}% viewed`}
            </span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${pdfReadComplete ? 'bg-emerald-500' : 'bg-accent'}`}
              animate={{ width: `${Math.max(scrollProgress, pdfReadComplete ? 100 : 2)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* PDF Embedded Scroll Window */}
        <div 
          ref={viewerContainerRef}
          onScroll={handleScroll}
          className="pdf-viewer-scroll h-[500px] overflow-y-auto bg-black/60 border border-white/10 rounded-xl p-4 md:p-6 shadow-2xl relative scroll-smooth touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {!pdfDoc ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-secondary bg-background/90">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <span>Loading Document...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {pagesRendered.map((pageNum) => (
                <PdfPageCanvas key={pageNum} pageNumber={pageNum} pdfDocument={pdfDoc} />
              ))}
              
              {/* Bottom Marker observed by IntersectionObserver */}
              <div ref={bottomMarkerRef} className="h-8 w-full flex items-center justify-center text-text-muted text-[10px]">
                --- End of Document ---
              </div>
            </div>
          )}
        </div>

        {/* Checkbox Section */}
        <div className={`glass-card p-6 border transition-all duration-300 ${
          pdfReadComplete ? 'border-accent/20 bg-accent/5' : 'border-white/5 bg-white/2 opacity-50'
        }`}>
          <h3 className="font-heading font-bold text-white text-sm mb-4">Acknowledge Agreements</h3>
          
          {!pdfReadComplete && (
            <p className="text-[10px] text-accent mb-4 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Please scroll to the final page of the PDF viewer above to unlock the checkboxes and proceed.
            </p>
          )}

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer group text-xs text-text-secondary select-none">
              <input
                type="checkbox"
                disabled={!pdfReadComplete}
                checked={confirmRead}
                onChange={(e) => setConfirmRead(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                confirmRead 
                  ? 'bg-accent border-accent text-background' 
                  : 'border-white/20 bg-background/40 group-hover:border-accent/50'
              }`}>
                {confirmRead && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="leading-relaxed group-hover:text-white transition-colors">
                I confirm that I have read the complete Terms & Conditions.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group text-xs text-text-secondary select-none">
              <input
                type="checkbox"
                disabled={!pdfReadComplete}
                checked={confirmAgree}
                onChange={(e) => setConfirmAgree(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                confirmAgree 
                  ? 'bg-accent border-accent text-background' 
                  : 'border-white/20 bg-background/40 group-hover:border-accent/50'
              }`}>
                {confirmAgree && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="leading-relaxed group-hover:text-white transition-colors">
                I agree to all Terms & Conditions.
              </span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(`/internships/status?appId=${appId}&email=${email}`)}
            className="glow-button-outline px-6 py-3 text-xs"
          >
            Cancel and Return
          </button>
          
          <button
            onClick={handleProceed}
            disabled={!pdfReadComplete || !confirmRead || !confirmAgree}
            className={`glow-button px-8 py-3 text-xs flex items-center gap-2 ${
              (!pdfReadComplete || !confirmRead || !confirmAgree) ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            Accept & Sign
          </button>
        </div>

      </section>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-md w-full p-6 md:p-8 border border-white/10 relative z-10 space-y-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white text-base">Confirmation Required</h3>
                  <p className="text-[10px] text-text-muted">Manchester Technologies Portal</p>
                </div>
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                By proceeding, you confirm that you have read and accepted all Terms & Conditions. Your digital signature will be stored as proof of acceptance.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-white/10 text-xs text-text-secondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSign}
                  className="bg-accent hover:bg-accent-light text-background font-bold px-5 py-2.5 rounded-lg text-xs transition-colors"
                >
                  Proceed to Sign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
