/**
 * Configuración central de tipos de comprobante para InvoTrack.
 * Define qué campos son obligatorios, visibles y permitidos por tipo.
 */

// ── Plantilla base ────────────────────────────────────────────────────────────
const BASE = {
  nombre: '',

  requierePuntoVenta: true,
  requiereNumeroComprobante: true,
  requiereFechaVencimiento: false,

  requiereEmisorCUIT: true,
  requiereEmisorRazonSocial: true,
  requiereEmisorCondicionIVA: true,
  requiereEmisorDomicilio: false,

  requiereReceptorCUIT: false,
  requiereReceptorRazonSocial: false,
  requiereReceptorCondicionIVA: false,
  requiereReceptorDomicilio: false,

  permiteItems: true,
  permiteIVA: true,
  discriminaIVA: false,
  ivaOpcional: false,

  requiereCAE: false,
  requiereVencimientoCAE: false,

  permiteCondicionPago: true,
  permiteConsumidorFinalAnonimo: false,

  muestraSeccionReceptor: true,
  esExportacion: false,

  disponibleParaRI: true,
  disponibleParaMOEX: false,

  esFactura: false,
  esNotaCredito: false,
  esNotaDebito: false,
  esRecibo: false,
  esTicket: false,
  esRemito: false,
  esPresupuesto: false,
}

// ── Plantillas por familia ────────────────────────────────────────────────────
function facturaA(nombre) {
  return {
    ...BASE,
    nombre,
    requiereFechaVencimiento: true,
    requiereReceptorCUIT: true,
    requiereReceptorRazonSocial: true,
    requiereReceptorCondicionIVA: true,
    permiteIVA: true,
    discriminaIVA: true,
    requiereCAE: true,
    requiereVencimientoCAE: true,
    permiteItems: true,
    esFactura: true,
  }
}

function facturaB(nombre) {
  return {
    ...BASE,
    nombre,
    requiereFechaVencimiento: true,
    requiereReceptorRazonSocial: true,
    permiteIVA: true,
    requiereCAE: true,
    requiereVencimientoCAE: true,
    permiteItems: true,
    permiteConsumidorFinalAnonimo: true,
    esFactura: true,
  }
}

function facturaC(nombre) {
  return {
    ...facturaB(nombre),
    disponibleParaRI: false,
    disponibleParaMOEX: true,
  }
}

function facturaE(nombre) {
  return {
    ...facturaA(nombre),
    esExportacion: true,
  }
}

function notaCredito(base) {
  return { ...base, esFactura: false, esNotaCredito: true }
}

function notaDebito(base) {
  return { ...base, esFactura: false, esNotaDebito: true }
}

function recibo(letra) {
  const nombre = letra ? `Recibo ${letra}` : 'Recibo'
  return {
    ...BASE,
    nombre,
    requiereReceptorCUIT: true,
    requiereReceptorRazonSocial: true,
    requiereReceptorCondicionIVA: true,
    permiteItems: false,
    permiteIVA: false,
    discriminaIVA: false,
    requiereFechaVencimiento: false,
    esRecibo: true,
    ...(letra === 'C' ? { disponibleParaRI: false, disponibleParaMOEX: true } : {}),
  }
}

function ticket() {
  return {
    ...BASE,
    nombre: 'Ticket',
    requiereReceptorCUIT: false,
    requiereReceptorRazonSocial: false,
    requiereReceptorCondicionIVA: false,
    requiereReceptorDomicilio: false,
    permiteItems: true,
    permiteIVA: true,
    ivaOpcional: true,
    esTicket: true,
    disponibleParaRI: true,
    disponibleParaMOEX: true,
  }
}

function ticketFactura(base, letra) {
  return {
    ...base,
    nombre: `Ticket Factura ${letra}`,
    esFactura: false,
    esTicket: true,
  }
}

function remito() {
  return {
    ...BASE,
    nombre: 'Remito',
    requiereReceptorCUIT: true,
    requiereReceptorRazonSocial: true,
    permiteItems: true,
    permiteIVA: false,
    discriminaIVA: false,
    esRemito: true,
  }
}

