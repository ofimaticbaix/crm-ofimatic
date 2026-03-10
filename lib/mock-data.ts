// Mock data para demo

export const mockCompanies = [
  { id: '1', name: 'Acme Corp', industry: 'SaaS', size: '51-200', website: 'acme.com', canal: 'web', email: 'info@acme.com', phone: '+34 911 234 567', address: 'Calle Gran Vía 42, Madrid', status: 'activo' as const },
  { id: '2', name: 'Tech Solutions', industry: 'Consultoría', size: '11-50', website: 'techsol.es', canal: 'referido', email: 'contacto@techsol.es', phone: '+34 912 345 678', address: 'Av. Diagonal 211, Barcelona', status: 'activo' as const },
  { id: '3', name: 'Global Industries', industry: 'Manufacturing', size: '201-500', website: 'globalind.com', canal: 'email', email: 'ventas@globalind.com', phone: '+34 913 456 789', address: 'Polígono Industrial Norte 5, Valencia', status: 'activo' as const },
  { id: '4', name: 'StartupXYZ', industry: 'FinTech', size: '1-10', website: 'startupxyz.io', canal: 'social', email: 'hello@startupxyz.io', phone: '+34 914 567 890', address: 'WeWork Paseo de la Castellana, Madrid', status: 'activo' as const },
  { id: '5', name: 'Marketing Plus', industry: 'Agencia', size: '11-50', website: 'marketingplus.es', canal: 'referido', email: 'info@marketingplus.es', phone: '+34 915 678 901', address: 'Calle Serrano 85, Madrid', status: 'activo' as const },
  { id: '6', name: 'DataFlow', industry: 'Analytics', size: '51-200', website: 'dataflow.com', canal: 'web', email: 'sales@dataflow.com', phone: '+34 916 789 012', address: 'Parque Tecnológico 12, Bilbao', status: 'activo' as const },
  { id: '7', name: 'Cloud Systems', industry: 'Cloud Services', size: '201-500', website: 'cloudsys.io', canal: 'evento', email: 'enterprise@cloudsys.io', phone: '+34 917 890 123', address: 'Torre Mapfre, Barcelona', status: 'cerrado' as const },
  { id: '8', name: 'Retail Madrid', industry: 'Retail', size: '51-200', website: 'retailmadrid.es', canal: 'llamada', email: 'comercial@retailmadrid.es', phone: '+34 918 901 234', address: 'Centro Comercial Xanadú, Madrid', status: 'cerrado' as const },
]

export const mockContacts = [
  { id: '1', firstName: 'Juan', lastName: 'García', email: 'juan.garcia@acme.com', phone: '+34 600 123 456', jobTitle: 'CTO', companyId: '1', lifecycle: 'customer', status: 'activo' as const },
  { id: '2', firstName: 'María', lastName: 'López', email: 'maria.lopez@techsol.es', phone: '+34 610 234 567', jobTitle: 'CEO', companyId: '2', lifecycle: 'prospect', status: 'activo' as const },
  { id: '3', firstName: 'Carlos', lastName: 'Rodríguez', email: 'carlos@globalind.com', phone: '+34 620 345 678', jobTitle: 'VP Sales', companyId: '3', lifecycle: 'lead', status: 'activo' as const },
  { id: '4', firstName: 'Laura', lastName: 'Martínez', email: 'laura@startupxyz.io', phone: '+34 630 456 789', jobTitle: 'Founder', companyId: '4', lifecycle: 'prospect', status: 'activo' as const },
  { id: '5', firstName: 'Pedro', lastName: 'Sánchez', email: 'pedro@marketingplus.es', phone: '+34 640 567 890', jobTitle: 'Director', companyId: '5', lifecycle: 'customer', status: 'activo' as const },
  { id: '6', firstName: 'Ana', lastName: 'Fernández', email: 'ana@dataflow.com', phone: '+34 650 678 901', jobTitle: 'COO', companyId: '6', lifecycle: 'lead', status: 'activo' as const },
  { id: '7', firstName: 'Miguel', lastName: 'Torres', email: 'miguel@cloudsys.io', phone: '+34 660 789 012', jobTitle: 'CTO', companyId: '7', lifecycle: 'prospect', status: 'inactivo' as const },
  { id: '8', firstName: 'Isabel', lastName: 'Ruiz', email: 'isabel@retailmadrid.es', phone: '+34 670 890 123', jobTitle: 'Gerente', companyId: '8', lifecycle: 'customer', status: 'inactivo' as const },
  { id: '9', firstName: 'David', lastName: 'Gómez', email: 'david@acme.com', phone: '+34 680 901 234', jobTitle: 'VP Product', companyId: '1', lifecycle: 'customer', status: 'activo' as const },
  { id: '10', firstName: 'Carmen', lastName: 'Díaz', email: 'carmen@techsol.es', phone: '+34 690 012 345', jobTitle: 'CFO', companyId: '2', lifecycle: 'prospect', status: 'activo' as const },
]

