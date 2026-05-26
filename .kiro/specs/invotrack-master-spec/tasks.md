# Implementation Plan: InvoTrack Master Spec

## Overview

Plan de implementación incremental de InvoTrack organizado en 4 fases del roadmap. Cada tarea construye sobre las anteriores, comenzando por la fundación del sistema multiempresa, avanzando hacia las features core, analítica y finalmente integraciones externas.

El lenguaje de implementación es **JavaScript (JSX/JS)** en todo el proyecto. No se migra a TypeScript.

---

## Tasks

### Fase 1 — Fundación

- [x] 1. Configurar infraestructura base y sistema multiempresa
  - [x] 1.1 Verificar y actualizar `vite.config.js` para soportar el alias `@/` apuntando a `src/`
    - Confirmar que `jsconfig.json` tiene el alias `@/*` → `src/*` para autocompletado en VS Code
    - _Requirements: 1.7_
  - [x] 1.2 Revisar y completar `src/lib/`: `database.js`, `supabase.js`, `queryClient.js`, `constants.js`, `utils.js`
    - Asegurar que `database.js` tiene JSDoc `@typedef` para: `Company`, `Invoice`, `InvoiceItem`, `InvoicePayment`, `Client`, `Provider`, `UserRole`, `InvoiceStatus`, `InvoiceFlowType`, `TaxCondition`
    - Asegurar que `supabase.js` exporta el singleton del cliente Supabase
    - Asegurar que `constants.js` exporta `IVA_RATES`, `ROUTES`, `QUERY_KEYS`
    - _Requirements: 2.4, 2.5, 2.6_

- [x] 2. Completar feature `auth`
  - [x] 2.1 Revisar `authService.js` y `authSchemas.js`
    - Asegurar que `authService` implementa: `signIn`, `signUp`, `signOut`, `resetPassword`, `signInWithGoogle`
    - Asegurar que `authSchemas.js` define schemas Zod para login y registro
    - _Requirements: 3.1, 3.8, 3.9_
  - [x] 2.2 Revisar y completar `AuthContext.jsx`
    - Exponer: `user`, `session`, `loading`, `isAuthenticated`
    - Asegurar que solo `TOKEN_REFRESHED` y `SIGNED_OUT` actualizan el estado
    - _Requirements: 3.4, 3.6, 3.7, 13.7_
  - [x] 2.3 Revisar `LoginPage.jsx` y `RegisterPage.jsx`
    - Asegurar validación con Zod y manejo de errores de Supabase Auth
    - _Requirements: 3.1, 3.3_


- [x] 3. Implementar feature `companies` e integrar `CompanyProvider`
  - [x] 3.1 Crear `src/features/companies/services/companyService.js`
    - Implementar operaciones: `getAll(userId)`, `getById(id)`, `create(data)`, `update(id, data)`
    - Recibir `userId` como parámetro explícito; nunca importar contextos React
    - _Requirements: 4.1, 4.4, 1.4_
  - [x] 3.2 Completar `CompanyContext.jsx`
    - Exponer: `company`, `companies`, `role`, `loading`, `switchCompany`, `refetch`, `isAdmin`, `isAccountant`, `canWrite`
    - Persistir empresa activa en `localStorage` bajo clave `invotrack_company_id`
    - _Requirements: 4.2, 4.3, 4.4, 4.7_
  - [x] 3.3 Integrar `CompanyProvider` en `App.jsx`
    - Jerarquía: `QueryClientProvider > AuthProvider > CompanyProvider > ToastProvider > RouterProvider`
    - _Requirements: 15.1, 4.1_
  - [x] 3.4 Revisar `src/app/router.jsx` y layouts
    - Asegurar que `AppLayout.jsx`, `AuthLayout.jsx`, `ProtectedLayout.jsx` están correctamente implementados
    - `ProtectedLayout` redirige a `/login` si no hay sesión; redirige a `/onboarding` si no hay empresa
    - _Requirements: 3.2, 3.3, 4.8_

