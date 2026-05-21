const ADMIN_EMAILS: string[] = [
  'ipulepipi60@gmail.com',
]

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
