import { useState, useEffect, useRef } from 'react'
import { setMIT, updateTask } from '../lib/tasks'
import './DailyReview.css'

const PHASES = ['retrospect', 'plan', 'done']

export default function DailyReview({ tasks, userId, onClose, onMITChange }) {
  const [phase, setPhase] = useState('retrospect')
  const [selectedMIT, setSelectedMIT] = useState(null)
  const [saving, setSaving] = useState(false)
  const enteredRef = useRef(false)

  const today = new Date()
  const todayLabel = today.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  const completedToday = tasks.filter(t => {
    if (!t.completed) return false
    const updated = new Date(t.updated_at)
    const d = new Date()
    return (
      updated.getFullYear() === d.getFullYear() &&
      updated.getMonth() === d.getMonth() &&
      updated.getDate() === d.getDate()
    )
  })

  const pending = tasks.filter(t => !t.completed)
  const currentMIT = tasks.find(t => t.is_mit && !t.completed)

  useEffect(() => {
    if (!enteredRef.current) {
      enteredRef.current = true
      setSelectedMIT(currentMIT?.id ?? null)
    }
  }, [currentMIT])

  async function handleFinish() {
    if (phase === 'retrospect') {
      setPhase('plan')
      return
    }
    if (phase === 'plan') {
      setSaving(true)
      if (selectedMIT && selectedMIT !== currentMIT?.id) {
        const updated = await setMIT(userId, selectedMIT)
        onMITChange(updated)
      } else if (!selectedMIT && currentMIT) {
        // clear MIT
        await updateTask(currentMIT.id, { is_mit: false })
        onMITChange(null)
      }
      setSaving(false)
      setPhase('done')
      return
    }
    onClose()
  }

  const phaseIdx = PHASES.indexOf(phase)
  const completedCount = completedToday.length

  return (
    <div className="review-root" role="dialog" aria-modal="true">
      <div className="review-card">
        {/* Progress dots */}
        <div className="review-dots">
          {['retrospect', 'plan'].map((p, i) => (
            <div
              key={p}
              className={`review-dot ${phaseIdx > i ? 'done' : phaseIdx === i ? 'active' : ''}`}
            />
          ))}
        </div>

        {phase === 'retrospect' && (
          <div className="review-phase">
            <p className="review-date">{todayLabel}</p>
            <h2 className="review-title">Revisão do dia</h2>

            {completedCount === 0 ? (
              <div className="review-empty-retrospect">
                <span className="review-empty-icon">○</span>
                <p>Nenhuma tarefa concluída hoje ainda.</p>
                <p className="review-sub">Tudo bem — cada dia é um recomeço.</p>
              </div>
            ) : (
              <>
                <p className="review-sub">
                  Você concluiu <strong>{completedCount}</strong>{' '}
                  {completedCount === 1 ? 'tarefa' : 'tarefas'} hoje. Bom trabalho.
                </p>
                <ul className="review-completed-list">
                  {completedToday.map(t => (
                    <li key={t.id} className="review-completed-item">
                      <span className="review-check">✓</span>
                      <span>{t.title}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {phase === 'plan' && (
          <div className="review-phase">
            <h2 className="review-title">Qual é a tarefa mais importante amanhã?</h2>
            <p className="review-sub">
              Escolha uma. Apenas uma. Esta é a que você se compromete a fazer antes de tudo.
            </p>

            {pending.length === 0 ? (
              <div className="review-empty-retrospect">
                <span className="review-empty-icon">✦</span>
                <p>Nenhuma tarefa pendente.</p>
              </div>
            ) : (
              <ul className="review-task-list">
                {pending.map(t => (
                  <li key={t.id}>
                    <button
                      className={`review-task-btn ${selectedMIT === t.id ? 'selected' : ''}`}
                      onClick={() => setSelectedMIT(prev => prev === t.id ? null : t.id)}
                    >
                      <span className="review-task-star">
                        {selectedMIT === t.id ? '★' : '☆'}
                      </span>
                      <span className="review-task-title">{t.title}</span>
                      {t.priority === 'high' && (
                        <span className="review-task-badge high">Alta</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {phase === 'done' && (
          <div className="review-phase review-phase--done">
            <div className="review-done-icon">✦</div>
            <h2 className="review-title">Pronto para o dia.</h2>
            {selectedMIT && (
              <p className="review-sub">
                Sua tarefa mais importante foi definida. Foque nela primeiro.
              </p>
            )}
          </div>
        )}

        <div className="review-actions">
          {phase !== 'done' && (
            <button className="review-skip" onClick={onClose} disabled={saving}>
              Fechar
            </button>
          )}
          <button
            className="review-next"
            onClick={handleFinish}
            disabled={saving}
          >
            {phase === 'retrospect'
              ? 'Planejar →'
              : phase === 'plan'
              ? saving ? 'Salvando…' : 'Confirmar MIT'
              : 'Começar o dia'}
          </button>
        </div>
      </div>
    </div>
  )
}
