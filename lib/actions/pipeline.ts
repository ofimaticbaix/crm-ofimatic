'use server'

import { createClient } from '@/lib/supabase/server'

// Obtener el pipeline por defecto del workspace con sus stages
export async function getPipeline(workspaceId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pipelines')
    .select('*, stages(id, name, description, probability, position, is_closed_won, is_closed_lost)')
    .eq('workspace_id', workspaceId)
    .eq('is_default', true)
    .single()

  if (error) return { data: null, error: error.message }

  // Ordenar stages por posición
  if (data?.stages) {
    data.stages.sort((a: any, b: any) => a.position - b.position)
  }

  return { data, error: null }
}

// Obtener stages de un pipeline específico
export async function getStages(pipelineId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('stages')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}