- [x] 4. Implementar flujo de onboarding de empresa
  - [x] 4.1 Crear `src/features/companies/pages/OnboardingPage.jsx`
    - Formulario con campos: `name`, `cuit`, `address`, `tax_condition`
    - Validar CUIT con `cuitSchema` antes de persistir
    - Al guardar: `companyService.create()` → `CompanyContext.refetch()` → redirigir a `/dashboard`
    - _Requirements: 4.8, 15.1, 8.6_
  - [x] 4.2 Agregar ruta `/onboarding` al router y actualizar `ProtectedLayout`
    - `ProtectedLayout` verifica: si autenticado pero sin empresa → redirige a `/onboarding`
    - _Requirements: 4.8, 3.2_

- [x] 5. Actualizar RLS policies para aislamiento por `company_id`
  - [x] 5.1 Crear migración SQL `supabase/migrations/001_rls_company_isolation.sql`
    - Actualizar políticas de `invoices`, `clients`, `providers`, `alerts`, `invoice_payments` para usar `company_id` con join a `user_roles` o `owner_id`
    - Verificar que `invoice_items`, `attachments` usan acceso transitivo via `invoice_id`
    - _Requirements: 12.1, 12.2, 12.3, 4.9_
  - [x] 5.2 Crear migración SQL `supabase/migrations/002_triggers_indexes_views.sql`
    - Triggers: `update_updated_at` en `invoices`, `clients`, `providers`; `on_auth_user_created`
    - Índices: `invoices(company_id)`, `invoices(company_id, status)`, `invoices(company_id, fecha_emision)`, `invoice_items(invoice_id)`, `clients(company_id)`, `providers(company_id)`
    - Vistas: `invoice_financial_summary`, `company_cash_flow`
    - _Requirements: 12.4, 12.5, 12.6_

- [x] 6. Configurar framework de tests con Vitest y fast-check
  - [x] 6.1 Instalar y configurar Vitest con `@vitest/coverage-v8` y `fast-check`
    - Crear `vitest.config.js` con alias `@/` y configuración de cobertura
    - Crear estructura de carpetas `src/features/{feature}/__tests__/`
    - _Requirements: 15.1_
  - [ ]* 6.2 Escribir property test — Property 1: Clamping de confidence scores
    - **Property 1: Para cualquier objeto de scores con valores arbitrarios, `clampConfidenceScores` produce valores en `[0.0, 1.0]`**
    - **Validates: Requirements 6.4**
  - [ ]* 6.3 Escribir property test — Property 7: Validación de formato CUIT
    - **Property 7: `cuitSchema` acepta exactamente strings con formato `XX-XXXXXXXX-X` y rechaza todos los demás**
    - **Validates: Requirements 8.6**

- [x] 7. Checkpoint Fase 1 — Verificar fundación
  - Ejecutar `vitest --run` y verificar que todos los tests pasan
  - Verificar que `CompanyProvider` está integrado en `App.jsx` y el flujo de onboarding funciona
  - Asegurar que todas las migraciones SQL están en `supabase/migrations/`
  - Preguntar al usuario si hay dudas antes de continuar con Fase 2


---

### Fase 2 — Core Features

