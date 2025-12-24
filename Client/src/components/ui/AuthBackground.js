import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'

const Canvas = styled.canvas`
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
`

const Blob = styled.div`
  position: absolute;
  z-index: 0;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  width: 420px;
  height: 420px;
  border-radius: 28%;
  background: radial-gradient(circle at 30% 30%, rgba(124,58,237,0.18), transparent 30%),
              radial-gradient(circle at 70% 70%, rgba(79,70,229,0.14), transparent 30%);
  filter: blur(48px);
  opacity: 0.95;
  pointer-events: none;

  @media (max-width: 640px) {
    left: 50%;
    width: 300px;
    height: 300px;
  }
`

export default function AuthBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const particles = []

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 4 + 2
        this.speedX = Math.random() * 2 - 1
        this.speedY = Math.random() * 2 - 1
        this.color = `hsla(${Math.random() * 360}, 70%, 60%, ${Math.random() * 0.4 + 0.1})`
        this.angle = Math.random() * Math.PI * 2
        this.spin = (Math.random() - 0.5) * 0.1
      }

      update() {
        this.angle += this.spin
        this.x += Math.cos(this.angle) * this.speedX
        this.y += Math.sin(this.angle) * this.speedY

        if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX
        if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY
      }

      draw() {
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.moveTo(this.x + this.size * Math.cos(this.angle), this.y + this.size * Math.sin(this.angle))
        for (let i = 0; i < 5; i++) {
          const angle = this.angle + (Math.PI * 2 / 5) * i
          ctx.lineTo(this.x + this.size * Math.cos(angle), this.y + this.size * Math.sin(angle))
        }
        ctx.closePath()
        ctx.fill()
      }
    }

    function init() {
      particles.length = 0
      for (let i = 0; i < 80; i++) particles.push(new Particle())
    }

    let rafId
    function animate() {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.update()
        p.draw()
      })
      rafId = requestAnimationFrame(animate)
    }

    resize()
    init()
    animate()

    const onResize = () => {
      resize()
      init()
    }

    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      <Canvas ref={canvasRef} />
      <Blob />
    </>
  )
}
