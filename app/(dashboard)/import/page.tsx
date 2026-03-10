'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Upload, FileSpreadsheet, Building2, Users, CheckCircle, AlertCircle,
  ChevronRight, ArrowLeft, Save, FolderOpen, Trash2, Database,
  FileText, Receipt, ReceiptText, X, Info
} from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import type {
  ImportStep, ImportEntityType, ColumnMapping, ValidationError, ImportResult
} from '@/lib/import-types'
import { getFieldsForEntityType, getEntityTypeLabel } from '@/lib/import-fields'
import { autoMapColumns, getUnmappedRequiredFields } from '@/lib/import-matcher'
import { validateImportData, getValidationSummary } from '@/lib/import-validator'
import {
  getProfiles, saveProfile, deleteProfile, findMatchingProfiles,
  applyProfile, incrementProfileUsage
} from '@/lib/import-profiles'
import type { ImportProfile } from '@/lib/import-types'

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
            'bg-gray-800 text-gray-500'
          }`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
              idx < currentIdx ? 'bg-green-500 text-white' :
              idx === currentIdx ? 'bg-blue-500 text-white' :
              'bg-gray-700 text-gray-400'
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

    // Buscar perfiles que coincidan
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
        // Convertir todos los valores a string
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
            // Múltiples tablas: dejar elegir
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
    // Auto-mapeo
    const autoMappings = autoMapColumns(sourceColumns, rawData, type)
    setMappings(autoMappings)
    setStep('mapping')

    // Buscar perfiles coincidentes para este tipo
    const profiles = findMatchingProfiles(sourceColumns, type)
    setMatchingProfiles(profiles)
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
  // Validación y preview
  // ==========================================

  const handleGoToPreview = useCallback(() => {
    if (!entityType) return
    const errors = validateImportData(rawData, mappings, entityType)
    setValidationErrors(errors)
    setStep('preview')
  }, [rawData, mappings, entityType])

  // ==========================================
  // Importación
  // ==========================================

  const handleImport = useCallback(() => {
    const activeMappings = mappings.filter(m => m.targetField && m.targetField !== '__custom__')
    const customMappings = mappings.filter(m => m.targetField === '__custom__')
    const errorRows = new Set(validationErrors.filter(e => e.row >= 0 && e.severity === 'error').map(e => e.row))

    let imported = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < rawData.length; i++) {
      if (errorRows.has(i)) {
        failed++
        continue
      }

      const row = rawData[i]
      const mappedRow: Record<string, string> = {}

      for (const mapping of activeMappings) {
        if (mapping.targetField) {
          mappedRow[mapping.targetField] = row[mapping.sourceColumn] || ''
        }
      }

      // Campos personalizados
      if (customMappings.length > 0) {
        const customFields: Record<string, string> = {}
        for (const mapping of customMappings) {
          customFields[mapping.sourceColumn] = row[mapping.sourceColumn] || ''
        }
        mappedRow['custom_fields'] = JSON.stringify(customFields)
      }

      // Verificar que al menos un campo tiene valor
      const hasData = Object.values(mappedRow).some(v => v && v.trim() && v !== '{}')
      if (hasData) {
        imported++
      } else {
        skipped++
      }
    }

    setImportResult({
      totalRows: rawData.length,
      importedRows: imported,
      skippedRows: skipped,
      failedRows: failed,
      errors: validationErrors.filter(e => e.severity === 'error'),
    })
    setStep('complete')
  }, [mappings, rawData, validationErrors])

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
        <p className="text-xs md:text-sm text-gray-400 mt-1">
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
            <CardTitle className="text-white">Subir Archivo</CardTitle>
            <CardDescription className="text-gray-400">
              CSV, Excel (.xlsx, .xls) o Access (.mdb, .accdb)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accessTables.length > 0 ? (
              // Selector de tabla Access
              <div className="space-y-4">
                <p className="text-sm text-gray-300">
                  El archivo Access contiene {accessTables.length} tablas. Selecciona cuál importar:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessTables.map(table => (
                    <button
                      key={table}
                      onClick={() => handleAccessTableSelect(table)}
                      disabled={isProcessing}
                      className="flex items-center gap-3 p-4 rounded-xl border border-gray-700 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-left"
                    >
                      <Database className="h-5 w-5 text-blue-400 flex-shrink-0" />
                      <span className="text-white text-sm font-medium">{table}</span>
                    </button>
                  ))}
                </div>
                <Button variant="outline" onClick={resetWizard} className="rounded-xl dark:border-gray-700 dark:text-gray-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Elegir otro archivo
                </Button>
              </div>
            ) : (
              // Zona de drag & drop
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
                  isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-blue-500/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`h-12 w-12 mb-4 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
                <p className="text-white mb-2 text-center">
                  {isProcessing ? 'Procesando archivo...' : 'Arrastra tu archivo aquí o haz clic para seleccionar'}
                </p>
                <p className="text-sm text-gray-400 mb-4">CSV, XLSX, XLS, MDB o ACCDB</p>
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
              <CardTitle className="text-white">
                ¿Qué tipo de datos contiene "{fileName}"?
              </CardTitle>
              <CardDescription className="text-gray-400">
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
                    className={`flex items-start gap-4 p-5 rounded-xl border border-gray-700 hover:border-${color}-500 hover:bg-${color}-500/10 transition-all text-left group`}
                  >
                    <div className={`p-3 rounded-lg bg-${color}-500/20 group-hover:bg-${color}-500/30 transition-colors`}>
                      <Icon className={`h-6 w-6 text-${color}-400`} />
                    </div>
                    <div>
                      <div className="text-white font-semibold">{getEntityTypeLabel(type)}</div>
                      <div className="text-sm text-gray-400 mt-1">{desc}</div>
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
                      <span className="text-sm text-gray-300">
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
                  <CardTitle className="text-white">Mapeo de Columnas</CardTitle>
                  <CardDescription className="text-gray-400">
                    Asigna cada columna del archivo al campo correspondiente del CRM
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {/* Cargar perfil */}
                  {savedProfiles.filter(p => p.entityType === entityType).length > 0 && (
                    <div className="relative group">
                      <Button variant="outline" size="sm" className="rounded-lg dark:border-gray-700 dark:text-gray-300">
                        <FolderOpen className="h-4 w-4 mr-1" />
                        Cargar Perfil
                      </Button>
                      <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 min-w-[240px] hidden group-hover:block">
                        {savedProfiles.filter(p => p.entityType === entityType).map(profile => (
                          <div key={profile.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-700/50">
                            <button
                              onClick={() => handleApplyProfile(profile)}
                              className="text-sm text-gray-300 hover:text-white flex-1 text-left"
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
                  {/* Guardar perfil */}
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
              {/* Guardar perfil inline */}
              {showSaveProfile && (
                <div className="flex gap-2 mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Nombre del perfil (ej: Aniwin Contactos)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
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

              {/* Campos obligatorios sin mapear */}
              {unmappedRequired.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm text-red-300 font-medium">
                    Campos obligatorios sin mapear: {unmappedRequired.map(f => f.label).join(', ')}
                  </p>
                </div>
              )}

              {/* Tabla de mapeo */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Columna Origen</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Valores Ejemplo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Campo CRM</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 w-24">Confianza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {mappings.map((mapping) => {
                      const isRequired = fields.find(f => f.key === mapping.targetField)?.required
                      const isMapped = mapping.targetField !== null
                      return (
                        <tr key={mapping.sourceColumn} className="hover:bg-gray-800/30">
                          <td className="px-4 py-3">
                            <span className="text-sm text-white font-medium">{mapping.sourceColumn}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {mapping.sampleValues.slice(0, 3).map((val, i) => (
                                <span key={i} className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded max-w-[120px] truncate">
                                  {val}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={mapping.targetField || ''}
                              onChange={(e) => handleMappingChange(mapping.sourceColumn, e.target.value || null)}
                              className={`text-sm rounded-lg bg-gray-800 border px-3 py-1.5 w-full max-w-[220px] focus:outline-none focus:border-blue-500 ${
                                !isMapped ? 'border-gray-600 text-gray-400' :
                                isRequired ? 'border-green-500/50 text-green-300' :
                                'border-gray-700 text-white'
                              }`}
                            >
                              <option value="">— Omitir —</option>
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
                  onClick={handleGoToPreview}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={unmappedRequired.length > 0}
                >
                  Continuar a Vista Previa
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
          PASO 4: VISTA PREVIA Y VALIDACIÓN
          ========================================== */}
      {step === 'preview' && entityType && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold text-white">{rawData.length}</div>
                    <p className="text-sm text-gray-400">Total filas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold text-white">{summary.rowsWithErrors}</div>
                    <p className="text-sm text-gray-400">Filas con errores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Info className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-white">{summary.totalWarnings}</div>
                    <p className="text-sm text-gray-400">Advertencias</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Errores globales */}
          {summary.globalErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-300 font-medium mb-2">Errores de configuración:</p>
              {summary.globalErrors.map((error, i) => (
                <p key={i} className="text-sm text-red-300/80 ml-4">• {error.message}</p>
              ))}
            </div>
          )}

          {/* Errores por fila (resumen) */}
          {summary.totalErrors > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-white text-base">Resumen de Errores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {validationErrors.filter(e => e.row >= 0).slice(0, 20).map((error, i) => (
                    <div key={i} className={`text-xs px-3 py-1.5 rounded ${
                      error.severity === 'error' ? 'bg-red-500/10 text-red-300' : 'bg-yellow-500/10 text-yellow-300'
                    }`}>
                      Fila {error.row + 1} → {error.message}
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

          {/* Tabla de preview con datos mapeados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Vista Previa de Datos Mapeados</CardTitle>
              <CardDescription className="text-gray-400">
                Mostrando las primeras {Math.min(rawData.length, 15)} filas con los campos mapeados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 w-10">#</th>
                      {mappings.filter(m => m.targetField).map(mapping => {
                        const field = fields.find(f => f.key === mapping.targetField)
                        return (
                          <th key={mapping.sourceColumn} className="px-3 py-2 text-left text-xs font-semibold text-gray-300">
                            {mapping.targetField === '__custom__' ? mapping.sourceColumn : (field?.label || mapping.targetField)}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {rawData.slice(0, 15).map((row, rowIdx) => {
                      const rowErrors = validationErrors.filter(e => e.row === rowIdx)
                      const hasError = rowErrors.some(e => e.severity === 'error')
                      const hasWarning = rowErrors.some(e => e.severity === 'warning')
                      return (
                        <tr key={rowIdx} className={`${
                          hasError ? 'bg-red-500/5 hover:bg-red-500/10' :
                          hasWarning ? 'bg-yellow-500/5 hover:bg-yellow-500/10' :
                          'hover:bg-gray-800/30'
                        }`}>
                          <td className="px-3 py-2 text-xs text-gray-500">{rowIdx + 1}</td>
                          {mappings.filter(m => m.targetField).map(mapping => {
                            const cellError = rowErrors.find(e => e.column === mapping.sourceColumn)
                            return (
                              <td key={mapping.sourceColumn} className="px-3 py-2 relative group">
                                <span className={`text-xs ${
                                  cellError?.severity === 'error' ? 'text-red-300' :
                                  cellError?.severity === 'warning' ? 'text-yellow-300' :
                                  'text-gray-300'
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
                {rawData.length > 15 && (
                  <div className="mt-3 text-center text-xs text-gray-500">
                    Mostrando 15 de {rawData.length} filas
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleImport}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={summary.hasBlockingErrors}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Importar {rawData.length - summary.rowsWithErrors} registros
                </Button>
                <Button variant="outline" onClick={() => setStep('mapping')} className="rounded-xl dark:border-gray-700 dark:text-gray-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Ajustar Mapeo
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
          PASO 5: RESULTADO
          ========================================== */}
      {step === 'complete' && importResult && entityType && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Importación Completada</h2>
            <p className="text-gray-400 mb-6">
              {getEntityTypeLabel(entityType)} procesados desde "{fileName}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="text-2xl font-bold text-green-400">{importResult.importedRows}</div>
                <div className="text-xs text-green-300/70">Importados</div>
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
              {(entityType === 'contactos') && (
                <Button onClick={() => window.location.href = '/contacts'} className="rounded-xl">
                  Ver Contactos
                </Button>
              )}
              {(entityType === 'empresas') && (
                <Button onClick={() => window.location.href = '/companies'} className="rounded-xl">
                  Ver Empresas
                </Button>
              )}
              {(entityType === 'facturas_pagadas' || entityType === 'facturas_pendientes') && (
                <Button onClick={() => window.location.href = '/dashboard'} className="rounded-xl">
                  Ver Dashboard
                </Button>
              )}
              <Button onClick={resetWizard} variant="outline" className="rounded-xl dark:border-gray-700 dark:text-gray-300">
                Importar Más
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              (Demo: los datos se procesaron localmente. Conecta Supabase para persistencia real.)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
