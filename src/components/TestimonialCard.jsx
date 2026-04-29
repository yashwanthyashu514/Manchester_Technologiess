import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'

export default function TestimonialCard({ quote, author, role, company, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="glass-card p-8 relative"
    >
      <Quote className="w-10 h-10 text-accent/20 absolute top-6 right-6" />
      <p className="body-md text-base mb-6 italic leading-relaxed">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center font-heading font-bold text-background">
          {author.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="font-heading font-semibold text-sm">{author}</p>
          <p className="text-text-muted text-xs">{role}, {company}</p>
        </div>
      </div>
    </motion.div>
  )
}
