import { useState, useEffect, useRef } from 'react'
import { playModalClose } from '../lib/sounds'
import './AddTaskModal.css'

const DEFAULT_FORM = {
  title: '',
  date: '',       // YYYY-MM-DD
  time: '',       // HH:MM
  estimated_minutes: '',
}

/** Format a date string (YYYY-MM-DD) in Brazilian long format */
function formatDateBR(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export default function AddTaskModal({ onClose, onSave, initialData }) {
  const isEdit = !!initialData

  function parseInitial() {
    if (!initialData) return DEFAULT_FORM
    if (!initialData.scheduled_at) return { ...DEFAULT_FORM, title: initialData.title }
    const d = new Date(initialData.scheduled_at)
    const pad = n => String(n).padStart(2, '0')
    return {
      title: initialData.title,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      estimated_minutes: initialData.estimated_minutes ?? '',
    }
  }

  const [form, setForm] = useState(parseInitial)
  const [showWhen, setShowWhen] = useState(
    !!(initialData?.scheduled_at || initialData?.estimated_minutes)
  )
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => { titleRef.current?.focus() }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleCancel() {
    playModalClose()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    let scheduled_at = null
    if (form.date) {
      const combined = form.time ? `${form.date}T${form.time}` : `${form.date}T00:00`
      scheduled_at = new Date(combined).toISOString()
    }

    const payload = {
      title: form.title.trim(),
      scheduled_at,
      estimated_minutes: form.estimated_minutes ? Number(form.estimated_minutes) : null,
    }

    try {
      await onSave(payload)
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

  const dateLabelBR = formatDateBR(form.date)

  return (
    <div className="modal-backdrop" onClick={handleBackdrop} onKeyDown={handleKeyDown}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar tarefa' : 'Nova tarefa'}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button className="modal-close" onClick={handleCancel} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Title */}
          <input
            ref={titleRef}
            className="modal-input modal-title-input"
            type="text"
            placeholder="O que precisa ser feito?"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
          />

          {/* When + duration toggle */}
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
              {/* Date + time side by side */}
              <div className="modal-row">
                <div className="modal-field">
                  <label className="modal-label">Data</label>
                  <div className="date-input-wrap">
                    {dateLabelBR && (
                      <span className="date-display">{dateLabelBR}</span>
                    )}
                    <input
                      className={`modal-input date-native ${dateLabelBR ? 'has-value' : ''}`}
                      type="date"
                      value={form.date}
                      onChange={(e) => set('date', e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-field">
                  <label className="modal-label">Horário</label>
                  <input
                    className="modal-input"
                    type="time"
                    value={form.time}
                    onChange={(e) => set('time', e.target.value)}
                    disabled={!form.date}
                  />
                </div>
              </div>

              {/* Duration */}
              <div className="modal-field">
                <label className="modal-label">Duração (minutos)</label>
                <input
                  className="modal-input"
                  type="number"
                  min="1"
                  max="720"
                  step="5"
                  placeholder="Ex: 30"
                  value={form.estimated_minutes}
                  onChange={(e) => set('estimated_minutes', e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving || !form.title.trim()}>
              {saving ? '...' : isEdit ? 'Salvar' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
