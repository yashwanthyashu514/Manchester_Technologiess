import { useEffect, useRef } from 'react'

/* HeroFloatingOrbs — soft glowing orbs that float and pulse with mouse interaction */
export default function HeroFloatingOrbs() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: null, y: null })
  const scrollRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationId
    let orbs = []
    let time = 0

    /* Handle canvas resize with DPR scaling */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
    }

    resize()
    window.addEventListener('resize', resize)

    /* Track mouse for orb interaction */
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null }
    }
    const handleScroll = () => {
      scrollRef.current = window.scrollY / window.innerHeight
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })

    /* Orb — a single floating, glowing sphere */
    class Orb {
      constructor() {
        this.x = Math.random() * window.innerWidth
        this.y = Math.random() * window.innerHeight
        this.radius = Math.random() * 60 + 30
        this.baseOpacity = Math.random() * 0.15 + 0.05
        this.vx = (Math.random() - 0.5) * 0.4
        this.vy = (Math.random() - 0.5) * 0.4
        this.pulseSpeed = Math.random() * 0.02 + 0.005
        this.pulseOffset = Math.random() * Math.PI * 2
        // Warm golden hue variations
        this.hue = 35 + Math.random() * 15 // 35-50 range (golden tones)
        this.saturation = 50 + Math.random() * 30
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        // Mouse avoidance — orbs gently push away from cursor
        const mouse = mouseRef.current
        if (mouse.x !== null) {
          const dx = this.x - mouse.x
          const dy = this.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 200) {
            const force = (200 - dist) / 200
            this.vx += dx * force * 0.003
            this.vy += dy * force * 0.003
          }
        }

        // Dampen velocity to prevent runaway speeds
        this.vx *= 0.995
        this.vy *= 0.995

        // Soft boundary wrapping
        if (this.x < -this.radius) this.x = window.innerWidth + this.radius
        if (this.x > window.innerWidth + this.radius) this.x = -this.radius
        if (this.y < -this.radius) this.y = window.innerHeight + this.radius
        if (this.y > window.innerHeight + this.radius) this.y = -this.radius
      }

      draw() {
        const scrollFade = Math.max(0, 1 - scrollRef.current * 1.5)
        if (scrollFade <= 0) return

        // Pulsing opacity
        const pulse = Math.sin(time * this.pulseSpeed * 60 + this.pulseOffset) * 0.5 + 0.5
        const opacity = this.baseOpacity * (0.6 + pulse * 0.4) * scrollFade

        // Draw soft radial gradient orb
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.radius
        )
        gradient.addColorStop(0, `hsla(${this.hue}, ${this.saturation}%, 55%, ${opacity})`)
        gradient.addColorStop(0.4, `hsla(${this.hue}, ${this.saturation}%, 45%, ${opacity * 0.5})`)
        gradient.addColorStop(1, `hsla(${this.hue}, ${this.saturation}%, 35%, 0)`)

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      }
    }

    /* Initialize orbs scaled to viewport */
    const init = () => {
      orbs = []
      const count = Math.min(15, Math.floor((window.innerWidth * window.innerHeight) / 80000))
      for (let i = 0; i < Math.max(6, count); i++) {
        orbs.push(new Orb())
      }
    }

    /* Main animation loop */
    const animate = () => {
      time += 0.016
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const scrollFade = Math.max(0, 1 - scrollRef.current * 1.5)

      // Subtle ambient center glow
      if (scrollFade > 0) {
        const gradient = ctx.createRadialGradient(
          window.innerWidth / 2, window.innerHeight / 2, 0,
          window.innerWidth / 2, window.innerHeight / 2, window.innerWidth * 0.5
        )
        gradient.addColorStop(0, `rgba(200, 169, 106, ${0.03 * scrollFade})`)
        gradient.addColorStop(0.5, `rgba(200, 169, 106, ${0.01 * scrollFade})`)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      }

      // Update and draw each orb
      orbs.forEach(orb => {
        orb.update()
        orb.draw()
      })

      animationId = requestAnimationFrame(animate)
    }

    init()
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  )
}
