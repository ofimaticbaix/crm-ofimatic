'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, Building2, Users, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface ImportRow {
  id: string
  data: Record<string, string>
  type: 'empresa' | 'contacto' | 'desconocido'
  confidence: number
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ImportRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload')

  // Función de clasificación automática
  const classifyRow = (row: Record<string, string>): { type: 'empresa' | 'contacto' | 'desconocido', confidence: number } => {
    let empresaScore = 0
    let contactoScore = 0

    // Convertir claves a minúsculas para búsqueda case-insensitive
    const lowerKeys = Object.keys(row).map(k => k.toLowerCase())
    const lowerValues = Object.values(row).map(v => v?.toLowerCase() || '')
    const allValues = Object.values(row).join(' ').toLowerCase()

    // Indicadores de EMPRESA
    if (lowerKeys.some(k => k.includes('razonsocial') || k.includes('razon social') || k.includes('nombreempresa'))) empresaScore += 30
    if (lowerKeys.some(k => k.includes('cif'))) empresaScore += 25
    if (allValues.match(/\b(s\.l\.|s\.a\.|s\.l\.u\.|ltd|corp|inc|gmbh)\b/i)) empresaScore += 20
    if (lowerKeys.some(k => k.includes('sector') || k.includes('industria') || k.includes('industry'))) empresaScore += 15
    if (lowerKeys.some(k => k.includes('empleados') || k.includes('tamaño') || k.includes('size'))) empresaScore += 15

    // Indicadores de CONTACTO/PERSONA
    if (lowerKeys.some(k => k.includes('apellido') || k.includes('lastname') || k.includes('surname'))) contactoScore += 30
    if (lowerKeys.some(k => k.includes('nombre') && !k.includes('empresa') && !k.includes('comercial'))) contactoScore += 20
    if (lowerKeys.some(k => k.includes('dni') || k.includes('nie'))) contactoScore += 25
    if (lowerKeys.some(k => k.includes('cargo') || k.includes('puesto') || k.includes('position') || k.includes('jobtitle'))) contactoScore += 20
    if (lowerValues.some(v => v.match(/^[a-z]{8}[a-z]$/i))) contactoScore += 15 // Patrón DNI

    // Determinar tipo basado en puntuaciones
    if (empresaScore > contactoScore && empresaScore >= 30) {
      return { type: 'empresa', confidence: Math.min(empresaScore / 100, 0.95) }
    } else if (contactoScore > empresaScore && contactoScore >= 30) {
      return { type: 'contacto', confidence: Math.min(contactoScore / 100, 0.95) }
    } else {
      return { type: 'desconocido', confidence: 0.5 }
    }
  }

  // Manejar carga de archivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setIsProcessing(true)

    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase()

    if (fileExtension === 'csv') {
      // Parsear CSV
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as Record<string, string>[]
          const classified = rows.map((row, index) => {
            const { type, confidence } = classifyRow(row)
            return {
              id: `row-${index}`,
              data: row,
              type,
              confidence
            }
          })
          setParsedData(classified)
          setStep('preview')
          setIsProcessing(false)
        },
        error: (error) => {
          console.error('Error parsing CSV:', error)
          alert('Error al parsear el archivo CSV')
          setIsProcessing(false)
        }
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Parsear Excel
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet) as Record<string, string>[]

        const classified = rows.map((row, index) => {
          const { type, confidence } = classifyRow(row)
          return {
            id: `row-${index}`,
            data: row,
            type,
            confidence
          }
        })
        setParsedData(classified)
        setStep('preview')
        setIsProcessing(false)
      }
      reader.readAsArrayBuffer(uploadedFile)
    } else {
      alert('Formato no soportado. Por favor, sube un archivo CSV o Excel (.xlsx, .xls)')
      setIsProcessing(false)
    }
  }

  // Cambiar tipo de fila manualmente
  const handleTypeChange = (rowId: string, newType: 'empresa' | 'contacto' | 'desconocido') => {
    setParsedData(prev => prev.map(row =>
      row.id === rowId ? { ...row, type: newType, confidence: 1.0 } : row
    ))
  }

  // Importar datos
  const handleImport = () => {
    const empresas = parsedData.filter(row => row.type === 'empresa')
    const contactos = parsedData.filter(row => row.type === 'contacto')

    console.log('Empresas a importar:', empresas)
    console.log('Contactos a importar:', contactos)

    // Aquí irá la lógica real de importación cuando conectes el backend
    alert(`✓ Importación lista:\n${empresas.length} empresas\n${contactos.length} contactos\n\n(Por ahora es una demo - conecta tu backend para guardar los datos)`)
    setStep('complete')
  }

  const empresasCount = parsedData.filter(r => r.type === 'empresa').length
  const contactosCount = parsedData.filter(r => r.type === 'contacto').length
  const desconocidosCount = parsedData.filter(r => r.type === 'desconocido').length

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Importar Datos</h1>
        <p className="text-xs md:text-sm text-white mt-1">
          Importa contactos y empresas desde Access, CSV o Excel
        </p>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Subir Archivo</CardTitle>
            <CardDescription className="text-gray-400">
              Soportamos archivos CSV y Excel (.xlsx, .xls)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-2xl p-12 hover:border-blue-500 transition-colors">
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-white mb-2">Arrastra tu archivo aquí o haz clic para seleccionar</p>
              <p className="text-sm text-gray-400 mb-4">CSV, XLSX o XLS (máx. 10MB)</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label htmlFor="file-upload">
                <Button asChild className="rounded-xl">
                  <span>{isProcessing ? 'Procesando...' : 'Seleccionar Archivo'}</span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview & Classification */}
      {step === 'preview' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold text-white">{empresasCount}</div>
                    <p className="text-sm text-gray-400">Empresas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold text-white">{contactosCount}</div>
                    <p className="text-sm text-gray-400">Contactos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold text-white">{desconocidosCount}</div>
                    <p className="text-sm text-gray-400">Sin clasificar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Vista Previa y Clasificación</CardTitle>
              <CardDescription className="text-gray-400">
                Revisa la clasificación automática y ajusta si es necesario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Datos</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Confianza</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {parsedData.slice(0, 10).map((row) => (
                      <tr key={row.id} className="hover:bg-gray-800/30">
                        <td className="px-4 py-3">
                          <Badge
                            className={`rounded-xl ${
                              row.type === 'empresa' ? 'bg-blue-500/20 text-blue-300' :
                              row.type === 'contacto' ? 'bg-purple-500/20 text-purple-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {row.type === 'empresa' ? '🏢 Empresa' :
                             row.type === 'contacto' ? '👤 Contacto' : '❓ Sin clasificar'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white max-w-md truncate">
                            {Object.entries(row.data).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="mr-4">
                                <span className="text-gray-400">{key}:</span> {value}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-300">
                            {Math.round(row.confidence * 100)}%
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={row.type}
                            onChange={(e) => handleTypeChange(row.id, e.target.value as any)}
                            className="text-sm rounded-lg bg-gray-800 border border-gray-700 text-white px-2 py-1"
                          >
                            <option value="empresa">Empresa</option>
                            <option value="contacto">Contacto</option>
                            <option value="desconocido">Sin clasificar</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 10 && (
                  <div className="mt-4 text-center text-sm text-gray-400">
                    Mostrando 10 de {parsedData.length} filas
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleImport}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={desconocidosCount > 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar e Importar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('upload')
                    setParsedData([])
                    setFile(null)
                  }}
                  className="rounded-xl dark:border-gray-700 dark:text-gray-300"
                >
                  Cancelar
                </Button>
              </div>

              {desconocidosCount > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-300">
                    ⚠️ Hay {desconocidosCount} filas sin clasificar. Por favor, clasifícalas manualmente antes de importar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 3: Complete */}
      {step === 'complete' && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">¡Importación Completada!</h2>
            <p className="text-gray-400 mb-6">
              Se han procesado {empresasCount} empresas y {contactosCount} contactos
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.href = '/companies'}
                className="rounded-xl"
              >
                Ver Empresas
              </Button>
              <Button
                onClick={() => window.location.href = '/contacts'}
                variant="outline"
                className="rounded-xl dark:border-gray-700 dark:text-gray-300"
              >
                Ver Contactos
              </Button>
              <Button
                onClick={() => {
                  setStep('upload')
                  setParsedData([])
                  setFile(null)
                }}
                variant="ghost"
                className="rounded-xl"
              >
                Importar Más
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
