import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
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
  if (mins == null) return { enabled: false, now: false, value: '30', unit: 'minutes' }
  if (mins === 0)   return { enabled: true,  now: true,  value: '30', unit: 'minutes' }
  if (mins % 1440 === 0) return { enabled: true, now: false, value: String(mins / 1440), unit: 'days'    }
  if (mins % 60   === 0) return { enabled: true, now: false, value: String(mins / 60),   unit: 'hours'   }
  return                        { enabled: true, now: false, value: String(mins),         unit: 'minutes' }
}

/* ─── Icons ──────────────────────────────────────────────────── */
function ChevronUpIcon() {
  return (
    <svg width="8" height="5" viewBox="0 0 8 5" fill="none" aria-hidden="true">
      <path d="M1 4.5L4 1 7 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ChevronDownIcon() {
  return (
    <svg width="8" height="5" viewBox="0 0 8 5" fill="none" aria-hidden="true">
      <path d="M1 0.5L4 4 7 0.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function SmallChevron() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ─── SpinField ──────────────────────────────────────────────── */
const SpinField = forwardRef(function SpinField(
  { value, min, max, onChange, placeholder, onNext }, ref
) {
  const inputRef = useRef(null)
  // Always-current callback ref so wheel handler never sees stale closures
  const cb = useRef(null)
  cb.current = { value, min, max, onChange }

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), [])

  // Wheel — must be non-passive to call preventDefault
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const handler = (e) => {
      e.preventDefault()
      const { value, min, max, onChange } = cb.current
      const v = parseInt(value) || 0
      if (e.deltaY < 0) onChange(String(Math.min(max, v + 1)).padStart(2, '0'))
      else if (v > min)  onChange(String(Math.max(min, v - 1)).padStart(2, '0'))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  function increment() {
    const { value, max, onChange } = cb.current
    onChange(String(Math.min(max, (parseInt(value) || 0) + 1)).padStart(2, '0'))
  }
  function decrement() {
    const { value, min, onChange } = cb.current
    const v = parseInt(value) || 0
    if (v <= min) return
    onChange(String(Math.max(min, v - 1)).padStart(2, '0'))
  }

  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
    if (raw === '') { onChange(''); return }
    const num = parseInt(raw)
    if (num > max) return
    onChange(raw)
    // Auto-advance when value is complete
    if (raw.length === 2 || num * 10 > max) {
      if (onNext) onNext()
    }
  }

  function handleBlur() {
    if (value !== '' && value != null) {
      const num = parseInt(value)
      if (!isNaN(num)) onChange(String(Math.min(max, Math.max(min, num))).padStart(2, '0'))
    }
  }

  return (
    <div className="spin-field">
      <button type="button" className="spin-arrow" onClick={increment} tabIndex={-1} aria-label="Aumentar">
        <ChevronUpIcon />
      </button>
      <input
        ref={inputRef}
        type="text"
        className="spin-input"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={2}
        inputMode="numeric"
        autoComplete="off"
      />
      <button type="button" className="spin-arrow" onClick={decrement} tabIndex={-1} aria-label="Diminuir">
        <ChevronDownIcon />
      </button>
    </div>
  )
})

/* ─── CustomTimePicker ───────────────────────────────────────── */
function CustomTimePicker({ hour, minute, onHourChange, onMinuteChange }) {
  const minuteRef = useRef(null)
  return (
    <div className="ctp-root">
      <SpinField
        value={hour}
        min={0} max={23}
        onChange={onHourChange}
        placeholder="HH"
        onNext={() => minuteRef.current?.focus()}
      />
      <span className="ctp-colon">:</span>
      <SpinField
        ref={minuteRef}
        value={minute}
        min={0} max={59}
        onChange={onMinuteChange}
        placeholder="MM"
      />
    </div>
  )
}

/* ─── CustomDuration ─────────────────────────────────────────── */
function CustomDuration({ hours, minutes, onHoursChange, onMinutesChange }) {
  const minutesRef = useRef(null)
  return (
    <div className="cdur-root">
      <SpinField
        value={hours}
        min={0} max={99}
        onChange={onHoursChange}
        placeholder="0"
        onNext={() => minutesRef.current?.focus()}
      />
      <span className="cdur-sep">h</span>
      <SpinField
        ref={minutesRef}
        value={minutes}
        min={0} max={59}
        onChange={onMinutesChange}
        placeholder="0"
      />
      <span className="cdur-sep">min</span>
    </div>
  )
}

/* ─── CustomDatePicker ───────────────────────────────────────── */
function CustomDatePicker({ value, onChange }) {
  const [open, setOpen]           = useState(false)
  const [viewYear, setViewYear]   = useState(() => value?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => value?.getMonth()    ?? new Date().getMonth())
  const [animKey, setAnimKey]     = useState(0)
  const [slideDir, setSlideDir]   = useState('left')
  const containerRef              = useRef(null)

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

  const today      = (() => { const d = new Date(); d.setHours(0,0,0,0); return d })()
  const firstDay   = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate()
  const cells = []

  // Leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const m = viewMonth === 0  ? 11 : viewMonth - 1
    const y = viewMonth === 0  ? viewYear - 1 : viewYear
    cells.push({ day: daysInPrev - i, month: m, year: y, outside: true })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, outside: false })
  }
  // Trailing days from next month (fill to 42 = 6 rows)
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

