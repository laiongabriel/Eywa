import { useState, useEffect, useRef } from 'react'
import { playModalClose, playTaskCreated } from '../lib/sounds'
import './AddTaskModal.css'

/* ─── Constants ──────────────────────────────────────────────── */
const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const DAY_NAMES = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const UNIT_OPTIONS = [
  { value: 'minutes', label: 'minutos' },
  { value: 'hours',   label: 'horas'   },
  { value: 'days',    label: 'dias'    },
]

/* ─── Parse reminder_offset_minutes → form state ─────────────── */
function parseReminderMinutes(mins) {
  if (mins == null) return { now: false, value: '',             unit: 'minutes' }
  if (mins === 0)   return { now: true,  value: '',             unit: 'minutes' }
  if (mins % 1440 === 0) return { now: false, value: String(mins / 1440), unit: 'days'    }
  if (mins % 60   === 0) return { now: false, value: String(mins / 60),   unit: 'hours'   }
  return                        { now: false, value: String(mins),         unit: 'minutes' }
}

/* ─── SmallChevron ───────────────────────────────────────────── */
function SmallChevron() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ─── CustomDatePicker ───────────────────────────────────────── */
function CustomDatePicker({ value, onChange }) {
  const [open, setOpen]           = useState(false)
  const [viewYear, setViewYear]   = useState(() => new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth())
  const [animKey, setAnimKey]     = useState(0)
  const [slideDir, setSlideDir]   = useState('left')
  const containerRef              = useRef(null)

  // Reset to current month every time the calendar opens
  useEffect(() => {
    if (open) {
      const now = new Date()
      setViewYear(now.getFullYear())
      setViewMonth(now.getMonth())
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function navigate(dir) {
    setSlideDir(dir === 'prev' ? 'right' : 'left')
    setAnimKey(k => k + 1)
    if (dir === 'prev') {
      if (viewMonth === 0)  { setViewMonth(11); setViewYear(y => y - 1) }
      else setViewMonth(m => m - 1)
    } else {
      if (viewMonth === 11) { setViewMonth(0);  setViewYear(y => y + 1) }
      else setViewMonth(m => m + 1)
    }
  }

  const today       = (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate()
  const cells = []

  for (let i = firstDay - 1; i >= 0; i--) {
    const m = viewMonth === 0  ? 11 : viewMonth - 1
    const y = viewMonth === 0  ? viewYear - 1 : viewYear
    cells.push({ day: daysInPrev - i, month: m, year: y, outside: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, outside: false })
  }
  let next = 1
  while (cells.length < 42) {
    const m = viewMonth === 11 ? 0  : viewMonth + 1
    const y = viewMonth === 11 ? viewYear + 1 : viewYear
    cells.push({ day: next++, month: m, year: y, outside: true })
  }

  function isSame(d1, d2) {
    if (!d1 || !d2) return false
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth()    === d2.getMonth()    &&
           d1.getDate()     === d2.getDate()
  }

  const displayValue = value
    ? `${String(value.getDate()).padStart(2,'0')}/${String(value.getMonth()+1).padStart(2,'0')}/${value.getFullYear()}`
    : ''

  return (
    <div className="cdp-root" ref={containerRef}>
      <div className="cdp-input-wrap">
        <input
          type="text"
          className="modal-input cdp-input"
          value={displayValue}
          placeholder="DD/MM/AAAA"
          readOnly
          onClick={() => setOpen(v => !v)}
        />
        {value && (
          <button
            type="button"
            className="cdp-clear"
            onMouseDown={(e) => { e.preventDefault(); onChange(null); setOpen(false) }}
            aria-label="Limpar data"
          >×</button>
        )}
      </div>

      {open && (
        <div className="cdp-panel">
          <div className="cdp-header">
            <button type="button" className="cdp-nav" onClick={() => navigate('prev')}>‹</button>
            <span className="cdp-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" className="cdp-nav" onClick={() => navigate('next')}>›</button>
          </div>

          <div className="cdp-weekdays">
            {DAY_NAMES.map(d => <span key={d} className="cdp-wday">{d}</span>)}
          </div>

          <div className={`cdp-grid cdp-slide-${slideDir}`} key={animKey}>
            {cells.map((cell, i) => {
              const cellDate = new Date(cell.year, cell.month, cell.day)
              const isToday  = isSame(cellDate, today)
              const isSel    = isSame(cellDate, value)
              return (
                <button
                  key={i}
                  type="button"
                  className={[
                    'cdp-day',
                    cell.outside ? 'out' : '',
                    isToday      ? 'tod' : '',
                    isSel        ? 'sel' : '',
                  ].filter(Boolean).join(' ')}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (!cell.outside) {
                      onChange(new Date(cell.year, cell.month, cell.day))
                      setOpen(false)
                    }
                  }}
                  tabIndex={cell.outside ? -1 : 0}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── UnitDropdown ───────────────────────────────────────────── */
function UnitDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const label = UNIT_OPTIONS.find(o => o.value === value)?.label ?? 'minutos'

  useEffect(() => {
    if (!open) return
    function onDown(e) { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="unit-dd" ref={ref}>
      <button
        type="button"
        className={`unit-dd-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span>{label}</span>
        <SmallChevron />
      </button>
      {open && (
        <div className="unit-dd-menu">
          {UNIT_OPTIONS.map(opt => (
            <div
              key={opt.value}
              className={`unit-dd-opt${opt.value === value ? ' sel' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── BellIcon ───────────────────────────────────────────────── */
function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="reminder-bell-icon">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ─── ReminderInlineField ────────────────────────────────────── */
function ReminderInlineField({ hasTime, now, value, unit, onNowChange, onValueChange, onUnitChange }) {
  const disabled = !hasTime
  return (
    <div
      className="modal-field"
      data-tooltip={disabled ? 'Defina um horário para ativar o lembrete' : undefined}
    >
      <label className="modal-label">Lembrete</label>
      <div className={`reminder-inline-row${disabled ? ' disabled' : ''}`}>
        <BellIcon />
        {now ? (
          <button
            type="button"
            className="reminder-now-pill active"
            onClick={() => onNowChange(false)}
          >
            Na hora
          </button>
        ) : (
          <>
            <input
              type="number"
              className="modal-input duration-input"
              min="1" max="9999"
              value={value}
              placeholder="–"
              onChange={(e) => onValueChange(e.target.value)}
            />
            <UnitDropdown value={unit} onChange={onUnitChange} />
            <span className="duration-sep">antes</span>
            <button
              type="button"
              className="reminder-now-pill"
              onClick={() => onNowChange(true)}
            >
              Na hora
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── ModalSpinner ───────────────────────────────────────────── */
function ModalSpinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" />
    </svg>
  )
}

/* ─── AddTaskModal ───────────────────────────────────────────── */
export default function AddTaskModal({ onClose, onSave, initialData }) {
  const isEdit = !!initialData

  function parseInitial() {
    const mins = initialData?.estimated_minutes
    let scheduledDate = null, scheduledH = '', scheduledM = ''
    if (initialData?.scheduled_at) {
      const d = new Date(initialData.scheduled_at)
      scheduledDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      if (d.getHours() !== 0 || d.getMinutes() !== 0) {
        scheduledH = String(d.getHours())
        scheduledM = String(d.getMinutes())
      }
    }
    const r = parseReminderMinutes(initialData?.reminder_offset_minutes ?? null)
    return {
      title:           initialData?.title ?? '',
      scheduledDate,
      scheduledH,
      scheduledM,
      durationH:       mins ? String(Math.floor(mins / 60) || '') : '',
      durationM:       mins ? String(mins % 60 || '')             : '',
      reminderNow:     r.now,
      reminderValue:   r.value,
      reminderUnit:    r.unit,
    }
  }

  const [form, setForm]         = useState(parseInitial)
  const [showWhen, setShowWhen] = useState(!!(initialData?.scheduled_at || initialData?.estimated_minutes))
  const [saving, setSaving]     = useState(false)
  const titleRef                = useRef(null)

  // Short delay past the slide-up animation to avoid caret/text jump
  useEffect(() => {
    const id = setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 160)
    return () => clearTimeout(id)
  }, [])

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
  }

  const hasScheduledTime = !!(
    form.scheduledDate && (form.scheduledH !== '' || form.scheduledM !== '')
  )

  function handleCancel() { playModalClose(); onClose() }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    const totalMins = Number(form.durationH || 0) * 60 + Number(form.durationM || 0)
    const hasTime   = form.scheduledH !== '' || form.scheduledM !== ''
    const h = parseInt(form.scheduledH) || 0
    const m = parseInt(form.scheduledM) || 0

    let scheduled_at = null
    if (hasTime && !form.scheduledDate) {
      const d = new Date(); d.setHours(h, m, 0, 0)
      scheduled_at = d.toISOString()
    } else if (form.scheduledDate) {
      const d = new Date(form.scheduledDate)
      if (hasTime) d.setHours(h, m, 0, 0); else d.setHours(0, 0, 0, 0)
      scheduled_at = d.toISOString()
    }

    let reminder_offset_minutes = null
    if (hasScheduledTime) {
      if (form.reminderNow) {
        reminder_offset_minutes = 0
      } else if (form.reminderValue && parseInt(form.reminderValue) > 0) {
        const v = parseInt(form.reminderValue)
        reminder_offset_minutes =
          form.reminderUnit === 'hours' ? v * 60  :
          form.reminderUnit === 'days'  ? v * 1440 : v
      }
    }

    const payload = {
      title: form.title.trim(),
      scheduled_at,
      estimated_minutes:      totalMins > 0 ? totalMins : null,
      reminder_offset_minutes,
    }

    try {
      await onSave(payload)
      playTaskCreated()
      onClose()
    } catch {
      setSaving(false)
    }
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) { playModalClose(); onClose() }
  }
  function handleKeyDown(e) {
    if (e.key === 'Escape') { playModalClose(); onClose() }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop} onKeyDown={handleKeyDown}>
      <div className="modal-card" role="dialog" aria-modal="true"
           aria-label={isEdit ? 'Editar tarefa' : 'Nova tarefa'}>

        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button className="modal-close" onClick={handleCancel} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <input
            ref={titleRef}
            className="modal-input modal-title-input modal-task-title-input"
            type="text"
            placeholder="O que precisa ser feito?"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />

          <button
            type="button"
            className={`intention-toggle ${showWhen ? 'open' : ''}`}
            onClick={() => setShowWhen(v => !v)}
          >
            <span className={`intention-arrow ${showWhen ? 'open' : ''}`}>›</span>
            Quando e por quanto tempo?
          </button>

          {showWhen && (
            <div className="intention-fields">
              {/* Date + Time */}
              <div className="modal-row">
                <div className="modal-field modal-field--date">
                  <label className="modal-label">Data</label>
                  <CustomDatePicker
                    value={form.scheduledDate}
                    onChange={(date) => set('scheduledDate', date)}
                  />
                </div>
                <div className="modal-field modal-field--time">
                  <label className="modal-label">Horário</label>
                  <div className="time-hhmm">
                    <input
                      className="modal-input time-part-input"
                      type="number" min="0" max="23" step="1"
                      placeholder="HH"
                      value={form.scheduledH}
                      onChange={(e) => set('scheduledH', e.target.value)}
                    />
                    <span className="time-colon">:</span>
                    <input
                      className="modal-input time-part-input"
                      type="number" min="0" max="59" step="1"
                      placeholder="MM"
                      value={form.scheduledM}
                      onChange={(e) => set('scheduledM', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Duration + Reminder */}
              <div className="modal-row modal-row--dur-rem">
                <div className="modal-field">
                  <label className="modal-label">Duração</label>
                  <div className="duration-row">
                    <input
                      className="modal-input duration-input"
                      type="number" min="0" max="99" step="1"
                      placeholder="0"
                      value={form.durationH}
                      onChange={(e) => set('durationH', e.target.value)}
                    />
                    <span className="duration-sep">h</span>
                    <input
                      className="modal-input duration-input"
                      type="number" min="0" max="59" step="1"
                      placeholder="0"
                      value={form.durationM}
                      onChange={(e) => set('durationM', e.target.value)}
                    />
                    <span className="duration-sep">min</span>
                  </div>
                </div>
                <ReminderInlineField
                  hasTime={hasScheduledTime}
                  now={form.reminderNow}
                  value={form.reminderValue}
                  unit={form.reminderUnit}
                  onNowChange={(v)   => set('reminderNow', v)}
                  onValueChange={(v) => set('reminderValue', v)}
                  onUnitChange={(v)  => set('reminderUnit', v)}
                />
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving || !form.title.trim()}>
              <span className={`btn-save-text${saving ? ' hidden' : ''}`}>
                {isEdit ? 'Salvar' : 'Criar tarefa'}
              </span>
              {saving && <ModalSpinner />}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
