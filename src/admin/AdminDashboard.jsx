import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowUpRight, CalendarDays, Check, Clock3,
  Copy, Download, Gamepad2, LogOut, RefreshCw, Search, ShieldCheck,
  SlidersHorizontal, TrendingUp, Users, X,
} from 'lucide-react'
import './admin.css'

const date = v => v ? new Date(v).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const dt = v => v ? new Date(v).toLocaleString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
const game = v => v === 'fc' ? 'EA SPORTS FC' : v === 'tekken' ? 'Tekken' : v || '—'

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled']
const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' }

function Card({ label, value, note, Icon, tone = '' }) {
  return (
    <article className="metric">
      <span className={'metric-icon ' + tone}><Icon size={17} /></span>
      <small>{label}</small>
      <strong>{value}</strong>
      <em>{note}</em>
    </article>
  )
}

function exportCSV(rows, kind) {
  const keys = kind === 'bookings'
    ? ['id', 'name', 'contact', 'game', 'booking_date', 'preferred_time', 'players', 'status', 'created_at']
    : ['id', 'name', 'email', 'interest', 'created_at']
  const q = v => `"${String(v ?? '').replaceAll('"', '""')}"`
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => q(r[k])).join(','))].join('\n')
  const u = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = u
  a.download = `gameon-${kind}.csv`
  a.click()
  URL.revokeObjectURL(u)
}

// Ready-to-send DM / WhatsApp message, tailored to the booking's current status.
function bookingMessage(r) {
  const opener = {
    pending: `quick update on your GameOn slot request — it's in the queue and we're checking availability. We'll confirm shortly.`,
    confirmed: `good news, your GameOn slot is confirmed. See you at the stall!`,
    completed: `thanks for playing at GameOn! Hope the rematch is already on your mind.`,
    cancelled: `unfortunately we couldn't lock in your requested GameOn slot. Send us another time and we'll sort it out.`,
  }[r.status] || `here's the latest on your GameOn slot request.`

  return [
    `Hey ${r.name}! 👋`,
    '',
    opener.charAt(0).toUpperCase() + opener.slice(1),
    '',
    `🎮 Game: ${game(r.game)}`,
    `📅 Date: ${date(r.booking_date)}`,
    `⏰ Time: ${r.preferred_time}`,
    `👥 Players: ${r.players}`,
    '',
    '— GameOn / SEECS',
  ].join('\n')
}

