"use client"

import {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

const data = [
  {
    date: "Jan",
    "Web Development": 30,
    Blockchain: 10,
    "Data Science": 5,
  },
  {
    date: "Feb",
    "Web Development": 45,
    Blockchain: 20,
    "Data Science": 15,
  },
  {
    date: "Mar",
    "Web Development": 55,
    Blockchain: 35,
    "Data Science": 25,
  },
  {
    date: "Apr",
    "Web Development": 70,
    Blockchain: 45,
    "Data Science": 30,
  },
  {
    date: "May",
    "Web Development": 80,
    Blockchain: 60,
    "Data Science": 40,
  },
  {
    date: "Jun",
    "Web Development": 85,
    Blockchain: 70,
    "Data Science": 55,
  },
]

export function SkillChart() {
  return (
    <ChartContainer className="aspect-[4/3] sm:aspect-[2/1] h-full w-full">
      <Chart className="h-full w-full">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="Web Development"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Blockchain"
            stroke="hsl(var(--blue-500))"
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Data Science"
            stroke="hsl(var(--green-500))"
            strokeWidth={2}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </Chart>
    </ChartContainer>
  )
}

