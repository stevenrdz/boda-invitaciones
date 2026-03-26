# AGENT.md — Contexto del Proyecto para IA

Este archivo documenta toda la arquitectura, decisiones técnicas y estado actual del proyecto. Cualquier IA (Codex, Gemini, Claude, etc.) puede leerlo para entender el proyecto y continuar el trabajo sin necesidad de conversación previa.

---

## 📌 Descripción General

Aplicación web de **invitaciones de boda para Damas de Honor**. Cada dama recibe un link personalizado con su nombre, confirma si acepta el rol y si llevará acompañante. Los datos se guardan automáticamente en Google Sheets.

**URL del repositorio:** https://github.com/stevenrdz/boda-invitaciones  
**Deploy:** Netlify (conectado al repo `main` branch)  
**Estado actual:** ✅ Funcional y desplegado

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite 8 |
| Estilos | CSS vanilla con Glassmorphism (cristal blanco esmerilado) |
| Animaciones | Framer Motion |
| Ruteo | React Router DOM |
| Backend | Google Apps Script (Web App publicada como `/exec`) |
| Base de datos | Google Sheets (2 pestañas: `Invitados` y `Configuracion`) |
| Deploy | Netlify |
| Node.js | v20 (requerido por Vite 8) |

---

## 📁 Estructura de Archivos

```
boda-invitaciones/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx              # Componente principal — fetching, routing, layout
│   ├── App.css              # Estilos legacy (casi vacío)
│   ├── index.css            # Estilos globales: tokens CSS, glassmorphism, botones, forms
│   ├── main.jsx             # Punto de entrada React
│   └── components/
│       └── RSVPForm.jsx     # Flujo multi-paso de confirmación de la dama
├── .env                     # ⛔ NO incluir en Git — solo desarrollo local
├── .gitignore               # Excluye .env, node_modules, dist
├── netlify.toml             # Configuración de build para Netlify
├── package.json
└── AGENT.md                 # Este archivo
```

---

## 🎨 Diseño Visual

- **Paleta:** Lila Lavanda (`#9b59b6`) con acentos en `#8e44ad`
- **Contenedor:** Glassmorphism blanco (`rgba(255,255,255,0.85)` + `backdrop-filter: blur(20px)`)
- **Tipografía:** Google Fonts — `Great Vibes` (cursiva decorativa), `Playfair Display` (títulos), `Inter` (cuerpo)
- **Fondo:** Imagen dinámica desde Google Sheets (con fallback hardcodeado en `index.css`)
- **Animaciones:** Framer Motion para transiciones entre pasos y entrance de la tarjeta

> **Importante de diseño:** La imagen de fondo se preload en JavaScript (`new Image()`) ANTES de quitar el spinner de carga. Esto evita el "flash gris" mientras se descarga la foto pesada de Unsplash.

---

## 🔄 Flujo de Usuario (Multi-Step)

