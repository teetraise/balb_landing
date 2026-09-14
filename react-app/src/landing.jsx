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
const getViewportHeight = () => window.visualViewport?.height ?? window.innerHeight

const MOBILE_BREAKPOINT = 700

const card2Bubbles = [
  { src: card2Base,       top: '-8%', shiftX: '0%',  width: '100%', rotate: '-1deg',
    mobile: { top: '-22%', width: '95%', rotate: '0deg', } },
  { src: card2Grg,        top: '12%', shiftX: '8%', width: '80%',  rotate: '1deg', zIndex: 5,
    mobile: {top: '7%', width: '67%'} },
  { src: card2Tutor,      top: '24%', shiftX: '0%',  width: '100%', rotate: '0deg',
    mobile: {top: '25%', width: '92%'} },
  { src: card2AstPerson,  top: '42%', shiftX: '0%',  width: '100%', rotate: '-1deg',
    mobile: {top: '45%', width: '85%'} },
  { src: card2Insta,      top: '55%', shiftX: '0%',  width: '105%', rotate: '0deg', zIndex: 11,
    mobile: {top: '50%', width: '100%'} },
]


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isMobile
}

// user`s data
function useViewport() {
  const [vh, setVh] = useState(() =>
    typeof window === 'undefined' ? 800 : getViewportHeight()
  )
  const [depth, setDepth] = useState(140)

  useEffect(() => {
    const sync = () => {
      const h = getViewportHeight()
      const w = window.innerWidth

      setVh(h)
      setDepth(w < 480 ? 70 : w < 900 ? 95 : 140)
      document.documentElement.style.setProperty('--vh', `${h}px`)
    }

    sync()
    window.addEventListener('resize', sync)
    window.addEventListener('orientationchange', sync)
    window.visualViewport?.addEventListener('resize', sync)

    return () => {
      window.removeEventListener('resize', sync)
      window.removeEventListener('orientationchange', sync)
      window.visualViewport?.removeEventListener('resize', sync)
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
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!lenis || !isMobile) return

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    lenis.scrollTo(0, { immediate: true, force: true })
    indexRef.current = 0

    const animateTo = (next, duration = 1.2) => {
      lenis.scrollTo(next * getViewportHeight(), { duration, force: true, easing: EASE_IN_OUT })
    }

    const go = (next) => {
      if (next < 0 || next > 1) return
      indexRef.current = next
      animateTo(next)
    }
    goRef.current = go

    const onScroll = () => {
      indexRef.current = window.scrollY > getViewportHeight() / 2 ? 1 : 0
    }
    const onKey = (e) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(indexRef.current + 1) }
      if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(indexRef.current - 1) }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('keydown', onKey)
    }
  }, [lenis, isMobile])

  useEffect(() => {
    if (!lenis || isMobile) return

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    lenis.scrollTo(0, { immediate: true, force: true })
    indexRef.current = 0
    lenis.stop()
    const featuresEl = document.querySelector('.features')
    const featuresAtTop = () => !featuresEl || featuresEl.scrollTop <= 0
    const featuresAtBottom = () =>
      !featuresEl || featuresEl.scrollTop + featuresEl.clientHeight >= featuresEl.scrollHeight - 1

    let unlockTimer

    const animateTo = (next, duration = 1.5) => {
      lockRef.current = true
      clearTimeout(unlockTimer)
      unlockTimer = setTimeout(() => { lockRef.current = false }, duration * 1000 + 120)

      lenis.scrollTo(next * getViewportHeight(), {
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

    const onWheel = (e) => {
      if (indexRef.current === 1 && featuresEl) {
        const scrollingIntoFeatures = e.deltaY > 0 && !featuresAtBottom()
        const scrollingUpInsideFeatures = e.deltaY < 0 && !featuresAtTop()
        if (scrollingIntoFeatures || scrollingUpInsideFeatures) {
          e.preventDefault()
          featuresEl.scrollTop += e.deltaY
          return
        }
        if (e.deltaY > 0 && featuresAtBottom()) return
      }
      e.preventDefault()
      trigger(e.deltaY)
    }

    let dragging = false
    let dragMode = 'page'
    let startY = 0
    let lastTouchY = 0
    let startScroll = 0
    let lastDelta = 0

    const vh = () => getViewportHeight()

    const onTouchStart = (e) => {
      if (lockRef.current) return
      startY = e.touches[0].clientY
      lastTouchY = startY
      lastDelta = 0

      if (indexRef.current === 1) {
        dragMode = 'inner'
        dragging = false
      } else {
        dragMode = 'page'
        dragging = true
        startScroll = indexRef.current * vh()
      }
    }

    const onTouchMove = (e) => {
      const currentY = e.touches[0].clientY

      if (dragMode === 'inner') {
        const step = lastTouchY - currentY
        lastTouchY = currentY

        if (step < 0 && featuresAtTop()) {
          dragMode = 'page'
          dragging = true
          startY = currentY
          startScroll = indexRef.current * vh()
        } else {
          e.preventDefault()
          if (featuresEl) featuresEl.scrollTop += step
          return
        }
      }

      if (!dragging) return
      e.preventDefault()

      const delta = startY - currentY
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
      if (!dragging) { dragMode = 'page'; return }
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
      lenis.scrollTo(indexRef.current * getViewportHeight(), { immediate: true, force: true })

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('touchcancel', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    window.visualViewport?.addEventListener('resize', onResize)

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
      window.visualViewport?.removeEventListener('resize', onResize)
    }
  }, [lenis, isMobile])

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
function Card({ text, src, alt = "photo", progress, index = 0, mediaClassName = '' }) {
  const start = 0.45 + index * 0.08
  const opacity = useTransform(progress, [start, start + 0.38], [0, 1])
  const y = useTransform(progress, [start, start + 0.42], [70, 0])

  return (
    <motion.div className="card" style={{ opacity, y }}>
      <h2>{text}</h2>
      <div className={`card-media ${mediaClassName}`}>
        {src && <img src={src} alt={alt} />}
      </div>
    </motion.div>
  )
}

function BubbleCard({ text, images, progress, index = 0 }) {
  const start = 0.45 + index * 0.08
  const opacity = useTransform(progress, [start, start + 0.38], [0, 1])
  const y = useTransform(progress, [start, start + 0.42], [70, 0])
  const isMobile = useIsMobile()

  return (
    <motion.div className="card card--bubbles" style={{ opacity, y }}>
      <h2>{text}</h2>
      <div className="card-bubbles">
        {images.map((raw, i) => {
          const img = isMobile ? { ...raw, ...raw.mobile } : raw
          return (
          <img
            key={i}
            src={img.src}
            alt=""
            className="card-bubble"
            style={{
              top: img.top,
              left: `calc(50% + ${img.shiftX ?? '0%'})`,
              width: img.width ?? '88%',
              transform: `translateX(-50%)${img.rotate ? ` rotate(${img.rotate})` : ''}`,
              zIndex: img.zIndex ?? (10 - i),
            }}
          />
          )
        })}
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
  const heroEvents = useTransform(progress, (p) => (p < 0.5 ? 'auto' : 'none'))

  const titleY = useTransform(progress, [0, 0.4], [0, -26])
  const titleOpacity = useTransform(progress, [0, 0.4], [1, 0])
  const titleBlurPx = useTransform(progress, [0, 0.4], [0, 4])
  const titleBlur = useMotionTemplate`blur(${titleBlurPx}px)`

  const subtitleY = useTransform(progress, [0.02, 0.43], [0, -20])
  const subtitleOpacity = useTransform(progress, [0.02, 0.43], [1, 0])

  const ctaY = useTransform(progress, [0.04, 0.46], [0, -14])
  const ctaOpacity = useTransform(progress, [0.04, 0.46], [1, 0])

  const phoneY = useTransform(progress, [0, 0.48], [0, -70])
  const phoneScale = useTransform(progress, [0, 0.48], [1, 0.95])

  const featEvents = useTransform(progress, (p) => (p > 0.5 ? 'auto' : 'none'))

  return (
    <div className="page">
      <motion.div className="flood" style={{ y, borderRadius }} />
      <Dots progress={progress} />

      <section className="hero">
        <motion.div
          className="hero-content"
          style={{ pointerEvents: heroEvents }}
        >
          <div className='hero-left'>
            <motion.h1 style={{ opacity: titleOpacity, y: titleY, filter: titleBlur }}>
              Get <span className="accent">Balb App</span>
            </motion.h1>
            <motion.h2 style={{ opacity: subtitleOpacity, y: subtitleY }}>to break the ice</motion.h2>
            <motion.a className="store-link" href="#" style={{ opacity: ctaOpacity, y: ctaY }}>
              <img src={appStore} alt="Скачать в App Store"  style = {{userSelect: "none"}}/>
            </motion.a>
          </div>
          <motion.div className='hero-right' style={{ y: phoneY, scale: phoneScale }}>
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [0, 1.2, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <img src={iphone} alt="Balb App" />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div className="scroll-hint" style={{ opacity: heroOpacity }}>
          <span className="scroll-hint-bounce">
            <span className="scroll-hint-label">Explore more</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </motion.div>
      </section>

      <section className="features">
        <div className="features-content" style={{ pointerEvents: featEvents }}>
          <div className="container">
            <Card index={0} progress={progress} text={<>Truth or Dare<br />with multitiouch</>} src={card1Content} mediaClassName="card-media--phone" />
            <BubbleCard index={1} progress={progress} text={<>Endless UGC-<br />feed picked for <br /> you</>} images={card2Bubbles} />
            <Card index={2} progress={progress} text={<>Submit your<br />cards, see them<br />in the game</>} src={card3Content} />
          </div>
        </div>
      </section>
    </div>
  )
}

function useVisitNotification() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('visit-notified')) return
      sessionStorage.setItem('visit-notified', '1')
    } catch {
      // sessionStorage unavailable (private mode etc.) - notify anyway, just can't dedupe
    }

    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {})
  }, [])
}

export default function App() {
  useVisitNotification()

  return (
    <ReactLenis root options={{ lerp: 0.08 }}>
      <SnapProvider>
        <Page />
      </SnapProvider>
    </ReactLenis>
  )
}