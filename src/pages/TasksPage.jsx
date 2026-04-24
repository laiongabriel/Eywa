import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchTasks, createTask, updateTask } from '../lib/tasks'
import TaskItem from '../components/TaskItem'
import AddTaskModal from '../components/AddTaskModal'
import FocusMode from '../components/FocusMode'
import DailyReview from '../components/DailyReview'
import './TasksPage.css'

export default function TasksPage() {
  const { session } = useAuth()
  const userId = session.user.id

  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState('active') // 'active' | 'completed' | 'all'
  const [focusTask, setFocusTask] = useState(null)
  const [showReview, setShowReview] = useState(false)

  const loadTasks = useCallback(async () => {
    const data = await fetchTasks(userId)
    setTasks(data)
    setLoading(false)
  }, [userId])

  useEffect(() => { loadTasks() }, [loadTasks])

  async function handleCreate(payload) {
    const task = await createTask(userId, payload)
    setTasks(prev => [task, ...prev])
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

  function handleUpdate(updated, reloadAll) {
    if (reloadAll) {
      // MIT change: reload to get correct ordering
      loadTasks()
    } else {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t))
    }
  }

  function handleDelete(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function openAddModal() {
    setEditingTask(null)
    setShowModal(true)
  }

  const mit = tasks.find(t => t.is_mit && !t.completed)

  const filteredTasks = tasks.filter(t => {
    if (t.is_mit && !t.completed) return false // shown separately
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = tasks.filter(t => !t.completed).length

  return (
    <div className="tasks-root">
      {/* MIT section */}
      {mit && (
        <section className="mit-section">
          <div className="mit-label">Tarefa mais importante hoje</div>
          <TaskItem
            task={mit}
            userId={userId}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onStartFocus={setFocusTask}
          />
        </section>
      )}

      {/* Header row */}
      <div className="tasks-header">
        <div className="tasks-header-left">
          <h1 className="tasks-heading">Tarefas</h1>
          {activeCount > 0 && (
            <span className="tasks-count">{activeCount}</span>
          )}
        </div>
        <div className="tasks-header-actions">
          <button className="btn-review" onClick={() => setShowReview(true)} title="Revisão diária">
            ◑
          </button>
          <button className="btn-add-task" onClick={openAddModal}>
            + Nova tarefa
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {(['active', 'completed', 'all']).map(f => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'active' ? 'Pendentes' : f === 'completed' ? 'Concluídas' : 'Todas'}
          </button>
        ))}
      </div>

      {/* Task list */}
      {loading ? (
        <div className="tasks-loading">
          <div className="loading-dot" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="tasks-empty">
          {filter === 'active'
            ? 'Nenhuma tarefa pendente. Aproveite!'
            : filter === 'completed'
            ? 'Nenhuma tarefa concluída ainda.'
            : 'Nenhuma tarefa criada ainda.'}
        </div>
      ) : (
        <ul className="tasks-list">
          {filteredTasks.map((task, index) => (
            <li key={task.id} style={{ '--task-idx': index }}>
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
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <AddTaskModal
          onClose={() => { setShowModal(false); setEditingTask(null) }}
          onSave={editingTask ? handleEditSave : handleCreate}
          initialData={editingTask}
        />
      )}

      {/* Focus Mode — full screen overlay */}
      {focusTask && (
        <FocusMode
          task={focusTask}
          onEnd={() => setFocusTask(null)}
        />
      )}

      {/* Daily Review — ritual overlay */}
      {showReview && (
        <DailyReview
          tasks={tasks}
          userId={userId}
          onClose={() => { setShowReview(false); loadTasks() }}
          onMITChange={() => loadTasks()}
        />
      )}
    </div>
  )
}
