import { useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabaseClient'
import AdminDashboard from './admin/AdminDashboard'
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CalendarDays, Check,
  ChevronDown, Clock3, Gamepad2, Instagram, Menu, ShieldCheck,
  Swords, Trophy, Users, X, Zap
} from 'lucide-react'

const games = [
  { id: 'tekken', name: 'TEKKEN', edition: 'FIGHTING / 1V1', description: 'Read your opponent. Find the opening. Finish the round.', accent: 'violet', tag: 'HEAD TO HEAD' },
  { id: 'fc', name: 'EA SPORTS FC', edition: 'FOOTBALL / 1V1', description: 'Pick your side, take the pitch, and settle the rivalry.', accent: 'blue', tag: 'MATCH DAY' },
]

// ===== EVENT SETTINGS (edit these) =====

// true = waiting list shows "Coming soon" and signups are off. false = signups are open.
const WAITLIST_COMING_SOON = false

// Dates people can book, in YYYY-MM-DD format (1-3 dates). The day name is added automatically.
const BOOKING_DATES = ['2026-11-28', '2026-11-29', '2026-11-30']

// Times people can choose. These apply to every date above.
const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']

// =======================================

// '2026-11-28' -> 'Saturday, 28 November 2026'
function formatDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Today's date in the visitor's local time, as YYYY-MM-DD
function getToday() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function readStored(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function App() {
  if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') return <AdminDashboard />
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeGame, setActiveGame] = useState('tekken')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [waitlistOpen, setWaitlistOpen] = useState(false)
  const [booking, setBooking] = useState({ name: '', contact: '', game: 'tekken', date: '', time: '', players: '2' })
  const [member, setMember] = useState({ name: '', email: '', interest: 'Both games' })
  const [bookingDone, setBookingDone] = useState(false)
  const [memberDone, setMemberDone] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedGame = useMemo(() => games.find(g => g.id === activeGame), [activeGame])
  // Dates that have already passed are hidden automatically
  const availableDates = BOOKING_DATES.filter(d => d >= getToday())

  useEffect(() => {
    document.body.style.overflow = bookingOpen || waitlistOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [bookingOpen, waitlistOpen])

  async function submitBooking(e) {
    e.preventDefault()
    setFormError('')
    if (!isSupabaseConfigured) {
      setFormError('Online submissions are not configured yet. Please try again later or contact the GameOn team.')
      return
    }
    if (!availableDates.includes(booking.date) || !TIME_SLOTS.includes(booking.time)) {
      setFormError('Please choose an available date and time.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('booking_requests').insert({
      name: booking.name.trim(),
      contact: booking.contact.trim(),
      game: booking.game,
      booking_date: booking.date,
      preferred_time: booking.time,
      players: Number(booking.players),
    })
    setSubmitting(false)
    if (error) {
      console.error('Booking submission failed:', error)
      setFormError('We could not send your request. Please try again in a moment.')
      return
    }
    setBookingDone(true)
  }

  async function submitMember(e) {
    e.preventDefault()
    if (WAITLIST_COMING_SOON) return
    setFormError('')
    if (!isSupabaseConfigured) {
      setFormError('Online signups are not configured yet. Please try again later or contact the GameOn team.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('waitlist_members').insert({
      name: member.name.trim(),
      email: member.email.trim().toLowerCase(),
      interest: member.interest,
    })
    setSubmitting(false)
    if (error) {
      console.error('Waitlist submission failed:', error)
      setFormError('We could not add you to the list. Please check your details and try again.')
      return
    }
    setMemberDone(true)
  }

  function closeModal() {
    setBookingOpen(false); setWaitlistOpen(false)
    setBookingDone(false); setMemberDone(false); setFormError(''); setSubmitting(false)
  }

  function openBooking(game = activeGame) {
    setBooking(b => ({ ...b, game }))
    setBookingOpen(true)
    setMenuOpen(false)
  }

  const nav = [
    ['The games', '#games'], ['How it works', '#how'], ['Community', '#community']
  ]

  return (
    <main>
      <div className="announcement">
        <span className="live-dot" /> GAMEON / SEECS <span className="announcement-divider">—</span> {WAITLIST_COMING_SOON ? 'WAITING LIST COMING SOON' : 'EARLY ACCESS IS OPEN'}
        {!WAITLIST_COMING_SOON && <button onClick={() => setWaitlistOpen(true)}>GET ON THE LIST <ArrowUpRight size={13} /></button>}
      </div>

      <header className="header wrap">
        <a className="brand" href="#top" aria-label="GameOn home">
          <img src="/gameon-logo.png" alt="" />
          <span>GAME<span className="brand-on">ON</span><small>SEECS GAMING STALL</small></span>
        </a>
        <nav className={menuOpen ? 'nav nav-open' : 'nav'}>
          {nav.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <button className="nav-cta" onClick={() => openBooking()}>Reserve a slot <ArrowUpRight size={15} /></button>
        </nav>
        <button className="mobile-menu" aria-label="Toggle menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero wrap" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>01</span><i /> THE NEXT MATCH STARTS HERE</div>
          <h1>YOUR<br /><span className="outline-word">MOVE.</span><br /><span className="gradient-word">YOUR</span> GAME.</h1>
          <p className="hero-text">A controller. A rival. One more match. Step up at GameOn and turn a quick game into a proper showdown.</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => openBooking()}>Pre-book a slot <ArrowUpRight size={17} /></button>
            <a className="text-link" href="#games">Explore the games <ArrowDownRight size={16} /></a>
          </div>
          <div className="hero-meta">
            <div><strong>02</strong><span>GAME EXPERIENCES</span></div>
            <div><strong>1v1</strong><span>BRING A RIVAL</span></div>
            <div><strong>∞</strong><span>REMATCH ENERGY</span></div>
          </div>
        </div>
        <div className="hero-art" aria-label="GameOn gaming controller artwork">
          <div className="art-grid" />
          <div className="art-ring ring-one" /><div className="art-ring ring-two" />
          <div className="art-label label-top">PLAYER 01 <span>READY</span></div>
          <div className="controller">
            <div className="controller-top" />
            <div className="dpad"><i /><b /></div>
            <div className="sticks"><i /><i /></div>
            <div className="buttons"><i /><i /><i /><i /></div>
            <div className="controller-light" />
          </div>
          <div className="art-cross">×</div>
          <div className="art-label label-bottom"><span className="tiny-bars">///</span> PRESS START TO PLAY</div>
          <div className="hero-index">G / 001</div>
        </div>
        <a className="scroll-cue" href="#games"><span /> SCROLL TO EXPLORE</a>
      </section>

      <section className="ticker" aria-label="GameOn tagline">
        <div className="ticker-track">
          {Array.from({ length: 4 }).map((_, i) => <span key={i}>PLAY <b>✳</b> COMPETE <b>✳</b> CONQUER <b>✳</b> REMATCH <b>✳</b></span>)}
        </div>
      </section>

      <section className="section wrap games-section" id="games">
        <div className="section-head">
          <div><div className="eyebrow"><span>02</span><i /> CHOOSE YOUR ARENA</div><h2>TWO WAYS<br />TO <span className="gradient-word">SETTLE IT.</span></h2></div>
          <p>Different games. Same energy. Pick your arena, bring your competition, and make the next match count.</p>
        </div>
        <div className="game-grid">
          {games.map((game, index) => (
            <article className={`game-card ${game.accent} ${activeGame === game.id ? 'selected' : ''}`} key={game.id} onClick={() => setActiveGame(game.id)}>
              <div className="game-card-top"><span>GAME / 0{index + 1}</span><span className="game-tag">{game.tag}</span></div>
              <div className="game-visual">
                {game.id === 'tekken' ? <div className="fighter-mark"><Swords size={92} strokeWidth={1.1} /><span>VS</span></div> : <div className="football-mark"><div className="pitch-lines" /><div className="ball"><span /></div><span className="score">90<span>'</span></span></div>}
              </div>
              <div className="game-card-bottom">
                <div><span className="game-edition">{game.edition}</span><h3>{game.name}</h3><p>{game.description}</p></div>
                <button aria-label={`Choose ${game.name}`} onClick={(e) => { e.stopPropagation(); setActiveGame(game.id); openBooking(game.id) }}><ArrowUpRight /></button>
              </div>
            </article>
          ))}
        </div>
        <div className="selection-row"><span><i className="live-dot" /> SELECTED ARENA</span><strong>{selectedGame.name}</strong><button onClick={() => openBooking(activeGame)}>Book this game <ArrowRight size={15} /></button></div>
      </section>

      <section className="how-section" id="how">
        <div className="wrap how-inner">
          <div className="how-intro"><div className="eyebrow"><span>03</span><i /> NO COMPLICATED SETUP</div><h2>THREE STEPS.<br /><span className="gradient-word">GAME ON.</span></h2><p>Getting into the game should be easier than winning it.</p><button className="button button-primary" onClick={() => openBooking()}>Find your slot <ArrowUpRight size={16} /></button></div>
          <div className="steps">
            <div className="step"><span className="step-number">01</span><div><h3>Pick your game</h3><p>Choose between Tekken and EA SPORTS FC. Decide what kind of matchup you're in the mood for.</p></div><Gamepad2 /></div>
            <div className="step"><span className="step-number">02</span><div><h3>Request a time</h3><p>Send your preferred date, time, and player count. We'll confirm availability with you.</p></div><CalendarDays /></div>
            <div className="step"><span className="step-number">03</span><div><h3>Show up & play</h3><p>Bring your rival, take your place, and let the match speak for itself.</p></div><Trophy /></div>
          </div>
        </div>
      </section>

      <section className="community-section wrap" id="community">
        <div className="community-card">
          <div className="community-orb orb-a" /><div className="community-orb orb-b" />
          <div className="community-content">
            <div className="eyebrow"><span>04</span><i /> THE GAME DOESN'T END HERE</div>
            <h2>GET IN<br />THE <span className="gradient-word">LOBBY.</span></h2>
            <p>Be part of the GameOn community. Get first updates on match days, mini-tournaments, and what's coming next at SEECS.</p>
            {WAITLIST_COMING_SOON
              ? <button className="button button-light" type="button" disabled style={{ cursor: 'default', opacity: 0.7 }}>Waiting list coming soon <Clock3 size={17} /></button>
              : <button className="button button-light" onClick={() => setWaitlistOpen(true)}>Join the early list <ArrowUpRight size={17} /></button>}
          </div>
          <div className="community-stamp"><Users size={22} /><span>GAMEON<br />COMMUNITY</span><b>SEECS / 26</b></div>
        </div>
      </section>

      <footer className="footer wrap">
        <a className="brand footer-brand" href="#top"><img src="/gameon-logo.png" alt="" /><span>GAME<span className="brand-on">ON</span><small>SEECS GAMING STALL</small></span></a>
        <span className="footer-note">PLAY. COMPETE. CONQUER.</span>
        <div className="footer-right"><span>MADE FOR THE LOVE OF THE GAME.</span><a href="#top">BACK TO TOP ↑</a></div>
      </footer>

      {(bookingOpen || waitlistOpen) && (
        <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" onClick={closeModal} aria-label="Close"><X /></button>
            {bookingOpen && !bookingDone && <>
              <div className="eyebrow"><span>BOOK / 01</span><i /> SLOT REQUEST</div>
              <h2 id="modal-title">CALL YOUR<br /><span className="gradient-word">NEXT MATCH.</span></h2>
              <p className="modal-intro">Tell us when you want to play. This sends a request, not a confirmed reservation.</p>
              <form onSubmit={submitBooking}>
                <label>Your name<input required value={booking.name} onChange={e => setBooking({ ...booking, name: e.target.value })} placeholder="Name" /></label>
                <label>Phone or Instagram handle<input required value={booking.contact} onChange={e => setBooking({ ...booking, contact: e.target.value })} placeholder="@yourhandle or phone number" /></label>
                <div className="form-row">
                  <label>Game<select value={booking.game} onChange={e => setBooking({ ...booking, game: e.target.value })}><option value="tekken">Tekken</option><option value="fc">EA SPORTS FC</option></select></label>
                  <label>Players<select value={booking.players} onChange={e => setBooking({ ...booking, players: e.target.value })}><option value="1">1 player</option><option value="2">2 players</option><option value="3">3 players</option><option value="4">4 players</option></select></label>
                </div>
                <div className="form-row">
                  <label>Date<select required value={booking.date} onChange={e => setBooking({ ...booking, date: e.target.value })}><option value="">{availableDates.length ? 'Choose date' : 'No dates available'}</option>{availableDates.map(d => <option key={d} value={d}>{formatDate(d)}</option>)}</select></label>
                  <label>Preferred time<select required value={booking.time} onChange={e => setBooking({ ...booking, time: e.target.value })}><option value="">Choose time</option>{TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
                </div>
                <button className="button button-primary form-submit" type="submit" disabled={submitting || availableDates.length === 0}>{submitting ? 'Sending...' : 'Send slot request'} <ArrowUpRight size={16} /></button>
                <small className="form-footnote"><ShieldCheck size={13} /> Your request is sent securely to GameOn. A request is not a confirmed booking.</small>
                {formError && <p className="form-error" role="alert">{formError}</p>}
              </form>
            </>}
            {bookingOpen && bookingDone && <div className="success-state"><div className="success-icon"><Check /></div><div className="eyebrow"><span>REQUEST SAVED</span><i /></div><h2>YOU'RE<br /><span className="gradient-word">IN THE QUEUE.</span></h2><p>Your request has reached the GameOn database. The team will contact you to confirm availability. Your slot is not confirmed yet.</p><button className="button button-primary" onClick={closeModal}>Back to GameOn <ArrowRight size={16} /></button></div>}
            {waitlistOpen && !memberDone && <>
              <div className="eyebrow"><span>COMMUNITY / 01</span><i /> EARLY ACCESS</div>
              <h2>GET ON<br /><span className="gradient-word">THE LIST.</span></h2>
              <p className="modal-intro">Be first to hear about tournaments, match days, and GameOn updates.</p>
              <form onSubmit={submitMember}>
                <label>Your name<input required value={member.name} onChange={e => setMember({ ...member, name: e.target.value })} placeholder="Name" /></label>
                <label>Email address<input required type="email" value={member.email} onChange={e => setMember({ ...member, email: e.target.value })} placeholder="you@example.com" /></label>
                <label>What do you play?<select value={member.interest} onChange={e => setMember({ ...member, interest: e.target.value })}><option>Both games</option><option>Tekken</option><option>EA SPORTS FC</option></select></label>
                <button className="button button-primary form-submit" type="submit" disabled={submitting}>{submitting ? 'Joining...' : 'Join the early list'} <ArrowUpRight size={16} /></button>
                <small className="form-footnote"><ShieldCheck size={13} /> Your details are sent securely to the GameOn database.</small>
                {formError && <p className="form-error" role="alert">{formError}</p>}
              </form>
            </>}
            {waitlistOpen && memberDone && <div className="success-state"><div className="success-icon"><Check /></div><div className="eyebrow"><span>YOU'RE ON THE LIST</span><i /></div><h2>SEE YOU<br /><span className="gradient-word">IN GAME.</span></h2><p>You have been added to the GameOn early-access list. Watch your inbox for updates.</p><button className="button button-primary" onClick={closeModal}>Let's go <ArrowRight size={16} /></button></div>}
          </div>
        </div>
      )}
    </main>
  )
}

export default App