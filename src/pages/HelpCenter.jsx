import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  UserPlus, 
  UserCheck, 
  Key, 
  Shuffle, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Award, 
  Search, 
  Edit3 
} from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

const guides = [
  {
    id: 'create-mentors',
    title: '1. How to create mentors',
    icon: UserPlus,
    description: 'Administrators can create predefined or custom mentor profiles directly from the admin panel.',
    steps: [
      'Navigate to the Admin Internships panel: click on the top-left ManchesterTech logo 3 times to open the admin gateway.',
      'Go to the "Mentor Management" tab located at the top options.',
      'Click the "Add New Mentor" button.',
      'Enter the mentor\'s full name, registered email address, password, and domain expertise.',
      'Click "Save Mentor Profile". The system will securely hash the password and register the account.'
    ]
  },
  {
    id: 'assign-mentors',
    title: '2. How to assign mentors',
    icon: UserCheck,
    description: 'Assign interns to mentors manually or using workload-balanced bulk features.',
    steps: [
      'Navigate to the Admin board and click on the "Mentor Assignment" tab.',
      'Manual Assignment: Select the target intern from the roster dropdown, select the target mentor, and click "Assign".',
      'Bulk Assignment: Multi-select candidates using the roster checkboxes, select the mentors you wish to distribute them among, and click "Run Bulk Distribution".',
      'The system automatically calculates workload balances and assigns candidates equally.'
    ]
  },
  {
    id: 'reset-passwords',
    title: '3. How to reset mentor passwords',
    icon: Key,
    description: 'Administrators can reset mentor passwords back to secure defaults in case of credential loss.',
    steps: [
      'In the Admin panel, head to "Mentor Management".',
      'Locate the mentor profile from the records roster.',
      'Click the "Reset Password" action button on the mentor card or row.',
      'Enter a temporary secure password and confirm the reset.',
      'Inform the mentor of their temporary password; they can change it from their Mentor Dashboard under settings.'
    ]
  },
  {
    id: 'move-interns',
    title: '4. How to move interns between mentors',
    icon: Shuffle,
    description: 'Easily re-assign an intern to a different mentor without deleting any tasks or evaluations.',
    steps: [
      'Go to "Mentor Assignment" inside the Admin panel.',
      'Under the manual assignment section, select the intern who needs to be moved.',
      'Choose the new mentor from the mentor selection dropdown.',
      'Click "Assign". The system will instantly transfer the intern to the new mentor, log the action, and trigger notification alerts.'
    ]
  },
  {
    id: 'weekly-reports',
    title: '5. How weekly reports work',
    icon: FileText,
    description: 'A mandatory module to submit weekly progress tasks, evidence logs, and hours worked.',
    steps: [
      'Interns log into their workspace and click on the "Weekly Progress" tab.',
      'The system automatically calculates the current Week Number (e.g. Week 1).',
      'Fill in the tasks accomplished, technologies learned, next week plan, challenges, and total hours worked.',
      'Upload screenshots, PDFs, ZIP archives, or documents as proof of work.',
      'Click "Submit Weekly Report". Assigned mentors will be alerted to review, score, and provide feedback.'
    ]
  },
  {
    id: 'meetings',
    title: '6. How meetings are scheduled',
    icon: Calendar,
    description: 'Schedule Google Meet sessions for domain cohorts, mentor groups, or individual interns.',
    steps: [
      'Admin or Mentors go to the "Weekly Meetings" scheduler section in their dashboard.',
      'Enter the meeting title, description, date, time, and copy the Google Meet link.',
      'Select the target audience: "All Interns", "Domain-based" (e.g. AI/ML), "Mentor Group" (only assigned interns), or "Individual Intern" (1:1).',
      'Click "Schedule Meeting". The meeting is instantly broadcasted to the target audience\'s notification center.'
    ]
  },
  {
    id: 'attendance',
    title: '7. How attendance is tracked',
    icon: CheckCircle,
    description: 'Log and monitor participation rates for scheduled classroom calls.',
    steps: [
      'After a Google Meet session concludes, the host (Admin or Mentor) opens the scheduled meeting details.',
      'A checklist of all target interns is automatically loaded.',
      'Mark each intern as "Present", "Absent", or "Excused".',
      'Click "Register Attendance". Attendance is factored into the intern\'s weekly performance scoring meter.'
    ]
  },
  {
    id: 'certificates',
    title: '8. How certificates are generated',
    icon: Award,
    description: 'Award official graduation credentials to interns who complete their milestones.',
    steps: [
      'When an intern finishes all assigned checklist tasks, the admin checks their overall performance score.',
      'Click "Generate Internship Certificate" on the candidate\'s file.',
      'The system builds a cryptographically signed PDF certificate with a unique Verification Certificate ID.',
      'A QR verification code is auto-embedded on the certificate, pointing to the public verify registry.'
    ]
  },
  {
    id: 'application-tracking',
    title: '9. How application tracking works',
    icon: Search,
    description: 'Public portal route for candidates to inspect their registration statuses.',
    steps: [
      'Applicants navigate to Internship → Track Application Status.',
      'Enter their registered Gmail address and their unique Tracking ID (e.g. MTI-2026-0001).',
      'Click "Check Status". The page retrieves status records (Under Review, Selected, Rejected) and shows reporting checklists.'
    ]
  },
  {
    id: 'digital-signing',
    title: '10. How digital signing works',
    icon: Edit3,
    description: 'Paperless onboarding for selected candidates to sign terms and conditions.',
    steps: [
      'Once Selected, the candidate tracks their status and clicks "Accept Offer & Sign Agreement".',
      'The system loads the official T&C PDF (`manchestertechnologiestandc-updated.pdf`) dynamically.',
      'Candidates read the guidelines and sign using a digital canvas signature block.',
      'Upon submission, the portal records their browser metadata, IP address, and generates an official cryptographic `MT-SIGN` record.'
    ]
  }
]

