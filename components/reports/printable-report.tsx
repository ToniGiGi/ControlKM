'use client'

import Image from 'next/image'

type PrintableReportProps = {
  startDate: string
  endDate: string
  totalGasto: number
  totalLitros: number
  rendimientoPromedio: string | number
  incidenciasAbiertas: number
  topDrivers: { name: string; km: number }[]
  topExpenseCategory: { name: string; value: number } | null
  topIncidentVehicle: { name: string; count: number } | null
  expensesByCategoryData: { name: string; value: number }[]
  expensesByVehicleData: { name: string; total: number }[]
}

export function PrintableReport({
  startDate,
  endDate,
  totalGasto,
  totalLitros,
  rendimientoPromedio,
  incidenciasAbiertas,
  topDrivers,
  topExpenseCategory,
  topIncidentVehicle,
  expensesByCategoryData,
  expensesByVehicleData,
}: PrintableReportProps) {
  
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)
  const formatNumber = (val: number) => new Intl.NumberFormat('es-MX').format(val)

  const formatLocalDate = (dateStr: string) => {
    const d = new Date(dateStr)
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset())
    return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  }

  const dateString = startDate && endDate 
    ? `Del ${formatLocalDate(startDate)} al ${formatLocalDate(endDate)}`
    : startDate 
      ? `A partir del ${formatLocalDate(startDate)}`
      : endDate 
        ? `Hasta el ${formatLocalDate(endDate)}`
        : 'Histórico Completo'

  const currentDateTime = new Intl.DateTimeFormat('es-MX', { 
    day: '2-digit', month: '2-digit', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', hour12: false 
  }).format(new Date())

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 10mm; size: auto; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
      <div className="hidden print:block bg-white text-black min-h-screen w-full font-sans text-sm p-4 max-w-[210mm] mx-auto">
        
        {/* Header Corporativo */}
        <div className="border-b-4 border-emerald-800 pb-4 mb-6 flex justify-between items-end">
          <div className="flex items-center gap-4">
            <Image 
              src="/QRQ_LOGOTIPO.jpg" 
              alt="QRQ Logo" 
              width={80} 
              height={80} 
              className="object-contain"
            />
            <div>
              <h1 className="text-2xl font-black text-emerald-900 tracking-tight uppercase">Químicos y Reactivos de Querétaro</h1>
              <p className="text-emerald-700 font-semibold mt-1">Reporte Operativo y Financiero de Flotilla</p>
            </div>
          </div>
          <div className="text-right text-gray-500 text-xs">
            <p>Fecha de emisión: <span className="font-semibold">{currentDateTime}</span></p>
            <p className="font-bold text-gray-800 mt-1 bg-gray-100 px-2 py-1 inline-block rounded">{dateString}</p>
          </div>
        </div>

      {/* Resumen Ejecutivo (KPIs) */}
      <div className="mb-8">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-4 text-gray-800">Resumen Ejecutivo</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-bold uppercase">Gasto Total</p>
            <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(totalGasto)}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-bold uppercase">Combustible</p>
            <p className="text-xl font-black text-gray-800 mt-1">{formatNumber(totalLitros)} L</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-bold uppercase">Rendimiento Prom.</p>
            <p className="text-xl font-black text-gray-800 mt-1">{rendimientoPromedio} km/L</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500 font-bold uppercase">Incidencias</p>
            <p className="text-xl font-black text-red-600 mt-1">{incidenciasAbiertas} Pendientes</p>
          </div>
        </div>
      </div>

      {/* Hallazgos Principales */}
      <div className="mb-8">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-4 text-gray-800">Hallazgos y Métricas Destacadas</h2>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Top Conductores */}
          <div>
            <h3 className="text-sm font-bold text-emerald-900 bg-emerald-50 p-2 rounded-t-md border-b-2 border-emerald-200">🏆 Top 3 Conductores (Distancia)</h3>
            <div className="border border-gray-200 rounded-b-md overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-2 border-b border-gray-200 font-semibold">Empleado</th>
                    <th className="p-2 border-b border-gray-200 font-semibold text-right">Kilómetros Recorridos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topDrivers.length > 0 ? topDrivers.map((driver, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="p-2 text-gray-800"><span className="font-bold text-emerald-700 mr-1">{idx + 1}.</span> {driver.name}</td>
                      <td className="p-2 text-right font-medium text-gray-700">{formatNumber(driver.km)} km</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={2} className="p-3 text-center text-gray-500 italic">Sin datos registrados en este periodo</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vehículo con problemas y Mayor Gasto */}
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <h3 className="text-sm font-bold text-red-800 mb-1">⚠️ Vehículo con más incidentes</h3>
              {topIncidentVehicle ? (
                <p className="text-gray-800">El vehículo <strong className="text-red-700">{topIncidentVehicle.name}</strong> registró <strong>{topIncidentVehicle.count}</strong> incidencias en este periodo.</p>
              ) : (
                <p className="text-gray-600">No se registraron incidencias en este periodo.</p>
              )}
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm font-bold text-amber-800 mb-1">💰 Categoría de Mayor Gasto</h3>
              {topExpenseCategory ? (
                <p className="text-gray-800">El rubro que más consumió presupuesto fue <strong>{topExpenseCategory.name}</strong> con un total de <strong className="text-amber-700">{formatCurrency(topExpenseCategory.value)}</strong>.</p>
              ) : (
                <p className="text-gray-600">No se registraron gastos en este periodo.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desglose Financiero */}
      <div className="mb-8">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1 mb-4 text-gray-800">Desglose Financiero</h2>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Distribución */}
          <div>
            <h3 className="text-sm font-bold text-emerald-900 bg-emerald-50 p-2 rounded-t-md border-b-2 border-emerald-200">Gastos por Categoría</h3>
            <div className="border border-gray-200 rounded-b-md overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-2 border-b border-gray-200 font-semibold">Categoría</th>
                    <th className="p-2 border-b border-gray-200 font-semibold text-right">Monto (MXN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expensesByCategoryData.map((cat, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="p-2 text-gray-800">{cat.name}</td>
                      <td className="p-2 text-right font-medium text-gray-700">{formatCurrency(cat.value)}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50/80">
                    <td className="p-2 border-t-2 border-emerald-200 font-bold text-emerald-900 uppercase text-xs tracking-widest">Total</td>
                    <td className="p-2 border-t-2 border-emerald-200 text-right font-black text-emerald-700">{formatCurrency(totalGasto)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Vehículos */}
          <div>
            <h3 className="text-sm font-bold text-emerald-900 bg-emerald-50 p-2 rounded-t-md border-b-2 border-emerald-200">Vehículos con Mayor Inversión</h3>
            <div className="border border-gray-200 rounded-b-md overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-left text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-2 border-b border-gray-200 font-semibold">Vehículo</th>
                    <th className="p-2 border-b border-gray-200 font-semibold text-right">Costo Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expensesByVehicleData.slice(0, 5).map((veh, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="p-2 text-gray-800 font-medium">{veh.name}</td>
                      <td className="p-2 text-right font-semibold text-emerald-700">{formatCurrency(veh.total)}</td>
                    </tr>
                  ))}
                  {expensesByVehicleData.length === 0 && (
                    <tr><td colSpan={2} className="p-3 text-center text-gray-500 italic">No hay registros de gasto</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-12 flex justify-between items-center text-xs text-gray-400 border-t-2 border-emerald-800/20 pt-4">
        <p>Generado automáticamente por el <strong>Sistema de Gestión de Flotilla</strong></p>
        <p className="font-bold text-emerald-800">QRQ FleetControl</p>
      </div>
    </div>
    </>
  )
}
