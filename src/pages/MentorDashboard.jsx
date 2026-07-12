import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Clock, 
  FileText, 
  Award, 
  CheckCircle, 
  Calendar, 
  MessageSquare, 
  Search, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  BookOpen,
  LogOut,
  Send,
  Plus,
  Lock,
  ChevronRight,
  TrendingUp
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'

export default function MentorDashboard() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Sub-tab control inside dashboard
  const [activeTab, setActiveTab] = useState('interns') // 'interns', 'reviews', 'meetings', 'chat', 'announcements', 'settings'

  // Lists
  const [interns, setInterns] = useState([])
  const [pendingReports, setPendingReports] = useState([])
  const [reviewedReports, setReviewedReports] = useState([])
  const [meetings, setMeetings] = useState([])
  const [announcements, setAnnouncements] = useState([])
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [domainFilter, setDomainFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortField, setSortField] = useState('full_name')

  // Chat State
  const [chatType, setChatType] = useState('Global') // 'Global', 'Domain', 'Mentor'
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [lastPollTime, setLastPollTime] = useState('')

  // Modal / Review console target
  const [selectedReport, setSelectedReport] = useState(null)
  const [reviewStatus, setReviewStatus] = useState('Approved')
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [reviewScore, setReviewScore] = useState(85)
  const [isReviewing, setIsReviewing] = useState(false)

  // Scheduling Meet State
  const [meetTitle, setMeetTitle] = useState('')
  const [meetDesc, setMeetDesc] = useState('')
  const [meetDate, setMeetDate] = useState('')
  const [meetTime, setMeetTime] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [meetTargetType, setMeetTargetType] = useState('Group Based') // 'All Interns', 'Domain Based', 'Group Based'
  const [meetTargetDomain, setMeetTargetDomain] = useState('')
  const [isSchedulingMeet, setIsSchedulingMeet] = useState(false)

  // Mark Attendance Modal
  const [activeAttendanceMeet, setActiveAttendanceMeet] = useState(null)
  const [attendanceRoster, setAttendanceRoster] = useState([])
  const [isRegisteringAttendance, setIsRegisteringAttendance] = useState(false)

  // Settings Password Change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Announcement Builder State
  const [annTitle, setAnnTitle] = useState('')
  const [annMessage, setAnnMessage] = useState('')
  const [annMeetLink, setAnnMeetLink] = useState('')
  const [annAudience, setAnnAudience] = useState('Group') // 'All Interns', 'Domain', 'Group'
  const [annDomain, setAnnDomain] = useState('')
  const [isPublishingAnn, setIsPublishingAnn] = useState(false)

  // Verify mentor on load
  useEffect(() => {
    if (!token) {
      navigate('/mentor/login')
      return
    }

    try {
      const parsedUser = JSON.parse(localStorage.getItem('user'))
      if (parsedUser && parsedUser.role === 'mentor') {
        setUser(parsedUser)
        fetchDashboardData()
      } else {
        handleLogout()
      }
    } catch (e) {
      handleLogout()
    }
  }, [token])

  // Polling for Chat & Notifications (Works like socket.io fallback in serverless)
  useEffect(() => {
    if (!user || activeTab !== 'chat') return

    const pollInterval = setInterval(() => {
      pollRealTimeUpdates()
    }, 4000)

    return () => clearInterval(pollInterval)
  }, [user, activeTab, chatType, lastPollTime])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    navigate('/mentor/login')
  }

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Fetch interns
      const intRes = await fetch('/api/mentor/interns', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const intData = await intRes.json()
      if (intRes.ok) setInterns(intData.interns || [])

      // 2. Fetch pending reviews
      const repRes = await fetch('/api/mentor/reports/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const repData = await repRes.json()
      if (repRes.ok) setPendingReports(repData.reports || [])

      // 3. Fetch reviewed reports history
      const revRes = await fetch('/api/mentor/reports/reviewed', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const revData = await revRes.json()
      if (revRes.ok) setReviewedReports(revData.reports || [])

      // 4. Fetch meetings
      const meetRes = await fetch('/api/meetings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const meetData = await meetRes.json()
      if (meetRes.ok) setMeetings(meetData.meetings || [])

      // 5. Fetch announcements
      const annRes = await fetch('/api/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const annData = await annRes.json()
      if (annRes.ok) setAnnouncements(annData.announcements || [])

      setLastPollTime(new Date().toISOString())

    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }

  const pollRealTimeUpdates = async () => {
    try {
      const channelName = chatType === 'Global' ? 'Global' : chatType === 'Domain' ? (user.domain || 'General') : `MentorGroup-${user.id}`
      const channelType = chatType

      const res = await fetch(`/api/notifications/poll?since=${encodeURIComponent(lastPollTime)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (data.newMessages && data.newMessages.length > 0) {
          // Filter messages belonging to the current active chat channel
          const matching = data.newMessages.filter(msg => msg.channel_type === channelType && msg.channel_name === channelName)
          if (matching.length > 0) {
            setChatMessages(prev => [...prev, ...matching])
          }
        }
        setLastPollTime(new Date().toISOString())
      }
    } catch (err) {
      console.warn('Polling error:', err.message)
    }
  }

  const loadChatMessages = async (type) => {
    setChatMessages([])
    const channelName = type === 'Global' ? 'Global' : type === 'Domain' ? (user.domain || 'General') : `MentorGroup-${user.id}`
    try {
      const res = await fetch(`/api/communication/channels/${type}/${encodeURIComponent(channelName)}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setChatMessages(data.messages || [])
        setLastPollTime(new Date().toISOString())
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || isSendingMessage) return

    setIsSendingMessage(true)
    const channelName = chatType === 'Global' ? 'Global' : chatType === 'Domain' ? (user.domain || 'General') : `MentorGroup-${user.id}`
    const channelType = chatType

    try {
      const res = await fetch(`/api/communication/channels/${channelType}/${encodeURIComponent(channelName)}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ message: newMessage })
      })

      if (res.ok) {
        const tempMsg = {
          id: Date.now(),
          channel_type: channelType,
          channel_name: channelName,
          sender_id: String(user.id),
          sender_name: user.full_name,
          sender_role: 'mentor',
          message: newMessage,
          created_at: new Date().toISOString()
        }
        setChatMessages(prev => [...prev, tempMsg])
        setNewMessage('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!selectedReport || isReviewing) return
    setIsReviewing(true)

    try {
      const res = await fetch(`/api/mentor/reports/${selectedReport.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: reviewStatus,
          feedback: reviewFeedback,
          score: reviewScore
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      alert('Review submitted successfully!')
      setSelectedReport(null)
      setReviewFeedback('')
      // Reload reporting rosters
      fetchDashboardData()
    } catch (err) {
      alert('Review failed: ' + err.message)
    } finally {
      setIsReviewing(false)
    }
  }

  const handleScheduleMeeting = async (e) => {
    e.preventDefault()
    if (isSchedulingMeet) return
    setIsSchedulingMeet(true)

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: meetTitle,
          description: meetDesc,
          meeting_date: meetDate,
          meeting_time: meetTime,
          meet_link: meetLink,
          meeting_type: meetTargetType,
          target_domain: meetTargetType === 'Domain Based' ? meetTargetDomain : null,
          target_mentor_id: meetTargetType === 'Group Based' ? user.id : null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      alert('Meeting scheduled successfully!')
      setMeetTitle('')
      setMeetDesc('')
      setMeetDate('')
      setMeetTime('')
      setMeetLink('')
      // Reload meetings
      fetchDashboardData()
    } catch (err) {
      alert('Failed to schedule: ' + err.message)
    } finally {
      setIsSchedulingMeet(false)
    }
  }

  const handleLoadAttendanceRoster = async (meet) => {
    setActiveAttendanceMeet(meet)
    try {
      const res = await fetch(`/api/meetings/${meet.id}/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setAttendanceRoster(data.roster || [])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveAttendance = async () => {
    if (!activeAttendanceMeet || isRegisteringAttendance) return
    setIsRegisteringAttendance(true)

    try {
      const res = await fetch(`/api/meetings/${activeAttendanceMeet.id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attendanceRoster })
      })

      if (res.ok) {
        alert('Attendance updated successfully!')
        setActiveAttendanceMeet(null)
      } else {
        throw new Error('Update failed.')
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setIsRegisteringAttendance(false)
    }
  }

  const handleToggleAttendanceStatus = (appId) => {
    setAttendanceRoster(prev => prev.map(record => {
      if (record.application_id === appId) {
        const statuses = ['Present', 'Absent', 'Excused']
        const nextIdx = (statuses.indexOf(record.status) + 1) % statuses.length
        return { ...record, status: statuses[nextIdx] }
      }
      return record
    }))
  }

  const handlePublishAnnouncement = async (e) => {
    e.preventDefault()
    if (isPublishingAnn) return
    setIsPublishingAnn(true)

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: annTitle,
          message: annMessage,
          meet_link: annMeetLink,
          audience_type: annAudience,
          target_domain: annAudience === 'Domain' ? annDomain : null,
          target_mentor_id: annAudience === 'Group' ? user.id : null
        })
      })

      if (res.ok) {
        alert('Announcement published successfully!')
        setAnnTitle('')
        setAnnMessage('')
        setAnnMeetLink('')
        fetchDashboardData()
      } else {
        throw new Error('Failed to publish announcement.')
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setIsPublishingAnn(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordError('')
    setPasswordSuccess('')

    try {
      const res = await fetch('/api/mentor/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setPasswordSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Filter and Sort Interns
  const filteredInterns = interns
    .filter(intern => {
      const matchSearch = 
        intern.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        intern.application_id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchDomain = domainFilter === 'All' || intern.preferred_domain === domainFilter
      const matchStatus = statusFilter === 'All' || intern.status === statusFilter

      return matchSearch && matchDomain && matchStatus
    })
    .sort((a, b) => {
      if (a[sortField] < b[sortField]) return -1
      if (a[sortField] > b[sortField]) return 1
      return 0
    })

  // Metrics
  const metrics = {
    total: interns.length,
    active: interns.filter(i => i.status === 'Active Intern' || i.status === 'Selected').length,
    completed: interns.filter(i => i.status === 'Completed').length,
    pendingReviews: pendingReports.length,
    weeklyReviewed: reviewedReports.length
  }

  if (isLoading) {
    return (
      <main className="pt-20">
        <div className="py-32 flex flex-col items-center justify-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <span>Synchronizing Mentor workspace...</span>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="pt-20">
        <section className="section-padding py-16 max-w-2xl mx-auto">
          <div className="bg-red-950/20 border border-red-500/30 p-6 rounded-xl text-center text-red-400">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="heading-md text-white mb-2">Workspace Error</h2>
            <p className="mb-6">{error}</p>
            <button onClick={handleLogout} className="glow-button-outline px-6 py-2.5 text-xs">Return to Login</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="pt-20">
      <section className="section-padding py-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-accent text-xs font-semibold tracking-wider uppercase bg-accent/10 px-3 py-1.5 rounded-md">
              Mentor Dashboard
            </span>
            <h1 className="heading-md text-white mt-3">Welcome, {user?.full_name}!</h1>
            <p className="text-xs text-text-secondary mt-1">Domain supervision: <strong>{user?.domain || 'General Tech'}</strong></p>
          </div>
          <button 
            onClick={handleLogout}
            className="glow-button-outline px-5 py-2 text-xs self-start md:self-auto flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Logout session
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'interns', label: 'Intern Management', icon: Users },
            { id: 'reviews', label: `Reports Review (${metrics.pendingReviews})`, icon: FileText },
            { id: 'meetings', label: 'Google Meet Scheduler', icon: Calendar },
            { id: 'announcements', label: 'Announcements', icon: Award },
            { id: 'chat', label: 'Group Channels', icon: MessageSquare },
            { id: 'settings', label: 'Account Security', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon
            const isSelected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  if (tab.id === 'chat') loadChatMessages(chatType)
                }}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 uppercase tracking-wider whitespace-nowrap ${
                  isSelected
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Dashboard Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Assigned Interns', val: metrics.total, color: 'text-white', icon: Users },
            { label: 'Active Cohort', val: metrics.active, color: 'text-cyan-400', icon: TrendingUp },
            { label: 'Reports Pending Audit', val: metrics.pendingReviews, color: 'text-yellow-400', icon: Clock },
            { label: 'Reports Reviewed', val: metrics.weeklyReviewed, color: 'text-emerald-400', icon: CheckCircle },
            { label: 'Completed Interns', val: metrics.completed, color: 'text-green-400', icon: Award }
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

        {/* Dynamic Tab Body */}
        <div>
          
          {/* TAB 1: INTERN MANAGEMENT */}
          {activeTab === 'interns' && (
            <div className="space-y-6">
              {/* Search & Filters */}
              <div className="glass-card p-5 border border-white/5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4 relative">
                  <Search className="w-4 h-4 text-text-muted absolute left-3 top-3.5" />
                  <input 
                    type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search interns by name, email, or application ID..."
                    className="w-full bg-background/60 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <select 
                    value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="All">All Domains</option>
                    <option value="Full Stack">Full Stack</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Cyber Security">Cyber Security</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <select 
                    value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Selected">Selected</option>
                    <option value="Active Intern">Active Intern</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <select 
                    value={sortField} onChange={(e) => setSortField(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="full_name">Sort by Name</option>
                    <option value="application_id">Sort by App ID</option>
                    <option value="created_at">Sort by Join Date</option>
                  </select>
                </div>
              </div>

              {/* Interns Table */}
              <div className="glass-card border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02] text-text-secondary font-semibold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Intern Details</th>
                        <th className="p-4">Tracking ID</th>
                        <th className="p-4">Domain</th>
                        <th className="p-4">Reports Filed</th>
                        <th className="p-4">Task progress</th>
                        <th className="p-4">Weekly Status</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/90">
                      {filteredInterns.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-text-muted">No assigned interns matching the current filters.</td>
                        </tr>
                      ) : (
                        filteredInterns.map((intern) => (
                          <tr key={intern.id} className="hover:bg-white/[0.01] transition-all">
                            <td className="p-4">
                              <div className="font-semibold text-white">{intern.full_name}</div>
                              <div className="text-[10px] text-text-secondary mt-0.5">{intern.email}</div>
                            </td>
                            <td className="p-4 font-mono font-bold text-accent">{intern.application_id}</td>
                            <td className="p-4">{intern.preferred_domain}</td>
                            <td className="p-4">
                              <strong>{intern.reports_count} total</strong>
                              <span className="text-[10px] text-green-400 block">{intern.approved_reports_count} approved</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-accent" style={{ width: `${intern.progress_percentage}%` }} />
                                </div>
                                <span>{intern.progress_percentage}%</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                                intern.weekly_report_status === 'Pending Review' 
                                  ? 'bg-yellow-950/30 text-yellow-400 border border-yellow-400/20' 
                                  : 'bg-green-950/30 text-green-400 border border-green-400/20'
                              }`}>
                                {intern.weekly_report_status}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase ${
                                intern.status === 'Completed' 
                                  ? 'bg-green-950 text-green-400 border border-green-400/20' 
                                  : 'bg-cyan-950 text-cyan-400 border border-cyan-400/20'
                              }`}>
                                {intern.status}
                              </span>
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

          {/* TAB 2: WEEKLY REPORTS REVIEW */}
          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Reports List */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent font-heading">Submitted Reports Pending Review ({pendingReports.length})</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
                  {pendingReports.length === 0 ? (
                    <div className="glass-card p-6 text-center text-xs text-text-muted border border-white/5">
                      All weekly reports have been fully reviewed! No pending entries.
                    </div>
                  ) : (
                    pendingReports.map((rep) => (
                      <div 
                        key={rep.id} 
                        onClick={() => {
                          setSelectedReport(rep)
                          setReviewScore(85)
                          setReviewFeedback('')
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${
                          selectedReport && selectedReport.id === rep.id
                            ? 'bg-accent/10 border-accent'
                            : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-white">Week #{rep.week_number} Progress Report</span>
                          <span className="text-[9px] text-text-muted">{new Date(rep.submitted_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs font-semibold text-accent">{rep.intern_name}</div>
                        <div className="text-[10px] text-text-secondary mt-1">Hours logged: <strong>{rep.hours_worked} hours</strong></div>
                        <div className="text-[10px] text-text-muted truncate mt-2">{rep.work_completed}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Review Workspace Console */}
              <div className="lg:col-span-7">
                {selectedReport ? (
                  <form onSubmit={handleSubmitReview} className="glass-card p-6 border border-white/5 space-y-6 text-left">
                    <div className="border-b border-white/5 pb-4">
                      <h3 className="font-heading font-bold text-white text-base">Weekly Report Audit Roster</h3>
                      <p className="text-xs text-text-secondary mt-1">Reviewing submissions for <strong>{selectedReport.intern_name}</strong> (Week #{selectedReport.week_number})</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-text-muted block uppercase text-[9px] tracking-wider">Hours Worked</span>
                        <strong className="text-white block mt-0.5">{selectedReport.hours_worked} Hours</strong>
                      </div>
                      <div>
                        <span className="text-text-muted block uppercase text-[9px] tracking-wider">Submitted On</span>
                        <span className="text-white block mt-0.5">{new Date(selectedReport.submitted_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-text-muted block uppercase text-[9px] tracking-wider">Work Completed</span>
                      <p className="text-white bg-background/40 p-3 rounded-lg border border-white/5 whitespace-pre-line leading-relaxed">{selectedReport.work_completed}</p>
                    </div>

                    <div className="space-y-1 text-xs">
                      <span className="text-text-muted block uppercase text-[9px] tracking-wider">Tasks Accomplished</span>
                      <p className="text-white bg-background/40 p-3 rounded-lg border border-white/5 whitespace-pre-line leading-relaxed">{selectedReport.tasks_accomplished}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {selectedReport.github_url && (
                        <div>
                          <span className="text-text-muted block uppercase text-[9px] tracking-wider">GitHub Repo</span>
                          <a href={selectedReport.github_url} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1.5 mt-0.5">
                            Open repository <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                      {selectedReport.deployment_url && (
                        <div>
                          <span className="text-text-muted block uppercase text-[9px] tracking-wider">Live Deploy</span>
                          <a href={selectedReport.deployment_url} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1.5 mt-0.5">
                            Open link <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {selectedReport.evidence_data && (
                      <div className="space-y-1 text-xs">
                        <span className="text-text-muted block uppercase text-[9px] tracking-wider">Attached File / Evidence</span>
                        <div className="mt-1">
                          <button 
                            type="button"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = selectedReport.evidence_data
                              link.download = selectedReport.evidence_path || 'evidence_attachment'
                              link.click()
                            }}
                            className="glow-button-outline px-4 py-2 text-[10px]"
                          >
                            Download Attachment ({selectedReport.evidence_path || 'file'})
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-6 space-y-4">
                      <h4 className="text-xs font-bold text-accent uppercase tracking-wider">Review Audit Action</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Review Status</label>
                          <select 
                            value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}
                            className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                          >
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Resubmission Required">Resubmission Required</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Performance Grade / Score (0-100)</label>
                          <input 
                            type="number" min="0" max="100" required
                            value={reviewScore} onChange={(e) => setReviewScore(e.target.value)}
                            className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Mentor Feedback Comments *</label>
                        <textarea 
                          rows="3" required
                          value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)}
                          className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-accent focus:outline-none"
                          placeholder="Provide constructive feedback or changes requested..."
                        />
                      </div>

                      <button 
                        type="submit" disabled={isReviewing}
                        className="glow-button w-full py-3 text-xs flex items-center justify-center gap-1.5"
                      >
                        {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Register Evaluation Grade
                      </button>
                    </div>

                  </form>
                ) : (
                  <div className="glass-card p-12 text-center text-xs text-text-muted border border-white/5 h-full flex flex-col items-center justify-center">
                    <BookOpen className="w-12 h-12 text-text-muted opacity-30 mb-4" />
                    Select a weekly report from the left pane to begin reviewing its checklist.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE MEET SCHEDULER */}
          {activeTab === 'meetings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
              
              {/* Scheduling Form */}
              <form onSubmit={handleScheduleMeeting} className="lg:col-span-5 glass-card p-6 border border-white/5 space-y-5">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-heading font-bold text-white text-sm">Schedule Weekly Meeting</h3>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Meeting Title *</label>
                  <input 
                    type="text" required value={meetTitle} onChange={(e) => setMeetTitle(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    placeholder="e.g. Weekly Review Meeting - Cohort 1"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Google Meet Link *</label>
                  <input 
                    type="url" required value={meetLink} onChange={(e) => setMeetLink(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Meeting Date *</label>
                    <input 
                      type="date" required value={meetDate} onChange={(e) => setMeetDate(e.target.value)}
                      className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Meeting Time *</label>
                    <input 
                      type="time" required value={meetTime} onChange={(e) => setMeetTime(e.target.value)}
                      className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Target Audience *</label>
                  <select 
                    value={meetTargetType} onChange={(e) => setMeetTargetType(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="Group Based">Mentor Group (Only my assigned interns)</option>
                    <option value="Domain Based">Domain-specific Cohorts</option>
                    <option value="All Interns">All Registered Interns (Global)</option>
                  </select>
                </div>

                {meetTargetType === 'Domain Based' && (
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Specify Domain *</label>
                    <select 
                      value={meetTargetDomain} onChange={(e) => setMeetTargetDomain(e.target.value)}
                      className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    >
                      <option value="">Select Domain</option>
                      <option value="Full Stack">Full Stack</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Cyber Security">Cyber Security</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Agenda / Description</label>
                  <textarea 
                    rows="3" value={meetDesc} onChange={(e) => setMeetDesc(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-accent focus:outline-none"
                    placeholder="Short agenda or instructions..."
                  />
                </div>

                <button 
                  type="submit" disabled={isSchedulingMeet}
                  className="glow-button w-full py-3 text-xs flex items-center justify-center gap-1.5"
                >
                  {isSchedulingMeet ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Schedule Meeting
                </button>
              </form>

              {/* Meetings List */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent font-heading">Scheduled Meetings & Attendance</h3>
                <div className="space-y-4">
                  {meetings.length === 0 ? (
                    <div className="glass-card p-10 text-center text-xs text-text-muted border border-white/5">No meetings scheduled yet.</div>
                  ) : (
                    meetings.map((meet) => (
                      <div key={meet.id} className="glass-card p-5 border border-white/5 space-y-4 hover:border-white/10 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div>
                            <h4 className="text-sm font-bold text-white font-heading">{meet.title}</h4>
                            <p className="text-[10px] text-text-muted mt-0.5">Scheduled by {meet.created_by}</p>
                          </div>
                          <span className="text-[10px] font-bold text-accent uppercase bg-accent/5 px-2.5 py-1 rounded-md border border-accent/10 self-start sm:self-auto">
                            {meet.meeting_type}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-text-muted block text-[10px]">Date</span>
                            <strong className="text-white block mt-0.5">{meet.meeting_date}</strong>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px]">Time</span>
                            <span className="text-white block mt-0.5">{meet.meeting_time}</span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-text-muted block text-[10px]">Meet Link</span>
                            <a href={meet.meet_link} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1 mt-0.5">
                              Launch Call <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {meet.description && (
                          <p className="text-[11px] text-text-secondary italic">{meet.description}</p>
                        )}

                        <div className="pt-2 flex gap-3">
                          <button 
                            onClick={() => handleLoadAttendanceRoster(meet)}
                            className="glow-button-outline px-4 py-2 text-[10px]"
                          >
                            Mark / Audit Attendance
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ATTENDANCE MARKING PANEL (MODAL EFFECT) */}
          {activeAttendanceMeet && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="glass-card max-w-xl w-full border border-white/10 p-6 space-y-6 text-left bg-background/95 max-h-[85vh] overflow-y-auto rounded-2xl">
                <div className="border-b border-white/5 pb-4 flex justify-between items-start">
                  <div>
                    <h3 className="font-heading font-bold text-white text-base">Roster Attendance Control</h3>
                    <p className="text-xs text-text-secondary mt-1">Mark attendance for meeting: <strong>{activeAttendanceMeet.title}</strong></p>
                  </div>
                  <button onClick={() => setActiveAttendanceMeet(null)} className="text-text-muted hover:text-white font-bold text-sm">✕ Close</button>
                </div>

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Target Interns Checklist:</span>
                  <div className="space-y-2 divide-y divide-white/5 max-h-[350px] overflow-y-auto pr-2 scrollbar-none">
                    {attendanceRoster.length === 0 ? (
                      <p className="text-xs text-text-muted py-4">No eligible interns found for this call scope.</p>
                    ) : (
                      attendanceRoster.map((record) => (
                        <div key={record.application_id} className="flex justify-between items-center py-2 text-xs">
                          <div>
                            <div className="font-semibold text-white">{record.full_name}</div>
                            <div className="text-[10px] text-text-secondary mt-0.5">{record.application_id} | {record.preferred_domain}</div>
                          </div>
                          
                          <button
                            onClick={() => handleToggleAttendanceStatus(record.application_id)}
                            className={`px-4 py-1.5 rounded-lg font-bold text-[10px] transition-all border ${
                              record.status === 'Present'
                                ? 'bg-green-950/30 text-green-400 border-green-500/20'
                                : record.status === 'Absent'
                                ? 'bg-red-950/30 text-red-400 border-red-500/20'
                                : 'bg-yellow-950/30 text-yellow-400 border-yellow-500/20'
                            }`}
                          >
                            {record.status} (Cycle)
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button 
                    onClick={handleSaveAttendance} disabled={isRegisteringAttendance}
                    className="glow-button flex-grow py-3 text-xs"
                  >
                    {isRegisteringAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Attendance Log
                  </button>
                  <button onClick={() => setActiveAttendanceMeet(null)} className="glow-button-outline px-6 py-3 text-xs">Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
              
              {/* Creator form */}
              <form onSubmit={handlePublishAnnouncement} className="lg:col-span-5 glass-card p-6 border border-white/5 space-y-5">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="font-heading font-bold text-white text-sm">Publish Broadcaster Update</h3>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Notice Title *</label>
                  <input 
                    type="text" required value={annTitle} onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    placeholder="e.g. Project Repository Submission Deadline"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Message *</label>
                  <textarea 
                    rows="5" required value={annMessage} onChange={(e) => setAnnMessage(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-accent focus:outline-none"
                    placeholder="Provide details regarding the update..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Optional Meeting Link</label>
                  <input 
                    type="url" value={annMeetLink} onChange={(e) => setAnnMeetLink(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Audience Target *</label>
                  <select 
                    value={annAudience} onChange={(e) => setAnnAudience(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                  >
                    <option value="Group">My Mentor Group Interns</option>
                    <option value="Domain">My Domain cohort</option>
                    <option value="All Interns">All Registered Interns (Global)</option>
                  </select>
                </div>

                {annAudience === 'Domain' && (
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Select Domain *</label>
                    <select 
                      value={annDomain} onChange={(e) => setAnnDomain(e.target.value)}
                      className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    >
                      <option value="">Choose Domain</option>
                      <option value="Full Stack">Full Stack</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Cyber Security">Cyber Security</option>
                    </select>
                  </div>
                )}

                <button 
                  type="submit" disabled={isPublishingAnn}
                  className="glow-button w-full py-3 text-xs flex items-center justify-center gap-1.5"
                >
                  {isPublishingAnn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Broadcast Notice
                </button>
              </form>

              {/* Announcements List */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent font-heading">Historical Broadcast Center Log</h3>
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <div className="glass-card p-10 text-center text-xs text-text-muted border border-white/5">No announcements broadcasted yet.</div>
                  ) : (
                    announcements.map((ann) => (
                      <div key={ann.id} className="glass-card p-5 border border-white/5 space-y-3 hover:border-white/10 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                          <h4 className="text-sm font-bold text-white font-heading">{ann.title}</h4>
                          <span className="text-[9px] text-text-muted">{new Date(ann.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                        
                        {ann.meet_link && (
                          <div className="pt-2 text-xs">
                            <span className="text-text-muted">Attachment Link: </span>
                            <a href={ann.meet_link} target="_blank" rel="noreferrer" className="text-accent hover:underline font-bold inline-flex items-center gap-1">
                              Launch Meeting Room <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        <div className="text-[10px] text-text-muted text-right">Published by: {ann.created_by}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: GROUP CHAT CHANNELS */}
          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[500px]">
              
              {/* Channel Selector Sidebar */}
              <div className="lg:col-span-3 glass-card p-5 border border-white/5 flex flex-col gap-4 text-left">
                <h3 className="text-xs font-bold text-accent uppercase tracking-wider">Communication Channels</h3>
                <div className="space-y-2 flex-grow">
                  {[
                    { type: 'Global', label: 'Global General Room', info: 'All platform interns' },
                    { type: 'Domain', label: `${user.domain || 'Domain'} Room`, info: 'Same-domain interns' },
                    { type: 'Mentor', label: 'My Mentor Group Chat', info: 'Private cohort' }
                  ].map((chan) => (
                    <button
                      key={chan.type}
                      onClick={() => {
                        setChatType(chan.type)
                        loadChatMessages(chan.type)
                      }}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                        chatType === chan.type
                          ? 'bg-accent/10 border-accent text-white font-bold'
                          : 'bg-white/[0.01] border-white/5 text-text-secondary hover:text-white hover:border-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold">{chan.label}</div>
                      <div className="text-[9px] text-text-muted mt-1 font-normal">{chan.info}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat View Box */}
              <div className="lg:col-span-9 glass-card border border-white/5 flex flex-col justify-between overflow-hidden relative">
                
                {/* Channel Header Banner */}
                <div className="bg-white/[0.02] p-4 border-b border-white/5 flex justify-between items-center text-left">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Channel: {chatType} Room</h4>
                    <p className="text-[10px] text-text-secondary mt-0.5">Real-time collaboration active.</p>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-grow p-5 space-y-4 max-h-[350px] overflow-y-auto scrollbar-none flex flex-col">
                  {chatMessages.length === 0 ? (
                    <div className="py-20 text-center text-xs text-text-muted flex-grow flex flex-col items-center justify-center">
                      No communication records found for this channel. Type below to start broadcasting.
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.sender_id === String(user.id) || msg.sender_id === user.email
                      return (
                        <div key={msg.id} className={`flex flex-col max-w-[70%] text-left ${isMe ? 'self-end' : 'self-start'}`}>
                          <span className="text-[9px] text-text-muted px-1">
                            {msg.sender_name} ({msg.sender_role})
                          </span>
                          <div className={`p-3 rounded-2xl text-xs mt-1 leading-relaxed ${
                            isMe 
                              ? 'bg-accent text-white rounded-tr-none' 
                              : 'bg-white/5 text-white/90 rounded-tl-none border border-white/5'
                          }`}>
                            {msg.message}
                          </div>
                          <span className="text-[8px] text-text-muted mt-0.5 text-right px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Input Text Form */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-3">
                  <input 
                    type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Broadcast chat message..."
                    className="flex-grow bg-background/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-accent focus:outline-none"
                  />
                  <button 
                    type="submit" disabled={isSendingMessage}
                    className="glow-button px-5 py-3 text-xs flex items-center justify-center rounded-xl shrink-0"
                  >
                    {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>

              </div>

            </div>
          )}

          {/* TAB 6: SECURITY & PASSWORD CHANGE */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto glass-card p-6 border border-white/5 text-left space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="font-heading font-bold text-white text-base">Account Security Settings</h3>
                <p className="text-xs text-text-secondary mt-1">Change your portal login password.</p>
              </div>

              {passwordSuccess && (
                <div className="bg-green-950/20 border border-green-500/30 p-3 rounded-lg text-xs text-green-400">
                  {passwordSuccess}
                </div>
              )}
              {passwordError && (
                <div className="bg-red-950/20 border border-red-500/30 p-3 rounded-lg text-xs text-red-400">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Current Password</label>
                  <input 
                    type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">New Secure Password</label>
                  <input 
                    type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-background/60 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:border-accent focus:outline-none"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <button 
                  type="submit" disabled={isChangingPassword}
                  className="glow-button w-full py-3 text-xs flex items-center justify-center gap-1"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Update Secure Credentials
                </button>
              </form>
            </div>
          )}

        </div>

      </section>
    </main>
  )
}
