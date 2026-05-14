const xlsx = require('xlsx')
const { parse } = require('csv-parse/sync')
const { normalizarNumero } = require('./normalizar')
const path = require('path')

function esColumnaNumerosWA(valores) {
  // Una columna "parece" de teléfonos si >40% de sus valores son números de 7-15 dígitos
  const muestra = valores.slice(0, 30).filter(Boolean)
  if (muestra.length === 0) return false
  const hits = muestra.filter((v) => /^\+?\d[\d\s\-().]{6,18}$/.test(String(v).trim()))
  return hits.length / muestra.length >= 0.4
}

function extraerNumerosDeWorksheet(ws) {
  const json = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (json.length === 0) return []

  const headers = json[0]
  const rows = json.slice(1)
  const columnas = headers.length

  // Detectar qué columna tiene teléfonos
  let colIndex = -1
  for (let c = 0; c < columnas; c++) {
    const valores = rows.map((r) => r[c])
    if (esColumnaNumerosWA(valores)) {
      colIndex = c
      break
    }
  }

  // Si no se detectó, usar la primera columna
  if (colIndex === -1) colIndex = 0

  const numeros = []
  for (const row of rows) {
    const n = normalizarNumero(String(row[colIndex] ?? '').trim())
    if (n) numeros.push(n)
  }
  return [...new Set(numeros)]
}

function parseArchivo(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase()

  if (ext === '.csv' || mimeType === 'text/csv') {
    const fs = require('fs')
    const contenido = fs.readFileSync(filePath, 'utf8')
    // Intentar parsear como CSV estructurado
    try {
      const filas = parse(contenido, { skip_empty_lines: true, trim: true })
      if (filas.length === 0) return []

      // Detectar columna de teléfonos
      let colIndex = 0
      const headers = filas[0]
      const datos = filas.slice(1)
      for (let c = 0; c < headers.length; c++) {
        if (esColumnaNumerosWA(datos.map((r) => r[c]))) {
          colIndex = c
          break
        }
      }

      const numeros = []
      for (const row of datos) {
        const n = normalizarNumero(String(row[colIndex] ?? '').trim())
        if (n) numeros.push(n)
      }
      return [...new Set(numeros)]
    } catch {
      // CSV sin estructura, un número por línea
      return [...new Set(
        contenido.split(/\r?\n/).map((l) => normalizarNumero(l.trim())).filter(Boolean)
      )]
    }
  }

  // Excel
  const wb = xlsx.readFile(filePath)
  const primerHoja = wb.SheetNames[0]
  return extraerNumerosDeWorksheet(wb.Sheets[primerHoja])
}

module.exports = { parseArchivo }
