import { motion } from 'framer-motion'
import { Globe, Smartphone, Code2, Palette, Check, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import AnimatedSection from '../components/AnimatedSection'

const services = [
  {
    icon: Globe,
    title: 'Web Development',
    shortDesc: 'High-performance websites and web applications built for speed, scalability, and conversion.',
    whatItIs: 'We build modern web applications using cutting-edge technologies like React, Next.js, and Node.js. From marketing websites to complex SaaS platforms, we deliver solutions that perform.',
    whoItIsFor: 'Startups, enterprises, and businesses looking to establish or scale their digital presence with high-performance web solutions.',
    problemsSolved: [
      'Slow-loading websites that hurt conversions',
      'Outdated tech stacks that limit scalability',
      'Poor mobile responsiveness',
      'Security vulnerabilities',
      'Complex integrations with third-party services',
    ],
    features: [
      'Server-side rendering for SEO',
      'Progressive Web App capabilities',
      'Real-time data handling',
      'Advanced caching strategies',
      'CI/CD pipeline integration',
    ],
  },
  {
    icon: Smartphone,
    title: 'Mobile App Development',
    shortDesc: 'Native and cross-platform mobile apps that deliver exceptional user experiences.',
    whatItIs: 'We develop iOS and Android applications using React Native and Flutter, ensuring native-like performance with a single codebase. Our apps are built to engage users and drive retention.',
    whoItIsFor: 'Businesses looking to reach customers on mobile, startups launching MVPs, and companies needing internal mobile tools.',
    problemsSolved: [
      'Poor app performance and crashes',
      'Inconsistent experience across platforms',
      'High development costs for dual platforms',
      'Slow time-to-market',
      'Difficulty maintaining and updating apps',
    ],
    features: [
      'Cross-platform development',
      'Offline functionality',
      'Push notifications',
      'Biometric authentication',
      'App store optimization',
    ],
  },
  {
    icon: Code2,
    title: 'Custom Software',
    shortDesc: 'Tailored software solutions designed to solve your specific business challenges.',
    whatItIs: 'We design and build bespoke software systems that address your unique operational needs. From internal tools to customer-facing platforms, we create software that fits your business perfectly.',
    whoItIsFor: 'Organizations with unique workflows, businesses needing specialized tools, and companies looking to automate complex processes.',
    problemsSolved: [
      'Off-the-shelf software that does not fit',
      'Manual processes slowing operations',
      'Data silos across departments',
      'Legacy systems holding back growth',
      'Integration challenges with existing tools',
    ],
    features: [
      'API-first architecture',
      'Microservices design',
      'Database optimization',
      'Automated testing',
      'Cloud-native deployment',
    ],
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    shortDesc: 'User-centered design that combines aesthetics with functionality.',
    whatItIs: 'We create intuitive, visually striking interfaces that align with your brand and drive user engagement. Our design process is rooted in research, not assumptions.',
    whoItIsFor: 'Companies looking to improve user experience, startups needing MVP designs, and businesses refreshing their digital identity.',
    problemsSolved: [
      'High bounce rates due to poor UX',
      'Inconsistent brand identity across platforms',
      'Low conversion rates',
      'User confusion and support tickets',
      'Accessibility compliance issues',
    ],
    features: [
      'User research and personas',
      'Wireframing and prototyping',
      'Design systems',
      'Usability testing',
      'Accessibility compliance (WCAG)',
    ],
  },
]

export default function Services() {
  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <AnimatedSection className="text-center max-w-4xl mx-auto">
          <span className="text-accent text-sm font-medium tracking-wider uppercase">Services</span>
          <h1 className="heading-lg mt-4 mb-6">
            Solutions That{' '}
            <span className="text-gradient">Drive Results</span>
          </h1>
          <p className="body-lg">
            Every service is engineered for performance, scalability, and measurable business impact.
            We do not build features for the sake of features. We build what moves the needle.
          </p>
        </AnimatedSection>
      </section>

      {/* Services Detail */}
      <section className="section-padding py-12 max-w-7xl mx-auto">
        <div className="space-y-24">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-start ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="glass-card p-8 md:p-10 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                    <service.icon className="w-8 h-8 text-accent" />
                  </div>
                  <h2 className="heading-md mb-4">{service.title}</h2>
                  <p className="body-lg mb-8">{service.shortDesc}</p>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-accent mb-2 uppercase tracking-wider">
                        What It Is
                      </h4>
                      <p className="body-md text-sm">{service.whatItIs}</p>
                    </div>
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-accent mb-2 uppercase tracking-wider">
                        Who It Is For
                      </h4>
                      <p className="body-md text-sm">{service.whoItIsFor}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                <div className="space-y-6">
                  <div className="glass-card p-6">
                    <h4 className="font-heading font-semibold text-sm text-accent mb-4 uppercase tracking-wider">
                      Problems We Solve
                    </h4>
                    <ul className="space-y-3">
                      {service.problemsSolved.map((problem) => (
                        <li key={problem} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-accent" />
                          </div>
                          <span className="body-md text-sm">{problem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-card p-6">
                    <h4 className="font-heading font-semibold text-sm text-accent mb-4 uppercase tracking-wider">
                      Key Features
                    </h4>
                    <ul className="space-y-3">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-accent" />
                          </div>
                          <span className="body-md text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-12 text-center"
        >
          <h2 className="heading-md mb-4">Not Sure What You Need?</h2>
          <p className="body-lg max-w-xl mx-auto mb-8">
            Let us analyze your requirements and recommend the right solution for your business.
          </p>
          <Link to="/contact">
            <button className="glow-button flex items-center gap-2 mx-auto">
              Get Free Consultation
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      </section>
    </main>
  )
}
