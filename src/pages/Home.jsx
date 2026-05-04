import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Globe,
  Smartphone,
  Code2,
  Palette,
  Shield,
  Zap,
  Lock,
  Layers,
  Users,
  MessageSquare,
  Clock,
  TrendingUp,
  ArrowRight,
  MessageCircle,
  ChevronRight,
} from 'lucide-react'
import AnimatedSection from '../components/AnimatedSection'
import ServiceCard from '../components/ServiceCard'
import ProcessStep from '../components/ProcessStep'
import PortfolioCard from '../components/PortfolioCard'
import TestimonialCard from '../components/TestimonialCard'

const services = [
  {
    icon: Globe,
    title: 'Web Development',
    description: 'High-performance websites and web applications built for speed, scalability, and conversion. From landing pages to complex platforms.',
  },
  {
    icon: Smartphone,
    title: 'Mobile App Development',
    description: 'Native and cross-platform mobile apps that deliver exceptional user experiences and drive engagement on iOS and Android.',
  },
  {
    icon: Code2,
    title: 'Custom Software',
    description: 'Tailored software solutions designed to solve your specific business challenges and streamline operations.',
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    description: 'User-centered design that combines aesthetics with functionality to create intuitive, conversion-optimized interfaces.',
  },
]

const performanceFeatures = [
  { icon: TrendingUp, title: 'Scalability', description: 'Architected to grow with your business without performance degradation.' },
  { icon: Zap, title: 'Speed', description: 'Lightning-fast load times that keep users engaged and improve rankings.' },
  { icon: Lock, title: 'Security', description: 'Enterprise-grade security protocols to protect your data and users.' },
  { icon: Layers, title: 'Clean Architecture', description: 'Maintainable, well-structured code that reduces technical debt.' },
]

const whyChooseUs = [
  { icon: Users, title: 'Client-Focused Approach', description: 'We align every decision with your business goals and user needs.' },
  { icon: MessageSquare, title: 'Transparent Communication', description: 'Regular updates, clear timelines, and no hidden surprises.' },
  { icon: Clock, title: 'Timely Delivery', description: 'We respect deadlines and deliver quality work on schedule.' },
  { icon: TrendingUp, title: 'Scalable Solutions', description: 'Built to evolve as your business grows and market demands shift.' },
]

const processSteps = [
  { number: '01', title: 'Discovery', description: 'We dive deep into your business, users, and goals to understand the real problem before proposing solutions.' },
  { number: '02', title: 'Design', description: 'We craft intuitive, visually striking interfaces that align with your brand and drive user engagement.' },
  { number: '03', title: 'Development', description: 'We build with clean, scalable code using modern technologies and best practices.' },
  { number: '04', title: 'Deployment', description: 'We launch with confidence, ensuring performance, security, and seamless integration.' },
]

const portfolioProjects = [
  {
    title: 'NexCart E-Commerce',
    description: 'A high-conversion e-commerce platform with real-time inventory, AI-powered recommendations, and seamless checkout.',
    tags: ['React', 'Node.js', 'PostgreSQL', 'Redis'],
    imageColor: 'bg-gradient-to-br from-blue-900/40 to-purple-900/40',
  },
  {
    title: 'DataPulse Dashboard',
    description: 'Enterprise SaaS analytics dashboard processing millions of data points with real-time visualization.',
    tags: ['Next.js', 'Python', 'AWS', 'D3.js'],
    imageColor: 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40',
  },
  {
    title: 'FitTrack Mobile',
    description: 'Cross-platform fitness app with workout tracking, nutrition logging, and social features.',
    tags: ['React Native', 'Firebase', 'TensorFlow'],
    imageColor: 'bg-gradient-to-br from-orange-900/40 to-red-900/40',
  },
]

