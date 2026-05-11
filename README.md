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
