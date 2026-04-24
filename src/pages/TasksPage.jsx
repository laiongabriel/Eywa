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
import TaskItem from '../components/TaskItem'
import AddTaskModal from '../components/AddTaskModal'
import FocusMode from '../components/FocusMode'
import './TasksPage.css'

/** Wraps TaskItem with dnd-kit sortable behaviour */
function SortableTaskItem({ task, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskItem
        task={task}
        dragHandle={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  )
}

export default function TasksPage() {
  const { session } = useAuth()
  const userId = session.user.id

  const [tasks, setTasks]         = useState([])
  const [order, setOrder]         = useState([])   // IDs of active (non-completed) tasks
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [focusTask, setFocusTask] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const loadTasks = useCallback(async () => {
    const data = await fetchTasks(userId)
    setTasks(data)
    // Restore saved order from localStorage, fall back to server order
    const saved = JSON.parse(localStorage.getItem(`eywa_task_order_${userId}`) || 'null')
    if (saved && Array.isArray(saved)) {
      setOrder(saved)
    } else {
      setOrder(data.filter(t => !t.completed).map(t => t.id))
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { loadTasks() }, [loadTasks])

  function persistOrder(newOrder) {
    localStorage.setItem(`eywa_task_order_${userId}`, JSON.stringify(newOrder))
    setOrder(newOrder)
  }

  async function handleCreate(payload) {
    const task = await createTask(userId, payload)
    setTasks(prev => [task, ...prev])
    setOrder(prev => [task.id, ...prev])
    playTaskCreated()
  }

  async function handleEditOpen(task) {
    setEditingTask(task)
    setShowModal(true)
  }

  async function handleEditSave(payload) {
    const updated = await updateTask(editingTask.id, payload)
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    setEditingTask(null)
  }

  function handleUpdate(updated) {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    // If task is now completed, remove from order; if un-completed, add back
    if (updated.completed) {
      setOrder(prev => prev.filter(id => id !== updated.id))
    } else {
      setOrder(prev => prev.includes(updated.id) ? prev : [updated.id, ...prev])
    }
  }

  function handleDelete(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    setOrder(prev => prev.filter(oid => oid !== id))
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
          {mitTasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              userId={userId}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onEdit={() => handleEditOpen(task)}
              onStartFocus={setFocusTask}
            />
          ))}
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
        <div className="tasks-loading">
          <div className="loading-dot" />
        </div>
      ) : sortableTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="tasks-empty">Nenhuma tarefa criada ainda.</div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableOrder} strategy={verticalListSortingStrategy}>
              <ul className="tasks-list">
                {sortableTasks.map((task, index) => (
                  <li key={task.id} style={{ '--task-idx': index }}>
                    <SortableTaskItem
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
            </SortableContext>
          </DndContext>

          {completedTasks.length > 0 && (
            <>
              {sortableTasks.length > 0 && <div className="tasks-divider">Concluídas</div>}
              <ul className="tasks-list">
                {completedTasks.map((task, index) => (
                  <li key={task.id} style={{ '--task-idx': index }}>
                    <TaskItem
                      task={task}
                      userId={userId}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onEdit={() => handleEditOpen(task)}
                    />
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
