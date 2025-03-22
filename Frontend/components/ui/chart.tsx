"use client"

import React from "react"
import {
  LineChart as RechartsLineChart,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  Tooltip,
  AreaChart as RechartsAreaChart,
} from "recharts"

interface ChartTooltipContentProps {
  payload: any[]
  label: string
}

export function ChartTooltipContent({ payload, label }: ChartTooltipContentProps) {
  if (!payload || payload.length === 0) {
    return null
  }

  return (
    <div className="rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
      <div className="mb-2 text-sm font-medium">{label}</div>
      <ul className="grid gap-1">
        {payload.map((item, index) => (
          <li key={index} className="flex items-center justify-between text-xs">
            <span className="mr-2">{item.dataKey}:</span>
            <span className="font-medium">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const ChartContainer = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return <div className={`w-full relative ${className}`}>{children}</div>
}

export const Chart = ({ children }: { children: React.ReactNode }) => {
  return <React.Fragment>{children}</React.Fragment>
}

export const LineChart = RechartsLineChart
export const Line = Line
export const XAxis = RechartsXAxis
export const YAxis = RechartsYAxis
export const AreaChart = RechartsAreaChart
export const Area = Area
export const ChartTooltip = Tooltip

