import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuth } from '../contexts/AuthContext'
import { fetchTasks, createTask, updateTask } from '../lib/tasks'
import { playModalOpen, playTaskCreated } from '../lib/sounds'
import {
  rescheduleAll,
  scheduleTaskNotification,
  cancelTaskNotification,
  requestNotificationPermission,
} from '../lib/notifications'
import TaskItem from '../components/TaskItem'
import Skeleton from '../components/Skeleton'
import AddTaskModal from '../components/AddTaskModal'
import FocusMode from '../components/FocusMode'
import './TasksPage.css'

/** Shimmer placeholder mimicking a single task item row */
function TaskItemSkeleton() {
  return (
    <div className="task-item-skeleton">
      <Skeleton width="6px" height="14px" borderRadius="3px" style={{ opacity: 0.6 }} />
      <Skeleton width="20px" height="20px" borderRadius="5px" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton height="13px" borderRadius="4px" style={{ width: 'var(--sk-title-w, 72%)' }} />
      </div>
      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
        <Skeleton width="28px" height="28px" borderRadius="7px" />
        <Skeleton width="28px" height="28px" borderRadius="7px" />
        <Skeleton width="28px" height="28px" borderRadius="7px" />
      </div>
    </div>
  )
}

/** Wraps TaskItem with dnd-kit sortable behaviour + smooth grid height collapse */
function SortableTaskItem({ task, isFadingOut, index, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: isFadingOut ? '0fr' : '1fr',
        overflow: isFadingOut ? 'hidden' : 'visible',
        marginBottom: isFadingOut ? '0' : '0.375rem',
        transition: 'grid-template-rows 0.38s ease, margin-bottom 0.38s ease',
        '--task-idx': index,
      }}
    >
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.5 : 1,
          minHeight: 0,
        }}
      >
        <TaskItem
          task={task}
          dragHandle={{ ...attributes, ...listeners }}
          {...props}
        />
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { session } = useAuth()
  const userId = session.user.id

  const [tasks, setTasks]         = useState([])
  const [order, setOrder]         = useState([])   // IDs of active (non-completed) tasks
  const [deletingIds, setDeletingIds] = useState(new Set())
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [focusTask, setFocusTask] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const loadTasks = useCallback(async () => {
    const data = await fetchTasks(userId)
    setTasks(data)
    const saved = JSON.parse(localStorage.getItem(`eywa_task_order_${userId}`) || 'null')
    if (saved && Array.isArray(saved)) {
      setOrder(saved)
    } else {
      // Default order: timed tasks first sorted by scheduled_at, then untimed
      const active = data.filter(t => !t.completed && !t.is_mit)
      const timed   = active.filter(t => t.scheduled_at).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
      const untimed = active.filter(t => !t.scheduled_at)
      setOrder([...timed, ...untimed].map(t => t.id))
    }
    setLoading(false)
    rescheduleAll(data)
  }, [userId])

  useEffect(() => { loadTasks() }, [loadTasks])

  function persistOrder(newOrder) {
    localStorage.setItem(`eywa_task_order_${userId}`, JSON.stringify(newOrder))
    setOrder(newOrder)
  }

  async function handleCreate(payload) {
    const task = await createTask(userId, payload)
    setTasks(prev => [...prev, task])
    if (task.scheduled_at) {
      // Timed task: prepend (before untimed tasks)
      setOrder(prev => [task.id, ...prev])
    } else {
      // Untimed task: append
      setOrder(prev => [...prev, task.id])
    }
    if (task.reminder_offset_minutes != null) {
      requestNotificationPermission().then(perm => {
        if (perm === 'granted') scheduleTaskNotification(task)
      })
    }
    playTaskCreated()
  }

  async function handleEditOpen(task) {
    setEditingTask(task)
    setShowModal(true)
    playModalOpen()
  }

  async function handleEditSave(payload) {
    const updated = await updateTask(editingTask.id, payload)
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setEditingTask(null)
    cancelTaskNotification(updated.id)
    if (updated.reminder_offset_minutes != null) {
      requestNotificationPermission().then(perm => {
        if (perm === 'granted') scheduleTaskNotification(updated)
      })
    }
  }

  function handleUpdate(updated) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    // If task is now completed, remove from order; if un-completed, add back
    if (updated.completed) {
      setOrder(prev => prev.filter(id => id !== updated.id))
      cancelTaskNotification(updated.id)
    } else {
      setOrder(prev => prev.includes(updated.id) ? prev : [updated.id, ...prev])
      scheduleTaskNotification(updated)
    }
  }

  function handleDeleteStart(id) {
    setDeletingIds(prev => new Set([...prev, id]))
  }

  function handleDelete(id) {
    cancelTaskNotification(id)
    setTasks(prev => prev.filter(t => t.id !== id))
    setOrder(prev => prev.filter(oid => oid !== id))
    setDeletingIds(prev => { const s = new Set(prev); s.delete(id); return s })
  }

  function openAddModal() {
    setEditingTask(null)
    setShowModal(true)
    playModalOpen()
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = sortableOrder.indexOf(active.id)
    const newIdx = sortableOrder.indexOf(over.id)
    if (oldIdx === -1 || newIdx === -1) return
    const newOrder = arrayMove(sortableOrder, oldIdx, newIdx)
    persistOrder(newOrder)
  }

  // -- Derived lists -----------------------------------------------------------
  const taskMap = Object.fromEntries(tasks.map(t => [t.id, t]))

  // MIT tasks (multiple) — pinned at top, never part of sortable
  const mitTasks = tasks.filter(t => t.is_mit && !t.completed)

  // Sortable active tasks: use saved order, filter out MITs and completed
  const sortableOrder = order.filter(id => {
    const t = taskMap[id]
    return t && !t.completed && !t.is_mit
  })
  // Any tasks not yet in order list (e.g. loaded fresh)
  tasks.forEach(t => {
    if (!t.completed && !t.is_mit && !sortableOrder.includes(t.id)) {
      sortableOrder.push(t.id)
    }
  })

  const sortableTasks = sortableOrder.map(id => taskMap[id]).filter(Boolean)
  const completedTasks = tasks.filter(t => t.completed)

  const activeCount = tasks.filter(t => !t.completed).length

  return (
    <div className="tasks-root">
      {/* MIT section — pinned, multiple allowed */}
      {mitTasks.length > 0 && (
        <section className="mit-section">
          <div className="mit-label">Prioritárias</div>
          <ul className="tasks-list">
            {mitTasks.map(task => (
              <li key={task.id}>
                <TaskItem
                  task={task}
                  userId={userId}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onEdit={() => handleEditOpen(task)}
                  onStartFocus={setFocusTask}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="tasks-header">
        <div className="tasks-header-left">
          <h1 className="tasks-heading">Tarefas</h1>
          {activeCount > 0 && (
            <span className="tasks-count">{activeCount}</span>
          )}
        </div>
        <button className="btn-add-task" onClick={openAddModal}>
          + Nova tarefa
        </button>
      </div>

      {loading ? (
        <div className="tasks-skeleton">
          {[72, 85, 55, 68, 78].map((w, i) => (
            <TaskItemSkeleton key={i} style={{ '--sk-title-w': `${w}%` }} />
          ))}
        </div>
      ) : sortableTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="tasks-empty">Nenhuma tarefa criada ainda.</div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableOrder} strategy={verticalListSortingStrategy}>
              <ul className="tasks-list" style={{ gap: 0 }}>
                {sortableTasks.map((task, index) => (
                  <li key={task.id}>
                    <SortableTaskItem
                      task={task}
                      index={index}
                      isFadingOut={deletingIds.has(task.id)}
                      userId={userId}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onDeleteStart={handleDeleteStart}
                      onEdit={() => handleEditOpen(task)}
                      onStartFocus={setFocusTask}
                    />
                  </li>
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          {completedTasks.length > 0 && (
            <>
              <div className="tasks-divider">Concluídas</div>
              <ul className="tasks-list" style={{ gap: 0 }}>
                {completedTasks.map((task, index) => (
                  <li
                    key={task.id}
                    style={{
                      '--task-idx': index,
                      display: 'grid',
                      gridTemplateRows: deletingIds.has(task.id) ? '0fr' : '1fr',
                      overflow: deletingIds.has(task.id) ? 'hidden' : 'visible',
                      marginBottom: deletingIds.has(task.id) ? '0' : '0.375rem',
                      transition: 'grid-template-rows 0.38s ease, margin-bottom 0.38s ease',
                    }}
                  >
                    <div style={{ minHeight: 0 }}>
                    <TaskItem
                      task={task}
                      userId={userId}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onDeleteStart={handleDeleteStart}
                      onEdit={() => handleEditOpen(task)}
                    />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {showModal && (
        <AddTaskModal
          onClose={() => { setShowModal(false); setEditingTask(null) }}
          onSave={editingTask ? handleEditSave : handleCreate}
          initialData={editingTask}
        />
      )}

      {focusTask && (
        <FocusMode
          task={focusTask}
          onEnd={() => setFocusTask(null)}
        />
      )}
    </div>
  )
}
