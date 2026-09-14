'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

type TravelPdfDocumentProps = {
  data: any
  onClose: () => void
}

export function TravelPdfDocument({ data, onClose }: TravelPdfDocumentProps) {

  const formatDate = (d: any) => d ? new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d)) : ''
  const formatLongDate = (d: any) => d ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : ''
  const formatMoney = (val: number) => `$ ${Number(val || 0).toFixed(2)}`

  const handlePrint = () => {
    const previousTitle = document.title
    const solicitante = (data.solicitanteNombre || 'Solicitud').trim()
    document.title = `SDV - ${solicitante}`

    const restoreTitle = () => {
      document.title = previousTitle
      window.removeEventListener('afterprint', restoreTitle)
    }
    window.addEventListener('afterprint', restoreTitle)

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
              <td className="border border-black py-1">Solicitud de viáticos</td>
              <td className="border border-black bg-gray-100 font-bold py-1">Código</td>
              <td className="border border-black py-1" colSpan={2}>FC-ALM-002.01</td>
            </tr>
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1">Fecha elaboración</td>
              <td className="border border-black py-1">{formatLongDate(data.fecha) || 'Julio 2026'}</td>
              <td className="border border-black bg-gray-100 font-bold py-1">Vigencia</td>
              <td className="border border-black py-1">Julio 2027</td>
              <td className="border border-black bg-gray-100 font-bold py-1 w-[10%]">Versión 1.0</td>
            </tr>
          </tbody>
        </table>

        {data.folio && (
          <div className="flex justify-end mb-2">
            <span className="border border-black bg-gray-100 font-bold font-mono px-3 py-1 text-xs">Folio: {data.folio}</span>
          </div>
        )}

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
              <td className="border border-black py-1 px-2 w-[30%] uppercase">{data.solicitanteNombre}</td>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2 w-[20%]">Fecha:</td>
              <td className="border border-black py-1 px-2 w-[30%] text-center">{formatDate(data.fecha)}</td>
            </tr>
            {data.fuelRequestFolio && (
              <tr>
                <td className="border border-black bg-gray-100 font-bold py-1 px-2">Vinculado a Combustible:</td>
                <td className="border border-black py-1 px-2 text-center font-bold font-mono" colSpan={3}>{data.fuelRequestFolio}</td>
              </tr>
            )}
            <tr>
              <td className="border border-black bg-gray-100 font-bold py-1 px-2">Puesto / Área:</td>
              <td className="border border-black py-1 px-2 uppercase" colSpan={data.asociadoPedido ? 1 : 3}>{data.puesto || 'No especificado'}</td>
              {data.asociadoPedido && (
                <>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Folio de Pedido:</td>
                  <td className="border border-black py-1 px-2 text-center font-bold">{data.folioPedido || 'N/A'}</td>
                </>
              )}
            </tr>

            {/* COMIDA */}
            {data.incluyeComida && (
              <>
                <tr>
                  <td colSpan={4} className="border border-black bg-emerald-600 text-white font-bold text-center py-1.5 uppercase">
                    Comida
                  </td>
                </tr>
                <tr>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Desayunos:</td>
                  <td className="border border-black py-1 px-2 text-center">{data.numDesayunos || 0}</td>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Comidas:</td>
                  <td className="border border-black py-1 px-2 text-center">{data.numComidas || 0}</td>
                </tr>
                <tr>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Cenas:</td>
                  <td className="border border-black py-1 px-2 text-center">{data.numCenas || 0}</td>
                  {data.numPersonalizadoComida > 0 ? (
                    <>
                      <td className="border border-black bg-gray-100 font-bold py-1 px-2">Personalizado:</td>
                      <td className="border border-black py-1 px-2 text-center">{data.numPersonalizadoComida} x {formatMoney(data.precioPersonalizadoComida)}</td>
                    </>
                  ) : (
                    <td className="border border-black" colSpan={2}></td>
                  )}
                </tr>
                <tr>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2" colSpan={2}></td>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Subtotal Comida:</td>
                  <td className="border border-black py-1 px-2 text-center font-bold">{formatMoney(data.costoComida)}</td>
                </tr>
              </>
            )}

            {/* HOSPEDAJE */}
            {data.incluyeHospedaje && (
              <>
                <tr>
                  <td colSpan={4} className="border border-black bg-emerald-600 text-white font-bold text-center py-1.5 uppercase">
                    Hospedaje
                  </td>
                </tr>
                <tr>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Número de Noches:</td>
                  <td className="border border-black py-1 px-2 text-center">{data.numNoches || 0}</td>
                  {data.numPersonalizadoHospedaje > 0 ? (
                    <>
                      <td className="border border-black bg-gray-100 font-bold py-1 px-2">Personalizado:</td>
                      <td className="border border-black py-1 px-2 text-center">{data.numPersonalizadoHospedaje} x {formatMoney(data.precioPersonalizadoHospedaje)}</td>
                    </>
                  ) : (
                    <td className="border border-black" colSpan={2}></td>
                  )}
                </tr>
                <tr>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2" colSpan={2}></td>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Subtotal Hospedaje:</td>
                  <td className="border border-black py-1 px-2 text-center font-bold">{formatMoney(data.costoHospedaje)}</td>
                </tr>
              </>
            )}

            {/* TRANSPORTE */}
            {data.incluyeTransporte && (
              <>
                <tr>
                  <td colSpan={4} className="border border-black bg-emerald-600 text-white font-bold text-center py-1.5 uppercase">
                    Transporte
                  </td>
                </tr>
                <tr>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Uber / Didi:</td>
                  <td className="border border-black py-1 px-2 text-center">{formatMoney(data.transporteUberDidi)}</td>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Autobús:</td>
                  <td className="border border-black py-1 px-2 text-center">{formatMoney(data.transporteAutobus)}</td>
                </tr>
                <tr>
                  <td className="border border-black" colSpan={2}></td>
                  <td className="border border-black bg-gray-100 font-bold py-1 px-2">Subtotal Transporte:</td>
                  <td className="border border-black py-1 px-2 text-center font-bold">{formatMoney(data.costoTransporte)}</td>
                </tr>
              </>
            )}

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
        <div className="mt-16 grid grid-cols-3 gap-8 text-center px-8">
          <div>
            <div className="h-14 flex items-end justify-center">
              {data.firmaSolicitanteUrl && (
                <img src={data.firmaSolicitanteUrl} alt="Firma del solicitante" className="max-h-14 object-contain" />
              )}
            </div>
            <div className="border-b border-black mb-2 mx-4"></div>
            <p className="font-bold text-xs">Solicita</p>
            <p className="text-[10px] uppercase">{data.solicitanteNombre}</p>
          </div>
          <div>
            <div className="h-14 flex items-end justify-center">
              {data.firmaAprobadorUrl && (
                <img src={data.firmaAprobadorUrl} alt="Firma del aprobador" className="max-h-14 object-contain" />
              )}
            </div>
            <div className="border-b border-black mb-2 mx-4"></div>
            <p className="font-bold text-xs">Autoriza</p>
            <p className="text-[10px]">Administrador General</p>
          </div>
          <div>
            <div className="h-14 flex items-end justify-center">
              {data.firmaPagoUrl && (
                <img src={data.firmaPagoUrl} alt="Firma de Cuentas por Pagar" className="max-h-14 object-contain" />
              )}
            </div>
            <div className="border-b border-black mb-2 mx-4"></div>
            <p className="font-bold text-xs">Pagó</p>
            <p className="text-[10px]">Cuentas por Pagar</p>
          </div>
        </div>

      </div>
    </div>
  )
}
