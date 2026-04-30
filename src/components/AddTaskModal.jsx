import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { playModalClose, playTaskCreated } from '../lib/sounds'
import { ChevronDown, Bell } from 'lucide-react'
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

/* ─── Reminder presets ───────────────────────────────────────── */
const REMINDER_PRESETS = [
  { id: '',    label: 'Sem lembrete',  mins: null },
  { id: 'now', label: 'Na hora',       mins: 0    },
  { id: '5m',  label: '5 min antes',   mins: 5    },
  { id: '10m', label: '10 min antes',  mins: 10   },
  { id: '15m', label: '15 min antes',  mins: 15   },
  { id: '30m', label: '30 min antes',  mins: 30   },
  { id: '1h',  label: '1 hora antes',  mins: 60   },
  { id: '2h',  label: '2 horas antes', mins: 120  },
  { id: '1d',  label: '1 dia antes',   mins: 1440 },
]

/* ─── Parse reminder_offset_minutes → form state ─────────────── */
function parseReminderMinutes(mins) {
  if (mins == null) return { preset: '',     customValue: '30', customUnit: 'minutes' }
  if (mins === 0)   return { preset: 'now',  customValue: '30', customUnit: 'minutes' }
  const found = REMINDER_PRESETS.find(p => p.id !== '' && p.id !== 'now' && p.mins === mins)
  if (found) return { preset: found.id, customValue: '30', customUnit: 'minutes' }
  if (mins % 1440 === 0) return { preset: 'custom', customValue: String(mins / 1440), customUnit: 'days'    }
  if (mins % 60   === 0) return { preset: 'custom', customValue: String(mins / 60),   customUnit: 'hours'   }
  return                        { preset: 'custom', customValue: String(mins),         customUnit: 'minutes' }
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // Only pad to complete the last row (no extra rows)
  let next = 1
  const remainder = cells.length % 7
  if (remainder !== 0) {
    const toAdd = 7 - remainder
    const m = viewMonth === 11 ? 0  : viewMonth + 1
    const y = viewMonth === 11 ? viewYear + 1 : viewYear
    for (let i = 0; i < toAdd; i++) {
      cells.push({ day: next++, month: m, year: y, outside: true })
    }
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
        <ChevronDown size={10} strokeWidth={2} aria-hidden="true" />
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

/* ─── TimeInput ──────────────────────────────────────────────── */
function TimeInput({ valueH, valueM, onChangeH, onChangeM }) {
  const hRef = useRef(null)
  const mRef = useRef(null)
  // Store latest state in ref so wheel listeners never stale-close over values
  const api = useRef({ valueH, valueM, onChangeH, onChangeM })
  useLayoutEffect(() => {
    api.current = { valueH, valueM, onChangeH, onChangeM }
  })

  useEffect(() => {
    const hEl = hRef.current
    const mEl = mRef.current
    if (!hEl || !mEl) return
    function onWheelH(e) {
      e.preventDefault()
      const n = ((parseInt(api.current.valueH) || 0) + (e.deltaY < 0 ? 1 : -1) + 24) % 24
      api.current.onChangeH(String(n))
    }
    function onWheelM(e) {
      e.preventDefault()
      const n = ((parseInt(api.current.valueM) || 0) + (e.deltaY < 0 ? 1 : -1) + 60) % 60
      api.current.onChangeM(String(n))
    }
    hEl.addEventListener('wheel', onWheelH, { passive: false })
    mEl.addEventListener('wheel', onWheelM, { passive: false })
    return () => {
      hEl.removeEventListener('wheel', onWheelH)
      mEl.removeEventListener('wheel', onWheelM)
    }
  }, [])

  function handleHChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
    onChangeH(raw)
    if (raw.length === 2 && parseInt(raw) <= 23) {
      mRef.current?.focus()
      mRef.current?.select()
    }
  }
  function handleHBlur() {
    if (valueH === '') return
    const n = parseInt(valueH)
    if (isNaN(n)) { onChangeH(''); return }
    if (n > 23) onChangeH('23')
    else if (n < 0) onChangeH('0')
  }
  function handleMChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
    onChangeM(raw)
  }
  function handleMBlur() {
    if (valueM === '') return
    const n = parseInt(valueM)
    if (isNaN(n)) { onChangeM(''); return }
    if (n > 59) onChangeM('59')
    else if (n < 0) onChangeM('0')
  }

  return (
    <div className="time-hhmm">
      <input
        ref={hRef}
        className="modal-input time-part-input"
        type="text"
        inputMode="numeric"
        placeholder="HH"
        value={valueH}
        onChange={handleHChange}
        onBlur={handleHBlur}
      />
      <span className="time-colon">:</span>
      <input
        ref={mRef}
        className="modal-input time-part-input"
        type="text"
        inputMode="numeric"
        placeholder="MM"
        value={valueM}
        onChange={handleMChange}
        onBlur={handleMBlur}
      />
    </div>
  )
}

