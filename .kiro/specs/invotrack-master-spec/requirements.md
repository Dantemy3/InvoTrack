# Requirements Document

## Introduction

InvoTrack es una plataforma SaaS moderna para gestión inteligente de facturas con OCR y automatización contable, orientada a PyMEs argentinas. El sistema permite subir facturas en PDF o imagen, extraer datos automáticamente mediante OCR, gestionar múltiples empresas con aislamiento estricto de datos, y ofrecer un dashboard financiero en tiempo real.

Este documento es el **documento rector** del proyecto. Define la arquitectura oficial, las reglas del sistema, la estructura de base de datos, el flujo de autenticación, la arquitectura OCR, el roadmap por fases y la división de tareas para agentes especializados. Todo agente que trabaje en InvoTrack debe respetar las decisiones aquí documentadas.

El proyecto ya cuenta con una base funcional en React + Vite (JSX) con Supabase. El código existente sigue una arquitectura feature-based que este spec consolida y extiende. El proyecto se mantiene en JavaScript (JSX/JS) sin migración a TypeScript.

---

## Glossary

- **InvoTrack**: El sistema SaaS completo descrito en este documento.
- **System**: El conjunto de frontend React + backend Supabase que compone InvoTrack.
- **Frontend**: La aplicación React + Vite + JavaScript (JSX) que corre en el navegador del usuario.
- **Backend**: Los servicios de Supabase (Auth, Database PostgreSQL, Storage, Edge Functions).
- **OCR_Pipeline**: El módulo de extracción automática de datos de facturas mediante reconocimiento óptico de caracteres.
- **OCR_Adapter**: Clase que implementa `BaseOcrAdapter` y encapsula un proveedor OCR específico.
- **OCR_Parser**: Módulo que transforma texto crudo extraído por un adaptador en campos estructurados de factura.
- **Company**: Entidad empresarial registrada en el sistema. Unidad de aislamiento de datos.
- **User**: Persona autenticada en el sistema mediante Supabase Auth.
- **Profile**: Registro en la tabla `profiles` vinculado 1:1 con un `User` de Supabase Auth.
- **UserRole**: Asignación de un `User` a una `Company` con un rol específico (`admin`, `accountant`, `viewer`).
- **Invoice**: Documento fiscal (factura, nota de crédito, nota de débito, recibo) registrado en el sistema.
- **InvoiceItem**: Línea de detalle dentro de una `Invoice`.
- **InvoicePayment**: Registro de pago parcial o total aplicado a una `Invoice`.
- **Client**: Entidad a quien la empresa le emite facturas (cuentas por cobrar).
- **Provider**: Entidad de quien la empresa recibe facturas (cuentas por pagar).
- **RLS**: Row Level Security — mecanismo de PostgreSQL/Supabase que restringe el acceso a filas según el usuario autenticado. NUNCA debe desactivarse.
- **Dashboard**: Pantalla principal con KPIs financieros, gráficos y actividad reciente.
- **QueryClient**: Instancia de TanStack Query que gestiona el caché del servidor en el Frontend.
- **Router**: React Router v7 que gestiona la navegación del Frontend.
- **AuthContext**: Contexto React que expone el estado de autenticación del `User` actual.
- **CompanyContext**: Contexto React que expone la `Company` activa y el `UserRole` del `User` actual.
- **Service**: Módulo JavaScript que encapsula llamadas a Supabase. Agnóstico al contexto React.
- **Hook**: Custom React hook que conecta un `Service` con TanStack Query para gestión de estado del servidor.
- **Schema**: Definición Zod de validación de formularios.
- **Feature**: Módulo funcional autocontenido bajo `src/features/{feature_name}/`.
- **AppLayout**: Layout principal con sidebar y header, usado por todas las rutas protegidas.
- **ProtectedLayout**: Layout que verifica autenticación y redirige a `/login` si no hay sesión.
- **AuthLayout**: Layout para páginas públicas de autenticación (login, register).
- **AFIP**: Administración Federal de Ingresos Públicos — organismo fiscal argentino. Integración futura.
- **CUIT**: Clave Única de Identificación Tributaria — identificador fiscal argentino.
- **CAE**: Código de Autorización Electrónico — código AFIP para facturas electrónicas.
- **Roadmap**: Plan de desarrollo por fases del proyecto.
- **Agent**: Agente de IA especializado que ejecuta tareas de desarrollo sobre el proyecto.

