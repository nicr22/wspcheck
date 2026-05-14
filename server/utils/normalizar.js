// Limpia y normaliza un número a E164 sin + (ej: 51987654321)
function normalizarNumero(raw) {
  if (!raw) return null
  // Quitar todo lo que no sea dígito
  let n = String(raw).replace(/\D/g, '')
  if (!n) return null
  // Evitar números demasiado cortos o largos
  if (n.length < 7 || n.length > 15) return null
  return n
}

// Extrae números de un texto libre (puede tener +, espacios, guiones, comas, saltos de línea)
function extraerNumeros(texto) {
  if (!texto) return []
  // Dividir por comas, punto y coma, saltos de línea o pipes
  const partes = texto.split(/[\n\r,;|\t]+/)
  const resultados = []
  for (const parte of partes) {
    const n = normalizarNumero(parte.trim())
    if (n) resultados.push(n)
  }
  return [...new Set(resultados)] // deduplicar
}

module.exports = { normalizarNumero, extraerNumeros }