/* ─── ReminderInline ─────────────────────────────────────────── */
function ReminderInline({ disabled, preset, customValue, customUnit, onPresetChange, onCustomValueChange, onCustomUnitChange }) {
  const isSet   = preset !== ''
  const isNow   = preset === 'now'
  const isValue = isSet && !isNow

  const displayValue = (() => {
    if (preset === 'custom' || preset === '') return customValue
    const found = REMINDER_PRESETS.find(p => p.id === preset && p.mins > 0)
    if (!found) return customValue
    if (found.mins % 1440 === 0) return String(found.mins / 1440)
    if (found.mins % 60   === 0) return String(found.mins / 60)
    return String(found.mins)
  })()

  const displayUnit = (() => {
    if (preset === 'custom' || preset === '') return customUnit
    const found = REMINDER_PRESETS.find(p => p.id === preset && p.mins > 0)
    if (!found) return customUnit
    if (found.mins % 1440 === 0) return 'days'
    if (found.mins % 60   === 0) return 'hours'
    return 'minutes'
  })()

  function activate() {
    onPresetChange('custom')
    onCustomValueChange('30')
    onCustomUnitChange('minutes')
  }

  return (
    <div
      className={`rinline-root${isSet ? ' is-set' : ''}${disabled ? ' disabled' : ''}`}
      {...(disabled ? { 'data-tooltip': 'Defina um horário para ativar o lembrete' } : {})}
    >
      <span className="rinline-icon">
        <Bell size={14} strokeWidth={1.8} aria-hidden="true" />
      </span>

      {!isSet && (
        <button type="button" className="rinline-add" onClick={activate}>
          Adicionar lembrete
        </button>
      )}

      {isNow && (
        <>
          <span className="rinline-now-text">Na hora</span>
          <button type="button" className="rinline-clear" onClick={() => onPresetChange('')} aria-label="Remover lembrete">×</button>
        </>
      )}

      {isValue && (
        <>
          <input
            type="text"
            inputMode="numeric"
            className="rinline-num"
            value={displayValue}
            onChange={e => {
              onPresetChange('custom')
              onCustomValueChange(e.target.value.replace(/\D/g, '').slice(0, 4))
            }}
          />
          <UnitDropdown value={displayUnit} onChange={v => { onPresetChange('custom'); onCustomUnitChange(v) }} />
          <span className="rinline-antes">antes</span>
          <span className="rinline-sep" aria-hidden="true" />
          <button type="button" className="rinline-naahora" onClick={() => onPresetChange('now')}>Na hora</button>
          <button type="button" className="rinline-clear" onClick={() => onPresetChange('')} aria-label="Remover lembrete">×</button>
        </>
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
        scheduledH = String(d.getHours())
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
      reminderPreset:      r.preset,
      reminderCustomValue: r.customValue,
      reminderCustomUnit:  r.customUnit,
      isDaily:         initialData?.is_daily ?? false,
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

  const hasScheduledTime = (() => {
    const hasTime = form.scheduledH !== '' || form.scheduledM !== ''
    if (!hasTime) return false
    if (form.scheduledDate) return true
    // Time only — enable reminder if the time is still in the future today
    const h = parseInt(form.scheduledH) || 0
    const m = parseInt(form.scheduledM) || 0
    const now = new Date()
    const t = new Date(); t.setHours(h, m, 0, 0)
    return t > now
  })()

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
    const effectiveDate = form.isDaily ? null : form.scheduledDate
    if (hasTime && !effectiveDate) {
      const d = new Date(); d.setHours(h, m, 0, 0)
      scheduled_at = d.toISOString()
    } else if (effectiveDate) {
      const d = new Date(effectiveDate)
      if (hasTime) d.setHours(h, m, 0, 0); else d.setHours(0, 0, 0, 0)
      scheduled_at = d.toISOString()
    }

    let reminder_offset_minutes = null
    if (hasScheduledTime) {
      if (form.reminderPreset === 'now') {
        reminder_offset_minutes = 0
      } else if (form.reminderPreset === 'custom') {
        const v = parseInt(form.reminderCustomValue)
        if (v > 0) {
          reminder_offset_minutes =
            form.reminderCustomUnit === 'hours' ? v * 60   :
            form.reminderCustomUnit === 'days'  ? v * 1440 : v
        }
      } else if (form.reminderPreset !== '') {
        reminder_offset_minutes = REMINDER_PRESETS.find(p => p.id === form.reminderPreset)?.mins ?? null
      }
    }

    const payload = {
      title: form.title.trim(),
      scheduled_at,
      estimated_minutes:      totalMins > 0 ? totalMins : null,
      reminder_offset_minutes,
      is_daily: form.isDaily,
    }

    try {
      await new Promise(r => setTimeout(r, 360))
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

          <div className={`intention-fields-wrap${showWhen ? ' open' : ''}`}>
            <div className="intention-fields-inner">
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
                  <TimeInput
                    valueH={form.scheduledH}
                    valueM={form.scheduledM}
                    onChangeH={(v) => set('scheduledH', v)}
                    onChangeM={(v) => set('scheduledM', v)}
                  />
                </div>
              </div>

              {/* Linha 2 — Duração */}
              <div className="modal-row modal-row--single">
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
              </div>

              {/* Linha 3 — Lembrete */}
              <div className="modal-row modal-row--single">
                <div className="modal-field">
                  <label className="modal-label">Lembrete</label>
                  <ReminderInline
                    disabled={!hasScheduledTime}
                    preset={form.reminderPreset}
                    customValue={form.reminderCustomValue}
                    customUnit={form.reminderCustomUnit}
                    onPresetChange={(v)      => set('reminderPreset', v)}
                    onCustomValueChange={(v) => set('reminderCustomValue', v)}
                    onCustomUnitChange={(v)  => set('reminderCustomUnit', v)}
                  />
                </div>
              </div>

              {/* Linha 4 — Repetir diariamente */}
              <div className="modal-row-daily">
                <button
                  type="button"
                  className={`daily-toggle${form.isDaily ? ' on' : ''}`}
                  onClick={() => setForm(f => ({ ...f, isDaily: !f.isDaily, scheduledDate: !f.isDaily ? null : f.scheduledDate }))}
                  aria-pressed={form.isDaily}
                  aria-label="Repetir diariamente"
                >
                  <span className="daily-toggle-knob" />
                </button>
                <span className="daily-toggle-label">Repetir diariamente</span>
              </div>
            </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving || !form.title.trim()}>
              <span className={`btn-save-text${saving ? ' hidden' : ''}`}>
                {isEdit ? 'Salvar' : 'Criar tarefa'}
              </span>
              {saving && <div className="btn-spinner-wrap"><ModalSpinner /></div>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
