const { Router } = require('express')
const path = require('path')
const fs = require('fs')

const router = Router()
const RESULTS_FILE = path.join(__dirname, '..', '..', 'results', 'last_result.csv')

router.get('/descargar', (req, res) => {
  if (!fs.existsSync(RESULTS_FILE)) {
    return res.status(404).json({ error: 'No hay resultados disponibles' })
  }
  res.download(RESULTS_FILE, 'resultados_whatsapp.csv')
})

// Descarga solo los que tienen WA
router.get('/descargar/con-wa', (req, res) => {
  if (!fs.existsSync(RESULTS_FILE)) {
    return res.status(404).json({ error: 'No hay resultados disponibles' })
  }

  const { parse } = require('csv-parse/sync')
  const { stringify } = require('csv-stringify/sync')

  const contenido = fs.readFileSync(RESULTS_FILE, 'utf8')
  const filas = parse(contenido, { columns: true, skip_empty_lines: true })
  const conWa = filas.filter((f) => f.tiene_wa === 'true')
  const csv = stringify(conWa, { header: true })

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="con_whatsapp.csv"')
  res.send(csv)
})

// Descarga solo los que NO tienen WA
router.get('/descargar/sin-wa', (req, res) => {
  if (!fs.existsSync(RESULTS_FILE)) {
    return res.status(404).json({ error: 'No hay resultados disponibles' })
  }

  const { parse } = require('csv-parse/sync')
  const { stringify } = require('csv-stringify/sync')

  const contenido = fs.readFileSync(RESULTS_FILE, 'utf8')
  const filas = parse(contenido, { columns: true, skip_empty_lines: true })
  const sinWa = filas.filter((f) => f.tiene_wa !== 'true')
  const csv = stringify(sinWa, { header: true })

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="sin_whatsapp.csv"')
  res.send(csv)
})

module.exports = router
