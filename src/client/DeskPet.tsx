/**
 * Desk pet component rendered in the `shell.overlay` slot. Reads the active
 * session's running state from the browser session snapshot, animates chibi
 * Kaito Kid actions, plays a completion chime via Web Audio, and supports
 * drag / position memory (localStorage). No network is required: the assets
 * are embedded data URLs.
 * @module @deepseek-ai/dsh-desk-pet/client
 */

import * as React from 'react'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { PET_ASSETS } from './assets.ts'

type DeskPetProps = PropsRuntime<'shell.overlay'>

const STORAGE_KEY = 'dsh-desk-pet-pos'
const PET_W = 110
const PET_H = 120
const IMG_W = 128
const IMG_H = 139

/** Clamp a position into the viewport. */
function clampPos(p: { x: number; y: number }): { x: number; y: number } {
  const w = window.innerWidth
  const h = window.innerHeight
  return {
    x: Math.min(Math.max(p.x, 0), Math.max(0, w - PET_W)),
    y: Math.min(Math.max(p.y, 0), Math.max(0, h - PET_H)),
  }
}

function defaultPos(): { x: number; y: number } {
  const w = window.innerWidth
  const h = window.innerHeight
  return { x: Math.max(0, w - PET_W - 16), y: Math.max(0, h - PET_H - 16) }
}

function loadSavedPos(): { x: number; y: number } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPos()
    const p = JSON.parse(raw) as { x?: unknown; y?: unknown }
    if (typeof p.x === 'number' && typeof p.y === 'number') return clampPos({ x: p.x, y: p.y })
  } catch {
    // Corrupt or unavailable storage: fall back to the default position.
  }
  return defaultPos()
}

function savePos(p: { x: number; y: number }): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    // Non-persistent storage (e.g. private mode): position just won't stick.
  }
}

let audioCtx: AudioContext | null = null

function ensureAudio(): AudioContext | null {
  try {
    if (audioCtx === null) {
      const Ctor = typeof AudioContext !== 'undefined'
        ? AudioContext
        : (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      audioCtx = new Ctor()
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume().catch(() => { /* autoplay policy not yet unlocked */ })
    }
    return audioCtx
  } catch {
    return null
  }
}

function tone(ac: AudioContext, freq: number, at: number, dur: number, vol: number, type: OscillatorType): void {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(vol, at + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

/** Completion chime: C5-E5-G5-C6 ascending arpeggio (Web Audio, no asset). */
function playChime(): void {
  const ac = ensureAudio()
  if (!ac) return
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((note, i) => {
      tone(ac, note, ac.currentTime + i * 0.09, 0.35, 0.16, 'triangle')
    })
  } catch {
    // Audio failure never blocks the pet.
  }
}

const rootStyle = (pos: { x: number; y: number }, dragging: boolean): React.CSSProperties => ({
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 99,
  pointerEvents: 'auto',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'none',
  cursor: dragging ? 'grabbing' : 'grab',
  transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
})

const imgStyle: React.CSSProperties = {
  width: IMG_W,
  height: IMG_H,
  display: 'block',
  pointerEvents: 'auto',
  imageRendering: 'pixelated',
}

const bubbleStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 10px)',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(255,255,255,0.97)',
  border: '2px solid #2e2e2e',
  borderRadius: 12,
  padding: '6px 12px',
  fontSize: 14,
  fontWeight: 700,
  color: '#222',
  lineHeight: 1.3,
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 14px rgba(0,0,0,0.28)',
  pointerEvents: 'none',
}