---

## Requirements

### Requirement 1: Arquitectura General del Sistema

**User Story:** Como CTO, quiero que el sistema siga una arquitectura limpia, escalable y con separación estricta de responsabilidades, para que el código sea mantenible a largo plazo y múltiples agentes puedan trabajar en paralelo sin conflictos.

#### Acceptance Criteria

1. THE System SHALL organizar todo el código fuente bajo `src/` siguiendo la estructura feature-based definida en este documento.
2. THE System SHALL mantener separación estricta entre capas: UI (componentes/páginas), estado del servidor (hooks + TanStack Query), lógica de negocio (services), validación (schemas Zod).
3. THE System SHALL mantener todo el código en JavaScript (JSX/JS). No se requiere migración a TypeScript.
4. THE System SHALL prohibir que un `Service` importe o use directamente contextos React (`AuthContext`, `CompanyContext`). Los `company_id` y `user_id` deben pasarse como parámetros explícitos.
5. THE System SHALL prohibir código duplicado: toda lógica reutilizable debe extraerse a `src/lib/` o al hook/service correspondiente.
6. WHEN un agente crea un nuevo módulo, THE System SHALL requerir que siga la estructura de carpetas: `pages/`, `components/`, `hooks/`, `services/`, `schemas/` dentro de `src/features/{feature_name}/`.
7. THE Frontend SHALL usar alias de importación `@/` apuntando a `src/` en todos los archivos, sin rutas relativas que suban más de un nivel.

---

### Requirement 2: Estructura de Carpetas Oficial

**User Story:** Como Arquitecto Principal, quiero una estructura de carpetas canónica y documentada, para que todos los agentes sepan exactamente dónde crear cada tipo de archivo.

#### Acceptance Criteria

1. THE System SHALL mantener la siguiente estructura de primer nivel bajo `src/`:
   - `app/` — Router y configuración global de la aplicación
   - `assets/` — Imágenes, íconos y recursos estáticos
   - `components/ui/` — Componentes UI reutilizables (shadcn/ui y propios)
   - `features/` — Módulos funcionales por dominio
   - `layouts/` — AppLayout, AuthLayout, ProtectedLayout
   - `lib/` — Utilidades compartidas, cliente Supabase, QueryClient, constantes, tipos
2. THE System SHALL mantener la siguiente estructura dentro de cada `src/features/{feature}/`:
   - `components/` — Componentes React específicos del feature
   - `hooks/` — Custom hooks con TanStack Query
   - `pages/` — Páginas/vistas del feature (lazy-loaded en el router)
   - `schemas/` — Schemas de validación Zod
   - `services/` — Servicios de acceso a datos (Supabase)
3. THE System SHALL mantener los siguientes features como módulos independientes: `auth`, `companies`, `clients`, `providers`, `invoices`, `ocr`, `dashboard`, `reports`, `alerts`, `settings`.
4. THE System SHALL ubicar las constantes de base de datos y shapes de objetos en `src/lib/database.js`.
5. THE System SHALL ubicar el cliente Supabase en `src/lib/supabase.js` como singleton exportado.
6. THE System SHALL ubicar todas las constantes del dominio en `src/lib/constants.js`.

---

### Requirement 3: Sistema de Autenticación

**User Story:** Como usuario, quiero poder registrarme, iniciar sesión con email/contraseña o Google, y que mi sesión persista entre recargas, para acceder de forma segura a mis datos.

#### Acceptance Criteria

