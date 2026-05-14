/* ── TABS ── */
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach((c) => {
      c.classList.remove('active')
      c.hidden = true
    })
    btn.classList.add('active')
    const target = document.getElementById(`tab-${btn.dataset.tab}`)
    target.hidden = false
    target.classList.add('active')
  })
})

/* ── ESTADO DE CONEXIÓN (polling cada 3s) ── */
const estadoBadge = document.getElementById('estado-badge')
const estadoTexto = document.getElementById('estado-texto')
const qrContainer = document.getElementById('qr-container')
const qrImg = document.getElementById('qr-img')
const infoConectado = document.getElementById('info-conectado')
const telefonoNum = document.getElementById('telefono-num')

function actualizarEstado(data) {
  estadoBadge.className = `badge badge-${data.estado === 'connected' ? 'connected' : data.estado === 'connecting' ? 'connecting' : 'disconnected'}`

  if (data.estado === 'connected') {
    estadoTexto.textContent = 'Conectado'
    qrContainer.hidden = true
    infoConectado.hidden = false
    telefonoNum.textContent = data.telefono ? `+${data.telefono}` : ''
  } else if (data.estado === 'connecting') {
    estadoTexto.textContent = 'Conectando...'
    infoConectado.hidden = true
    if (data.qr) {
      qrContainer.hidden = false
      qrImg.src = data.qr
    }
  } else {
    estadoTexto.textContent = 'Desconectado'
    qrContainer.hidden = true
    infoConectado.hidden = true
  }
}

async function pollEstado() {
  try {
    const r = await fetch('/estado')
    const data = await r.json()
    actualizarEstado(data)
  } catch {
    // server no responde todavía
  }
}

pollEstado()
setInterval(pollEstado, 3000)

/* ── VERIFICAR INDIVIDUAL ── */
const inputNumero = document.getElementById('input-numero')
const btnUno = document.getElementById('btn-verificar-uno')
const resultadoUno = document.getElementById('resultado-uno')

btnUno.addEventListener('click', verificarUno)
inputNumero.addEventListener('keydown', (e) => { if (e.key === 'Enter') verificarUno() })

async function verificarUno() {
  const num = inputNumero.value.trim()
  if (!num) return

  resultadoUno.hidden = false
  resultadoUno.className = 'resultado loading'
  resultadoUno.textContent = `Verificando ${num}...`
  btnUno.disabled = true

  try {
    const r = await fetch('/verificar-uno', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero: num }),
    })
    const data = await r.json()

    if (data.error) {
      resultadoUno.className = 'resultado fail'
      resultadoUno.textContent = `⚠️ ${data.error}`
    } else if (data.tiene_wa) {
      resultadoUno.className = 'resultado ok'
      resultadoUno.textContent = `✅ +${data.numero} tiene WhatsApp activo`
    } else {
      resultadoUno.className = 'resultado fail'
      resultadoUno.textContent = `❌ +${data.numero} NO tiene WhatsApp`
    }
  } catch (err) {
    resultadoUno.className = 'resultado fail'
    resultadoUno.textContent = '⚠️ Error de red. ¿Está corriendo el servidor?'
  }

  btnUno.disabled = false
}

/* ── PEGAR NÚMEROS ── */
const textareaNumeros = document.getElementById('textarea-numeros')
const conteoNumeros = document.getElementById('conteo-numeros')
const btnTexto = document.getElementById('btn-verificar-texto')

textareaNumeros.addEventListener('input', actualizarConteo)

function extraerNumerosCliente(texto) {
  return [...new Set(
    texto.split(/[\n\r,;|\t]+/)
      .map((p) => p.trim().replace(/\D/g, ''))
      .filter((n) => n.length >= 7 && n.length <= 15)
  )]
}

function actualizarConteo() {
  const nums = extraerNumerosCliente(textareaNumeros.value)
  conteoNumeros.textContent = `${nums.length} número${nums.length !== 1 ? 's' : ''} detectado${nums.length !== 1 ? 's' : ''}`
  btnTexto.disabled = nums.length === 0
}

