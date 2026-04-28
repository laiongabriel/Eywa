import { useState, useEffect } from 'react'
import { updateTask, deleteTask } from '../lib/tasks'
import { playPriorityMark, playTaskComplete, playTaskDelete } from '../lib/sounds'
import { useToast } from '../contexts/ToastContext'
import { Check, Play, Pencil, Trash2, BellRing } from 'lucide-react'
import './TaskItem.css'

export default function TaskItem({ task, userId, onUpdate, onDelete, onRestoreTask, onDeleteCancel, onEdit, onStartFocus, dragHandle, onDeleteStart }) {
  const { addToast } = useToast()
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [pop, setPop] = useState(false)
  const [localCompleted, setLocalCompleted] = useState(task.completed)
  const [localMIT, setLocalMIT] = useState(task.is_mit)

  // Keep in sync with parent (e.g. external undo or refresh)
  useEffect(() => { setLocalCompleted(task.completed) }, [task.completed])
  useEffect(() => { setLocalMIT(task.is_mit) }, [task.is_mit])

  async function handleToggle() {
    const nowCompleted = !localCompleted
    setLocalCompleted(nowCompleted)  // optimistic
    if (nowCompleted) {
      playTaskComplete()
      setPop(true)
      setTimeout(() => setPop(false), 400)
    }
    try {
      const updated = await updateTask(task.id, { completed: nowCompleted })
      onUpdate(updated)
    } catch {
      setLocalCompleted(!nowCompleted)  // revert
      addToast('Erro ao atualizar tarefa')
    }
  }

  async function handleDelete() {
    setDeleting(true)
    playTaskDelete()
    onDeleteStart?.(task.id)
    let removed = false
    const timer = setTimeout(() => {
      removed = true
      onDelete(task.id)
    }, 380)
    try {
      await deleteTask(task.id)
    } catch {
      clearTimeout(timer)
      if (removed) {
        onRestoreTask?.(task)
      } else {
        setDeleting(false)
        onDeleteCancel?.(task.id)
      }
      addToast('Erro ao deletar tarefa')
    }
  }

  async function handleSetMIT() {
    const original = { ...task }
    const willBePriority = !localMIT
    setLocalMIT(willBePriority)
    onUpdate({ ...task, is_mit: willBePriority })
    if (willBePriority) playPriorityMark()
    try {
      const updated = await updateTask(task.id, { is_mit: willBePriority })
      onUpdate(updated)
    } catch {
      setLocalMIT(original.is_mit)
      onUpdate(original)
      addToast('Erro ao atualizar tarefa')
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editTitle.trim()) return
    const original = { ...task }
    const newTitle = editTitle.trim()
    onUpdate({ ...task, title: newTitle })
    setEditing(false)
    try {
      const updated = await updateTask(task.id, { title: newTitle })
      onUpdate(updated)
    } catch {
      onUpdate(original)
      setEditTitle(original.title)
      addToast('Erro ao atualizar tarefa')
    }
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Escape') {
      setEditing(false)
      setEditTitle(task.title)
    }
  }

  return (
    <div className={`task-item ${localCompleted ? 'completed' : ''} ${localMIT ? 'is-mit' : ''} ${deleting ? 'deleting' : ''} ${task._pending ? 'pending' : ''}`}>
      {dragHandle && (
        <span className="task-drag-handle" {...dragHandle}>⠿</span>
      )}
      <button
        className={`task-checkbox ${localCompleted ? 'checked' : ''} ${pop ? 'pop' : ''}`}
        onClick={handleToggle}
        aria-label={localCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
      >
        {localCompleted && <Check size={15} strokeWidth={2.8} aria-hidden="true" />}
      </button>

      <div className="task-body">
        {editing ? (
          <form onSubmit={handleEditSubmit} className="task-edit-form">
            <input
              className="task-edit-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleEditKeyDown}
              autoFocus
            />
            <button type="submit" className="task-edit-save">Salvar</button>
          </form>
        ) : (
          <span className="task-title" onDoubleClick={() => setEditing(true)}>
            {task.title}
          </span>
        )}

        {(task.scheduled_at || task.estimated_minutes || task.reminder_offset_minutes != null) && (
          <div className="task-meta">
            <span className="task-scheduled">
              {task.scheduled_at && formatScheduled(task.scheduled_at)}
              {task.scheduled_at && task.estimated_minutes ? ' · ' : ''}
              {task.estimated_minutes ? formatDuration(task.estimated_minutes) : ''}
              {task.reminder_offset_minutes != null && (
                <>
                  {(task.scheduled_at || task.estimated_minutes) ? ' · ' : ''}
                  <BellRing size={14} strokeWidth={2} aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-3px' }} />
                  {' '}{formatReminderText(task.reminder_offset_minutes)}
                </>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="task-actions">
        {!localCompleted && onStartFocus && (
          <button
            className="task-action-btn start-btn"
            onClick={() => onStartFocus(task)}
            data-tooltip="Entrar em modo foco"
          >
            <Play size={11} fill="currentColor" stroke="none" aria-hidden="true" />
            Focar
          </button>
        )}
        {!localCompleted && (
          <button
            className={`task-action-btn mit-btn ${localMIT ? 'active' : ''}`}
            onClick={handleSetMIT}
            data-tooltip={localMIT ? 'Remover prioridade' : 'Marcar como prioritária'}
          >
            ★
          </button>
        )}
        <button
          className="task-action-btn edit-btn"
          onClick={() => onEdit ? onEdit(task) : setEditing(true)}
          data-tooltip="Editar"
        >
          <Pencil size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <button
          className="task-action-btn delete-btn"
          onClick={handleDelete}
          data-tooltip="Deletar"
          disabled={deleting}
        >
          <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function formatScheduled(ts) {
  const d = new Date(ts)
  const now = new Date()
  const isToday    = d.toDateString() === now.toDateString()
  const tmrw = new Date(now); tmrw.setDate(now.getDate() + 1)
  const isTomorrow = d.toDateString() === tmrw.toDateString()
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (isToday)    return hasTime ? time : 'Hoje'
  if (isTomorrow) return hasTime ? `Amanhã · ${time}` : 'Amanhã'
  const day = d.toLocaleDateString('pt-BR', { weekday: 'short' })
  return hasTime ? `${day} · ${time}` : day
}

function formatReminderText(mins) {
  if (mins === 0) return 'Na hora'
  if (mins % 1440 === 0) return `${mins / 1440}d antes`
  if (mins % 60   === 0) return `${mins / 60}h antes`
  return `${mins} min antes`
}

function formatDuration(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m} min`
  if (h) return `${h}h`
  return `${m} min`
}

