const { Router } = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { parseArchivo } = require('../utils/parseArchivo')
const { procesarNumeros } = require('../utils/sseLoop')

const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } })

const router = Router()

router.post('/verificar-bulk', upload.single('archivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió archivo' })
  }

  let numeros = []
  try {
    numeros = parseArchivo(req.file.path, req.file.mimetype)
  } catch (err) {
    fs.unlinkSync(req.file.path)
    return res.status(400).json({ error: `No se pudo leer el archivo: ${err.message}` })
  }

  fs.unlinkSync(req.file.path)

  if (numeros.length === 0) {
    return res.status(400).json({ error: 'No se encontraron números válidos en el archivo' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  await procesarNumeros(numeros, res)
})

module.exports = router