function presupuesto() {
  return {
    ...BASE,
    nombre: 'Presupuesto',
    requiereReceptorRazonSocial: true,
    permiteItems: true,
    permiteIVA: true,
    esPresupuesto: true,
  }
}

// ── Configuración por tipo ──────────────────────────────────────────────────
export const COMPROBANTE_CONFIG = {
  'Factura A': facturaA('Factura A'),
  'Factura B': facturaB('Factura B'),
  'Factura C': facturaC('Factura C'),
  'Factura M': facturaA('Factura M'),
  'Factura E': { ...facturaE('Factura E'), disponibleParaMOEX: true },

  'Nota de Crédito A': notaCredito(facturaA('Nota de Crédito A')),
  'Nota de Crédito B': notaCredito({ ...facturaB('Nota de Crédito B'), requiereFechaVencimiento: false }),
  'Nota de Crédito C': notaCredito({ ...facturaC('Nota de Crédito C'), requiereFechaVencimiento: false }),
  'Nota de Crédito M': notaCredito(facturaA('Nota de Crédito M')),
  'Nota de Crédito E': notaCredito({ ...facturaE('Nota de Crédito E'), disponibleParaMOEX: true, requiereFechaVencimiento: false }),

  'Nota de Débito A': notaDebito({ ...facturaA('Nota de Débito A'), requiereFechaVencimiento: false }),
  'Nota de Débito B': notaDebito({ ...facturaB('Nota de Débito B'), requiereFechaVencimiento: false }),
  'Nota de Débito C': notaDebito({ ...facturaC('Nota de Débito C'), requiereFechaVencimiento: false }),
  'Nota de Débito M': notaDebito({ ...facturaA('Nota de Débito M'), requiereFechaVencimiento: false }),
  'Nota de Débito E': notaDebito({ ...facturaE('Nota de Débito E'), disponibleParaMOEX: true, requiereFechaVencimiento: false }),

  'Recibo A': recibo('A'),
  'Recibo B': recibo('B'),
  'Recibo C': recibo('C'),
  // Compatibilidad con facturas existentes que usan el valor genérico "Recibo"
  'Recibo': recibo(null),

  'Ticket': ticket(),
  'Ticket Factura A': ticketFactura(facturaA('Ticket Factura A'), 'A'),
  'Ticket Factura B': ticketFactura(facturaB('Ticket Factura B'), 'B'),
  'Ticket Factura C': ticketFactura({ ...facturaC('Ticket Factura C'), disponibleParaRI: false, disponibleParaMOEX: true }, 'C'),

  'Remito': remito(),
  'Presupuesto': presupuesto(),
}

/** Lista ordenada de todos los tipos de comprobante soportados. */
export const TIPOS_COMPROBANTE = Object.keys(COMPROBANTE_CONFIG)

/** Config por defecto para tipos desconocidos (compatibilidad con datos legacy). */
export const COMPROBANTE_CONFIG_DEFAULT = { ...BASE, nombre: 'Desconocido' }

/**
 * Devuelve la configuración de un tipo de comprobante.
 * Si el tipo no existe, retorna la config por defecto para no romper facturas legacy.
 *
 * @param {string | null | undefined} tipo
 * @returns {typeof COMPROBANTE_CONFIG_DEFAULT}
 */
export function getComprobanteConfig(tipo) {
  if (!tipo) return COMPROBANTE_CONFIG_DEFAULT
  return COMPROBANTE_CONFIG[tipo] ?? COMPROBANTE_CONFIG_DEFAULT
}

/** Tipos disponibles según la condición IVA del emisor. */
export function getTiposPermitidosPorEmisor(emisorCondicion) {
  if (emisorCondicion === 'MO' || emisorCondicion === 'EX') {
    return TIPOS_COMPROBANTE.filter((t) => getComprobanteConfig(t).disponibleParaMOEX)
  }
  if (emisorCondicion === 'RI') {
    return TIPOS_COMPROBANTE.filter((t) => getComprobanteConfig(t).disponibleParaRI)
  }
  return TIPOS_COMPROBANTE
}
