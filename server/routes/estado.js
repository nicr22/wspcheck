const { Router } = require('express')
const { getStatus } = require('../whatsapp')

const router = Router()

router.get('/estado', (req, res) => {
  res.json(getStatus())
})

module.exports = router
