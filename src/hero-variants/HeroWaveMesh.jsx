import { useEffect, useRef } from 'react'

/* HeroWaveMesh — animated grid mesh with wave distortion and mouse repulsion */
export default function HeroWaveMesh() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: null, y: null })
  const scrollRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationId
    let time = 0
    let points = []
    const GRID_SPACING = 60

    /* Handle canvas resize and reinitialize grid points */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      initPoints()
    }

    /* Create grid points across the viewport */
    const initPoints = () => {
      points = []
      const cols = Math.ceil(window.innerWidth / GRID_SPACING) + 2
      const rows = Math.ceil(window.innerHeight / GRID_SPACING) + 2
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          points.push({
            baseX: i * GRID_SPACING,
            baseY: j * GRID_SPACING,
            x: i * GRID_SPACING,
            y: j * GRID_SPACING,
            i,
            j,
          })
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)

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

    /* Main animation loop */
    const animate = () => {
      time += 0.016
      const scrollFade = Math.max(0, 1 - scrollRef.current * 1.2)

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      // Skip rendering when fully scrolled past
      if (scrollFade <= 0) {
        animationId = requestAnimationFrame(animate)
        return
      }

      const mouse = mouseRef.current

      // Update point positions with wave distortion + mouse repulsion
      points.forEach(p => {
        const waveX = Math.sin(p.baseY * 0.01 + time * 1.5) * 8
        const waveY = Math.cos(p.baseX * 0.01 + time * 1.2) * 8

        p.x = p.baseX + waveX
        p.y = p.baseY + waveY

        // Mouse repulsion — points push away from cursor
        if (mouse.x !== null) {
          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            const force = (150 - dist) / 150
            p.x += dx * force * 0.3
            p.y += dy * force * 0.3
          }
        }
      })

      // Draw mesh connections between adjacent grid points
      ctx.strokeStyle = `rgba(200, 169, 106, ${0.12 * scrollFade})`
      ctx.lineWidth = 0.8

      points.forEach(p => {
        // Connect to right neighbor
        const right = points.find(np => np.i === p.i + 1 && np.j === p.j)
        if (right) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(right.x, right.y)
          ctx.stroke()
        }
        // Connect to bottom neighbor
        const bottom = points.find(np => np.i === p.i && np.j === p.j + 1)
        if (bottom) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(bottom.x, bottom.y)
          ctx.stroke()
        }
      })

      // Draw dots at grid intersections — brighter near center
      points.forEach(p => {
        const distFromCenter = Math.sqrt(
          Math.pow(p.x - window.innerWidth / 2, 2) +
          Math.pow(p.y - window.innerHeight / 2, 2)
        )
        const centerFade = Math.max(0, 1 - distFromCenter / (window.innerWidth * 0.5))
        const dotOpacity = 0.3 * centerFade * scrollFade

        if (dotOpacity > 0.02) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200, 169, 106, ${dotOpacity})`
          ctx.fill()
        }
      })

      animationId = requestAnimationFrame(animate)
    }

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
