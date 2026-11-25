import { createSession, cookie } from './_auth.js'
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { password, action } = req.body || {}
  if (action === 'logout') { res.setHeader('Set-Cookie', cookie('', 0)); return res.status(200).json({ ok: true }) }
  const expected = process.env.GAMEON_ADMIN_PASSWORD
  if (!expected) return res.status(503).json({ error: 'Admin password is not configured on the server.' })
  if (typeof password !== 'string' || password.length > 200 || password !== expected) return res.status(401).json({ error: 'That password is not correct.' })
  res.setHeader('Set-Cookie', cookie(createSession()))
  return res.status(200).json({ ok: true })
}
