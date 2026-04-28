import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchEvents, createEvent, updateEvent, deleteEvent } from '../lib/events'
import { useT } from '../hooks/useT'
import AddEventModal from '../components/AddEventModal'
import './CalendarPage.css'

const COLOR_MAP = {
  blue:   '#3b6fd4',
  amber:  '#d97706',
  green:  '#22c55e',
  purple: '#a855f7',
  red:    '#ef4444',
}

export default function CalendarPage() {
  const { session } = useAuth()
  const userId = session.user.id
  const t = useT()
  const MONTHS = t('cal.months')
  const WEEKDAYS_SHORT = t('cal.days')

  const [view, setView] = useState('month') // 'month' | 'week'
  const [cursor, setCursor] = useState(new Date()) // current month/week reference
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | { mode: 'create', date } | { mode: 'edit', event }

  // Compute visible range based on view
  const range = useMemo(() => computeRange(cursor, view), [cursor, view])

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const data = await fetchEvents(userId, range.start, range.end)
      if (active) { setEvents(data); setLoading(false) }
    }
    load()
    return () => { active = false }
  }, [userId, range.start, range.end])

  async function handleCreateEvent(payload) {
    const ev = await createEvent(userId, payload)
    setEvents(prev => [...prev, ev])
  }

  async function handleEditEvent(payload) {
    await updateEvent(modal.event._original_id ?? modal.event.id, payload)
    const data = await fetchEvents(userId, range.start, range.end)
    setEvents(data)
  }

  async function handleDeleteEvent(id) {
    await deleteEvent(id)
    setEvents(prev => prev.filter(e => e.id !== id && e._original_id !== id))
  }

  function openCreate(date) {
    setModal({ mode: 'create', date: new Date(date) })
  }

  function openEdit(ev) {
    setModal({ mode: 'edit', event: ev })
  }

  function navigate(dir) {
    setCursor(prev => {
      const d = new Date(prev)
      if (view === 'month') d.setMonth(d.getMonth() + dir)
      else d.setDate(d.getDate() + dir * 7)
      return d
    })
  }

  function goToday() { setCursor(new Date()) }

  const headerLabel = view === 'month'
    ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    : weekRangeLabel(range.start, range.end)

  return (
    <div className="calendar-root">
      {/* Toolbar */}
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <button className="cal-nav-btn" onClick={() => navigate(-1)}>‹</button>
          <button className="cal-today-btn" onClick={goToday}>{t('cal.today')}</button>
          <button className="cal-nav-btn" onClick={() => navigate(1)}>›</button>
          <span className="cal-header-label">{headerLabel}</span>
        </div>
        <div className="cal-toolbar-right">
          <div className="view-tabs">
            <button className={`view-tab ${view === 'month' ? 'active' : ''}`} onClick={() => setView('month')}>{t('cal.month')}</button>
            <button className={`view-tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>{t('cal.week')}</button>
          </div>
          <button className="btn-add-event" onClick={() => openCreate(new Date())}>{t('cal.addEvent')}</button>
        </div>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="cal-loading"><div className="loading-dot" /></div>
      ) : view === 'month' ? (
        <MonthView
          cursor={cursor}
          events={events}
          onDayClick={openCreate}
          onEventClick={openEdit}
        />
      ) : (
        <WeekView
          range={range}
          events={events}
          onSlotClick={openCreate}
          onEventClick={openEdit}
        />
      )}

      {/* Modal */}
      {modal && (
        <AddEventModal
          onClose={() => setModal(null)}
          onSave={modal.mode === 'create' ? handleCreateEvent : handleEditEvent}
          onDelete={modal.mode === 'edit' ? async () => {
            await handleDeleteEvent(modal.event._original_id ?? modal.event.id)
            setModal(null)
          } : null}
          initialData={modal.mode === 'edit' ? modal.event : null}
          defaultDate={modal.mode === 'create' ? modal.date : null}
        />
      )}
    </div>
  )
}

/* ─── Month View ─────────────────────────────────────────────── */
function MonthView({ cursor, events, onDayClick, onEventClick }) {
  const today = new Date()
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  // Build the 6×7 grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  function eventsOnDay(day) {
    if (!day) return []
    return events.filter(ev => {
      const evDay = new Date(ev.start_at)
      return evDay.getFullYear() === day.getFullYear()
        && evDay.getMonth() === day.getMonth()
        && evDay.getDate() === day.getDate()
    })
  }

  const isToday = (day) =>
    day &&
    day.getDate() === today.getDate() &&
    day.getMonth() === today.getMonth() &&
    day.getFullYear() === today.getFullYear()

  return (
    <div className="month-grid-wrapper">
      <div className="month-weekdays">
        {WEEKDAYS_SHORT.map(d => <div key={d} className="month-weekday">{d}</div>)}
      </div>
      <div className="month-grid">
        {cells.map((day, i) => {
          const dayEvents = eventsOnDay(day)
          return (
            <div
              key={i}
              className={`month-cell ${!day ? 'empty' : ''} ${isToday(day) ? 'today' : ''}`}
              onClick={() => day && onDayClick(day)}
            >
              {day && (
                <>
                  <span className="month-day-num">{day.getDate()}</span>
                  <div className="month-day-events">
                    {dayEvents.slice(0, 3).map(ev => (
                      <button
                        key={ev.id}
                        className="month-event-pill"
                        style={{ background: (COLOR_MAP[ev.color] ?? COLOR_MAP.blue) + '33', borderLeft: `2px solid ${COLOR_MAP[ev.color] ?? COLOR_MAP.blue}` }}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                      >
                        {ev.all_day ? '' : formatTime(ev.start_at) + ' '}
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="month-more">+{dayEvents.length - 3} mais</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Week View ──────────────────────────────────────────────── */
function WeekView({ range, events, onSlotClick, onEventClick }) {
  const today = new Date()
  const days = []
  const d = new Date(range.start)
  while (d <= range.end) {
    days.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }

  const hours = Array.from({ length: 16 }, (_, i) => i + 7) // 07:00–22:00

  function eventsOnDay(day) {
    return events.filter(ev => {
      const s = new Date(ev.start_at)
      return s.getFullYear() === day.getFullYear()
        && s.getMonth() === day.getMonth()
        && s.getDate() === day.getDate()
    })
  }

  const isToday = (day) =>
    day.getDate() === today.getDate() &&
    day.getMonth() === today.getMonth() &&
    day.getFullYear() === today.getFullYear()

  return (
    <div className="week-wrapper">
      {/* Day headers */}
      <div className="week-header-row">
        <div className="week-time-gutter" />
        {days.map((day, i) => (
          <div key={i} className={`week-day-header ${isToday(day) ? 'today' : ''}`}>
            <span className="week-day-name">{WEEKDAYS_SHORT[day.getDay()]}</span>
            <span className="week-day-num">{day.getDate()}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="week-body">
        {hours.map(hour => (
          <div key={hour} className="week-hour-row">
            <div className="week-time-label">{String(hour).padStart(2, '0')}:00</div>
            {days.map((day, di) => {
              const slotEvents = eventsOnDay(day).filter(ev => {
                const h = new Date(ev.start_at).getHours()
                return h === hour
              })
              return (
                <div
                  key={di}
                  className="week-slot"
                  onClick={() => {
                    const d = new Date(day)
                    d.setHours(hour, 0, 0, 0)
                    onSlotClick(d)
                  }}
                >
                  {slotEvents.map(ev => (
                    <button
                      key={ev.id}
                      className="week-event"
                      style={{ background: (COLOR_MAP[ev.color] ?? COLOR_MAP.blue) + '33', borderLeft: `2px solid ${COLOR_MAP[ev.color] ?? COLOR_MAP.blue}`, color: COLOR_MAP[ev.color] ?? COLOR_MAP.blue }}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev) }}
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────────── */
function computeRange(cursor, view) {
  if (view === 'month') {
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  } else {
    const start = new Date(cursor)
    const day = start.getDay()
    start.setDate(start.getDate() - day)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
}

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function weekRangeLabel(start, end) {
  const opts = { day: '2-digit', month: 'short' }
  return `${start.toLocaleDateString('pt-BR', opts)} – ${end.toLocaleDateString('pt-BR', opts)} ${end.getFullYear()}`
}
