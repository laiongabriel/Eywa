import { useState, useEffect, useRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import { playModalClose, playTaskCreated } from '../lib/sounds'
import './AddTaskModal.css'

registerLocale('pt-BR', ptBR)

function ModalSpinner() {
  return (
    <svg className="btn-spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeDasharray="28" strokeDashoffset="10" />
    </svg>
  )
}

export default function AddTaskModal({ onClose, onSave, initialData }) {
  const isEdit = !!initialData

  function parseInitial() {
    const mins = initialData?.estimated_minutes
    let scheduledDate = null
    let scheduledH = ''
    let scheduledM = ''
    if (initialData?.scheduled_at) {
      const d = new Date(initialData.scheduled_at)
      scheduledDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      if (d.getHours() !== 0 || d.getMinutes() !== 0) {
        scheduledH = String(d.getHours())
        scheduledM = String(d.getMinutes())
      }
    }
    return {
      title: initialData?.title ?? '',
      scheduledDate,
      scheduledH,
      scheduledM,
      durationH: mins ? String(Math.floor(mins / 60) || '') : '',
      durationM: mins ? String(mins % 60 || '')           : '',
    }
  }

  const [form, setForm]           = useState(parseInitial)
  const [showWhen, setShowWhen]   = useState(!!(initialData?.scheduled_at || initialData?.estimated_minutes))
  const [saving, setSaving]       = useState(false)
  const titleRef                  = useRef(null)

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

    const totalMins = Number(form.durationH || 0) * 60 + Number(form.durationM || 0)

    let scheduled_at = null
    const hasTime = form.scheduledH !== '' || form.scheduledM !== ''
    const h = parseInt(form.scheduledH) || 0
    const m = parseInt(form.scheduledM) || 0
    if (hasTime && !form.scheduledDate) {
      // Only time → assume today
      const d = new Date(); d.setHours(h, m, 0, 0)
      scheduled_at = d.toISOString()
    } else if (form.scheduledDate) {
      const d = new Date(form.scheduledDate)
      if (hasTime) { d.setHours(h, m, 0, 0) } else { d.setHours(0, 0, 0, 0) }
      scheduled_at = d.toISOString()
    }

    const payload = {
      title: form.title.trim(),
      scheduled_at,
      estimated_minutes: totalMins > 0 ? totalMins : null,
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
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar tarefa' : 'Nova tarefa'}>
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
                  <DatePicker
                    selected={form.scheduledDate}
                    onChange={(date) => set('scheduledDate', date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null)}
                    dateFormat="dd/MM/yyyy"
                    locale="pt-BR"
                    placeholderText="DD/MM/AAAA"
                    className="modal-input datepicker-input"
                    calendarClassName="eywa-datepicker"
                    wrapperClassName="datepicker-wrapper"
                    popperClassName="eywa-datepicker-popper"
                    isClearable
                    autoComplete="off"
                    popperPlacement="bottom-start"
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
              <div className="modal-row modal-row--duration">
                <div className="modal-field">
                  <label className="modal-label">Duração</label>
                  <div className="duration-row">
                    <input
                      className="modal-input duration-input"
                      type="number"
                      min="0" max="23" step="1"
                      placeholder="0"
                      value={form.durationH}
                      onChange={(e) => set('durationH', e.target.value)}
                    />
                    <span className="duration-sep">h</span>
                    <input
                      className="modal-input duration-input"
                      type="number"
                      min="0" max="59" step="1"
                      placeholder="0"
                      value={form.durationM}
                      onChange={(e) => set('durationM', e.target.value)}
                    />
                    <span className="duration-sep">min</span>
                  </div>
                </div>
              </div>
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

