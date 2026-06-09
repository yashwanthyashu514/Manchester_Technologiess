import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  Upload, 
  FileText, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  ArrowRight 
} from 'lucide-react'
import { Link } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'

const domains = [
  'Web Development',
  'Mobile App Development',
  'Artificial Intelligence',
  'Machine Learning',
  'UI/UX Design',
  'Database Development',
  'Testing & QA',
  'Full Stack Development'
]

const durations = ['30 Days', '45 Days', '60 Days']

export default function InternshipApply() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [successData, setSuccessData] = useState(null)

  // Form Fields
  const [formData, setFormData] = useState({
    // Personal Details
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    city: '',
    state: '',
    address: '',
    country: '',
    // Academic Details
    college_name: '',
    university_name: '',
    degree: '',
    department: '', // Will store Branch/Specialization
    branch: '',      // Branch duplicate to align with schema
    semester: '',
    graduation_year: '',
    cgpa: '',
    // Professional Details
    skills: '',
    certifications: '',
    previous_experience: '', // 'Yes' or 'No'
    experience_description: '',
    technologies_known: '',
    programming_languages: '',
    github_profile: '',
    linkedin_profile: '',
    portfolio_url: '',
    // Internship Details
    preferred_domain: '',
    preferred_duration: '',
    start_date: '',
    // Questionnaire
    q_why_internship: '',
    q_tech_best: '',
    q_best_project: '',
    q_hours_per_day: '',
    q_why_select: '',
    q_career_goals: '',
    additional_comments: '',
    // Confidentiality Checkboxes
    conf1: false,
    conf2: false,
    conf3: false,
    conf4: false
  })

  // File Uploads
  const [files, setFiles] = useState({
    resume: null,
    portfolio: null,
    docs: null
  })

  const [fileErrors, setFileErrors] = useState({
    resume: '',
    portfolio: '',
    docs: ''
  })

  // Field change handlers
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Keep department and branch synchronized
      if (name === 'department') {
        updated.branch = value;
      }
      return updated;
    })
  }

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  // File validation and loader
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target
    const file = selectedFiles[0]
    if (!file) return

    // Limit to 10MB
    const maxSize = 10 * 1024 * 1024
    const allowedExtensions = ['.pdf', '.doc', '.docx']
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!allowedExtensions.includes(ext)) {
      setFileErrors(prev => ({ ...prev, [name]: 'Invalid format. Only PDF, DOC, and DOCX are accepted.' }))
      setFiles(prev => ({ ...prev, [name]: null }))
      return
    }

    if (file.size > maxSize) {
      setFileErrors(prev => ({ ...prev, [name]: 'File size exceeds 10MB limit.' }))
      setFiles(prev => ({ ...prev, [name]: null }))
      return
    }

    setFileErrors(prev => ({ ...prev, [name]: '' }))
    setFiles(prev => ({ ...prev, [name]: file }))
  }

  // Next and Back Wizard Steps
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
      window.scrollTo(0, 0)
    }
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
    window.scrollTo(0, 0)
  }

  // Validations per step
  const validateStep = (s) => {
    if (s === 1) {
      const { full_name, email, phone, dob, gender, city, state, address, country } = formData
      if (!full_name || !email || !phone || !dob || !gender || !city || !state || !address || !country) {
        alert('Please fill in all personal details including Country.')
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address.')
        return false
      }
      return true
    }
    
    if (s === 2) {
      const { college_name, university_name, degree, department, semester, graduation_year, cgpa } = formData
      if (!college_name || !university_name || !degree || !department || !semester || !graduation_year || !cgpa) {
        alert('Please fill in all academic details including Degree and Branch/Specialization.')
        return false
      }
      return true
    }

    if (s === 3) {
      const { skills, previous_experience, experience_description } = formData
      if (!skills) {
        alert('Please list your skills.')
        return false
      }
      if (!previous_experience) {
        alert('Please select whether you have previous internship experience.')
        return false
      }
      if (previous_experience === 'Yes' && !experience_description) {
        alert('Please describe your previous experience.')
        return false
      }
      return true
    }

    if (s === 4) {
      const { preferred_domain, preferred_duration, start_date } = formData
      if (!preferred_domain || !preferred_duration || !start_date) {
        alert('Please select domain, duration, and target start date.')
        return false
      }
      return true
    }

    if (s === 5) {
      if (!files.resume) {
        alert('Resume upload is mandatory.')
        return false
      }
      return true
    }

    return true
  }

  // Submit Multi-part Form
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Final check for confidentiality checkboxes
    const { conf1, conf2, conf3, conf4 } = formData
    if (!conf1 || !conf2 || !conf3 || !conf4) {
      alert('You must accept all confidentiality agreement terms to submit.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    const payload = new FormData()
    
    // Append fields
    Object.keys(formData).forEach(key => {
      payload.append(key, formData[key])
    })

    // Append files
    if (files.resume) payload.append('resume', files.resume)
    if (files.portfolio) payload.append('portfolio', files.portfolio)
    if (files.docs) payload.append('docs', files.docs)

    try {
      const res = await fetch('/api/internships/apply', {
        method: 'POST',
        body: payload
      })

      let result = {}
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        result = await res.json()
      } else {
        // Fallback for HTML error pages or non-JSON responses from servers like Vercel
        throw new Error('Server returned an invalid response. Please ensure database connections are configured correctly.')
      }

      if (!res.ok) {
        throw new Error(result.error || 'Server error occurred during submission.')
      }

      setSuccessData(result)
      setStep(7) // Success Screen
      window.scrollTo(0, 0)
    } catch (err) {
      console.error(err)
      setSubmitError(err.message || 'Submission failed. Check connection parameters.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Form Headers
  const stepsTitles = [
    { num: 1, title: 'Personal', icon: User },
    { num: 2, title: 'Academic', icon: GraduationCap },
    { num: 3, title: 'Profile', icon: Briefcase },
    { num: 4, title: 'Internship', icon: FileText },
    { num: 5, title: 'Uploads', icon: Upload },
    { num: 6, title: 'Confidentiality', icon: ShieldAlert }
  ]

  return (
    <main className="pt-20">
      <section className="section-padding py-16 max-w-4xl mx-auto">
        
        {/* Title */}
        <AnimatedSection className="text-center mb-10">
          <h1 className="heading-lg mb-2">Internship Application Form</h1>
          <p className="body-md text-text-secondary">
            Provide your academic credentials and showcase your technical background.
          </p>
        </AnimatedSection>

        {/* Success Page */}
        {step === 7 && successData && (
          <AnimatedSection>
            <div className="glass-card p-10 text-center border border-accent/30 max-w-2xl mx-auto">
              <CheckCircle2 className="w-16 h-16 text-accent mx-auto mb-6" />
              <h2 className="heading-md mb-2 text-white">Application Submitted Successfully!</h2>
              <p className="body-md text-text-secondary mb-8">
                Thank you for applying for an internship at Manchester Technologies. Your application has been submitted successfully. Our team will review your profile and contact you if shortlisted.
              </p>
              
              <div className="bg-background/80 border border-white/5 p-6 rounded-xl mb-8">
                <span className="text-xs text-text-muted uppercase tracking-wider block mb-1">Your Application ID</span>
                <span className="text-2xl md:text-3xl font-heading font-bold text-accent tracking-wider block">
                  {successData.application_id}
                </span>
                <span className="text-xs text-text-secondary mt-2 block">
                  Please save this ID to track your application status.
                </span>
              </div>

              {successData.email_notification_sent === 0 && (
                <div className="bg-accent/5 border border-accent/20 p-4 rounded-lg text-left text-sm text-accent-light mb-8 flex gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>
                    <strong>Note:</strong> Database stored successfully, but email notifications are queued. Your unique ID remains active.
                  </p>
                </div>
              )}

              <div className="flex justify-center gap-4">
                <Link to="/internships/status">
                  <button className="glow-button px-6">
                    Track Application Status
                  </button>
                </Link>
                <Link to="/internships">
                  <button className="glow-button-outline px-6">
                    Back to Program
                  </button>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Main Wizards */}
        {step <= 6 && (
          <div className="glass-card p-6 md:p-10 relative overflow-hidden border border-white/5">
            
            {/* Step Indicators */}
            <div className="hidden md:flex justify-between items-center mb-12 border-b border-white/5 pb-6">
              {stepsTitles.map((s) => {
                const Icon = s.icon
                const isActive = step === s.num
                const isCompleted = step > s.num
                return (
                  <div key={s.num} className="flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border text-sm font-semibold transition-all duration-300 ${
                      isActive 
                        ? 'border-accent bg-accent/10 text-accent font-bold scale-110 shadow-lg shadow-accent/10' 
                        : isCompleted
                        ? 'border-accent bg-accent text-background'
                        : 'border-white/10 text-text-muted bg-transparent'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.num}
                    </div>
                    <span className={`text-xs mt-2 font-medium ${
                      isActive ? 'text-accent' : isCompleted ? 'text-text-primary' : 'text-text-muted'
                    }`}>
                      {s.title}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Mobile indicator */}
            <div className="flex md:hidden justify-between items-center mb-8 bg-background/50 p-4 rounded-lg border border-white/5">
              <span className="text-xs text-text-secondary uppercase">Step {step} of 6</span>
              <span className="font-heading font-semibold text-accent">{stepsTitles[step - 1].title}</span>
            </div>

            {submitError && (
              <div className="bg-red-950/20 border border-red-500/30 p-4 rounded-lg text-sm text-red-400 mb-6 flex gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* STEP 1: PERSONAL DETAILS */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h2 className="heading-md border-l-4 border-accent pl-3 text-white">Personal Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Full Name *</label>
                      <input 
                        type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Email Address *</label>
                      <input 
                        type="email" name="email" required value={formData.email} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Phone Number *</label>
                      <input 
                        type="tel" name="phone" required value={formData.phone} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Date of Birth *</label>
                      <input 
                        type="date" name="dob" required value={formData.dob} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Gender *</label>
                      <select 
                        name="gender" required value={formData.gender} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                      >
                        <option value="" className="bg-secondary">Select Gender</option>
                        <option value="Male" className="bg-secondary">Male</option>
                        <option value="Female" className="bg-secondary">Female</option>
                        <option value="Other" className="bg-secondary">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">City *</label>
                      <input 
                        type="text" name="city" required value={formData.city} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="Davanagere"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">State *</label>
                      <input 
                        type="text" name="state" required value={formData.state} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="Karnataka"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Country *</label>
                      <input 
                        type="text" name="country" required value={formData.country} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="India"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Full Residential Address *</label>
                      <textarea 
                        name="address" required rows={3} value={formData.address} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors resize-none"
                        placeholder="House no, street name, pincode..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: ACADEMIC DETAILS */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h2 className="heading-md border-l-4 border-accent pl-3 text-white">Academic Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">College Name *</label>
                      <input 
                        type="text" name="college_name" required value={formData.college_name} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="BIET, Davanagere"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">University Name *</label>
                      <input 
                        type="text" name="university_name" required value={formData.university_name} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="VTU, Belagavi"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Degree *</label>
                      <input 
                        type="text" name="degree" required value={formData.degree} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="e.g. B.E. / B.Tech / MCA / BCA"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Branch / Specialization *</label>
                      <input 
                        type="text" name="department" required value={formData.department} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="Computer Science & Engineering"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Current Semester / Year *</label>
                      <input 
                        type="text" name="semester" required value={formData.semester} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="e.g. 6th Semester / 3rd Year"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Expected Graduation Year *</label>
                      <input 
                        type="number" name="graduation_year" required min={2020} max={2030} value={formData.graduation_year} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="2027"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Current CGPA or Percentage *</label>
                      <input 
                        type="text" name="cgpa" required value={formData.cgpa} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="8.9 CGPA or 85%"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PROFESSIONAL DETAILS */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h2 className="heading-md border-l-4 border-accent pl-3 text-white">Professional Details</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Skills (Comma-separated) *</label>
                      <input 
                        type="text" name="skills" required value={formData.skills} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="React, CSS, Node.js, Git, UI Design"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Certifications</label>
                      <input 
                        type="text" name="certifications" value={formData.certifications} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="e.g. AWS Certified Developer, Google UX Design Certificate"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Previous Internship Experience *</label>
                      <select 
                        name="previous_experience" required value={formData.previous_experience} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                      >
                        <option value="" className="bg-secondary">Select Option</option>
                        <option value="Yes" className="bg-secondary">Yes</option>
                        <option value="No" className="bg-secondary">No</option>
                      </select>
                    </div>

                    {formData.previous_experience === 'Yes' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Experience Description *</label>
                        <textarea 
                          name="experience_description" required rows={3} value={formData.experience_description} onChange={handleChange}
                          className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors resize-none"
                          placeholder="Please describe your previous internship role, responsibilities, and key accomplishments..."
                        />
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Technologies Known</label>
                      <input 
                        type="text" name="technologies_known" value={formData.technologies_known} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="Tailwind CSS, Express.js, MongoDB, Vite"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Programming Languages Known</label>
                      <input 
                        type="text" name="programming_languages" value={formData.programming_languages} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="JavaScript, Python, C++, Java"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">GitHub Profile URL</label>
                        <input 
                          type="url" name="github_profile" value={formData.github_profile} onChange={handleChange}
                          className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                          placeholder="https://github.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">LinkedIn Profile URL</label>
                        <input 
                          type="url" name="linkedin_profile" value={formData.linkedin_profile} onChange={handleChange}
                          className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Portfolio Website URL</label>
                        <input 
                          type="url" name="portfolio_url" value={formData.portfolio_url} onChange={handleChange}
                          className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                          placeholder="https://username.dev"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: INTERNSHIP DETAILS */}
              {step === 4 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h2 className="heading-md border-l-4 border-accent pl-3 text-white">Internship Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Role Applying For *</label>
                      <select 
                        name="preferred_domain" required value={formData.preferred_domain} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                      >
                        <option value="" className="bg-secondary">Select Role</option>
                        {domains.map(d => (
                          <option key={d} value={d} className="bg-secondary">{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Internship Duration *</label>
                      <select 
                        name="preferred_duration" required value={formData.preferred_duration} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                      >
                        <option value="" className="bg-secondary">Select Duration</option>
                        {durations.map(dur => (
                          <option key={dur} value={dur} className="bg-secondary">{dur}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Available Start Date *</label>
                      <input 
                        type="date" name="start_date" required value={formData.start_date} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: FILE UPLOADS */}
              {step === 5 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <h2 className="heading-md border-l-4 border-accent pl-3 text-white">Upload Section</h2>
                  
                  <p className="text-xs text-text-muted">
                    Accepted formats: PDF, DOC, DOCX. Max file size: 10MB.
                  </p>

                  <div className="space-y-6">
                    {/* Resume */}
                    <div className="bg-background/40 border border-white/5 p-6 rounded-xl">
                      <label className="block text-xs font-bold text-white uppercase mb-2">Resume Upload *</label>
                      <input 
                        type="file" name="resume" required accept=".pdf,.doc,.docx" onChange={handleFileChange}
                        className="text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
                      />
                      {files.resume && <p className="text-xs text-accent mt-2">Selected: {files.resume.name}</p>}
                      {fileErrors.resume && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fileErrors.resume}</p>}
                    </div>

                    {/* Portfolio */}
                    <div className="bg-background/40 border border-white/5 p-6 rounded-xl">
                      <label className="block text-xs font-bold text-white uppercase mb-1">Portfolio Upload (Optional)</label>
                      <span className="text-[10px] text-text-muted block mb-3">Upload your portfolio index page or static design folder PDF</span>
                      <input 
                        type="file" name="portfolio" accept=".pdf,.doc,.docx" onChange={handleFileChange}
                        className="text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accent/5 file:text-text-secondary hover:file:bg-accent/15 cursor-pointer"
                      />
                      {files.portfolio && <p className="text-xs text-accent mt-2">Selected: {files.portfolio.name}</p>}
                      {fileErrors.portfolio && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fileErrors.portfolio}</p>}
                    </div>

                    {/* Supporting Docs */}
                    <div className="bg-background/40 border border-white/5 p-6 rounded-xl">
                      <label className="block text-xs font-bold text-white uppercase mb-1">Supporting Documents (Optional)</label>
                      <span className="text-[10px] text-text-muted block mb-3">Academic marksheets, recommendation letters, or workshop certificates</span>
                      <input 
                        type="file" name="docs" accept=".pdf,.doc,.docx" onChange={handleFileChange}
                        className="text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accent/5 file:text-text-secondary hover:file:bg-accent/15 cursor-pointer"
                      />
                      {files.docs && <p className="text-xs text-accent mt-2">Selected: {files.docs.name}</p>}
                      {fileErrors.docs && <p className="text-xs text-red-400 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{fileErrors.docs}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 6: QUESTIONNAIRE & AGREEMENT */}
              {step === 6 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  
                  {/* Screening Questionnaire */}
                  <h2 className="heading-md border-l-4 border-accent pl-3 text-white">Screening Questionnaire</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Why do you want to join Manchester Technologies? *</label>
                      <textarea 
                        name="q_why_internship" required rows={3} value={formData.q_why_internship} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">What are your key skills? *</label>
                      <textarea 
                        name="q_tech_best" required rows={3} value={formData.q_tech_best} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Describe a project you have worked on. *</label>
                      <textarea 
                        name="q_best_project" required rows={3} value={formData.q_best_project} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">How many hours per day can you dedicate? *</label>
                      <input 
                        type="text" name="q_hours_per_day" required value={formData.q_hours_per_day} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors"
                        placeholder="e.g. 4-6 hours"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Why should we select you? *</label>
                      <textarea 
                        name="q_why_select" required rows={3} value={formData.q_why_select} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">What are your career goals? *</label>
                      <textarea 
                        name="q_career_goals" required rows={3} value={formData.q_career_goals} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Additional Comments</label>
                      <textarea 
                        name="additional_comments" rows={3} value={formData.additional_comments} onChange={handleChange}
                        className="w-full bg-background/60 border border-white/10 rounded-lg p-3 text-white focus:border-accent focus:outline-none transition-colors resize-none"
                        placeholder="Any additional information you would like to share..."
                      />
                    </div>
                  </div>

                  {/* Confidentiality Agreement */}
                  <div className="pt-6 border-t border-white/5 space-y-6">
                    <h2 className="heading-md border-l-4 border-accent pl-3 text-white">Confidentiality Agreement</h2>
                    <p className="text-xs text-text-secondary leading-relaxed bg-accent/5 p-4 rounded-lg border border-accent/20">
                      Please read and accept the mandatory clauses below before submitting your application.
                    </p>

                    <div className="space-y-4">
                      {[
                        { name: 'conf1', label: 'I agree all projects and tasks assigned by Manchester Technologies are confidential.' },
                        { name: 'conf2', label: 'I will not share source code, project files, credentials, or company information with any third party.' },
                        { name: 'conf3', label: 'All work completed during the internship belongs to Manchester Technologies.' },
                        { name: 'conf4', label: 'I understand violation of confidentiality may result in termination of internship.' }
                      ].map((clause) => (
                        <label key={clause.name} className="flex gap-3 cursor-pointer items-start p-2 hover:bg-white/5 rounded-lg transition-colors">
                          <input 
                            type="checkbox" name={clause.name} checked={formData[clause.name]} onChange={handleCheckboxChange}
                            className="mt-1 accent-accent rounded"
                          />
                          <span className="text-xs text-text-secondary leading-relaxed select-none">{clause.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation Controls */}
              <div className="flex justify-between items-center pt-8 border-t border-white/5">
                {step > 1 ? (
                  <button 
                    type="button" onClick={prevStep} disabled={isSubmitting}
                    className="glow-button-outline flex items-center gap-1.5 px-6 py-3 text-xs"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 6 ? (
                  <button 
                    type="button" onClick={nextStep}
                    className="glow-button flex items-center gap-1.5 px-6 py-3 text-xs"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !formData.conf1 || !formData.conf2 || !formData.conf3 || !formData.conf4}
                    className="glow-button flex items-center gap-1.5 px-10 py-3.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        )}

      </section>
    </main>
  )
}
