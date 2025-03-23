"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

const LandingPage = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const particles = []

    canvas.width = window.innerWidth 
    canvas.height = window.innerHeight

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

    const init = () => {
      for (let i = 0; i < 80; i++) {
        particles.push(new Particle())
      }
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })
      requestAnimationFrame(animate)
    }

    init()
    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full"
      />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/30 via-fuchsia-900/20 to-transparent" />
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <h1 className="text-7xl font-black">
                Learn with <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-500">Blockchain</span> Rewards
              </h1>
              <p className="text-slate-300 text-xl leading-relaxed">
                Join our innovative learning platform where your achievements are securely recorded on the blockchain. Earn rewards while mastering new skills.
              </p>
              <div className="flex flex-wrap gap-6">
                <button className="px-10 py-5 bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-orange-500 rounded-full font-bold text-lg hover:shadow-xl hover:shadow-fuchsia-500/20 transition-all transform hover:-translate-y-1">
                  Start Learning
                </button>
                <button className="px-10 py-5 bg-white/5 backdrop-blur-lg border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                  Become a Mentor
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative w-full h-[600px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-cyan-500/30 via-fuchsia-500/30 to-orange-500/30 rounded-[30%] blur-3xl animate-pulse" />
                <div className="absolute w-full h-full grid grid-cols-2 gap-8">
                  {[...Array(4)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.2 }}
                      className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/10 rounded-3xl p-8 border border-white/10 hover:border-fuchsia-500/50 transition-colors"
                    >
                      <div className="h-full flex flex-col justify-between">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-fuchsia-500/20 to-orange-500/20 flex items-center justify-center mb-6">
                          <span className="text-3xl">{['📚', '🎓', '💎', '🔒'][i]}</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3">{['Expert Courses', 'Verified Learning', 'Token Rewards', 'Secure Credentials'][i]}</h3>
                        <p className="text-slate-400">Learn from industry experts and earn blockchain-verified credentials</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 opacity-50" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-black mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-500">
              Why Choose Us
            </h2>
            <p className="text-slate-300 text-xl max-w-3xl mx-auto">
              A revolutionary learning platform that combines education with blockchain technology
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-10">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group backdrop-blur-xl bg-white/5 rounded-3xl p-8 hover:bg-gradient-to-br hover:from-cyan-500/10 hover:via-fuchsia-500/10 hover:to-orange-500/10 transition-all border border-white/10 hover:border-fuchsia-500/50"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-fuchsia-500/20 to-orange-500/20 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <span className="text-3xl">{['👨‍🏫', '💰', '🔗', '📜', '🤝', '🌟'][i]}</span>
                </div>
                <h3 className="text-2xl font-bold mb-4">{['Expert Mentors', 'Token Rewards', 'Blockchain Verified', 'Smart Certificates', 'Community Learning', 'Achievement Badges'][i]}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {[
                    'Learn from experienced industry professionals',
                    'Earn tokens for completing courses',
                    'Credentials stored on blockchain',
                    'Tamper-proof digital certificates',
                    'Collaborative learning environment',
                    'Showcase your achievements'
                  ][i]}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-cyan-900/30 via-fuchsia-900/30 to-orange-900/30 rounded-[40px] p-16 text-center relative overflow-hidden backdrop-blur-xl border border-white/10"
          >
            <div className="absolute inset-0 bg-grid-white/5" />
            <h2 className="text-5xl font-black mb-8 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-500">
              Start Your Learning Journey
            </h2>
            <p className="text-2xl text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of learners who are already earning while learning on our platform
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
              <button className="px-12 py-6 bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-orange-500 rounded-full text-xl font-bold hover:shadow-xl hover:shadow-fuchsia-500/20 transition-all transform hover:-translate-y-1">
                Enroll Now
              </button>
              <button className="px-12 py-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-full text-xl font-bold hover:bg-white/10 transition-all">
                View Courses
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
