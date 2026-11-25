import { validSession, updateSupabaseRow } from './_auth.js'

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!validSession(req)) return res.status(401).json({ error: 'Please sign in again.' })

  const { id, status } = req.body || {}
  const bookingId = Number(id)

  if (!Number.isInteger(bookingId) || bookingId <= 0) return res.status(400).json({ error: 'Invalid booking id.' })
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status.' })

  try {
    const booking = await updateSupabaseRow('booking_requests', bookingId, { status })
    if (!booking) return res.status(404).json({ error: 'That booking no longer exists.' })
    return res.status(200).json({ booking })
  } catch (error) {
    console.error('GameOn booking status error:', error)
    return res.status(500).json({ error: 'Could not update that booking. Check the server database environment variables.' })
  }
}