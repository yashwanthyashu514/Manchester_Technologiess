import { motion } from 'framer-motion'

export default function ProcessStep({ number, title, description, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="relative flex gap-6"
    >
      <div className="flex flex-col items-center">
        <div className="relative w-12 h-12 rounded-full bg-accent flex items-center justify-center font-heading font-bold text-background text-lg shrink-0 overflow-hidden">
          {/* Shimmer overlay */}
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
              transform: 'skewX(-25deg)',
              animation: 'shimmerSweep 2.5s ease-in-out infinite',
            }}
          />
          <span className="relative z-10">{number}</span>
        </div>
        {index < 3 && (
          <div className="w-0.5 h-full bg-gradient-to-b from-accent to-transparent mt-2" />
        )}
      </div>
      <div className="pb-12">
        <h3 className="font-heading font-semibold text-xl mb-2">{title}</h3>
        <p className="body-md text-sm">{description}</p>
      </div>
    </motion.div>
  )
}
