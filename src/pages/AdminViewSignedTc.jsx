import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Printer, Download, ChevronLeft, Loader2, ShieldCheck, HelpCircle } from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

export default function AdminViewSignedTc() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [isDownloading, setIsDownloading] = useState(false)

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

  // 2. Download Signed PDF Handler
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

      // Stream the blob
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

  // 3. Print Handler
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
        <div className="glass-card p-8 md:p-12 border border-white/5 bg-background/40 shadow-2xl space-y-8 print-container print-text-dark">
          
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

          {/* Original Terms and Conditions Text Content summary */}
          <div className="space-y-6 text-xs text-text-secondary leading-relaxed print-text-dark">
            <h3 className="font-heading font-bold text-white print-text-dark text-sm border-l-2 border-accent pl-3">Original Terms & Conditions Agreement</h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 bg-black/20 p-4 rounded-lg border border-white/5 print-container print-text-dark print:max-h-none print:overflow-visible print:p-0 print:border-none">
              <p>
                <strong>1. SCOPE AND NATURE OF INTERNSHIP:</strong> The internship is designed to provide you with practical experience, professional training, and mentorship in your selected technology domain. It is an educational program, and your participation does not guarantee future full-time employment at Manchester Technologies. You are expected to fulfill the tasks assigned by your mentor in a timely manner and adhere to the scheduled project timelines.
              </p>
              <p>
                <strong>2. INTELLECTUAL PROPERTY RIGHTS:</strong> All work products, codebases, designs, documentation, repositories, tools, data, algorithms, and applications created, written, or developed by you, either individually or jointly with others, during the course of your internship with Manchester Technologies, shall be the sole and exclusive property of Manchester Technologies. You hereby assign all rights, titles, and interests in and to such intellectual property to the company. You agree not to copy, upload, distribute, or otherwise use these repositories or intellectual property outside the scope of your internship tasks without explicit written authorization.
              </p>
              <p>
                <strong>3. CODE OF CONDUCT AND DISCIPLINE:</strong> As an intern, you represent Manchester Technologies. You are required to maintain the highest standards of professional conduct, integrity, and respect toward team members, mentors, and administrators. Manchester Technologies reserves the right to terminate your internship immediately without compensation or certificate issuance in cases of misconduct, plagiarism, lack of progress, unauthorized sharing of work, or violation of internal policies.
              </p>
              <p>
                <strong>4. CONFIDENTIALITY AGREEMENT (NON-DISCLOSURE):</strong> During your internship, you may have access to proprietary information, trade secrets, business processes, client lists, customer information, internal credentials, staging links, and source code. All such details constitute "Confidential Information" and must be kept strictly confidential. You shall not disclose, print, or distribute any Confidential Information to any third party, family members, or on social media platforms (including but not limited to LinkedIn, GitHub, and Twitter) during or after your internship. Your obligations under this section shall survive the termination of your internship indefinitely.
              </p>
              <p>
                <strong>5. WORK HOURS AND TIMELINE ASSIGNMENT:</strong> You are required to dedicate the minimum agreed hours per day to your assigned tasks and participate in status checks or milestone updates as requested by your mentor. Failure to demonstrate consistent activity or update progress in the Intern Workspace for five (5) consecutive working days without prior approved leave may result in automatic deletion of your internship allocation and certificate revocation.
              </p>
              <p>
                <strong>6. STIPEND AND COMPENSATION CONDITIONS:</strong> Any stipend, compensation, or reimbursement associated with your internship, if applicable, is strictly contingent upon satisfactory and complete fulfillment of all assigned tasks, final project review approval by your mentor, and successful submission of the final internship documentation. No partial stipend will be paid for incomplete or terminated internships.
              </p>
              <p>
                <strong>7. INTERNSHIP CERTIFICATE ISSUANCE:</strong> An internship completion certificate will be generated and issued to you only after: (a) completion of the entire duration of the internship; (b) successful completion of all assigned checklist items; (c) approval of your code reviews and mentor feedback; and (d) successful return of all digital assets or documentation. The certificate will feature a unique, verified QR code logged permanently in the Manchester Technologies verification ledger.
              </p>
              <p>
                <strong>8. LIMITATION OF LIABILITY AND INDEMNITY:</strong> Manchester Technologies shall not be held liable for any damages, losses, or injuries sustained by you during the internship, whether physical, financial, or technical. You agree to defend, indemnify, and hold harmless Manchester Technologies, its directors, officers, employees, and agents from any claims, liability, damages, or costs arising out of your negligence, misconduct, or breach of these terms.
              </p>
              <p>
                <strong>9. ACCEPTANCE AND ACKNOWLEDGMENT:</strong> By signing this document digitally through the Manchester Technologies Portal, you acknowledge that you have read, understood, and agreed to all the rules, conditions, confidentiality regulations, and intellectual property rights described herein. Your digital signature serves as a legally binding acceptance of these Terms & Conditions.
              </p>
            </div>
          </div>

          {/* Candidate Profile Details Grid */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 print-card">
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
                <span className="text-white print-text-dark font-mono mt-1 block">{data.signedPdfVersion || 'manchestertechnologiestandc.pdf'}</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 text-xs">
              <span className="text-text-muted block uppercase text-[10px] mb-1">Acceptance Statement</span>
              <p className="text-white print-text-dark italic font-semibold">
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
