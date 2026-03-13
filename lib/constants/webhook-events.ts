// Webhook event types and constants
// This file is NOT a server action - constants can be used on both client and server

export const WEBHOOK_EVENTS = {
  // Contacts
  'contact.created': 'Contacto creado',
  'contact.updated': 'Contacto actualizado',
  'contact.deleted': 'Contacto eliminado',
  // Companies
  'company.created': 'Empresa creada',
  'company.updated': 'Empresa actualizada',
  'company.deleted': 'Empresa eliminada',
  // Deals
  'deal.created': 'Oportunidad creada',
  'deal.updated': 'Oportunidad actualizada',
  'deal.stage_changed': 'Etapa de oportunidad cambiada',
  'deal.won': 'Oportunidad ganada',
  'deal.lost': 'Oportunidad perdida',
  // Activities
  'activity.created': 'Actividad creada',
  // Tasks
  'task.created': 'Tarea creada',
  'task.completed': 'Tarea completada',
} as const

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS
