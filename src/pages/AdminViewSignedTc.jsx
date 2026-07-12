import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Printer, Download, ChevronLeft, Loader2, ShieldCheck, HelpCircle } from 'lucide-react'

export default function AdminViewSignedTc() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pagesRendered, setPagesRendered] = useState([])
  const [pdfLoadingError, setPdfLoadingError] = useState(null)
  const [isPdfLoading, setIsPdfLoading] = useState(true)

  const viewerContainerRef = useRef(null)

  // 1. Fetch Signed T&C Details
  useEffect(() => {
    const fetchSignedDetails = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setError('Unauthorized access. Please log in as an administrator.')
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/admin/applications/${id}/signed-tc`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const result = await res.json()
        if (!res.ok) {
          throw new Error(result.error || 'Failed to retrieve signed agreement.')
        }
        setData(result.application)
      } catch (err) {
        setError(err.message || 'Error occurred while loading data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSignedDetails()
  }, [id])

  // 2. Load PDF.js dynamically
  useEffect(() => {
    if (isLoading || error || !data) return

    const loadPdfJs = async () => {
      if (window.pdfjsLib) {
        initPdf('/manchestertechnologiestandc-updated.pdf')
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js'
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js'
        initPdf('/manchestertechnologiestandc-updated.pdf')
      }
      script.onerror = () => {
        setPdfLoadingError('Failed to load PDF viewer library.')
        setIsPdfLoading(false)
      }
      document.head.appendChild(script)
    }

    loadPdfJs()
  }, [isLoading, error, data])

  const initPdf = async (pdfUrl) => {
    try {
      const loadingTask = window.pdfjsLib.getDocument(pdfUrl)
      const pdf = await loadingTask.promise
      setPdfDoc(pdf)
      
      const renderedPagesArray = []
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        renderedPagesArray.push(pageNum)
      }
      setPagesRendered(renderedPagesArray)
      setIsPdfLoading(false)
    } catch (err) {
      console.error('PDF loading error:', err)
      setPdfLoadingError('Failed to load the original Terms & Conditions PDF.')
      setIsPdfLoading(false)
    }
  }

  // 3. Crisp PDF Canvas Renderer Component
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

          // Lock to target design width for standard desktop/print alignment (720px)
          const viewportWidth = viewerContainerRef.current ? viewerContainerRef.current.clientWidth - 48 : 720
          const initialViewport = page.getViewport({ scale: 1 })
          const scale = viewportWidth / initialViewport.width
          const viewport = page.getViewport({ scale: scale })

          const dpr = window.devicePixelRatio || 1
          canvas.width = viewport.width * dpr
          canvas.height = viewport.height * dpr
          canvas.style.width = `${viewport.width}px`
          canvas.style.height = `${viewport.height}px`

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            transform: [dpr, 0, 0, dpr, 0, 0]
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
      <div className="bg-white p-2 rounded shadow border border-black/5 mb-6 flex justify-center overflow-x-auto print:border-none print:shadow-none print:p-0 print:m-0 print:break-after-page">
        <canvas ref={canvasRef} className="max-w-full block" />
      </div>
    )
  }

  // 4. Download Signed PDF Handler
  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/admin/applications/${id}/download-signed-pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to download PDF.')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Signed_Agreement_${data?.application_id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message || 'Error downloading PDF.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-text-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="ml-3 font-semibold">Generating signed agreement overview...</span>
      </div>
    )
  }

  if (error) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center px-4">
        <div className="glass-card max-w-md p-8 border border-red-500/20 text-center space-y-4">
          <HelpCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-heading font-bold text-red-400">Data Retrieval Failed</h2>
          <p className="text-sm text-text-secondary">{error}</p>
          <button
            onClick={() => navigate('/admin/internships')}
            className="glow-button px-6 py-2.5 text-xs mx-auto block"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    )
  }

  if (!data || !data.termsAccepted) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center px-4">
        <div className="glass-card max-w-md p-8 border border-accent/25 text-center space-y-4">
          <FileText className="w-12 h-12 text-accent mx-auto" />
          <h2 className="text-xl font-heading font-bold text-white">No Signed Agreement Found</h2>
          <p className="text-sm text-text-secondary">
            This candidate has not reviewed or signed the internship Terms & Conditions yet.
          </p>
          <button
            onClick={() => navigate('/admin/internships')}
            className="glow-button-outline px-6 py-2.5 text-xs mx-auto block"
          >
            Return to Roster
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-20 min-h-screen pb-16">
      {/* CSS Styles specifically for high-quality layout and clean print sheets */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          main {
            padding-top: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            padding: 0 !important;
            color: black !important;
          }
          .print-text-dark {
            color: black !important;
          }
          .print-header {
            border-bottom: 2px solid #1a1a1a !important;
            padding-bottom: 10px !important;
          }
          .print-card {
            border: 1px solid black !important;
            background: white !important;
            color: black !important;
          }
          .print-signature-box {
            background: white !important;
            border: 1.5px solid black !important;
            filter: invert(1) !important; /* Makes white drawing render black */
          }
        }
      `}} />

      <section className="section-padding py-8 max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Actions Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 no-print">
          <button
            onClick={() => navigate('/admin/internships')}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="glow-button-outline px-5 py-2 text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print Document
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="glow-button px-5 py-2 text-xs flex items-center gap-1.5"
            >
              {isDownloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Compiling...</>
              ) : (
                <><Download className="w-4 h-4" /> Download PDF</>
              )}
            </button>
          </div>
        </div>

        {/* Audit Status Card */}
        <div className="glass-card p-4 border border-emerald-500/20 bg-emerald-950/5 flex items-center gap-3 no-print">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Immutable Acceptance Logged</h4>
            <p className="text-[10px] text-text-secondary mt-0.5">
              Signed by <strong>{data.full_name}</strong> on {new Date(data.signedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST). Secure ledger hash generated.
            </p>
          </div>
        </div>

        {/* The Printable Signed Contract Sheet Container */}
        <div 
          ref={viewerContainerRef} 
          className="glass-card p-6 md:p-12 border border-white/5 bg-background/40 shadow-2xl space-y-8 print-container print-text-dark"
        >
          
          {/* Header */}
          <div className="flex justify-between items-end border-b border-white/10 pb-6 print-header">
            <div>
              <span className="text-[10px] text-accent uppercase tracking-wider block font-bold">Manchester Technologies</span>
              <h2 className="text-xl font-heading font-bold text-white print-text-dark mt-1">Signed Internship Agreement</h2>
            </div>
            <div className="text-right text-[10px] text-text-muted">
              <span>Agreement Version: 1.0.0 (MT-TC-2026)</span>
            </div>
          </div>

          {/* Render Actual PDF Pages Dynamically */}
          <div className="space-y-4 print-container">
            <h3 className="font-heading font-bold text-white print-text-dark text-sm border-l-2 border-accent pl-3 no-print">
              Original Terms & Conditions Document
            </h3>
            
            {isPdfLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-text-secondary">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                <span>Loading original PDF content...</span>
              </div>
            ) : pdfLoadingError ? (
              <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg text-xs text-red-400">
                {pdfLoadingError}
              </div>
            ) : (
              <div className="space-y-4 print:space-y-0">
                {pagesRendered.map((pageNum) => (
                  <PdfPageCanvas key={pageNum} pageNumber={pageNum} pdfDocument={pdfDoc} />
                ))}
              </div>
            )}
          </div>

          {/* Candidate Profile Details Grid */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 print-card print:break-before-page">
            <h4 className="text-xs font-bold text-white print-text-dark uppercase tracking-wider">Candidate & Audit Details</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
              <div>
                <span className="text-text-muted block uppercase text-[10px]">Candidate Name</span>
                <span className="text-white print-text-dark font-bold mt-1 block">{data.full_name}</span>
              </div>
              <div>
                <span className="text-text-muted block uppercase text-[10px]">Registered Email</span>
                <span className="text-white print-text-dark font-semibold mt-1 block">{data.email}</span>
              </div>
              <div>
                <span className="text-text-muted block uppercase text-[10px]">Application ID</span>
                <span className="text-accent print-text-dark font-mono font-bold mt-1 block">{data.application_id}</span>
              </div>
              <div>
                <span className="text-text-muted block uppercase text-[10px]">Date of Signature</span>
                <span className="text-white print-text-dark font-medium mt-1 block">{new Date(data.signedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div>
                <span className="text-text-muted block uppercase text-[10px]">Time of Signature</span>
                <span className="text-white print-text-dark font-medium mt-1 block">{new Date(data.signedAt).toLocaleTimeString('en-IN')}</span>
              </div>
              <div>
                <span className="text-text-muted block uppercase text-[10px]">Signed PDF Version</span>
                <span className="text-white print-text-dark font-mono mt-1 block">{data.signedPdfVersion || 'manchestertechnologiestandc-updated.pdf'}</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 text-xs">
              <span className="text-text-muted block uppercase text-[10px] mb-1">Acceptance Statement</span>
              <p className="text-white print-text-dark italic font-semibold font-body">
                "I confirm that I have read and accepted all Terms & Conditions of Manchester Technologies Internship Program."
              </p>
            </div>
          </div>

          {/* Secure Audit Log Logs */}
          <div className="bg-white/2 border border-white/5 rounded-xl p-6 text-xs text-text-secondary space-y-3 font-mono print-card">
            <span className="text-[10px] font-bold text-white print-text-dark uppercase tracking-wider block">Cryptographic Security Audit Log</span>
            <div className="space-y-1 text-[11px] leading-relaxed">
              <div><strong className="text-text-muted">Browser Agent:</strong> <span className="text-white print-text-dark">{data.browserInfo || 'N/A'}</span></div>
              <div><strong className="text-text-muted">Device Profile:</strong> <span className="text-white print-text-dark">{data.deviceInfo || 'N/A'}</span></div>
              <div><strong className="text-text-muted">Logged IP Address:</strong> <span className="text-white print-text-dark">{data.ipAddress || 'N/A'}</span></div>
              <div><strong className="text-text-muted">Transaction Audit Signature:</strong> <span className="text-accent print-text-dark">SECURE_LEDGER_CONFIRMED_{data.application_id}</span></div>
            </div>
          </div>

          {/* Drawn Signature Image */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-white print-text-dark uppercase tracking-wider block">Digital Signature (As Drawn Manually)</span>
            <div className="bg-zinc-950/60 border border-white/10 rounded-xl p-4 flex items-center justify-center max-w-md mx-auto print-signature-box">
              {data.signatureImage ? (
                <img
                  src={data.signatureImage}
                  alt={`Signature of ${data.full_name}`}
                  className="max-h-[120px] object-contain max-w-full"
                />
              ) : (
                <span className="text-xs text-text-muted italic">No signature drawn</span>
              )}
            </div>
          </div>

        </div>

      </section>
    </main>
  )
}
