# 🚀 Guía de Despliegue Automático a Vercel

## ✅ Estado del Proyecto

- ✅ **Build exitoso**: 46 módulos transformados, 0 errores
- ✅ **Workflow de GitHub Actions**: Configurado y listo
- ✅ **Configuración de Vercel**: Optimizada para el proyecto

## 📋 Requisitos Previos

1. **Cuenta de GitHub** con el repositorio del proyecto
2. **Cuenta de Vercel** (gratuita)
3. **API Key de Audius** (opcional, para mayor límite de peticiones)

## 🔧 Configuración Paso a Paso

### Paso 1: Crear Cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Autoriza a Vercel para acceder a tus repositorios

### Paso 2: Importar el Proyecto en Vercel

1. En el dashboard de Vercel, haz clic en **"Add New..."** → **"Project"**
2. Selecciona el repositorio `emisora-hombre-de-las-nubes`
3. Vercel detectará automáticamente que es un proyecto Vite
4. Haz clic en **"Deploy"**

### Paso 3: Obtener IDs del Proyecto

Después del primer despliegue, necesitas obtener los IDs:

1. En el dashboard de Vercel, ve a tu proyecto
2. Ve a **Settings** → **General**
3. Copia estos valores:
   - **Project ID** (aparece en la sección "Project Information")
   - **Team ID** (si estás en un equipo, aparece en la URL: `vercel.com/{team}/{project}`)

### Paso 4: Crear Token de Vercel

