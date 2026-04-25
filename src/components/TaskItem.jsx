import { useState } from 'react'
import { updateTask, deleteTask } from '../lib/tasks'
import { playTaskComplete, playTaskDelete } from '../lib/sounds'
import './TaskItem.css'

export default function TaskItem({ task, userId, onUpdate, onDelete, onEdit, onStartFocus, dragHandle, onDeleteStart }) {
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [pop, setPop] = useState(false)

  async function handleToggle() {
    const nowCompleted = !task.completed
    const updated = await updateTask(task.id, { completed: nowCompleted })
    if (nowCompleted) {
      playTaskComplete()
      setPop(true)
      setTimeout(() => setPop(false), 400)
    }
    onUpdate(updated)
  }

  async function handleDelete() {
    onDeleteStart?.(task.id)
    setDeleting(true)
    playTaskDelete()
    try {
      await deleteTask(task.id)
      setTimeout(() => onDelete(task.id), 380)
    } catch {
      setDeleting(false)
    }
  }

  async function handleSetMIT() {
    const updated = await updateTask(task.id, { is_mit: !task.is_mit })
    onUpdate(updated)
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editTitle.trim()) return
    const updated = await updateTask(task.id, { title: editTitle.trim() })
    onUpdate(updated)
    setEditing(false)
  }

  function handleEditKeyDown(e) {
    if (e.key === 'Escape') {
      setEditing(false)
      setEditTitle(task.title)
    }
  }

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''} ${task.is_mit ? 'is-mit' : ''} ${deleting ? 'deleting' : ''}`}>
      {dragHandle && (
        <span className="task-drag-handle" {...dragHandle}>⠿</span>
      )}
      <button
        className={`task-checkbox ${task.completed ? 'checked' : ''} ${pop ? 'pop' : ''}`}
        onClick={handleToggle}
        aria-label={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
      >
        {task.completed && <CheckIcon />}
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

        {(task.scheduled_at || task.estimated_minutes) && (
          <div className="task-meta">
            <span className="task-scheduled">
              {task.scheduled_at && formatScheduled(task.scheduled_at)}
              {task.scheduled_at && task.estimated_minutes ? ' · ' : ''}
              {task.estimated_minutes ? formatDuration(task.estimated_minutes) : ''}
            </span>
          </div>
        )}
      </div>

      <div className="task-actions">
        {!task.completed && onStartFocus && (
          <button
            className="task-action-btn start-btn"
            onClick={() => onStartFocus(task)}
            data-tooltip="Entrar em modo foco"
          >
            <PlayIcon />
            Focar
          </button>
        )}
        {!task.completed && (
          <button
            className={`task-action-btn mit-btn ${task.is_mit ? 'active' : ''}`}
            onClick={handleSetMIT}
            data-tooltip={task.is_mit ? 'Remover prioridade' : 'Marcar como prioritária'}
          >
            ★
          </button>
        )}
        <button
          className="task-action-btn edit-btn"
          onClick={() => onEdit ? onEdit(task) : setEditing(true)}
          data-tooltip="Editar"
        >
          <EditIcon />
        </button>
        <button
          className="task-action-btn delete-btn"
          onClick={handleDelete}
          data-tooltip="Deletar"
          disabled={deleting}
        >
          <TrashIcon />
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

function formatDuration(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}min`
  if (h) return `${h}h`
  return `${m}min`
}

function CheckIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 13 11" fill="none" aria-hidden="true">
      <path d="M1.5 5.5L5 9L11.5 1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor" aria-hidden="true">
      <path d="M1 1.5v7l7-3.5L1 1.5z"/>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9.5 1.5l3 3-8.5 8.5H.5v-3L9.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M2.5 3.5l.8 8a.5.5 0 0 0 .5.5h5.4a.5.5 0 0 0 .5-.5l.8-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
