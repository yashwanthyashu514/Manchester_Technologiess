import { useEffect, useRef } from 'react'

export default function CursorGlow() {
  const glowRef = useRef(null)
  const posRef = useRef({ x: -300, y: -300 })
  const targetRef = useRef({ x: -300, y: -300 })
  const rafRef = useRef(null)

  useEffect(() => {
    const glow = glowRef.current
    if (!glow) return

    // Check for touch device or small screen
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouch || window.innerWidth < 1024) {
      glow.style.display = 'none'
      return
    }

    const handleMouseMove = (e) => {
      targetRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseLeave = () => {
      targetRef.current = { x: -300, y: -300 }
    }

    const animate = () => {
      const pos = posRef.current
      const target = targetRef.current

      // Smooth follow with very small lerp for fluidity but NO perceptible lag
      pos.x += (target.x - pos.x) * 0.15
      pos.y += (target.y - pos.y) * 0.15

      glow.style.transform = `translate(${pos.x - 150}px, ${pos.y - 150}px)`
      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 z-50 will-change-transform"
      style={{
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200, 169, 106, 0.12) 0%, rgba(200, 169, 106, 0.06) 35%, transparent 70%)',
        transform: 'translate(-300px, -300px)',
      }}
    />
  )
}
