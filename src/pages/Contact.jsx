import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, MessageCircle, Send, CheckCircle, AlertCircle } from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSubmitting(false)
    setIsSubmitted(true)
    setErrors({})
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <main className="pt-20">
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <AnimatedSection className="text-center max-w-4xl mx-auto">
          <span className="text-accent text-sm font-medium tracking-wider uppercase">Contact</span>
          <h1 className="heading-lg mt-4 mb-6">
            Let&apos;s Build Something{' '}
            <span className="text-gradient">Extraordinary</span>
          </h1>
          <p className="body-lg">
            Have a project in mind? We respond within 24 hours. Let us discuss how we can help you achieve your goals.
          </p>
        </AnimatedSection>
      </section>

      <section className="section-padding py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <AnimatedSection>
              <div className="glass-card p-8">
                <h3 className="heading-md mb-6">Get in Touch</h3>
                <div className="space-y-6">
                  <a href="mailto:manchestertechnologiess@gmail.com" className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                      <Mail className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm mb-1">Email</p>
                      <p className="text-text-secondary text-sm group-hover:text-accent transition-colors">manchestertechnologiess@gmail.com</p>
                    </div>
                  </a>
                  <a href="tel:+919036351517" className="flex items-start gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                      <Phone className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm mb-1">Phone</p>
                      <p className="text-text-secondary text-sm group-hover:text-accent transition-colors">+91 90363 51517</p>
                    </div>
                  </a>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm mb-1">Location</p>
                      <p className="text-text-secondary text-sm">Davanagere, Karnataka, India</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <a href="https://wa.me/919036351517" target="_blank" rel="noopener noreferrer" className="glass-card p-8 flex items-center gap-6 group hover:border-accent/20 transition-all duration-300 block">
                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-500/20 transition-colors">
                  <MessageCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-lg mb-1">Prefer WhatsApp?</p>
                  <p className="text-text-secondary text-sm">Chat with us directly for quick responses.</p>
                </div>
              </a>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <div className="glass-card p-8">
                <h4 className="font-heading font-semibold text-lg mb-4">Working Hours</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-text-secondary">Monday - Friday</span><span className="text-text-primary">9:00 AM - 7:00 PM IST</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Saturday</span><span className="text-text-primary">10:00 AM - 4:00 PM IST</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Sunday</span><span className="text-text-muted">Closed</span></div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          <div className="lg:col-span-3">
            <AnimatedSection>
              <div className="glass-card p-8 md:p-10">
                {isSubmitted ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="heading-md mb-3">Message Sent!</h3>
                    <p className="body-md max-w-md mx-auto">Thank you for reaching out. We have received your message and will get back to you within 24 hours.</p>
                    <button onClick={() => { setIsSubmitted(false); setFormData({ name: '', email: '', message: '' }) }} className="glow-button-outline mt-8 text-sm">Send Another Message</button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div><h3 className="heading-md mb-6">Send a Message</h3></div>
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">Name</label>
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl bg-background border transition-all duration-200 outline-none focus:ring-2 focus:ring-accent/50 ${errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/50'}`} placeholder="Your name" />
                      {errors.name && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-red-400 text-xs mt-2"><AlertCircle className="w-3 h-3" />{errors.name}</motion.p>}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">Email</label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`w-full px-4 py-3 rounded-xl bg-background border transition-all duration-200 outline-none focus:ring-2 focus:ring-accent/50 ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/50'}`} placeholder="you@company.com" />
                      {errors.email && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-red-400 text-xs mt-2"><AlertCircle className="w-3 h-3" />{errors.email}</motion.p>}
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">Message</label>
                      <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={5} className={`w-full px-4 py-3 rounded-xl bg-background border transition-all duration-200 outline-none focus:ring-2 focus:ring-accent/50 resize-none ${errors.message ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent/50'}`} placeholder="Tell us about your project..." />
                      {errors.message && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-red-400 text-xs mt-2"><AlertCircle className="w-3 h-3" />{errors.message}</motion.p>}
                    </div>
                    <button type="submit" disabled={isSubmitting} className="glow-button w-full flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                      {isSubmitting ? <><div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />Sending...</> : <><>Send Message</><Send className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </main>
  )
}
