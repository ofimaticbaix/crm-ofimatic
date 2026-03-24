import type { FieldDefinition, ImportEntityType } from './import-types'

// Campos destino por tipo de entidad con aliases para auto-mapeo
// Aliases deben cubrir: Access, Sage, A3, Excel casero, ContaPlus, FacturaPlus, etc.

export const contactFields: FieldDefinition[] = [
  {
    key: 'first_name',
    label: 'Nombre',
    required: true,
    type: 'text',
    aliases: [
      'nombre', 'name', 'first name', 'firstname', 'primer nombre', 'nom',
      'contacto', 'persona contacto', 'persona de contacto', 'contact',
      'nombre contacto', 'nombre y apellidos', 'nombre completo'
    ]
  },
  {
    key: 'last_name',
    label: 'Apellidos',
    required: false,
    type: 'text',
    aliases: ['apellido', 'apellidos', 'last name', 'lastname', 'surname', 'segundo nombre', 'cognoms']
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    type: 'email',
    aliases: [
      'email', 'e-mail', 'correo', 'correo electronico', 'mail', 'email address',
      'direccion email', 'email 1', 'mail 1', 'correo 1', 'email principal'
    ]
  },
  {
    key: 'phone',
    label: 'Teléfono',
    required: false,
    type: 'phone',
    aliases: [
      'telefono', 'phone', 'tel', 'telephone', 'fono', 'tlf', 'telf',
      'telefono fijo', 'fijo', 'telefono 1', 'tel 1', 'tlf 1', 'phone 1'
    ]
  },
  {
    key: 'mobile',
    label: 'Móvil',
    required: false,
    type: 'phone',
    aliases: [
      'movil', 'mobile', 'celular', 'cell', 'telefono movil', 'cel', 'whatsapp',
      'telefono 2', 'tel 2', 'tlf 2', 'phone 2', 'otro telefono'
    ]
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
    aliases: [
      'empresa', 'company', 'organizacion', 'org', 'nombre empresa', 'compania',
      'razon social empresa', 'razon social', 'razonsocial', 'entidad'
    ]
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
  {
    key: 'department',
    label: 'Departamento',
    required: false,
    type: 'text',
    aliases: ['departamento', 'department', 'dept', 'area', 'seccion', 'division']
  },
  {
    key: 'notes',
    label: 'Notas',
    required: false,
    type: 'text',
    aliases: ['notas', 'notes', 'observaciones', 'comentarios', 'obs', 'descripcion', 'nota']
  },
]

export const companyFields: FieldDefinition[] = [
  {
    key: 'name',
    label: 'Razón Social',
    required: true,
    type: 'text',
    aliases: [
      'razon social', 'razonsocial', 'nombre', 'empresa', 'denominacion', 'nom',
      'company name', 'nombre empresa', 'nombre comercial', 'razon_social',
      'denominacion social', 'cliente', 'nombre cliente', 'raz social',
      'entidad', 'titular', 'razon social nombre'
    ]
  },
  {
    key: 'vat_number',
    label: 'NIF/CIF',
    required: false,
    type: 'nif',
    aliases: [
      'nif', 'cif', 'nif/cif', 'cif/nif', 'nif cif', 'numero fiscal', 'tax id',
      'vat', 'vat number', 'identificacion fiscal', 'dni empresa',
      'nif cif', 'cif nif', 'dni', 'nie', 'documento', 'id fiscal',
      'numero identificacion fiscal', 'cod fiscal'
    ]
  },
  {
    key: 'contact_name',
    label: 'Persona de Contacto',
    required: false,
    type: 'text',
    aliases: [
      'contacto', 'persona contacto', 'persona de contacto', 'contact',
      'nombre contacto', 'responsable', 'interlocutor', 'atencion',
      'a la atencion', 'att', 'contact name', 'contact person'
    ]
  },
  {
    key: 'phone',
    label: 'Teléfono',
    required: false,
    type: 'phone',
    aliases: [
      'telefono', 'phone', 'tel', 'telephone', 'fono', 'tlf', 'telf',
      'telefono 1', 'tel 1', 'tlf 1', 'telefono fijo', 'fijo', 'phone 1',
      'telefono principal', 'tel principal'
    ]
  },
  {
    key: 'phone_2',
    label: 'Teléfono 2',
    required: false,
    type: 'phone',
    aliases: [
      'telefono 2', 'tel 2', 'tlf 2', 'phone 2', 'movil', 'mobile',
      'otro telefono', 'telefono secundario', 'fax', 'celular',
      'telefono alternativo', 'tel alternativo'
    ]
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    type: 'email',
    aliases: [
      'email', 'e-mail', 'correo', 'correo electronico', 'mail',
      'email 1', 'mail 1', 'correo 1', 'email principal', 'email empresa'
    ]
  },
  {
    key: 'email_2',
    label: 'Email 2',
    required: false,
    type: 'email',
    aliases: [
      'email 2', 'mail 2', 'correo 2', 'otro email', 'email secundario',
      'email alternativo', 'segundo email', 'email contacto'
    ]
  },
  {
    key: 'email_3',
    label: 'Email 3',
    required: false,
    type: 'email',
    aliases: [
      'email 3', 'mail 3', 'correo 3', 'tercer email', 'email 3'
    ]
  },
  {
    key: 'email_4',
    label: 'Email 4',
    required: false,
    type: 'email',
    aliases: [
      'email 4', 'mail 4', 'correo 4', 'cuarto email'
    ]
  },
  {
    key: 'email_5',
    label: 'Email 5',
    required: false,
    type: 'email',
    aliases: [
      'email 5', 'mail 5', 'correo 5', 'quinto email'
    ]
  },
  {
    key: 'website',
    label: 'Web',
    required: false,
    type: 'url',
    aliases: [
      'web', 'website', 'pagina web', 'sitio web', 'url', 'direccion web',
      'homepage', 'www', 'pagina', 'sitio', 'portal'
    ]
  },
  {
    key: 'address',
    label: 'Dirección',
    required: false,
    type: 'text',
    aliases: [
      'direccion', 'address', 'domicilio', 'calle', 'via', 'domicilio social',
      'direccion fiscal', 'dir', 'domicilio fiscal', 'direccion postal',
      'direccion completa', 'calle y numero', 'domicilio completo',
      'direccion envio', 'direccion facturacion', 'street'
    ]
  },
  {
    key: 'postal_code',
    label: 'Código Postal',
    required: false,
    type: 'text',
    aliases: [
      'codigo postal', 'cp', 'postal code', 'zip', 'zip code', 'cod postal',
      'c.p.', 'c.p', 'c p', 'cod post', 'postal', 'codpostal', 'cod_postal',
      'codigopostal', 'codigo_postal', 'zipcode'
    ]
  },
  {
    key: 'city',
    label: 'Ciudad / Población',
    required: false,
    type: 'text',
    aliases: [
      'ciudad', 'city', 'localidad', 'municipio', 'poblacion', 'town',
      'poblacio', 'poble', 'plaza', 'loc', 'locality', 'lugar',
      'poblacion localidad', 'ciudad localidad', 'municipality'
    ]
  },
  {
    key: 'province',
    label: 'Provincia',
    required: false,
    type: 'text',
    aliases: [
      'provincia', 'province', 'state', 'estado', 'region', 'comunidad',
      'ccaa', 'comunidad autonoma', 'com autonoma', 'prov'
    ]
  },
  {
    key: 'industry',
    label: 'Sector',
    required: false,
    type: 'text',
    aliases: [
      'sector', 'industria', 'industry', 'actividad', 'sector actividad',
      'ramo', 'giro', 'cnae', 'actividad economica', 'sector economico'
    ]
  },
  {
    key: 'company_size',
    label: 'Tamaño',
    required: false,
    type: 'text',
    aliases: ['tamano', 'tamaño', 'size', 'empleados', 'numero empleados', 'num empleados', 'company size', 'plantilla']
  },
  {
    key: 'account_type',
    label: 'Tipo',
    required: false,
    type: 'text',
    aliases: [
      'tipo', 'type', 'account type', 'tipo cliente', 'tipo cuenta',
      'categoria', 'clasificacion', 'clase', 'grupo', 'segmento',
      'tipo empresa', 'tipo de cliente', 'class'
    ]
  },
  {
    key: 'payment_method',
    label: 'Forma de Pago',
    required: false,
    type: 'text',
    aliases: [
      'forma pago', 'forma de pago', 'metodo pago', 'payment method',
      'medio pago', 'tipo pago', 'modo pago', 'condiciones pago',
      'condiciones de pago', 'forma cobro', 'modo cobro', 'forma_pago',
      'payment', 'payment terms', 'f pago'
    ]
  },
  {
    key: 'code',
    label: 'Código Cliente',
    required: false,
    type: 'text',
    aliases: [
      'codigo', 'code', 'cod', 'ref', 'referencia', 'id cliente',
      'codigo cliente', 'cod cliente', 'num cliente', 'numero cliente',
      'customer code', 'account code', 'id', 'clave', 'cod_cliente',
      'codigo_cliente', 'reference'
    ]
  },
  {
    key: 'last_purchase_date',
    label: 'Última Compra',
    required: false,
    type: 'date',
    aliases: [
      'ultima compra', 'ult compra', 'last purchase', 'fecha ultima compra',
      'f ultima compra', 'last order', 'ultimo pedido', 'ult pedido',
      'fecha ult compra', 'fecha ultima operacion', 'ult operacion'
    ]
  },
  {
    key: 'description',
    label: 'Notas / Observaciones',
    required: false,
    type: 'text',
    aliases: [
      'descripcion', 'description', 'notas', 'notes', 'observaciones',
      'comentarios', 'obs', 'nota', 'comentario', 'remarks', 'info',
      'informacion', 'detalles', 'info adicional'
    ]
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
