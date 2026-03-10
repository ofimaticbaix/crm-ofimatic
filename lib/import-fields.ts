import type { FieldDefinition, ImportEntityType } from './import-types'

// Campos destino por tipo de entidad con aliases para auto-mapeo

export const contactFields: FieldDefinition[] = [
  {
    key: 'first_name',
    label: 'Nombre',
    required: true,
    type: 'text',
    aliases: ['nombre', 'name', 'first name', 'firstname', 'primer nombre', 'nom']
  },
  {
    key: 'last_name',
    label: 'Apellidos',
    required: false,
    type: 'text',
    aliases: ['apellido', 'apellidos', 'last name', 'lastname', 'surname', 'segundo nombre']
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    type: 'email',
    aliases: ['email', 'e-mail', 'correo', 'correo electronico', 'mail', 'email address', 'direccion email']
  },
  {
    key: 'phone',
    label: 'Teléfono',
    required: false,
    type: 'phone',
    aliases: ['telefono', 'phone', 'tel', 'telephone', 'fono', 'tlf', 'telf', 'telefono fijo', 'fijo']
  },
  {
    key: 'mobile',
    label: 'Móvil',
    required: false,
    type: 'phone',
    aliases: ['movil', 'mobile', 'celular', 'cell', 'telefono movil', 'cel', 'whatsapp']
  },
  {
    key: 'job_title',
    label: 'Cargo',
    required: false,
    type: 'text',
    aliases: ['cargo', 'puesto', 'position', 'job title', 'jobtitle', 'titulo', 'rol', 'role', 'funcion']
  },
  {
    key: 'company_name',
    label: 'Empresa',
    required: false,
    type: 'text',
    aliases: ['empresa', 'company', 'organizacion', 'org', 'nombre empresa', 'compania', 'razon social empresa']
  },
  {
    key: 'linkedin_url',
    label: 'LinkedIn',
    required: false,
    type: 'url',
    aliases: ['linkedin', 'linkedin url', 'perfil linkedin', 'link linkedin']
  },
  {
    key: 'lead_source',
    label: 'Origen',
    required: false,
    type: 'text',
    aliases: ['origen', 'source', 'lead source', 'fuente', 'canal', 'como nos conocio', 'procedencia']
  },
]

export const companyFields: FieldDefinition[] = [
  {
    key: 'name',
    label: 'Razón Social',
    required: true,
    type: 'text',
    aliases: ['razon social', 'razonsocial', 'nombre', 'empresa', 'denominacion', 'nom', 'company name', 'nombre empresa', 'nombre comercial', 'razon_social']
  },
  {
    key: 'vat_number',
    label: 'NIF/CIF',
    required: false,
    type: 'nif',
    aliases: ['nif', 'cif', 'nif/cif', 'cif/nif', 'nif cif', 'numero fiscal', 'tax id', 'vat', 'vat number', 'identificacion fiscal', 'dni empresa']
  },
  {
    key: 'website',
    label: 'Web',
    required: false,
    type: 'url',
    aliases: ['web', 'website', 'pagina web', 'sitio web', 'url', 'direccion web', 'homepage']
  },
  {
    key: 'industry',
    label: 'Sector',
    required: false,
    type: 'text',
    aliases: ['sector', 'industria', 'industry', 'actividad', 'sector actividad', 'ramo', 'giro']
  },
  {
    key: 'company_size',
    label: 'Tamaño',
    required: false,
    type: 'text',
    aliases: ['tamano', 'tamaño', 'size', 'empleados', 'numero empleados', 'num empleados', 'company size', 'plantilla']
  },
  {
    key: 'phone',
    label: 'Teléfono',
    required: false,
    type: 'phone',
    aliases: ['telefono', 'phone', 'tel', 'telephone', 'fono', 'tlf', 'telf']
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    type: 'email',
    aliases: ['email', 'e-mail', 'correo', 'correo electronico', 'mail']
  },
  {
    key: 'address',
    label: 'Dirección',
    required: false,
    type: 'text',
    aliases: ['direccion', 'address', 'domicilio', 'calle', 'via', 'domicilio social', 'direccion fiscal']
  },
  {
    key: 'city',
    label: 'Ciudad',
    required: false,
    type: 'text',
    aliases: ['ciudad', 'city', 'localidad', 'municipio', 'poblacion', 'town']
  },
  {
    key: 'postal_code',
    label: 'Código Postal',
    required: false,
    type: 'text',
    aliases: ['codigo postal', 'cp', 'postal code', 'zip', 'zip code', 'cod postal', 'c.p.', 'c.p']
  },
  {
    key: 'province',
    label: 'Provincia',
    required: false,
    type: 'text',
    aliases: ['provincia', 'province', 'state', 'estado', 'region', 'comunidad']
  },
]

