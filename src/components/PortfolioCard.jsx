import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

export default function PortfolioCard({ title, description, tags, imageColor, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="glass-card overflow-hidden group cursor-pointer"
    >
      <div className={`h-56 ${imageColor} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-secondary to-transparent opacity-60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <ExternalLink className="w-8 h-8 text-white/70" />
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-heading font-semibold text-xl mb-2 group-hover:text-accent transition-colors duration-300">
          {title}
        </h3>
        <p className="body-md text-sm mb-4">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