export const mockDeals = [
  {
    id: '1',
    name: 'Enterprise CRM - Acme Corp',
    value: 45000,
    stage: 'negotiation',
    companyId: '1',
    contactIds: ['1', '9'],
    expectedCloseDate: '2026-03-25',
    status: 'open',
    probability: 75,
    lastActivity: '2026-03-08',
  },
  {
    id: '2',
    name: 'Professional Plan - Tech Solutions',
    value: 12000,
    stage: 'proposal',
    companyId: '2',
    contactIds: ['2', '10'],
    expectedCloseDate: '2026-04-05',
    status: 'open',
    probability: 50,
    lastActivity: '2026-03-07',
  },
  {
    id: '3',
    name: 'Starter Package - StartupXYZ',
    value: 3600,
    stage: 'negotiation',
    companyId: '4',
    contactIds: ['4'],
    expectedCloseDate: '2026-03-15',
    status: 'open',
    probability: 75,
    lastActivity: '2026-03-09',
  },
  {
    id: '4',
    name: 'Annual Subscription - Marketing Plus',
    value: 18000,
    stage: 'prospecting',
    companyId: '5',
    contactIds: ['5'],
    expectedCloseDate: '2026-04-20',
    status: 'open',
    probability: 20,
    lastActivity: '2026-03-05',
  },
  {
    id: '5',
    name: 'Enterprise Deal - Global Industries',
    value: 85000,
    stage: 'qualification',
    companyId: '3',
    contactIds: ['3'],
    expectedCloseDate: '2026-05-10',
    status: 'open',
    probability: 30,
    lastActivity: '2026-03-06',
  },
  {
    id: '6',
    name: 'Cloud Integration - DataFlow',
    value: 22000,
    stage: 'proposal',
    companyId: '6',
    contactIds: ['6'],
    expectedCloseDate: '2026-03-30',
    status: 'open',
    probability: 50,
    lastActivity: '2026-03-08',
  },
  {
    id: '7',
    name: 'Professional Services - Cloud Systems',
    value: 35000,
    stage: 'qualification',
    companyId: '7',
    contactIds: ['7'],
    expectedCloseDate: '2026-04-15',
    status: 'open',
    probability: 30,
    lastActivity: '2026-03-09',
  },
  {
    id: '8',
    name: 'Retail Solution - Retail Madrid',
    value: 15000,
    stage: 'prospecting',
    companyId: '8',
    contactIds: ['8'],
    expectedCloseDate: '2026-05-01',
    status: 'open',
    probability: 20,
    lastActivity: '2026-02-28',
  },
]

export const mockTasks = [
  { id: '1', title: 'Llamar a Juan García de Acme Corp', dealId: '1', dueDate: '2026-03-09', dueTime: '10:00', isCompleted: false, priority: 'high', companyId: '1', contactId: '1', type: 'llamada' as const },
  { id: '2', title: 'Enviar propuesta a Tech Solutions', dealId: '2', dueDate: '2026-03-10', dueTime: '14:00', isCompleted: false, priority: 'high', companyId: '2', contactId: '2', type: 'tarea' as const },
  { id: '3', title: 'Follow-up con StartupXYZ', dealId: '3', dueDate: '2026-03-09', dueTime: '11:30', isCompleted: false, priority: 'medium', companyId: '4', contactId: '4', type: 'llamada' as const },
  { id: '4', title: 'Demo programada con Global Industries', dealId: '5', dueDate: '2026-03-12', dueTime: '16:00', isCompleted: false, priority: 'medium', companyId: '3', contactId: '3', type: 'reunion' as const },
  { id: '5', title: 'Revisar contrato Cloud Systems', dealId: '7', dueDate: '2026-03-11', dueTime: '09:00', isCompleted: false, priority: 'low', companyId: '7', contactId: '7', type: 'tarea' as const },
  { id: '6', title: 'Reunión de cierre Acme Corp', dealId: '1', dueDate: '2026-03-07', dueTime: '15:00', isCompleted: false, priority: 'high', companyId: '1', contactId: '9', type: 'reunion' as const },
  { id: '7', title: 'Visitar oficinas DataFlow', dealId: '6', dueDate: '2026-03-13', dueTime: '10:00', isCompleted: false, priority: 'medium', companyId: '6', contactId: '6', type: 'visita' as const },
  { id: '8', title: 'Llamar a Pedro de Marketing Plus', dealId: '4', dueDate: '2026-03-10', dueTime: '12:00', isCompleted: false, priority: 'low', companyId: '5', contactId: '5', type: 'llamada' as const },
  { id: '9', title: 'Preparar presentación Retail Madrid', dealId: '8', dueDate: '2026-03-14', dueTime: '09:30', isCompleted: false, priority: 'medium', companyId: '8', contactId: '8', type: 'tarea' as const },
  { id: '10', title: 'Reunión equipo ventas semanal', dealId: '', dueDate: '2026-03-10', dueTime: '09:00', isCompleted: false, priority: 'medium', companyId: '', contactId: '', type: 'reunion' as const },
]

