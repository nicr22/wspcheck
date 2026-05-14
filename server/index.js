const express = require('express')
const path = require('path')
const { initWhatsApp } = require('./whatsapp')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public')))

// Rutas
app.use('/', require('./routes/estado'))
app.use('/', require('./routes/verificarUno'))
app.use('/', require('./routes/verificarBulk'))
app.use('/', require('./routes/verificarTexto'))
app.use('/', require('./routes/descargar'))
app.use('/', require('./routes/desconectar'))

app.listen(PORT, () => {
  console.log(`\n🚀 WspCheck corriendo en http://localhost:${PORT}\n`)
  initWhatsApp().catch(console.error)
})