1. WHEN un usuario envía credenciales válidas, THE AuthContext SHALL actualizar el estado `user` y `session` con los datos retornados por Supabase Auth.
2. WHEN un usuario no autenticado intenta acceder a una ruta protegida, THE ProtectedLayout SHALL redirigir al usuario a `/login`.
3. WHEN un usuario autenticado intenta acceder a `/login` o `/register`, THE AuthLayout SHALL redirigir al usuario a `/dashboard`.
4. WHEN Supabase Auth emite un evento `onAuthStateChange`, THE AuthContext SHALL actualizar `user` y `session` de forma sincrónica.
5. WHEN un usuario completa el registro, THE Backend SHALL crear automáticamente un registro en la tabla `profiles` mediante el trigger `on_auth_user_created`.
6. THE AuthContext SHALL exponer: `user`, `session`, `loading`, `isAuthenticated`.
7. IF la variable `DEV_BYPASS_AUTH` está activa en desarrollo, THEN THE AuthContext SHALL usar un usuario mock sin llamar a Supabase, para facilitar el desarrollo local.
8. THE System SHALL soportar autenticación OAuth con Google mediante `supabase.auth.signInWithOAuth`.
9. THE System SHALL soportar flujo de recuperación de contraseña mediante `supabase.auth.resetPasswordForEmail`.
10. WHEN un usuario cierra sesión, THE AuthContext SHALL limpiar `user` y `session` y THE Router SHALL redirigir a `/login`.

---

### Requirement 4: Sistema Multiempresa

**User Story:** Como administrador, quiero gestionar múltiples empresas desde una sola cuenta, con aislamiento total de datos entre empresas, para que los datos de una empresa nunca sean visibles desde otra.

#### Acceptance Criteria

1. THE CompanyContext SHALL cargar todas las empresas accesibles para el usuario autenticado al iniciar sesión.
2. THE CompanyContext SHALL exponer: `company` (empresa activa), `companies` (lista completa), `role` (rol en empresa activa), `loading`, `switchCompany`, `isAdmin`, `isAccountant`, `canWrite`.
3. WHEN un usuario cambia de empresa activa, THE CompanyContext SHALL persistir la selección en `localStorage` bajo la clave `invotrack_company_id`.
4. THE System SHALL determinar el rol del usuario en una empresa mediante la tabla `user_roles`, con excepción del propietario (`owner_id`) que siempre tiene rol `admin`.
5. THE System SHALL garantizar que todas las consultas a `invoices`, `clients`, `providers`, `categories`, `alerts` y `invoice_payments` estén filtradas por `company_id` del usuario autenticado, independientemente del estado de RLS en la base de datos.
6. WHEN un usuario con rol `viewer` intenta crear o modificar datos, THE Frontend SHALL deshabilitar los controles de escritura y THE Backend SHALL rechazar la operación mediante RLS.
7. THE System SHALL soportar los roles: `admin` (acceso total), `accountant` (lectura + escritura, sin eliminar), `viewer` (solo lectura).
8. IF un usuario no tiene ninguna empresa asociada, THEN THE System SHALL redirigir al usuario a un flujo de creación de empresa.
9. THE System SHALL NUNCA desactivar RLS en ninguna tabla de la base de datos.

---

### Requirement 5: Gestión de Facturas

**User Story:** Como contador, quiero crear facturas con todos los campos reales de un comprobante fiscal argentino y gestionar su estado, para poder cargar cualquier tipo de factura que reciba o emita y mantener el control financiero de la empresa.

#### Acceptance Criteria

