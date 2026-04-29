import { useEffect, useRef } from 'react'

export default function HeroBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    let animationId
    let particles = []
    let mouse = { x: null, y: null }
    let frameCount = 0

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

    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    class Particle {
      constructor() {
        this.x = Math.random() * window.innerWidth
        this.y = Math.random() * window.innerHeight
        this.size = Math.random() * 1.5 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.4
        this.speedY = (Math.random() - 0.5) * 0.4
        this.opacity = Math.random() * 0.4 + 0.1
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (mouse.x != null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < 180) {
            const force = (180 - distance) / 180
            this.x -= dx * force * 0.015
            this.y -= dy * force * 0.015
          }
        }

        if (this.x < 0) this.x = window.innerWidth
        if (this.x > window.innerWidth) this.x = 0
        if (this.y < 0) this.y = window.innerHeight
        if (this.y > window.innerHeight) this.y = 0
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 169, 106, ${this.opacity})`
        ctx.fill()
      }
    }

    const init = () => {
      particles = []
      const area = window.innerWidth * window.innerHeight
      const particleCount = Math.min(60, Math.floor(area / 25000))
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    const animate = () => {
      frameCount++
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // Gradient background - only draw every 2nd frame for perf
      if (frameCount % 2 === 0) {
        const gradient = ctx.createRadialGradient(
          window.innerWidth / 2, window.innerHeight / 2, 0,
          window.innerWidth / 2, window.innerHeight / 2, window.innerWidth * 0.8
        )
        gradient.addColorStop(0, 'rgba(200, 169, 106, 0.035)')
        gradient.addColorStop(0.5, 'rgba(200, 169, 106, 0.01)')
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      }

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update()
        particles[i].draw()
      }

      // Draw connections - only check subset for performance
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[j].x - particles[i].x
          const dy = particles[j].y - particles[i].y
          const distance = dx * dx + dy * dy // skip sqrt for comparison

          if (distance < 22500) { // 150^2
            const actualDist = Math.sqrt(distance)
            ctx.beginPath()
            ctx.strokeStyle = `rgba(200, 169, 106, ${0.08 * (1 - actualDist / 150)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(animate)
    }

    init()
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
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