async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.top = '-1000px'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('')
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [data, setData] = useState({ bookings: [], members: [] })
  const [tab, setTab] = useState('bookings')
  const [query, setQuery] = useState('')
  const [gameFilter, setGameFilter] = useState('all')
  const [status, setStatus] = useState('all')
  const [period, setPeriod] = useState('all')
  const [expanded, setExpanded] = useState(false)
  const [filters, setFilters] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [notice, setNotice] = useState('')

  async function refresh() {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/admin/data')
      const d = await r.json()
      if (!r.ok) throw Error(d.error)
      setData(d)
    } catch (e) {
      setErr(e.message || 'Unable to load records')
    } finally {
      setBusy(false)
    }
  }

  async function login(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const d = await r.json()
      if (!r.ok) throw Error(d.error)
      setOk(true); setPassword('')
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    setOk(false)
    setData({ bookings: [], members: [] })
  }

  async function updateStatus(id, nextStatus) {
    setSavingId(id); setErr(''); setNotice('')
    const previous = data.bookings
    // Optimistic update — row flips instantly, rolls back if the API says no.
    setData(d => ({ ...d, bookings: d.bookings.map(b => b.id === id ? { ...b, status: nextStatus } : b) }))
    try {
      const r = await fetch('/api/admin/booking-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw Error(d.error || 'Could not update that booking.')
      setNotice(`Booking #${id} marked ${STATUS_LABEL[nextStatus].toLowerCase()}.`)
    } catch (e) {
      setData(d => ({ ...d, bookings: previous }))
      setErr(e.message)
    } finally {
      setSavingId(null)
    }
  }

  async function copyMessage(r) {
    const done = await copyText(bookingMessage(r))
    if (!done) { setErr('Could not copy to clipboard. Select the message text manually.'); return }
    setErr('')
    setCopiedId(r.id)
    setTimeout(() => setCopiedId(c => c === r.id ? null : c), 1800)
  }

  useEffect(() => { if (ok) refresh() }, [ok])

  const bookings = data.bookings || []
  const members = data.members || []
  const now = Date.now()
  const week = now - 7 * 86400000

  const recentB = bookings.filter(x => new Date(x.created_at).getTime() > week).length
  const recentM = members.filter(x => new Date(x.created_at).getTime() > week).length
  const pending = bookings.filter(x => x.status === 'pending').length
  const confirmed = bookings.filter(x => x.status === 'confirmed').length
  const completed = bookings.filter(x => x.status === 'completed').length

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - 6 + i)
      const k = d.toISOString().slice(0, 10)
      return {
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        v: bookings.filter(x => x.created_at?.slice(0, 10) === k).length
          + members.filter(x => x.created_at?.slice(0, 10) === k).length,
      }
    }),
    [bookings, members],
  )
  const max = Math.max(1, ...days.map(x => x.v))

  const rows = tab === 'bookings' ? bookings : members
  const filtered = useMemo(
    () => rows.filter(r => {
      const hay = tab === 'bookings'
        ? [r.name, r.contact, r.game, r.status, r.booking_date]
        : [r.name, r.email, r.interest]
      const s = !query || hay.some(x => String(x || '').toLowerCase().includes(query.toLowerCase()))
      const g = tab !== 'bookings' || gameFilter === 'all' || r.game === gameFilter
      const st = tab !== 'bookings' || status === 'all' || r.status === status
      const age = period === 'all'
        || (period === 'today'
          ? r.created_at?.slice(0, 10) === new Date().toISOString().slice(0, 10)
          : Date.now() - new Date(r.created_at).getTime() <= Number(period) * 86400000)
      return s && g && st && age
    }),
    [rows, tab, query, gameFilter, status, period],
  )

  if (!ok) return (
    <div className="login-screen">
      <a href="/" className="back"><ArrowLeft size={15} /> Back to GameOn</a>
      <section className="login-box">
        <img src="/gameon-logo.png" />
        <small className="kicker">● PRIVATE CONTROL ROOM</small>
        <h1>GAME<span>ON</span><br />ANALYTICS.</h1>
        <p>Sign in to view registrations, booking activity, and community growth.</p>
        <form onSubmit={login}>
          <label>ADMIN PASSWORD</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required />
          {err && <div className="error">{err}</div>}
          <button disabled={busy}>{busy ? 'CHECKING...' : 'UNLOCK DASHBOARD'} <ArrowUpRight size={16} /></button>
        </form>
        <small className="secure"><ShieldCheck size={14} /> Secure session · Expires after 8 hours</small>
      </section>
      <footer>GAMEON / SEECS <span>PLAY. COMPETE. CONQUER.</span></footer>
    </div>
  )

  const colCount = tab === 'bookings' ? 7 : 4
  const visible = expanded ? filtered : filtered.slice(0, 5)

  return (
    <div className="dash">
      <aside className="side">
        <a className="brand" href="/"><img src="/gameon-logo.png" />GAME<span>ON</span><small>SEECS / CONTROL ROOM</small></a>
        <p>WORKSPACE</p>
        <div className="active"><Activity size={16} /> Overview</div>
        <div className="side-bottom">
          <small>● DATABASE CONNECTED</small>
          <button onClick={logout}><LogOut size={15} /> Sign out</button>
          <a href="/">← View public website</a>
        </div>
      </aside>

      <main className="main">
        <header>
          <div><small>GAMEON / ANALYTICS</small><h1>Overview <span>↗</span></h1></div>
          <div className="head-actions">
            <i>● LIVE DATA</i>
            <button onClick={refresh} disabled={busy}><RefreshCw size={14} /> Refresh</button>
            <button className="logout-mobile" onClick={logout}><LogOut size={15} /></button>
          </div>
        </header>

        {err && <div className="error banner">{err}</div>}
        {notice && <div className="notice banner">{notice}</div>}

        <section className="welcome">
          <div><small>YOUR GAMEON SNAPSHOT</small><h2>Know your players.<br /><em>Own the next match.</em></h2></div>
          <span><CalendarDays size={14} /> {new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </section>

        <section className="metrics">
          <Card label="TOTAL REGISTRATIONS" value={members.length} note={`+${recentM} in last 7 days`} Icon={Users} tone="purple" />
          <Card label="BOOKING REQUESTS" value={bookings.length} note={`${recentB} submitted in last 7 days`} Icon={CalendarDays} />
          <Card label="PENDING REQUESTS" value={pending} note="Waiting for your review" Icon={Clock3} tone="amber" />
          <Card label="COMPLETED MATCHES" value={completed} note={`${confirmed} confirmed · ${bookings.length ? Math.round(completed / bookings.length * 100) : 0}% played`} Icon={Check} tone="green" />
        </section>

        <section className="charts">
          <article className="panel activity">
            <div className="panel-head"><div><h3>Activity overview</h3><p>Bookings + registrations by day</p></div><small>LAST 7 DAYS</small></div>
            <div className="bars">
              {days.map(d => (
                <div className="bar" key={d.label}>
                  <b>{d.v}</b>
                  <div><i style={{ height: `${Math.max(d.v ? 8 : 2, d.v / max * 100)}%` }} /></div>
                  <small>{d.label}</small>
                </div>
              ))}
            </div>
          </article>
          <article className="panel mix">
            <div className="panel-head"><div><h3>Game preference</h3><p>Booking requests by title</p></div><Gamepad2 size={18} /></div>
            <div className="donut-area">
              <div className="donut" style={{ '--pct': `${bookings.length ? bookings.filter(x => x.game === 'tekken').length / bookings.length * 100 : 0}%` }}>
                <b>{bookings.length}</b><small>REQUESTS</small>
              </div>
            </div>
            <div className="legend">
              <span>● Tekken <b>{bookings.filter(x => x.game === 'tekken').length}</b></span>
              <span>● EA SPORTS FC <b>{bookings.filter(x => x.game === 'fc').length}</b></span>
            </div>
          </article>
        </section>

        <section className="insights">
          <article><Users /><small>COMMUNITY SIZE</small><b>{members.length + bookings.length}</b><p>Total registrations and booking requests</p></article>
          <article><TrendingUp /><small>7-DAY MOMENTUM</small><b>+{recentM + recentB}</b><p>New signups and booking requests this week</p></article>
          <article><Activity /><small>WAITING FOR ACTION</small><b>{pending}</b><p>Pending booking requests to follow up</p></article>
        </section>

        <section className="records">
          <div className="record-head">
            <div>
              <small className="kicker">● YOUR DATABASE</small>
              <h2>People & requests</h2>
              <p>Search, filter, update statuses, and copy a ready-to-send message.</p>
            </div>
            <button onClick={() => setExpanded(!expanded)}>{expanded ? 'Collapse table' : 'Open full table'} <ArrowUpRight size={14} /></button>
          </div>

          <div className="toolbar">
            <div className="tabs">
              <button className={tab === 'bookings' ? 'chosen' : ''} onClick={() => { setTab('bookings'); setQuery('') }}>Bookings <b>{bookings.length}</b></button>
              <button className={tab === 'members' ? 'chosen' : ''} onClick={() => { setTab('members'); setQuery('') }}>Pre-registrations <b>{members.length}</b></button>
            </div>
            <div className="tools">
              <label className="search">
                <Search size={14} />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, contact..." />
                {query && <X size={13} onClick={() => setQuery('')} />}
              </label>
              <button className="filter-button" onClick={() => setFilters(!filters)}><SlidersHorizontal size={14} /> Filters</button>
              <button onClick={() => exportCSV(filtered, tab)}><Download size={14} /> Export</button>
            </div>
          </div>

          <div className={'filters ' + (filters ? 'show' : '')}>
            {tab === 'bookings' && <>
              <label>GAME
                <select value={gameFilter} onChange={e => setGameFilter(e.target.value)}>
                  <option value="all">All games</option>
                  <option value="tekken">Tekken</option>
                  <option value="fc">EA SPORTS FC</option>
                </select>
              </label>
              <label>STATUS
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </>}
            <label>DATE ADDED
              <select value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </label>
            <button onClick={() => { setGameFilter('all'); setStatus('all'); setPeriod('all'); setQuery('') }}>Clear filters</button>
            <small>{filtered.length} RESULTS</small>
          </div>

          <div className={'table-wrap ' + (expanded ? 'expanded' : '')}>
            <table>
              <thead>
                <tr>
                  {tab === 'bookings'
                    ? <><th>PLAYER</th><th>GAME</th><th>REQUESTED SLOT</th><th>PLAYERS</th><th>STATUS</th><th>MESSAGE</th><th>SUBMITTED</th></>
                    : <><th>MEMBER</th><th>EMAIL</th><th>INTEREST</th><th>REGISTERED</th></>}
                </tr>
              </thead>
              <tbody>
                {visible.map(r => (
                  <tr key={r.id}>
                    {tab === 'bookings' ? <>
                      <td><b>{r.name}</b><small>#{r.id} · {r.contact}</small></td>
                      <td><span className={'chip ' + r.game}>{game(r.game)}</span></td>
                      <td>{date(r.booking_date)}<small>{r.preferred_time}</small></td>
                      <td>{r.players} {r.players === 1 ? 'player' : 'players'}</td>
                      <td>
                        <select
                          className={'chip status-select ' + r.status}
                          value={r.status}
                          disabled={savingId === r.id}
                          onChange={e => updateStatus(r.id, e.target.value)}
                          aria-label={`Status for ${r.name}`}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={'copy-btn ' + (copiedId === r.id ? 'copied' : '')}
                          onClick={() => copyMessage(r)}
                          title="Copy a ready-to-send message for this player"
                        >
                          {copiedId === r.id ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedId === r.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </td>
                      <td>{dt(r.created_at)}</td>
                    </> : <>
                      <td><b>{r.name}</b><small>Member #{r.id}</small></td>
                      <td>{r.email}</td>
                      <td>{r.interest}</td>
                      <td>{dt(r.created_at)}</td>
                    </>}
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td className="empty" colSpan={colCount}>
                      <Search size={20} />
                      <b>No matching records</b>
                      <small>Try changing your search or filters.</small>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-foot">
            <span>SHOWING {Math.min(expanded ? filtered.length : 5, filtered.length)} OF {filtered.length} RECORDS</span>
            {filtered.length > 5 && (
              <button onClick={() => setExpanded(!expanded)}>
                {expanded ? 'Show less' : 'Show all ' + filtered.length} <ArrowDownRight size={14} />
              </button>
            )}
          </div>
        </section>

        <footer className="dash-foot">GAMEON SEECS / PRIVATE ANALYTICS <span>SESSION PROTECTED · REFRESH ON DEMAND</span></footer>
      </main>
    </div>
  )
}