'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'documents'

async function ensureBucket() {
  // Creates the bucket once (idempotent). Uses service role to bypass RLS.
  try {
    const admin = createAdminClient()
    const { data: buckets } = await admin.storage.listBuckets()
    if (buckets?.some(b => b.name === BUCKET)) return
    await admin.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 20 * 1024 * 1024, // 20 MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/webp',
      ],
    })
  } catch (err) {
    console.error('ensureBucket error:', err)
  }
}

export interface UploadedDocument {
  path: string
  name: string
  size: number
  mime: string
}

// Uploads a presupuesto file attached to a company.
// Returns metadata to attach to the activity record.
export async function uploadPresupuesto(
  workspaceId: string,
  companyId: string,
  file: { name: string; type: string; size: number; base64: string }
): Promise<{ data: UploadedDocument | null; error: string | null }> {
  try {
    if (!workspaceId || !companyId) {
      return { data: null, error: 'Workspace o empresa no especificados.' }
    }
    if (!file?.base64) {
      return { data: null, error: 'Archivo vacío.' }
    }
    if (file.size > 20 * 1024 * 1024) {
      return { data: null, error: 'El archivo supera los 20 MB.' }
    }

    await ensureBucket()
    const supabase = await createClient()

    // Sanitize filename — keep extension, strip special chars
    const dot = file.name.lastIndexOf('.')
    const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : 'bin'
    const base = (dot >= 0 ? file.name.slice(0, dot) : file.name)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9\-_ ]/g, '').trim().replace(/\s+/g, '-').slice(0, 80)
    const safeName = base ? `${base}.${ext}` : `archivo.${ext}`
    const path = `${workspaceId}/presupuestos/${companyId}/${Date.now()}-${safeName}`

    // Decode base64 → binary
    const binary = Buffer.from(file.base64, 'base64')

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, binary, { contentType: file.type || 'application/octet-stream', upsert: false })

    if (upErr) {
      console.error('uploadPresupuesto error:', upErr)
      return { data: null, error: `Error al subir: ${upErr.message}` }
    }

    return {
      data: { path, name: file.name, size: file.size, mime: file.type },
      error: null,
    }
  } catch (err: any) {
    console.error('uploadPresupuesto exception:', err)
    return { data: null, error: err?.message || 'Error desconocido al subir' }
  }
}

// Short-lived signed URL for downloading a presupuesto.
export async function getPresupuestoUrl(path: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60) // 1 hour
    if (error) return { url: null, error: error.message }
    return { url: data?.signedUrl || null, error: null }
  } catch (err: any) {
    return { url: null, error: err?.message || 'Error al generar URL' }
  }
}

// Delete a presupuesto file (used when the activity is deleted).
export async function deletePresupuestoFile(path: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) return { error: error.message }
    return { error: null }
  } catch (err: any) {
    return { error: err?.message || 'Error al eliminar archivo' }
  }
}

// Replace the attached file of a presupuesto activity. Uploads the new one,
// updates the activity metadata, and removes the old file from storage.
export async function replacePresupuestoAttachment(
  activityId: string,
  workspaceId: string,
  companyId: string,
  newFile: { name: string; type: string; size: number; base64: string }
): Promise<{ data: UploadedDocument | null; error: string | null }> {
  try {
    const supabase = await createClient()
    // Read the activity to know the old attachment path
    const { data: activity, error: fetchErr } = await supabase
      .from('activities')
      .select('metadata')
      .eq('id', activityId)
      .single()
    if (fetchErr) return { data: null, error: fetchErr.message }
    const oldPath: string | undefined = activity?.metadata?.attachment?.path

    // Upload new file
    const up = await uploadPresupuesto(workspaceId, companyId, newFile)
    if (up.error || !up.data) return { data: null, error: up.error || 'Error al subir' }

    // Update activity metadata with new attachment
    const { error: updErr } = await supabase
      .from('activities')
      .update({ metadata: { ...(activity?.metadata || {}), attachment: up.data } })
      .eq('id', activityId)
    if (updErr) return { data: null, error: updErr.message }

    // Remove old file from storage (best effort — don't fail if it's gone)
    if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]).catch(() => null)

    return { data: up.data, error: null }
  } catch (err: any) {
    return { data: null, error: err?.message || 'Error al reemplazar archivo' }
  }
}

// Update the "sent at" date of a presupuesto activity.
// Stored in metadata.sent_at and also mirrored to completed_at for calendar consistency.
export async function updatePresupuestoSentDate(
  activityId: string,
  sentDate: string // YYYY-MM-DD
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: activity, error: fetchErr } = await supabase
      .from('activities')
      .select('metadata')
      .eq('id', activityId)
      .single()
    if (fetchErr) return { error: fetchErr.message }
    const iso = `${sentDate}T00:00:00`
    const { error } = await supabase
      .from('activities')
      .update({
        metadata: { ...(activity?.metadata || {}), sent_at: sentDate },
        completed_at: iso,
      })
      .eq('id', activityId)
    if (error) return { error: error.message }
    return { error: null }
  } catch (err: any) {
    return { error: err?.message || 'Error al cambiar la fecha' }
  }
}

// Delete a presupuesto activity and its attachment in one go.
export async function deletePresupuestoActivity(activityId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: activity } = await supabase
      .from('activities')
      .select('metadata')
      .eq('id', activityId)
      .single()
    const path: string | undefined = activity?.metadata?.attachment?.path

    const { error } = await supabase.from('activities').delete().eq('id', activityId)
    if (error) return { error: error.message }

    if (path) await supabase.storage.from(BUCKET).remove([path]).catch(() => null)
    return { error: null }
  } catch (err: any) {
    return { error: err?.message || 'Error al eliminar el presupuesto' }
  }
}
