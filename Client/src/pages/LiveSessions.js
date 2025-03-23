"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import api from "../services/api"

const LiveSessions = () => {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem("token")
      const response = await api.get("/sessions/getall", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setSessions(response.data)
    } catch (err) {
      console.error("Error fetching sessions:", err)
      setError("Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (sessionId) => {
    try {
      setError(null)
      setSuccess(null)

      const token = localStorage.getItem("token")
      const userId = localStorage.getItem("userId")

      await api.post(
        `/sessions/enroll`,
        {
          userId,
          sessionId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      setSuccess("Successfully enrolled in session!")
      fetchSessions()

      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err) {
      console.error("Enrollment error:", err)
      setError(err.response?.data?.message || "Failed to enroll in session")
    }
  }

  const filterSessions = () => {
    let filtered = [...sessions]

    if (searchQuery) {
      filtered = filtered.filter(
        (session) =>
          session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    const now = new Date()
    if (filter === "upcoming") {
      filtered = filtered.filter((session) => new Date(session.startTime) > now)
    } else if (filter === "past") {
      filtered = filtered.filter((session) => new Date(session.startTime) < now)
    }

    return filtered
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Live Sessions</h1>
        <p className="text-gray-400 text-lg mb-8">Join interactive live sessions with expert mentors.</p>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions..."
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            {["all", "upcoming", "past"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  filter === f 
                    ? "bg-indigo-600 text-white" 
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 text-green-500 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filterSessions().map((session) => {
            const isUpcoming = new Date(session.startTime) > new Date()

            return (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300"
              >
                <div className="p-6">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${
                    isUpcoming ? "bg-indigo-500/20 text-indigo-400" : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {isUpcoming ? "Upcoming" : "Past"}
                  </span>

                  <h3 className="text-xl font-semibold text-white mb-2">{session.title}</h3>
                  <p className="text-gray-400 mb-4">{session.description}</p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-gray-300">
                      <span className="w-24 text-gray-500">Mentor:</span>
                      <span>{session.mentor.name}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <span className="w-24 text-gray-500">Date:</span>
                      <span>{new Date(session.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <span className="w-24 text-gray-500">Time:</span>
                      <span>{new Date(session.startTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <span className="w-24 text-gray-500">Duration:</span>
                      <span>{session.duration} minutes</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <span className="w-24 text-gray-500">Price:</span>
                      <span>{session.price} tokens</span>
                    </div>
                  </div>

                  {isUpcoming && !session.enrolled && (
                    <button
                      onClick={() => handleEnroll(session._id)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-300"
                    >
                      Enroll Now
                    </button>
                  )}

                  {session.enrolled && (
                    <div className="text-center py-2 text-green-400 font-medium">
                      ✓ Enrolled
                    </div>
                  )}

                  {!isUpcoming && (
                    <div className="text-center py-2 text-gray-500 font-medium">
                      Session Ended
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {filterSessions().length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No sessions found</p>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default LiveSessions
