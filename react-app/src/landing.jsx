import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValueEvent } from 'framer-motion'
import { ReactLenis, useLenis } from 'lenis/react'
import appStore from './assets/appstore.png'
import './landing.css'

const PEEK = 85
const ARCH_X = 65

const SnapContext = createContext(() => {})

function useViewport() {
  const [vh, setVh] = useState(() =>
    typeof window === 'undefined' ? 800 : window.innerHeight
  )
  const [depth, setDepth] = useState(140)

  useEffect(() => {
    const sync = () => {
      const h = window.innerHeight
      const w = window.innerWidth

      setVh(h)
      setDepth(w < 480 ? 70 : w < 900 ? 95 : 140)
      document.documentElement.style.setProperty('--vh', `${h}px`)
    }

    sync()
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)

    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
    }
  }, [])

  return { vh, depth }
}

function SnapProvider({ children }) {
  const lenis = useLenis()
  const indexRef = useRef(0)
  const lockRef = useRef(false)
  const goRef = useRef(() => {})

  useEffect(() => {
    if (!lenis) return

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    lenis.scrollTo(0, { immediate: true, force: true })
    indexRef.current = 0
    lenis.stop()

    let unlockTimer

    const go = (next) => {
      if (lockRef.current || next === indexRef.current) return
      indexRef.current = next
      lockRef.current = true
      clearTimeout(unlockTimer)
      unlockTimer = setTimeout(() => { lockRef.current = false }, 2000)

      lenis.scrollTo(next * window.innerHeight, {
        duration: 2.6,
        force: true,
        easing: (t) => 1 - Math.pow(1 - t, 4),
      })
    }
    goRef.current = go

    const trigger = (delta) => {
      if (lockRef.current || Math.abs(delta) < 6) return
      go(delta > 0 ? 1 : 0)
    }

    const onWheel = (e) => { e.preventDefault(); trigger(e.deltaY) }

    let touchY = 0
    const onTouchStart = (e) => { touchY = e.touches[0].clientY }
    const onTouchMove = (e) => { e.preventDefault(); trigger(touchY - e.touches[0].clientY) }

    const onKey = (e) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(1) }
      if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(0) }
    }

    const onResize = () =>
      lenis.scrollTo(indexRef.current * window.innerHeight, { immediate: true, force: true })

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)

    return () => {
      clearTimeout(unlockTimer)
      lenis.start()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [lenis])

  return (
    <SnapContext.Provider value={(i) => goRef.current(i)}>
      {children}
    </SnapContext.Provider>
  )
}

function Dots({ progress }) {
  const go = useContext(SnapContext)
  const [active, setActive] = useState(0)

  useMotionValueEvent(progress, 'change', (p) => {
    setActive(p > 0.5 ? 1 : 0)
  })

  const labels = ['Начало', 'Возможности']

  return (
    <nav className="dots">
      {labels.map((label, i) => (
        <button
          key={i}
          aria-label={label}
          aria-current={active === i ? 'true' : undefined}
          onClick={() => go(i)}
          style={{
            opacity: active === i ? 1 : 0.3,
            transform: active === i ? 'scale(1.35)' : 'scale(1)',
          }}
        />
      ))}
    </nav>
  )
}





function Page() {
  const { scrollY } = useScroll()
  const { vh, depth } = useViewport()
  const progress = useTransform(scrollY, [0, vh], [0, 1])

  const y = useTransform(progress, [0, 1], [`${PEEK}%`, '0%'])
  const rx = useTransform(progress, [0, 1], [ARCH_X, 0])
  const ry = useTransform(progress, [0, 1], [depth, 0])
  const borderRadius = useMotionTemplate`${rx}% ${rx}% 0 0 / ${ry}px ${ry}px 0 0`

  const heroOpacity = useTransform(progress, [0, 0.4], [1, 0])
  const featuresOpacity = useTransform(progress, [0.6, 1], [0, 1])

  return (
    <div className="page">
      <motion.div className="flood" style={{ y, borderRadius }} />
      <Dots progress={progress} />

      <section className="hero">
        <motion.div className="hero-content" style={{ opacity: heroOpacity }}>
          <h1>Get Balb App</h1>
          <h2>to break the ice</h2>
          <a className="store-link" href="#">
            <img src={appStore} alt="Скачать в App Store" />
          </a>
        </motion.div>
      </section>

      <section className="features">
        <motion.div className="features-content" style={{ opacity: featuresOpacity }}>
        </motion.div>
      </section>
    </div>
  )
}

export default function App() {
  return (
    <ReactLenis root options={{ lerp: 0.1 }}>
      <SnapProvider>
        <Page />
      </SnapProvider>
    </ReactLenis>
  )
}