import { useState } from 'react'
import HeroLandingParticles from '../hero-variants/HeroLandingParticles'
import HeroDataNetwork from '../hero-variants/HeroDataNetwork'
import HeroFloatingOrbs from '../hero-variants/HeroFloatingOrbs'
import HeroConstellation from '../hero-variants/HeroConstellation'
import HeroWaveMesh from '../hero-variants/HeroWaveMesh'
import HeroGoldenRain from '../hero-variants/HeroGoldenRain'

/* Available hero section variants for the switcher */
const variants = [
  { name: 'Data Network', component: HeroDataNetwork },
  { name: 'Landing Particles', component: HeroLandingParticles },
  { name: 'Floating Orbs', component: HeroFloatingOrbs },
  { name: 'Constellation', component: HeroConstellation },
  { name: 'Wave Mesh', component: HeroWaveMesh },
  { name: 'Golden Rain', component: HeroGoldenRain },
]

/* HeroSwitcher — renders the active hero variant with a bottom bar to swap between all 5 */
export default function HeroSwitcher() {
  const [activeIndex, setActiveIndex] = useState(0)
  const ActiveComponent = variants[activeIndex].component

  return (
    <>
      <ActiveComponent />
      {/* Dev switcher — remove in production */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-background/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
        {variants.map((v, i) => (
          <button
            key={v.name}
            onClick={() => setActiveIndex(i)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              i === activeIndex
                ? 'bg-accent text-background'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {v.name}
          </button>
        ))}
      </div>
    </>
  )
}
