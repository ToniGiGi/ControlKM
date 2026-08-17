'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  Fuel, 
  TriangleAlert, 
  Activity,
  Calendar,
  TrendingUp,
  Car,
  Printer
} from 'lucide-react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { PrintableReport } from './printable-report'

type ReportsDashboardProps = {
  expenses: any[]
  vehicles: any[]
  maintenances: any[]
  fuelRequests: any[]
  incidents: any[]
}

const COLORS = ['#00173A', '#1E3A8A', '#009142', '#064E3B', '#14532D', '#7F1D1D', '#991B1B', '#B91C1C', '#F59E0B']

export function ReportsDashboard({ expenses, vehicles, maintenances, fuelRequests, incidents }: ReportsDashboardProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Función genérica para filtrar por fechas
  const isWithinDateRange = (dateInput: any) => {
    if (!startDate && !endDate) return true
    if (!dateInput) return false
    
    const d = new Date(dateInput)
    d.setHours(0, 0, 0, 0)
    
    if (startDate) {
      const s = new Date(startDate)
      s.setHours(0, 0, 0, 0)
      s.setDate(s.getDate() + 1)
      if (d < s) return false
    }
    
    if (endDate) {
      const e = new Date(endDate)
      e.setHours(0, 0, 0, 0)
      e.setDate(e.getDate() + 1)
      if (d > e) return false
    }
    
    return true
  }

  // Datos filtrados
  const filteredExpenses = useMemo(() => expenses.filter(e => isWithinDateRange(e.fecha)), [expenses, startDate, endDate])
  const filteredMaintenances = useMemo(() => maintenances.filter(m => isWithinDateRange(m.fecha)), [maintenances, startDate, endDate])
  const filteredFuelRequests = useMemo(() => fuelRequests.filter(f => f.estado === 'APROBADA' && isWithinDateRange(f.fechaSolicitud)), [fuelRequests, startDate, endDate])
  const filteredIncidents = useMemo(() => incidents.filter(i => isWithinDateRange(i.fecha)), [incidents, startDate, endDate])

  // --- KPIs Calculations ---
  
  // 1. Gasto Total
  const totalGasto = useMemo(() => {
    const sumExpenses = filteredExpenses.reduce((sum, item) => sum + (item.monto || 0), 0)
    const sumMaintenances = filteredMaintenances.reduce((sum, item) => sum + (item.costo || 0), 0)
    const sumFuel = filteredFuelRequests.reduce((sum, item) => sum + (item.costoTotal || 0), 0)
    const sumIncidents = filteredIncidents.reduce((sum, item) => sum + (item.costo || 0), 0)
    return sumExpenses + sumMaintenances + sumFuel + sumIncidents
  }, [filteredExpenses, filteredMaintenances, filteredFuelRequests, filteredIncidents])

  // 2. Combustible
  const totalLitros = useMemo(() => {
    return filteredFuelRequests.reduce((sum, item) => sum + (item.litrosSolicitados || 0), 0)
  }, [filteredFuelRequests])

  // 3. Rendimiento Promedio (km/l)
  const rendimientoPromedio = useMemo(() => {
    if (filteredFuelRequests.length === 0) return 0
    const sumRendimientos = filteredFuelRequests.reduce((sum, item) => sum + (item.rendimiento || 0), 0)
    return (sumRendimientos / filteredFuelRequests.length).toFixed(1)
  }, [filteredFuelRequests])

  // 4. Incidencias Abiertas
  const incidenciasAbiertas = useMemo(() => {
    return filteredIncidents.filter(i => i.estado === 'ABIERTA' || i.estado === 'EN_REVISION').length
  }, [filteredIncidents])


  // --- Chart Data Calculations ---

  // Chart 1: Gastos por Categoría (Pie Chart)
  const expensesByCategoryData = useMemo(() => {
    const data: Record<string, number> = {
      'Combustible': filteredFuelRequests.reduce((sum, f) => sum + (f.costoTotal || 0), 0),
      'Mantenimientos': filteredMaintenances.reduce((sum, m) => sum + (m.costo || 0), 0),
      'Incidencias': filteredIncidents.reduce((sum, i) => sum + (i.costo || 0), 0),
    }

    filteredExpenses.forEach(exp => {
      const cat = exp.categoria.charAt(0) + exp.categoria.slice(1).toLowerCase()
      if (!data[cat]) data[cat] = 0
      data[cat] += (exp.monto || 0)
    })

    return Object.keys(data)
      .filter(key => data[key] > 0)
      .map(key => ({ name: key, value: data[key] }))
      .sort((a, b) => b.value - a.value)
  }, [filteredExpenses, filteredMaintenances, filteredFuelRequests, filteredIncidents])

  // Chart 2: Gastos por Vehículo (Bar Chart)
  const expensesByVehicleData = useMemo(() => {
    const data: Record<string, number> = {}

    const addCost = (vId: string, amount: number) => {
      if (!amount || !vId) return
      const v = vehicles.find(veh => veh.id === vId)
      if (!v) return
      const name = v.nombreInterno || v.placas
      if (!data[name]) data[name] = 0
      data[name] += amount
    }

    filteredFuelRequests.forEach(f => addCost(f.vehiculoId, f.costoTotal))
    filteredMaintenances.forEach(m => addCost(m.vehiculoId, m.costo))
    filteredExpenses.forEach(e => addCost(e.vehiculoId, e.monto))
    filteredIncidents.forEach(i => addCost(i.vehiculoId, i.costo))

    return Object.keys(data)
      .map(key => ({ name: key, total: data[key] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10) // Top 10 vehículos
  }, [filteredExpenses, filteredMaintenances, filteredFuelRequests, filteredIncidents, vehicles])

  // --- Nuevas Métricas Avanzadas ---
  
  // Top 3 Conductores (por distancia)
  const topDrivers = useMemo(() => {
    const driversMap: Record<string, number> = {}
    filteredFuelRequests.forEach(f => {
      const name = f.solicitanteNombre || 'Desconocido'
      if (!driversMap[name]) driversMap[name] = 0
      driversMap[name] += (f.kmAproximado || 0) + (f.kmHolgura || 0)
    })
    return Object.keys(driversMap)
      .map(name => ({ name, km: driversMap[name] }))
      .sort((a, b) => b.km - a.km)
      .slice(0, 3)
  }, [filteredFuelRequests])

  // Categoría de Mayor Gasto
  const topExpenseCategory = useMemo(() => {
    if (expensesByCategoryData.length === 0) return null
    return expensesByCategoryData[0] // Ya viene ordenado de mayor a menor
  }, [expensesByCategoryData])

  // Vehículo con más incidentes
  const topIncidentVehicle = useMemo(() => {
    const countsMap: Record<string, number> = {}
    filteredIncidents.forEach(i => {
      const v = vehicles.find(veh => veh.id === i.vehiculoId)
      const name = v ? (v.nombreInterno || v.placas) : 'Desconocido'
      if (!countsMap[name]) countsMap[name] = 0
      countsMap[name] += 1
    })
    const sorted = Object.keys(countsMap)
      .map(name => ({ name, count: countsMap[name] }))
      .sort((a, b) => b.count - a.count)
    return sorted.length > 0 ? sorted[0] : null
  }, [filteredIncidents, vehicles])


  // Helpers
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  const formatNumber = (val: number) => new Intl.NumberFormat('es-MX').format(val)

  return (
    <>
    <div className="print:hidden flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-screen-2xl mx-auto w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-start justify-between">
        <PageHeader
          title="Dashboard de Reportes"
          description="Visión general del estado operativo y financiero de la flotilla"
        />
        
        {/* Filtro Global de Fechas */}
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-card border rounded-lg p-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtro Global:</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 border rounded-md px-2 py-1 text-sm">
            <span className="text-xs text-muted-foreground">Desde</span>
            <input 
              type="date" 
              className="bg-transparent outline-none cursor-pointer w-[110px]"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-muted/50 border rounded-md px-2 py-1 text-sm">
            <span className="text-xs text-muted-foreground">Hasta</span>
            <input 
              type="date" 
              className="bg-transparent outline-none cursor-pointer w-[110px]"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate('') }} className="h-8 px-2">
              Limpiar
            </Button>
          )}
          
          {/* Botón de impresión (oculto al imprimir) */}
          <Button 
            variant="default" 
            size="sm" 
            className="h-8 gap-2 ml-2 print:hidden bg-primary text-primary-foreground" 
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            <span className="hidden sm:inline">Generar PDF</span>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total Operativo</CardTitle>
            <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalGasto)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Combustible, mantenimientos y gastos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumo Combustible</CardTitle>
            <Fuel className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalLitros)} L</div>
            <p className="text-xs text-muted-foreground mt-1">
              Litros autorizados y confirmados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimiento Global</CardTitle>
            <TrendingUp className="size-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rendimientoPromedio} km/L</div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio de la flotilla en viajes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidencias Pendientes</CardTitle>
            <TriangleAlert className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{incidenciasAbiertas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Casos abiertos o en revisión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hallazgos (Nuevas Métricas) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
              🏆 Top Conductores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topDrivers.length > 0 ? (
              <ul className="space-y-2">
                {topDrivers.map((d, i) => (
                  <li key={i} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground">{i+1}. {d.name}</span>
                    <span className="text-muted-foreground">{formatNumber(d.km)} km</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sin registros de viaje</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-400">
              💰 Categoría de Mayor Gasto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topExpenseCategory ? (
              <div>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-500">{topExpenseCategory.name}</p>
                <p className="text-sm text-muted-foreground font-medium">{formatCurrency(topExpenseCategory.value)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin gastos registrados</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-800 dark:text-red-400">
              ⚠️ Vehículo con más incidentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topIncidentVehicle ? (
              <div>
                <p className="text-xl font-bold text-red-700 dark:text-red-500">{topIncidentVehicle.name}</p>
                <p className="text-sm text-muted-foreground font-medium">{topIncidentVehicle.count} incidencias registradas</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Cero incidencias registradas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Distribución de Gastos */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="size-4" /> Distribución de Gastos</CardTitle>
            <CardDescription>¿En qué se gasta más el presupuesto?</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {expensesByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expensesByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: any) => formatCurrency(value as number)} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No hay datos en este rango de fechas.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 10 Vehículos */}
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Car className="size-4" /> Top 10 Vehículos con Mayor Gasto</CardTitle>
            <CardDescription>Suma de combustible, mantenimientos, incidencias y extras</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {expensesByVehicleData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesByVehicleData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                    axisLine={false} 
                    tickLine={false}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value / 1000}k`} 
                    tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                    formatter={(value: number) => formatCurrency(value)} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No hay datos en este rango de fechas.
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>

    <PrintableReport 
      startDate={startDate}
      endDate={endDate}
      totalGasto={totalGasto}
      totalLitros={totalLitros}
      rendimientoPromedio={rendimientoPromedio}
      incidenciasAbiertas={incidenciasAbiertas}
      topDrivers={topDrivers}
      topExpenseCategory={topExpenseCategory}
      topIncidentVehicle={topIncidentVehicle}
      expensesByCategoryData={expensesByCategoryData}
      expensesByVehicleData={expensesByVehicleData}
    />
    </>
  )
}
