import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface KpiCardProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  hint?: string
  tone?: 'default' | 'success' | 'warning' | 'destructive' | 'primary'
}

export function KpiCard({ label, value, icon: Icon, hint, tone = 'default' }: KpiCardProps) {
  const toneStyles: Record<NonNullable<KpiCardProps['tone']>, string> = {
    default: 'bg-muted text-muted-foreground group-hover:bg-muted/80',
    primary: 'bg-primary/10 text-primary group-hover:bg-primary/20',
    success: 'bg-success/10 text-success group-hover:bg-success/20',
    warning: 'bg-warning/15 text-warning-foreground group-hover:bg-warning/25',
    destructive: 'bg-destructive/10 text-destructive group-hover:bg-destructive/20',
  }
  return (
    <Card className="group relative overflow-hidden p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 cursor-default">
      {/* Elemento decorativo de fondo */}
      <div className="absolute -right-4 -top-4 size-24 rounded-full bg-gradient-to-br from-transparent to-black/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:to-white/5" />
      
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground transition-colors group-hover:text-foreground">{label}</p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-foreground/90 transition-transform duration-300 group-hover:scale-105 group-hover:origin-left">{value}</p>
          {hint && <p className="mt-2 text-xs text-muted-foreground/80">{hint}</p>}
        </div>
        <div className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm', toneStyles[tone])}>
          <Icon className="size-6 transition-transform duration-300" />
        </div>
      </div>
    </Card>
  )
}
