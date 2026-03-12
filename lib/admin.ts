// Admin configuration
export const ADMIN_EMAILS = ['alex@ofimaticbaix.com', 'a.saumellortuno98@gmail.com']

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
