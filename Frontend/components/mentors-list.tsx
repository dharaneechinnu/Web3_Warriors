"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Filter, Search, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    // Search by name or title
    const matchesSearch =
      mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()))

    // Filter by selected skills
    const matchesSkills = selectedSkills.length === 0 || selectedSkills.some((skill) => mentor.skills.includes(skill))

    // Filter by price range
    const matchesPrice = mentor.hourlyRate >= priceRange[0] && mentor.hourlyRate <= priceRange[1]

    return matchesSearch && matchesSkills && matchesPrice
  })

  // Sort mentors
  const sortedMentors = [...filteredMentors].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating
    if (sortBy === "students") return b.students - a.students
    if (sortBy === "price_low") return a.hourlyRate - b.hourlyRate
    if (sortBy === "price_high") return b.hourlyRate - a.hourlyRate
    return 0
  })

  // Get all unique skills
  const allSkills = Array.from(new Set(mentors.flatMap((mentor) => mentor.skills))).sort()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mentors</h1>
          <p className="text-muted-foreground">Find the perfect mentor for your learning journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Mentors</SheetTitle>
                <SheetDescription>Narrow down mentors based on your preferences</SheetDescription>
              </SheetHeader>
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
                <Separator />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Availability</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <Button key={day} variant="outline" size="sm" className="h-7 text-xs">
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedSkills([])
                      setPriceRange([0, 100])
                    }}
                  >
                    Reset
                  </Button>
                  <Button>Apply Filters</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mentors..."
              className="pl-8 h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-8">
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

      <Tabs defaultValue="grid">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Showing {sortedMentors.length} mentors</p>
          <TabsList>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMentors.map((mentor, index) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden h-full">
                  <div className="aspect-video relative">
                    <img
                      src={mentor.image || "/placeholder.svg"}
                      alt={mentor.name}
                      className="object-cover w-full h-full"
                    />
                    {mentor.verified && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                        Verified
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{mentor.name}</h3>
                        <p className="text-muted-foreground">{mentor.title}</p>
                      </div>
                      <div className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                        <Star className="h-3 w-3 fill-primary mr-1" />
                        {mentor.rating}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{mentor.bio}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {mentor.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                      {mentor.skills.length > 3 && (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold">
                          +{mentor.skills.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm mb-4">
                      <div className="flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span>{mentor.students} students</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span>{mentor.availability}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold">{mentor.hourlyRate} tokens/hr</div>
                      <Button>View Profile</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="space-y-4">
            {sortedMentors.map((mentor, index) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={mentor.image || "/placeholder.svg"}
                          alt={mentor.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg">{mentor.name}</h3>
                              {mentor.verified && (
                                <div className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                                  Verified
                                </div>
                              )}
                            </div>
                            <p className="text-muted-foreground">{mentor.title}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                              <span className="font-medium">{mentor.rating}</span>
                            </div>
                            <div className="font-bold">{mentor.hourlyRate} tokens/hr</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{mentor.bio}</p>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {mentor.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>{mentor.students} students</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <span>Available: {mentor.availability}</span>
                            </div>
                          </div>
                          <Button>View Profile</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

