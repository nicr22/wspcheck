const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode')
const path = require('path')
const fs = require('fs')

let sock = null
let connectionState = 'disconnected'
let latestQR = null
let connectedPhone = null

const SESSION_PATH = path.join(__dirname, '..', 'session')

function limpiarSesion() {
  try {
    fs.rmSync(SESSION_PATH, { recursive: true, force: true })
    fs.mkdirSync(SESSION_PATH, { recursive: true })
  } catch {}
}

async function initWhatsApp() {
  fs.mkdirSync(SESSION_PATH, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH)
  const { version } = await fetchLatestBaileysVersion()

  connectionState = 'connecting'

  sock = makeWASocket({
    version,
    auth: state,
    browser: ['WspCheck', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 30_000,
    logger: require('pino')({ level: 'silent' }),
    markOnlineOnConnect: false,
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      connectionState = 'connecting'
      latestQR = await qrcode.toDataURL(qr)
      console.log('[WA] QR generado — escanea en http://localhost:3000')
    }

    if (connection === 'close') {
      connectedPhone = null
      latestQR = null

      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log('[WA] Conexión cerrada. Código:', statusCode)

      if (
        statusCode === DisconnectReason.loggedOut ||
        statusCode === DisconnectReason.badSession
      ) {
        // Sesión inválida → limpiar y generar QR nuevo
        console.log('[WA] Sesión inválida. Limpiando y generando QR nuevo...')
        limpiarSesion()
        connectionState = 'connecting'
        setTimeout(() => initWhatsApp(), 2000)
      } else {
        // Desconexión temporal → reconectar
        console.log('[WA] Reconectando...')
        connectionState = 'connecting'
        setTimeout(() => initWhatsApp(), 3000)
      }
    }

    if (connection === 'open') {
      connectionState = 'connected'
      latestQR = null
      connectedPhone = sock.user?.id?.split(':')[0] ?? null
      console.log(`[WA] ✅ Conectado como +${connectedPhone}`)
    }
  })
}

async function verificarNumero(numero) {
  if (!sock || connectionState !== 'connected') {
    throw new Error('WhatsApp no está conectado')
  }
  const jid = `${numero}@s.whatsapp.net`
  const [result] = await sock.onWhatsApp(jid)
  return result?.exists ?? false
}

function getStatus() {
  return {
    estado: connectionState,
    qr: latestQR,
    telefono: connectedPhone,
  }
}

async function desconectar() {
  try {
    if (sock) {
      sock.ev.removeAllListeners()
      await sock.logout()
    }
  } catch {}
  sock = null
  connectionState = 'disconnected'
  latestQR = null
  connectedPhone = null
  limpiarSesion()
  console.log('[WA] Sesión cerrada manualmente. Generando QR nuevo...')
  setTimeout(() => initWhatsApp(), 1500)
}

module.exports = { initWhatsApp, verificarNumero, getStatus, desconectar }
