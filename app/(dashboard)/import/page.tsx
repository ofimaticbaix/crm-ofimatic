'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload, FileSpreadsheet, Building2, Users, CheckCircle, AlertCircle,
  ChevronRight, ArrowLeft, Save, FolderOpen, Trash2, Database,
  FileText, Receipt, ReceiptText, X, Info, Settings, Download, Loader2
} from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type {
  ImportStep, ImportEntityType, ColumnMapping, ValidationError, ImportResult,
  ImportConfig, ImportProgress, DuplicateStrategy, DuplicateDetection, DefaultAccountType
} from '@/lib/import-types'
import { getFieldsForEntityType, getEntityTypeLabel } from '@/lib/import-fields'
import { autoMapColumns, getUnmappedRequiredFields } from '@/lib/import-matcher'
import { validateImportData, getValidationSummary } from '@/lib/import-validator'
import {
  getProfiles, saveProfile, deleteProfile, findMatchingProfiles,
  applyProfile, incrementProfileUsage
} from '@/lib/import-profiles'
import type { ImportProfile } from '@/lib/import-types'
import { cleanRow } from '@/lib/import-cleaners'
import { importCompaniesBatch, importContactsBatch, countDuplicates } from '@/lib/actions/import'
import { useWorkspace } from '@/lib/context/workspace-context'

// ==========================================
// Componentes del Wizard
// ==========================================

function StepIndicator({ currentStep, steps }: { currentStep: ImportStep, steps: { key: ImportStep, label: string }[] }) {
  const currentIdx = steps.findIndex(s => s.key === currentStep)
  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      {steps.map((step, idx) => (
        <div key={step.key} className="flex items-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
            idx === currentIdx ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
            idx < currentIdx ? 'bg-green-500/20 text-green-300' :
            'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              idx < currentIdx ? 'bg-green-500 text-white' :
              idx === currentIdx ? 'bg-blue-500 text-white' :
              'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {idx < currentIdx ? '✓' : idx + 1}
            </span>
            {step.label}
          </div>
          {idx < steps.length - 1 && <ChevronRight className="h-4 w-4 text-gray-600 mx-1 flex-shrink-0" />}
        </div>
      ))}
    </div>
  )
}

// ==========================================
// Página principal
// ==========================================