export const mockActivities = [
  { id: '1', type: 'call' as const, subject: 'Llamada con Juan García', contactId: '1', companyId: '1', dealId: '1', createdAt: '2026-03-08T14:30:00', outcome: 'Positivo - Listo para firmar', status: 'completada' as const, followUpType: 'llamar' as const, notes: 'Confirmó presupuesto aprobado por dirección' },
  { id: '2', type: 'email' as const, subject: 'Propuesta enviada', contactId: '2', companyId: '2', dealId: '2', createdAt: '2026-03-07T10:15:00', outcome: 'Enviado - Esperando respuesta', status: 'completada' as const, followUpType: null, notes: 'Propuesta con 3 opciones de plan' },
  { id: '3', type: 'meeting' as const, subject: 'Demo producto', contactId: '4', companyId: '4', dealId: '3', createdAt: '2026-03-09T11:00:00', outcome: 'Muy interesados en AI features', status: 'completada' as const, followUpType: 'llamar' as const, notes: 'Pidieron segunda demo con equipo técnico' },
  { id: '4', type: 'note' as const, subject: 'Notas reunión', contactId: '3', companyId: '3', dealId: '5', createdAt: '2026-03-06T16:45:00', outcome: 'Budget aprobado para Q2', status: 'completada' as const, followUpType: 'visitar' as const, notes: 'Necesitan propuesta formal antes del 15/03' },
  { id: '5', type: 'call' as const, subject: 'Seguimiento propuesta', contactId: '5', companyId: '5', dealId: '4', createdAt: '2026-03-05T09:30:00', outcome: 'Pendiente revisión interna', status: 'pendiente' as const, followUpType: 'llamar' as const, notes: 'Llamar la próxima semana para confirmar' },
  { id: '6', type: 'visit' as const, subject: 'Visita oficinas DataFlow', contactId: '6', companyId: '6', dealId: '6', createdAt: '2026-03-04T10:00:00', outcome: 'Tour completo, muy impresionados', status: 'completada' as const, followUpType: 'visitar' as const, notes: 'Quieren integración con su sistema actual' },
  { id: '7', type: 'call' as const, subject: 'Llamada inicial Cloud Systems', contactId: '7', companyId: '7', dealId: '7', createdAt: '2026-03-03T15:00:00', outcome: 'Interesados pero sin presupuesto aún', status: 'pendiente' as const, followUpType: 'llamar' as const, notes: 'Volver a contactar en abril' },
  { id: '8', type: 'meeting' as const, subject: 'Reunión con equipo Acme', contactId: '9', companyId: '1', dealId: '1', createdAt: '2026-03-02T14:00:00', outcome: 'Alineados en alcance del proyecto', status: 'completada' as const, followUpType: null, notes: 'David presentó requisitos técnicos' },
  { id: '9', type: 'visit' as const, subject: 'Visita a Retail Madrid', contactId: '8', companyId: '8', dealId: '8', createdAt: '2026-03-01T11:00:00', outcome: 'Necesitan solución urgente', status: 'cancelada' as const, followUpType: 'visitar' as const, notes: 'Cancelada por reorganización interna' },
  { id: '10', type: 'email' as const, subject: 'Documentación técnica enviada', contactId: '10', companyId: '2', dealId: '2', createdAt: '2026-02-28T16:00:00', outcome: 'Enviada toda la documentación API', status: 'completada' as const, followUpType: null, notes: 'Carmen pidió specs de integración' },
  { id: '11', type: 'call' as const, subject: 'Llamada de seguimiento Global', contactId: '3', companyId: '3', dealId: '5', createdAt: '2026-02-27T10:30:00', outcome: 'Evaluando competidores', status: 'pendiente' as const, followUpType: 'llamar' as const, notes: 'Enviar comparativa con competidores' },
  { id: '12', type: 'visit' as const, subject: 'Presentación en Marketing Plus', contactId: '5', companyId: '5', dealId: '4', createdAt: '2026-02-25T09:00:00', outcome: 'Buena recepción del equipo', status: 'completada' as const, followUpType: 'visitar' as const, notes: 'Pedro quiere piloto de 1 mes' },
  { id: '13', type: 'call' as const, subject: 'Negociación precio Acme', contactId: '1', companyId: '1', dealId: '1', createdAt: '2026-02-20T11:00:00', outcome: 'Pidieron 10% descuento', status: 'completada' as const, followUpType: 'llamar' as const, notes: 'Aprobado descuento del 5%' },
  { id: '14', type: 'meeting' as const, subject: 'Demo técnica StartupXYZ', contactId: '4', companyId: '4', dealId: '3', createdAt: '2026-02-18T15:00:00', outcome: 'CTO muy interesado en API', status: 'completada' as const, followUpType: null, notes: 'Laura trajo a su equipo de desarrollo' },
  { id: '15', type: 'note' as const, subject: 'Revisión trimestral DataFlow', contactId: '6', companyId: '6', dealId: '6', createdAt: '2026-02-15T14:00:00', outcome: 'Renovación probable en Q2', status: 'pendiente' as const, followUpType: 'llamar' as const, notes: 'Preparar propuesta de renovación anticipada' },
]