1. THE System SHALL soportar dos tipos de flujo de factura: `receivable` (cuentas por cobrar, emitidas a clientes) y `payable` (cuentas por pagar, recibidas de proveedores).
2. THE System SHALL soportar los estados de factura: `draft`, `pending`, `paid`, `overdue`, `cancelled`.
3. WHEN se crea una factura, IF algún `InvoiceItem` falla al insertarse, THEN THE invoiceService SHALL no persistir la factura y SHALL retornar un error, garantizando que no queden registros huérfanos.
4. THE System SHALL soportar pagos parciales mediante la tabla `invoice_payments`. El estado `paid` se determina cuando `SUM(payments.amount) >= invoice.total_amount`.
5. IF el total de pagos registrados es menor que `invoice.total_amount`, THEN THE invoiceService SHALL mantener el estado de la factura como `pending`.
6. WHEN el total de pagos registrados cubre o supera `invoice.total_amount`, THE invoiceService SHALL actualizar el estado de la factura a `paid`.
7. THE System SHALL calcular `neto_gravado`, `neto_no_gravado`, `exento`, `iva_105`, `iva_21`, `iva_27`, `otros_tributos` y `total_amount` en el frontend antes de persistir, usando únicamente las alícuotas de IVA definidas en `IVA_RATES` (0%, 10.5%, 21%, 27%). IF se intenta usar una alícuota fuera de este conjunto, THE Frontend SHALL rechazar el ítem con un error de validación.
8. THE invoiceService SHALL soportar filtros por: `status`, `type`, `search` (por número de factura), `companyId`, `dateFrom`, `dateTo`, con paginación (`page`, `pageSize` máximo 100).
9. THE System SHALL soportar todos los tipos de comprobante AFIP: Factura A, Factura B, Factura C, Factura M, Nota de Crédito A, Nota de Crédito B, Nota de Crédito C, Nota de Débito A, Nota de Débito B, Nota de Débito C, Recibo.
10. THE System SHALL almacenar en la tabla `invoices` los siguientes campos fiscales argentinos: `punto_de_venta` (INTEGER, 1–99999), `numero_comprobante` (INTEGER), `tipo_comprobante` (enum), `fecha_emision` (DATE), `fecha_vencimiento` (DATE), `condicion_pago` (enum: `contado`, `cuenta_corriente`), `moneda` (CHAR(3), default `ARS`), `tipo_cambio` (NUMERIC(10,4), default 1.0000), `cae` (VARCHAR(14)), `cae_vencimiento` (DATE), `afip_status` (VARCHAR).
11. THE System SHALL almacenar en la tabla `invoices` los datos del emisor: `emisor_cuit` (VARCHAR(13)), `emisor_razon_social` (VARCHAR), `emisor_condicion_iva` (enum: `RI`, `MO`, `EX`, `CF`, `RS`), `emisor_domicilio` (VARCHAR).
12. THE System SHALL almacenar en la tabla `invoices` los datos del receptor: `receptor_cuit` (VARCHAR(13)), `receptor_razon_social` (VARCHAR), `receptor_condicion_iva` (enum: `RI`, `MO`, `EX`, `CF`, `RS`), `receptor_domicilio` (VARCHAR).
13. THE System SHALL almacenar en `invoice_items`: `descripcion` (TEXT), `cantidad` (NUMERIC(12,4)), `unidad` (VARCHAR), `precio_unitario` (NUMERIC(15,2)), `alicuota_iva` (NUMERIC(5,2)), `subtotal_neto` (NUMERIC(15,2)), `subtotal_iva` (NUMERIC(15,2)).
14. WHEN se elimina una factura, THE Backend SHALL garantizar que no queden registros huérfanos en `invoice_items`, `invoice_payments` ni `attachments` asociados a esa factura.

---

### Requirement 6: Pipeline OCR

**User Story:** Como usuario, quiero subir una imagen o PDF de factura y que el sistema extraiga automáticamente los datos del comprobante, para reducir la carga de ingreso manual.

#### Acceptance Criteria

