# Manchester Technology

A premium, multi-page, high-conversion website for Manchester Technology — built with React, Tailwind CSS, and Framer Motion.

## Features

- **4 Pages**: Home, About, Services, Contact
- **Dark Premium UI**: Metallic brand style with gold accent (#C8A96A)
- **Smooth Animations**: Scroll-triggered fade-ins, hover effects, page transitions
- **Interactive Hero**: Canvas-based particle system that reacts to cursor movement
- **Cursor Glow**: Subtle gold glow follows the mouse on desktop
- **Glowing Buttons**: Animated CTA buttons with shimmer and glow effects
- **Fully Responsive**: Mobile-first design, optimized for all devices
- **SEO Optimized**: Meta tags, semantic HTML, proper heading hierarchy
- **Form Validation**: Contact form with real-time validation and success states
- **Performance**: Lazy loading ready, optimized build configuration

## Tech Stack

- React 18
- React Router 6
- Tailwind CSS 3
- Framer Motion
- Lucide React (icons)
- Vite (build tool)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  components/
    AnimatedSection.jsx    # Scroll-triggered animation wrapper
    CursorGlow.jsx         # Mouse-following glow effect
    Footer.jsx             # Site footer
    HeroBackground.jsx     # Interactive particle canvas
    Navbar.jsx             # Responsive navigation
    PortfolioCard.jsx      # Portfolio project card
    ProcessStep.jsx        # Process timeline step
    ServiceCard.jsx        # Service feature card
    TestimonialCard.jsx    # Client testimonial card
  pages/
    About.jsx              # About page
    Contact.jsx            # Contact page with form
    Home.jsx               # Landing page (all sections)
    Services.jsx           # Services detail page
  App.jsx                  # Main app with routing
  main.jsx                 # Entry point
  index.css                # Global styles & Tailwind
```

## Design System

- **Background**: #0D0D0D
- **Secondary**: #1A1A1A
- **Accent (Gold)**: #C8A96A
- **Text Primary**: #FFFFFF
- **Text Secondary**: #A0A0A0
- **Heading Font**: Poppins
- **Body Font**: Inter

## License

Proprietary - Manchester Technology