export const stages = [
  { id: 'prospecting', name: 'Prospección', probability: 10, position: 0 },
  { id: 'qualification', name: 'Calificación', probability: 30, position: 1 },
  { id: 'proposal', name: 'Propuesta', probability: 50, position: 2 },
  { id: 'negotiation', name: 'Negociación', probability: 75, position: 3 },
  { id: 'closed_won', name: 'Ganado', probability: 100, position: 4 },
]

// Facturas pagadas
export const mockInvoicesPaid = [
  { id: 'inv-1', invoiceNumber: 'F-2025-001', companyName: 'Acme Corp', companyNif: 'B12345678', concept: 'Licencia CRM Enterprise - Anual', issueDate: '2025-01-15', paymentDate: '2025-02-01', subtotal: 37190.08, taxRate: 21, taxAmount: 7809.92, total: 45000.00, status: 'pagada', paymentMethod: 'Transferencia' },
  { id: 'inv-2', invoiceNumber: 'F-2025-002', companyName: 'Tech Solutions', companyNif: 'B87654321', concept: 'Plan Professional - Semestral', issueDate: '2025-02-01', paymentDate: '2025-02-15', subtotal: 9917.36, taxRate: 21, taxAmount: 2082.64, total: 12000.00, status: 'pagada', paymentMethod: 'Domiciliación' },
  { id: 'inv-3', invoiceNumber: 'F-2025-003', companyName: 'Marketing Plus', companyNif: 'A11223344', concept: 'Consultoría de implementación', issueDate: '2025-03-10', paymentDate: '2025-03-25', subtotal: 4132.23, taxRate: 21, taxAmount: 867.77, total: 5000.00, status: 'pagada', paymentMethod: 'Transferencia' },
  { id: 'inv-4', invoiceNumber: 'F-2025-004', companyName: 'DataFlow', companyNif: 'B99887766', concept: 'Integración API personalizada', issueDate: '2025-04-01', paymentDate: '2025-04-20', subtotal: 18181.82, taxRate: 21, taxAmount: 3818.18, total: 22000.00, status: 'pagada', paymentMethod: 'Transferencia' },
  { id: 'inv-5', invoiceNumber: 'F-2025-005', companyName: 'StartupXYZ', companyNif: 'B55443322', concept: 'Plan Starter - Anual', issueDate: '2025-05-01', paymentDate: '2025-05-10', subtotal: 2975.21, taxRate: 21, taxAmount: 624.79, total: 3600.00, status: 'pagada', paymentMethod: 'Tarjeta' },
]

