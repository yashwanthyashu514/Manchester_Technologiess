import { useEffect, useRef } from 'react'

/* HeroDataNetwork — "InterConnect" style: flowing data packets between dynamic nodes */
export default function HeroDataNetwork() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: null, y: null })
  const scrollRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    let animationId
    let nodes = []
    let links = []
    let packets = []

    /* Handle canvas resize with DPR scaling */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      initNetwork()
    }

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null }
    }
    const handleScroll = () => {
      scrollRef.current = window.scrollY / window.innerHeight
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })

    class Node {
      constructor(id) {
        this.id = id
        this.x = Math.random() * window.innerWidth
        this.y = Math.random() * window.innerHeight
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.radius = Math.random() * 1.5 + 1
      }
      update() {
        this.x += this.vx
        this.y += this.vy

        // Bounce off walls
        if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1
        if (this.y < 0 || this.y > window.innerHeight) this.vy *= -1
        
        // Mouse interaction: push nodes gently
        if (mouseRef.current.x) {
            const dx = this.x - mouseRef.current.x
            const dy = this.y - mouseRef.current.y
            const dist = Math.sqrt(dx*dx + dy*dy)
            if (dist < 150) {
                const force = (150 - dist) / 150
                this.x += dx * force * 0.02
                this.y += dy * force * 0.02
            }
        }
      }
      draw(scrollFade) {
          if(scrollFade <= 0) return;
          
          ctx.beginPath()
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200, 169, 106, ${0.6 * scrollFade})`
          ctx.fill()
          
          // Subtle glow
          ctx.beginPath()
          ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200, 169, 106, ${0.1 * scrollFade})`
          ctx.fill()
      }
    }

    class Link {
        constructor(nodeA, nodeB) {
            this.nodeA = nodeA
            this.nodeB = nodeB
        }
        draw(scrollFade) {
            if(scrollFade <= 0) return;
            const dx = this.nodeA.x - this.nodeB.x
            const dy = this.nodeA.y - this.nodeB.y
            const dist = Math.sqrt(dx*dx + dy*dy)
            
            // Only draw link if nodes are close enough
            if (dist < 200) {
                ctx.beginPath()
                ctx.moveTo(this.nodeA.x, this.nodeA.y)
                ctx.lineTo(this.nodeB.x, this.nodeB.y)
                // Opacity fades as nodes get further apart
                const opacity = (1 - dist / 200) * 0.15 * scrollFade
                ctx.strokeStyle = `rgba(200, 169, 106, ${opacity})`
                ctx.lineWidth = 1
                ctx.stroke()
            }
        }
    }

    class Packet {
        constructor(link) {
            this.link = link
            this.progress = 0
            // Packets move at different speeds
            this.speed = Math.random() * 0.015 + 0.008
            // Determine direction along the link (A to B, or B to A)
            this.direction = Math.random() > 0.5 ? 1 : -1
            if (this.direction === -1) this.progress = 1
            this.size = Math.random() * 1.5 + 1.5
        }
        update() {
            this.progress += this.speed * this.direction
            if (this.progress > 1 || this.progress < 0) {
                return false // finished traveling
            }
            return true
        }
        draw(scrollFade) {
            if(scrollFade <= 0) return;
            const dx = this.link.nodeA.x - this.link.nodeB.x
            const dy = this.link.nodeA.y - this.link.nodeB.y
            const dist = Math.sqrt(dx*dx + dy*dy)
            
            // If the underlying link is broken (nodes too far), destroy the packet visually
            if (dist > 200) return 

            const x = this.link.nodeA.x + (this.link.nodeB.x - this.link.nodeA.x) * this.progress
            const y = this.link.nodeA.y + (this.link.nodeB.y - this.link.nodeA.y) * this.progress

            // Draw bright packet
            ctx.beginPath()
            ctx.arc(x, y, this.size, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * scrollFade})` // Bright white/gold
            ctx.fill()

            // Packet glow
            ctx.beginPath()
            ctx.arc(x, y, this.size * 3, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(200, 169, 106, ${0.5 * scrollFade})`
            ctx.fill()
            
            // Motion trail
            ctx.beginPath()
            ctx.moveTo(x, y)
            // Tail points backwards
            const tailX = x - (this.link.nodeB.x - this.link.nodeA.x) * this.direction * 0.08
            const tailY = y - (this.link.nodeB.y - this.link.nodeA.y) * this.direction * 0.08
            ctx.lineTo(tailX, tailY)
            ctx.strokeStyle = `rgba(200, 169, 106, ${0.8 * scrollFade})`
            ctx.lineWidth = this.size * 0.8
            ctx.lineCap = 'round'
            ctx.stroke()
        }
    }

    const initNetwork = () => {
        nodes = []
        links = []
        packets = []
        // Number of nodes scales with screen size
        const numNodes = Math.min(110, Math.floor((window.innerWidth * window.innerHeight) / 9000))
        for (let i=0; i<numNodes; i++) nodes.push(new Node(i))
        
        // Pre-calculate permanent random links
        // We only draw them when distance is < 200 to give a dynamic feel
        for (let i=0; i<nodes.length; i++) {
            for (let j=i+1; j<nodes.length; j++) {
                if (Math.random() > 0.82) {
                    links.push(new Link(nodes[i], nodes[j]))
                }
            }
        }
    }

    const animate = () => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        const scrollFade = Math.max(0, 1 - scrollRef.current * 1.5)

        // Background subtle ambient glow
        if (scrollFade > 0) {
            const gradient = ctx.createRadialGradient(
                window.innerWidth / 2, window.innerHeight / 2, 0,
                window.innerWidth / 2, window.innerHeight / 2, window.innerWidth * 0.7
            )
            gradient.addColorStop(0, `rgba(200, 169, 106, ${0.03 * scrollFade})`)
            gradient.addColorStop(1, 'transparent')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)
        }

        // Spawm new data packets randomly
        if (Math.random() < 0.25 && links.length > 0) {
            const randomLink = links[Math.floor(Math.random() * links.length)]
            packets.push(new Packet(randomLink))
        }

        // Update & Draw
        nodes.forEach(n => n.update())
        links.forEach(l => l.draw(scrollFade))
        nodes.forEach(n => n.draw(scrollFade))
        
        // Filter out finished packets
        packets = packets.filter(p => {
            const isAlive = p.update()
            if (isAlive) p.draw(scrollFade)
            return isAlive
        })

        animationId = requestAnimationFrame(animate)
    }

    resize()
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