1. Ve a [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Haz clic en **"Create Token"**
3. Nombre: `GitHub Actions Deploy`
4. Scope: Selecciona tu cuenta o equipo
5. Expiration: Sin expiración (o según tus preferencias)
6. Haz clic en **"Create"**
7. **Copia el token** (solo se muestra una vez)

### Paso 5: Configurar Secretos en GitHub

1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions**
3. Haz clic en **"New repository secret"**
4. Agrega los siguientes secretos:

#### Secreto 1: `VERCEL_TOKEN`
- **Name**: `VERCEL_TOKEN`
- **Secret**: (el token que copiaste en el Paso 4)

#### Secreto 2: `VERCEL_ORG_ID`
- **Name**: `VERCEL_ORG_ID`
- **Secret**: (tu Team ID del Paso 3, o tu User ID si no estás en un equipo)

**Para obtener tu User ID:**
- Ve a [vercel.com/account](https://vercel.com/account)
- Tu User ID aparece en la URL: `vercel.com/{user-id}`

#### Secreto 3: `VERCEL_PROJECT_ID`
- **Name**: `VERCEL_PROJECT_ID`
- **Secret**: (el Project ID del Paso 3)

#### Secreto 4: `AUDIUS_API_KEY` (Opcional)
- **Name**: `AUDIUS_API_KEY`
- **Secret**: (tu API key de Audius, si la tienes)

### Paso 6: Verificar el Workflow

1. Ve a la pestaña **Actions** en tu repositorio de GitHub
2. Deberías ver el workflow **"Deploy to Vercel"**
3. Haz clic en él para ver los detalles
4. El workflow se ejecutará automáticamente en cada push a `main` o `develop`

## 🔄 Cómo Funciona el Despliegue Automático

### Trigger del Workflow

El workflow se ejecuta automáticamente cuando:
- ✅ Se hace push a la rama `main`
- ✅ Se hace push a la rama `develop`
- ✅ Se crea un pull request a `main`

### Pasos del Workflow

```yaml
1. Checkout code          → Descarga el código del repositorio
2. Setup Node.js          → Instala Node.js 20
3. Install dependencies   → Ejecuta `npm ci`
4. Build project          → Ejecuta `npm run build`
5. Deploy to Vercel       → Despliega a producción
```

### Verificación del Despliegue

1. Después de cada push, ve a la pestaña **Actions** en GitHub
2. Verás el estado del workflow:
   - ✅ **Success**: Despliegue exitoso
   - ❌ **Failure**: Error en el despliegue (revisa los logs)
3. Haz clic en el workflow para ver los logs detallados
4. Ve a tu URL de Vercel para verificar que el sitio está actualizado

## 🌐 URLs del Proyecto

### URLs de Vercel

- **Producción**: `https://tu-proyecto.vercel.app`
- **Preview** (pull requests): `https://tu-proyecto-{commit}.vercel.app`

### URLs de GitHub Actions

- **Workflow**: `https://github.com/tu-usuario/emisora-hombre-de-las-nubes/actions`
- **Badge de estado**: `https://github.com/tu-usuario/emisora-hombre-de-las-nubes/actions/workflows/deploy.yml/badge.svg`

## 🐛 Solución de Problemas

### Problema 1: "VERCEL_TOKEN is not defined"

**Causa**: No configuraste los secretos en GitHub.

**Solución**:
1. Ve a **Settings** → **Secrets and variables** → **Actions**
2. Agrega los secretos `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### Problema 2: "Build failed"

**Causa**: Error en el código o dependencias.

**Solución**:
1. Verifica los logs del workflow en GitHub Actions
2. Ejecuta `npm run build` localmente para ver el error
3. Corrige el error y haz commit

### Problema 3: "Deployment not found"

**Causa**: Los IDs de Vercel son incorrectos.

**Solución**:
1. Verifica que `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` sean correctos
2. Ve a Vercel → Settings → General para obtener los IDs correctos

### Problema 4: "Permission denied"

**Causa**: El token de Vercel no tiene permisos suficientes.

**Solución**:
1. Crea un nuevo token en Vercel
2. Asegúrate de que el scope sea correcto (tu cuenta o equipo)
3. Actualiza el secreto `VERCEL_TOKEN` en GitHub

## 📊 Monitoreo del Despliegue

### Verificar el Estado del Despliegue

1. **En GitHub**:
   - Ve a la pestaña **Actions**
   - Verás el historial de despliegues
   - Cada despliegue muestra: duración, estado, commit

2. **En Vercel**:
   - Ve al dashboard de tu proyecto
   - Verás el historial de despliegues
   - Cada despliegue muestra: URL, estado, commit, duración

### Notificaciones

Puedes configurar notificaciones para:
- **GitHub**: Recibir emails cuando falle un workflow
- **Vercel**: Recibir notificaciones de despliegues exitosos/fallidos

## 🎯 Despliegue Manual (Alternativo)

Si prefieres desplegar manualmente sin GitHub Actions:

### Opción 1: Usando Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Iniciar sesión
vercel login

# Desplegar a producción
vercel --prod
```

### Opción 2: Usando el Dashboard de Vercel

1. Ve a tu proyecto en Vercel
2. Haz clic en **"Redeploy"**
3. Selecciona el commit que quieres desplegar
4. Haz clic en **"Deploy"**

## 📝 Configuración Avanzada

### Despliegue en Múltiples Entornos

Puedes configurar diferentes entornos (staging, production):

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-args: ''  # Sin --prod para staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-args: '--prod'
```

### Despliegue con Preview URLs

Cada pull request genera una URL de preview automáticamente:

```
https://tu-proyecto-git-{branch}-{user}.vercel.app
```

Esto es útil para probar cambios antes de fusionarlos a `main`.

## ✅ Checklist de Despliegue

Antes de hacer push, verifica:

- [ ] El proyecto compila localmente (`npm run build`)
- [ ] Los secretos están configurados en GitHub
- [ ] Los IDs de Vercel son correctos
- [ ] El token de Vercel es válido
- [ ] El repositorio está conectado a Vercel
- [ ] Las ramas `main` y `develop` están protegidas (opcional)

## 🎉 Despliegue Exitoso

Después de configurar todo correctamente:

1. ✅ Haz push a `main` o `develop`
2. ✅ El workflow se ejecutará automáticamente
3. ✅ Verás el badge de GitHub Actions en verde
4. ✅ Tu sitio estará disponible en la URL de Vercel
5. ✅ Cada push desplegará automáticamente los cambios

---

**🚀 Proyecto listo para despliegue automático a Vercel**

*Última actualización: 2025-01-XX*