/** The animated desk pet at the bottom-right of the frame. */
export function DeskPet(props: DeskPetProps): React.ReactElement {
  const [action, setAction] = React.useState('waving')
  const [bubble, setBubble] = React.useState<string | null>('你好呀~')
  const [dragging, setDragging] = React.useState(false)
  const [pos, setPos] = React.useState<{ x: number; y: number }>(loadSavedPos)

  const posRef = React.useRef(pos)
  const dragCleanup = React.useRef<(() => void) | null>(null)
  const celebrating = React.useRef(false)
  const activeAmbient = React.useRef(false)
  const ambientTimer = React.useRef<number | null>(null)
  const prevRunning = React.useRef(false)

  const list = props.useSessions(s => s)
  const current = list.current
  const summary = current !== undefined ? list.byId[current] : undefined
  const running = summary?.running === true

  // Track running -> idle as a completed turn.
  React.useEffect(() => {
    if (prevRunning.current && !running) {
      startCelebration('jumping', '老大，搞定~', playChime)
    }
    prevRunning.current = running
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  // Re-clamp into the viewport on resize.
  React.useEffect(() => {
    const onResize = () => {
      const next = clampPos(posRef.current)
      posRef.current = next
      setPos(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Cleanup drag + ambient timers on unmount.
  React.useEffect(() => {
    return () => {
      if (dragCleanup.current !== null) dragCleanup.current()
      if (ambientTimer.current !== null) window.clearTimeout(ambientTimer.current)
    }
  }, [])

  // Greeting: wave for 2s then settle into the ambient loop.
  React.useEffect(() => {
    const t1 = window.setTimeout(() => { if (!celebrating.current) setAction('idle') }, 2000)
    const t2 = window.setTimeout(() => setBubble(null), 2000)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startCelebration(actionName: string, text: string, sound: () => void): void {
    cancelAmbient()
    celebrating.current = true
    setBubble(text)
    setAction(actionName)
    sound()
    const ms = actionName === 'failed' ? 2600 : 3200
    window.setTimeout(() => {
      celebrating.current = false
      setBubble(null)
      setAction('idle')
    }, ms)
  }

  function scheduleAmbient(): void {
    if (ambientTimer.current !== null || celebrating.current) return
    ambientTimer.current = window.setTimeout(() => {
      ambientTimer.current = null
      if (celebrating.current) return
      const pick = Math.random() < 0.5 ? 'waving' : 'jumping'
      activeAmbient.current = true
      setAction(pick)
      window.setTimeout(() => {
        activeAmbient.current = false
        if (!celebrating.current && !running) {
          setAction('idle')
          scheduleAmbient()
        }
      }, 2000)
    }, 7000 + Math.random() * 6000)
  }

  function cancelAmbient(): void {
    if (ambientTimer.current !== null) {
      window.clearTimeout(ambientTimer.current)
      ambientTimer.current = null
    }
    activeAmbient.current = false
  }

  // Drive the action from the session running state.
  React.useEffect(() => {
    if (celebrating.current) return
    if (running) {
      cancelAmbient()
      setAction('running')
    } else {
      if (!activeAmbient.current) setAction('idle')
      scheduleAmbient()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  function wave(): void {
    cancelAmbient()
    celebrating.current = true
    setAction('waving')
    setBubble('哇，你好呀！')
    window.setTimeout(() => {
      celebrating.current = false
      setBubble(null)
      setAction('idle')
    }, 1500)
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (dragCleanup.current !== null) return
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const originX = posRef.current.x
    const originY = posRef.current.y
    let moved = false

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true
      if (!moved) return
      setDragging(true)
      const next = clampPos({ x: originX + dx, y: originY + dy })
      posRef.current = next
      setPos(next)
    }
    const onEnd = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
      dragCleanup.current = null
      setDragging(false)
      if (moved) savePos(posRef.current)
      else wave()
    }
    dragCleanup.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
  }

  const src = PET_ASSETS[action] ?? PET_ASSETS.idle
  return React.createElement(
    'div',
    { style: rootStyle(pos, dragging), onPointerDown: onPointerDown },
    bubble === null
      ? null
      : React.createElement('div', { style: bubbleStyle }, bubble),
    React.createElement('img', {
      style: imgStyle,
      src,
      alt: '桌宠',
      title: '怪盗基德桌宠',
      draggable: false,
    }),
  )
}