- [ ] 8. Implementar CRUD completo de facturas
  - [x] 8.1 Crear `src/features/invoices/schemas/invoiceSchemas.js`
    - Definir `invoiceItemSchema`, `invoiceSchema`, `invoiceFilterSchema` con Zod
    - Validar alícuotas IVA contra `IVA_RATES = [0, 10.5, 21, 27]`
    - _Requirements: 5.7, 5.9, 5.10, 5.11, 5.12, 5.13_
  - [ ]* 8.2 Escribir property test — Property 4: Validación de alícuotas IVA
    - **Property 4: Para cualquier alícuota fuera de `{0, 10.5, 21, 27}`, `invoiceItemSchema` la rechaza; para cualquier alícuota dentro del conjunto, la acepta**
    - **Validates: Requirements 5.7**
  - [ ]* 8.3 Escribir property test — Property 11: Validación Zod rechaza inputs inválidos
    - **Property 11: Para cualquier objeto que no satisfaga `invoiceSchema`, la validación retorna error antes de llegar a Supabase**
    - **Validates: Requirements 13.2**
  - [x] 8.4 Implementar función `calculateInvoiceTotals` en `src/lib/utils.js`
    - Calcular `neto_gravado`, `iva_105`, `iva_21`, `iva_27`, `total_amount` a partir de ítems
    - _Requirements: 5.7_
  - [ ]* 8.5 Escribir property test — Property 8: Cálculo de totales de factura
    - **Property 8: Para cualquier lista de ítems válidos, `calculateInvoiceTotals` produce `total_amount = sum(cantidad × precio_unitario × (1 + alicuota_iva/100))`**
    - **Validates: Requirements 5.7**
  - [x] 8.6 Completar `invoiceService.js`
    - Implementar `getAll(opts)` con filtros: `status`, `type`, `search`, `companyId`, `dateFrom`, `dateTo`, paginación `page`/`pageSize` (máx 100)
    - Implementar `getById`, `create` (atómico: factura + ítems con rollback), `update`, `delete`
    - Incluir `invoice_items` en `getAll` y `getById` via join
    - _Requirements: 5.1, 5.2, 5.3, 5.8, 5.9, 5.14, 9.1, 9.2, 9.4, 12.11_
  - [ ]* 8.7 Escribir property test — Property 6: Filtrado preserva invariante de pertenencia
    - **Property 6: Para cualquier colección de facturas y combinación de filtros, todos los elementos del resultado satisfacen simultáneamente todos los filtros aplicados**
    - **Validates: Requirements 5.8, 9.1**
  - [x] 8.8 Completar `useInvoices.js`
    - Leer `company.id` desde `useCompany()` y pasarlo al service
    - Retornar `{ data, count, isLoading, error }`
    - _Requirements: 1.4_
  - [x] 8.9 Completar `InvoiceForm.jsx`, `InvoiceTable.jsx`, `InvoiceStatusBadge.jsx`
    - `InvoiceForm`: todos los campos fiscales argentinos del schema
    - `InvoiceTable`: columnas, paginación, acciones
    - _Requirements: 5.9, 5.10, 5.11, 5.12_
  - [x] 8.10 Completar páginas de facturas: `InvoicesPage.jsx`, `NewInvoicePage.jsx`, `InvoiceDetailPage.jsx`
    - `InvoicesPage`: filtros con URL params, debounce 300ms en búsqueda, paginación server-side
    - `NewInvoicePage`: formulario completo con todos los campos fiscales argentinos
    - _Requirements: 9.3, 9.5, 5.9, 5.10, 5.11, 5.12_

- [ ] 9. Implementar registro de pagos parciales
  - [x] 9.1 Completar `invoicePaymentService.js`
    - Implementar `registerPayment(invoiceId, companyId, payment)`: insertar pago, recalcular suma, actualizar `status` a `paid` o `pending`
    - Implementar `getByInvoice(invoiceId, companyId)`: retornar lista de pagos
    - _Requirements: 5.4, 5.5, 5.6_
  - [ ]* 9.2 Escribir property test — Property 5: Determinación de estado por pagos
    - **Property 5: Para cualquier `total_amount` T y lista de pagos P: `sum(P) >= T` → `status = 'paid'`; `sum(P) < T` → `status = 'pending'`**
    - **Validates: Requirements 5.4, 5.5, 5.6**
  - [x] 9.3 Completar `useInvoicePayments.js` e implementar UI de pagos en `InvoiceDetailPage.jsx`
    - Formulario de registro de pago: `amount`, `payment_method`, `payment_date`, `notes`
    - Mostrar historial de pagos y saldo pendiente
    - _Requirements: 5.4_


