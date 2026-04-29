import { useEffect, useRef } from 'react'

/* HeroLandingParticles — particles fall from top and disperse outward on scroll */
export default function HeroLandingParticles() {
    const canvasRef = useRef(null)
    const scrollProgressRef = useRef(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d', { alpha: true })
        let animationId
        let particles = []
        let frameCount = 0

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

        /* Track scroll progress for disperse animation */
        const handleScroll = () => {
            const maxScroll = window.innerHeight
            scrollProgressRef.current = Math.min(window.scrollY / maxScroll, 1)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })

        class Particle {
            constructor() {
                this.reset()
                this.y = Math.random() * window.innerHeight // Start scattered
            }

            reset() {
                this.x = Math.random() * window.innerWidth
                this.y = -20
                this.size = Math.random() * 2.5 + 0.8
                this.speedY = Math.random() * 1.5 + 0.5
                this.speedX = (Math.random() - 0.5) * 0.3
                this.opacity = Math.random() * 0.5 + 0.2
                this.wobble = Math.random() * Math.PI * 2
                this.wobbleSpeed = Math.random() * 0.02 + 0.01
                this.disperseAngle = Math.random() * Math.PI * 2
                this.disperseSpeed = Math.random() * 3 + 2
            }

            update() {
                const scrollP = scrollProgressRef.current

                if (scrollP < 0.1) {
                    // Landing phase: fall from top
                    this.y += this.speedY
                    this.wobble += this.wobbleSpeed
                    this.x += Math.sin(this.wobble) * 0.5 + this.speedX

                    if (this.y > window.innerHeight + 20) {
                        this.reset()
                    }
                } else {
                    // Disperse phase: explode outward based on scroll
                    const disperseFactor = (scrollP - 0.1) / 0.9
                    this.x += Math.cos(this.disperseAngle) * this.disperseSpeed * disperseFactor
                    this.y += Math.sin(this.disperseAngle) * this.disperseSpeed * disperseFactor
                    this.opacity = Math.max(0, this.opacity - disperseFactor * 0.02)

                    if (this.opacity <= 0 || this.x < -100 || this.x > window.innerWidth + 100 || this.y < -100 || this.y > window.innerHeight + 100) {
                        this.reset()
                        this.opacity = 0 // Keep invisible until scroll resets
                    }
                }
            }

            draw() {
                if (this.opacity <= 0) return
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(200, 169, 106, ${this.opacity})`
                ctx.fill()
            }
        }

        /* Initialize particles based on viewport size */
        const init = () => {
            particles = []
            const count = Math.min(80, Math.floor((window.innerWidth * window.innerHeight) / 18000))
            for (let i = 0; i < count; i++) {
                particles.push(new Particle())
            }
        }

        /* Main animation loop */
        const animate = () => {
            frameCount++
            const scrollP = scrollProgressRef.current
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

            // Radial glow center that fades on scroll
            const centerGlowOpacity = Math.max(0, 0.04 - scrollP * 0.04)
            if (centerGlowOpacity > 0 && frameCount % 2 === 0) {
                const gradient = ctx.createRadialGradient(
                    window.innerWidth / 2, window.innerHeight / 2, 0,
                    window.innerWidth / 2, window.innerHeight / 2, window.innerWidth * 0.6
                )
                gradient.addColorStop(0, `rgba(200, 169, 106, ${centerGlowOpacity})`)
                gradient.addColorStop(0.5, `rgba(200, 169, 106, ${centerGlowOpacity * 0.3})`)
                gradient.addColorStop(1, 'transparent')
                ctx.fillStyle = gradient
                ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
            }

            // Draw particles with connections (only when not dispersing too much)
            for (let i = 0; i < particles.length; i++) {
                particles[i].update()
                particles[i].draw()

                if (scrollP < 0.3) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dx = particles[j].x - particles[i].x
                        const dy = particles[j].y - particles[i].y
                        const distSq = dx * dx + dy * dy
                        if (distSq < 20000) {
                            const dist = Math.sqrt(distSq)
                            ctx.beginPath()
                            ctx.strokeStyle = `rgba(200, 169, 106, ${0.06 * (1 - dist / 150) * (1 - scrollP)})`
                            ctx.lineWidth = 0.5
                            ctx.moveTo(particles[i].x, particles[i].y)
                            ctx.lineTo(particles[j].x, particles[j].y)
                            ctx.stroke()
                        }
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