const testimonials = [
  {
    quote: 'Manchester Technology transformed our outdated platform into a high-performance system that increased our conversion rate by 340%. Their technical expertise and attention to detail are unmatched.',
    author: 'Rajesh Kumar',
    role: 'CTO',
    company: 'TechVentures India',
  },
  {
    quote: 'The team delivered our mobile app ahead of schedule with zero bugs at launch. Their process is transparent, their communication is excellent, and the results speak for themselves.',
    author: 'Priya Sharma',
    role: 'Founder',
    company: 'HealthFirst App',
  },
  {
    quote: 'We needed a custom CRM that could handle our complex workflows. Manchester Technology built exactly what we needed, and it has become the backbone of our operations.',
    author: 'Arun Patel',
    role: 'Operations Director',
    company: 'LogiChain Solutions',
  },
]

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 md:pt-24">
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background z-[1]" />

        <div className="relative z-10 section-padding max-w-7xl mx-auto text-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-8">
              Innovate. Develop. Dominate.
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="heading-xl max-w-5xl mx-auto mb-6 leading-tight"
          >
            We Build{' '}
            <span className="text-gradient">High Performance</span>{' '}
            Digital Products That Drive Real Business Growth
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="body-lg max-w-2xl mx-auto mb-10"
          >
            Web platforms, mobile applications, and custom software engineered for speed,
            scalability, and measurable impact. No fluff. Just results.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/contact">
              <button className="glow-button flex items-center gap-2">
                Start Your Project
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <a
              href="https://wa.me/919036351517"
              target="_blank"
              rel="noopener noreferrer"
              className="glow-button-outline flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-20 flex items-center justify-center gap-8 text-text-muted text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Available for projects
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <div className="hidden sm:block">50+ Projects Delivered</div>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <div className="hidden sm:block">98% Client Satisfaction</div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent text-sm font-medium tracking-wider uppercase">What We Do</span>
          <h2 className="heading-lg mt-3 mb-4">Services Built for Impact</h2>
          <p className="body-lg max-w-2xl mx-auto">
            Every service is designed with one goal: to deliver measurable business outcomes.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <ServiceCard key={service.title} {...service} index={index} />
          ))}
        </div>
      </section>

      {/* Built for Performance Section */}
      <section className="section-padding py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <span className="text-accent text-sm font-medium tracking-wider uppercase">Engineering Excellence</span>
              <h2 className="heading-lg mt-3 mb-6">Built for Performance</h2>
              <p className="body-lg mb-8">
                We do not compromise on quality. Every line of code, every design decision,
                and every architecture choice is made with performance in mind.
              </p>
              <Link to="/services">
                <button className="glow-button-outline text-sm flex items-center gap-2">
                  Explore Our Process
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
            </AnimatedSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {performanceFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="glass-card p-6"
                >
                  <feature.icon className="w-8 h-8 text-accent mb-4" />
                  <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="body-md text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent text-sm font-medium tracking-wider uppercase">The Difference</span>
          <h2 className="heading-lg mt-3 mb-4">Why Teams Choose Us</h2>
          <p className="body-lg max-w-2xl mx-auto">
            We are not just developers. We are strategic partners invested in your success.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChooseUs.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <item.icon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{item.title}</h3>
              <p className="body-md text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Process Section */}
      <section className="section-padding py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <AnimatedSection>
              <span className="text-accent text-sm font-medium tracking-wider uppercase">How We Work</span>
              <h2 className="heading-lg mt-3 mb-6">Our Process</h2>
              <p className="body-lg mb-8">
                A battle-tested methodology that ensures every project is delivered on time,
                on budget, and above expectations.
              </p>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/5 border border-accent/10 relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-sm">Average Delivery Time</p>
                  <p className="text-accent text-2xl font-bold">4-8 Weeks</p>
                </div>
              </div>
            </AnimatedSection>

            <div>
              {processSteps.map((step, index) => (
                <ProcessStep key={step.number} {...step} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <span className="text-accent text-sm font-medium tracking-wider uppercase">Our Work</span>
          <h2 className="heading-lg mt-3 mb-4">Selected Projects</h2>
          <p className="body-lg max-w-2xl mx-auto">
            Real results for real businesses. Every project is a testament to our commitment to excellence.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {portfolioProjects.map((project, index) => (
            <PortfolioCard key={project.title} {...project} index={index} />
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding py-24 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <span className="text-accent text-sm font-medium tracking-wider uppercase">Testimonials</span>
            <h2 className="heading-lg mt-3 mb-4">What Clients Say</h2>
            <p className="body-lg max-w-2xl mx-auto">
              Do not just take our word for it. Here is what the people we have worked with have to say.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.author} {...testimonial} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding py-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-12 md:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <h2 className="heading-lg mb-4">Have an Idea? Let&apos;s Build It.</h2>
            <p className="body-lg max-w-xl mx-auto mb-8">
              Whether you are starting from scratch or scaling an existing product,
              we have the expertise to make it happen.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/contact">
                <button className="glow-button flex items-center gap-2">
                  Start Your Project
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a
                href="https://wa.me/919036351517"
                target="_blank"
                rel="noopener noreferrer"
                className="glow-button-outline flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}