export default function HelpCenter() {
  const [openSection, setOpenSection] = useState(null)

  const toggleSection = (id) => {
    setOpenSection(openSection === id ? null : id)
  }

  return (
    <main className="pt-28 pb-20 min-h-screen bg-background relative overflow-hidden text-text-primary">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <section className="section-padding max-w-4xl mx-auto relative z-10">
        <AnimatedSection>
          <div className="text-center mb-12">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4 border border-accent/20">
              <HelpCircle className="w-6 h-6 text-accent" />
            </div>
            <h1 className="heading-md text-white font-heading font-bold text-3xl">Help Desk & User Guides</h1>
            <p className="text-xs text-text-secondary mt-2">Step-by-step documentation for administrators, mentors, and interns</p>
          </div>
        </AnimatedSection>

        <div className="space-y-4">
          {guides.map((guide, idx) => {
            const Icon = guide.icon
            const isOpen = openSection === guide.id

            return (
              <AnimatedSection key={guide.id} delay={idx * 0.05}>
                <div className="glass-card border border-white/5 bg-white/[0.01] backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent/10">
                  <button 
                    onClick={() => toggleSection(guide.id)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center border border-white/5 text-accent shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-white tracking-wide">{guide.title}</h2>
                        <p className="text-xs text-text-muted mt-0.5">{guide.description}</p>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-accent" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/5 bg-background/40"
                      >
                        <div className="p-6 space-y-3">
                          <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Step-by-Step Procedure:</h3>
                          <ul className="space-y-2.5">
                            {guide.steps.map((step, sIdx) => (
                              <li key={sIdx} className="flex gap-3 text-xs leading-relaxed text-text-secondary">
                                <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 border border-white/5">
                                  {sIdx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </AnimatedSection>
            )
          })}
        </div>
      </section>
    </main>
  )
}
