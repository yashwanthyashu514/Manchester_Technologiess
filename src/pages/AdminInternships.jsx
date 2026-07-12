import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Clock, 
  UserCheck, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Mail, 
  RefreshCw, 
  Download, 
  Calendar, 
  MapPin, 
  ExternalLink,
  Plus,
  Trash2,
  Lock,
  User,
  Loader2,
  AlertCircle,
  Award,
  CheckSquare,
  Square,
  FileText
} from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

export default function AdminInternships() {
  const navigate = useNavigate()
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Login Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Dashboard Data States
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, shortlisted: 0, selected: 0, active: 0 })
  const [applications, setApplications] = useState([])
  const [selectedApp, setSelectedApp] = useState(null)
  const [selectedAppDetails, setSelectedAppDetails] = useState(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDomain, setFilterDomain] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDuration, setFilterDuration] = useState('')
  const [filterCollege, setFilterCollege] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Action / Form Modals States
  const [activeModal, setActiveModal] = useState(null) // 'interview' | 'project'
  const [adminNotes, setAdminNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  
  // Interview Form
  const [interviewForm, setInterviewForm] = useState({
    interview_date: '',
    interview_time: '',
    venue: '',
    online_link: '',
    instructions: ''
  })

  // Project Assignment Form
  const [projectForm, setProjectForm] = useState({
    github_username: '',
    assigned_repository: '',
    repository_url: '',
    mentor_name: '',
    project_name: '',
    start_date: '',
    end_date: ''
  })

  // Intern Tasks
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')

  // New tabs & associated state
  const [currentTab, setCurrentTab] = useState('roster') // 'roster' | 'status_mgmt' | 'signed_docs'

  // Status Management
  const [statusRecords, setStatusRecords] = useState([])
  const [statusSearch, setStatusSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [selectedStatusRecord, setSelectedStatusRecord] = useState(null)
  const [statusForm, setStatusForm] = useState({
    tracking_id: '',
    email: '',
    candidate_name: '',
    domain: '',
    mentor: '',
    status: 'Under Review',
    start_date: '',
    reporting_details: '',
    remarks: ''
  })
  const [isSavingStatus, setIsSavingStatus] = useState(false)

  // Signed Documents
  const [signedDocs, setSignedDocs] = useState([])
  const [signedDocsSearch, setSignedDocsSearch] = useState('')
  const [verifyingCertId, setVerifyingCertId] = useState('')
  const [verificationResult, setVerificationResult] = useState(null)
  const [isVerifyingSig, setIsVerifyingSig] = useState(false)

  const fetchStatusRecords = async () => {
    try {
      const q = new URLSearchParams()
      if (statusSearch) q.append('search', statusSearch)
      if (statusFilter) q.append('status', statusFilter)
      const res = await fetch(`/api/admin/application-status?${q.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStatusRecords(data.records || [])
      }
    } catch (e) {
      console.error('Failed to load status records:', e)
    }
  }

  const fetchSignedDocs = async () => {
    try {
      const q = new URLSearchParams()
      if (signedDocsSearch) q.append('search', signedDocsSearch)
      const res = await fetch(`/api/admin/digital-signatures?${q.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSignedDocs(data.records || [])
      }
    } catch (e) {
      console.error('Failed to load signed documents:', e)
    }
  }

  const handleSaveStatusRecord = async (e) => {
    e.preventDefault()
    setIsSavingStatus(true)
    try {
      const method = selectedStatusRecord ? 'PUT' : 'POST'
      const url = selectedStatusRecord 
        ? `/api/admin/application-status/${selectedStatusRecord.id}`
        : '/api/admin/application-status'
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(statusForm)
      })
      const result = await res.json()
      if (res.ok) {
        alert(selectedStatusRecord ? 'Status record updated successfully.' : 'Status record created successfully.')
        setIsStatusModalOpen(false)
        setSelectedStatusRecord(null)
        fetchStatusRecords()
        fetchMetrics()
      } else {
        alert(result.error || 'Failed to save record.')
      }
    } catch (e) {
      alert('Error saving status record.')
    } finally {
      setIsSavingStatus(false)
    }
  }

  const handleDeleteStatusRecord = async (id) => {
    if (!confirm('Are you sure you want to delete this status tracking record?')) return
    try {
      const res = await fetch(`/api/admin/application-status/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert('Record deleted successfully.')
        fetchStatusRecords()
        fetchMetrics()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete record.')
      }
    } catch (e) {
      alert('Error deleting status record.')
    }
  }

  const handleVerifySig = async (certId) => {
    setIsVerifyingSig(true)
    setVerificationResult(null)
    setVerifyingCertId(certId)
    try {
      const res = await fetch(`/api/admin/digital-signatures/${certId}/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setVerificationResult(data)
    } catch (e) {
      setVerificationResult({ valid: false, message: 'Verification lookup error.' })
    } finally {
      setIsVerifyingSig(false)
    }
  }

  // Fetch status or signatures on tab change
  useEffect(() => {
    if (isAdmin) {
      if (currentTab === 'status_mgmt') {
        fetchStatusRecords()
      } else if (currentTab === 'signed_docs') {
        fetchSignedDocs()
      }
    }
  }, [currentTab, statusSearch, statusFilter, signedDocsSearch, isAdmin])


  // Verify token role on load
  useEffect(() => {
    if (token) {
      try {
        const user = JSON.parse(localStorage.getItem('user'))
        if (user && user.role === 'admin') {
          setIsAdmin(true)
          fetchMetrics()
          fetchApplications()
        } else {
          handleLogout()
        }
      } catch (e) {
        handleLogout()
      }
    }
  }, [token])

  // Trigger data updates when filters change
  useEffect(() => {
    if (isAdmin) {
      fetchApplications()
    }
  }, [searchTerm, filterDomain, filterStatus, filterDuration, filterCollege, filterDate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setIsAdmin(false)
  }

  // Admin Login Submission
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError(null)
    setIsLoggingIn(true)

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      let data = {}
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        data = await res.json()
      } else {
        // Fallback for HTML error pages or non-JSON responses from servers like Vercel
        throw new Error('Server returned an invalid response. Please ensure database connections are configured correctly.')
      }

      if (!res.ok) {
        throw new Error(data.error || 'Login verification failed.')
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setToken(data.token)
      setIsAdmin(true)
    } catch (err) {
      console.error(err)
      setLoginError(err.message || 'Network credentials failure.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Fetch metrics data
  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setMetrics(data)
      }
    } catch (e) {
      console.error('Failed to load metrics:', e)
    }
  }

  // Fetch applications list
  const fetchApplications = async () => {
    try {
      const queryParams = new URLSearchParams()
      if (searchTerm) queryParams.append('search', searchTerm)
      if (filterDomain) queryParams.append('domain', filterDomain)
      if (filterStatus) queryParams.append('status', filterStatus)
      if (filterDuration) queryParams.append('duration', filterDuration)
      if (filterCollege) queryParams.append('college', filterCollege)
      if (filterDate) queryParams.append('date', filterDate)

      const res = await fetch(`/api/admin/applications?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications)
      }
    } catch (e) {
      console.error('Failed to load applications list:', e)
    }
  }

  // Open candidate profile detail
  const handleSelectCandidate = async (app) => {
    setSelectedApp(app)
    setSelectedAppDetails(null)
    setIsDetailsLoading(true)

    try {
      const res = await fetch(`/api/admin/applications/${app.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const result = await res.json()
        setSelectedAppDetails(result)
        setAdminNotes(result.application.notes || '')
      }
    } catch (e) {
      console.error('Failed to load candidate profile details:', e)
    } finally {
      setIsDetailsLoading(false)
    }
  }

  // Save admin notes
  const handleSaveNotes = async () => {
    if (!selectedApp) return
    setIsSavingNotes(true)
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/notes`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ notes: adminNotes })
      })

      if (res.ok) {
        alert('Notes saved successfully.')
      }
    } catch (e) {
      alert('Failed to save notes.')
    } finally {
      setIsSavingNotes(false)
    }
  }

  // Update application status
  const handleUpdateStatus = async (status) => {
    if (!selectedApp) return
    if (!confirm(`Are you sure you want to transition candidate to "${status}"?`)) return
    
    setIsUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/status`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        alert(`Candidate status updated to ${status}.`)
        fetchMetrics()
        fetchApplications()
        handleSelectCandidate(selectedApp) // reload details
      }
    } catch (e) {
      alert('Failed to update status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Resend application emails
  const handleResendEmails = async () => {
    if (!selectedApp) return
    setIsUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/resend-email`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await res.json()
      if (res.ok) {
        alert('Application emails resent successfully.')
        handleSelectCandidate(selectedApp)
      } else {
        alert(result.error || 'Failed to resend emails.')
      }
    } catch (e) {
      alert('Error triggering resend email.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Schedule Interview Submission
  const handleScheduleInterview = async (e) => {
    e.preventDefault()
    setIsUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/interview`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(interviewForm)
      })

      if (res.ok) {
        alert('Interview scheduled and invitation email sent.')
        setActiveModal(null)
        fetchMetrics()
        fetchApplications()
        handleSelectCandidate(selectedApp)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to schedule interview.')
      }
    } catch (err) {
      alert('Error scheduling interview.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Assign Project Submission
  const handleAssignProject = async (e) => {
    e.preventDefault()
    setIsUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/assign-project`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(projectForm)
      })

      if (res.ok) {
        alert('Project assigned successfully. Status updated to Active Intern.')
        setActiveModal(null)
        fetchMetrics()
        fetchApplications()
        handleSelectCandidate(selectedApp)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to assign project.')
      }
    } catch (err) {
      alert('Error assigning project.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Add tasks checklist items
  const handleAddTask = async () => {
    if (!newTaskText || !newTaskDeadline) return
    const currentTasks = selectedAppDetails.project ? selectedAppDetails.project.tasks : []
    const updatedTasks = [
      ...currentTasks,
      {
        id: Date.now(),
        task: newTaskText,
        deadline: newTaskDeadline,
        status: 'Pending',
        progress: 0
      }
    ]

    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ tasks: updatedTasks })
      })

      if (res.ok) {
        setNewTaskText('')
        setNewTaskDeadline('')
        handleSelectCandidate(selectedApp)
      }
    } catch (e) {
      alert('Failed to add task.')
    }
  }

  // Delete task checklist item
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    const currentTasks = selectedAppDetails.project.tasks
    const updatedTasks = currentTasks.filter(t => t.id !== taskId)

    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ tasks: updatedTasks })
      })

      if (res.ok) {
        handleSelectCandidate(selectedApp)
      }
    } catch (e) {
      alert('Failed to delete task.')
    }
  }

  // Complete Internship and Generate Certificate
  const handleCompleteInternship = async () => {
    if (!confirm('Are you sure you want to complete this internship? This will auto-generate and secure a QR verified PDF completion certificate.')) return
    setIsUpdatingStatus(true)
    try {
      const res = await fetch(`/api/admin/applications/${selectedApp.id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        alert('Internship completed. Verified certificate generated.')
        fetchMetrics()
        fetchApplications()
        handleSelectCandidate(selectedApp)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to complete internship.')
      }
    } catch (e) {
      alert('Error completing internship.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Delete Application
  const handleDeleteApplication = async (appId) => {
    if (!confirm('Are you sure you want to permanently delete this application? This will remove all database records and physically delete any uploaded files.')) return;
    
    try {
      const res = await fetch(`/api/admin/applications/${appId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        alert('Application deleted successfully.');
        setSelectedApp(null);
        setSelectedAppDetails(null);
        fetchMetrics();
        fetchApplications();
      } else {
        alert(result.error || 'Failed to delete application.');
      }
    } catch (e) {
      alert('Error calling delete application endpoint.');
    }
  };

  // Export applications to CSV
  const handleExportCSV = () => {
    if (applications.length === 0) {
      alert('No applications to export.');
      return;
    }
    
    // Define CSV headers including new fields
    const headers = [
      'Application ID', 'Full Name', 'Email', 'Mobile Number', 'Date of Birth', 'Gender',
      'Address', 'City', 'State', 'Country', 'College Name', 'Degree', 'Branch/Specialization',
      'Semester', 'CGPA/Percentage', 'Skills', 'Certifications', 'Previous Experience',
      'Experience Description', 'Role Applied For', 'Available Start Date', 'Duration',
      'Why Join', 'Key Skills', 'Project Description', 'Additional Comments', 'Status', 'Submission Date'
    ];
    
    // Map rows
    const csvRows = [
      headers.join(','),
      ...applications.map(app => [
        `"${app.application_id || ''}"`,
        `"${(app.full_name || '').replace(/"/g, '""')}"`,
        `"${app.email || ''}"`,
        `"${app.phone || ''}"`,
        `"${app.dob || ''}"`,
        `"${app.gender || ''}"`,
        `"${(app.address || '').replace(/"/g, '""')}"`,
        `"${(app.city || '').replace(/"/g, '""')}"`,
        `"${(app.state || '').replace(/"/g, '""')}"`,
        `"${(app.country || '').replace(/"/g, '""')}"`,
        `"${(app.college_name || '').replace(/"/g, '""')}"`,
        `"${(app.degree || '').replace(/"/g, '""')}"`,
        `"${(app.branch || '').replace(/"/g, '""')}"`,
        `"${app.semester || ''}"`,
        `"${app.cgpa || ''}"`,
        `"${(app.skills || '').replace(/"/g, '""')}"`,
        `"${(app.certifications || '').replace(/"/g, '""')}"`,
        `"${app.previous_experience || ''}"`,
        `"${(app.experience_description || '').replace(/"/g, '""')}"`,
        `"${app.preferred_domain || ''}"`,
        `"${app.start_date || ''}"`,
        `"${app.preferred_duration || ''}"`,
        `"${(app.q_why_internship || '').replace(/"/g, '""')}"`,
        `"${(app.q_tech_best || '').replace(/"/g, '""')}"`,
        `"${(app.q_best_project || '').replace(/"/g, '""')}"`,
        `"${(app.additional_comments || '').replace(/"/g, '""')}"`,
        `"${app.status || ''}"`,
        `"${app.created_at || ''}"`
      ].join(','))
    ];
    
    // Download CSV
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `internship_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Secure File Downloader (Injects JWT Header)
  const downloadFile = async (filepath) => {
    if (!filepath) return
    const filename = filepath.split(/[\\/]/).pop()
    
    try {
      const res = await fetch(`/api/admin/files/download/${encodeURIComponent(filename)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('File not found on the server. Please check if the file was physically uploaded or deleted.')
        }
        let errMsg = 'Download request rejected by server.';
        const clone = res.clone();
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg += ' ' + errData.error;
          }
        } catch (_) {
          try {
            const txt = await clone.text();
            if (txt) errMsg += ' ' + txt;
          } catch (_) {}
        }
        throw new Error(errMsg);
      }


      
      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename.split('_').slice(1).join('_') || filename // cleans prefix ID from title
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('File download failed: ' + err.message)
    }
  }


  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Submitted': return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
      case 'Pending': return 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
      case 'Under Review': return 'text-orange-400 border-orange-400/20 bg-orange-400/5'
      case 'Shortlisted': return 'text-purple-400 border-purple-400/20 bg-purple-400/5'
      case 'Interview Scheduled': return 'text-blue-400 border-blue-400/20 bg-blue-400/5'
      case 'Selected': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
      case 'Rejected': return 'text-red-400 border-red-400/20 bg-red-400/5'
      case 'Active Intern': return 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5'
      case 'Completed': return 'text-green-400 border-green-400/20 bg-green-400/5'
      default: return 'text-white border-white/10 bg-white/5'
    }
  }

  // RENDERING COMPONENT

  // Login View
  if (!isAdmin) {
    return (
      <main className="pt-20">
        <section className="section-padding py-24 max-w-md mx-auto">
          <AnimatedSection>
            <div className="glass-card p-8 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full blur-2xl" />
              
              <div className="text-center mb-8">
                <Lock className="w-12 h-12 text-accent mx-auto mb-4" />
                <h1 className="heading-md text-white">Admin Dashboard Login</h1>
                <p className="text-xs text-text-secondary mt-1">Manchester Technologies Portal Control</p>
              </div>

              {loginError && (
                <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-lg text-xs text-red-400 mb-6 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{loginError}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Registered Email *</label>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none text-sm"
                    placeholder="admin@manchestertechnologies.com"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Password *</label>
                  <input 
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  type="submit" disabled={isLoggingIn}
                  className="w-full glow-button py-3 text-xs flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Authenticate Dashboard
                </button>
              </form>
            </div>
          </AnimatedSection>
        </section>
      </main>
    )
  }

  // Dashboard Control Panel
  return (
    <main className="pt-20">
      <section className="section-padding py-10 max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="heading-md text-white">Internships Management Board</h1>
            <p className="text-xs text-text-secondary mt-1">Audit profiles, verify technical credentials, schedule interviews, and assign projects.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="glow-button-outline px-5 py-2 text-xs self-start md:self-auto"
          >
            Logout session
          </button>
        </div>

        {/* TAB SELECTOR */}
        <div className="flex border-b border-white/10 gap-2">
          {[
            { id: 'roster', label: 'Candidates Roster', icon: Users },
            { id: 'status_mgmt', label: 'Status Management', icon: Award },
            { id: 'signed_docs', label: 'Signed Documents', icon: FileText }
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isSelected = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  setSelectedApp(null);
                  setSelectedAppDetails(null);
                }}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 uppercase tracking-wider ${
                  isSelected
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>


        {/* METRICS CARD GRID */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Applicants', val: metrics.total, color: 'text-white', icon: Users },
            { label: 'Pending Audits', val: metrics.pending, color: 'text-yellow-400', icon: Clock },
            { label: 'Shortlisted', val: metrics.shortlisted, color: 'text-purple-400', icon: Mail },
            { label: 'Selected Candidates', val: metrics.selected, color: 'text-emerald-400', icon: UserCheck },
            { label: 'Active Internships', val: metrics.active, color: 'text-cyan-400', icon: CheckCircle }
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[100px]">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">{item.label}</span>
                <item.icon className={`w-4 h-4 ${item.color} opacity-60`} />
              </div>
              <span className={`text-2xl font-bold font-heading ${item.color}`}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* SEARCH AND FILTERS TOOLBAR */}
        <div className="glass-card p-5 border border-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 items-center">
            <div className="relative md:col-span-3">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-3.5" />
              <input 
                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search candidates (Name, college, skill)..."
                className="w-full bg-background/60 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:border-accent focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <select 
                value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)}
                className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
              >
                <option value="">All Domains</option>
                {['Web Development', 'Mobile App Development', 'Artificial Intelligence', 'Machine Learning', 'UI/UX Design', 'Database Development', 'Testing & QA', 'Full Stack Development'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select 
                value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
              >
                <option value="">All Statuses</option>
                {['Pending', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Active Intern', 'Completed'].map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select 
                value={filterDuration} onChange={(e) => setFilterDuration(e.target.value)}
                className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
              >
                <option value="">All Durations</option>
                <option value="30 Days">30 Days</option>
                <option value="45 Days">45 Days</option>
                <option value="60 Days">60 Days</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <input 
                type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                title="Filter by Submission Date"
                className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
              />
            </div>

            <div className="md:col-span-1">
              <button 
                type="button" onClick={handleExportCSV}
                title="Export filtered Roster to CSV"
                className="w-full bg-accent hover:bg-accent-light text-background font-bold p-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* APPLICATIONS LIST TABLE AND DETAIL DRAWER LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Applications list Table (Span 7 or 12) */}
          <div className={`${selectedApp ? 'lg:col-span-6' : 'lg:col-span-12'} glass-card border border-white/5 overflow-hidden`}>
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-heading font-bold text-white text-sm">Candidates Roster</h3>
              <span className="text-xs text-text-muted">{applications.length} Records</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5 bg-background/40 text-text-secondary uppercase font-semibold">
                    <th className="p-4">App ID</th>
                    <th className="p-4">Applicant Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Mobile Number</th>
                    <th className="p-4">College Name</th>
                    <th className="p-4">Applied Role</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Resume</th>
                    <th className="p-4">Signed T&C</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-text-muted">No applications found matching search filters.</td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr 
                        key={app.id} 
                        onClick={() => handleSelectCandidate(app)}
                        className={`cursor-pointer hover:bg-white/5 transition-colors ${selectedApp?.id === app.id ? 'bg-accent/5' : ''}`}
                      >
                        <td className="p-4 font-bold text-white">{app.application_id}</td>
                        <td className="p-4 font-bold text-white">{app.full_name}</td>
                        <td className="p-4">{app.email}</td>
                        <td className="p-4">{app.phone}</td>
                        <td className="p-4 text-text-secondary">{app.college_name}</td>
                        <td className="p-4 text-white font-medium">{app.preferred_domain}</td>
                        <td className="p-4 text-text-secondary">{app.created_at ? app.created_at.split('T')[0] : 'N/A'}</td>
                        <td className="p-4">
                          {app.resume_path ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(app.resume_path);
                              }}
                              className="bg-accent/10 hover:bg-accent/25 border border-accent/30 text-accent font-bold px-2.5 py-1 rounded transition-colors text-[10px] flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> Download
                            </button>
                          ) : (
                            <span className="text-text-muted">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${
                            app.termsAccepted
                              ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                              : 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
                          }`}>
                            {app.termsAccepted ? 'Signed' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full border text-[10px] font-bold ${getStatusBadgeColor(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table></div>
          </div>

          {/* CANDIDATE DETAIL PROFILE DRAWER (Span 6) */}
          <AnimatePresence>
            {selectedApp && (
              <motion.div 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 50 }} 
                className="lg:col-span-6 glass-card border border-white/10 p-6 space-y-6 relative overflow-hidden"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="absolute top-4 right-4 text-text-muted hover:text-white font-bold text-lg p-1 bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center"
                >
                  &times;
                </button>

                {isDetailsLoading && (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-text-secondary">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    <span>Fetching profile database record...</span>
                  </div>
                )}

                {selectedAppDetails && (
                  <div className="space-y-6">
                    
                    {/* Header */}
                    <div>
                      <span className={`px-3 py-1 rounded-full border text-xs font-bold ${getStatusBadgeColor(selectedAppDetails.application.status)}`}>
                        {selectedAppDetails.application.status}
                      </span>
                      <h2 className="heading-md mt-4 text-white">{selectedAppDetails.application.full_name}</h2>
                      <p className="text-xs text-text-secondary mt-1">Application ID: <strong>{selectedAppDetails.application.application_id}</strong></p>
                    </div>

                    {/* Email Log Retrier Warning Banner */}
                    {selectedAppDetails.application.email_notification_sent === 0 && (
                      <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-lg text-xs text-red-400 space-y-2">
                        <div className="flex gap-2 font-bold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Admin/Applicant Notification Mail Failed</span>
                        </div>
                        <p className="leading-relaxed">Error: {selectedAppDetails.application.email_notification_error || 'Mailer credentials incorrect.'}</p>
                        <button 
                          onClick={handleResendEmails}
                          className="bg-red-500 text-white font-bold px-3 py-1 rounded hover:bg-red-600 transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry Sending Emails
                        </button>
                      </div>
                    )}

                    {/* Quick Action bar */}
                    <div className="flex flex-wrap gap-2 border-y border-white/5 py-4">
                      {['Submitted', 'Pending'].includes(selectedAppDetails.application.status) && (
                        <button onClick={() => handleUpdateStatus('Under Review')} className="bg-orange-500 text-white font-bold px-4 py-2 rounded text-xs">Review Profile</button>
                      )}
                      
                      {['Submitted', 'Pending', 'Under Review'].includes(selectedAppDetails.application.status) && (
                        <>
                          <button onClick={() => setActiveModal('interview')} className="bg-blue-500 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Schedule Interview</button>
                          <button onClick={() => handleUpdateStatus('Rejected')} className="bg-red-500 text-white font-bold px-4 py-2 rounded text-xs">Reject</button>
                        </>
                      )}

                      {selectedAppDetails.application.status === 'Interview Scheduled' && (
                        <>
                          <button onClick={() => handleUpdateStatus('Selected')} className="bg-emerald-500 text-white font-bold px-4 py-2 rounded text-xs">Approve Selection</button>
                          <button onClick={() => handleUpdateStatus('Rejected')} className="bg-red-500 text-white font-bold px-4 py-2 rounded text-xs">Reject Selection</button>
                        </>
                      )}

                      {selectedAppDetails.application.status === 'Selected' && (
                        <button onClick={() => setActiveModal('project')} className="bg-cyan-500 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" /> Assign GitHub Project</button>
                      )}

                      {selectedAppDetails.application.status === 'Active Intern' && (
                        <button onClick={handleCompleteInternship} className="bg-green-500 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Complete Internship & Issue Cert</button>
                      )}

                      {selectedAppDetails.application.status === 'Completed' && selectedAppDetails.certificate && (
                        <a 
                          href={`/api/internships/certificate/download/${selectedAppDetails.certificate.certificate_number}`}
                          className="bg-green-500 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Generated Certificate
                        </a>
                      )}

                      {selectedAppDetails.application.termsAccepted === 1 && (
                        <button 
                          onClick={() => navigate(`/admin/view-signed-tc/${selectedAppDetails.application.id}`)}
                          className="bg-accent hover:bg-accent/80 text-background font-bold px-4 py-2 rounded text-xs flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Signed T&C
                        </button>
                      )}

                      <button 
                        onClick={() => handleDeleteApplication(selectedAppDetails.application.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Application
                      </button></div>

                    {/* Status Dropdown Manual Override */}
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3 text-xs">
                      <span className="text-text-secondary font-bold uppercase tracking-wider text-[10px]">Assign Status:</span>
                      <select
                        value={selectedAppDetails.application.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        disabled={isUpdatingStatus}
                        className="bg-background border border-white/20 rounded px-2.5 py-1 text-xs text-white focus:border-accent focus:outline-none"
                      >
                        {['Submitted', 'Pending', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Active Intern', 'Completed'].map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>


                    {/* Detailed Data Tabs */}
                    <div className="space-y-6 text-xs">
                      
                      {/* Personal */}
                      <div className="space-y-2">
                        <h4 className="font-heading font-bold text-accent uppercase tracking-wider text-[10px]">Candidate Details</h4>
                        <div className="grid grid-cols-2 gap-4 bg-background/50 p-4 rounded-lg border border-white/5">
                          <div><span className="text-text-muted">Email:</span> <span className="text-white font-medium block">{selectedAppDetails.application.email}</span></div>
                          <div><span className="text-text-muted">Phone:</span> <span className="text-white font-medium block">{selectedAppDetails.application.phone}</span></div>
                          <div><span className="text-text-muted">DOB:</span> <span className="text-white font-medium block">{selectedAppDetails.application.dob}</span></div>
                          <div><span className="text-text-muted">Gender:</span> <span className="text-white font-medium block">{selectedAppDetails.application.gender}</span></div>
                          <div className="col-span-2"><span className="text-text-muted">Location:</span> <span className="text-white font-medium block">{selectedAppDetails.application.city}, {selectedAppDetails.application.state}, {selectedAppDetails.application.country || 'N/A'}</span></div>
                          <div className="col-span-2"><span className="text-text-muted">Address:</span> <span className="text-white font-medium block">{selectedAppDetails.application.address}</span></div>
                        </div>
                      </div>

                      {/* Academics */}
                      <div className="space-y-2">
                        <h4 className="font-heading font-bold text-accent uppercase tracking-wider text-[10px]">Academic Background</h4>
                        <div className="bg-background/50 p-4 rounded-lg border border-white/5 space-y-2">
                          <div><span className="text-text-muted">College Name:</span> <strong className="text-white block">{selectedAppDetails.application.college_name}</strong></div>
                          <div><span className="text-text-muted">University Name:</span> <span className="text-white block">{selectedAppDetails.application.university_name}</span></div>
                          <div><span className="text-text-muted">Degree:</span> <span className="text-white block font-medium">{selectedAppDetails.application.degree || 'N/A'}</span></div>
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <div><span className="text-text-muted">Branch/Spec:</span> <span className="text-white block font-medium">{selectedAppDetails.application.branch || selectedAppDetails.application.department || 'N/A'}</span></div>
                            <div><span className="text-text-muted">Sem/Year:</span> <span className="text-white block">{selectedAppDetails.application.semester}</span></div>
                            <div><span className="text-text-muted">CGPA/%:</span> <strong className="text-white block">{selectedAppDetails.application.cgpa}</strong></div>
                          </div>
                        </div>
                      </div>

                      {/* Technical */}
                      <div className="space-y-2">
                        <h4 className="font-heading font-bold text-accent uppercase tracking-wider text-[10px]">Technical & Professional Profile</h4>
                        <div className="bg-background/50 p-4 rounded-lg border border-white/5 space-y-3">
                          <div><span className="text-text-muted">Skills:</span> <span className="text-white block font-medium">{selectedAppDetails.application.skills}</span></div>
                          <div><span className="text-text-muted">Certifications:</span> <span className="text-white block font-medium">{selectedAppDetails.application.certifications || 'N/A'}</span></div>
                          <div><span className="text-text-muted">Previous Experience:</span> <span className="text-white block font-medium">{selectedAppDetails.application.previous_experience || 'N/A'}</span></div>
                          {selectedAppDetails.application.previous_experience === 'Yes' && (
                            <div><span className="text-text-muted">Experience Description:</span> <p className="text-white leading-relaxed bg-white/5 p-2 rounded mt-1">{selectedAppDetails.application.experience_description}</p></div>
                          )}
                          <div><span className="text-text-muted">Technologies:</span> <span className="text-white block font-medium">{selectedAppDetails.application.technologies_known || 'N/A'}</span></div>
                          <div><span className="text-text-muted">Languages:</span> <span className="text-white block font-medium">{selectedAppDetails.application.programming_languages || 'N/A'}</span></div>
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5">
                            {selectedAppDetails.application.github_profile && <div><span className="text-text-muted">GitHub:</span> <a href={selectedAppDetails.application.github_profile} target="_blank" className="text-accent block">Visit repo</a></div>}
                            {selectedAppDetails.application.linkedin_profile && <div><span className="text-text-muted">LinkedIn:</span> <a href={selectedAppDetails.application.linkedin_profile} target="_blank" className="text-accent block">Visit profile</a></div>}
                            {selectedAppDetails.application.portfolio_url && <div><span className="text-text-muted">Portfolio:</span> <a href={selectedAppDetails.application.portfolio_url} target="_blank" className="text-accent block">Visit url</a></div>}
                          </div>
                        </div>
                      </div>

                      {/* Questionnaire answers */}
                      <div className="space-y-2">
                        <h4 className="font-heading font-bold text-accent uppercase tracking-wider text-[10px]">Questionnaire & Comments</h4>
                        <div className="bg-background/50 p-4 rounded-lg border border-white/5 space-y-4 max-h-[200px] overflow-y-auto">
                          <div><span className="text-text-muted font-bold block mb-1">Why join Manchester Technologies?</span> <p className="text-white leading-relaxed">{selectedAppDetails.application.q_why_internship}</p></div>
                          <div><span className="text-text-muted font-bold block mb-1">Key Skills:</span> <p className="text-white leading-relaxed">{selectedAppDetails.application.q_tech_best}</p></div>
                          <div><span className="text-text-muted font-bold block mb-1">Project Description:</span> <p className="text-white leading-relaxed">{selectedAppDetails.application.q_best_project}</p></div>
                          <div><span className="text-text-muted font-bold block mb-1">Daily hours?</span> <p className="text-white leading-relaxed">{selectedAppDetails.application.q_hours_per_day}</p></div>
                          <div><span className="text-text-muted font-bold block mb-1">Why select you?</span> <p className="text-white leading-relaxed">{selectedAppDetails.application.q_why_select}</p></div>
                          <div><span className="text-text-muted font-bold block mb-1">Career goals?</span> <p className="text-white leading-relaxed">{selectedAppDetails.application.q_career_goals}</p></div>
                          {selectedAppDetails.application.additional_comments && (
                            <div><span className="text-text-muted font-bold block mb-1">Additional Comments:</span> <p className="text-white leading-relaxed">{selectedAppDetails.application.additional_comments}</p></div>
                          )}
                        </div>
                      </div>

                      {/* File uploads download controls */}
                      <div className="space-y-2">
                        <h4 className="font-heading font-bold text-accent uppercase tracking-wider text-[10px]">Attached Documents</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedAppDetails.application.resume_path && (
                            <button 
                              onClick={() => downloadFile(selectedAppDetails.application.resume_path)}
                              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-2 rounded-lg flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-accent" /> Resume
                            </button>
                          )}
                          {selectedAppDetails.application.portfolio_path && (
                            <button 
                              onClick={() => downloadFile(selectedAppDetails.application.portfolio_path)}
                              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-2 rounded-lg flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-accent" /> Portfolio File
                            </button>
                          )}
                          {selectedAppDetails.application.docs_path && (
                            <button 
                              onClick={() => downloadFile(selectedAppDetails.application.docs_path)}
                              className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-3 py-2 rounded-lg flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-accent" /> Extra Docs
                            </button>
                          )}
                        </div>
                      </div>

                      {/* INTERVIEW CARD INFO IN PROFILE */}
                      {selectedAppDetails.interview && (
                        <div className="space-y-2">
                          <h4 className="font-heading font-bold text-blue-400 uppercase tracking-wider text-[10px]">Scheduled Interview Info</h4>
                          <div className="bg-blue-950/10 border border-blue-500/20 p-4 rounded-lg space-y-2">
                            <div><span className="text-text-secondary">Slot:</span> <strong className="text-white">{selectedAppDetails.interview.interview_date} at {selectedAppDetails.interview.interview_time}</strong></div>
                            <div><span className="text-text-secondary">Venue:</span> <span className="text-white">{selectedAppDetails.interview.venue}</span></div>
                            {selectedAppDetails.interview.online_link && <div><span className="text-text-secondary">Link:</span> <a href={selectedAppDetails.interview.online_link} target="_blank" className="text-accent">{selectedAppDetails.interview.online_link}</a></div>}
                          </div>
                        </div>
                      )}

                      {/* INTERN CHECKLIST TASKS IN PROFILE */}
                      {selectedAppDetails.project && (
                        <div className="space-y-3">
                          <h4 className="font-heading font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Project Assignment & Tasks Checklist</h4>
                          <div className="bg-cyan-950/5 border border-cyan-500/10 p-4 rounded-lg space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div><span className="text-text-secondary">Project:</span> <strong className="text-white block">{selectedAppDetails.project.project_name}</strong></div>
                              <div><span className="text-text-secondary">Mentor Name:</span> <span className="text-white block">{selectedAppDetails.project.mentor_name}</span></div>
                              <div className="col-span-2"><span className="text-text-secondary">Repository:</span> <a href={selectedAppDetails.project.repository_url} target="_blank" className="text-accent block flex items-center gap-1">{selectedAppDetails.project.assigned_repository} <ExternalLink className="w-3 h-3" /></a></div>
                            </div>
                            
                            {/* Checklist tasks mapping */}
                            <div className="space-y-2 border-t border-white/5 pt-3">
                              <span className="text-[10px] text-text-secondary font-bold block mb-1">Checklist Progress:</span>
                              {selectedAppDetails.project.tasks.length === 0 ? (
                                <p className="text-[10px] text-text-muted">No custom tasks assigned.</p>
                              ) : (
                                selectedAppDetails.project.tasks.map((task) => (
                                  <div key={task.id} className="flex items-start justify-between gap-2 bg-background/50 p-2 rounded">
                                    <div className="flex gap-2 items-start">
                                      {task.status === 'Completed' ? (
                                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                      ) : (
                                        <Square className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                                      )}
                                      <div>
                                        <p className="text-white font-medium">{task.task}</p>
                                        <span className="text-[9px] text-text-muted">Deadline: {task.deadline}</span>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-red-400 hover:text-red-500 p-0.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))
                              )}

                              {/* Task Insertion input */}
                              {selectedAppDetails.application.status === 'Active Intern' && (
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                  <input 
                                    type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)}
                                    placeholder="Add new task description..."
                                    className="w-full bg-background border border-white/10 rounded px-2 py-1 text-[11px] text-white"
                                  />
                                  <div className="flex gap-2">
                                    <input 
                                      type="date" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)}
                                      className="flex-1 bg-background border border-white/10 rounded px-2 py-1 text-[11px] text-white"
                                    />
                                    <button 
                                      onClick={handleAddTask}
                                      className="bg-cyan-500 text-white font-bold px-3 py-1 rounded text-[11px] flex items-center gap-1"
                                    >
                                      <Plus className="w-3 h-3" /> Add Task
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notes Section */}
                      <div className="space-y-2 border-t border-white/5 pt-4">
                        <h4 className="font-heading font-bold text-accent uppercase tracking-wider text-[10px]">Internal Admin Notes</h4>
                        <textarea 
                          rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add details, evaluation results, qualifications..."
                          className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none resize-none"
                        />
                        <button 
                          onClick={handleSaveNotes} disabled={isSavingNotes}
                          className="bg-accent text-background font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5"
                        >
                          {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          Save Candidate Notes
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>



        {/* ─── TAB 1: ROSTER VIEW ─────────────────────────────────────────── */}
        {currentTab === 'roster' && (
          <>
            {/* SEARCH AND FILTERS TOOLBAR */}
            <div className="glass-card p-5 border border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 items-center">
                <div className="relative md:col-span-3">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-3.5" />
                  <input 
                    type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search candidates (Name, college, skill)..."
                    className="w-full bg-background/60 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <select 
                    value={filterDomain} onChange={(e) => setFilterDomain(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="">All Domains</option>
                    {['Web Development', 'Mobile App Development', 'Artificial Intelligence', 'Machine Learning', 'UI/UX Design', 'Database Development', 'Testing & QA', 'Full Stack Development'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <select 
                    value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    {['Pending', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected', 'Active Intern', 'Completed'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <select 
                    value={filterDuration} onChange={(e) => setFilterDuration(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="">All Durations</option>
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <input 
                    type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                    title="Filter by Submission Date"
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  />
                </div>

                <div className="md:col-span-1">
                  <button 
                    type="button" onClick={handleExportCSV}
                    title="Export filtered Roster to CSV"
                    className="w-full bg-accent hover:bg-accent-light text-background font-bold p-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Export
                  </button>
                </div>
              </div>
            </div>

            {/* APPLICATIONS LIST TABLE AND DETAIL DRAWER LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Applications list Table (Span 7 or 12) */}
              <div className={`${selectedApp ? 'lg:col-span-6' : 'lg:col-span-12'} glass-card border border-white/5 overflow-hidden`}>
                <div className="p-5 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-heading font-bold text-white text-sm">Candidates Roster</h3>
                  <span className="text-xs text-text-muted">{applications.length} Records</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-white/5 bg-background/40 text-text-secondary uppercase font-semibold">
                        <th className="p-4">App ID</th>
                        <th className="p-4">Applicant Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Mobile Number</th>
                        <th className="p-4">College Name</th>
                        <th className="p-4">Applied Role</th>
                        <th className="p-4">Submission Date</th>
                        <th className="p-4">Resume</th>
                        <th className="p-4">Signed T&C</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {applications.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-text-muted">No applications found matching search filters.</td>
                        </tr>
                      ) : (
                        applications.map((app) => (
                          <tr 
                            key={app.id} 
                            onClick={() => handleSelectCandidate(app)}
                            className={`cursor-pointer hover:bg-white/5 transition-colors ${selectedApp?.id === app.id ? 'bg-accent/5' : ''}`}
                          >
                            <td className="p-4 font-bold text-white">{app.application_id}</td>
                            <td className="p-4 font-bold text-white">{app.full_name}</td>
                            <td className="p-4">{app.email}</td>
                            <td className="p-4">{app.phone}</td>
                            <td className="p-4 text-text-secondary">{app.college_name}</td>
                            <td className="p-4 text-white font-medium">{app.preferred_domain}</td>
                            <td className="p-4 text-text-secondary">{app.created_at ? app.created_at.split('T')[0] : 'N/A'}</td>
                            <td className="p-4">
                              {app.resume_path ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadFile(app.resume_path);
                                  }}
                                  className="text-accent hover:underline flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download
                                </button>
                              ) : (
                                <span className="text-text-muted">No upload</span>
                              )}
                            </td>
                            <td className="p-4">
                              {app.terms_accepted ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/admin/view-signed-tc/${app.id}`);
                                  }}
                                  className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" /> View Signed
                                </button>
                              ) : (
                                <span className="text-text-muted">Pending</span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusBadgeColor(app.status)}`}>
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Drawer Candidate Detail Panel */}
              <AnimatePresence>
                {selectedApp && (
                  <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="lg:col-span-6 glass-card border border-white/5 divide-y divide-white/5 relative"
                  >
                    {/* Header Controls */}
                    <div className="p-5 flex justify-between items-center bg-white/2">
                      <div>
                        <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Audit Profile Details</span>
                        <h3 className="font-heading font-bold text-white text-base mt-1">{selectedApp.full_name}</h3>
                      </div>
                      <button 
                        onClick={() => { setSelectedApp(null); setSelectedAppDetails(null); }}
                        className="text-text-secondary hover:text-white font-heading font-black text-lg"
                      >
                        &times;
                      </button>
                    </div>

                    {isDetailsLoading ? (
                      <div className="py-24 text-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
                        <p className="text-xs text-text-secondary">Retrieving cryptographic candidate credentials...</p>
                      </div>
                    ) : !selectedAppDetails ? (
                      <div className="p-6 text-center text-xs text-red-400">Failed to load candidate profile details.</div>
                    ) : (
                      <div className="p-6 space-y-6 max-h-[800px] overflow-y-auto custom-scrollbar">
                        
                        {/* Status Transition Toolbar */}
                        <div className="space-y-2">
                          <h4 className="font-heading font-bold text-accent uppercase tracking-wider text-[10px]">Transition State Status</h4>
                          <div className="flex flex-wrap gap-2">
                            {['Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Rejected'].map((status) => (
                              <button
                                key={status}
                                onClick={() => handleUpdateStatus(status)}
                                disabled={isUpdatingStatus}
                                className={`px-3 py-1.5 rounded text-[10px] font-bold border transition-colors ${
                                  selectedAppDetails.application.status === status
                                    ? 'bg-accent text-background border-accent'
                                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            onClick={() => {
                              setInterviewForm({
                                interview_date: selectedAppDetails.interview?.interview_date || '',
                                interview_time: selectedAppDetails.interview?.interview_time || '',
                                venue: selectedAppDetails.interview?.venue || '',
                                online_link: selectedAppDetails.interview?.online_link || '',
                                instructions: selectedAppDetails.interview?.instructions || ''
                              })
                              setActiveModal('interview')
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Calendar className="w-4 h-4" /> Schedule Interview
                          </button>
                          
                          <button
                            onClick={() => {
                              setProjectForm({
                                github_username: selectedAppDetails.project?.github_username || '',
                                assigned_repository: selectedAppDetails.project?.assigned_repository || '',
                                repository_url: selectedAppDetails.project?.repository_url || '',
                                mentor_name: selectedAppDetails.project?.mentor_name || '',
                                project_name: selectedAppDetails.project?.project_name || '',
                                start_date: selectedAppDetails.project?.start_date || '',
                                end_date: selectedAppDetails.project?.end_date || ''
                              })
                              setActiveModal('project')
                            }}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <Briefcase className="w-4 h-4" /> Assign Project
                          </button>

                          {selectedAppDetails.application.status === 'Active Intern' && (
                            <button
                              onClick={handleCompleteInternship}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <Award className="w-4 h-4" /> Complete &amp; Issue Cert
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteApplication(selectedAppDetails.application.id)}
                            className="bg-red-650 hover:bg-red-700 text-white font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5 transition-colors ml-auto"
                          >
                            <Trash2 className="w-4 h-4" /> Delete App
                          </button>
                        </div>

                        {/* INTERVIEW SCHEDULE CARD IN PROFILE */}
                        {selectedAppDetails.interview && (
                          <div className="space-y-2">
                            <h4 className="font-heading font-bold text-blue-400 uppercase tracking-wider text-[10px]">Interview Details</h4>
                            <div className="bg-blue-950/10 border border-blue-500/20 p-4 rounded-lg space-y-2">
                              <div><span className="text-text-secondary">Slot:</span> <strong className="text-white">{selectedAppDetails.interview.interview_date} at {selectedAppDetails.interview.interview_time}</strong></div>
                              <div><span className="text-text-secondary">Venue:</span> <span className="text-white">{selectedAppDetails.interview.venue}</span></div>
                              {selectedAppDetails.interview.online_link && <div><span className="text-text-secondary">Link:</span> <a href={selectedAppDetails.interview.online_link} target="_blank" className="text-accent">{selectedAppDetails.interview.online_link}</a></div>}
                            </div>
                          </div>
                        )}

                        {/* INTERN CHECKLIST TASKS IN PROFILE */}
                        {selectedAppDetails.project && (
                          <div className="space-y-3">
                            <h4 className="font-heading font-bold text-cyan-400 uppercase tracking-wider text-[10px]">Project Assignment & Tasks Checklist</h4>
                            <div className="bg-cyan-950/5 border border-cyan-500/10 p-4 rounded-lg space-y-4">
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div><span className="text-text-secondary">Project:</span> <strong className="text-white block">{selectedAppDetails.project.project_name}</strong></div>
                                <div><span className="text-text-secondary">Mentor Name:</span> <span className="text-white block">{selectedAppDetails.project.mentor_name}</span></div>
                                <div className="col-span-2"><span className="text-text-secondary">Repository:</span> <a href={selectedAppDetails.project.repository_url} target="_blank" className="text-accent block flex items-center gap-1">{selectedAppDetails.project.assigned_repository} <ExternalLink className="w-3 h-3" /></a></div>
                              </div>
                              
                              {/* Checklist tasks mapping */}
                              <div className="space-y-2 border-t border-white/5 pt-3">
                                <span className="text-[10px] text-text-secondary font-bold block mb-1">Checklist Progress:</span>
                                {selectedAppDetails.project.tasks.length === 0 ? (
                                  <p className="text-[10px] text-text-muted">No custom tasks assigned.</p>
                                ) : (
                                  selectedAppDetails.project.tasks.map((task) => (
                                    <div key={task.id} className="flex items-start justify-between gap-2 bg-background/50 p-2 rounded">
                                      <div className="flex gap-2 items-start">
                                        {task.status === 'Completed' ? (
                                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                                        ) : (
                                          <Square className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                                        )}
                                        <div>
                                          <p className="text-white font-medium">{task.task}</p>
                                          <span className="text-[9px] text-text-muted">Deadline: {task.deadline}</span>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="text-red-400 hover:text-red-500 p-0.5"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))
                                )}

                                {/* Task Insertion input */}
                                {selectedAppDetails.application.status === 'Active Intern' && (
                                  <div className="space-y-2 pt-2 border-t border-white/5">
                                    <input 
                                      type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)}
                                      placeholder="Add new task description..."
                                      className="w-full bg-background border border-white/10 rounded px-2 py-1 text-[11px] text-white"
                                    />
                                    <div className="flex gap-2">
                                      <input 
                                        type="date" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)}
                                        className="flex-1 bg-background border border-white/10 rounded px-2 py-1 text-[11px] text-white"
                                      />
                                      <button 
                                        onClick={handleAddTask}
                                        className="bg-cyan-500 text-white font-bold px-3 py-1 rounded text-[11px] flex items-center gap-1"
                                      >
                                        <Plus className="w-3 h-3" /> Add Task
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes Section */}
                        <div className="space-y-2 border-t border-white/5 pt-4">
                          <h4 className="font-heading font-bold text-accent uppercase tracking-wider text-[10px]">Internal Admin Notes</h4>
                          <textarea 
                            rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add details, evaluation results, qualifications..."
                            className="w-full bg-background border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none resize-none"
                          />
                          <button 
                            onClick={handleSaveNotes} disabled={isSavingNotes}
                            className="bg-accent text-background font-bold px-4 py-2 rounded text-xs flex items-center gap-1.5"
                          >
                            {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            Save Candidate Notes
                          </button>
                        </div>

                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </>
        )}

        {/* ─── TAB 2: STATUS MANAGEMENT (CRUD) ────────────────────────────── */}
        {currentTab === 'status_mgmt' && (
          <div className="space-y-6">
            {/* Status Mgmt Toolbar */}
            <div className="glass-card p-5 border border-white/5 flex flex-wrap justify-between items-center gap-4">
              <div className="flex gap-3 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                  <input
                    type="text"
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    placeholder="Search status records (Name, Email, ID)..."
                    className="w-full bg-background/60 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-accent focus:outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-background/60 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-accent focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Selected">Selected</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setSelectedStatusRecord(null)
                  setStatusForm({
                    tracking_id: '',
                    email: '',
                    candidate_name: '',
                    domain: '',
                    mentor: '',
                    status: 'Under Review',
                    start_date: '',
                    reporting_details: '',
                    remarks: ''
                  })
                  setIsStatusModalOpen(true)
                }}
                className="glow-button px-5 py-2 text-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create Status Record
              </button>
            </div>

            {/* Status Mgmt List */}
            <div className="glass-card border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/5 bg-background/40 text-text-secondary uppercase font-semibold">
                      <th className="p-4">Tracking ID</th>
                      <th className="p-4">Candidate Name</th>
                      <th className="p-4">Gmail Address</th>
                      <th className="p-4">Domain</th>
                      <th className="p-4">Assigned Mentor</th>
                      <th className="p-4">Start Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {statusRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-text-muted">No status tracking records found.</td>
                      </tr>
                    ) : (
                      statusRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono font-bold text-accent">{rec.tracking_id}</td>
                          <td className="p-4 font-bold text-white">{rec.candidate_name}</td>
                          <td className="p-4">{rec.email}</td>
                          <td className="p-4 text-text-secondary">{rec.domain || '—'}</td>
                          <td className="p-4 text-text-secondary">{rec.mentor || '—'}</td>
                          <td className="p-4 text-text-secondary">{rec.start_date || '—'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                              rec.status === 'Selected' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                              rec.status === 'Rejected' ? 'text-red-400 border-red-500/20 bg-red-500/5' :
                              'text-amber-400 border-amber-500/20 bg-amber-500/5'
                            }`}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setSelectedStatusRecord(rec)
                                setStatusForm({
                                  tracking_id: rec.tracking_id,
                                  email: rec.email,
                                  candidate_name: rec.candidate_name,
                                  domain: rec.domain || '',
                                  mentor: rec.mentor || '',
                                  status: rec.status,
                                  start_date: rec.start_date || '',
                                  reporting_details: rec.reporting_details || '',
                                  remarks: rec.remarks || ''
                                })
                                setIsStatusModalOpen(true)
                              }}
                              className="text-accent hover:underline font-bold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStatusRecord(rec.id)}
                              className="text-red-400 hover:underline font-bold"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: SIGNED DOCUMENTS ───────────────────────────────────── */}
        {currentTab === 'signed_docs' && (
          <div className="space-y-6">
            {/* Signed Docs Toolbar */}
            <div className="glass-card p-5 border border-white/5 flex flex-col md:flex-row justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  value={signedDocsSearch}
                  onChange={(e) => setSignedDocsSearch(e.target.value)}
                  placeholder="Search signed agreements (Name, Email, Cert ID)..."
                  className="w-full bg-background/60 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:border-accent focus:outline-none"
                />
              </div>

              {/* Certificate Verification Box */}
              <div className="flex gap-2 items-center bg-white/2 border border-white/5 px-3 py-1.5 rounded-lg">
                <span className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Verify Signature:</span>
                <input
                  type="text"
                  placeholder="MT-SIGN-2026-000001"
                  id="cert-verify-input"
                  className="bg-background/80 border border-white/10 rounded px-2 py-1 text-xs text-white font-mono uppercase tracking-wider w-44"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('cert-verify-input')
                    if (input && input.value.trim()) {
                      handleVerifySig(input.value.trim())
                    }
                  }}
                  className="bg-accent hover:bg-accent/80 text-background font-bold px-3 py-1 rounded text-xs"
                >
                  Lookup
                </button>
              </div>
            </div>

            {/* Verification Result Display */}
            <AnimatePresence>
              {verificationResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`p-5 rounded-xl border ${
                    verificationResult.valid 
                      ? 'border-emerald-500/20 bg-emerald-950/5 text-emerald-400' 
                      : 'border-red-500/20 bg-red-950/5 text-red-400'
                  } text-xs flex justify-between items-start`}
                >
                  <div>
                    {verificationResult.valid ? (
                      <div className="space-y-1">
                        <strong className="block text-sm">✓ Signature Certificate Verified Authentically</strong>
                        <p className="text-text-secondary mt-1">
                          Candidate <strong>{verificationResult.signature.candidate_name}</strong> ({verificationResult.signature.email})
                          digitally signed the agreement for domain <strong>{verificationResult.signature.domain}</strong> on{' '}
                          {new Date(verificationResult.signature.signed_at).toLocaleString('en-IN')}.
                        </p>
                        <p className="text-text-muted text-[10px]">
                          Secure Registry ID: {verificationResult.signature.certificate_id} | Application ID: {verificationResult.signature.application_id}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <strong className="block text-sm">✗ Verification Lookup Failed</strong>
                        <p className="text-text-secondary mt-1">{verificationResult.message || 'Signature Certificate ID is invalid or unregistered.'}</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setVerificationResult(null)} className="text-text-secondary hover:text-white font-bold">&times;</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Signed Docs Table */}
            <div className="glass-card border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/5 bg-background/40 text-text-secondary uppercase font-semibold">
                      <th className="p-4">Certificate ID</th>
                      <th className="p-4">Candidate Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">App ID</th>
                      <th className="p-4">Domain</th>
                      <th className="p-4">Signed Date</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4 text-right">Document Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {signedDocs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-text-muted">No signed agreement documents found.</td>
                      </tr>
                    ) : (
                      signedDocs.map((sig) => (
                        <tr key={sig.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono font-bold text-accent">{sig.certificate_id}</td>
                          <td className="p-4 font-bold text-white">{sig.candidate_name}</td>
                          <td className="p-4">{sig.email}</td>
                          <td className="p-4 font-mono">{sig.application_id}</td>
                          <td className="p-4 text-text-secondary">{sig.domain}</td>
                          <td className="p-4 text-text-secondary">
                            {new Date(sig.signed_at).toLocaleDateString('en-IN')} at {new Date(sig.signed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 text-text-muted font-mono">{sig.ip_address || '—'}</td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => navigate(`/admin/view-signed-tc/${sig.application_id}`)}
                              className="text-accent hover:underline font-bold"
                            >
                              View T&amp;C
                            </button>
                            <a
                              href={`/api/admin/digital-signatures/${sig.application_id}/download-pdf`}
                              className="text-emerald-400 hover:underline font-bold"
                            >
                              Download PDF
                            </a>
                            <button
                              onClick={() => handleVerifySig(sig.certificate_id)}
                              className="text-cyan-400 hover:underline font-bold"
                            >
                              Verify Cert
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* =========================================================================
           ACTION MODALS (Interview and Project Assignment Panels)
           ========================================================================= */}
        
        {/* INTERVIEW MODAL */}
        {activeModal === 'interview' && selectedApp && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full border border-white/10 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="font-heading font-bold text-white text-base">Schedule Interview</h3>
                <button onClick={() => setActiveModal(null)} className="text-text-secondary hover:text-white font-bold">&times;</button>
              </div>

              <form onSubmit={handleScheduleInterview} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Interview Date *</label>
                  <input 
                    type="date" required value={interviewForm.interview_date} 
                    onChange={(e) => setInterviewForm({...interviewForm, interview_date: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Interview Time *</label>
                  <input 
                    type="text" required placeholder="e.g. 11:30 AM" value={interviewForm.interview_time} 
                    onChange={(e) => setInterviewForm({...interviewForm, interview_time: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Venue / Office *</label>
                  <input 
                    type="text" required placeholder="e.g. Online (Zoom Link Below) or Davanagere Office" value={interviewForm.venue} 
                    onChange={(e) => setInterviewForm({...interviewForm, venue: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Online Meeting Link (Optional)</label>
                  <input 
                    type="url" placeholder="https://zoom.us/j/meeting-id" value={interviewForm.online_link} 
                    onChange={(e) => setInterviewForm({...interviewForm, online_link: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Special Candidate Instructions</label>
                  <textarea 
                    rows={2} placeholder="Please carry your resume. Join the zoom room 5 minutes before scheduled slot." value={interviewForm.instructions} 
                    onChange={(e) => setInterviewForm({...interviewForm, instructions: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white font-bold">Cancel</button>
                  <button type="submit" disabled={isUpdatingStatus} className="px-5 py-2 bg-blue-500 rounded text-white font-bold flex items-center gap-1.5">
                    {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Schedule & Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ASSIGN PROJECT MODAL */}
        {activeModal === 'project' && selectedApp && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full border border-white/10 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="font-heading font-bold text-white text-base">Assign Project & Activate Internship</h3>
                <button onClick={() => setActiveModal(null)} className="text-text-secondary hover:text-white font-bold">&times;</button>
              </div>

              <form onSubmit={handleAssignProject} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">GitHub Username *</label>
                    <input 
                      type="text" required placeholder="github_username" value={projectForm.github_username} 
                      onChange={(e) => setProjectForm({...projectForm, github_username: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Mentor Name *</label>
                    <input 
                      type="text" required placeholder="Senior Dev Name" value={projectForm.mentor_name} 
                      onChange={(e) => setProjectForm({...projectForm, mentor_name: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Project Name *</label>
                  <input 
                    type="text" required placeholder="e.g. Manchester Portal Frontend" value={projectForm.project_name} 
                    onChange={(e) => setProjectForm({...projectForm, project_name: e.target.value})}
                    className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Assigned Repository *</label>
                    <input 
                      type="text" required placeholder="e.g. manchester-portal" value={projectForm.assigned_repository} 
                      onChange={(e) => setProjectForm({...projectForm, assigned_repository: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Repository URL *</label>
                    <input 
                      type="url" required placeholder="https://github.com/..." value={projectForm.repository_url} 
                      onChange={(e) => setProjectForm({...projectForm, repository_url: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Start Date *</label>
                    <input 
                      type="date" required value={projectForm.start_date} 
                      onChange={(e) => setProjectForm({...projectForm, start_date: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">End Date *</label>
                    <input 
                      type="date" required value={projectForm.end_date} 
                      onChange={(e) => setProjectForm({...projectForm, end_date: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white font-bold">Cancel</button>
                  <button type="submit" disabled={isUpdatingStatus} className="px-5 py-2 bg-cyan-500 rounded text-white font-bold flex items-center gap-1.5">
                    {isUpdatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Confirm Activation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* STATUS RECORD CRUD MODAL */}
        {isStatusModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full border border-white/10 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h3 className="font-heading font-bold text-white text-base">
                  {selectedStatusRecord ? 'Edit Status Record' : 'Create Application Status Record'}
                </h3>
                <button
                  onClick={() => {
                    setIsStatusModalOpen(false)
                    setSelectedStatusRecord(null)
                  }}
                  className="text-text-secondary hover:text-white font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSaveStatusRecord} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Tracking ID (e.g. MT20260001) *</label>
                    <input
                      type="text"
                      required
                      disabled={!!selectedStatusRecord}
                      placeholder="MT20260001"
                      value={statusForm.tracking_id}
                      onChange={(e) => setStatusForm({ ...statusForm, tracking_id: e.target.value.toUpperCase() })}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white font-mono tracking-wider disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Candidate Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Candidate Full Name"
                      value={statusForm.candidate_name}
                      onChange={(e) => setStatusForm({ ...statusForm, candidate_name: e.target.value })}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Gmail Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@gmail.com"
                      value={statusForm.email}
                      onChange={(e) => setStatusForm({ ...statusForm, email: e.target.value })}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Internship Domain</label>
                    <select
                      value={statusForm.domain}
                      onChange={(e) => setStatusForm({ ...statusForm, domain: e.target.value })}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    >
                      <option value="">Select Domain</option>
                      {['Web Development', 'Mobile App Development', 'Artificial Intelligence', 'Machine Learning', 'UI/UX Design', 'Database Development', 'Testing & QA', 'Full Stack Development'].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Status *</label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white font-bold"
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Selected">Selected</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Assigned Mentor</label>
                    <input
                      type="text"
                      placeholder="Mentor Name"
                      value={statusForm.mentor}
                      onChange={(e) => setStatusForm({ ...statusForm, mentor: e.target.value })}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Start Date</label>
                    <input
                      type="date"
                      value={statusForm.start_date}
                      onChange={(e) => setStatusForm({ ...statusForm, start_date: e.target.value })}
                      className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Reporting Details (Instructions if Selected)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Join the Slack workspace and report at 10 AM online."
                    value={statusForm.reporting_details}
                    onChange={(e) => setStatusForm({ ...statusForm, reporting_details: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Remarks &amp; Feedback (Private / Candidate Info)</label>
                  <textarea
                    rows={2}
                    placeholder="Candidate possesses strong React experience but lacks Node proficiency."
                    value={statusForm.remarks}
                    onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })}
                    className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-white resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStatusModalOpen(false)
                      setSelectedStatusRecord(null)
                    }}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingStatus}
                    className="px-5 py-2 bg-accent text-background rounded font-bold flex items-center gap-1.5"
                  >
                    {isSavingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


      </section>
    </main>
  )
}
