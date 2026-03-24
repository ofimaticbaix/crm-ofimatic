// Tipos para el sistema de importación inteligente

export type ImportEntityType = 'contactos' | 'empresas' | 'leads' | 'facturas_pagadas' | 'facturas_pendientes'

export type ImportStep = 'upload' | 'entity_type' | 'mapping' | 'config' | 'preview' | 'complete'

// Estrategia de duplicados
export type DuplicateStrategy = 'skip' | 'update' | 'import_anyway'
export type DuplicateDetection = 'nif' | 'name' | 'email'
export type DefaultAccountType = 'customer' | 'prospect' | 'lead'

export interface ImportConfig {
  duplicateStrategy: DuplicateStrategy
  duplicateDetection: DuplicateDetection
  defaultAccountType: DefaultAccountType
}

// Progreso de importación en tiempo real
export interface ImportProgress {
  current: number
  total: number
  inserted: number
  updated: number
  skipped: number
  failed: number
  isRunning: boolean
  failedRows: { row: number; data: Record<string, string>; error: string }[]
}

export interface ColumnMapping {
  sourceColumn: string
  targetField: string | null // null = omitir
  confidence: number // 0-100
  sampleValues: string[]
  isCustomField: boolean
}

export interface ImportProfile {
  id: string
  name: string
  entityType: ImportEntityType
  mappings: ColumnMapping[]
  sourceColumns: string[]
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface ImportState {
  step: ImportStep
  file: File | null
  fileName: string
  fileType: string
  entityType: ImportEntityType | null
  rawData: Record<string, string>[]
  sourceColumns: string[]
  mappings: ColumnMapping[]
  validationErrors: ValidationError[]
  selectedProfileId: string | null
  accessTables: string[] // para archivos Access con múltiples tablas
  selectedAccessTable: string | null
  importResult: ImportResult | null
}

export interface ValidationError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning'
}

export interface ImportResult {
  totalRows: number
  insertedRows: number
  updatedRows: number
  skippedRows: number
  failedRows: number
  errors: ValidationError[]
  failedRowsData: { row: number; data: Record<string, string>; error: string }[]
}

// Entidades

export interface Invoice {
  id?: string
  invoiceNumber: string
  companyName: string
  companyNif?: string
  concept?: string
  issueDate: string
  dueDate?: string
  paymentDate?: string
  subtotal: number
  taxRate?: number
  taxAmount?: number
  total: number
  status: 'pagada' | 'pendiente' | 'vencida'
  paymentMethod?: string
  daysOverdue?: number
  custom_fields?: Record<string, string>
}

export interface FieldDefinition {
  key: string
  label: string
  required: boolean
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'url' | 'nif'
  aliases: string[]
}