export default function ImportPage() {
  const { workspaceId } = useWorkspace()

  // Estado del wizard
  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [entityType, setEntityType] = useState<ImportEntityType | null>(null)
  const [rawData, setRawData] = useState<Record<string, string>[]>([])
  const [sourceColumns, setSourceColumns] = useState<string[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Config de importación
  const [importConfig, setImportConfig] = useState<ImportConfig>({
    duplicateStrategy: 'skip',
    duplicateDetection: 'nif',
    defaultAccountType: 'customer',
  })
  const [duplicateCount, setDuplicateCount] = useState<number | null>(null)
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false)

  // Progreso de importación
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    current: 0, total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0,
    isRunning: false, failedRows: []
  })

  // Perfiles
  const [matchingProfiles, setMatchingProfiles] = useState<ImportProfile[]>([])
  const [showSaveProfile, setShowSaveProfile] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [savedProfiles, setSavedProfiles] = useState<ImportProfile[]>([])

  // Access tables
  const [accessTables, setAccessTables] = useState<string[]>([])
  const [selectedAccessTable, setSelectedAccessTable] = useState<string | null>(null)

  useEffect(() => {
    setSavedProfiles(getProfiles())
  }, [])

  const steps: { key: ImportStep, label: string }[] = [
    { key: 'upload', label: 'Subir archivo' },
    { key: 'entity_type', label: 'Tipo de datos' },
    { key: 'mapping', label: 'Mapeo de columnas' },
    { key: 'config', label: 'Configuración' },
    { key: 'preview', label: 'Vista previa' },
    { key: 'complete', label: 'Resultado' },
  ]

  // ==========================================
  // Parseo de archivos
  // ==========================================

  const processFileData = useCallback((rows: Record<string, string>[], name: string) => {
    if (rows.length === 0) {
      alert('El archivo está vacío o no se pudo leer')
      setIsProcessing(false)
      return
    }
    const columns = Object.keys(rows[0]).filter(k => k.trim())
    setRawData(rows)
    setSourceColumns(columns)
    setFileName(name)
    setStep('entity_type')
    setIsProcessing(false)

    const profiles = findMatchingProfiles(columns)
    setMatchingProfiles(profiles)
  }, [])

  const parseFile = useCallback((uploadedFile: File) => {
    setFile(uploadedFile)
    setIsProcessing(true)
    const ext = uploadedFile.name.split('.').pop()?.toLowerCase()

    if (ext === 'csv') {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          processFileData(results.data as Record<string, string>[], uploadedFile.name)
        },
        error: () => {
          alert('Error al leer el archivo CSV')
          setIsProcessing(false)
        }
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' }) as Record<string, string>[]
        const stringRows = rows.map(row => {
          const newRow: Record<string, string> = {}
          for (const [key, value] of Object.entries(row)) {
            newRow[key] = String(value ?? '')
          }
          return newRow
        })
        processFileData(stringRows, uploadedFile.name)
      }
      reader.onerror = () => {
        alert('Error al leer el archivo Excel')
        setIsProcessing(false)
      }
      reader.readAsArrayBuffer(uploadedFile)
    } else if (ext === 'mdb' || ext === 'accdb') {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const MDBReader = (await import('mdb-reader')).default
          const buffer = e.target?.result as ArrayBuffer
          const mdb = new MDBReader(Buffer.from(buffer))
          const tables = mdb.getTableNames().filter(t => !t.startsWith('MSys'))
          if (tables.length === 0) {
            alert('No se encontraron tablas en el archivo Access')
            setIsProcessing(false)
            return
          }
          if (tables.length === 1) {
            const tableData = mdb.getTable(tables[0]).getData()
            const stringRows = tableData.map(row => {
              const newRow: Record<string, string> = {}
              for (const [key, value] of Object.entries(row)) {
                newRow[key] = value != null ? String(value) : ''
              }
              return newRow
            })
            processFileData(stringRows, uploadedFile.name)
          } else {
            setAccessTables(tables)
            setFile(uploadedFile)
            setFileName(uploadedFile.name)
            setIsProcessing(false)
          }
        } catch {
          alert('Error al leer el archivo Access. Asegúrate de que es un archivo .mdb o .accdb válido.')
          setIsProcessing(false)
        }
      }
      reader.readAsArrayBuffer(uploadedFile)
    } else {
      alert('Formato no soportado. Usa CSV, Excel (.xlsx, .xls) o Access (.mdb, .accdb)')
      setIsProcessing(false)
    }
  }, [processFileData])

  const handleAccessTableSelect = useCallback(async (tableName: string) => {
    if (!file) return
    setIsProcessing(true)
    setSelectedAccessTable(tableName)
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const MDBReader = (await import('mdb-reader')).default
        const buffer = e.target?.result as ArrayBuffer
        const mdb = new MDBReader(Buffer.from(buffer))
        const tableData = mdb.getTable(tableName).getData()
        const stringRows = tableData.map(row => {
          const newRow: Record<string, string> = {}
          for (const [key, value] of Object.entries(row)) {
            newRow[key] = value != null ? String(value) : ''
          }
          return newRow
        })
        setAccessTables([])
        processFileData(stringRows, `${file.name} → ${tableName}`)
      } catch {
        alert('Error al leer la tabla seleccionada')
        setIsProcessing(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [file, processFileData])

  // ==========================================
  // Drag & Drop
  // ==========================================

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) parseFile(droppedFile)
  }, [parseFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) parseFile(selectedFile)
  }, [parseFile])

  // ==========================================
  // Selección de tipo de entidad
  // ==========================================

  const handleEntityTypeSelect = useCallback((type: ImportEntityType) => {
    setEntityType(type)
    const autoMappings = autoMapColumns(sourceColumns, rawData, type)
    setMappings(autoMappings)
    setStep('mapping')

    const profiles = findMatchingProfiles(sourceColumns, type)
    setMatchingProfiles(profiles)

    // Configurar detección de duplicados por defecto según tipo
    if (type === 'empresas') {
      setImportConfig(prev => ({ ...prev, duplicateDetection: 'nif' }))
    } else if (type === 'contactos') {
      setImportConfig(prev => ({ ...prev, duplicateDetection: 'email' }))
    }
  }, [sourceColumns, rawData])

  // ==========================================
  // Mapeo de columnas
  // ==========================================

  const handleMappingChange = useCallback((sourceColumn: string, targetField: string | null) => {
    setMappings(prev => prev.map(m =>
      m.sourceColumn === sourceColumn
        ? { ...m, targetField, confidence: targetField ? 100 : 0, isCustomField: targetField === '__custom__' }
        : m
    ))
  }, [])

  const handleApplyProfile = useCallback((profile: ImportProfile) => {
    if (!entityType) return
    const profileMappings = applyProfile(profile, sourceColumns, rawData)
    setMappings(profileMappings)
    incrementProfileUsage(profile.id)
    setSavedProfiles(getProfiles())
  }, [entityType, sourceColumns, rawData])

  const handleSaveProfile = useCallback(() => {
    if (!profileName.trim() || !entityType) return
    saveProfile(profileName.trim(), entityType, mappings, sourceColumns)
    setSavedProfiles(getProfiles())
    setShowSaveProfile(false)
    setProfileName('')
  }, [profileName, entityType, mappings, sourceColumns])

  const handleDeleteProfile = useCallback((id: string) => {
    deleteProfile(id)
    setSavedProfiles(getProfiles())
    setMatchingProfiles(prev => prev.filter(p => p.id !== id))
  }, [])

  // ==========================================
  // Ir a configuración
  // ==========================================

  const handleGoToConfig = useCallback(() => {
    setStep('config')
    setDuplicateCount(null)
  }, [])

  // ==========================================
  // Comprobar duplicados
  // ==========================================

  const handleCheckDuplicates = useCallback(async () => {
    if (!entityType || !workspaceId) return
    setIsCheckingDuplicates(true)

    try {
      // Extraer valores para detección
      const detection = importConfig.duplicateDetection
      let fieldKey = ''
      if (entityType === 'empresas') {
        fieldKey = detection === 'nif' ? 'vat_number' : detection === 'email' ? 'email' : 'name'
      } else {
        fieldKey = detection === 'email' ? 'email' : 'first_name'
      }

      const mapping = mappings.find(m => m.targetField === fieldKey)
      if (!mapping) {
        setDuplicateCount(0)
        setIsCheckingDuplicates(false)
        return
      }

      const values = rawData
        .map(row => row[mapping.sourceColumn]?.trim())
        .filter(Boolean)

      const count = await countDuplicates(
        workspaceId,
        entityType as 'contactos' | 'empresas',
        detection,
        values as string[]
      )
      setDuplicateCount(count)
    } catch {
      setDuplicateCount(0)
    }
    setIsCheckingDuplicates(false)
  }, [entityType, workspaceId, importConfig.duplicateDetection, mappings, rawData])

  // ==========================================
  // Validación y preview
  // ==========================================

  const handleGoToPreview = useCallback(() => {
    if (!entityType) return
    const errors = validateImportData(rawData, mappings, entityType)
    setValidationErrors(errors)
    setStep('preview')
  }, [rawData, mappings, entityType])

  // ==========================================
  // Importación REAL con batches
  // ==========================================

  const handleImport = useCallback(async () => {
    if (!entityType || !workspaceId) return

    const activeMappings = mappings.filter(m => m.targetField && m.targetField !== '__custom__')
    const errorRows = new Set(validationErrors.filter(e => e.row >= 0 && e.severity === 'error').map(e => e.row))
    const fields = getFieldsForEntityType(entityType)

    // Preparar filas limpias
    const cleanedRows: { index: number; data: any; rawData: Record<string, string> }[] = []

    for (let i = 0; i < rawData.length; i++) {
      if (errorRows.has(i)) continue
      const { data, customFields } = cleanRow(rawData[i], mappings, fields)

      // Verificar que al menos el campo principal tiene valor
      const hasData = Object.values(data).some(v => v != null && v !== '')
      if (!hasData) continue

      if (Object.keys(customFields).length > 0) {
        data.custom_fields = customFields
      }

      cleanedRows.push({ index: i, data, rawData: rawData[i] })
    }

    // Iniciar progreso
    const BATCH_SIZE = 50
    const totalBatches = Math.ceil(cleanedRows.length / BATCH_SIZE)

    setImportProgress({
      current: 0,
      total: cleanedRows.length,
      inserted: 0, updated: 0, skipped: 0, failed: 0,
      isRunning: true, failedRows: []
    })
    setStep('complete')

    let totalInserted = 0, totalUpdated = 0, totalSkipped = 0, totalFailed = 0
    const allFailedRows: { row: number; data: Record<string, string>; error: string }[] = []

    // Procesar en batches
    for (let batch = 0; batch < totalBatches; batch++) {
      const start = batch * BATCH_SIZE
      const end = Math.min(start + BATCH_SIZE, cleanedRows.length)
      const batchRows = cleanedRows.slice(start, end)

      let batchResult

      if (entityType === 'empresas') {
        batchResult = await importCompaniesBatch(workspaceId, batchRows, importConfig)
      } else if (entityType === 'contactos') {
        batchResult = await importContactsBatch(workspaceId, batchRows, importConfig)
      } else {
        // facturas - por ahora skip
        continue
      }

      if (batchResult) {
        totalInserted += batchResult.inserted
        totalUpdated += batchResult.updated
        totalSkipped += batchResult.skipped
        totalFailed += batchResult.failed
        allFailedRows.push(...batchResult.failedRows)
      }

      setImportProgress({
        current: end,
        total: cleanedRows.length,
        inserted: totalInserted,
        updated: totalUpdated,
        skipped: totalSkipped,
        failed: totalFailed,
        isRunning: batch < totalBatches - 1,
        failedRows: allFailedRows,
      })
    }

    // Resultado final
    setImportResult({
      totalRows: rawData.length,
      insertedRows: totalInserted,
      updatedRows: totalUpdated,
      skippedRows: totalSkipped + errorRows.size,
      failedRows: totalFailed,
      errors: validationErrors.filter(e => e.severity === 'error'),
      failedRowsData: allFailedRows,
    })

    setImportProgress(prev => ({ ...prev, isRunning: false }))
  }, [entityType, workspaceId, mappings, rawData, validationErrors, importConfig])

  // ==========================================
  // Descargar CSV de errores
  // ==========================================

  const handleDownloadErrors = useCallback(() => {
    if (!importResult?.failedRowsData?.length) return

    const headers = Object.keys(importResult.failedRowsData[0].data)
    const csvRows = [
      [...headers, 'ERROR'].join(','),
      ...importResult.failedRowsData.map(fr => {
        const values = headers.map(h => {
          const val = fr.data[h] || ''
          // Escapar comillas y valores con comas
          return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val
        })
        return [...values, `"${fr.error.replace(/"/g, '""')}"`].join(',')
      })
    ]

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `errores-importacion-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [importResult])

  // ==========================================
  // Reset
  // ==========================================

  const resetWizard = useCallback(() => {
    setStep('upload')
    setFile(null)
    setFileName('')
    setEntityType(null)
    setRawData([])
    setSourceColumns([])
    setMappings([])
    setValidationErrors([])
    setImportResult(null)
    setAccessTables([])
    setSelectedAccessTable(null)
    setMatchingProfiles([])
    setShowSaveProfile(false)
    setProfileName('')
    setImportProgress({ current: 0, total: 0, inserted: 0, updated: 0, skipped: 0, failed: 0, isRunning: false, failedRows: [] })
    setDuplicateCount(null)
    setImportConfig({ duplicateStrategy: 'skip', duplicateDetection: 'nif', defaultAccountType: 'customer' })
  }, [])

  // ==========================================
  // RENDER
  // ==========================================

  const fields = entityType ? getFieldsForEntityType(entityType) : []
  const unmappedRequired = entityType ? getUnmappedRequiredFields(mappings, entityType) : []
  const summary = getValidationSummary(validationErrors)

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Importar Datos</h1>
        <p className="text-xs md:text-sm text-gray-300 mt-1">
          Importa contactos, empresas y facturas desde CSV, Excel o Access
        </p>
      </div>

      <StepIndicator currentStep={step} steps={steps} />

      {/* ==========================================
          PASO 1: SUBIR ARCHIVO
          ========================================== */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Subir Archivo</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              CSV, Excel (.xlsx, .xls) o Access (.mdb, .accdb)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accessTables.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  El archivo Access contiene {accessTables.length} tablas. Selecciona cuál importar:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessTables.map(table => (
                    <button
                      key={table}
                      onClick={() => handleAccessTableSelect(table)}
                      disabled={isProcessing}
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left"
                    >
                      <Database className="h-5 w-5 text-blue-400 flex-shrink-0" />
                      <span className="text-gray-900 dark:text-white text-sm font-medium">{table}</span>
                    </button>
                  ))}
                </div>
                <Button variant="outline" onClick={resetWizard} className="rounded-xl dark:border-gray-700 dark:text-gray-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Elegir otro archivo
                </Button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
                  isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-blue-500/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`h-12 w-12 mb-4 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                <p className="text-gray-900 dark:text-white mb-2 text-center">
                  {isProcessing ? 'Procesando archivo...' : 'Arrastra tu archivo aquí o haz clic para seleccionar'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">CSV, XLSX, XLS, MDB o ACCDB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.mdb,.accdb"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />
                <Button asChild className="rounded-xl pointer-events-none">
                  <span>{isProcessing ? 'Procesando...' : 'Seleccionar Archivo'}</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ==========================================
          PASO 2: TIPO DE ENTIDAD
          ========================================== */}
      {step === 'entity_type' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                ¿Qué tipo de datos contiene &quot;{fileName}&quot;?
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                {rawData.length} filas detectadas con {sourceColumns.length} columnas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { type: 'contactos' as const, icon: Users, color: 'purple', desc: 'Nombres, emails, teléfonos, cargos' },
                  { type: 'empresas' as const, icon: Building2, color: 'blue', desc: 'Razón social, NIF/CIF, sector, dirección' },
                  { type: 'facturas_pagadas' as const, icon: Receipt, color: 'green', desc: 'Facturas cobradas con fecha de pago' },
                  { type: 'facturas_pendientes' as const, icon: ReceiptText, color: 'orange', desc: 'Facturas por cobrar o vencidas' },
                ]).map(({ type, icon: Icon, color, desc }) => (
                  <button
                    key={type}
                    onClick={() => handleEntityTypeSelect(type)}
                    className={`flex items-start gap-4 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-${color}-500 hover:bg-${color}-500/10 transition-all text-left group`}
                  >
                    <div className={`p-3 rounded-lg bg-${color}-500/20 group-hover:bg-${color}-500/30 transition-colors`}>
                      <Icon className={`h-6 w-6 text-${color}-400`} />
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-white font-semibold">{getEntityTypeLabel(type)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Perfiles sugeridos */}
              {matchingProfiles.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <p className="text-sm text-blue-300 font-medium mb-2">
                    <Info className="h-4 w-4 inline mr-1" />
                    Perfiles similares encontrados:
                  </p>
                  {matchingProfiles.map(profile => (
                    <div key={profile.id} className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {profile.name} ({getEntityTypeLabel(profile.entityType)}) - usado {profile.usageCount}x
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs dark:border-blue-500/40 dark:text-blue-300"
                        onClick={() => {
                          setEntityType(profile.entityType)
                          const profileMappings = applyProfile(profile, sourceColumns, rawData)
                          setMappings(profileMappings)
                          incrementProfileUsage(profile.id)
                          setSavedProfiles(getProfiles())
                          setStep('mapping')
                        }}
                      >
                        <FolderOpen className="h-3 w-3 mr-1" />
                        Usar perfil
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => { setStep('upload'); setAccessTables([]); }} className="rounded-xl dark:border-gray-700 dark:text-gray-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </>
      )}

      {/* ==========================================
          PASO 3: MAPEO DE COLUMNAS
          ========================================== */}
      {step === 'mapping' && entityType && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">Mapeo de Columnas</CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    Asigna cada columna del archivo al campo correspondiente del CRM
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {savedProfiles.filter(p => p.entityType === entityType).length > 0 && (
                    <div className="relative group">
                      <Button variant="outline" size="sm" className="rounded-lg dark:border-gray-700 dark:text-gray-300">
                        <FolderOpen className="h-4 w-4 mr-1" />
                        Cargar Perfil
                      </Button>
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-10 min-w-[240px] hidden group-hover:block">
                        {savedProfiles.filter(p => p.entityType === entityType).map(profile => (
                          <div key={profile.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                            <button
                              onClick={() => handleApplyProfile(profile)}
                              className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex-1 text-left"
                            >
                              {profile.name}
                            </button>
                            <button
                              onClick={() => handleDeleteProfile(profile.id)}
                              className="text-gray-500 hover:text-red-400 ml-2"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg dark:border-gray-700 dark:text-gray-300"
                    onClick={() => setShowSaveProfile(!showSaveProfile)}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Guardar Perfil
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showSaveProfile && (
                <div className="flex gap-2 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Nombre del perfil (ej: Aniwin Contactos)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  />
                  <Button size="sm" className="rounded-lg" onClick={handleSaveProfile} disabled={!profileName.trim()}>
                    Guardar
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => { setShowSaveProfile(false); setProfileName(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {unmappedRequired.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-300 font-medium">
                    Campos obligatorios sin mapear: {unmappedRequired.map(f => f.label).join(', ')}
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Columna Origen</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Valores Ejemplo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Campo CRM</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 w-24">Confianza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {mappings.map((mapping) => {
                      const isRequired = fields.find(f => f.key === mapping.targetField)?.required
                      const isMapped = mapping.targetField !== null
                      return (
                        <tr key={mapping.sourceColumn} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900 dark:text-white font-medium">{mapping.sourceColumn}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {mapping.sampleValues.slice(0, 3).map((val, i) => (
                                <span key={i} className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded max-w-[120px] truncate">
                                  {val}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={mapping.targetField || ''}
                              onChange={(e) => handleMappingChange(mapping.sourceColumn, e.target.value || null)}
                              className={`text-sm rounded-lg bg-white dark:bg-gray-800 border px-3 py-1.5 w-full max-w-[220px] focus:outline-none focus:border-blue-500 ${
                                !isMapped ? 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400' :
                                isRequired ? 'border-green-500/50 text-green-700 dark:text-green-300' :
                                'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white'
                              }`}
                            >
                              <option value="">— No importar —</option>
                              {fields.map(field => (
                                <option key={field.key} value={field.key}>
                                  {field.label} {field.required ? '*' : ''}
                                </option>
                              ))}
                              <option value="__custom__">+ Campo personalizado</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            {isMapped && (
                              <Badge className={`rounded-full text-xs ${
                                mapping.confidence >= 80 ? 'bg-green-500/20 text-green-300' :
                                mapping.confidence >= 50 ? 'bg-yellow-500/20 text-yellow-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}>
                                {mapping.confidence}%
                              </Badge>
                            )}
                            {!isMapped && (
                              <Badge className="rounded-full text-xs bg-red-500/20 text-red-300">
                                Sin mapear
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleGoToConfig}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={unmappedRequired.length > 0}
                >
                  Continuar a Configuración
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => setStep('entity_type')} className="rounded-xl dark:border-gray-700 dark:text-gray-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ==========================================
          PASO 4: CONFIGURACIÓN
          ========================================== */}
      {step === 'config' && entityType && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Importación
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Configura cómo manejar duplicados y valores por defecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Detección de duplicados */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Detección de duplicados
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  ¿Cómo detectar si un registro ya existe en el CRM?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(entityType === 'empresas' ? [
                    { value: 'nif' as const, label: 'Por NIF/CIF', desc: 'Recomendado si tienes NIF' },
                    { value: 'name' as const, label: 'Por Razón Social', desc: 'Si no tienes NIF' },
                    { value: 'email' as const, label: 'Por Email', desc: 'Si tienes email de empresa' },
                  ] : [
                    { value: 'email' as const, label: 'Por Email', desc: 'Recomendado' },
                    { value: 'name' as const, label: 'Por Nombre', desc: 'Nombre + Apellido' },
                  ]).map(opt => {
                    // Check if the relevant field is mapped
                    const isMapped = opt.value === 'nif'
                      ? mappings.some(m => m.targetField === 'vat_number')
                      : opt.value === 'email'
                      ? mappings.some(m => m.targetField === 'email')
                      : true

                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setImportConfig(prev => ({ ...prev, duplicateDetection: opt.value }))
                          setDuplicateCount(null)
                        }}
                        disabled={!isMapped}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          importConfig.duplicateDetection === opt.value
                            ? 'border-blue-500 bg-blue-500/10'
                            : !isMapped
                            ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</div>
                        {!isMapped && (
                          <div className="text-xs text-red-400 mt-1">Campo no mapeado</div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Comprobar duplicados */}
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg dark:border-gray-700 dark:text-gray-300"
                    onClick={handleCheckDuplicates}
                    disabled={isCheckingDuplicates}
                  >
                    {isCheckingDuplicates ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Comprobando...</>
                    ) : (
                      'Comprobar duplicados'
                    )}
                  </Button>
                  {duplicateCount !== null && (
                    <span className={`text-sm ${duplicateCount > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {duplicateCount === 0 ? 'No se encontraron duplicados' : `${duplicateCount} posibles duplicados encontrados`}
                    </span>
                  )}
                </div>
              </div>

              {/* Estrategia de duplicados */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  ¿Qué hacer con los duplicados?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { value: 'skip' as const, label: 'Saltar duplicados', desc: 'No modificar los que ya existen', color: 'yellow' },
                    { value: 'update' as const, label: 'Actualizar datos', desc: 'Sobreescribir con los nuevos datos', color: 'blue' },
                    { value: 'import_anyway' as const, label: 'Importar igualmente', desc: 'Crear nuevos registros siempre', color: 'red' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setImportConfig(prev => ({ ...prev, duplicateStrategy: opt.value }))}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        importConfig.duplicateStrategy === opt.value
                          ? `border-${opt.color}-500 bg-${opt.color}-500/10`
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo por defecto (solo empresas) */}
              {entityType === 'empresas' && !mappings.some(m => m.targetField === 'account_type') && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Tipo por defecto
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    No has mapeado la columna &quot;Tipo&quot;. ¿Qué tipo asignar a todos los registros?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'customer' as const, label: 'Cliente' },
                      { value: 'prospect' as const, label: 'Potencial' },
                      { value: 'lead' as const, label: 'Lead' },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setImportConfig(prev => ({ ...prev, defaultAccountType: opt.value }))}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          importConfig.defaultAccountType === opt.value
                            ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-sm font-medium">{opt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleGoToPreview}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Continuar a Vista Previa
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={() => setStep('mapping')} className="rounded-xl dark:border-gray-700 dark:text-gray-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ==========================================
          PASO 5: VISTA PREVIA Y VALIDACIÓN
          ========================================== */}
      {step === 'preview' && entityType && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{rawData.length}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total filas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{rawData.length - summary.rowsWithErrors}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Válidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.rowsWithErrors}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Con errores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Info className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalWarnings}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Advertencias</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Config summary */}
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300 flex-wrap">
              <span>
                <strong>Duplicados:</strong>{' '}
                {importConfig.duplicateStrategy === 'skip' ? 'Saltar' :
                 importConfig.duplicateStrategy === 'update' ? 'Actualizar' : 'Importar igualmente'}
                {' '}(por {importConfig.duplicateDetection === 'nif' ? 'NIF/CIF' :
                importConfig.duplicateDetection === 'email' ? 'Email' : 'Nombre'})
              </span>
              {entityType === 'empresas' && !mappings.some(m => m.targetField === 'account_type') && (
                <span>
                  <strong>Tipo:</strong>{' '}
                  {importConfig.defaultAccountType === 'customer' ? 'Cliente' :
                   importConfig.defaultAccountType === 'prospect' ? 'Potencial' : 'Lead'}
                </span>
              )}
              {duplicateCount !== null && duplicateCount > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-300 rounded-full">
                  {duplicateCount} duplicados
                </Badge>
              )}
            </div>
          </div>

          {/* Errores globales */}
          {summary.globalErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-300 font-medium mb-2">Errores de configuración:</p>
              {summary.globalErrors.map((error, i) => (
                <p key={i} className="text-sm text-red-300/80 ml-4">- {error.message}</p>
              ))}
            </div>
          )}

          {/* Errores por fila */}
          {summary.totalErrors > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-base">Resumen de Errores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {validationErrors.filter(e => e.row >= 0).slice(0, 20).map((error, i) => (
                    <div key={i} className={`text-xs px-3 py-1.5 rounded ${
                      error.severity === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-yellow-500/10 text-yellow-300'
                    }`}>
                      Fila {error.row + 1} &rarr; {error.message}
                    </div>
                  ))}
                  {validationErrors.filter(e => e.row >= 0).length > 20 && (
                    <p className="text-xs text-gray-500 px-3">
                      ...y {validationErrors.filter(e => e.row >= 0).length - 20} más
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabla de preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Vista Previa de Datos Mapeados</CardTitle>
              <CardDescription className="text-gray-500 dark:text-gray-400">
                Mostrando las primeras {Math.min(rawData.length, 10)} filas con los campos mapeados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-10">#</th>
                      {mappings.filter(m => m.targetField).map(mapping => {
                        const field = fields.find(f => f.key === mapping.targetField)
                        return (
                          <th key={mapping.sourceColumn} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {mapping.targetField === '__custom__' ? mapping.sourceColumn : (field?.label || mapping.targetField)}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {rawData.slice(0, 10).map((row, rowIdx) => {
                      const rowErrors = validationErrors.filter(e => e.row === rowIdx)
                      const hasError = rowErrors.some(e => e.severity === 'error')
                      const hasWarning = rowErrors.some(e => e.severity === 'warning')
                      return (
                        <tr key={rowIdx} className={`${
                          hasError ? 'bg-red-500/5 hover:bg-red-500/10' :
                          hasWarning ? 'bg-yellow-500/5 hover:bg-yellow-500/10' :
                          'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                        }`}>
                          <td className="px-3 py-2 text-xs text-gray-500">{rowIdx + 1}</td>
                          {mappings.filter(m => m.targetField).map(mapping => {
                            const cellError = rowErrors.find(e => e.column === mapping.sourceColumn)
                            return (
                              <td key={mapping.sourceColumn} className="px-3 py-2 relative group">
                                <span className={`text-xs ${
                                  cellError?.severity === 'error' ? 'text-red-300' :
                                  cellError?.severity === 'warning' ? 'text-yellow-300' :
                                  'text-gray-700 dark:text-gray-300'
                                } max-w-[150px] truncate block`}>
                                  {row[mapping.sourceColumn] || '—'}
                                </span>
                                {cellError && (
                                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-20">
                                    <div className={`text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap ${
                                      cellError.severity === 'error' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'
                                    }`}>
                                      {cellError.message}
                                    </div>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {rawData.length > 10 && (
                  <div className="mt-3 text-center text-xs text-gray-500">
                    Mostrando 10 de {rawData.length} filas
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleImport}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={summary.hasBlockingErrors || rawData.length - summary.rowsWithErrors === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar e importar {rawData.length - summary.rowsWithErrors} registros
                </Button>
                <Button variant="outline" onClick={() => setStep('config')} className="rounded-xl dark:border-gray-700 dark:text-gray-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ajustar Configuración
                </Button>
              </div>

              {summary.rowsWithErrors > 0 && !summary.hasBlockingErrors && (
                <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-300">
                    Las {summary.rowsWithErrors} filas con errores se omitirán al importar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* ==========================================
          PASO 6: RESULTADO
          ========================================== */}
      {step === 'complete' && entityType && (
        <>
          {/* Barra de progreso durante importación */}
          {importProgress.isRunning && (
            <Card>
              <CardContent className="p-8">
                <div className="text-center mb-4">
                  <Loader2 className="h-10 w-10 text-blue-500 mx-auto animate-spin mb-3" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Importando datos...</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Procesando {importProgress.current} de {importProgress.total} registros
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-400">{importProgress.inserted}</div>
                    <div className="text-xs text-gray-500">Insertados</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-400">{importProgress.updated}</div>
                    <div className="text-xs text-gray-500">Actualizados</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-400">{importProgress.skipped}</div>
                    <div className="text-xs text-gray-500">Saltados</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-400">{importProgress.failed}</div>
                    <div className="text-xs text-gray-500">Fallidos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado final */}
          {importResult && !importProgress.isRunning && (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Importación Completada</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {getEntityTypeLabel(entityType)} procesados desde &quot;{fileName}&quot;
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                    <div className="text-2xl font-bold text-green-400">{importResult.insertedRows}</div>
                    <div className="text-xs text-green-300/70">Insertados</div>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <div className="text-2xl font-bold text-blue-400">{importResult.updatedRows}</div>
                    <div className="text-xs text-blue-300/70">Actualizados</div>
                  </div>
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                    <div className="text-2xl font-bold text-yellow-400">{importResult.skippedRows}</div>
                    <div className="text-xs text-yellow-300/70">Omitidos</div>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="text-2xl font-bold text-red-400">{importResult.failedRows}</div>
                    <div className="text-xs text-red-300/70">Fallidos</div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center flex-wrap">
                  {entityType === 'contactos' && (
                    <Button onClick={() => window.location.href = '/contacts'} className="rounded-xl">
                      Ver Contactos
                    </Button>
                  )}
                  {entityType === 'empresas' && (
                    <Button onClick={() => window.location.href = '/companies'} className="rounded-xl">
                      Ver Empresas
                    </Button>
                  )}
                  {(entityType === 'facturas_pagadas' || entityType === 'facturas_pendientes') && (
                    <Button onClick={() => window.location.href = '/dashboard'} className="rounded-xl">
                      Ver Dashboard
                    </Button>
                  )}
                  {importResult.failedRowsData.length > 0 && (
                    <Button variant="outline" onClick={handleDownloadErrors} className="rounded-xl dark:border-gray-700 dark:text-gray-300">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar errores ({importResult.failedRowsData.length})
                    </Button>
                  )}
                  <Button onClick={resetWizard} variant="outline" className="rounded-xl dark:border-gray-700 dark:text-gray-300">
                    Importar Más
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
