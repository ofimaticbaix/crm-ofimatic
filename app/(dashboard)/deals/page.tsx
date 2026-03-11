'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, TrendingUp, AlertCircle, Clock, X } from 'lucide-react'
import { stages, getDealsByStage, getDealsWithRelations, mockCompanies } from '@/lib/mock-data'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

export default function DealsPage() {
  const [showNewDealModal, setShowNewDealModal] = useState(false)
  const [newDeal, setNewDeal] = useState({
    name: '',
    value: '',
    companyId: '',
    stage: 'prospecting',
    expectedCloseDate: ''
  })

  const allDeals = getDealsWithRelations()

  const handleCreateDeal = () => {
    alert(`Oportunidad creada: ${newDeal.name} - ${formatCurrency(Number(newDeal.value))}`)
    setShowNewDealModal(false)
    setNewDeal({
      name: '',
      value: '',
      companyId: '',
      stage: 'prospecting',
      expectedCloseDate: ''
    })
  }

  const getDealRiskStatus = (deal: any) => {
    const daysSinceActivity = Math.floor(
      (new Date().getTime() - new Date(deal.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSinceActivity >= 7) return 'at-risk'
    if (daysSinceActivity >= 4) return 'warning'
    return 'healthy'
  }

  const getRiskIcon = (status: string) => {
    switch (status) {
      case 'at-risk':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const totalValue = allDeals.reduce((sum, deal) => sum + deal.value, 0)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Embudo de Ventas</h1>
          <p className="text-xs md:text-sm text-white mt-1">
            {allDeals.length} oportunidades • {formatCurrency(totalValue)}
          </p>
        </div>
        <Button
          onClick={() => setShowNewDealModal(true)}
          className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nueva Oportunidad
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.id)
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)

          return (
            <Card key={stage.id} className="hover:shadow-xl transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 uppercase truncate">
                  {stage.name}
                </div>
                <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-1 md:mt-2">
                  {stageDeals.length}
                </div>
                <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatCurrency(stageValue)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
        {stages.map((stage) => {
          const stageDeals = allDeals.filter(d => d.stage === stage.id)
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)

          return (
            <div key={stage.id} className="flex-shrink-0 w-64 md:w-80 snap-start">
              {/* Column Header */}
              <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-t-2xl p-4 border-x border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {stageDeals.length} oportunidades • {formatCurrency(stageValue)}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs rounded-full dark:border-gray-700 dark:text-gray-300">
                    {stage.probability}%
                  </Badge>
                </div>
              </div>

              {/* Column Content */}
              <div className="space-y-3 p-4 bg-gray-50/50 dark:bg-gray-800/50 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-2xl min-h-[500px]">
                {stageDeals.map((deal) => {
                  const riskStatus = getDealRiskStatus(deal)
                  const riskIcon = getRiskIcon(riskStatus)

                  return (
                    <Card
                      key={deal.id}
                      className="hover:shadow-xl transition-all cursor-pointer"
                    >
                      <CardContent className="p-4">
                        {/* Deal Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                            {deal.name}
                          </h4>
                          {riskIcon && (
                            <div className="flex-shrink-0">
                              {riskIcon}
                            </div>
                          )}
                        </div>

                        {/* Company */}
                        {deal.company && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            {deal.company.name}
                          </p>
                        )}

                        {/* Value */}
                        <div className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                          {formatCurrency(deal.value)}
                        </div>

                        {/* Contacts */}
                        {deal.contacts && deal.contacts.length > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex -space-x-2">
                              {deal.contacts.slice(0, 3).map((contact: any) => (
                                <div
                                  key={contact.id}
                                  className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white dark:border-gray-800"
                                  title={`${contact.firstName} ${contact.lastName}`}
                                >
                                  {contact.firstName?.[0]}{contact.lastName?.[0]}
                                </div>
                              ))}
                            </div>
                            {deal.contacts.length > 3 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{deal.contacts.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Cierra: {new Date(deal.expectedCloseDate).toLocaleDateString('es-ES')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatRelativeTime(deal.lastActivity)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {stageDeals.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-sm">
                    Sin oportunidades en esta etapa
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Nueva Oportunidad */}
      {showNewDealModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Nueva Oportunidad</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNewDealModal(false)}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white block mb-2">
                    Nombre de la Oportunidad *
                  </label>
                  <Input
                    value={newDeal.name}
                    onChange={(e) => setNewDeal({...newDeal, name: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="Ej: Enterprise CRM - Acme Corp"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Valor (€) *
                  </label>
                  <Input
                    type="number"
                    value={newDeal.value}
                    onChange={(e) => setNewDeal({...newDeal, value: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                    placeholder="45000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Empresa *
                  </label>
                  <select
                    value={newDeal.companyId}
                    onChange={(e) => setNewDeal({...newDeal, companyId: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white"
                  >
                    <option value="">Seleccionar empresa</option>
                    {mockCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Etapa *
                  </label>
                  <select
                    value={newDeal.stage}
                    onChange={(e) => setNewDeal({...newDeal, stage: e.target.value})}
                    className="w-full rounded-xl px-3 py-2 bg-gray-800/50 border border-gray-700 text-white"
                  >
                    {stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white block mb-2">
                    Fecha de Cierre Esperada *
                  </label>
                  <Input
                    type="date"
                    value={newDeal.expectedCloseDate}
                    onChange={(e) => setNewDeal({...newDeal, expectedCloseDate: e.target.value})}
                    className="rounded-xl dark:bg-gray-800/50 dark:border-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleCreateDeal}
                  className="flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  disabled={!newDeal.name || !newDeal.value || !newDeal.companyId || !newDeal.expectedCloseDate}
                >
                  Crear Oportunidad
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewDealModal(false)}
                  className="rounded-xl dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800/50"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
