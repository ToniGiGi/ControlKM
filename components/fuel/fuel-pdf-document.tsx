'use client'

import { useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type FuelPdfDocumentProps = {
  data: any
  onClose: () => void
}

export function FuelPdfDocument({ data, onClose }: FuelPdfDocumentProps) {
  
  // Formatters
  const formatDate = (d: any) => d ? new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d)) : ''
  const formatMoney = (val: number) => `$ ${Number(val || 0).toFixed(2)}`
  const formatNumber = (val: number) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handlePrint = () => {
    window.print()
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-white overflow-y-auto print:bg-transparent text-black"
      style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
    >
      {/* Botones de control (Ocultos al imprimir) */}
      <div className="sticky top-0 left-0 right-0 bg-slate-100 border-b p-4 flex justify-between items-center print:hidden shadow-sm">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <Printer className="size-5" />
          <span>Vista Previa de Impresión</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
            Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* DOCUMENTO A IMPRIMIR */}
      <div className="max-w-[21cm] mx-auto p-8 bg-white text-[11px] leading-tight font-sans print:p-0 print:m-0 w-full" id="print-area">
        
        {/* ENCABEZADO */}
        <table className="w-full border-collapse border border-black mb-4 text-center">
          <tbody>
            <tr>
              <td rowSpan={2} className="border border-black w-1/4 p-2 align-middle text-center">
                <img 
                  src="/QRQ_LOGOTIPO.jpg" 
                  alt="Químicos y Reactivos de Querétaro S.A. de C.V." 
                  className="max-h-16 mx-auto object-contain"
                />
              </td>
              <td className="border border-black bg-gray-100 font-bold w-1/4 py-1">Proceso</td>
              <td className="border border-black w-2/4 py-1" colSpan={3}>Cuentas por pagar</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1">Departamento</td>
              <td className="border border-black py-1" colSpan={3}>Administrativo y finanzas</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1">Titulo</td>
              <td className="border border-black py-1">Solicitud de viáticos y combustible</td>
              <td className="border border-black bg-gray-100 font-bold py-1">Código</td>
              <td className="border border-black py-1" colSpan={2}>FC-ALM-001.01</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1">Fecha elaboración</td>
              <td className="border border-black py-1">Julio 2026</td>
              <td className="border border-black bg-gray-100 font-bold py-1">Vigencia</td>
              <td className="border border-black py-1">Julio 2027</td>
              <td className="border border-black bg-gray-100 font-bold py-1 w-[10%]">Versión 3.0</td>
            </tr>
          </tbody>
        </table>

        {/* DATOS GENERALES */}
        <table className="w-full border-collapse border border-black mb-0">
          <tbody>
            <tr>
              <td colSpan={4} className="border border-black bg-emerald-600 text-white font-bold text-center py-1.5 uppercase">
                Datos generales del solicitante
              </td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2 w-[20%]">Nombre:</td>
              <td className="border border-black py-1 px-2 w-[45%] uppercase">{data.solicitanteNombre}</td>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2 w-[20%]">Fecha de solicitud:</td>
              <td className="border border-black py-1 px-2 w-[15%] text-center">{formatDate(data.fechaSolicitud)}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Departamento:</td>
              <td className="border border-black py-1 px-2 uppercase font-bold">{data.departamento || 'No especificado'}</td>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Área / Puesto:</td>
              <td className="border border-black py-1 px-2 uppercase text-center font-bold">{data.area || 'No especificada'}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Motivo de solicitud:</td>
              <td className="border border-black py-1 px-2 uppercase" colSpan={3}>{data.motivo}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Número de tarjeta de gasolina (TOKA):</td>
              <td className="border border-black py-1 px-2 font-mono text-center tracking-wider">{data.tarjetaToka || 'N/A'}</td>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Número de tag:</td>
              <td className="border border-black py-1 px-2 font-mono text-center">{data.numeroTag || 'N/A'}</td>
            </tr>
            
            {/* GASOLINA */}
            <tr>
              <td colSpan={4} className="border border-black bg-emerald-600 text-white font-bold text-center py-1.5 uppercase">
                Gasolina
              </td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Unidad asignada:</td>
              <td className="border border-black py-1 px-2 text-center font-bold">{data.vehiculo?.nombreInterno} - {data.vehiculo?.placas}</td>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Ruta (s) a realizar:</td>
              <td className="border border-black py-1 px-2 text-center uppercase text-[10px] leading-tight">{data.rutas}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Kilometraje aproximado por recorrer:</td>
              <td className="border border-black py-1 px-2 text-center">{formatNumber(data.kmAproximado)}</td>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Km total + holgura:</td>
              <td className="border border-black py-1 px-2 text-center font-bold">{formatNumber(data.kmHolgura)}</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Rendimiento (Km/L):</td>
              <td className="border border-black py-1 px-2 text-center">{data.rendimiento} km/l</td>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Litros requeridos:</td>
              <td className="border border-black py-1 px-2 text-center">{formatNumber(data.litrosSolicitados)} L</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Tipo de Gasolina:</td>
              <td className="border border-black py-1 px-2 text-center">{data.tipoGasolina} ({formatMoney(data.precioGasolina)}/L)</td>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Subtotal Gasolina:</td>
              <td className="border border-black py-1 px-2 text-center font-bold">{formatMoney(data.costoGasolina)}</td>
            </tr>

            {/* CASETAS */}
            <tr>
              <td colSpan={4} className="border border-black bg-emerald-600 text-white font-bold text-center py-1.5 uppercase">
                Peajes y Casetas
              </td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Número de Casetas:</td>
              <td className="border border-black py-1 px-2 text-center">{data.numCasetas || 0}</td>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Costo Casetas:</td>
              <td className="border border-black py-1 px-2 text-center font-bold">{formatMoney(data.costoCasetas)}</td>
            </tr>

            {/* GRAN TOTAL */}
            <tr>
              <td colSpan={2} className="border-l border-b border-black py-4"></td>
              <td className="border border-black bg-gray-200 font-black text-sm py-2 px-2 text-right uppercase">
                Total Solicitado:
              </td>
              <td className="border border-black font-black text-sm py-2 px-2 text-center bg-green-50">
                {formatMoney(data.costoTotal)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* SECCIÓN DE FIRMAS */}
        <div className="mt-20 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="border-b border-black mb-2 mx-4 h-8"></div>
            <p className="font-bold text-xs">Solicita</p>
            <p className="text-[10px] uppercase">{data.solicitanteNombre}</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 mx-4 h-8"></div>
            <p className="font-bold text-xs">Revisa</p>
            <p className="text-[10px]">Supervisor de Flotilla</p>
          </div>
          <div>
            <div className="border-b border-black mb-2 mx-4 h-8"></div>
            <p className="font-bold text-xs">Autoriza</p>
            <p className="text-[10px]">Administrador General</p>
          </div>
        </div>

      </div>
    </div>
  )
}
