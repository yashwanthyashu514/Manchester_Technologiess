import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Code2, 
  Smartphone, 
  Cpu, 
  Brain, 
  Palette, 
  Database, 
  ShieldCheck, 
  Layers, 
  Calendar, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileBadge
} from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

const domains = [
  {
    icon: Code2,
    title: 'Web Development',
    desc: 'Build high-performance web systems using React, Vite, and contemporary frontend stacks.'
  },
  {
    icon: Smartphone,
    title: 'Mobile App Development',
    desc: 'Craft native and cross-platform mobile experiences with React Native.'
  },
  {
    icon: Cpu,
    title: 'Artificial Intelligence',
    desc: 'Develop intelligent models, neural networks, and prompt engineering frameworks.'
  },
  {
    icon: Brain,
    title: 'Machine Learning',
    desc: 'Perform data modeling, regression analysis, classification, and statistical processing.'
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    desc: 'Design beautiful, user-centered application prototypes using Figma and Design Systems.'
  },
  {
    icon: Database,
    title: 'Database Development',
    desc: 'Architect optimized schemas, indices, and store operations using SQL and NoSQL engines.'
  },
  {
    icon: ShieldCheck,
    title: 'Testing & QA',
    desc: 'Implement automated unit tests, visual validation, and perform security code auditing.'
  },
  {
    icon: Layers,
    title: 'Full Stack Development',
    desc: 'Connect frontend interfaces with secure Express/Node server backends and database systems.'
  }
]

const selectionSteps = [
  {
    step: '01',
    title: 'Online Submission',
    desc: 'Fill out the application form with personal, academic, and professional details, and upload your resume.'
  },
  {
    step: '02',
    title: 'Technical Review',
    desc: 'Our review board evaluates your profile, GitHub repositories, and skill alignment.'
  },
  {
    step: '03',
    title: 'Online Interview',
    desc: 'Attend a scheduled technical interview covering core engineering principles and project discussion.'
  },
  {
    step: '04',
    title: 'Internship Offer',
    desc: 'Receive an official selection letter, get assigned a mentor, and gain repository access.'
  }
]

const faqs = [
  {
    q: 'Who is eligible to apply for this internship program?',
    a: 'Students currently enrolled in pre-final or final years of Engineering (B.E./B.Tech), MCA, BCA, or allied disciplines. Recent graduates looking for real-world experience are also welcome to apply.'
  },
  {
    q: 'What is the selection process?',
    a: 'After you submit the application form, our engineering team reviews your profile and technical skills. Shortlisted candidates are scheduled for an online technical interview, following which selection offers are issued.'
  },
  {
    q: 'Are the internships remote, hybrid, or on-site?',
    a: 'We offer flexible structures including hybrid and remote options depending on the project domain and candidate preferences.'
  },
  {
    q: 'Is there a fee to join the internship program?',
    a: 'No, Manchester Technologies does not charge any application or training fees. The program is fully merit-based.'
  },
  {
    q: 'Will I receive a certificate upon completion?',
    a: 'Yes, a professional certificate with a verifiable QR code will be generated and issued upon successful completion of all assigned project tasks.'
  }
]

