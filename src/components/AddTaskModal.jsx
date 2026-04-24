import { useState, useEffect, useRef } from 'react'
import './AddTaskModal.css'

const DEFAULT_FORM = {
  title: '',
  priority: 'medium',
  due_date: '',
  scheduled_at: '',
  estimated_minutes: '',
}

export default function AddTaskModal({ onClose, onSave, initialData }) {
  const [form, setForm] = useState(initialData ? {
    title: initialData.title,
    priority: initialData.priority,
    due_date: initialData.due_date ?? '',
    scheduled_at: initialData.scheduled_at
      ? new Date(initialData.scheduled_at).toISOString().slice(0, 16)
      : '',
    estimated_minutes: initialData.estimated_minutes ?? '',
  } : DEFAULT_FORM)

  const [showIntention, setShowIntention] = useState(
    !!(initialData?.scheduled_at || initialData?.estimated_minutes)
  )
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      priority: form.priority,
      due_date: form.due_date || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
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
    if (e.target === e.currentTarget) onClose()
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop} onKeyDown={handleKeyDown}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Nova tarefa">
        <div className="modal-header">
          <h2 className="modal-title">{initialData ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
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

          {/* Priority + Due date row */}
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Prioridade</label>
              <select
                className="modal-select"
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div className="modal-field">
              <label className="modal-label">Data limite</label>
              <input
                className="modal-input"
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
              />
            </div>
          </div>

          {/* Implementation intention toggle */}
          <button
            type="button"
            className="intention-toggle"
            onClick={() => setShowIntention(v => !v)}
          >
            <span className={`intention-arrow ${showIntention ? 'open' : ''}`}>›</span>
            Quando e por quanto tempo?
            <span className="intention-badge">+3× de execução</span>
          </button>

          {showIntention && (
            <div className="intention-fields">
              <p className="intention-hint">
                Declarar quando e por quanto tempo você vai fazer uma tarefa aumenta a
                probabilidade de execução em até 3× — <em>implementation intention</em> (Gollwitzer).
              </p>
              <div className="modal-row">
                <div className="modal-field">
                  <label className="modal-label">Quando</label>
                  <input
                    className="modal-input"
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(e) => set('scheduled_at', e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Duração (min)</label>
                  <input
                    className="modal-input"
                    type="number"
                    min="5"
                    max="540"
                    step="5"
                    placeholder="90"
                    value={form.estimated_minutes}
                    onChange={(e) => set('estimated_minutes', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-save" disabled={saving || !form.title.trim()}>
              {saving ? '...' : initialData ? 'Salvar' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
