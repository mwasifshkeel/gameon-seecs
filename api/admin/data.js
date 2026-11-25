import { validSession, getSupabaseRows } from './_auth.js'
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!validSession(req)) return res.status(401).json({ error: 'Please sign in again.' })
  try {
    const [bookings, members] = await Promise.all([getSupabaseRows('booking_requests'), getSupabaseRows('waitlist_members')])
    return res.status(200).json({ bookings, members })
  } catch (error) {
    console.error('GameOn admin data error:', error)
    return res.status(500).json({ error: 'Could not load analytics. Check the server database environment variables.' })
  }
}
