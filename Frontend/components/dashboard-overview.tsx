"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkillChart } from "@/components/skill-chart"

export function DashboardOverview() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, John! Here's an overview of your learning journey.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="teaching">Teaching</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Total Courses",
                value: "12",
                description: "+2 this month",
                icon: BookOpen,
                trend: "up",
              },
              {
                title: "Upcoming Sessions",
                value: "3",
                description: "Next in 2 days",
                icon: Calendar,
                trend: "neutral",
              },
              {
                title: "Token Balance",
                value: "1,250",
                description: "+150 this week",
                icon: DollarSign,
                trend: "up",
              },
              {
                title: "Skill Rating",
                value: "4.8",
                description: "Top 10% in Web Dev",
                icon: Star,
                trend: "up",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{item.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                      {item.trend === "up" && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Skill Progress</CardTitle>
                <CardDescription>Your skill development over time</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillChart />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Your scheduled learning sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Advanced React Patterns",
                      mentor: "Sarah Chen",
                      time: "Today, 3:00 PM",
                      duration: "60 min",
                    },
                    {
                      title: "Blockchain Fundamentals",
                      mentor: "Alex Johnson",
                      time: "Tomorrow, 2:00 PM",
                      duration: "90 min",
                    },
                    {
                      title: "Data Visualization",
                      mentor: "Michael Rodriguez",
                      time: "Friday, 11:00 AM",
                      duration: "60 min",
                    },
                  ].map((session, index) => (
                    <div key={index} className="flex items-start space-x-4 rounded-md border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{session.title}</p>
                        <p className="text-sm text-muted-foreground">with {session.mentor}</p>
                        <div className="flex items-center pt-2">
                          <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{session.time}</span>
                          <span className="mx-1 text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{session.duration}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Sessions
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
                <CardDescription>Your latest conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Sarah Chen",
                      message: "Looking forward to our session tomorrow!",
                      time: "2 hours ago",
                    },
                    {
                      name: "Alex Johnson",
                      message: "I've shared some resources for our next lesson.",
                      time: "Yesterday",
                    },
                    {
                      name: "Michael Rodriguez",
                      message: "Great progress on your last assignment!",
                      time: "2 days ago",
                    },
                  ].map((message, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {message.name.charAt(0)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{message.name}</p>
                        <p className="text-sm text-muted-foreground">{message.message}</p>
                        <p className="text-xs text-muted-foreground">{message.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Open Messages
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>Your active courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      title: "Advanced React Development",
                      progress: 75,
                      lessons: "9/12 completed",
                    },
                    {
                      title: "Blockchain Fundamentals",
                      progress: 40,
                      lessons: "4/10 completed",
                    },
                    {
                      title: "Data Science Essentials",
                      progress: 20,
                      lessons: "2/10 completed",
                    },
                  ].map((course, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{course.title}</div>
                        <div className="text-sm text-muted-foreground">{course.progress}%</div>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground">{course.lessons}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <BookOpen className="mr-2 h-4 w-4" />
                  View All Courses
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Mentors</CardTitle>
                <CardDescription>Based on your interests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Emma Wilson",
                      title: "Frontend Developer",
                      rating: 4.9,
                      skills: ["React", "TypeScript", "UI/UX"],
                    },
                    {
                      name: "David Kim",
                      title: "DevOps Engineer",
                      rating: 4.8,
                      skills: ["Docker", "Kubernetes", "CI/CD"],
                    },
                    {
                      name: "Priya Sharma",
                      title: "AI Specialist",
                      rating: 4.7,
                      skills: ["Machine Learning", "Python", "TensorFlow"],
                    },
                  ].map((mentor, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {mentor.name.charAt(0)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">{mentor.name}</p>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="ml-1 text-xs">{mentor.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{mentor.title}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {mentor.skills.map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Explore Mentors
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Learning Journey</CardTitle>
              <CardDescription>Track your progress across all courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[
                  {
                    title: "Advanced React Development",
                    instructor: "Sarah Chen",
                    progress: 75,
                    nextLesson: "React Performance Optimization",
                    lastActivity: "2 days ago",
                  },
                  {
                    title: "Blockchain Fundamentals",
                    instructor: "Alex Johnson",
                    progress: 40,
                    nextLesson: "Smart Contract Development",
                    lastActivity: "1 week ago",
                  },
                  {
                    title: "Data Science Essentials",
                    instructor: "Michael Rodriguez",
                    progress: 20,
                    nextLesson: "Statistical Analysis with Python",
                    lastActivity: "3 days ago",
                  },
                ].map((course, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      <Link href="#" className="text-primary text-sm flex items-center">
                        Continue Learning
                        <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground">Instructor: {course.instructor}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress: {course.progress}%</span>
                      <span>Last activity: {course.lastActivity}</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Next lesson:</span> {course.nextLesson}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Browse More Courses</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="teaching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Teaching</CardTitle>
              <CardDescription>Manage your courses and mentoring sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Your Courses</h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Introduction to Web Development",
                        students: 24,
                        rating: 4.7,
                        earnings: 1200,
                        status: "Active",
                      },
                      {
                        title: "JavaScript Fundamentals",
                        students: 18,
                        rating: 4.8,
                        earnings: 950,
                        status: "Active",
                      },
                    ].map((course, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{course.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {course.students} students
                            </div>
                            <div className="flex items-center">
                              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                              {course.rating}
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {course.earnings} tokens
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full dark:bg-green-800 dark:text-green-100">
                            {course.status}
                          </span>
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Upcoming Teaching Sessions</h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Web Development Q&A",
                        students: 8,
                        time: "Tomorrow, 4:00 PM",
                        duration: "60 min",
                      },
                      {
                        title: "JavaScript Advanced Concepts",
                        students: 5,
                        time: "Friday, 2:00 PM",
                        duration: "90 min",
                      },
                    ].map((session, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {session.students} attendees
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {session.time}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {session.duration}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Prepare
                          </Button>
                          <Button size="sm">Start</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Create New Course</Button>
              <Button>Schedule Session</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Total Earnings",
                value: "4,250",
                description: "tokens",
                change: "+12% from last month",
                trend: "up",
              },
              {
                title: "Available Balance",
                value: "1,250",
                description: "tokens",
                change: "Ready to withdraw",
                trend: "neutral",
              },
              {
                title: "Pending Earnings",
                value: "750",
                description: "tokens",
                change: "Will be released in 7 days",
                trend: "neutral",
              },
              {
                title: "Withdrawn",
                value: "2,250",
                description: "tokens",
                change: "All time",
                trend: "neutral",
              },
            ].map((item, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    {item.trend === "up" && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
                    {item.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Earnings History</CardTitle>
              <CardDescription>Your token earnings over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[
                  {
                    month: "March 2023",
                    transactions: [
                      {
                        title: "Course: Introduction to Web Development",
                        amount: 450,
                        date: "Mar 28, 2023",
                        type: "Course",
                      },
                      {
                        title: "1-on-1 Session with Emily",
                        amount: 120,
                        date: "Mar 15, 2023",
                        type: "Session",
                      },
                      {
                        title: "Group Workshop: JavaScript Basics",
                        amount: 350,
                        date: "Mar 10, 2023",
                        type: "Workshop",
                      },
                    ],
                  },
                  {
                    month: "February 2023",
                    transactions: [
                      {
                        title: "Course: JavaScript Fundamentals",
                        amount: 380,
                        date: "Feb 22, 2023",
                        type: "Course",
                      },
                      {
                        title: "1-on-1 Session with Michael",
                        amount: 120,
                        date: "Feb 18, 2023",
                        type: "Session",
                      },
                      {
                        title: "Skill Verification Bonus",
                        amount: 100,
                        date: "Feb 05, 2023",
                        type: "Bonus",
                      },
                    ],
                  },
                ].map((month, index) => (
                  <div key={index}>
                    <h3 className="font-medium text-lg mb-4">{month.month}</h3>
                    <div className="space-y-3">
                      {month.transactions.map((transaction, tIndex) => (
                        <div key={tIndex} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{transaction.title}</p>
                              <p className="text-sm text-muted-foreground">{transaction.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-muted">{transaction.type}</span>
                            <span className="font-medium text-green-600">+{transaction.amount}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Transactions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

