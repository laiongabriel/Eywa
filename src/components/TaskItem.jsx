import { useState } from 'react'
import { updateTask, deleteTask, setMIT } from '../lib/tasks'
import { playTaskComplete } from '../lib/sounds'
import './TaskItem.css'

export default function TaskItem({ task, userId, onUpdate, onDelete, onEdit, onStartFocus }) {
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
    setDeleting(true)
    try {
      await deleteTask(task.id)
      onDelete(task.id)
    } catch {
      setDeleting(false)
    }
  }

  async function handleSetMIT() {
    const updated = await setMIT(userId, task.id)
    onUpdate(updated, true)
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

        {task.scheduled_at && (
          <div className="task-meta">
            <span className="task-scheduled">
              {formatScheduled(task.scheduled_at)}
              {task.estimated_minutes ? ` · ${task.estimated_minutes}min` : ''}
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
            Começar
          </button>
        )}
        {!task.is_mit && !task.completed && (
          <button
            className="task-action-btn mit-btn"
            onClick={handleSetMIT}
            data-tooltip="Definir como mais importante"
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
  return d.toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

function CheckIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
      <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