1. THE OCR_Pipeline SHALL seguir el patrón Adapter: cada proveedor OCR implementa `BaseOcrAdapter` con el método `extractText(file): Promise<OcrRawResult>`.
2. THE ocrService SHALL orquestar el pipeline en dos pasos: (1) extracción de texto crudo via `OCR_Adapter`, (2) parseo de campos estructurados via `OCR_Parser`.
3. THE OCR_Parser SHALL extraer los siguientes campos de texto crudo: `invoice_number`, `invoice_type`, `issue_date`, `due_date`, `seller_name`, `seller_cuit`, `buyer_name`, `buyer_cuit`, `subtotal`, `total_iva`, `total_amount`, `items[]`.
4. THE OCR_Parser SHALL retornar un objeto `confidence` con scores por campo (0.0 a 1.0) para que el usuario pueda identificar campos de baja confianza. IF un proveedor OCR retorna scores fuera del rango 0.0–1.0, THE System SHALL clampear los valores al rango válido antes de retornarlos. THE Frontend SHALL mostrar siempre los resultados OCR con sus scores de confianza, permitiendo al usuario decidir en base a ellos.
5. THE System SHALL incluir un `MockOcrAdapter` funcional para desarrollo y testing que simule la extracción de una factura argentina típica.
6. WHEN el OCR extrae datos de una factura, THE Frontend SHALL pre-poblar el formulario de nueva factura con los datos extraídos, permitiendo al usuario corregir antes de guardar.
7. THE System SHALL almacenar en la tabla `invoices` los campos: `ocr_provider`, `ocr_confidence` (JSONB), `ocr_raw_text` para trazabilidad.
8. THE ocrService SHALL soportar múltiples proveedores registrados en un mapa de adaptadores: `mock`, `google` (Google Document AI), `gpt4v` (GPT-4 Vision), `gemini` (Gemini Vision).
9. IF el archivo subido no es PDF ni imagen (JPEG, PNG, WEBP), THEN THE Frontend SHALL mostrar un error de validación antes de iniciar el pipeline OCR.
10. THE OCR_Parser SHALL parsear fechas en formato argentino `DD/MM/YYYY` y convertirlas a `YYYY-MM-DD` para almacenamiento.
11. FOR ALL valid invoice texts, parsing then formatting then parsing SHALL produce an equivalent structured result (round-trip property).

---

### Requirement 7: Dashboard Financiero

**User Story:** Como gerente, quiero ver un resumen financiero del mes actual con KPIs clave, gráficos de evolución y facturas recientes, para tomar decisiones informadas sobre el estado de la empresa.

#### Acceptance Criteria

1. THE Dashboard SHALL mostrar los siguientes KPIs del mes actual: total facturado, dinero ingresado (cobrado), gastos del mes (pagado a proveedores), resultado neto (ingresado − gastos).
2. THE Dashboard SHALL mostrar contadores de facturas por estado: pagadas, pendientes, vencidas, total del mes.
3. THE Dashboard SHALL mostrar un gráfico de evolución mensual de ingresos vs gastos para los últimos N meses (configurable, default 6).
4. THE Dashboard SHALL mostrar las facturas más recientes con acceso directo al detalle.
5. THE invoiceService SHALL calcular los KPIs del dashboard usando la vista `invoice_financial_summary` filtrada por `company_id` y mes actual.
6. WHEN los datos del dashboard están cargando, THE Dashboard SHALL mostrar skeletons de carga en lugar de valores vacíos, ocultando todo el contenido hasta que la carga se complete.
7. THE Dashboard SHALL filtrar todos los datos por la `Company` activa en `CompanyContext`.
8. WHEN el resultado neto es menor o igual a cero, THE Dashboard SHALL mostrar el bloque de resultado neto con estilo visual de alerta (fondo rojo).

---

### Requirement 8: Gestión de Clientes y Proveedores

**User Story:** Como administrador, quiero gestionar el directorio de clientes y proveedores de la empresa, para asociarlos a facturas y mantener información de contacto actualizada.

#### Acceptance Criteria

1. THE clientService SHALL soportar operaciones CRUD completas: `getAll`, `getById`, `create`, `update`, `delete`.
2. THE clientService SHALL filtrar siempre por `company_id` para garantizar aislamiento multiempresa.
3. THE clientService SHALL soportar búsqueda por nombre mediante `ilike` en Supabase.
4. THE System SHALL almacenar para clientes y proveedores: `name`, `cuit`, `email`, `phone`, `address`, `tax_condition`, `notes`.
5. WHEN se elimina un cliente, THE Backend SHALL mantener las facturas asociadas con `client_id = NULL` mediante `ON DELETE SET NULL`.
6. THE System SHALL validar el formato de CUIT argentino (`XX-XXXXXXXX-X`) en los schemas Zod antes de persistir.
7. THE providerService SHALL implementar el mismo contrato de interfaz que `clientService` para consistencia.