- [ ] 10. Implementar pipeline OCR con Google Document AI
  - [x] 10.1 Crear `src/features/ocr/adapters/BaseOcrAdapter.js` con JSDoc
    - Definir clase abstracta `BaseOcrAdapter` con método `extractText(file)`
    - Documentar shapes: `OcrRawResult`, `OcrConfidenceScores`, `OcrNormalizedInvoice`, `OcrExtractedItem`
    - _Requirements: 6.1, 6.2_
  - [x] 10.2 Completar `MockOcrAdapter.js`
    - Simular extracción de factura argentina típica con datos realistas
    - _Requirements: 6.5_
  - [x] 10.3 Crear `src/features/ocr/adapters/GoogleDocumentAiAdapter.js`
    - Implementar `extractText(file)` llamando a la Edge Function de Supabase
    - Manejar errores de red y respuestas vacías
    - _Requirements: 6.1, 6.8_
  - [x] 10.4 Crear Edge Function `supabase/functions/ocr-google/index.ts`
    - Recibir archivo, llamar a Google Document AI API, retornar texto crudo
    - Leer credenciales desde variables de entorno de Supabase (nunca hardcodeadas)
    - _Requirements: 6.8, 13.1_
  - [x] 10.5 Completar `invoiceParser.js`
    - Parsear campos: `invoice_number`, `invoice_type`, `issue_date`, `due_date`, `seller_name`, `seller_cuit`, `buyer_name`, `buyer_cuit`, `subtotal`, `total_iva`, `total_amount`, `items[]`
    - Convertir fechas `DD/MM/YYYY` → `YYYY-MM-DD`
    - Nunca lanzar excepciones: retornar campos `null` con confidence `0.1` si no parseable
    - _Requirements: 6.3, 6.10_
  - [ ]* 10.6 Escribir property test — Property 2: Conversión de fechas argentinas (round-trip)
    - **Property 2: Para cualquier fecha válida en formato `DD/MM/YYYY`, `parseDate` produce `YYYY-MM-DD` que al reformatear produce la fecha original**
    - **Validates: Requirements 6.10**
  - [ ]* 10.7 Escribir property test — Property 3: Round-trip del parser OCR
    - **Property 3: Para cualquier texto de factura argentina válido, parsear → formatear → parsear produce resultado estructuralmente equivalente**
    - **Validates: Requirements 6.11**
  - [x] 10.8 Completar `ocrService.js` con `clampConfidenceScores`
    - Registrar adaptadores: `mock`, `google`, `gpt4v`, `gemini`
    - Clampear todos los scores al rango `[0.0, 1.0]` antes de retornar
    - _Requirements: 6.2, 6.4, 6.7, 6.8_
  - [x] 10.9 Completar `OcrPage.jsx` con flujo OCR → revisión → guardado
    - Validar tipo de archivo (PDF, JPEG, PNG, WEBP) antes de iniciar pipeline
    - Pre-poblar `InvoiceForm` con datos extraídos; mostrar scores de confianza por campo
    - Al guardar: persistir `ocr_provider`, `ocr_confidence`, `ocr_raw_text` en la factura
    - _Requirements: 6.6, 6.7, 6.9_

- [ ] 11. Implementar CRUD de clientes y proveedores
  - [x] 11.1 Completar `src/features/clients/schemas/clientSchemas.js`
    - Incluir validación de CUIT con `cuitSchema` (`XX-XXXXXXXX-X`)
    - _Requirements: 8.4, 8.6_
  - [x] 11.2 Completar `clientService.js`
    - Implementar `getAll(companyId, search?)`, `getById`, `create`, `update`, `delete`
    - Filtrar siempre por `company_id`; búsqueda por nombre con `ilike`
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 11.3 Escribir property test — Property 9: Búsqueda de clientes por nombre
    - **Property 9: Para cualquier lista de clientes y término de búsqueda no vacío, todos los clientes retornados contienen el término en `name` (case-insensitive)**
    - **Validates: Requirements 8.3**
  - [x] 11.4 Completar `useClients.js` y `ClientsPage.jsx`
    - UI con tabla, formulario de creación/edición en modal, confirmación de eliminación
    - _Requirements: 8.1_
  - [x] 11.5 Crear `src/features/providers/` con la misma estructura que `clients/`
    - `providerService.js` implementa el mismo contrato de interfaz que `clientService.js`
    - Crear `ProvidersPage.jsx` con UI equivalente a `ClientsPage.jsx`
    - _Requirements: 8.7, 2.3_

- [ ] 12. Checkpoint Fase 2 — Verificar core features
  - Ejecutar `vitest --run` y verificar que todos los property tests pasan
  - Verificar flujo completo: subir factura → OCR → revisar → guardar → registrar pago → estado actualizado
  - Preguntar al usuario si hay dudas antes de continuar con Fase 3


---

### Fase 3 — Analítica y Reportes

