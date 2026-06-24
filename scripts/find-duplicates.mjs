import { createClient } from '@supabase/supabase-js'

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const { data: users } = await supa.auth.admin.listUsers()
const ferran = users.users.find(u => u.email === 'fpons@metalher.es')
const { data: mem } = await supa.from('memberships').select('workspace_id').eq('user_id', ferran.id).limit(1).single()
const WS = mem.workspace_id

let all = []
let from = 0
while (true) {
  const { data } = await supa.from('companies').select('id, name, vat_number, account_type, created_at').eq('workspace_id', WS).is('deleted_at', null).range(from, from + 999)
  all = all.concat(data)
  if (data.length < 1000) break
  from += 1000
}
console.log('Total activas:', all.length)

function deep(s) {
  return (s || '').toLowerCase()
    .replace(/\bs\.?\s*l\.?\s*u?\.?\b/g, '')
    .replace(/\bs\.?\s*a\.?\b/g, '')
    .replace(/\bs\.?\s*c\.?\s*p?\.?\b/g, '')
    .replace(/\bs\.?\s*c\.?\s*c\.?\s*l?\.?\b/g, '')
    .replace(/\bsll\.?\b/g, '')
    .replace(/[().,;:/\\&·-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const groups = {}
all.forEach(c => {
  const k = deep(c.name)
  if (!k || k.length < 4) return
  if (!groups[k]) groups[k] = []
  groups[k].push(c)
})

const dups = Object.entries(groups).filter(([_, v]) => v.length > 1)
console.log(`\nGrupos duplicados (normalizado profundo): ${dups.length}`)

let totalExtras = 0
for (const [k, v] of dups) {
  totalExtras += (v.length - 1)
  console.log(`\n→ "${k}"`)
  v.forEach(x => console.log(`   · [${x.account_type.padEnd(8)}] ${x.name}   ${x.vat_number || '(sin VAT)'}`))
}
console.log(`\nTotal registros duplicados: ${totalExtras} (para eliminar)`)
