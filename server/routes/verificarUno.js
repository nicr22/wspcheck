const { Router } = require('express')
const { verificarNumero } = require('../whatsapp')
const { normalizarNumero } = require('../utils/normalizar')

const router = Router()

router.post('/verificar-uno', async (req, res) => {
  const { numero } = req.body
  const n = normalizarNumero(numero)

  if (!n) {
    return res.status(400).json({ error: 'Número inválido' })
  }

  try {
    const tiene_wa = await verificarNumero(n)
    res.json({ numero: n, tiene_wa })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

module.exports = router
