// Mock data para demo

export const mockCompanies = [
  { id: '1', name: 'Acme Corp', industry: 'SaaS', size: '51-200', website: 'acme.com', canal: 'web' },
  { id: '2', name: 'Tech Solutions', industry: 'Consultoría', size: '11-50', website: 'techsol.es', canal: 'referido' },
  { id: '3', name: 'Global Industries', industry: 'Manufacturing', size: '201-500', website: 'globalind.com', canal: 'email' },
  { id: '4', name: 'StartupXYZ', industry: 'FinTech', size: '1-10', website: 'startupxyz.io', canal: 'social' },
  { id: '5', name: 'Marketing Plus', industry: 'Agencia', size: '11-50', website: 'marketingplus.es', canal: 'referido' },
  { id: '6', name: 'DataFlow', industry: 'Analytics', size: '51-200', website: 'dataflow.com', canal: 'web' },
  { id: '7', name: 'Cloud Systems', industry: 'Cloud Services', size: '201-500', website: 'cloudsys.io', canal: 'evento' },
  { id: '8', name: 'Retail Madrid', industry: 'Retail', size: '51-200', website: 'retailmadrid.es', canal: 'llamada' },
]

export const mockContacts = [
  { id: '1', firstName: 'Juan', lastName: 'García', email: 'juan.garcia@acme.com', phone: '+34 600 123 456', jobTitle: 'CTO', companyId: '1', lifecycle: 'customer' },
  { id: '2', firstName: 'María', lastName: 'López', email: 'maria.lopez@techsol.es', phone: '+34 610 234 567', jobTitle: 'CEO', companyId: '2', lifecycle: 'prospect' },
  { id: '3', firstName: 'Carlos', lastName: 'Rodríguez', email: 'carlos@globalind.com', phone: '+34 620 345 678', jobTitle: 'VP Sales', companyId: '3', lifecycle: 'lead' },
  { id: '4', firstName: 'Laura', lastName: 'Martínez', email: 'laura@startupxyz.io', phone: '+34 630 456 789', jobTitle: 'Founder', companyId: '4', lifecycle: 'prospect' },
  { id: '5', firstName: 'Pedro', lastName: 'Sánchez', email: 'pedro@marketingplus.es', phone: '+34 640 567 890', jobTitle: 'Director', companyId: '5', lifecycle: 'customer' },
  { id: '6', firstName: 'Ana', lastName: 'Fernández', email: 'ana@dataflow.com', phone: '+34 650 678 901', jobTitle: 'COO', companyId: '6', lifecycle: 'lead' },
  { id: '7', firstName: 'Miguel', lastName: 'Torres', email: 'miguel@cloudsys.io', phone: '+34 660 789 012', jobTitle: 'CTO', companyId: '7', lifecycle: 'prospect' },
  { id: '8', firstName: 'Isabel', lastName: 'Ruiz', email: 'isabel@retailmadrid.es', phone: '+34 670 890 123', jobTitle: 'Gerente', companyId: '8', lifecycle: 'customer' },
  { id: '9', firstName: 'David', lastName: 'Gómez', email: 'david@acme.com', phone: '+34 680 901 234', jobTitle: 'VP Product', companyId: '1', lifecycle: 'customer' },
  { id: '10', firstName: 'Carmen', lastName: 'Díaz', email: 'carmen@techsol.es', phone: '+34 690 012 345', jobTitle: 'CFO', companyId: '2', lifecycle: 'prospect' },
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
  { id: '1', title: 'Llamar a Juan García de Acme Corp', dealId: '1', dueDate: '2026-03-09', isCompleted: false, priority: 'high' },
  { id: '2', title: 'Enviar propuesta a Tech Solutions', dealId: '2', dueDate: '2026-03-10', isCompleted: false, priority: 'high' },
  { id: '3', title: 'Follow-up con StartupXYZ', dealId: '3', dueDate: '2026-03-09', isCompleted: false, priority: 'medium' },
  { id: '4', title: 'Demo programada con Global Industries', dealId: '5', dueDate: '2026-03-12', isCompleted: false, priority: 'medium' },
  { id: '5', title: 'Revisar contrato Cloud Systems', dealId: '7', dueDate: '2026-03-11', isCompleted: false, priority: 'low' },
  { id: '6', title: 'Reunión de cierre Acme Corp', dealId: '1', dueDate: '2026-03-07', isCompleted: false, priority: 'high' },
]

export const mockActivities = [
  { id: '1', type: 'call', subject: 'Llamada con Juan García', contactId: '1', dealId: '1', createdAt: '2026-03-08T14:30:00', outcome: 'Positivo - Listo para firmar' },
  { id: '2', type: 'email', subject: 'Propuesta enviada', contactId: '2', dealId: '2', createdAt: '2026-03-07T10:15:00', outcome: 'Enviado - Esperando respuesta' },
  { id: '3', type: 'meeting', subject: 'Demo producto', contactId: '4', dealId: '3', createdAt: '2026-03-09T11:00:00', outcome: 'Muy interesados en AI features' },
  { id: '4', type: 'note', subject: 'Notas reunión', contactId: '3', dealId: '5', createdAt: '2026-03-06T16:45:00', outcome: 'Budget aprobado para Q2' },
]

export const stages = [
  { id: 'prospecting', name: 'Prospección', probability: 10, position: 0 },
  { id: 'qualification', name: 'Calificación', probability: 30, position: 1 },
  { id: 'proposal', name: 'Propuesta', probability: 50, position: 2 },
  { id: 'negotiation', name: 'Negociación', probability: 75, position: 3 },
  { id: 'closed_won', name: 'Ganado', probability: 100, position: 4 },
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
