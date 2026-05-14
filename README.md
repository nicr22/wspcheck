# WspCheck — Verificador de números WhatsApp

Verifica si números de teléfono tienen WhatsApp activo. Soporte para verificación individual, pegar desde portapapeles, y carga masiva desde CSV/Excel.

## Requisitos

- Node.js 18+
- Un teléfono con WhatsApp para escanear el QR

## Instalación

```bash
cd wspcheck
npm install
npm start
```

Abrir http://localhost:3000

## Uso

### 1. Conectar WhatsApp
Al abrir la app, aparece un QR. Escanearlo desde:
**WhatsApp → Dispositivos vinculados → Vincular dispositivo**

La sesión se guarda en `/session`. No necesitas re-escanear al reiniciar.

### 2. Verificar número individual
Tab "Verificar número" → ingresa el número con código de país (+51987654321) → Verificar.

### 3. Pegar números
Tab "Pegar números" → pega cualquier lista de números (separados por coma, punto y coma o salto de línea) → Verificar todos.

### 4. Subir CSV o Excel
Tab "Subir CSV/Excel" → sube tu archivo → se detecta automáticamente la columna de teléfonos → Verificar archivo.

Al terminar puedes descargar:
- Solo los que **tienen** WhatsApp
- Solo los que **no tienen** WhatsApp
- **Todos** los resultados

## Estructura

```
wspcheck/
├── server/
│   ├── index.js              # Punto de entrada Express
│   ├── whatsapp.js           # Singleton de Baileys
│   ├── routes/
│   │   ├── estado.js
│   │   ├── verificarUno.js
│   │   ├── verificarBulk.js
│   │   ├── verificarTexto.js
│   │   └── descargar.js
│   └── utils/
│       ├── normalizar.js     # Limpieza de números E164
│       ├── parseArchivo.js   # Leer CSV/Excel
│       └── sseLoop.js        # Loop SSE con delay anti-ban
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── session/                  # Sesión Baileys (git-ignorado)
├── uploads/                  # Archivos temporales (git-ignorado)
└── results/                  # Último resultado bulk (git-ignorado)
```

## Notas

- Delay de 1500ms entre verificaciones para evitar ban
- Formato de números: E164 sin + (ej: 51987654321)
- Para cerrar sesión de WhatsApp: borra la carpeta `/session` y reinicia
