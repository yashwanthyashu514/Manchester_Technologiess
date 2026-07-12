import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Github, 
  User, 
  Calendar, 
  CheckSquare, 
  Square, 
  MessageSquare, 
  LogOut, 
  Loader2, 
  AlertCircle,
  ExternalLink,
  Trophy,
  Send,
  FileText,
  Plus,
  Award,
  Clock,
  TrendingUp,
  Video
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'

export default function InternDashboard() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('tasks') // 'tasks', 'reports', 'meetings', 'chat', 'timeline'

  // Dashboard Data
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [isUpdatingTasks, setIsUpdatingTasks] = useState(false)

  // Weekly reports
  const [reports, setReports] = useState([])
  const [showReportForm, setShowReportForm] = useState(false)
  const [isSubmittingReport, setIsSubmittingReport] = useState(false)
  const [reportForm, setReportForm] = useState({
    work_completed: '',
    tasks_accomplished: '',
    technologies_learned: '',
    github_url: '',
    deployment_url: '',
    challenges_faced: '',
    learning_outcome: '',
    next_week_plan: '',
    hours_worked: 40,
    evidence_name: '',
    evidence_data: ''
  })

  // Meetings, Announcements & Timeline
  const [meetings, setMeetings] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [timeline, setTimeline] = useState([])

  // Performance Scores
  const [metrics, setMetrics] = useState({
    weekly_report_score: 0,
    attendance_score: 100,
    task_completion_score: 0,
    overall_score: 0
  })

  // Chat channels state
  const [chatType, setChatType] = useState('Global') // 'Global', 'Domain', 'Mentor'
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [lastPollTime, setLastPollTime] = useState('')

  const navigate = useNavigate()

  // Verify intern JWT token on load
  useEffect(() => {
    if (!token) {
      navigate('/internships/status')
      return
    }

    try {
      const parsedUser = JSON.parse(localStorage.getItem('user'))
      if (parsedUser && (parsedUser.role === 'intern' || parsedUser.role === 'admin')) {
        setUser(parsedUser)
        fetchDashboardData()
      } else {
        handleLogout()
      }
    } catch (e) {
      handleLogout()
    }
  }, [token])

  // Polling for Chat & Notifications (Fallback Socket.IO loop)
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
    navigate('/internships/status')
  }

  // Load project details and tasks checklist
  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Fetch project info
      const res = await fetch('/api/intern/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sync intern dashboard.')
      setProject(data.project)
      if (data.project && data.project.tasks) {
        setTasks(data.project.tasks)
      }

      // 2. Fetch reports history
      const repRes = await fetch('/api/intern/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (repRes.ok) {
        const repData = await repRes.json()
        setReports(repData.reports || [])
      }

      // 3. Fetch performance metrics
      const metRes = await fetch('/api/intern/performance-metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (metRes.ok) {
        const metData = await metRes.json()
        setMetrics(metData.metrics || { weekly_report_score: 0, attendance_score: 100, task_completion_score: 0, overall_score: 0 })
      }

      // 4. Fetch meetings
      const meetRes = await fetch('/api/meetings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (meetRes.ok) {
        const meetData = await meetRes.json()
        setMeetings(meetData.meetings || [])
      }

      // 5. Fetch announcements
      const annRes = await fetch('/api/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (annRes.ok) {
        const annData = await annRes.json()
        setAnnouncements(annData.announcements || [])
      }

      // 6. Fetch timeline events
      const timeRes = await fetch('/api/intern/timeline', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (timeRes.ok) {
        const timeData = await timeRes.json()
        setTimeline(timeData.timeline || [])
      }

      setLastPollTime(new Date().toISOString())

    } catch (err) {
      console.error(err)
      setError(err.message || 'Error connecting to database.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle task checklist toggling
  const handleToggleTask = async (taskId) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed'
        const nextProgress = nextStatus === 'Completed' ? 100 : 0
        return { ...task, status: nextStatus, progress: nextProgress }
      }
      return task
    })

    setTasks(updatedTasks)
    setIsUpdatingTasks(true)

    try {
      const res = await fetch('/api/intern/tasks/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ tasks: updatedTasks })
      })
      if (!res.ok) throw new Error('Sync failed.')
      
      // Refresh metrics after completion status changed
      const metRes = await fetch('/api/intern/performance-metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (metRes.ok) {
        const metData = await metRes.json()
        setMetrics(metData.metrics || metrics)
      }
    } catch (err) {
      alert('Failed to save task update to database: ' + err.message)
      fetchDashboardData()
    } finally {
      setIsUpdatingTasks(false)
    }
  }

  // Handle Weekly Report Submission
  const handleReportSubmit = async (e) => {
    e.preventDefault()
    setIsSubmittingReport(true)
    try {
      const res = await fetch('/api/intern/submit-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportForm)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      alert('Weekly report submitted successfully!')
      setShowReportForm(false)
      setReportForm({
        work_completed: '',
        tasks_accomplished: '',
        technologies_learned: '',
        github_url: '',
        deployment_url: '',
        challenges_faced: '',
        learning_outcome: '',
        next_week_plan: '',
        hours_worked: 40,
        evidence_name: '',
        evidence_data: ''
      })
      fetchDashboardData()
    } catch (err) {
      alert('Report submission failed: ' + err.message)
    } finally {
      setIsSubmittingReport(false)
    }
  }

  // File Upload base64 encoder helper
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setReportForm(prev => ({
        ...prev,
        evidence_name: file.name,
        evidence_data: reader.result
      }))
    }
    reader.readAsDataURL(file)
  }

  // Real-Time Polling for Chat Messages
  const pollRealTimeUpdates = async () => {
    try {
      const res = await fetch(`/api/notifications/poll?since=${encodeURIComponent(lastPollTime)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (data.newMessages && data.newMessages.length > 0) {
          const channelName = chatType === 'Global' ? 'Global' : chatType === 'Domain' ? (project?.domain || 'General') : `MentorGroup-${project?.mentor_id || 0}`
          const matching = data.newMessages.filter(msg => msg.channel_type === chatType && msg.channel_name === channelName)
          if (matching.length > 0) {
            setChatMessages(prev => [...prev, ...matching])
          }
        }
        setLastPollTime(new Date().toISOString())
      }
    } catch (err) {
      console.warn(err.message)
    }
  }

  const loadChatMessages = async (type) => {
    setChatMessages([])
    const channelName = type === 'Global' ? 'Global' : type === 'Domain' ? (project?.domain || 'General') : `MentorGroup-${project?.mentor_id || 0}`
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
    const channelName = chatType === 'Global' ? 'Global' : chatType === 'Domain' ? (project?.domain || 'General') : `MentorGroup-${project?.mentor_id || 0}`
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
          sender_id: user.application_id || 'admin',
          sender_name: user.full_name,
          sender_role: 'intern',
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

  // Calculate Progress Percentages
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'Completed').length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  if (isLoading) {
    return (
      <main className="pt-20">
        <div className="py-32 flex flex-col items-center justify-center gap-3 text-text-secondary">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <span>Synchronizing Intern Workspace...</span>
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
            <h2 className="heading-md text-white mb-2">Sync Error</h2>
            <p className="mb-6">{error}</p>
            <button onClick={handleLogout} className="glow-button-outline px-6 py-2.5 text-xs">Return to Status Page</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="pt-20">
      <section className="section-padding py-10 max-w-6xl mx-auto space-y-8">
        
        {/* Top bar header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-accent text-xs font-semibold tracking-wider uppercase bg-accent/10 px-3 py-1.5 rounded-md">
              Intern Workspace
            </span>
            <h1 className="heading-md text-white mt-3">Welcome Back, {user?.full_name}!</h1>
            <p className="text-xs text-text-secondary mt-1">Application ID: <strong>{user?.application_id}</strong></p>
          </div>
          <button 
            onClick={handleLogout}
            className="glow-button-outline px-5 py-2 text-xs self-start md:self-auto flex items-center gap-1.5 font-bold"
          >
            <LogOut className="w-4 h-4" /> Logout session
          </button>
        </div>

        {/* Navigation tabs */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: 'tasks', label: 'Tasks checklist', icon: CheckSquare },
            { id: 'reports', label: 'Weekly Progress', icon: FileText },
            { id: 'meetings', label: 'Scheduled Meetings', icon: Calendar },
            { id: 'announcements', label: 'Notice Board', icon: Award },
            { id: 'chat', label: 'Group Chats', icon: MessageSquare },
            { id: 'timeline', label: 'Activity Timeline', icon: Clock }
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

        {/* Performance Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Weekly Report Score', val: `${metrics.weekly_report_score}%`, color: 'text-emerald-400', icon: TrendingUp },
            { label: 'Attendance Rate', val: `${metrics.attendance_score}%`, color: 'text-cyan-400', icon: Calendar },
            { label: 'Project Task Progress', val: `${metrics.task_completion_score || progressPercent}%`, color: 'text-purple-400', icon: CheckSquare },
            { label: 'Overall Evaluation Score', val: `${metrics.overall_score}%`, color: 'text-green-400', icon: Trophy }
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[95px] text-left">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] text-text-muted uppercase tracking-wider font-semibold">{item.label}</span>
                <item.icon className={`w-3.5 h-3.5 ${item.color} opacity-60`} />
              </div>
              <span className={`text-xl font-bold font-heading ${item.color}`}>{item.val}</span>
            </div>
          ))}
        </div>

        {/* Dashboard layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main workspace (Span 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* TAB 1: TASKS CHECKLIST */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                
                {/* PROGRESS MONITOR CARD */}
                <AnimatedSection>
                  <div className="glass-card p-6 md:p-8 border border-white/5 relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
                    <h3 className="font-heading font-bold text-white text-base mb-4">Internship Task Progress</h3>

                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      
                      <div className="relative w-24 h-24 rounded-full border border-accent/20 flex flex-col items-center justify-center shrink-0 bg-background/50">
                        <span className="text-3xl font-heading font-bold text-accent">{progressPercent}%</span>
                        <span className="text-[9px] text-text-muted mt-0.5">COMPLETED</span>
                      </div>

                      <div className="flex-grow space-y-2">
                        <div className="flex justify-between items-center text-xs text-text-secondary">
                          <span>Tasks completion checklist ({completedTasks} of {totalTasks})</span>
                          <span>{progressPercent}% Complete</span>
                        </div>
                        <div className="w-full h-3 bg-secondary/80 rounded-full overflow-hidden border border-white/5">
                          <div 
                            className="h-full bg-accent rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        
                        {progressPercent === 100 && totalTasks > 0 ? (
                          <p className="text-xs text-green-400 font-medium flex items-center gap-1.5 pt-1">
                            <Trophy className="w-4 h-4" /> Outstanding! All tasks completed. Inform your mentor to complete project term.
                          </p>
                        ) : (
                          <p className="text-[10px] text-text-muted pt-1">
                            * Mark tasks as completed below to sync progress with your project mentor.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>

                {/* PROJECT TASKS CHECKLIST CARD */}
                <AnimatedSection delay={0.1}>
                  <div className="glass-card p-6 md:p-8 border border-white/5 text-left">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-6">
                      <h3 className="font-heading font-bold text-white text-base">Development Tasks Roster</h3>
                      {isUpdatingTasks && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
                    </div>

                    {totalTasks === 0 ? (
                      <div className="p-8 text-center text-text-muted bg-background/20 rounded-lg border border-white/5">
                        No tasks assigned to your file yet. Please consult your mentor.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tasks.map((task) => (
                          <div 
                            key={task.id} 
                            onClick={() => handleToggleTask(task.id)}
                            className={`p-4 rounded-xl border transition-all duration-300 flex items-start gap-4 cursor-pointer select-none ${
                              task.status === 'Completed' 
                                ? 'bg-green-950/5 border-green-500/20 opacity-70 hover:opacity-100' 
                                : 'bg-background/40 border-white/5 hover:border-accent/20'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {task.status === 'Completed' ? (
                                <CheckSquare className="w-5 h-5 text-green-400" />
                              ) : (
                                <Square className="w-5 h-5 text-text-secondary hover:text-accent" />
                              )}
                            </div>

                            <div className="flex-grow">
                              <p className={`text-sm font-semibold leading-relaxed ${task.status === 'Completed' ? 'line-through text-text-secondary' : 'text-white'}`}>
                                {task.task}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-[10px] text-text-muted">
                                  Deadline: <strong>{new Date(task.deadline).toLocaleDateString()}</strong>
                                </span>
                                <span className={`text-[9px] font-bold uppercase ${task.status === 'Completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                                  {task.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              </div>
            )}

            {/* TAB 2: WEEKLY PROGRESS REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                
                {/* Submit button header */}
                <div className="flex justify-between items-center text-left">
                  <h3 className="font-heading font-bold text-white text-base">Weekly Evaluation Reports</h3>
                  {!showReportForm && (
                    <button 
                      onClick={() => setShowReportForm(true)}
                      className="glow-button px-5 py-2 text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Submit Weekly Report
                    </button>
                  )}
                </div>

                {/* Submit Form */}
                {showReportForm && (
                  <form onSubmit={handleReportSubmit} className="glass-card p-6 border border-white/5 space-y-5 text-left">
                    <div className="border-b border-white/5 pb-3 flex justify-between items-center">
                      <h4 className="font-heading font-bold text-white text-sm">Weekly Progress Report Form</h4>
                      <button type="button" onClick={() => setShowReportForm(false)} className="text-text-secondary hover:text-white font-bold text-xs">Cancel</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Hours Worked *</label>
                        <input 
                          type="number" required value={reportForm.hours_worked}
                          onChange={(e) => setReportForm({...reportForm, hours_worked: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-xs text-white"
                          placeholder="e.g. 40"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Technologies Learned</label>
                        <input 
                          type="text" value={reportForm.technologies_learned}
                          onChange={(e) => setReportForm({...reportForm, technologies_learned: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-xs text-white"
                          placeholder="e.g. Node.js, SQLite, Framer Motion"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Work Completed *</label>
                      <textarea 
                        rows="3" required value={reportForm.work_completed}
                        onChange={(e) => setReportForm({...reportForm, work_completed: e.target.value})}
                        className="w-full bg-background border border-white/10 rounded-lg p-3 text-xs text-white"
                        placeholder="Detail all tasks completed this week..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Specific Milestones Accomplished *</label>
                      <textarea 
                        rows="2" required value={reportForm.tasks_accomplished}
                        onChange={(e) => setReportForm({...reportForm, tasks_accomplished: e.target.value})}
                        className="w-full bg-background border border-white/10 rounded-lg p-3 text-xs text-white"
                        placeholder="Highlight critical code checkpoints..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">GitHub Repository URL</label>
                        <input 
                          type="url" value={reportForm.github_url}
                          onChange={(e) => setReportForm({...reportForm, github_url: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-xs text-white"
                          placeholder="https://github.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Live Deployment URL</label>
                        <input 
                          type="url" value={reportForm.deployment_url}
                          onChange={(e) => setReportForm({...reportForm, deployment_url: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg p-2.5 text-xs text-white"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Technical Challenges Faced</label>
                        <textarea 
                          rows="2" value={reportForm.challenges_faced}
                          onChange={(e) => setReportForm({...reportForm, challenges_faced: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg p-3 text-xs text-white"
                          placeholder="Briefly describe blocks..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Learning Outcomes &amp; Next Week Plan</label>
                        <textarea 
                          rows="2" value={reportForm.next_week_plan}
                          onChange={(e) => setReportForm({...reportForm, next_week_plan: e.target.value})}
                          className="w-full bg-background border border-white/10 rounded-lg p-3 text-xs text-white"
                          placeholder="What did you learn and plan to build next?"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary uppercase mb-2">Upload Evidence File (PDF/Image/ZIP)</label>
                      <input 
                        type="file" onChange={handleFileChange}
                        className="w-full text-xs text-text-secondary file:bg-accent/10 file:hover:bg-accent/20 file:border-white/5 file:text-accent file:px-4 file:py-2 file:rounded-xl file:cursor-pointer"
                      />
                    </div>

                    <button 
                      type="submit" disabled={isSubmittingReport}
                      className="glow-button w-full py-3.5 text-xs flex items-center justify-center gap-1.5"
                    >
                      {isSubmittingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Submit Weekly Evaluation Report
                    </button>
                  </form>
                )}

                {/* Reports History */}
                <div className="space-y-4">
                  {reports.length === 0 ? (
                    <div className="glass-card p-10 text-center text-xs text-text-muted border border-white/5">
                      No weekly evaluation reports filed yet. Click "Submit Weekly Report" above to begin.
                    </div>
                  ) : (
                    reports.map((rep) => (
                      <div key={rep.id} className="glass-card p-5 border border-white/5 text-left space-y-4 hover:border-white/10 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div>
                            <h4 className="text-sm font-bold text-white font-heading">Weekly Report #{rep.week_number}</h4>
                            <span className="text-[10px] text-text-muted mt-0.5">Submitted on {new Date(rep.submitted_at).toLocaleDateString()}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase self-start sm:self-auto ${
                            rep.status === 'Approved' ? 'bg-green-950/30 text-green-400 border border-green-500/20' :
                            rep.status === 'Rejected' ? 'bg-red-950/30 text-red-400 border border-red-500/20' :
                            'bg-yellow-950/30 text-yellow-400 border border-yellow-500/20'
                          }`}>
                            {rep.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-text-muted block text-[10px] uppercase">Hours Logged</span>
                            <strong className="text-white block mt-0.5">{rep.hours_worked} hours</strong>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px] uppercase">Review Grade</span>
                            <strong className="text-white block mt-0.5">{rep.score !== null ? `${rep.score}%` : 'Pending'}</strong>
                          </div>
                          {rep.github_url && (
                            <div>
                              <span className="text-text-muted block text-[10px] uppercase">GitHub Repo</span>
                              <a href={rep.github_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1 mt-0.5">
                                Link <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {rep.deployment_url && (
                            <div>
                              <span className="text-text-muted block text-[10px] uppercase">Live Deploy</span>
                              <a href={rep.deployment_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1 mt-0.5">
                                Link <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 text-xs text-text-secondary bg-background/30 p-3.5 rounded-lg border border-white/5">
                          <span className="text-text-muted font-bold block text-[9px] uppercase tracking-wider">Work Synopsis:</span>
                          <p className="whitespace-pre-line leading-relaxed">{rep.work_completed}</p>
                        </div>

                        {rep.feedback && (
                          <div className="space-y-1 text-xs text-yellow-400 bg-yellow-950/5 p-3 rounded-lg border border-yellow-500/10">
                            <span className="text-text-muted block font-bold text-[9px] uppercase tracking-wider">Mentor Evaluation Comments:</span>
                            <p className="italic">&ldquo;{rep.feedback}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: MEETINGS */}
            {activeTab === 'meetings' && (
              <div className="space-y-6 text-left">
                <h3 className="font-heading font-bold text-white text-base">Scheduled Mentorship Calls</h3>
                <div className="space-y-4">
                  {meetings.length === 0 ? (
                    <div className="glass-card p-10 text-center text-xs text-text-muted border border-white/5">No meetings scheduled for your cohort.</div>
                  ) : (
                    meetings.map((meet) => (
                      <div key={meet.id} className="glass-card p-5 border border-white/5 space-y-3 hover:border-white/10 transition-all">
                        <div className="flex justify-between items-start border-b border-white/5 pb-2">
                          <div>
                            <h4 className="text-sm font-bold text-white font-heading">{meet.title}</h4>
                            <p className="text-[10px] text-text-muted mt-0.5">Scheduled by {meet.created_by}</p>
                          </div>
                          <span className="text-[9px] font-bold text-accent uppercase bg-accent/5 px-2 py-0.5 rounded border border-accent/10">
                            {meet.meeting_type}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                          <div>
                            <span className="text-text-muted block text-[10px]">Date</span>
                            <span className="text-white block font-medium mt-0.5">{meet.meeting_date}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px]">Time</span>
                            <span className="text-white block font-medium mt-0.5">{meet.meeting_time}</span>
                          </div>
                          <div>
                            <span className="text-text-muted block text-[10px]">Join Room</span>
                            <a href={meet.meet_link} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1 mt-0.5 font-bold">
                              Launch Call <Video className="w-3.5 h-3.5 text-accent" />
                            </a>
                          </div>
                        </div>

                        {meet.description && (
                          <p className="text-xs text-text-secondary leading-relaxed pt-2 border-t border-white/5 italic">{meet.description}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: NOTICE BOARD */}
            {activeTab === 'announcements' && (
              <div className="space-y-6 text-left">
                <h3 className="font-heading font-bold text-white text-base">Notice Board Announcements</h3>
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <div className="glass-card p-10 text-center text-xs text-text-muted border border-white/5">No announcements broadcasted yet.</div>
                  ) : (
                    announcements.map((ann) => (
                      <div key={ann.id} className="glass-card p-5 border border-white/5 space-y-3 hover:border-white/10 transition-all">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <h4 className="text-sm font-bold text-white font-heading">{ann.title}</h4>
                          <span className="text-[9px] text-text-muted">{new Date(ann.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{ann.message}</p>
                        {ann.meet_link && (
                          <div className="pt-2 text-xs">
                            <span className="text-text-muted">Reference Link: </span>
                            <a href={ann.meet_link} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1 font-bold">
                              Launch Attachment <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        <div className="text-[10px] text-text-muted text-right">Broadcasted by: {ann.created_by}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: CHAT CHANNELS */}
            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[480px]">
                
                {/* Channels select sidebar */}
                <div className="lg:col-span-3 glass-card p-4 border border-white/5 flex flex-col gap-3 text-left">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider block">Cohort Channels</span>
                  {[
                    { type: 'Global', label: 'Global General Room', info: 'All platform interns' },
                    { type: 'Domain', label: `${project?.domain || 'Domain'} Room`, info: 'Same-domain interns' },
                    { type: 'Mentor', label: 'My Mentor Group Chat', info: 'Private cohort' }
                  ].map((chan) => (
                    <button
                      key={chan.type}
                      onClick={() => {
                        setChatType(chan.type)
                        loadChatMessages(chan.type)
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        chatType === chan.type
                          ? 'bg-accent/10 border-accent text-white font-bold'
                          : 'bg-white/[0.01] border-white/5 text-text-secondary hover:text-white hover:border-white/10'
                      }`}
                    >
                      <div className="text-xs font-bold">{chan.label}</div>
                      <div className="text-[9px] text-text-muted mt-0.5 font-normal">{chan.info}</div>
                    </button>
                  ))}
                </div>

                {/* Messages pane */}
                <div className="lg:col-span-9 glass-card border border-white/5 flex flex-col justify-between overflow-hidden relative">
                  <div className="bg-white/[0.02] p-3.5 border-b border-white/5 text-left">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Active Channel: {chatType} Room</h4>
                  </div>

                  <div className="flex-grow p-4 space-y-3 max-h-[300px] overflow-y-auto scrollbar-none flex flex-col">
                    {chatMessages.length === 0 ? (
                      <div className="py-16 text-center text-xs text-text-muted flex-grow flex items-center justify-center">
                        No communication records found for this channel. Type below to start broadcasting.
                      </div>
                    ) : (
                      chatMessages.map((msg) => {
                        const isMe = msg.sender_id === user.application_id || msg.sender_id === user.email
                        return (
                          <div key={msg.id} className={`flex flex-col max-w-[70%] text-left ${isMe ? 'self-end' : 'self-start'}`}>
                            <span className="text-[8px] text-text-muted px-1">
                              {msg.sender_name} ({msg.sender_role})
                            </span>
                            <div className={`p-2.5 rounded-2xl text-xs mt-0.5 leading-relaxed ${
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

                  <form onSubmit={handleSendMessage} className="p-3 bg-white/[0.02] border-t border-white/5 flex gap-2">
                    <input 
                      type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Broadcast chat message..."
                      className="flex-grow bg-background/60 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    />
                    <button 
                      type="submit" disabled={isSendingMessage}
                      className="glow-button px-4 py-2.5 text-xs rounded-xl"
                    >
                      {isSendingMessage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 6: TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-6 text-left">
                <h3 className="font-heading font-bold text-white text-base">Internship Milestone Activity Timeline</h3>
                <div className="relative border-l border-white/10 pl-6 space-y-8 ml-3 py-2">
                  {timeline.length === 0 ? (
                    <p className="text-xs text-text-muted">No activity timeline logs saved yet.</p>
                  ) : (
                    timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-9 top-1 w-6 h-6 rounded-full bg-accent/25 border-2 border-accent flex items-center justify-center text-accent text-[9px] font-bold shadow-xl">
                          {timeline.length - idx}
                        </div>
                        <div className="space-y-1">
                          <strong className="text-xs text-white block">{event.event}</strong>
                          <span className="text-[9px] text-text-muted block">{new Date(event.timestamp).toLocaleString()}</span>
                          <p className="text-[11px] text-text-secondary leading-relaxed mt-1">{event.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar Info (Span 4) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* PROJECT ASSIGNED INFO */}
            <AnimatedSection delay={0.2}>
              <div className="glass-card p-6 border border-white/5 space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <BookOpen className="w-5 h-5 text-accent" />
                  <h3 className="font-heading font-bold text-white text-sm">Assigned Project</h3>
                </div>

                {project ? (
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-text-muted uppercase tracking-wider block text-[10px]">Project Name</span>
                      <strong className="text-white block mt-0.5">{project.project_name}</strong>
                    </div>

                    <div>
                      <span className="text-text-muted uppercase tracking-wider block text-[10px]">Project Mentor</span>
                      <span className="text-white block font-medium mt-0.5">{project.mentor_name}</span>
                    </div>

                    <div>
                      <span className="text-text-muted uppercase tracking-wider block text-[10px]">GitHub Repository</span>
                      <a 
                        href={project.repository_url} target="_blank" rel="noreferrer"
                        className="text-accent font-bold mt-1 inline-flex items-center gap-1.5 hover:underline"
                      >
                        <Github className="w-3.5 h-3.5 text-accent" /> {project.assigned_repository} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <div>
                        <span className="text-text-muted block text-[10px]">Start Date</span>
                        <span className="text-white font-medium">{new Date(project.start_date).toLocaleDateString()}</span>
                      </div>

                      <div>
                        <span className="text-text-muted block text-[10px]">End Date</span>
                        <span className="text-white font-medium">{new Date(project.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted py-4">No active project assignments. Waiting for mentor review.</p>
                )}
              </div>
            </AnimatedSection>

            {/* MENTOR EVALUATIONS & FEEDBACK */}
            <AnimatedSection delay={0.3}>
              <div className="glass-card p-6 border border-white/5 space-y-4 text-left">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <h3 className="font-heading font-bold text-white text-sm">Mentor Evaluations</h3>
                </div>

                {project && project.mentor_feedback ? (
                  <p className="text-xs text-text-secondary leading-relaxed bg-background/50 border border-white/5 p-4 rounded-lg italic">
                    &ldquo;{project.mentor_feedback}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-text-muted py-4">No mentor evaluations logged for your file yet.</p>
                )}
              </div>
            </AnimatedSection>

          </div>

        </div>

      </section>
    </main>
  )
}