```
Abrir link con ?id=xxx
       ↓
  Spinner de carga (pantalla completa, blanco)
       ↓
  Fetch a Google Apps Script → recibe nombre, allowsPartner, config
       ↓
  Preload de la imagen de fondo (espera descarga completa)
       ↓
  Revelar tarjeta con animación
       ↓
┌─────────────────────────────────────────────────────────┐
│  PASO 1: "¿Aceptas ser mi Dama de Honor?"               │
│  → [Sí, acepto encantada!]  [Lamentablemente no podré]  │
└─────────────────────────────────────────────────────────┘
       ↓ Sí                              ↓ No
┌─────────────────────┐         POST a Apps Script → attending: false
│ PASO 2: ¿Llevarás   │         → Pantalla "Gracias por avisarme"
│ acompañante?        │
│ [Sí] [No]           │
└─────────────────────┘
  ↓ No: POST → attending: true, hasPartner: false → "¡Todo listo!"
  ↓ Sí:
┌─────────────────────────────────────────────────────────┐
│  PASO 3: Formulario de acompañante                      │
│  • Nombre (texto requerido)                             │
│  • Apellidos (texto requerido)                          │
│  • Teléfono Celular (tel requerido)                     │
│  → POST → attending: true, hasPartner: true, datos      │
│  → "¡Todo listo! ✨"                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🗃️ Google Sheets — Estructura

### Pestaña: `Invitados`
| Col A | Col B | Col C | Col D | Col E | Col F | Col G |
|-------|-------|-------|-------|-------|-------|-------|
| ID (slug) | Nombre formal | ¿Puede llevar pareja? (Si/No) | Confirmación (auto) | Nombre Pareja (auto) | Apellido Pareja (auto) | Celular Pareja (auto) |

Ejemplo:
```
jenniffer-v | Jenniffer Vasquez | Si | | | |
carolina-c  | Carolina Cuzco    | Si | | | |
```

### Pestaña: `Configuracion`
| Col A (Clave) | Col B (Valor) |
|---------------|---------------|
| `fecha` | Sábado, 1 de Agosto 2026 |
| `lugar` | Iglesia Católica Santo Tomás Moro |
| `hora` | 18:00 hrs |
| `mostrar_evento` | `Si` o `No` — oculta/muestra el bloque de evento |
| `fondo_url` | URL completa de imagen para el fondo (cualquier link público) |

---

## ⚙️ Google Apps Script — Código Completo

Ir a `Extensiones > Apps Script` en el Google Sheet y pegar este código. Luego publicar como **Web App** con acceso para **Cualquiera**. **Siempre crear "Nueva versión" al reimplementar.**

```javascript
function doGet(e) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Leer Configuración global
  var configSheet = spreadsheet.getSheetByName("Configuracion");
  var config = { fecha: "", lugar: "", hora: "", mostrarEvento: true, fondoUrl: "" };
  
  if (configSheet) {
    var configData = configSheet.getDataRange().getValues();
    for (var j = 0; j < configData.length; j++) {
      var key = String(configData[j][0]).toLowerCase().trim();
      var value = configData[j][1];
      if (key === 'fecha') config.fecha = value;
      if (key === 'lugar') config.lugar = value;
      if (key === 'hora') config.hora = value;
      if (key === 'mostrar_evento') config.mostrarEvento = String(value).toLowerCase() !== 'no';
      if (key === 'fondo_url') config.fondoUrl = value;
    }
  }

  // Leer Invitado por ID
  var sheet = spreadsheet.getSheetByName("Invitados");
  if (!sheet) return JSONResponse({"error": "No sheet named Invitados"});
  var guestId = e.parameter.id;
  if (!guestId) return JSONResponse({"error": "Guest ID required"});
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(guestId).toLowerCase()) {
      var allowsPartner = String(data[i][2]).toLowerCase() === 'sí'
        || String(data[i][2]).toLowerCase() === 'si'
        || String(data[i][2]).toLowerCase() === 'yes';
      return JSONResponse({
        "id": data[i][0],
        "name": data[i][1],
        "allowsPartner": allowsPartner,
        "config": config
      });
    }
  }
  return JSONResponse({"error": "Guest not found (ID: " + guestId + ")"});
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Invitados");
  var request = JSON.parse(e.postData.contents);
  var guestId = request.guestId;
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(guestId).toLowerCase()) {
      sheet.getRange(i + 1, 4).setValue(request.attending ? 'Sí' : 'No');
      sheet.getRange(i + 1, 5).setValue(request.hasPartner ? request.partnerName : '');
      sheet.getRange(i + 1, 6).setValue(request.hasPartner ? request.partnerLastname : '');
      sheet.getRange(i + 1, 7).setValue(request.hasPartner ? request.partnerPhone : '');
      return JSONResponse({"message": "RSVP Saved"});
    }
  }
  return JSONResponse({"error": "Guest not found"});
}

function JSONResponse(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 🔐 Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_GOOGLE_SCRIPT_URL` | URL pública de la Web App de Google Apps Script (termina en `/exec`) |

- **Local:** Archivo `.env` en la raíz del proyecto (excluido del repo con `.gitignore`)
- **Producción:** Configurar en Netlify → Site Settings → Environment Variables

---

## 🚀 Setup Local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env
echo "VITE_GOOGLE_SCRIPT_URL=https://script.google.com/.../exec" > .env

# 3. Levantar servidor de desarrollo
npm run dev

# 4. Abrir en navegador con un ID real del sheet
# http://localhost:5173/?id=jenniffer-v
```

---

## 🌐 Deploy en Netlify

1. Conectar repo de GitHub en Netlify → "Import existing project"
2. Netlify detectará `netlify.toml` automáticamente
3. Agregar variable de entorno `VITE_GOOGLE_SCRIPT_URL` en Netlify
4. Deploy automático en cada `git push` a `main`

**URL de cada invitada:** `https://TU-SITIO.netlify.app/?id=ID-DE-LA-INVITADA`

---

## ⚠️ Consideraciones Importantes

1. **Siempre crear "Nueva versión"** en Google Apps Script al modificar código. Si solo guardas sin crear versión, el link antiguo sigue usando el código viejo.
2. **El campo `fondo_url` en Sheets** cambia el fondo del sitio en tiempo real para todas las personas que abran el link a partir de ese momento.
3. **`mostrar_evento = No`** oculta completamente el bloque de fecha/hora/lugar de la tarjeta.
4. **Los IDs de invitadas** deben ser slugs en minúsculas sin espacios (ej: `maria-l`, `carolina-c`). El link de cada dama es `?id=SLUG`.
5. **El `.env` NUNCA debe subirse a GitHub.** La URL de Apps Script es la llave de acceso a tus datos.
6. **Node.js 20+** es requerido por Vite 8. Netlify está configurado con `NODE_VERSION = "20"` en `netlify.toml`.