// Facturas pendientes
export const mockInvoicesPending = [
  { id: 'inv-6', invoiceNumber: 'F-2026-001', companyName: 'Global Industries', companyNif: 'A44556677', concept: 'Enterprise Deal - Fase 1', issueDate: '2026-01-15', dueDate: '2026-02-15', subtotal: 70247.93, taxRate: 21, taxAmount: 14752.07, total: 85000.00, status: 'vencida', daysOverdue: 23 },
  { id: 'inv-7', invoiceNumber: 'F-2026-002', companyName: 'Cloud Systems', companyNif: 'B66778899', concept: 'Professional Services Q1', issueDate: '2026-02-01', dueDate: '2026-03-01', subtotal: 28925.62, taxRate: 21, taxAmount: 6074.38, total: 35000.00, status: 'vencida', daysOverdue: 9 },
  { id: 'inv-8', invoiceNumber: 'F-2026-003', companyName: 'Retail Madrid', companyNif: 'B11009988', concept: 'Solución Retail - Setup', issueDate: '2026-02-20', dueDate: '2026-03-20', subtotal: 12396.69, taxRate: 21, taxAmount: 2603.31, total: 15000.00, status: 'pendiente', daysOverdue: 0 },
  { id: 'inv-9', invoiceNumber: 'F-2026-004', companyName: 'Acme Corp', companyNif: 'B12345678', concept: 'Renovación licencia 2026', issueDate: '2026-03-01', dueDate: '2026-03-31', subtotal: 37190.08, taxRate: 21, taxAmount: 7809.92, total: 45000.00, status: 'pendiente', daysOverdue: 0 },
]

// Helper functions
export function getCompanyById(id: string) {
  return mockCompanies.find(c => c.id === id)
}

export function getContactById(id: string) {
  return mockContacts.find(c => c.id === id)
}

export function getDealsByStage(stageId: string) {
  return mockDeals.filter(d => d.stage === stageId)
}

export function getContactsWithCompany() {
  return mockContacts.map(contact => ({
    ...contact,
    company: getCompanyById(contact.companyId),
  }))
}

export function getDealsWithRelations() {
  return mockDeals.map(deal => ({
    ...deal,
    company: getCompanyById(deal.companyId),
    contacts: deal.contactIds.map(id => getContactById(id)).filter(Boolean),
    stageName: stages.find(s => s.id === deal.stage)?.name,
  }))
}

export function getContactsByCompany(companyId: string) {
  return mockContacts.filter(c => c.companyId === companyId)
}

export function getDealsByCompany(companyId: string) {
  return mockDeals.filter(d => d.companyId === companyId)
}

export function getActivitiesByCompany(companyId: string) {
  return mockActivities.filter(a => a.companyId === companyId)
}

export function getActivitiesByContact(contactId: string) {
  return mockActivities.filter(a => a.contactId === contactId)
}

export function getDealsByContact(contactId: string) {
  return mockDeals.filter(d => d.contactIds.includes(contactId))
}

export function getTasksByCompany(companyId: string) {
  return mockTasks.filter(t => t.companyId === companyId)
}

export function getTasksByContact(contactId: string) {
  return mockTasks.filter(t => t.contactId === contactId)
}

export function getTasksByDate(date: string) {
  return mockTasks.filter(t => t.dueDate === date)
}

export function getActiveCompanies() {
  return mockCompanies.filter(c => c.status === 'activo')
}

export function getClosedCompanies() {
  return mockCompanies.filter(c => c.status === 'cerrado')
}

export function getDaysSinceLastActivity(companyId: string): number {
  const activities = getActivitiesByCompany(companyId)
  if (activities.length === 0) return 999
  const latest = activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  const diff = Math.floor((new Date().getTime() - new Date(latest.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function getOverdueCompanies(thresholdDays = 7) {
  return getActiveCompanies().filter(c => getDaysSinceLastActivity(c.id) >= thresholdDays)
}

export function calculatePipelineMetrics() {
  const totalValue = mockDeals.reduce((sum, deal) => sum + deal.value, 0)
  const weightedValue = mockDeals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0)
  const dealsWon = mockDeals.filter(d => d.stage === 'closed_won').length
  const totalDeals = mockDeals.length
  const avgDealSize = totalValue / totalDeals

  return {
    totalValue,
    weightedValue,
    dealsWon,
    totalDeals,
    avgDealSize,
    conversionRate: 32, // mock
  }
}
