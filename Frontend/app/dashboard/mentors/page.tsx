"use client"

import dynamic from "next/dynamic"
import { DashboardLayout } from "@/components/dashboard-layout"

const MentorsList = dynamic(() => import("@/components/mentors-list").then(mod => mod.MentorsList), {
  ssr: false
})

export default function MentorsPage() {
  return (
    <DashboardLayout>
      <MentorsList />
    </DashboardLayout>
  )
}
