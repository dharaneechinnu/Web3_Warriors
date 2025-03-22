"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, ChevronDown, Globe, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HeroParticles } from "@/components/hero-particles"
import { ThemeToggle } from "@/components/theme-toggle"

export function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-primary-foreground"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />
              <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center text-primary font-bold">
                S
              </div>
            </div>
            <span className="font-bold text-xl">SkillSwap</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="#mentors" className="text-sm font-medium hover:text-primary transition-colors">
              Mentors
            </Link>
            <Link href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Testimonials
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <HeroParticles />
          <div
            className="container relative z-10 py-24 md:py-32"
            style={{
              transform: `translateY(${scrollY * 0.2}px)`,
            }}
          >
            <div className="max-w-3xl mx-auto text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                  Learn, Teach, and Earn with{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                    Blockchain
                  </span>{" "}
                  Credentials
                </h1>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <p className="text-xl text-muted-foreground mb-8">
                  A decentralized platform where skills are valued, verified, and exchanged in a trusted ecosystem.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button size="lg" className="group">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="lg" variant="outline">
                  Explore Mentors
                </Button>
              </motion.div>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Why Choose SkillSwap?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform combines the best of blockchain technology with a user-friendly interface to create a
                trusted skill exchange ecosystem.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: "Verified Credentials",
                  description:
                    "All skills and achievements are verified on the blockchain, ensuring trust and transparency.",
                },
                {
                  icon: Users,
                  title: "Global Community",
                  description:
                    "Connect with mentors and learners from around the world, expanding your network and opportunities.",
                },
                {
                  icon: Globe,
                  title: "Token Economy",
                  description:
                    "Earn tokens by teaching and spend them on learning, creating a sustainable ecosystem of knowledge exchange.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-background rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our platform makes it easy to learn, teach, and earn with a simple process.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Create Profile",
                  description: "Sign up and create your profile with your skills and interests.",
                },
                {
                  step: "02",
                  title: "Connect Wallet",
                  description: "Link your Web3 wallet to enable secure transactions and credential storage.",
                },
                {
                  step: "03",
                  title: "Find Mentors",
                  description: "Browse and connect with verified mentors in your areas of interest.",
                },
                {
                  step: "04",
                  title: "Learn & Earn",
                  description: "Take courses, earn credentials, and become a mentor yourself.",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="text-5xl font-bold text-primary/10 mb-4">{step.step}</div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-8 right-0 translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Mentors Section */}
        <section id="mentors" className="py-20 bg-muted/50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Featured Mentors</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Learn from the best in their fields with verified credentials and proven expertise.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Alex Johnson",
                  title: "Blockchain Developer",
                  rating: 4.9,
                  students: 1243,
                  skills: ["Solidity", "Smart Contracts", "Web3.js"],
                },
                {
                  name: "Sarah Chen",
                  title: "UX/UI Designer",
                  rating: 4.8,
                  students: 856,
                  skills: ["Figma", "User Research", "Prototyping"],
                },
                {
                  name: "Michael Rodriguez",
                  title: "Data Scientist",
                  rating: 4.7,
                  students: 1089,
                  skills: ["Python", "Machine Learning", "Data Visualization"],
                },
              ].map((mentor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-background rounded-xl p-6 shadow-sm border hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {mentor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{mentor.name}</h3>
                      <p className="text-muted-foreground">{mentor.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center">
                      <div className="text-yellow-500">★</div>
                      <span className="ml-1 font-medium">{mentor.rating}</span>
                    </div>
                    <div className="text-muted-foreground text-sm">{mentor.students} students</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.skills.map((skill, skillIndex) => (
                      <span key={skillIndex} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full">
                    View Profile
                  </Button>
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button variant="outline" size="lg">
                View All Mentors
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Start Your Learning Journey?</h2>
              <p className="text-primary-foreground/80 mb-8">
                Join thousands of learners and mentors on our platform and start exchanging skills today.
              </p>
              <Button size="lg" variant="secondary" className="group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    About us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Help center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Partners
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Cookie policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SkillSwap. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

