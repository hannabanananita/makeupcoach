# Makeup Coach Studio

Tienda online de maquillaje con análisis de tono de piel por IA, carrito de compras y panel de administración. Diseño **claymorphism** con colores pastel, sombras suaves y tipografía redondeada.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML, CSS (claymorphism), JavaScript vanilla |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL en Neon (serverless) |
| IA | Google Gemini 1.5 Flash (análisis de tono de piel) |
| Fuentes | Fredoka, Plus Jakarta Sans |
| Iconos | Boxicons |

## Funcionalidades

**Tienda**
- Catálogo de productos cargado desde PostgreSQL
- Imágenes almacenadas como BYTEA en la base de datos
- Badges de inventario (disponible / sin stock)
- Carrito de compras con total en COP
- Pedido por WhatsApp con datos del cliente

**Escáner IA**
- Captura de color de piel por cámara web
- Análisis con Gemini para recomendar base, labial, rubor y sombras
- Modo fallback aleatorio cuando no hay API key configurada

**Panel Admin** (`/admin.html`)
- Login con credenciales hardcodeadas
- Tabla de productos con búsqueda en tiempo real
- Crear, editar y eliminar productos
- Carga de imagen desde archivo (se almacena como BYTEA)
- Stats: total, en stock, sin stock

## Esquema de base de datos

```sql
CREATE TABLE productos (
    id          INTEGER      PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    nombre      VARCHAR(100) NOT NULL,
    precio      INTEGER      NOT NULL,
    imagen      BYTEA,
    inventario  INTEGER      NOT NULL DEFAULT 0,
    etiqueta    VARCHAR(50),
    description VARCHAR(500) NOT NULL
);
```

## Instalación local

**Requisitos:** Node.js 18+

```bash
npm install
node server.js
```

Abre `http://localhost:3000`

## Configuración

**Gemini IA** — edita `script.js` línea 1:
```js
const GEMINI_API_KEY = 'TU_KEY_AQUI';
```
Sin key, el análisis usa un selector aleatorio de tonos.

**Admin** — credenciales en `server.js`:
```
Usuario:    admin
Contraseña: Hanna2026
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/productos` | Lista todos los productos (pública) |
| POST | `/api/admin/login` | Autenticación admin |
| GET | `/api/admin/productos` | Lista productos (admin) |
| POST | `/api/admin/productos` | Crear producto |
| PUT | `/api/admin/productos/:id` | Actualizar producto |
| DELETE | `/api/admin/productos/:id` | Eliminar producto |

Las rutas `/api/admin/*` requieren el header `x-admin-token`.

## Deploy en Render

1. Sube el código a un repositorio de GitHub
2. En [render.com](https://render.com) → **New** → **Web Service**
3. Conecta el repositorio y configura:

| Campo | Valor |
|-------|-------|
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Instance Type | Free |

La URL quedará disponible en `https://tu-app.onrender.com`.

> El tier gratuito de Render duerme la app tras 15 min de inactividad. La primera visita tarda ~30 segundos en despertar.

## Estructura de archivos

```
├── index.html       # Tienda principal
├── admin.html       # Panel de administración
├── styles.css       # Estilos compartidos (claymorphism)
├── admin.css        # Estilos del panel admin
├── script.js        # Lógica de la tienda
├── admin.js         # Lógica del panel admin
├── server.js        # Servidor Express + API
├── package.json
├── assets/          # Imágenes locales (solo para seed)
└── seed.js          # Script para poblar la base de datos (excluido del repo)
```