---

### Requirement 9: Búsqueda Avanzada e Historial de Facturas

**User Story:** Como contador, quiero buscar y filtrar facturas por múltiples criterios, para encontrar rápidamente cualquier comprobante en el historial.

#### Acceptance Criteria

1. THE invoiceService SHALL soportar filtrado simultáneo por: `status`, `type` (receivable/payable), `search` (número de factura), `companyId`, `dateFrom`, `dateTo`.
2. THE System SHALL implementar paginación server-side con `page` y `pageSize`, retornando el `count` total para calcular páginas.
3. WHEN el usuario escribe en el campo de búsqueda, THE Frontend SHALL aplicar debounce de 300ms y, una vez expirado el debounce, SHALL ejecutar la consulta de búsqueda de forma conjunta.
4. THE System SHALL ordenar las facturas por `issue_date` descendente por defecto.
5. THE Frontend SHALL mantener los filtros activos en la URL como query params para permitir compartir y navegar con el botón atrás.

---

### Requirement 10: Alertas y Notificaciones

**User Story:** Como administrador, quiero recibir alertas sobre facturas vencidas, próximas a vencer y anomalías detectadas, para actuar proactivamente sobre el estado financiero.

#### Acceptance Criteria

1. THE System SHALL soportar los tipos de alerta: `overdue` (factura vencida), `upcoming` (próxima a vencer), `duplicate` (posible duplicado), `anomaly` (anomalía detectada).
2. THE System SHALL almacenar alertas en la tabla `alerts` con referencia a la `Invoice` y `Company` correspondientes.
3. WHEN un usuario lee una alerta, THE System SHALL actualizar `is_read = true` en la tabla `alerts`.
4. THE Frontend SHALL mostrar un indicador visual (badge con contador) en el sidebar cuando existan alertas no leídas.
5. THE System SHALL filtrar alertas por `company_id` del usuario autenticado mediante RLS.

---

### Requirement 11: Reportes y Analítica

**User Story:** Como gerente, quiero generar reportes financieros por período, para analizar la evolución del negocio y preparar información contable.

#### Acceptance Criteria

1. THE System SHALL proveer una vista `company_cash_flow` en PostgreSQL que agregue por empresa, tipo de flujo y moneda: `invoice_count`, `total_invoiced`, `total_collected`, `total_pending`, `total_overdue`.
2. THE ReportsPage SHALL permitir filtrar por rango de fechas y tipo de flujo (receivable/payable).
3. THE System SHALL soportar exportación de datos de reportes en formato CSV.
4. THE System SHALL calcular el flujo de caja usando pagos reales de `invoice_payments`, no el campo `status` de la factura. IF los datos de pagos están incompletos o ausentes, THE System SHALL mostrar totales en cero o parciales sin recurrir a cálculos basados en estado.

---

### Requirement 12: Estructura de Base de Datos y RLS

**User Story:** Como Arquitecto Principal, quiero que la base de datos esté correctamente estructurada con RLS activo en todas las tablas y con el schema completo para facturas argentinas, para garantizar aislamiento de datos, seguridad empresarial y soporte a todos los campos fiscales requeridos.

#### Acceptance Criteria

1. THE Backend SHALL mantener RLS habilitado en todas las tablas: `profiles`, `companies`, `user_roles`, `clients`, `providers`, `invoices`, `invoice_items`, `invoice_payments`, `attachments`, `alerts`, `categories`, `audit_logs`.
2. THE Backend SHALL implementar políticas RLS usando `company_id` como unidad de aislamiento en todas las tablas de datos de negocio (`invoices`, `clients`, `providers`, `categories`, `alerts`, `invoice_payments`). La política base es: el usuario autenticado debe tener un registro en `user_roles` para el `company_id` de la fila, o ser el `owner_id` de la empresa.
3. THE Backend SHALL implementar las siguientes políticas RLS para tablas de soporte:
   - `profiles`: usuario solo accede a su propio perfil (`auth.uid() = id`)
   - `companies`: propietario (`owner_id = auth.uid()`) tiene acceso total; miembros con registro en `user_roles` tienen acceso de lectura
   - `invoice_items`, `invoice_payments`, `attachments`: acceso transitivo via `invoice_id` → `company_id` verificado contra `user_roles`
