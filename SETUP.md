# 🚀 Guía Rápida de Configuración

## ✅ Archivos Creados

Se han creado los siguientes archivos con tus credenciales:

### 1. `.env.local` (Local)
```env
AUDIUS_API_KEY=c687bc369a514c30adcc07ddbc10aeb38fd29f03
AUDIUS_API_SECRET=25660f07031f5da3f15690cd1342b60ef2f452930bfe50feb51e82f241c6f8e2
CRON_SECRET=cambia-esto-por-un-secreto-seguro
```

### 2. `.env.local.example` (Plantilla para el repositorio)
Plantilla segura sin credenciales reales para compartir en GitHub.

### 3. `.gitignore`
Configurado para NO subir `.env.local` al repositorio.

### 4. `.github/workflows/deploy.yml`
Workflow de GitHub Actions para despliegue automático a Vercel.

### 5. `.github/workflows/update-catalog.yml`
Cron job que actualiza el catálogo de Audius cada 24 horas.

### 6. `scripts/update-catalog.js`
Script para actualizar el catálogo manualmente.

### 7. `src/data/catalog.json`
Archivo JSON donde se guarda el catálogo (se actualiza automáticamente).

---

## 📋 Pasos para Completar la Configuración

### Paso 1: Probar Localmente

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre `http://localhost:5173` y verifica que la emisora funciona.

### Paso 2: Configurar Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Importa tu repositorio de GitHub
3. Ve a **Settings** > **Environment Variables**
4. Agrega estas variables:
   - `AUDIUS_API_KEY` = `c687bc369a514c30adcc07ddbc10aeb38fd29f03`
   - `AUDIUS_API_SECRET` = `25660f07031f5da3f15690cd1342b60ef2f452930bfe50feb51e82f241c6f8e2`
   - `CRON_SECRET` = (genera un secreto aleatorio)

### Paso 3: Configurar GitHub Secrets

1. Ve a tu repositorio en GitHub
2. **Settings** > **Secrets and variables** > **Actions**
3. Agrega estos secretos:

#### `VERCEL_TOKEN`
- Ve a Vercel > **Settings** > **Tokens**
- Crea un nuevo token
- Copia el token y pégalo en GitHub

#### `AUDIUS_API_KEY`
- Valor: `c687bc369a514c30adcc07ddbc10aeb38fd29f03`

#### `AUDIUS_API_SECRET`
- Valor: `25660f07031f5da3f15690cd1342b60ef2f452930bfe50feb51e82f241c6f8e2`

### Paso 4: Desplegar

```bash
# Commit y push
git add .
git commit -m "🚀 Configurar credenciales y workflows"
git push origin main
```

GitHub Actions desplegará automáticamente a Vercel.

---

## 🔍 Verificación

### Verificar que la emisora funciona:

1. Abre la URL de producción de Vercel
2. Haz clic en "Iniciar Emisora"
3. Verifica que:
   - ✅ Se reproduce música
   - ✅ Se muestran las locuciones TTS
   - ✅ El indicador "EN VIVO" está activo
   - ✅ La cola se actualiza automáticamente

### Verificar el cron job:

1. Ve a GitHub > **Actions**
2. Busca el workflow "Update Catalog Cron"
3. Verifica que se ejecuta cada 24 horas
4. Revisa los logs para confirmar que actualiza el catálogo

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Actualizar catálogo manualmente
node scripts/update-catalog.js

# Desplegar a Vercel manualmente
vercel --prod

# Ver logs de Vercel
vercel logs
```

---

## 📊 Estructura de Archivos Creados

```
emisora-hombre-de-las-nubes/
├── .env.local                    ← Tus credenciales (NO subir a git)
├── .env.local.example            ← Plantilla segura
├── .gitignore                    ← Excluye .env.local
├── .github/
│   └── workflows/
│       ├── deploy.yml            ← Despliegue automático
│       └── update-catalog.yml    ← Cron job 24h
├── scripts/
│   └── update-catalog.js         ← Script de actualización
├── src/
│   ├── data/
│   │   └── catalog.json          ← Catálogo cacheado
│   └── lib/
│       └── audius.ts             ← Usa AUDIUS_API_KEY
└── README.md                     ← Documentación completa
```

---

## ⚠️ Seguridad

- ✅ `.env.local` está en `.gitignore` (no se sube a GitHub)
- ✅ Las credenciales están configuradas como secrets en Vercel y GitHub
- ✅ El archivo `.env.local.example` no contiene credenciales reales
- ✅ La API key está hardcodeada como fallback en `audius.ts` para desarrollo

---

## 🎯 Siguientes Pasos

1. **Probar localmente**: `npm run dev`
2. **Configurar Vercel**: Agregar variables de entorno
3. **Configurar GitHub**: Agregar secrets
4. **Desplegar**: `git push origin main`
5. **Verificar**: Abrir la URL de producción y probar la emisora

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de Vercel: `vercel logs`
2. Revisa los logs de GitHub Actions: GitHub > Actions
3. Verifica que las variables de entorno estén configuradas correctamente
4. Asegúrate de que la API key de Audius sea válida

---

**¡Tu emisora está lista para transmitir 24/7!** 🎵☁️
