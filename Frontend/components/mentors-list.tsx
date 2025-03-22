"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Filter, Search, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const mentors = [
  {
    id: 1,
    name: "Sarah Chen",
    title: "UX/UI Designer",
    rating: 4.8,
    students: 856,
    hourlyRate: 50,
    skills: ["Figma", "User Research", "Prototyping", "UI Design"],
    availability: "Mon, Wed, Fri",
    verified: true,
    bio: "Senior UX/UI designer with 8+ years of experience working with startups and enterprise clients. Specialized in creating intuitive and accessible user interfaces.",
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    id: 2,
    name: "Alex Johnson",
    title: "Blockchain Developer",
    rating: 4.9,
    students: 1243,
    hourlyRate: 75,
    skills: ["Solidity", "Smart Contracts", "Web3.js", "Ethereum"],
    availability: "Tue, Thu, Sat",
    verified: true,
    bio: "Blockchain expert with experience building DApps and smart contracts. Previously worked at Ethereum Foundation and contributed to multiple open-source projects.",
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    title: "Data Scientist",
    rating: 4.7,
    students: 1089,
    hourlyRate: 65,
    skills: ["Python", "Machine Learning", "Data Visualization", "Statistics"],
    availability: "Mon, Tue, Wed, Thu",
    verified: true,
    bio: "Data scientist with a PhD in Computer Science. Specializes in machine learning algorithms and data visualization techniques.",
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    id: 4,
    name: "Emma Wilson",
    title: "Frontend Developer",
    rating: 4.9,
    students: 756,
    hourlyRate: 60,
    skills: ["React", "TypeScript", "UI/UX", "Next.js"],
    availability: "Wed, Thu, Fri",
    verified: true,
    bio: "Frontend developer passionate about creating beautiful and performant web applications. Expert in React and modern JavaScript frameworks.",
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    id: 5,
    name: "David Kim",
    title: "DevOps Engineer",
    rating: 4.8,
    students: 543,
    hourlyRate: 70,
    skills: ["Docker", "Kubernetes", "CI/CD", "AWS"],
    availability: "Mon, Wed, Fri",
    verified: true,
    bio: "DevOps engineer with expertise in containerization, CI/CD pipelines, and cloud infrastructure. AWS certified solutions architect.",
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    id: 6,
    name: "Priya Sharma",
    title: "AI Specialist",
    rating: 4.7,
    students: 678,
    hourlyRate: 80,
    skills: ["Machine Learning", "Python", "TensorFlow", "NLP"],
    availability: "Tue, Thu, Sat",
    verified: true,
    bio: "AI researcher with focus on natural language processing and computer vision. Published multiple papers in top AI conferences.",
    image: "/placeholder.svg?height=400&width=400",
  },
]

export function MentorsList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("rating")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesSkills = selectedSkills.length === 0 || selectedSkills.some((skill) => mentor.skills.includes(skill))

    const matchesPrice = mentor.hourlyRate >= priceRange[0] && mentor.hourlyRate <= priceRange[1]

    return matchesSearch && matchesSkills && matchesPrice
  })

  const sortedMentors = [...filteredMentors].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating
    if (sortBy === "students") return b.students - a.students
    if (sortBy === "price_low") return a.hourlyRate - b.hourlyRate
    if (sortBy === "price_high") return b.hourlyRate - a.hourlyRate
    return 0
  })

  const allSkills = Array.from(new Set(mentors.flatMap((mentor) => mentor.skills))).sort()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentors</h1>
          <p className="text-muted-foreground">Find the perfect mentor for your learning journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Mentors</DialogTitle>
                <DialogDescription>Narrow down mentors based on your preferences</DialogDescription>
              </DialogHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {allSkills.map((skill) => (
                      <Button
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (selectedSkills.includes(skill)) {
                            setSelectedSkills(selectedSkills.filter((s) => s !== skill))
                          } else {
                            setSelectedSkills([...selectedSkills, skill])
                          }
                        }}
                        className="h-7 text-xs"
                      >
                        {skill}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Price Range (per hour)</h3>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number.parseInt(e.target.value), priceRange[1]])}
                      className="h-8"
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      min="0"
                      max="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number.parseInt(e.target.value)])}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search mentors..."
              className="pl-8 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select defaultValue={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="students">Most Students</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedMentors.map((mentor) => (
          <motion.div
            key={mentor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16">
                      <img
                        alt={mentor.name}
                        className="rounded-full object-cover"
                        height="64"
                        src={mentor.image}
                        style={{
                          aspectRatio: "64/64",
                          objectFit: "cover",
                        }}
                        width="64"
                      />
                      {mentor.verified && (
                        <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{mentor.name}</h3>
                      <p className="text-sm text-muted-foreground">{mentor.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          <span className="text-sm font-medium">{mentor.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{mentor.students} students</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${mentor.hourlyRate}</div>
                    <div className="text-sm text-muted-foreground">per hour</div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">{mentor.bio}</p>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {mentor.skills.map((skill) => (
                      <div
                        key={skill}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{mentor.availability}</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="ml-auto">
                        Book Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Book a Session with {mentor.name}</DialogTitle>
                        <DialogDescription>Schedule a mentoring session at your preferred time.</DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                          Available on: <span className="font-medium text-foreground">{mentor.availability}</span>
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Rate: <span className="font-medium text-foreground">${mentor.hourlyRate} per hour</span>
                        </p>
                      </div>
                      <DialogFooter>
                        <Button>Continue to Booking</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
