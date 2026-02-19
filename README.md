# PPC Dashboard

Panel de control para el seguimiento y análisis de campañas de publicidad digital. Permite visualizar métricas de rendimiento por marca, campaña y período de tiempo, con soporte multi-marca y acceso autenticado.

## Stack tecnológico

| Capa | Tecnología |
| :--- | :--- |
| Framework | [Astro 5](https://astro.build) (SSR, server output) |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com) |
| Iconos | Font Awesome 6 |
| Backend | [PocketBase](https://pocketbase.io) |
| Lógica servidor | Astro Actions + Astro Middleware |
| Adaptador | `@astrojs/node` (modo standalone) |
| Lenguaje | TypeScript |

---

## 🗂 Estructura del proyecto

```text
/
├── public/                        # Activos estáticos (imágenes, favicon)
├── src/
│   ├── actions/
│   │   └── index.ts               # Todas las Server Actions (acceso a datos)
│   ├── components/
│   │   ├── dashboard/             # Componentes de vistas del dashboard
│   │   ├── icons/                 # Componentes de iconos
│   │   ├── sidemenu/              # Componentes del menú lateral
│   │   └── ui/                   # Componentes genéricos (Badge, Skeleton)
│   ├── layouts/
│   │   └── DashboardLayout.astro  # Layout principal (3 columnas + mobile)
│   ├── lib/
│   │   ├── pb.ts                  # Inicialización de PocketBase
│   │   ├── consts.ts              # Constantes globales
│   │   └── format.ts             # Utilidades de formato (moneda, números, CPL)
│   ├── pages/
│   │   ├── index.astro            # Resumen global
│   │   ├── login.astro            # Autenticación
│   │   ├── profile.astro          # Perfil de usuario
│   │   ├── debug.astro            # Página de depuración
│   │   ├── [brand]/
│   │   │   ├── index.astro        # Vista mensual de marca
│   │   │   ├── year.astro         # Vista anual de marca
│   │   │   └── campaigns/
│   │   │       └── [id].astro     # Detalle de campaña individual
│   │   ├── auth/
│   │   │   ├── callback.astro     # Callback de OAuth
│   │   │   └── logout.ts          # Endpoint de cierre de sesión
│   │   └── api/
│   │       ├── login.ts           # Login email/contraseña
│   │       ├── change-password.ts # Cambio de contraseña
│   │       └── request-recovery.ts# Recuperación de contraseña
│   ├── styles/
│   │   └── global.css
│   ├── types/
│   │   └── db.ts                  # Tipos TypeScript (CampaignReport, LeadReport)
│   ├── middleware.ts               # Protección de rutas y rate limiting
│   └── env.d.ts
├── astro.config.mjs
├── tsconfig.json
└── package.json
```

---

## 📄 Vistas y páginas

### `/` — Resumen General

Vista principal del dashboard. Muestra un panorama consolidado de todas las marcas para el mes y año seleccionados.

**Componentes clave:**
- `GlobalKPIs` — Tarjetas con indicadores clave (gasto total, leads, CPL promedio, marcas activas)
- `CplChart` — Gráfico de costo por lead comparativo entre marcas
- `BrandsTable` — Tabla con ranking de marcas ordenadas por gasto
- `BrandsSidebar` — Navegación lateral con listado de marcas (solo desktop)
- `CampaignsSidebar` — Panel derecho con campañas activas del período (solo desktop)
- `MobileBrands` — Carrusel horizontal de marcas para móvil
- `MobileCampaigns` — Listado de campañas adaptado para móvil

**Funcionalidades:**
- Selector combinado mes/año (desde 2023 hasta el mes actual)
- Conteo de marcas activas y campañas en el período
- Indicador de estado "En vivo"
- Navegación directa a la vista de cada marca
- Skeletons de carga para todos los componentes diferidos (`server:defer`)

---

### `/login` — Autenticación

Página de inicio de sesión. Solo accesible si el usuario no tiene sesión activa; redirige al dashboard si ya está autenticado.

**Funcionalidades:**
- Login con Google OAuth 2.0 (vía PocketBase, con PKCE y state validation)
- Login con email y contraseña
- Mostrar/ocultar contraseña
- Mensajes de error contextuales (sesión expirada, fallo de autenticación, error de estado)
- Indicador de error si Google OAuth no está disponible en el servidor
- Panel visual de presentación del sistema (solo desktop)
- Rate limiting aplicado desde middleware (5 intentos / 15 minutos)

---

### `/profile` — Perfil de usuario

Gestión de cuenta del usuario autenticado. Redirige a `/login` si no hay sesión.

**Secciones:**
- **Información de cuenta** — Nombre, email e ID de usuario
- **Cambiar contraseña** — Formulario con contraseña actual, nueva y confirmación (mínimo 8 caracteres)
- **Recuperar contraseña** — Envío de correo de recuperación al email registrado
- **Cerrar sesión** — Cierre de sesión en el dispositivo actual

**Mensajes de retroalimentación:**
- Éxito: contraseña actualizada, correo de recuperación enviado
- Error: contraseñas no coinciden, contraseña actual incorrecta, contraseña muy corta, fallo en el envío

---

### `/[brand]` — Vista mensual de marca

Vista detallada de una marca específica para el mes y año seleccionados. Si la marca no existe, redirige al dashboard.

**Componentes clave:**
- `BrandMonthView` — Métricas del período: gasto, leads, CPL y desglose por periodos de 5 días
- `CampaignsTable` — Tabla con todas las campañas activas de la marca en el período
- `BrandsSidebar` — Navegación lateral con el resto de marcas

**Funcionalidades:**
- Selector combinado mes/año
- Toggle de vista: **Mes** / **Año**
- Botón de retorno al resumen general
- Mensaje informativo cuando no hay datos para el período seleccionado

---

### `/[brand]/year` — Vista anual de marca

Resumen histórico de la marca para un año completo. Agrega las métricas mensuales pre-calculadas por el backend.

**Secciones:**
- **KPIs anuales** — Gasto total anual, leads totales, CPL promedio anual
- **Tabla de desglose mensual** — Fila por cada mes con datos; columnas: Mes, Gasto, Leads, CPL (con color según rendimiento)
  - Enlace directo a la vista mensual de cada fila

**Funcionalidades:**
- Selector de año (2023–año actual)
- Toggle de vista: **Mes** / **Año**
- Botón de retorno al resumen general
- Mensaje cuando no hay datos para el año seleccionado

---

### `/[brand]/campaigns/[id]` — Detalle de campaña

Vista granular de una campaña individual. Valida que la campaña pertenezca a la marca de la URL; redirige si no coincide.

**Secciones:**
- **Header** — Nombre de la campaña, canal detectado (Google Ads, Meta Ads, TikTok, etc.), marca y período
- **KPI cards** — Gasto, Leads, CPL (con color), CTR (indicado como no disponible actualmente)
- **Rendimiento por periodos** — Tabla con 6 bloques de ~5 días: gasto, leads y CPL por bloque
- **Historial mensual** — Tabla con datos de la campaña mes a mes dentro del año (solo si hay más de 1 mes registrado)

**Funcionalidades:**
- Detección automática de canal por nombre de campaña
- Color del CPL según umbral de rendimiento
- Navegación de retorno a la vista mensual de la marca

---

### `/auth/callback` — Callback OAuth

Ruta interna que procesa la respuesta de Google OAuth. Valida el `state`, intercambia el código por token con PocketBase, establece la cookie de sesión y redirige al dashboard. En caso de error redirige a `/login?error=...`.

### `/auth/logout` — Cierre de sesión

Endpoint que limpia la cookie `pb_auth` y redirige a `/login`.

---

## 🔌 Server Actions (`src/actions/index.ts`)

Toda la lógica de acceso a datos está centralizada en Astro Actions:

| Acción | Descripción |
| :--- | :--- |
| `getUniqueBrands` | Lista de marcas únicas disponibles |
| `getGlobalStats(year, month)` | Estadísticas globales consolidadas del período |
| `getBrandsRanking(year, month)` | Marcas ordenadas por gasto del período |
| `getAllCampaigns(year, month)` | Todas las campañas activas del período |
| `getGlobalYearStats(year)` | Datos globales mes a mes de un año |
| `getBrandFullData(brandName, year, month)` | Reporte de marca + sus campañas del período |
| `getBrandYearData(brandName, year)` | Datos mensuales de una marca en un año |
| `getCampaignById(id)` | Datos completos de una campaña específica |
| `getCampaignHistory(campaignName, brandName, year)` | Historial mensual de una campaña en el año |
| `getBrandCampaigns(brandName, year, month)` | Campañas de una marca en un período |

---

## 🔒 Middleware y autenticación

El archivo `src/middleware.ts` protege todas las rutas excepto:
- `/login`
- `/auth/callback`
- `/auth/logout`
- `/api/login`

**Flujo de autenticación:**
1. Verifica la cookie `pb_auth`
2. Valida expiración del JWT
3. Refresca el token vía PocketBase si es necesario
4. Redirige a `/login?error=session_expired` si el token no es válido

**Rate limiting en login:**
- Máximo 5 intentos cada 15 minutos por IP
- Aplica tanto a `/api/login` como a la carga de la página `/login`

---

## 🧞 Comandos

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala las dependencias |
| `npm run dev` | Inicia el servidor de desarrollo en `localhost:4321` |
| `npm run build` | Genera el build de producción en `./dist/` |
| `npm run preview` | Previsualiza el build de producción localmente |
| `npm run astro ...` | Ejecuta comandos del CLI de Astro |

---

## ⚙️ Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# URL del servidor PocketBase
POCKETBASE_URL=https://tu-pocketbase.ejemplo.com

# Token de autenticación del servidor para PocketBase (admin)
POCKETBASE_TOKEN=tu_token_aqui
```

> El archivo `.env` está incluido en `.gitignore` y nunca debe subirse al repositorio.
