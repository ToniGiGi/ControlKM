'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const config = {
  gasto: { label: 'Gasto', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function VehicleMonthlyChart({
  data,
}: {
  data: { mes: string; gasto: number }[]
}) {
  return (
    <ChartContainer config={config} className="h-56 w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="gasto" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
