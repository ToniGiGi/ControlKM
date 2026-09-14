import * as XLSX from 'xlsx'

export type ExcelColumn<T> = {
  header: string
  value: (row: T) => string | number | Date | null | undefined
  width?: number
  format?: string // código de formato de Excel, ej. '$#,##0.00' o 'dd/mm/yyyy'
}

export function exportRowsToExcel<T>(
  rows: T[],
  columns: ExcelColumn<T>[],
  sheetName: string,
  fileName: string
) {
  const data = rows.map((row) => {
    const obj: Record<string, any> = {}
    columns.forEach((col) => {
      obj[col.header] = col.value(row) ?? ''
    })
    return obj
  })

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = columns.map((col) => ({ wch: col.width || 16 }))

  if (ws['!ref']) {
    const range = XLSX.utils.decode_range(ws['!ref'])
    columns.forEach((col, colIdx) => {
      if (!col.format) return
      for (let r = range.s.r + 1; r <= range.e.r; r++) {
        const cellRef = XLSX.utils.encode_cell({ r, c: colIdx })
        const cell = ws[cellRef]
        if (cell && cell.t === 'n') cell.z = col.format
      }
    })
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, fileName)
}
