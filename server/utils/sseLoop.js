const { stringify } = require('csv-stringify/sync')
const fs = require('fs')
const path = require('path')
const { verificarNumero } = require('../whatsapp')

const DELAY_MS = 1500
const RESULTS_FILE = path.join(__dirname, '..', '..', 'results', 'last_result.csv')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function enviar(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

async function procesarNumeros(numeros, res) {
  const resultados = []

  for (let i = 0; i < numeros.length; i++) {
    const numero = numeros[i]
    let tiene_wa = false

    try {
      tiene_wa = await verificarNumero(numero)
    } catch (err) {
      enviar(res, { error: err.message, numero, index: i + 1, total: numeros.length })
      // Si el socket se cayó, abortar
      if (err.message.includes('conectado')) {
        enviar(res, { done: true, abortado: true })
        res.end()
        return
      }
    }

    const verificado_en = new Date().toISOString()
    resultados.push({ numero, tiene_wa, verificado_en })

    enviar(res, {
      index: i + 1,
      total: numeros.length,
      numero,
      tiene_wa,
    })

    if (i < numeros.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  // Guardar CSV
  const csv = stringify(resultados, { header: true, columns: ['numero', 'tiene_wa', 'verificado_en'] })
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true })
  fs.writeFileSync(RESULTS_FILE, csv, 'utf8')

  const conWa = resultados.filter((r) => r.tiene_wa).length
  enviar(res, {
    done: true,
    total: numeros.length,
    con_wa: conWa,
    sin_wa: numeros.length - conWa,
  })
  res.end()
}

module.exports = { procesarNumeros }