export default function InternshipsLanding() {
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <main className="pt-20">
      {/* Hero Section */}
      <section className="section-padding py-28 relative overflow-hidden max-w-7xl mx-auto">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <AnimatedSection className="lg:col-span-7 text-left">
            <span className="text-accent text-sm font-semibold tracking-widest uppercase bg-accent/10 px-3 py-1.5 rounded-md">
              Internship Program 2026
            </span>
            <h1 className="heading-xl mt-6 mb-6">
              Launch Your Engineering Career with{' '}
              <span className="text-gradient">Real-World Scale</span>
            </h1>
            <p className="body-lg mb-8 max-w-xl">
              Gain hands-on experience by working on real client codebases, building production-ready architectures, and receiving mentorship from senior engineers at Manchester Technologies.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/internships/apply">
                <button className="glow-button">
                  Apply Now <ArrowRight className="inline ml-1 w-5 h-5" />
                </button>
              </Link>
              <Link to="/internships/status">
                <button className="glow-button-outline">
                  Track Application Status
                </button>
              </Link>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={0.2} className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="glass-card p-8 md:p-10 max-w-md w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-white">Program Durations</h3>
                  <p className="text-sm text-text-secondary">Flexible project timelines</p>
                </div>
              </div>
              
              <ul className="space-y-4">
                {[
                  { days: '30 Days', desc: 'Accelerated micro-project integration' },
                  { days: '45 Days', desc: 'Standard project design & development' },
                  { days: '60 Days', desc: 'Comprehensive full-cycle product build' }
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-background/40 rounded-lg border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">{item.days}</span>
                      <span className="text-xs text-text-secondary">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* About Section */}
      <section className="section-padding py-24 bg-secondary/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="glass-card p-8 md:p-12 relative overflow-hidden h-full flex flex-col justify-center">
                <span className="text-accent text-xs font-semibold uppercase tracking-wider mb-2">Program Overview</span>
                <h2 className="heading-md mb-6">About Manchester Technologies Internship</h2>
                <div className="space-y-4 body-md text-text-secondary">
                  <p>
                    Manchester Technologies is committed to shaping the next generation of software developers and designers. Our internship program is structured as a rigorous, industry-aligned training curriculum.
                  </p>
                  <p>
                    Unlike mock projects, our interns work directly on structured development pipelines, gain familiarity with professional branching models (Git/GitHub), and participate in design and architectural reviews.
                  </p>
                  <p>
                    With dedicated mentorship, direct code feedback, and verifiable training credentials, we bridge the gap between classroom theory and enterprise software engineering.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: Award,
                    title: 'Industry Mentorship',
                    desc: 'Work 1-on-1 with experienced engineers who review your code and guide your path.'
                  },
                  {
                    icon: Code2,
                    title: 'Modern Tech Stack',
                    desc: 'Gain proficiency in React, Node, SQL, Git, and cloud deployment flows.'
                  },
                  {
                    icon: FileBadge,
                    title: 'Verifiable Certificate',
                    desc: 'Receive a certificate with a unique verification QR code accepted globally.'
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Production Experience',
                    desc: 'Deploy functional micro-features, resolve actual bugs, and manage version controls.'
                  }
                ].map((benefit, index) => (
                  <div key={index} className="glass-card p-6 relative overflow-hidden group">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                      <benefit.icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-heading font-semibold text-white text-base mb-2">{benefit.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{benefit.desc}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Available Domains */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent text-sm font-semibold tracking-widest uppercase">Specialization Paths</span>
          <h2 className="heading-lg mt-3 mb-4">Available Internship Domains</h2>
          <p className="body-lg max-w-2xl mx-auto">
            Choose your preferred engineering domain to build focused expertise during your internship.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {domains.map((domain, index) => (
            <motion.div
              key={domain.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="glass-card p-6 relative flex flex-col group hover:border-accent/30"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors">
                <domain.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-heading font-semibold text-white text-lg mb-2">{domain.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed flex-grow">{domain.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Selection Process Roadmap */}
      <section className="section-padding py-24 bg-secondary/10">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="text-accent text-sm font-semibold tracking-widest uppercase">The Roadmap</span>
            <h2 className="heading-lg mt-3 mb-4">Our Selection Process</h2>
            <p className="body-lg max-w-2xl mx-auto">
              Follow these clear checkpoints to join the Manchester Technologies team.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {selectionSteps.map((step, index) => (
              <AnimatedSection key={step.step} delay={index * 0.1}>
                <div className="glass-card p-8 h-full relative border-t-2 border-t-accent/30 group hover:border-t-accent">
                  <div className="text-accent font-heading font-black text-4xl mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    {step.step}
                  </div>
                  <h3 className="font-heading font-bold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding py-24 max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent text-sm font-semibold tracking-widest uppercase">Got Questions?</span>
          <h2 className="heading-lg mt-3 mb-4">Frequently Asked Questions</h2>
        </AnimatedSection>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <AnimatedSection key={index} delay={index * 0.05}>
              <div 
                className="glass-card p-5 cursor-pointer border border-white/5 hover:border-accent/20 transition-all duration-300"
                onClick={() => toggleFaq(index)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-accent shrink-0" />
                    <h3 className="font-heading font-semibold text-white text-base md:text-lg">{faq.q}</h3>
                  </div>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-accent shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-accent shrink-0" />
                  )}
                </div>
                
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs md:text-sm text-text-secondary border-t border-white/5 pt-3 leading-relaxed pl-8">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-padding py-20 max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="glass-card p-12 text-center relative overflow-hidden border border-accent/20">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="heading-md mb-4 text-white">Start Your Internship Journey Today</h2>
              <p className="body-md text-text-secondary mb-8">
                Take the first step towards building a successful career in software engineering. Apply now and showcase your skills.
              </p>
              <Link to="/internships/apply">
                <button className="glow-button px-12 py-4 text-base">
                  Apply For Internship
                </button>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </main>
  )
}
