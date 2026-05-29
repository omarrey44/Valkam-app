export type Rol = 'vendedor' | 'administrador' | 'aprobador';

export type Moneda = 'MXN' | 'USD' | 'EUR';

export type EstadoCotizacion =
  | 'pendiente'
  | 'borrador'
  | 'enviada'
  | 'aprobada'
  | 'rechazada'
  | 'modificada';

export interface Profile {
  id: string;
  nombre: string | null;
  email: string | null;
  rol: Rol;
  avatar_url: string | null;
  creado_en: string;
}

export type EstadoCliente = 'prospecto' | 'activo' | 'inactivo';

export interface Cliente {
  id: string;
  empresa: string;
  ingeniero: string | null;
  solicitante: string | null;
  nombre_proyecto: string | null;
  descripcion_proyecto: string | null;
  correo_principal: string;
  correos_adicionales: string | null;
  telefono: string | null;
  direccion: string | null;
  estado: EstadoCliente;
  logo_url: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface Cotizacion {
  id: string;
  cliente_id: string;
  titulo: string;
  descripcion: string;
  monto: number;
  moneda: Moneda;
  terminos_pago: string | null;
  tiempo_entrega: string | null;
  detalles_tecnicos: string | null;
  precio_unitario: number | null;
  cantidad: number | null;
  estado: EstadoCotizacion;
  revision_current: string;
  autorizacion: boolean;
  cotizado_por: string;
  revisado_por: string | null;
  aprobado_por: string | null;
  fecha_cotizacion: string;
  fecha_envio: string | null;
  fecha_aprobacion: string | null;
  creado_en: string;
  actualizado_en: string;
  // join opcional
  clientes?: Pick<Cliente, 'empresa' | 'correo_principal'> | null;
}

export interface CotizacionItem {
  id: string;
  cotizacion_id: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  orden: number;
  creado_en: string;
}

export interface CotizacionRevision {
  id: string;
  cotizacion_id: string;
  revision: string;
  cambio_descrito: string | null;
  creado_por: string | null;
  creado_en: string;
  snapshot_data: Record<string, unknown> | null;
}

// ----- Fase 2: PO / Proyectos / Tareas -----

export type EstadoPO = 'recibida' | 'en_proceso' | 'completada' | 'cancelada';

export type EstadoProyecto =
  | 'programado'
  | 'en_proceso'
  | 'validacion'
  | 'completado'
  | 'cancelado';

export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

export type Prioridad = 'baja' | 'media' | 'alta' | 'urgente';

export interface OrdenCompra {
  id: string;
  cotizacion_id: string;
  numero_po: string | null;
  cliente_id: string | null;
  monto_po: number;
  moneda: Moneda;
  fecha_recepcion: string;
  terminos_pago: string | null;
  fecha_entrega_esperada: string | null;
  estado: EstadoPO;
  generada_por: string | null;
  archivo_adjunto: string | null;
  creado_en: string;
  actualizado_en: string;
  // joins opcionales
  clientes?: Pick<Cliente, 'empresa'> | null;
  cotizaciones?: Pick<Cotizacion, 'titulo'> | null;
}

export interface Proyecto {
  id: string;
  po_id: string;
  cotizacion_id: string | null;
  cliente_id: string | null;
  nombre_proyecto: string | null;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin_estimada: string | null;
  fecha_fin_real: string | null;
  estado: EstadoProyecto;
  responsable: string | null;
  creado_en: string;
  actualizado_en: string;
  // joins opcionales
  clientes?: Pick<Cliente, 'empresa'> | null;
  ordenes_compra?: Pick<OrdenCompra, 'numero_po'> | null;
}

export interface Tarea {
  id: string;
  proyecto_id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  prioridad: Prioridad;
  asignado_a: string | null;
  fecha_vencimiento: string | null;
  fecha_completada: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
}

// ----- Fase 3: Facturación + Dashboard -----

export type EstadoFactura = 'pendiente' | 'pagada' | 'vencida' | 'cancelada';

export interface Factura {
  id: string;
  proyecto_id: string;
  po_id: string | null;
  cotizacion_id: string | null;
  numero_factura: string | null;
  monto: number;
  moneda: Moneda;
  terminos_pago: string | null;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  fecha_pago: string | null;
  estado: EstadoFactura;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
  // joins opcionales
  proyectos?: { nombre_proyecto: string | null; clientes?: Pick<Cliente, 'empresa'> | null } | null;
}

export interface ValidacionItem {
  id: string;
  proyecto_id: string;
  item: string;
  completado: boolean;
  orden: number;
  creado_en: string;
}

export interface Entrega {
  id: string;
  proyecto_id: string;
  fecha_entrega: string;
  recibido_por: string | null;
  notas: string | null;
  firma_url: string | null;
  creado_por: string | null;
  creado_en: string;
}

export interface InventarioItem {
  id: string;
  nombre: string;
  sku: string | null;
  categoria: string | null;
  descripcion: string | null;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  stock_minimo: number;
  ubicacion: string | null;
  creado_por: string | null;
  creado_en: string;
  actualizado_en: string;
}

export interface MetricaVendedor {
  vendedor_id: string;
  nombre: string | null;
  email: string | null;
  cotizaciones_realizadas: number;
  monto_total_cotizado: number;
  cotizaciones_aprobadas: number;
  tasa_aprobacion: number;
  po_generadas: number;
}
