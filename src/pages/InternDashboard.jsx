import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  Trophy
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'

export default function InternDashboard() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Dashboard Project States
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [isUpdatingTasks, setIsUpdatingTasks] = useState(false)

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
      const res = await fetch('/api/intern/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sync intern dashboard.')
      }

      setProject(data.project)
      if (data.project && data.project.tasks) {
        setTasks(data.project.tasks)
      }
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

      if (!res.ok) {
        throw new Error('Sync failed.')
      }
    } catch (err) {
      alert('Failed to save task update to database: ' + err.message)
      // Rollback
      fetchDashboardData()
    } finally {
      setIsUpdatingTasks(false)
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
          <span>Synchronizing Intern Dashboard...</span>
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
          <div>
            <span className="text-accent text-xs font-semibold tracking-wider uppercase bg-accent/10 px-3 py-1.5 rounded-md">
              Intern Workspace
            </span>
            <h1 className="heading-md text-white mt-3">Welcome Back, {user?.full_name}!</h1>
            <p className="text-xs text-text-secondary mt-1">Application ID: <strong>{user?.application_id}</strong></p>
          </div>
          <button 
            onClick={handleLogout}
            className="glow-button-outline px-5 py-2 text-xs self-start md:self-auto flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Logout session
          </button>
        </div>

        {/* Dashboard layouts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main workspace (Span 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* PROGRESS MONITOR CARD */}
            <AnimatedSection>
              <div className="glass-card p-6 md:p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
                <h3 className="font-heading font-bold text-white text-base mb-4">Internship Task Progress</h3>

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  
                  {/* Circular visual or percent count */}
                  <div className="relative w-24 h-24 rounded-full border border-accent/20 flex flex-col items-center justify-center shrink-0 bg-background/50">
                    <span className="text-3xl font-heading font-bold text-accent">{progressPercent}%</span>
                    <span className="text-[9px] text-text-muted mt-0.5">COMPLETED</span>
                  </div>

                  <div className="flex-grow space-y-2">
                    <div className="flex justify-between items-center text-xs text-text-secondary">
                      <span>Tasks completion checklist ({completedTasks} of {totalTasks})</span>
                      <span>{progressPercent}% Complete</span>
                    </div>
                    {/* HTML Progress bar */}
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
              <div className="glass-card p-6 md:p-8 border border-white/5">
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

          {/* Sidebar Info (Span 4) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* PROJECT ASSIGNED INFO */}
            <AnimatedSection delay={0.2}>
              <div className="glass-card p-6 border border-white/5 space-y-4">
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
              <div className="glass-card p-6 border border-white/5 space-y-4">
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
