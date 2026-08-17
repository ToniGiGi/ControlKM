'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { currency, expenseLabel, type ExpenseCategory } from '@/lib/mock-data'

const trendConfig = {
  gasolina: { label: 'Gasolina', color: 'var(--chart-1)' },
  mantenimiento: { label: 'Mantenimiento', color: 'var(--chart-2)' },
  otros: { label: 'Otros', color: 'var(--chart-3)' },
} satisfies ChartConfig

export function ExpenseTrendChart({
  data,
}: {
  data: { mes: string; gasolina: number; mantenimiento: number; otros: number }[]
}) {
  return (
    <ChartContainer config={trendConfig} className="h-64 w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          {Object.entries(trendConfig).map(([key, cfg]) => (
            <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={cfg.color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={cfg.color} stopOpacity={0.04} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area dataKey="gasolina" type="monotone" stroke="var(--chart-1)" fill="url(#fill-gasolina)" stackId="1" />
        <Area dataKey="mantenimiento" type="monotone" stroke="var(--chart-2)" fill="url(#fill-mantenimiento)" stackId="1" />
        <Area dataKey="otros" type="monotone" stroke="var(--chart-3)" fill="url(#fill-otros)" stackId="1" />
      </AreaChart>
    </ChartContainer>
  )
}

const donutColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--primary)',
]

export function CategoryDonut({ data }: { data: { categoria: ExpenseCategory; monto: number }[] }) {
  const chartData = data
    .filter((d) => d.monto > 0)
    .sort((a, b) => b.monto - a.monto)
    .map((d, i) => ({
      name: expenseLabel[d.categoria],
      value: d.monto,
      fill: donutColors[i % donutColors.length],
    }))

  const config: ChartConfig = Object.fromEntries(
    chartData.map((d) => [d.name, { label: d.name, color: d.fill }]),
  )

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-64">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent hideLabel formatter={(v) => currency(Number(v))} />}
        />
        <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={58} strokeWidth={2}>
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="flex-wrap gap-x-3 gap-y-1 [&>*]:justify-start"
        />
      </PieChart>
    </ChartContainer>
  )
}