- [ ] 13. Implementar dashboard financiero completo
  - [x] 13.1 Crear `src/features/dashboard/hooks/useDashboard.js`
    - Calcular KPIs del mes actual usando `invoice_financial_summary`: total facturado, dinero ingresado, gastos del mes, resultado neto
    - Calcular contadores por estado: pagadas, pendientes, vencidas, total del mes
    - Filtrar por `company_id` de `CompanyContext`
    - _Requirements: 7.1, 7.2, 7.5, 7.7_
  - [x] 13.2 Completar `KpiCard.jsx`, `RevenueChart.jsx`, `InvoiceStatusChart.jsx`, `RecentInvoices.jsx`
    - `RevenueChart`: gráfico de evolución mensual ingresos vs gastos, últimos N meses (default 6, configurable)
    - `KpiCard`: mostrar resultado neto con fondo rojo cuando ≤ 0
    - Mostrar skeletons durante carga
    - _Requirements: 7.3, 7.4, 7.6, 7.8_
  - [x] 13.3 Completar `DashboardPage.jsx` y conectar con `useDashboard`
    - Integrar todos los componentes del dashboard
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 14. Implementar módulo de reportes con exportación CSV
  - [x] 14.1 Crear `src/features/reports/services/reportService.js`
    - Consultar vista `company_cash_flow` filtrada por `company_id`, rango de fechas y tipo de flujo
    - Calcular totales usando pagos reales de `invoice_payments`, no el campo `status`
    - _Requirements: 11.1, 11.4_
  - [ ]* 14.2 Escribir property test — Property 10: Flujo de caja basado en pagos reales
    - **Property 10: Para cualquier conjunto de facturas con `status = 'paid'` pero sin registros en `invoice_payments`, `company_cash_flow` muestra `total_collected = 0`**
    - **Validates: Requirements 11.4**
  - [x] 14.3 Crear `src/features/reports/pages/ReportsPage.jsx`
    - Filtros: rango de fechas y tipo de flujo (receivable/payable)
    - Tabla de resultados con totales: `invoice_count`, `total_invoiced`, `total_collected`, `total_pending`, `total_overdue`
    - Botón de exportación CSV que genera y descarga el archivo en el cliente
    - _Requirements: 11.2, 11.3_

- [ ] 15. Implementar sistema de alertas automáticas
  - [x] 15.1 Crear `src/features/alerts/services/alertService.js`
    - Implementar `getAll(companyId)`: retornar alertas no leídas y leídas
    - Implementar `markAsRead(alertId)`: actualizar `is_read = true`
    - Filtrar siempre por `company_id`
    - _Requirements: 10.2, 10.3, 10.5_
  - [x] 15.2 Crear `src/features/alerts/hooks/useAlerts.js`
    - Exponer conteo de alertas no leídas para el badge del sidebar
    - _Requirements: 10.4_
  - [x] 15.3 Completar `AlertsPage.jsx`
    - Mostrar lista de alertas con tipo, mensaje, factura asociada y estado de lectura
    - Acción de marcar como leída individual y masiva
    - _Requirements: 10.1, 10.3_
  - [x] 15.4 Actualizar `AppLayout.jsx` para mostrar badge con contador de alertas no leídas en el sidebar
    - _Requirements: 10.4_
  - [x] 15.5 Crear Edge Function `supabase/functions/check-alerts/index.ts`
    - Detectar facturas vencidas (`overdue`) y próximas a vencer (`upcoming`) en los próximos 7 días
    - Insertar alertas en tabla `alerts` para la empresa correspondiente
    - Diseñada para ejecutarse como cron job (Supabase pg_cron o invocación manual)
    - _Requirements: 10.1, 10.2_

- [ ] 16. Checkpoint Fase 3 — Verificar analítica y reportes
  - Ejecutar `vitest --run` y verificar que todos los tests pasan
  - Verificar que el dashboard muestra KPIs correctos y el CSV se exporta correctamente
  - Preguntar al usuario si hay dudas antes de continuar con Fase 4


---

### Fase 4 — Integraciones

- [ ] 17. Integración AFIP para validación de CAE
  - [x] 17.1 Crear `src/features/invoices/services/afipService.js`
    - Implementar `validateCae(cae, caeVencimiento, cuit)`: retornar `{ isValid, status, message }`
    - _Requirements: 15.4_
  - [x] 17.2 Crear Edge Function `supabase/functions/afip-validate/index.ts`
    - Llamar a la API de AFIP para verificar CAE
    - Actualizar campo `afip_status` en la factura correspondiente
    - Leer credenciales AFIP desde variables de entorno de Supabase
    - _Requirements: 15.4, 13.1_
  - [x] 17.3 Integrar validación AFIP en `InvoiceDetailPage.jsx`
    - Mostrar estado AFIP (`afip_status`) con indicador visual
    - Botón "Validar CAE" que invoca `afipService.validateCae()`
    - _Requirements: 15.4_

