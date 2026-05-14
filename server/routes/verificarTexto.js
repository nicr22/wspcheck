const { Router } = require('express')
const { extraerNumeros } = require('../utils/normalizar')
const { procesarNumeros } = require('../utils/sseLoop')

const router = Router()

router.post('/verificar-texto', async (req, res) => {
  const { texto } = req.body

  if (!texto || typeof texto !== 'string') {
    return res.status(400).json({ error: 'Se requiere el campo texto' })
  }

  const numeros = extraerNumeros(texto)

  if (numeros.length === 0) {
    return res.status(400).json({ error: 'No se encontraron números válidos en el texto' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  await procesarNumeros(numeros, res)
})

module.exports = router
