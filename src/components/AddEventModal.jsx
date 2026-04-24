import { useState, useEffect, useRef } from 'react'
import './AddEventModal.css'

const COLORS = [
  { value: 'blue',   label: 'Azul' },
  { value: 'amber',  label: 'Âmbar' },
  { value: 'green',  label: 'Verde' },
  { value: 'purple', label: 'Roxo' },
  { value: 'red',    label: 'Vermelho' },
]

const DEFAULT_FORM = {
  title: '',
  start_at: '',
  end_at: '',
  all_day: false,
  color: 'blue',
  recurrence: 'none',
  recur_until: '',
}

export default function AddEventModal({ onClose, onSave, onDelete, initialData, defaultDate }) {
  const prefill = defaultDate
    ? {
        start_at: toLocalDateTimeInput(new Date(defaultDate.setHours(9, 0, 0, 0))),
        end_at:   toLocalDateTimeInput(new Date(defaultDate.setHours(10, 0, 0, 0))),
      }
    : {}

  const [form, setForm] = useState(
    initialData
      ? {
          title: initialData.title,
          start_at: toLocalDateTimeInput(new Date(initialData.start_at)),
          end_at:   toLocalDateTimeInput(new Date(initialData.end_at)),
          all_day: initialData.all_day,
          color: initialData.color,
          recurrence: initialData.recurrence,
          recur_until: initialData.recur_until ?? '',
        }
      : { ...DEFAULT_FORM, ...prefill }
  )
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  function set(field, value) {
    setForm(f => {
      const next = { ...f, [field]: value }
      // auto-advance end_at when start_at changes (keep 1-hour gap)
      if (field === 'start_at' && value && !f.all_day) {
        const start = new Date(value)
        if (!isNaN(start)) {
          start.setHours(start.getHours() + 1)
          next.end_at = toLocalDateTimeInput(start)
        }
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.start_at) return
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      start_at: new Date(form.start_at).toISOString(),
      end_at: form.all_day
        ? new Date(form.start_at).toISOString()
        : new Date(form.end_at).toISOString(),
      all_day: form.all_day,
      color: form.color,
      recurrence: form.recurrence,
      recur_until: form.recurrence !== 'none' && form.recur_until ? form.recur_until : null,
    }

    try {
      await onSave(payload)
      onClose()
    } catch {
      setSaving(false)
    }
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">{initialData ? 'Editar evento' : 'Novo evento'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <input
            ref={titleRef}
            className="modal-input modal-title-input"
            type="text"
            placeholder="Título do evento"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />

          {/* All-day toggle */}
          <label className="toggle-row">
            <input
              type="checkbox"
              className="toggle-checkbox"
              checked={form.all_day}
              onChange={(e) => set('all_day', e.target.checked)}
            />
            <span className="toggle-label">Dia inteiro</span>
          </label>

          {/* Time fields */}
          {form.all_day ? (
            <div className="modal-field">
              <label className="modal-label">Data</label>
              <input
                className="modal-input"
                type="date"
                value={form.start_at.slice(0, 10)}
                onChange={(e) => set('start_at', e.target.value + 'T00:00')}
                required
              />
            </div>
          ) : (
            <div className="modal-row">
              <div className="modal-field">
                <label className="modal-label">Início</label>
                <input
                  className="modal-input"
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => set('start_at', e.target.value)}
                  required
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">Fim</label>
                <input
                  className="modal-input"
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => set('end_at', e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Color */}
          <div className="modal-field">
            <label className="modal-label">Cor</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  className={`color-swatch color-${c.value} ${form.color === c.value ? 'selected' : ''}`}
                  onClick={() => set('color', c.value)}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Repetição</label>
              <select
                className="modal-select"
                value={form.recurrence}
                onChange={(e) => set('recurrence', e.target.value)}
              >
                <option value="none">Não repete</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option>
              </select>
            </div>

            {form.recurrence !== 'none' && (
              <div className="modal-field">
                <label className="modal-label">Repetir até</label>
                <input
                  className="modal-input"
                  type="date"
                  value={form.recur_until}
                  onChange={(e) => set('recur_until', e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="modal-actions">
            {onDelete && (
              <button type="button" className="btn-delete" onClick={onDelete}>
                Excluir
              </button>
            )}
            <div className="modal-actions-right">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-save" disabled={saving || !form.title.trim()}>
                {saving ? '...' : initialData ? 'Salvar' : 'Criar evento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function toLocalDateTimeInput(date) {
  if (!(date instanceof Date) || isNaN(date)) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
