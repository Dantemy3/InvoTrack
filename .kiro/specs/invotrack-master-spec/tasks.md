# Implementation Plan: InvoTrack Master Spec

## Overview

Plan de implementación incremental de InvoTrack organizado en 4 fases del roadmap. Cada tarea construye sobre las anteriores, comenzando por la fundación TypeScript y el sistema multiempresa, avanzando hacia las features core, analítica y finalmente integraciones externas.

El lenguaje de implementación es **TypeScript estricto** (`strict: true`) en todo el proyecto.

---

## Tasks

### Fase 1 — Fundación

- [ ] 1. Configurar TypeScript estricto e infraestructura base
  - [ ] 1.1 Crear `tsconfig.json` con `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, `noUnusedLocals: true`, `noUnusedParameters: true` y alias `@/*` → `src/*`
    - Actualizar `vite.config.ts` para soportar TypeScript y el alias `@/`
    - Instalar dependencias de desarrollo: `typescript`, `@types/node`
    - _Requirements: 14.2, 1.7_
  - [ ] 1.2 Migrar `src/lib/` a TypeScript: `database.types.ts`, `supabase.ts`, `queryClient.ts`, `constants.ts`, `utils.ts`
    - Reemplazar JSDoc `@typedef` con interfaces TypeScript en `database.types.ts`
    - Exportar todas las interfaces: `Company`, `Invoice`, `InvoiceItem`, `InvoicePayment`, `Client`, `Provider`, `UserRole`, `InvoiceStatus`, `InvoiceFlowType`, `TaxCondition`, etc.
    - _Requirements: 14.3, 14.4, 2.4, 2.5, 2.6_

- [ ] 2. Migrar feature `auth` a TypeScript
  - [ ] 2.1 Migrar `authService.js` → `authService.ts` y `authSchemas.js` → `authSchemas.ts`
    - Tipar todos los parámetros y retornos con tipos de `database.types.ts`
    - Derivar tipos de formulario con `z.infer<typeof schema>`
    - _Requirements: 14.1, 14.4, 14.6, 3.1, 3.8, 3.9_
  - [ ] 2.2 Migrar `AuthContext.jsx` → `AuthContext.tsx`
    - Tipar `AuthContextValue` con la interfaz del diseño: `user`, `session`, `loading`, `isAuthenticated`
    - Asegurar que solo `TOKEN_REFRESHED` y `SIGNED_OUT` actualizan el estado
    - _Requirements: 3.4, 3.6, 3.7, 13.7_
  - [ ] 2.3 Migrar `LoginPage.jsx` → `LoginPage.tsx` y `RegisterPage.jsx` → `RegisterPage.tsx`
    - Tipar props de componentes y handlers de formulario
    - _Requirements: 14.1, 3.1, 3.3_

- [ ] 3. Migrar feature `companies` a TypeScript e integrar `CompanyProvider`
  - [ ] 3.1 Crear `src/features/companies/types/company.types.ts` y `companyService.ts`
    - Implementar `companyService` con operaciones: `getAll`, `getById`, `create`, `update`
    - Tipar con interfaces de `database.types.ts`; recibir `userId` como parámetro explícito
    - _Requirements: 4.1, 4.4, 1.4, 17.10_
  - [ ] 3.2 Migrar `CompanyContext.jsx` → `CompanyContext.tsx`
    - Implementar `CompanyContextValue` completo: `company`, `companies`, `role`, `loading`, `switchCompany`, `refetch`, `isAdmin`, `isAccountant`, `canWrite`
    - Persistir empresa activa en `localStorage` bajo clave `invotrack_company_id`
    - _Requirements: 4.2, 4.3, 4.4, 4.7_
  - [ ] 3.3 Integrar `CompanyProvider` en `App.tsx` y migrar `App.jsx` → `App.tsx`
    - Jerarquía: `QueryClientProvider > AuthProvider > CompanyProvider > ToastProvider > RouterProvider`
    - _Requirements: 15.1, 4.1_
  - [ ] 3.4 Migrar `src/app/router.jsx` → `router.tsx` y layouts a TypeScript
    - Migrar `AppLayout.jsx`, `AuthLayout.jsx`, `ProtectedLayout.jsx` → `.tsx`
    - `ProtectedLayout` redirige a `/login` si no hay sesión; redirige a `/onboarding` si no hay empresa
    - _Requirements: 3.2, 3.3, 4.8, 17.8_

- [ ] 4. Implementar flujo de onboarding de empresa
  - [ ] 4.1 Crear `src/features/companies/pages/OnboardingPage.tsx`
    - Formulario de creación de empresa con campos: `name`, `cuit`, `address`, `tax_condition`
    - Validar CUIT con `cuitSchema` antes de persistir
    - Al guardar: llamar `companyService.create()` → `CompanyContext.refetch()` → redirigir a `/dashboard`
    - _Requirements: 4.8, 15.1, 8.6_
  - [ ] 4.2 Agregar ruta `/onboarding` al router y actualizar `ProtectedLayout`
    - `ProtectedLayout` verifica: si autenticado pero sin empresa → redirige a `/onboarding`
    - _Requirements: 4.8, 3.2_

- [ ] 5. Actualizar RLS policies para aislamiento por `company_id`
  - [ ] 5.1 Crear migración SQL `supabase/migrations/001_rls_company_isolation.sql`
    - Actualizar políticas de `invoices`, `clients`, `providers`, `alerts`, `invoice_payments` para usar `company_id` con join a `user_roles` o `owner_id`
    - Verificar que `invoice_items`, `attachments` usan acceso transitivo via `invoice_id`
    - _Requirements: 12.1, 12.2, 12.3, 4.9, 17.1_
  - [ ] 5.2 Crear migración SQL `supabase/migrations/002_triggers_indexes_views.sql`
    - Triggers: `update_updated_at` en `invoices`, `clients`, `providers`; `on_auth_user_created`
    - Índices: `invoices(company_id)`, `invoices(company_id, status)`, `invoices(company_id, fecha_emision)`, `invoice_items(invoice_id)`, `clients(company_id)`, `providers(company_id)`
    - Vistas: `invoice_financial_summary`, `company_cash_flow`
    - _Requirements: 12.4, 12.5, 12.6_

- [ ] 6. Configurar framework de tests con Vitest y fast-check
  - [ ] 6.1 Instalar y configurar Vitest con `@vitest/coverage-v8` y `fast-check`
    - Crear `vitest.config.ts` con alias `@/` y configuración de cobertura
    - Crear estructura de carpetas `src/features/{feature}/__tests__/`
    - _Requirements: 15.1_
  - [ ]* 6.2 Escribir property test — Property 1: Clamping de confidence scores
    - **Property 1: Para cualquier objeto de scores con valores arbitrarios, `clampConfidenceScores` produce valores en `[0.0, 1.0]`**
    - **Validates: Requirements 6.4**
  - [ ]* 6.3 Escribir property test — Property 7: Validación de formato CUIT
    - **Property 7: `cuitSchema` acepta exactamente strings con formato `XX-XXXXXXXX-X` y rechaza todos los demás**
    - **Validates: Requirements 8.6**

- [ ] 7. Checkpoint Fase 1 — Verificar fundación TypeScript
  - Ejecutar `tsc --noEmit` sin errores en todos los archivos migrados
  - Ejecutar `vitest --run` y verificar que todos los tests pasan
  - Verificar que `CompanyProvider` está integrado en `App.tsx` y el flujo de onboarding funciona
  - Asegurar que todas las migraciones SQL están en `supabase/migrations/`
  - Preguntar al usuario si hay dudas antes de continuar con Fase 2


---

### Fase 2 — Core Features

- [ ] 8. Migrar e implementar CRUD completo de facturas con TypeScript
  - [ ] 8.1 Crear `src/features/invoices/types/invoice.types.ts` y migrar `invoiceSchemas.js` → `invoiceSchemas.ts`
    - Definir `invoiceItemSchema`, `invoiceSchema`, `invoiceFilterSchema` con Zod
    - Validar alícuotas IVA contra `IVA_RATES = [0, 10.5, 21, 27]`
    - Derivar tipos con `z.infer<typeof schema>`
    - _Requirements: 5.7, 5.9, 5.10, 5.11, 5.12, 5.13, 14.6_
  - [ ]* 8.2 Escribir property test — Property 4: Validación de alícuotas IVA
    - **Property 4: Para cualquier alícuota fuera de `{0, 10.5, 21, 27}`, `invoiceItemSchema` la rechaza; para cualquier alícuota dentro del conjunto, la acepta**
    - **Validates: Requirements 5.7**
  - [ ]* 8.3 Escribir property test — Property 11: Validación Zod rechaza inputs inválidos
    - **Property 11: Para cualquier objeto que no satisfaga `invoiceSchema`, la validación retorna error antes de llegar a Supabase**
    - **Validates: Requirements 13.2**
  - [ ] 8.4 Implementar función `calculateInvoiceTotals` en `src/lib/utils.ts`
    - Calcular `neto_gravado`, `iva_105`, `iva_21`, `iva_27`, `total_amount` a partir de ítems
    - _Requirements: 5.7_
  - [ ]* 8.5 Escribir property test — Property 8: Cálculo de totales de factura
    - **Property 8: Para cualquier lista de ítems válidos, `calculateInvoiceTotals` produce `total_amount = sum(cantidad × precio_unitario × (1 + alicuota_iva/100))`**
    - **Validates: Requirements 5.7**
  - [ ] 8.6 Migrar `invoiceService.js` → `invoiceService.ts`
    - Implementar `getAll(opts: InvoiceFilters)` con filtros: `status`, `type`, `search`, `companyId`, `dateFrom`, `dateTo`, paginación `page`/`pageSize` (máx 100)
    - Implementar `getById`, `create` (atómico: factura + ítems), `update`, `delete`
    - `create` debe hacer rollback de la factura si falla la inserción de ítems
    - Incluir `invoice_items` en `getAll` y `getById` via join
    - _Requirements: 5.1, 5.2, 5.3, 5.8, 5.9, 5.14, 9.1, 9.2, 9.4, 12.11_
  - [ ]* 8.7 Escribir property test — Property 6: Filtrado preserva invariante de pertenencia
    - **Property 6: Para cualquier colección de facturas y combinación de filtros, todos los elementos del resultado satisfacen simultáneamente todos los filtros aplicados**
    - **Validates: Requirements 5.8, 9.1**
  - [ ] 8.8 Migrar `useInvoices.js` → `useInvoices.ts`
    - Tipar con `UseQueryResult<{ data: Invoice[]; count: number }>`
    - Leer `company.id` desde `useCompany()` y pasarlo al service
    - _Requirements: 14.5, 1.4_
  - [ ] 8.9 Migrar `InvoiceForm.jsx` → `InvoiceForm.tsx`, `InvoiceTable.jsx` → `InvoiceTable.tsx`, `InvoiceStatusBadge.jsx` → `InvoiceStatusBadge.tsx`
    - Tipar todas las props con interfaces TypeScript
    - _Requirements: 14.1_
  - [ ] 8.10 Migrar páginas de facturas: `InvoicesPage.jsx`, `NewInvoicePage.jsx`, `InvoiceDetailPage.jsx` → `.tsx`
    - `InvoicesPage`: implementar filtros con URL params, debounce 300ms en búsqueda, paginación server-side
    - `NewInvoicePage`: formulario completo con todos los campos fiscales argentinos
    - _Requirements: 9.3, 9.5, 5.9, 5.10, 5.11, 5.12_


- [ ] 9. Implementar registro de pagos parciales
  - [ ] 9.1 Migrar `invoicePaymentService.js` → `invoicePaymentService.ts`
    - Implementar `registerPayment(invoiceId, companyId, payment)`: insertar pago, recalcular suma, actualizar `status` a `paid` o `pending`
    - Implementar `getByInvoice(invoiceId, companyId)`: retornar lista de pagos
    - _Requirements: 5.4, 5.5, 5.6_
  - [ ]* 9.2 Escribir property test — Property 5: Determinación de estado por pagos
    - **Property 5: Para cualquier `total_amount` T y lista de pagos P: `sum(P) >= T` → `status = 'paid'`; `sum(P) < T` → `status = 'pending'`. Válido para pagos fraccionados, exactos y sobrepagos**
    - **Validates: Requirements 5.4, 5.5, 5.6**
  - [ ] 9.3 Migrar `useInvoicePayments.js` → `useInvoicePayments.ts` e implementar UI de pagos en `InvoiceDetailPage.tsx`
    - Formulario de registro de pago con campos: `amount`, `payment_method`, `payment_date`, `notes`
    - Mostrar historial de pagos y saldo pendiente
    - _Requirements: 5.4, 14.5_

- [ ] 10. Implementar pipeline OCR con Google Document AI
  - [ ] 10.1 Crear `src/features/ocr/types/ocr.types.ts` con interfaces: `OcrRawResult`, `OcrConfidenceScores`, `OcrNormalizedInvoice`, `OcrExtractedItem`, clase abstracta `BaseOcrAdapter`
    - _Requirements: 6.1, 6.2_
  - [ ] 10.2 Migrar `mockOcrAdapter.js` → `MockOcrAdapter.ts` y `ocrAdapter.js` → `BaseOcrAdapter.ts`
    - `MockOcrAdapter` simula extracción de factura argentina típica con datos realistas
    - _Requirements: 6.5_
  - [ ] 10.3 Crear `src/features/ocr/adapters/GoogleDocumentAiAdapter.ts`
    - Implementar `extractText(file: File): Promise<OcrRawResult>` llamando a la Edge Function de Supabase
    - Manejar errores de red y respuestas vacías
    - _Requirements: 6.1, 6.8, 15.2_
  - [ ] 10.4 Crear Edge Function `supabase/functions/ocr-google/index.ts`
    - Recibir archivo, llamar a Google Document AI API, retornar texto crudo y respuesta raw
    - Leer credenciales desde variables de entorno de Supabase (nunca hardcodeadas)
    - _Requirements: 6.8, 13.1_
  - [ ] 10.5 Migrar `invoiceParser.js` → `invoiceParser.ts`
    - Parsear campos: `invoice_number`, `invoice_type`, `issue_date`, `due_date`, `seller_name`, `seller_cuit`, `buyer_name`, `buyer_cuit`, `subtotal`, `total_iva`, `total_amount`, `items[]`
    - Convertir fechas `DD/MM/YYYY` → `YYYY-MM-DD`
    - Nunca lanzar excepciones: retornar campos `null` con confidence `0.1` si no parseable
    - _Requirements: 6.3, 6.10_
  - [ ]* 10.6 Escribir property test — Property 2: Conversión de fechas argentinas (round-trip)
    - **Property 2: Para cualquier fecha válida en formato `DD/MM/YYYY`, `parseDate` produce `YYYY-MM-DD` que al reformatear produce la fecha original**
    - **Validates: Requirements 6.10**
  - [ ]* 10.7 Escribir property test — Property 3: Round-trip del parser OCR
    - **Property 3: Para cualquier texto de factura argentina válido, parsear → formatear → parsear produce resultado estructuralmente equivalente (mismos campos no-nulos, mismos valores numéricos)**
    - **Validates: Requirements 6.11**
  - [ ] 10.8 Implementar `clampConfidenceScores` en `ocrService.ts` y migrar `ocrService.js` → `ocrService.ts`
    - Registrar adaptadores: `mock`, `google`, `gpt4v`, `gemini`
    - Clampear todos los scores al rango `[0.0, 1.0]` antes de retornar
    - _Requirements: 6.2, 6.4, 6.7, 6.8_
  - [ ] 10.9 Migrar `OcrPage.jsx` → `OcrPage.tsx` e implementar flujo OCR → revisión → guardado
    - Validar tipo de archivo (PDF, JPEG, PNG, WEBP) antes de iniciar pipeline
    - Pre-poblar `InvoiceForm` con datos extraídos; mostrar scores de confianza por campo
    - Al guardar: persistir `ocr_provider`, `ocr_confidence`, `ocr_raw_text` en la factura
    - _Requirements: 6.6, 6.7, 6.9_


- [ ] 11. Implementar CRUD de clientes y proveedores
  - [ ] 11.1 Crear `src/features/clients/types/client.types.ts` y migrar `clientSchemas.js` → `clientSchemas.ts`
    - Incluir validación de CUIT con `cuitSchema` (`XX-XXXXXXXX-X`)
    - _Requirements: 8.4, 8.6_
  - [ ] 11.2 Migrar `clientService.js` → `clientService.ts`
    - Implementar `getAll(companyId, search?)`, `getById`, `create`, `update`, `delete`
    - Filtrar siempre por `company_id`; búsqueda por nombre con `ilike`
    - _Requirements: 8.1, 8.2, 8.3_
  - [ ]* 11.3 Escribir property test — Property 9: Búsqueda de clientes por nombre
    - **Property 9: Para cualquier lista de clientes y término de búsqueda no vacío, todos los clientes retornados contienen el término en `name` (case-insensitive)**
    - **Validates: Requirements 8.3**
  - [ ] 11.4 Migrar `useClients.js` → `useClients.ts` y `ClientsPage.jsx` → `ClientsPage.tsx`
    - Implementar UI con tabla, formulario de creación/edición en modal, confirmación de eliminación
    - _Requirements: 8.1, 14.1, 14.5_
  - [ ] 11.5 Crear `src/features/providers/` con la misma estructura que `clients/`
    - `providerService.ts` implementa el mismo contrato de interfaz que `clientService.ts`
    - Crear `ProvidersPage.tsx` con UI equivalente a `ClientsPage.tsx`
    - _Requirements: 8.7, 2.3_

- [ ] 12. Checkpoint Fase 2 — Verificar core features
  - Ejecutar `tsc --noEmit` sin errores
  - Ejecutar `vitest --run` y verificar que todos los property tests pasan
  - Verificar flujo completo: subir factura → OCR → revisar → guardar → registrar pago → estado actualizado
  - Preguntar al usuario si hay dudas antes de continuar con Fase 3

---

### Fase 3 — Analítica y Reportes

- [ ] 13. Implementar dashboard financiero completo
  - [ ] 13.1 Crear `src/features/dashboard/hooks/useDashboard.ts`
    - Calcular KPIs del mes actual usando `invoice_financial_summary`: total facturado, dinero ingresado, gastos del mes, resultado neto
    - Calcular contadores por estado: pagadas, pendientes, vencidas, total del mes
    - Filtrar por `company_id` de `CompanyContext`
    - _Requirements: 7.1, 7.2, 7.5, 7.7_
  - [ ] 13.2 Migrar `KpiCard.jsx` → `KpiCard.tsx`, `RevenueChart.jsx` → `RevenueChart.tsx`, `InvoiceStatusChart.jsx` → `InvoiceStatusChart.tsx`, `RecentInvoices.jsx` → `RecentInvoices.tsx`
    - `RevenueChart`: gráfico de evolución mensual ingresos vs gastos, últimos N meses (default 6, configurable)
    - `KpiCard`: mostrar resultado neto con fondo rojo cuando ≤ 0
    - Mostrar skeletons durante carga
    - _Requirements: 7.3, 7.4, 7.6, 7.8_
  - [ ] 13.3 Migrar `DashboardPage.jsx` → `DashboardPage.tsx` y conectar con `useDashboard`
    - Integrar todos los componentes del dashboard
    - _Requirements: 7.1, 7.2, 7.3, 7.4_


- [ ] 14. Implementar módulo de reportes con exportación CSV
  - [ ] 14.1 Crear `src/features/reports/services/reportService.ts`
    - Consultar vista `company_cash_flow` filtrada por `company_id`, rango de fechas y tipo de flujo
    - Calcular totales usando pagos reales de `invoice_payments`, no el campo `status`
    - _Requirements: 11.1, 11.4_
  - [ ]* 14.2 Escribir property test — Property 10: Flujo de caja basado en pagos reales
    - **Property 10: Para cualquier conjunto de facturas con `status = 'paid'` pero sin registros en `invoice_payments`, `company_cash_flow` muestra `total_collected = 0`**
    - **Validates: Requirements 11.4**
  - [ ] 14.3 Crear `src/features/reports/pages/ReportsPage.tsx`
    - Filtros: rango de fechas y tipo de flujo (receivable/payable)
    - Tabla de resultados con totales: `invoice_count`, `total_invoiced`, `total_collected`, `total_pending`, `total_overdue`
    - Botón de exportación CSV que genera y descarga el archivo en el cliente
    - _Requirements: 11.2, 11.3_

- [ ] 15. Implementar sistema de alertas automáticas
  - [ ] 15.1 Crear `src/features/alerts/services/alertService.ts`
    - Implementar `getAll(companyId)`: retornar alertas no leídas y leídas
    - Implementar `markAsRead(alertId)`: actualizar `is_read = true`
    - Filtrar siempre por `company_id`
    - _Requirements: 10.2, 10.3, 10.5_
  - [ ] 15.2 Crear `src/features/alerts/hooks/useAlerts.ts`
    - Exponer conteo de alertas no leídas para el badge del sidebar
    - _Requirements: 10.4_
  - [ ] 15.3 Migrar `AlertsPage.jsx` → `AlertsPage.tsx`
    - Mostrar lista de alertas con tipo, mensaje, factura asociada y estado de lectura
    - Acción de marcar como leída individual y masiva
    - _Requirements: 10.1, 10.3_
  - [ ] 15.4 Actualizar `AppLayout.tsx` para mostrar badge con contador de alertas no leídas en el sidebar
    - _Requirements: 10.4_
  - [ ] 15.5 Crear Edge Function `supabase/functions/check-alerts/index.ts`
    - Detectar facturas vencidas (`overdue`) y próximas a vencer (`upcoming`) en los próximos 7 días
    - Insertar alertas en tabla `alerts` para la empresa correspondiente
    - Diseñada para ejecutarse como cron job (Supabase pg_cron o invocación manual)
    - _Requirements: 10.1, 10.2_

- [ ] 16. Checkpoint Fase 3 — Verificar analítica y reportes
  - Ejecutar `tsc --noEmit` sin errores
  - Ejecutar `vitest --run` y verificar que todos los tests pasan
  - Verificar que el dashboard muestra KPIs correctos y el CSV se exporta correctamente
  - Preguntar al usuario si hay dudas antes de continuar con Fase 4


---

### Fase 4 — Integraciones

- [ ] 17. Integración AFIP para validación de CAE
  - [ ] 17.1 Crear `src/features/invoices/services/afipService.ts`
    - Implementar `validateCae(cae: string, caeVencimiento: string, cuit: string): Promise<AfipValidationResult>`
    - Definir tipo `AfipValidationResult` con campos: `isValid`, `status`, `message`
    - _Requirements: 15.4_
  - [ ] 17.2 Crear Edge Function `supabase/functions/afip-validate/index.ts`
    - Llamar a la API de AFIP para verificar CAE
    - Actualizar campo `afip_status` en la factura correspondiente
    - Leer credenciales AFIP desde variables de entorno de Supabase
    - _Requirements: 15.4, 13.1_
  - [ ] 17.3 Integrar validación AFIP en `InvoiceDetailPage.tsx`
    - Mostrar estado AFIP (`afip_status`) con indicador visual
    - Botón "Validar CAE" que invoca `afipService.validateCae()`
    - _Requirements: 15.4_

- [ ] 18. Notificaciones por email con Supabase Edge Functions + Resend
  - [ ] 18.1 Crear Edge Function `supabase/functions/send-notification/index.ts`
    - Integrar con Resend API para envío de emails
    - Soportar plantillas: factura vencida, próxima a vencer, resumen semanal
    - Leer `RESEND_API_KEY` desde variables de entorno de Supabase
    - _Requirements: 15.4, 13.1_
  - [ ] 18.2 Crear `src/features/settings/services/notificationService.ts`
    - Implementar `sendTestEmail(email: string)` para verificar configuración
    - _Requirements: 15.4_
  - [ ] 18.3 Actualizar `check-alerts` Edge Function para disparar emails al crear alertas
    - Llamar a `send-notification` cuando se detectan facturas vencidas o próximas a vencer
    - _Requirements: 15.4_

- [ ] 19. Soporte multi-moneda
  - [ ] 19.1 Actualizar `src/lib/constants.ts` con lista de monedas soportadas: `ARS`, `USD`, `EUR`
    - Definir tipo `Currency = 'ARS' | 'USD' | 'EUR'`
    - _Requirements: 15.4_
  - [ ] 19.2 Actualizar `invoiceSchemas.ts` para validar `moneda` contra la lista de monedas soportadas
    - Validar que `tipo_cambio` sea positivo y `NUMERIC(10,4)`
    - _Requirements: 15.4, 5.10_
  - [ ] 19.3 Actualizar `InvoiceForm.tsx` para mostrar selector de moneda y campo de tipo de cambio
    - Mostrar tipo de cambio solo cuando `moneda !== 'ARS'`
    - _Requirements: 15.4_
  - [ ] 19.4 Actualizar `ReportsPage.tsx` y `DashboardPage.tsx` para agrupar y mostrar totales por moneda
    - _Requirements: 15.4_

- [ ] 20. Checkpoint final — Verificar integraciones y proyecto completo
  - Ejecutar `tsc --noEmit` sin errores en todo el proyecto
  - Ejecutar `vitest --run` y verificar que todos los tests (unitarios y property-based) pasan
  - Verificar que no hay llamadas directas a Supabase desde componentes React
  - Verificar que no hay uso de `any` sin comentario de justificación
  - Preguntar al usuario si hay dudas o ajustes finales


---

## Notes

- Las tareas marcadas con `*` son opcionales (property tests y unit tests) y pueden omitirse para un MVP más rápido, pero se recomienda ejecutarlas para garantizar correctness.
- Cada tarea referencia los requirements específicos que valida para trazabilidad completa.
- Los checkpoints al final de cada fase aseguran validación incremental antes de avanzar.
- Los property tests usan **fast-check** con mínimo 100 iteraciones (`numRuns: 100`).
- Las Edge Functions de Supabase deben leer todas las credenciales externas (Google Document AI, AFIP, Resend) desde variables de entorno — nunca hardcodeadas.
- El orden de migración TypeScript sigue el diseño: `lib/` → `auth/` → `companies/` → `layouts/` → `router` → `App` → `invoices/` → `ocr/` → `clients/` → `providers/` → `dashboard/` → `reports/` → `alerts/` → `settings/`.
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