export const invoicePaidFields: FieldDefinition[] = [
  {
    key: 'invoice_number',
    label: 'Nº Factura',
    required: true,
    type: 'text',
    aliases: ['numero factura', 'nº factura', 'n factura', 'no factura', 'factura', 'invoice number', 'num factura', 'fra', 'num fra', 'numero', 'nfactura', 'invoice']
  },
  {
    key: 'company_name',
    label: 'Cliente',
    required: true,
    type: 'text',
    aliases: ['cliente', 'client', 'razon social', 'nombre cliente', 'empresa', 'customer', 'company', 'nombre', 'razonsocial', 'denominacion']
  },
  {
    key: 'company_nif',
    label: 'NIF/CIF',
    required: false,
    type: 'nif',
    aliases: ['nif', 'cif', 'nif/cif', 'cif/nif', 'nif cliente', 'cif cliente', 'identificacion fiscal']
  },
  {
    key: 'concept',
    label: 'Concepto',
    required: false,
    type: 'text',
    aliases: ['concepto', 'concept', 'descripcion', 'detalle', 'description', 'motivo', 'servicio', 'producto']
  },
  {
    key: 'issue_date',
    label: 'Fecha Emisión',
    required: true,
    type: 'date',
    aliases: ['fecha emision', 'fecha', 'date', 'issue date', 'fecha factura', 'f emision', 'fecha fra', 'emision']
  },
  {
    key: 'payment_date',
    label: 'Fecha Cobro',
    required: false,
    type: 'date',
    aliases: ['fecha cobro', 'fecha pago', 'payment date', 'cobro', 'pago', 'f cobro', 'f pago', 'cobrado']
  },
  {
    key: 'subtotal',
    label: 'Base Imponible',
    required: false,
    type: 'number',
    aliases: ['base', 'base imponible', 'subtotal', 'importe neto', 'neto', 'importe base', 'base imp']
  },
  {
    key: 'tax_rate',
    label: '% IVA',
    required: false,
    type: 'number',
    aliases: ['% iva', 'iva %', 'tipo iva', 'porcentaje iva', 'tax rate', 'iva porcentaje']
  },
  {
    key: 'tax_amount',
    label: 'IVA',
    required: false,
    type: 'number',
    aliases: ['iva', 'importe iva', 'cuota iva', 'tax', 'tax amount', 'impuesto']
  },
  {
    key: 'total',
    label: 'Total',
    required: true,
    type: 'number',
    aliases: ['total', 'importe total', 'total factura', 'importe', 'amount', 'total amount', 'total fra']
  },
  {
    key: 'payment_method',
    label: 'Forma de Pago',
    required: false,
    type: 'text',
    aliases: ['forma pago', 'forma de pago', 'metodo pago', 'payment method', 'medio pago', 'tipo pago', 'modo pago']
  },
]

export const invoicePendingFields: FieldDefinition[] = [
  {
    key: 'invoice_number',
    label: 'Nº Factura',
    required: true,
    type: 'text',
    aliases: ['numero factura', 'nº factura', 'n factura', 'no factura', 'factura', 'invoice number', 'num factura', 'fra', 'num fra', 'numero', 'nfactura', 'invoice']
  },
  {
    key: 'company_name',
    label: 'Cliente',
    required: true,
    type: 'text',
    aliases: ['cliente', 'client', 'razon social', 'nombre cliente', 'empresa', 'customer', 'company', 'nombre', 'razonsocial', 'denominacion']
  },
  {
    key: 'company_nif',
    label: 'NIF/CIF',
    required: false,
    type: 'nif',
    aliases: ['nif', 'cif', 'nif/cif', 'cif/nif', 'nif cliente', 'cif cliente', 'identificacion fiscal']
  },
  {
    key: 'concept',
    label: 'Concepto',
    required: false,
    type: 'text',
    aliases: ['concepto', 'concept', 'descripcion', 'detalle', 'description', 'motivo', 'servicio', 'producto']
  },
  {
    key: 'issue_date',
    label: 'Fecha Emisión',
    required: true,
    type: 'date',
    aliases: ['fecha emision', 'fecha', 'date', 'issue date', 'fecha factura', 'f emision', 'fecha fra', 'emision']
  },
  {
    key: 'due_date',
    label: 'Vencimiento',
    required: false,
    type: 'date',
    aliases: ['vencimiento', 'fecha vencimiento', 'due date', 'f vencimiento', 'vto', 'vence', 'expiry']
  },
  {
    key: 'subtotal',
    label: 'Base Imponible',
    required: false,
    type: 'number',
    aliases: ['base', 'base imponible', 'subtotal', 'importe neto', 'neto', 'importe base', 'base imp']
  },
  {
    key: 'tax_rate',
    label: '% IVA',
    required: false,
    type: 'number',
    aliases: ['% iva', 'iva %', 'tipo iva', 'porcentaje iva', 'tax rate', 'iva porcentaje']
  },
  {
    key: 'tax_amount',
    label: 'IVA',
    required: false,
    type: 'number',
    aliases: ['iva', 'importe iva', 'cuota iva', 'tax', 'tax amount', 'impuesto']
  },
  {
    key: 'total',
    label: 'Total',
    required: true,
    type: 'number',
    aliases: ['total', 'importe total', 'total factura', 'importe', 'amount', 'total amount', 'total fra']
  },
  {
    key: 'days_overdue',
    label: 'Días Vencidos',
    required: false,
    type: 'number',
    aliases: ['dias vencidos', 'days overdue', 'dias mora', 'retraso', 'dias retraso', 'mora']
  },
]

export function getFieldsForEntityType(entityType: ImportEntityType): FieldDefinition[] {
  switch (entityType) {
    case 'contactos': return contactFields
    case 'empresas': return companyFields
    case 'facturas_pagadas': return invoicePaidFields
    case 'facturas_pendientes': return invoicePendingFields
  }
}

export function getEntityTypeLabel(entityType: ImportEntityType): string {
  switch (entityType) {
    case 'contactos': return 'Contactos'
    case 'empresas': return 'Empresas'
    case 'facturas_pagadas': return 'Facturas Pagadas'
    case 'facturas_pendientes': return 'Facturas Pendientes'
  }
}
