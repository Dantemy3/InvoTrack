# InvoTrack

Plataforma SaaS de gestión de facturas y gastos para PyMEs argentinas.

## Stack

- React 18 + Vite
- TailwindCSS v4
- Radix UI (componentes accesibles)
- TanStack Query (estado del servidor)
- React Hook Form + Zod (formularios y validación)
- Supabase (auth, base de datos, storage)
- Recharts (gráficos)
- React Router v7

## Setup

1. Clonar el repo
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Copiar el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```
4. Completar las variables en `.env` con tus credenciales de Supabase
5. Ejecutar el schema SQL en tu proyecto Supabase (`supabase/schema.sql`)
6. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Estructura del proyecto

```
src/
├── app/           # Router y configuración global
├── components/    # Componentes UI reutilizables
│   └── ui/        # Badge, Button, Card, Dialog, etc.
├── features/      # Módulos por feature
│   ├── auth/      # Login, Register, AuthContext
│   ├── dashboard/ # KPIs, gráficos, resumen
│   ├── invoices/  # CRUD facturas, tabla, formulario
│   ├── clients/   # Gestión de clientes
│   ├── providers/ # Gestión de proveedores
│   ├── ocr/       # Pipeline OCR modular
│   ├── reports/   # Reportes y analítica
│   ├── alerts/    # Alertas de vencimiento
│   └── settings/  # Configuración de cuenta
├── layouts/       # AppLayout, AuthLayout, ProtectedLayout
├── lib/           # Supabase, QueryClient, utils, constants
└── main.jsx
```

## OCR Architecture

El módulo OCR está diseñado para ser intercambiable:

- `adapters/` — Adaptadores por proveedor (Mock, Google Document AI, GPT-4V, Gemini)
- `parsers/` — Extracción de campos del texto crudo
- `services/ocrService.js` — Orquestador del pipeline

Para agregar un nuevo proveedor OCR, solo hay que crear un nuevo adaptador que extienda `BaseOcrAdapter`.

## Base de datos

El schema completo está en `supabase/schema.sql`. Incluye:
- RLS (Row Level Security) en todas las tablas
- Soporte multi-empresa (`company_id`)
- Trigger de auto-creación de perfil al registrarse
- Campos AFIP preparados para integración futura
- Índices optimizados

## Backend propio

La aplicación usa Supabase para PostgreSQL y autenticación. El servidor Express en
`server/` expone una API propia. Las operaciones de clientes, proveedores y productos
ya pasan por esa API; la emisión de ARCA tiene una ruta separada. El resto de los
módulos todavía consulta Supabase desde el frontend.

### Arranque local

1. En la raíz, ejecutar `npm install` y copiar `.env.example` a `.env` con
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
2. Ejecutar `npm install` dentro de `server/`. Copiar `server/.env.example` a
   `server/.env` y completar `SUPABASE_URL` y `SUPABASE_ANON_KEY` con los valores
   del mismo proyecto de Supabase.
3. Aplicar `supabase/migrations/007_products_company_rls.sql` en una base que ya
   tenga las migraciones anteriores. Esto permite que los miembros de una empresa
   trabajen con su catálogo de productos según su rol.
4. En una terminal ejecutar `npm run dev:api` y en otra `npm run dev`.
   La API escucha en `http://localhost:3001`; Vite redirige `/api` a ese puerto.
5. Comprobar `http://localhost:3001/api/v1/health` (devuelve `ok: true`).

En producción, configurar `VITE_API_URL` con la URL pública de la API terminada
en `/api/v1`, o dirigir `/api` al servidor Express desde el proxy de despliegue.
Configurar `CORS_ORIGIN` con el origen público del frontend.

La ruta de ARCA requiere además `SUPABASE_SERVICE_ROLE_KEY` y
`AFIPSDK_ACCESS_TOKEN` en `server/.env`. La clave service role nunca se coloca en
una variable `VITE_*` ni se envía al navegador.

### Rutas de catálogo

Todas las rutas salvo `health` requieren `Authorization: Bearer <token de Supabase>`.
El servidor verifica la membresía de la empresa y consulta PostgreSQL con ese
token, por lo que también se aplican las políticas RLS.

- `GET /api/v1/companies/:companyId/{clients|providers|products}`: lista con
  `search`, `page` y `pageSize` (máximo 100).
- `GET /api/v1/companies/:companyId/{clients|providers|products}/:id`: detalle.
- `POST /api/v1/companies/:companyId/{clients|providers|products}`: crear
  (admin o accountant).
- `PATCH /api/v1/companies/:companyId/{clients|providers|products}/:id`:
  actualizar (admin o accountant).
- `DELETE /api/v1/companies/:companyId/{clients|providers|products}/:id`:
  eliminar (solo admin).
