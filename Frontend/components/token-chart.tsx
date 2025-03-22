"use client"

import {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Area,
  AreaChart,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

const data = [
  { month: "Jan", tokens: 200 },
  { month: "Feb", tokens: 350 },
  { month: "Mar", tokens: 450 },
  { month: "Apr", tokens: 650 },
  { month: "May", tokens: 850 },
  { month: "Jun", tokens: 950 },
  { month: "Jul", tokens: 1100 },
  { month: "Aug", tokens: 1250 },
]

export function TokenChart() {
  return (
    <ChartContainer className="aspect-[4/3] sm:aspect-[2/1] h-full w-full">
      <Chart className="h-full w-full">
        <AreaChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary)/0.2)"
            strokeWidth={2}
          />
        </AreaChart>
      </Chart>
    </ChartContainer>
  )
}