- [ ] 18. Notificaciones por email con Supabase Edge Functions + Resend
  - [x] 18.1 Crear Edge Function `supabase/functions/send-notification/index.ts`
    - Integrar con Resend API para envío de emails
    - Soportar plantillas: factura vencida, próxima a vencer, resumen semanal
    - Leer `RESEND_API_KEY` desde variables de entorno de Supabase
    - _Requirements: 15.4, 13.1_
  - [x] 18.2 Crear `src/features/settings/services/notificationService.js`
    - Implementar `sendTestEmail(email)` para verificar configuración
    - _Requirements: 15.4_
  - [x] 18.3 Actualizar `check-alerts` Edge Function para disparar emails al crear alertas
    - Llamar a `send-notification` cuando se detectan facturas vencidas o próximas a vencer
    - _Requirements: 15.4_

- [ ] 19. Soporte multi-moneda
  - [x] 19.1 Actualizar `src/lib/constants.js` con lista de monedas soportadas: `ARS`, `USD`, `EUR`
    - Exportar `SUPPORTED_CURRENCIES = ['ARS', 'USD', 'EUR']`
    - _Requirements: 15.4_
  - [x] 19.2 Actualizar `invoiceSchemas.js` para validar `moneda` contra la lista de monedas soportadas
    - Validar que `tipo_cambio` sea positivo
    - _Requirements: 15.4, 5.10_
  - [x] 19.3 Actualizar `InvoiceForm.jsx` para mostrar selector de moneda y campo de tipo de cambio
    - Mostrar tipo de cambio solo cuando `moneda !== 'ARS'`
    - _Requirements: 15.4_
  - [x] 19.4 Actualizar `ReportsPage.jsx` y `DashboardPage.jsx` para agrupar y mostrar totales por moneda
    - _Requirements: 15.4_

- [x] 20. Checkpoint final — Verificar integraciones y proyecto completo
  - Ejecutar `vitest --run` y verificar que todos los tests (unitarios y property-based) pasan
  - Verificar que no hay llamadas directas a Supabase desde componentes React
  - Preguntar al usuario si hay dudas o ajustes finales

---

## Notes

- Las tareas marcadas con `*` son opcionales (property tests) y pueden omitirse para un MVP más rápido, pero se recomienda ejecutarlas para garantizar correctness.
- El proyecto se mantiene en **JavaScript (JSX/JS)**. No se migra a TypeScript.
- Cada tarea referencia los requirements específicos que valida para trazabilidad completa.
- Los checkpoints al final de cada fase aseguran validación incremental antes de avanzar.
- Los property tests usan **fast-check** con mínimo 100 iteraciones (`numRuns: 100`).
- Las Edge Functions de Supabase usan TypeScript internamente (Deno runtime), pero el frontend permanece en JS.
- Las Edge Functions deben leer todas las credenciales externas (Google Document AI, AFIP, Resend) desde variables de entorno — nunca hardcodeadas.
- Todas las migraciones SQL deben crearse en `supabase/migrations/` con prefijo numérico secuencial.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1", "5.1", "6.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.2", "5.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "4.1", "6.2", "6.3"] },
    { "id": 5, "tasks": ["4.2"] },
    { "id": 6, "tasks": ["8.1", "10.1", "11.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4", "10.2", "11.2"] },
    { "id": 8, "tasks": ["8.5", "8.6", "9.1", "10.3", "10.4", "10.5", "11.3", "11.5"] },
    { "id": 9, "tasks": ["8.7", "8.8", "9.2", "10.6", "10.7", "10.8", "11.4"] },
    { "id": 10, "tasks": ["8.9", "9.3", "10.9"] },
    { "id": 11, "tasks": ["8.10"] },
    { "id": 12, "tasks": ["13.1", "14.1", "15.1"] },
    { "id": 13, "tasks": ["13.2", "14.2", "15.2", "15.5"] },
    { "id": 14, "tasks": ["13.3", "14.3", "15.3", "15.4"] },
    { "id": 15, "tasks": ["17.1", "18.1", "19.1"] },
    { "id": 16, "tasks": ["17.2", "18.2", "19.2"] },
    { "id": 17, "tasks": ["17.3", "18.3", "19.3"] },
    { "id": 18, "tasks": ["19.4"] }
  ]
}
```
