import { useState, useEffect, useRef } from 'react'
import DatePicker, { registerLocale } from 'react-datepicker'
import { ptBR } from 'date-fns/locale'
import 'react-datepicker/dist/react-datepicker.css'
import { playModalClose } from '../lib/sounds'
import './AddTaskModal.css'

registerLocale('pt-BR', ptBR)

export default function AddTaskModal({ onClose, onSave, initialData }) {
  const isEdit = !!initialData

  function parseInitial() {
    return {
      title: initialData?.title ?? '',
      scheduledDate: initialData?.scheduled_at ? new Date(initialData.scheduled_at) : null,
      estimatedMinutes: initialData?.estimated_minutes ?? '',
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

    const payload = {
      title: form.title.trim(),
      scheduled_at: form.scheduledDate ? form.scheduledDate.toISOString() : null,
      estimated_minutes: form.estimatedMinutes !== '' ? Number(form.estimatedMinutes) : null,
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
            className="modal-input modal-title-input"
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
                <div className="modal-field">
                  <label className="modal-label">Data e horário</label>
                  <DatePicker
                    selected={form.scheduledDate}
                    onChange={(date) => set('scheduledDate', date)}
                    showTimeSelect
                    dateFormat="dd/MM/yyyy HH:mm"
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    locale="pt-BR"
                    placeholderText="Selecionar..."
                    className="modal-input datepicker-input"
                    calendarClassName="eywa-datepicker"
                    isClearable
                    autoComplete="off"
                    popperPlacement="bottom-start"
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Duração (min)</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="1"
                    step="1"
                    max="1440"
                    placeholder="Ex: 45"
                    value={form.estimatedMinutes}
                    onChange={(e) => set('estimatedMinutes', e.target.value)}
                  />
                </div>
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

