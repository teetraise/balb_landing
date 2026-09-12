import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useMotionTemplate, useMotionValueEvent } from 'framer-motion'
import { ReactLenis, useLenis } from 'lenis/react'

import appStore from './assets/appstore.png'
import iphone from "./assets/iphonebalb.png"

import card1Content from './assets/card1/card1-content.png'
import card3Content from './assets/card3/card3-content.png'

import card2Base from './assets/card2/first.png'
import card2Grg from './assets/card2/second.png'
import card2Tutor from './assets/card2/third.png'
import card2AstPerson from './assets/card2/grg.png'
import card2Insta from './assets/card2/insta.png'

import './landing.css'



const PEEK = 85
const ARCH_X = 60
const SnapContext = createContext(() => {})
const EASE_IN_OUT = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const card2Bubbles = [card2Base, card2Grg, card2Tutor, card2AstPerson, card2Insta]
const BUBBLE_TOP = [0, 14, 32, 48, 64]


// user`s data
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



// snapka logic
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

    const animateTo = (next, duration = 1.5) => {
      lockRef.current = true
      clearTimeout(unlockTimer)
      unlockTimer = setTimeout(() => { lockRef.current = false }, duration * 1000 + 120)

      lenis.scrollTo(next * window.innerHeight, {
        duration,
        force: true,
        easing: EASE_IN_OUT,
      })
    }

    const go = (next) => {
      if (lockRef.current || next === indexRef.current || next < 0 || next > 1) return
      indexRef.current = next
      animateTo(next)
    }
    goRef.current = go

    const trigger = (delta) => {
      if (lockRef.current || Math.abs(delta) < 6) return
      go(indexRef.current + (delta > 0 ? 1 : -1))
    }
    const onWheel = (e) => { e.preventDefault(); trigger(e.deltaY) }

    let dragging = false
    let startY = 0
    let startScroll = 0
    let lastDelta = 0

    const vh = () => window.innerHeight

    const onTouchStart = (e) => {
      if (lockRef.current) return
      dragging = true
      startY = e.touches[0].clientY
      startScroll = indexRef.current * vh()
      lastDelta = 0
    }

    const onTouchMove = (e) => {
      if (!dragging) return
      e.preventDefault()

      const delta = startY - e.touches[0].clientY
      const maxScroll = vh()

      const raw = startScroll + delta
      let pos
      if (raw < 0) pos = raw * 0.35
      else if (raw > maxScroll) pos = maxScroll + (raw - maxScroll) * 0.35
      else pos = raw

      lastDelta = delta
      lenis.scrollTo(pos, { immediate: true, force: true })
    }

    const onTouchEnd = () => {
      if (!dragging) return
      dragging = false

      const threshold = vh() * 0.18
      let next = indexRef.current

      if (lastDelta > threshold) next = Math.min(1, indexRef.current + 1)
      else if (lastDelta < -threshold) next = Math.max(0, indexRef.current - 1)

      indexRef.current = next
      animateTo(next, 0.6)
    }

    const onKey = (e) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(indexRef.current + 1) }
      if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(indexRef.current - 1) }
    }

    const onResize = () =>
      lenis.scrollTo(indexRef.current * window.innerHeight, { immediate: true, force: true })

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)

    return () => {
      clearTimeout(unlockTimer)
      lenis.start()
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
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


// dot buttons
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


// card template
function Card({ text, src, alt = "photo", progress, index = 0 }) {
  const start = 0.45 + index * 0.08
  const opacity = useTransform(progress, [start, start + 0.38], [0, 1])
  const y = useTransform(progress, [start, start + 0.42], [70, 0])

  return (
    <motion.div className="card" style={{ opacity, y }}>
      <h2>{text}</h2>
      <div className="card-media">
        {src && <img src={src} alt={alt} />}
      </div>
    </motion.div>
  )
}

function BubbleCard({ text, images, progress, index = 0 }) {
  const start = 0.45 + index * 0.08
  const opacity = useTransform(progress, [start, start + 0.38], [0, 1])
  const y = useTransform(progress, [start, start + 0.42], [70, 0])

  return (
    <motion.div className="card" style={{ opacity, y }}>
      <h2>{text}</h2>
      <div className="card-bubbles">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="card-bubble"
            style={{ '--i': i, '--top': `${BUBBLE_TOP[i] ?? i * 16}%` }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// page
function Page() {
  const { scrollY } = useScroll()
  const { vh, depth } = useViewport()

  const progress = useTransform(scrollY, [0, vh], [0, 1])

  const y = useTransform(progress, [0, 1], [`${PEEK}%`, '0%'])
  const rx = useTransform(progress, [0, 1], [ARCH_X, 0])
  const ry = useTransform(progress, [0, 1], [depth, 0])
  const borderRadius = useMotionTemplate`${rx}% ${rx}% 0 0 / ${ry}px ${ry}px 0 0`

  const heroOpacity = useTransform(progress, [0, 0.48], [1, 0])
  const heroY = useTransform(progress, [0, 0.48], [0, -50])
  const heroEvents = useTransform(progress, (p) => (p < 0.5 ? 'auto' : 'none'))

  const phoneY = useTransform(progress, [0, 0.48], [0, -90])

  const featEvents = useTransform(progress, (p) => (p > 0.5 ? 'auto' : 'none'))

  return (
    <div className="page">
      <motion.div className="flood" style={{ y, borderRadius }} />
      <Dots progress={progress} />

      <section className="hero">
        <motion.div
          className="hero-content"
          style={{ opacity: heroOpacity, y: heroY, pointerEvents: heroEvents }}
        >
          <div className='hero-left'>
            <h1>Get <span style={{color: "red"}}>Balb App</span></h1>
            <h2>to break the ice</h2>
            <a className="store-link" href="#">
              <img src={appStore} alt="Скачать в App Store"  style = {{userSelect: "none"}}/>
            </a>
          </div>
          <motion.div className='hero-right' style={{ y: phoneY }}>
            <img src={iphone} alt="Balb App" />
          </motion.div>
        </motion.div>
      </section>

      <section className="features">
        <div className="features-content" style={{ pointerEvents: featEvents }}>
          <div className="container">
            <Card index={0} progress={progress} text="Truth or Dare with multitiouch" src={card1Content} />
            <BubbleCard index={1} progress={progress} text="Endless UGC- feed picked for you" images={card2Bubbles} />
            <Card index={2} progress={progress} text="Submit your cards, see them in the game" src={card3Content} />
          </div>
        </div>
      </section>
    </div>
  )
}

export default function App() {
  return (
    <ReactLenis root options={{ lerp: 0.08 }}>
      <SnapProvider>
        <Page />
      </SnapProvider>
    </ReactLenis>
  )
}