actualizarConteo()

btnTexto.addEventListener('click', () => {
  const texto = textareaNumeros.value.trim()
  if (!texto) return
  iniciarSSETexto(texto)
})

function iniciarSSETexto(texto) {
  const progresoContainer = document.getElementById('progreso-texto')
  const labelEl = document.getElementById('progreso-texto-label')
  const pctEl = document.getElementById('progreso-texto-pct')
  const barraEl = document.getElementById('barra-texto')
  const resumenEl = document.getElementById('resumen-texto')
  const descargaEl = document.getElementById('descarga-texto')
  const tablaContainer = document.getElementById('tabla-texto-container')
  const tablaBody = document.getElementById('tabla-texto-body')

  progresoContainer.hidden = false
  resumenEl.hidden = true
  descargaEl.hidden = true
  tablaContainer.hidden = false
  tablaBody.innerHTML = ''
  barraEl.style.width = '0%'
  labelEl.textContent = 'Iniciando...'
  pctEl.textContent = '0%'
  btnTexto.disabled = true

  fetch('/verificar-texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto }),
  }).then((res) => {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    function leerChunk() {
      reader.read().then(({ done, value }) => {
        if (done) return
        buffer += decoder.decode(value, { stream: true })
        const lineas = buffer.split('\n')
        buffer = lineas.pop()
        for (const linea of lineas) {
          if (linea.startsWith('data: ')) {
            try {
              procesarEventoTexto(JSON.parse(linea.slice(6)))
            } catch {}
          }
        }
        leerChunk()
      })
    }
    leerChunk()
  }).catch(() => {
    labelEl.textContent = '⚠️ Error de conexión'
    btnTexto.disabled = false
  })

  function procesarEventoTexto(ev) {
    if (ev.done) {
      labelEl.textContent = `Completado — ${ev.total} números`
      pctEl.textContent = '100%'
      barraEl.style.width = '100%'

      document.getElementById('texto-con-wa').textContent = ev.con_wa
      document.getElementById('texto-sin-wa').textContent = ev.sin_wa
      document.getElementById('texto-total').textContent = ev.total
      resumenEl.hidden = false
      descargaEl.hidden = false
      btnTexto.disabled = false
      return
    }
    if (ev.error) {
      labelEl.textContent = `⚠️ Error: ${ev.error}`
      return
    }

    const pct = Math.round((ev.index / ev.total) * 100)
    barraEl.style.width = `${pct}%`
    pctEl.textContent = `${pct}%`
    labelEl.textContent = `Verificando ${ev.index} de ${ev.total}...`

    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${ev.index}</td>
      <td>+${ev.numero}</td>
      <td class="${ev.tiene_wa ? 'tag-wa' : 'tag-no'}">${ev.tiene_wa ? '✅ Sí' : '❌ No'}</td>
    `
    tablaBody.appendChild(tr)
    tablaContainer.scrollTop = tablaContainer.scrollHeight
  }
}

/* ── DROPZONE ── */
const dropzone = document.getElementById('dropzone')
const inputArchivo = document.getElementById('input-archivo')
const archivoInfo = document.getElementById('archivo-info')
const archivoNombre = document.getElementById('archivo-nombre')
const btnCambiar = document.getElementById('btn-cambiar-archivo')
const btnBulk = document.getElementById('btn-verificar-bulk')

let archivoSeleccionado = null

dropzone.addEventListener('click', () => inputArchivo.click())
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('over') })
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'))
dropzone.addEventListener('drop', (e) => {
  e.preventDefault()
  dropzone.classList.remove('over')
  const f = e.dataTransfer.files[0]
  if (f) seleccionarArchivo(f)
})

inputArchivo.addEventListener('change', () => {
  if (inputArchivo.files[0]) seleccionarArchivo(inputArchivo.files[0])
})

btnCambiar.addEventListener('click', () => {
  archivoSeleccionado = null
  archivoInfo.hidden = true
  dropzone.style.display = ''
  btnBulk.disabled = true
  inputArchivo.value = ''
})

function seleccionarArchivo(file) {
  archivoSeleccionado = file
  archivoNombre.textContent = `${file.name} (${(file.size / 1024).toFixed(0)} KB)`
  archivoInfo.hidden = false
  dropzone.style.display = 'none'
  btnBulk.disabled = false
}

btnBulk.addEventListener('click', () => {
  if (!archivoSeleccionado) return
  iniciarSSEBulk(archivoSeleccionado)
})

function iniciarSSEBulk(file) {
  const progresoContainer = document.getElementById('progreso-bulk')
  const labelEl = document.getElementById('progreso-bulk-label')
  const pctEl = document.getElementById('progreso-bulk-pct')
  const barraEl = document.getElementById('barra-bulk')
  const resumenEl = document.getElementById('resumen-bulk')
  const descargaEl = document.getElementById('descarga-bulk')
  const tablaContainer = document.getElementById('tabla-bulk-container')
  const tablaBody = document.getElementById('tabla-bulk-body')

  progresoContainer.hidden = false
  resumenEl.hidden = true
  descargaEl.hidden = true
  tablaContainer.hidden = false
  tablaBody.innerHTML = ''
  barraEl.style.width = '0%'
  labelEl.textContent = 'Subiendo archivo...'
  pctEl.textContent = '0%'
  btnBulk.disabled = true

  const form = new FormData()
  form.append('archivo', file)

  fetch('/verificar-bulk', {
    method: 'POST',
    body: form,
  }).then((res) => {
    if (!res.ok) {
      return res.json().then((d) => { throw new Error(d.error || 'Error del servidor') })
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    function leerChunk() {
      reader.read().then(({ done, value }) => {
        if (done) return
        buffer += decoder.decode(value, { stream: true })
        const lineas = buffer.split('\n')
        buffer = lineas.pop()
        for (const linea of lineas) {
          if (linea.startsWith('data: ')) {
            try {
              procesarEventoBulk(JSON.parse(linea.slice(6)))
            } catch {}
          }
        }
        leerChunk()
      })
    }
    leerChunk()
  }).catch((err) => {
    labelEl.textContent = `⚠️ ${err.message}`
    btnBulk.disabled = false
  })

  function procesarEventoBulk(ev) {
    if (ev.done) {
      labelEl.textContent = `Completado — ${ev.total} números`
      pctEl.textContent = '100%'
      barraEl.style.width = '100%'

      document.getElementById('bulk-con-wa').textContent = ev.con_wa
      document.getElementById('bulk-sin-wa').textContent = ev.sin_wa
      document.getElementById('bulk-total').textContent = ev.total
      resumenEl.hidden = false
      descargaEl.hidden = false
      btnBulk.disabled = false
      return
    }
    if (ev.error) {
      labelEl.textContent = `⚠️ ${ev.error}`
      return
    }

    const pct = Math.round((ev.index / ev.total) * 100)
    barraEl.style.width = `${pct}%`
    pctEl.textContent = `${pct}%`
    labelEl.textContent = `Verificando ${ev.index} de ${ev.total}...`

    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${ev.index}</td>
      <td>+${ev.numero}</td>
      <td class="${ev.tiene_wa ? 'tag-wa' : 'tag-no'}">${ev.tiene_wa ? '✅ Sí' : '❌ No'}</td>
    `
    tablaBody.appendChild(tr)
    tablaContainer.scrollTop = tablaContainer.scrollHeight
  }
}

/* ── DESCARGAR CSV ── */
function descargar(tipo) {
  const urls = {
    'con-wa': '/descargar/con-wa',
    'sin-wa': '/descargar/sin-wa',
    'todos': '/descargar',
  }
  const a = document.createElement('a')
  a.href = urls[tipo]
  a.download = ''
  a.click()
}
