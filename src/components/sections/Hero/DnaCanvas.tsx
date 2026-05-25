'use client'

import { useEffect, useRef } from 'react'

export function DnaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let t = 0
    let rafId = 0

    function resize() {
      const hero = document.getElementById('hero')
      if (!hero || !canvas) return
      W = canvas.width  = hero.offsetWidth
      H = canvas.height = hero.offsetHeight
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)

      const strandCount = 5
      for (let s = 0; s < strandCount; s++) {
        const xB  = W * ((s + 0.5) / strandCount)
        const amp  = 55 + (s % 3) * 20
        const freq = 0.007 + (s % 2) * 0.001
        const spd  = 0.35 + s * 0.11
        const ph   = (s * Math.PI * 2) / strandCount

        for (let y = 0; y < H; y += 2) {
          const x1 = xB + Math.sin(y * freq + t * spd + ph) * amp
          const x2 = xB + Math.sin(y * freq + t * spd + ph + Math.PI) * amp
          const al  = 0.055 + 0.03 * Math.abs(Math.sin(y * freq + t * spd))

          ctx!.beginPath()
          ctx!.arc(x1, y, 1, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(184,245,200,${al})`
          ctx!.fill()

          ctx!.beginPath()
          ctx!.arc(x2, y, 1, 0, Math.PI * 2)
          ctx!.fillStyle = `rgba(184,245,200,${al * 0.6})`
          ctx!.fill()

          if (y % 30 < 2) {
            ctx!.beginPath()
            ctx!.moveTo(x1, y)
            ctx!.lineTo(x2, y)
            ctx!.strokeStyle = `rgba(184,245,200,${al * 1.5})`
            ctx!.lineWidth = 0.5
            ctx!.stroke()
          }
        }
      }

      t += 0.02
      rafId = requestAnimationFrame(draw)
    }

    // Run after first paint so the hero has its correct height
    window.addEventListener('load', resize)
    window.addEventListener('resize', resize)
    requestAnimationFrame(resize)

    // Start animation loop immediately; will draw once resize fires
    draw()

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('load', resize)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  )
}
