const { Router } = require('express')
const { desconectar } = require('../whatsapp')

const router = Router()

router.post('/desconectar', async (req, res) => {
  await desconectar()
  res.json({ ok: true })
})

module.exports = router