4. THE Backend SHALL mantener los triggers: `update_updated_at` (en `invoices`, `clients`, `providers`) y `on_auth_user_created` (crea `Profile` al registrar usuario).
5. THE Backend SHALL mantener índices en: `invoices(company_id)`, `invoices(company_id, status)`, `invoices(company_id, fecha_emision)`, `invoice_items(invoice_id)`, `clients(company_id)`, `providers(company_id)`.
6. THE Backend SHALL mantener las vistas `invoice_financial_summary` y `company_cash_flow` para analítica.
7. THE System SHALL usar `uuid_generate_v4()` para todos los IDs primarios.
8. THE System SHALL usar `TIMESTAMPTZ` para `created_at` y `updated_at`; `DATE` para `fecha_emision`, `fecha_vencimiento`, `cae_vencimiento`.
9. THE System SHALL usar `NUMERIC(15, 2)` para todos los campos monetarios (`precio_unitario`, `subtotal_neto`, `subtotal_iva`, `neto_gravado`, `neto_no_gravado`, `exento`, `iva_105`, `iva_21`, `iva_27`, `otros_tributos`, `total_amount`).
10. THE System SHALL usar `NUMERIC(5, 2)` para `alicuota_iva` en `invoice_items` y `NUMERIC(10, 4)` para `tipo_cambio` en `invoices`.
11. THE invoiceService SHALL incluir `invoice_items` en la consulta `getInvoices` mediante un join o consulta secundaria, de modo que cada factura retornada incluya su array de ítems completo.

---

### Requirement 13: Seguridad Empresarial

**User Story:** Como CTO, quiero que el sistema implemente seguridad en profundidad, para proteger los datos financieros sensibles de los clientes.

#### Acceptance Criteria

