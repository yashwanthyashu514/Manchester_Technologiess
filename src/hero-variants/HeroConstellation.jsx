import { useEffect, useRef } from 'react'

/* HeroConstellation — twinkling stars with connecting lines and mouse attraction */
export default function HeroConstellation() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: null, y: null })
  const scrollRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationId
    let stars = []
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

    /* Track mouse position for attraction effect */
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

    class Star {
      constructor() {
        this.x = Math.random() * window.innerWidth
        this.y = Math.random() * window.innerHeight
        this.size = Math.random() * 1.5 + 0.5
        this.baseOpacity = Math.random() * 0.6 + 0.2
        this.opacity = this.baseOpacity
        this.twinkleSpeed = Math.random() * 0.03 + 0.01
        this.twinkleOffset = Math.random() * Math.PI * 2
        this.vx = (Math.random() - 0.5) * 0.15
        this.vy = (Math.random() - 0.5) * 0.15
      }

      update() {
        time += 0.016
        this.x += this.vx
        this.y += this.vy

        // Twinkle effect
        this.opacity = this.baseOpacity + Math.sin(time * 60 * this.twinkleSpeed + this.twinkleOffset) * 0.2

        // Mouse attraction — stars drift toward cursor
        const mouse = mouseRef.current
        if (mouse.x !== null) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 200) {
            const force = (200 - dist) / 200
            this.x += dx * force * 0.02
            this.y += dy * force * 0.02
          }
        }

        // Wrap around edges
        if (this.x < 0) this.x = window.innerWidth
        if (this.x > window.innerWidth) this.x = 0
        if (this.y < 0) this.y = window.innerHeight
        if (this.y > window.innerHeight) this.y = 0
      }

      draw() {
        const scrollFade = Math.max(0, 1 - scrollRef.current * 1.5)
        const finalOpacity = this.opacity * scrollFade
        if (finalOpacity <= 0) return

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 169, 106, ${finalOpacity})`
        ctx.fill()

        // Glow halo around each star
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 169, 106, ${finalOpacity * 0.1})`
        ctx.fill()
      }
    }

    /* Initialize stars based on viewport area */
    const init = () => {
      stars = []
      const count = Math.min(100, Math.floor((window.innerWidth * window.innerHeight) / 12000))
      for (let i = 0; i < count; i++) {
        stars.push(new Star())
      }
    }

    /* Main animation loop */
    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      const scrollFade = Math.max(0, 1 - scrollRef.current * 1.5)

      // Background gradient glow
      if (scrollFade > 0) {
        const gradient = ctx.createRadialGradient(
          window.innerWidth / 2, window.innerHeight / 2, 0,
          window.innerWidth / 2, window.innerHeight / 2, window.innerWidth * 0.7
        )
        gradient.addColorStop(0, `rgba(200, 169, 106, ${0.02 * scrollFade})`)
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
      }

      // Update all stars
      stars.forEach(star => star.update())

      // Draw constellation connections between nearby stars
      if (scrollFade > 0.3) {
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[j].x - stars[i].x
            const dy = stars[j].y - stars[i].y
            const distSq = dx * dx + dy * dy
            if (distSq < 22500) {
              const dist = Math.sqrt(distSq)
              ctx.beginPath()
              ctx.strokeStyle = `rgba(200, 169, 106, ${0.08 * (1 - dist / 150) * scrollFade})`
              ctx.lineWidth = 0.6
              ctx.moveTo(stars[i].x, stars[i].y)
              ctx.lineTo(stars[j].x, stars[j].y)
              ctx.stroke()
            }
          }
        }
      }

      // Draw stars on top of connections
      stars.forEach(star => star.draw())

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