/* ─── ReminderField ──────────────────────────────────────────── */
function ReminderField({
  visible, enabled, now, value, unit,
  onEnabledChange, onNowChange, onValueChange, onUnitChange,
}) {
  if (!visible) return null

  return (
    <div className="reminder-field">
      <label className="reminder-toggle-row">
        <input
          type="checkbox"
          className="reminder-check"
          checked={enabled}
          onChange={(e) => onEnabledChange(e.target.checked)}
        />
        <span className="reminder-toggle-label">Lembrete</span>
      </label>

      {enabled && (
        <div className="reminder-details">
          {!now && (
            <div className="reminder-before-row">
              <input
                type="number"
                className="reminder-value-input"
                min="1"
                max="9999"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
              />
              <UnitDropdown value={unit} onChange={onUnitChange} />
              <span className="reminder-before-text">antes</span>
            </div>
          )}
          <label className="reminder-now-row">
            <input
              type="checkbox"
              className="reminder-check"
              checked={now}
              onChange={(e) => onNowChange(e.target.checked)}
            />
            <span>Na hora</span>
          </label>
        </div>
      )}
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
        scheduledH = String(d.getHours()).padStart(2, '0')
        scheduledM = String(d.getMinutes()).padStart(2, '0')
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
      reminderEnabled: r.enabled,
      reminderNow:     r.now,
      reminderValue:   r.value,
      reminderUnit:    r.unit,
    }
  }

  const [form, setForm]         = useState(parseInitial)
  const [showWhen, setShowWhen] = useState(!!(initialData?.scheduled_at || initialData?.estimated_minutes))
  const [saving, setSaving]     = useState(false)
  const titleRef                = useRef(null)

  // Delay focus past the slide-up animation (removes text/caret jump)
  useEffect(() => {
    const id = setTimeout(() => titleRef.current?.focus({ preventScroll: true }), 270)
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
    if (hasScheduledTime && form.reminderEnabled) {
      if (form.reminderNow) {
        reminder_offset_minutes = 0
      } else {
        const v = parseInt(form.reminderValue) || 0
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
                  <CustomTimePicker
                    hour={form.scheduledH}
                    minute={form.scheduledM}
                    onHourChange={(v) => set('scheduledH', v)}
                    onMinuteChange={(v) => set('scheduledM', v)}
                  />
                </div>
              </div>

              <div className="modal-row modal-row--single">
                <div className="modal-field">
                  <label className="modal-label">Duração</label>
                  <CustomDuration
                    hours={form.durationH}
                    minutes={form.durationM}
                    onHoursChange={(v) => set('durationH', v)}
                    onMinutesChange={(v) => set('durationM', v)}
                  />
                </div>
              </div>

              <ReminderField
                visible={hasScheduledTime}
                enabled={form.reminderEnabled}
                now={form.reminderNow}
                value={form.reminderValue}
                unit={form.reminderUnit}
                onEnabledChange={(v) => set('reminderEnabled', v)}
                onNowChange={(v)     => set('reminderNow', v)}
                onValueChange={(v)   => set('reminderValue', v)}
                onUnitChange={(v)    => set('reminderUnit', v)}
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving || !form.title.trim()}>
              {saving ? <ModalSpinner /> : isEdit ? 'Salvar' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
