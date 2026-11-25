import crypto from 'node:crypto'
const COOKIE_NAME = 'gameon_admin_session'
const MAX_AGE = 60 * 60 * 8
function secret() { return process.env.GAMEON_SESSION_SECRET || process.env.GAMEON_ADMIN_PASSWORD }
function sign(value) { return crypto.createHmac('sha256', secret()).update(value).digest('base64url') }
export function createSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })).toString('base64url')
  return `${payload}.${sign(payload)}`
}
export function validSession(req) {
  const token = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1)
  if (!token || !secret()) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  const expected = sign(payload), a = Buffer.from(signature), b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
  try { return Number(JSON.parse(Buffer.from(payload, 'base64url').toString()).exp) > Date.now() } catch { return false }
}
export function cookie(value, maxAge = MAX_AGE) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}${secure}`
}
export async function getSupabaseRows(table) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server database environment variables are missing')
  const response = await fetch(`${url}/rest/v1/${table}?select=*&order=created_at.desc&limit=2000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  if (!response.ok) throw new Error(`Database request failed for ${table}`)
  return response.json()
}
