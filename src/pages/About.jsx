import { motion } from 'framer-motion'
import { Target, Eye, Rocket, Shield, Lightbulb, TrendingUp } from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'

const coreValues = [
  {
    icon: Rocket,
    title: 'Performance',
    description: 'We optimize for speed, efficiency, and scalability in everything we build.',
  },
  {
    icon: Shield,
    title: 'Reliability',
    description: 'Systems that work flawlessly under pressure. No exceptions.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We leverage cutting-edge technology to solve complex problems creatively.',
  },
]

const stats = [
  { value: '50+', label: 'Projects Delivered' },
  { value: '98%', label: 'Client Satisfaction' },
  { value: '4+', label: 'Years of Excellence' },
  { value: '15+', label: 'Expert Team Members' },
]

export default function About() {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection className="text-left">
            <span className="text-accent text-sm font-medium tracking-wider uppercase">About Us</span>
            <h1 className="heading-lg mt-4 mb-6">
              Engineering Excellence from the{' '}
              <span className="text-gradient">Manchester of Karnataka</span>
            </h1>
            <p className="body-lg mb-6">
              Manchester Technology is a premium digital agency specializing in high-performance web and mobile applications. We build robust, scalable solutions that are strategically designed to drive real business growth.
            </p>
            <p className="body-md text-text-secondary">
              Davanagere, known as the Manchester of Karnataka for its textile heritage, inspires
              our work ethic: precision, craftsmanship, and relentless quality. We bring that same
              spirit to every line of code we write.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2} className="flex justify-center lg:justify-end">
            <div className="relative">
              <motion.div
                animate={{ y: [-8, 8, -8] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative z-10"
              >
                <img 
                  src="/logo.jpeg" 
                  alt="Manchester Technology Logo" 
                  className="w-80 h-80 lg:w-[450px] lg:h-[450px] object-contain rounded-2xl shadow-2xl shadow-accent/10 border border-white/5 bg-background/50 backdrop-blur-sm p-4"
                />
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-padding py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="glass-card p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
                <h2 className="heading-md mb-6 relative z-10">Our Story</h2>
                <div className="space-y-4 body-md relative z-10">
                  <p>
                    Manchester Technology was founded with a clear mission: to build digital products
                    that actually move the needle for businesses. No vanity metrics. No bloated features.
                    Just systems that perform.
                  </p>
                  <p>
                    Based in Davanagere, the Manchester of Karnataka, we draw inspiration from the city&apos;s
                    legacy of industrial excellence and craftsmanship. Like the textile mills that built
                    this city&apos;s reputation, we weave precision into every project.
                  </p>
                  <p>
                    Today, we work with ambitious companies across India and beyond, delivering web platforms,
                    mobile applications, and custom software that drives measurable growth.
                  </p>
                </div>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card p-6 text-center relative overflow-hidden"
                >
                  {/* Shimmer overlay */}
                  <span
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(200,169,106,0.06) 45%, rgba(200,169,106,0.12) 50%, rgba(200,169,106,0.06) 55%, transparent 100%)',
                      transform: 'skewX(-20deg)',
                      animation: 'shimmerSweep 3s ease-in-out infinite',
                      animationDelay: `${index * 0.4}s`,
                    }}
                  />
                  <p className="text-4xl font-heading font-bold text-accent mb-2 relative z-20">{stat.value}</p>
                  <p className="text-text-secondary text-sm relative z-20">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <AnimatedSection>
            <div className="glass-card p-8 md:p-10 h-full">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-accent" />
              </div>
              <h3 className="heading-md mb-4">Our Mission</h3>
              <p className="body-md">
                To empower businesses with high-performance digital products that deliver measurable
                growth. We believe technology should be a competitive advantage, not a bottleneck.
                Every project we undertake is judged by one standard: did it drive real business impact?
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="glass-card p-8 md:p-10 h-full">
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-accent" />
              </div>
              <h3 className="heading-md mb-4">Our Vision</h3>
              <p className="body-md">
                To become the most trusted technology partner for businesses that refuse to settle
                for mediocrity. We envision a future where every company, regardless of size, has
                access to world-class engineering talent and high-performance digital infrastructure.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Core Values */}
      <section className="section-padding py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="text-accent text-sm font-medium tracking-wider uppercase">What Drives Us</span>
            <h2 className="heading-lg mt-3 mb-4">Core Values</h2>
            <p className="body-lg max-w-2xl mx-auto">
              These principles guide every decision we make and every product we build.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coreValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="glass-card p-8 text-center group hover:border-accent/20 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                  <value.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-xl mb-3">{value.title}</h3>
                <p className="body-md text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Davanagere Connection */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5" />
            <div className="relative z-10">
              <TrendingUp className="w-12 h-12 text-accent mx-auto mb-6" />
              <h2 className="heading-md mb-4">Rooted in Excellence</h2>
              <p className="body-lg max-w-3xl mx-auto">
                Davanagere earned the title &ldquo;Manchester of Karnataka&rdquo; through decades of
                industrial leadership and quality craftsmanship. At Manchester Technology, we carry
                that legacy forward into the digital age. Precision. Quality. Reliability. These are
                not just words, they are the standards we live by.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </section>
    </main>
  )
}
