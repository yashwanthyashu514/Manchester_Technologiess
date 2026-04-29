import { motion } from 'framer-motion'

export default function ServiceCard({ icon: Icon, title, description, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-card p-8 group cursor-pointer"
    >
      <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors duration-300">
        <Icon className="w-7 h-7 text-accent" />
      </div>
      <h3 className="font-heading font-semibold text-xl mb-3 text-text-primary group-hover:text-accent transition-colors duration-300">
        {title}
      </h3>
      <p className="body-md text-sm">{description}</p>
    </motion.div>
  )
}
