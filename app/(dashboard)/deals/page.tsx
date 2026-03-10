'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import { stages, getDealsByStage, getDealsWithRelations } from '@/lib/mock-data'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

export default function DealsPage() {
  const allDeals = getDealsWithRelations()

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pipeline de Ventas</h1>
          <p className="text-white mt-1">
            {allDeals.length} deals • {formatCurrency(totalValue)} valor total
          </p>
        </div>
        <Button className="gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4" />
          Nuevo Deal
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageDeals = getDealsByStage(stage.id)
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)

          return (
            <Card key={stage.id} className="hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase">
                  {stage.name}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stageDeals.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatCurrency(stageValue)}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = allDeals.filter(d => d.stage === stage.id)
          const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)

          return (
            <div key={stage.id} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-t-2xl p-4 border-x border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{stage.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {stageDeals.length} deals • {formatCurrency(stageValue)}
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
                    Sin deals en esta etapa
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* AI Insights for Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Insights del Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-200">
                    {allDeals.filter(d => getDealRiskStatus(d) === 'at-risk').length} deals en riesgo
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Sin actividad en 7+ días. Necesitan follow-up urgente.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    {formatCurrency(
                      allDeals
                        .filter(d => d.stage === 'negotiation' || d.stage === 'proposal')
                        .reduce((sum, d) => sum + d.value, 0)
                    )}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    En etapas finales. Alta probabilidad de cierre.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-200">
                    {allDeals.filter(d => {
                      const closeDate = new Date(d.expectedCloseDate)
                      const today = new Date()
                      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                      return closeDate >= today && closeDate <= nextWeek
                    }).length} deals
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Se espera que cierren esta semana.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
