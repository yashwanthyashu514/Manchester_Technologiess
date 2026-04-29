import { useEffect, useRef } from 'react'

/* HeroGoldenRain — falling golden streaks like a meteor shower with ambient particles */
export default function HeroGoldenRain() {
  const canvasRef = useRef(null)
  const scrollRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationId
    let streaks = []
    let particles = []

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

    const handleScroll = () => {
      scrollRef.current = window.scrollY / window.innerHeight
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    /* Streak — a single golden rain streak */
    class Streak {
      constructor() {
        this.reset()
        this.y = Math.random() * window.innerHeight // Start scattered
      }

      reset() {
        this.x = Math.random() * window.innerWidth
        this.y = -100
        this.length = Math.random() * 100 + 50
        this.speed = Math.random() * 3 + 2
        this.width = Math.random() * 2.5 + 1.5
        this.opacity = Math.random() * 0.5 + 0.15
        // Slant ~35° from vertical — streaks travel in a straight diagonal (top-left → bottom-right)
        this.slantAngle = 0.6 + (Math.random() - 0.5) * 0.15
        // dx and dy components so the streak moves exactly along its slant (left direction)
        this.dx = -Math.sin(this.slantAngle)
        this.dy = Math.cos(this.slantAngle)
      }

      update() {
        const scrollP = scrollRef.current
        const speedMult = Math.max(0.2, 1 - scrollP * 2)

        // Move exactly along the slant direction — pure straight diagonal
        this.x += this.dx * this.speed * speedMult
        this.y += this.dy * this.speed * speedMult

        // Reset when streak exits viewport
        if (this.y > window.innerHeight + this.length || this.x > window.innerWidth + 100) {
          this.reset()
        }
      }

      draw() {
        const scrollFade = Math.max(0, 1 - scrollRef.current * 1.5)
        if (scrollFade <= 0) return

        // Trail extends behind the streak (opposite to movement direction)
        const tailX = this.x - this.dx * this.length
        const tailY = this.y - this.dy * this.length

        const gradient = ctx.createLinearGradient(
          this.x, this.y,
          tailX, tailY
        )
        // Head is bright, tail fades to transparent
        gradient.addColorStop(0, `rgba(180, 145, 70, ${this.opacity * scrollFade})`)
        gradient.addColorStop(0.4, `rgba(200, 165, 90, ${this.opacity * 0.75 * scrollFade})`)
        gradient.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.strokeStyle = gradient
        ctx.lineWidth = this.width
        ctx.lineCap = 'round'
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()
      }
    }

    /* FloatingParticle — ambient floating dots */
    class FloatingParticle {
      constructor() {
        this.x = Math.random() * window.innerWidth
        this.y = Math.random() * window.innerHeight
        this.size = Math.random() * 2 + 0.5
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.opacity = Math.random() * 0.3 + 0.1
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        if (this.x < 0) this.x = window.innerWidth
        if (this.x > window.innerWidth) this.x = 0
        if (this.y < 0) this.y = window.innerHeight
        if (this.y > window.innerHeight) this.y = 0
      }

      draw() {
        const scrollFade = Math.max(0, 1 - scrollRef.current * 1.5)
        if (scrollFade <= 0) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 169, 106, ${this.opacity * scrollFade})`
        ctx.fill()
      }
    }

    /* Initialize streaks and floating particles */
    const init = () => {
      streaks = []
      const streakCount = Math.min(40, Math.floor(window.innerWidth / 40))
      for (let i = 0; i < streakCount; i++) {
        streaks.push(new Streak())
      }

      particles = []
      const particleCount = Math.min(50, Math.floor(window.innerWidth / 30))
      for (let i = 0; i < particleCount; i++) {
        particles.push(new FloatingParticle())
      }
    }

    /* Main animation loop */
    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const scrollFade = Math.max(0, 1 - scrollRef.current * 1.5)

      // Background ambient glow
      if (scrollFade > 0) {
        const gradient = ctx.createRadialGradient(
          window.innerWidth / 2, window.innerHeight * 0.3, 0,
          window.innerWidth / 2, window.innerHeight * 0.3, window.innerWidth * 0.6
        )
        gradient.addColorStop(0, `rgba(200, 169, 106, ${0.025 * scrollFade})`)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      }

      // Draw floating particles
      particles.forEach(p => {
        p.update()
        p.draw()
      })

      // Draw streaks
      streaks.forEach(s => {
        s.update()
        s.draw()
      })

      animationId = requestAnimationFrame(animate)
    }

    init()
    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
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