1. THE System SHALL NUNCA exponer credenciales de Supabase en el código fuente. Las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` deben cargarse desde `.env`.
2. THE System SHALL validar todos los inputs de usuario con schemas Zod antes de enviar datos a Supabase.
3. THE Backend SHALL usar `SECURITY DEFINER` en funciones que requieran permisos elevados (como `handle_new_user`).
4. THE System SHALL implementar `audit_logs` para registrar operaciones críticas: creación, modificación y eliminación de facturas.
5. THE Frontend SHALL sanitizar cualquier contenido renderizado desde datos externos (OCR, notas de facturas) para prevenir XSS.
6. THE System SHALL usar HTTPS en todos los entornos de producción.
7. WHEN un token de sesión expira o se cierra la sesión, THE AuthContext SHALL detectar los eventos `TOKEN_REFRESHED` o `SIGNED_OUT` de Supabase y actualizar el estado de autenticación. Otros eventos de Supabase Auth (como cambios de perfil o permisos) no deben disparar actualizaciones de estado en `AuthContext`.

---

### Requirement 14: Roadmap por Fases

**User Story:** Como Product Manager, quiero un roadmap claro por fases con objetivos definidos, para coordinar el trabajo de los agentes y entregar valor incremental.

#### Acceptance Criteria

1. THE System SHALL implementar la **Fase 1 — Fundación** con los siguientes entregables:
   - `CompanyProvider` integrado en `App.jsx` (actualmente ausente)
   - RLS policies actualizadas para filtrar por `company_id` (no solo `user_id`)
   - Flujo de onboarding: creación de empresa al primer login
   - Setup de TanStack Query y Zod en el proyecto
2. THE System SHALL implementar la **Fase 2 — Core Features** con los siguientes entregables:
   - OCR con proveedor real (Google Document AI o Gemini Vision)
   - Flujo completo de carga de factura con OCR → revisión → guardado
   - Gestión completa de clientes y proveedores (CRUD con UI)
   - Historial de facturas con filtros avanzados y paginación
   - Registro de pagos parciales con actualización automática de estado
3. THE System SHALL implementar la **Fase 3 — Analítica y Reportes** con los siguientes entregables:
   - Dashboard financiero completo con gráficos interactivos
   - Módulo de reportes con exportación CSV
   - Sistema de alertas automáticas (vencidas, próximas a vencer)
   - Búsqueda full-text en facturas
4. THE System SHALL implementar la **Fase 4 — Integraciones** con los siguientes entregables:
   - Integración AFIP para validación de CAE
   - Notificaciones por email (Supabase Edge Functions + Resend)
   - API pública REST para integraciones de terceros
   - Multi-moneda (ARS, USD, EUR)

---

### Requirement 15: División de Tareas para Agentes Especializados

**User Story:** Como Coordinador Técnico, quiero una división clara de responsabilidades entre agentes especializados, para que puedan trabajar en paralelo sin conflictos y con contexto suficiente.

#### Acceptance Criteria

1. THE System SHALL designar un **Agente de Base de Datos** responsable de: actualizar las RLS policies para usar `company_id`, crear migraciones SQL incrementales en `supabase/migrations/`, y mantener `database.js` sincronizado con el schema.
2. THE System SHALL designar un **Agente de Feature Auth/Companies** responsable de: integrar `CompanyProvider` en `App.jsx`, implementar el flujo de onboarding de empresa, y actualizar `ProtectedLayout` para verificar empresa activa.
3. THE System SHALL designar un **Agente de Feature Invoices** responsable de: completar el CRUD de facturas, implementar el registro de pagos parciales, y conectar el flujo OCR → formulario → guardado.
4. THE System SHALL designar un **Agente de Feature OCR** responsable de: integrar un proveedor OCR real (Google Document AI o Gemini), mejorar el `invoiceParser` con IA, y implementar la UI de revisión post-OCR.
5. THE System SHALL designar un **Agente de Dashboard/Reportes** responsable de: completar el dashboard con todos los KPIs, implementar el módulo de reportes con exportación, y optimizar las queries de analítica.
6. THE System SHALL designar un **Agente de UI/UX** responsable de: mantener el design system con shadcn/ui + TailwindCSS v4, implementar componentes reutilizables, y garantizar accesibilidad WCAG 2.1 AA.
7. WHEN un agente trabaja en un feature, THE Agent SHALL leer este documento rector antes de comenzar y respetar todas las decisiones arquitectónicas aquí definidas.
8. WHEN un agente detecta una inconsistencia entre el código existente y este documento, THE Agent SHALL documentar la discrepancia y proponer una corrección antes de implementar.

---

### Requirement 16: Reglas del Proyecto (Non-Negotiable)

**User Story:** Como CTO, quiero que existan reglas de proyecto no negociables documentadas, para que todos los agentes las respeten sin excepción.

#### Acceptance Criteria

1. THE System SHALL NUNCA desactivar RLS en ninguna tabla de Supabase, en ningún entorno.
2. THE System SHALL NUNCA hacer llamadas directas a Supabase desde componentes React. Toda interacción con Supabase debe pasar por un `Service`.
3. THE System SHALL NUNCA hardcodear `company_id` o `user_id`. Estos valores deben provenir de `CompanyContext` o `AuthContext` respectivamente.
4. THE System SHALL NUNCA commitear archivos `.env` con credenciales reales al repositorio.
5. THE System SHALL SIEMPRE usar `NUMERIC(15, 2)` para campos monetarios en PostgreSQL.
6. THE System SHALL SIEMPRE validar inputs con Zod antes de enviar datos a Supabase.
7. THE System SHALL SIEMPRE usar lazy loading para páginas en el Router (`React.lazy` + `Suspense`).
8. THE System SHALL SIEMPRE manejar estados de carga y error en los hooks de TanStack Query.
9. THE System SHALL SIEMPRE pasar `company_id` como parámetro explícito a los services, nunca leerlo desde el contexto dentro del service.
