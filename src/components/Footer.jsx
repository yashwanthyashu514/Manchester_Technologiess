import { Link } from 'react-router-dom'
import { Zap, Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react'

const footerLinks = {
  company: [
    { label: 'About', path: '/about' },
    { label: 'Services', path: '/services' },
    { label: 'Contact', path: '/contact' },
  ],
  services: [
    { label: 'Web Development', path: '/services' },
    { label: 'Mobile Apps', path: '/services' },
    { label: 'Custom Software', path: '/services' },
    { label: 'UI/UX Design', path: '/services' },
  ],
  legal: [
    { label: 'Privacy Policy', path: '#' },
    { label: 'Terms of Service', path: '#' },
  ],
}

export default function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-white/5">
      <div className="section-padding max-w-7xl mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <img src="/logo.jpeg" alt="Manchester Technology Logo" className="h-10 w-auto rounded-lg object-contain" />
              <span className="font-heading font-bold text-xl">
                Manchester<span className="text-accent">Tech</span>
              </span>
            </Link>
            <p className="body-md mb-6">
              Building high-performance digital products that drive real business growth.
            </p>
            <div className="flex flex-col gap-3">
              <a href="mailto:manchestertechnologiess@gmail.com" className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors text-sm">
                <Mail className="w-4 h-4" />
                manchestertechnologiess@gmail.com
              </a>
              <a href="tel:+919036351517" className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors text-sm">
                <Phone className="w-4 h-4" />
                +91 90363 51517
              </a>
              <div className="flex items-center gap-2 text-text-secondary text-sm">
                <MapPin className="w-4 h-4" />
                Davanagere, Karnataka, India
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">Company</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-text-secondary hover:text-accent transition-colors text-sm flex items-center gap-1 group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">Services</h4>
            <ul className="flex flex-col gap-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-text-secondary hover:text-accent transition-colors text-sm flex items-center gap-1 group">
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-lg mb-6">Connect</h4>
            <div className="flex flex-col gap-4">
              <a
                href="https://wa.me/919036351517"
                target="_blank"
                rel="noopener noreferrer"
                className="glow-button-outline text-sm text-center"
              >
                Chat on WhatsApp
              </a>
              <Link to="/contact">
                <button className="glow-button w-full text-sm">Start Your Project</button>
              </Link>
            </div>
            <div className="mt-6 flex gap-4">
              {['LinkedIn', 'Twitter', 'GitHub'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-text-secondary hover:text-accent hover:bg-accent/10 transition-all duration-300"
                  aria-label={social}
                >
                  <span className="text-xs font-medium">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            &copy; {new Date().getFullYear()} Manchester Technology. All rights reserved.
          </p>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <a key={link.label} href={link.path} className="text-text-muted hover:text-text-secondary text-sm transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
