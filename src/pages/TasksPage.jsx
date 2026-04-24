import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchTasks, createTask, updateTask } from '../lib/tasks'
import { playModalOpen } from '../lib/sounds'
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
    playModalOpen()
  }

  const mit = tasks.find(t => t.is_mit && !t.completed)

  // Active tasks (excluding MIT), then completed at bottom
  const activeTasks = tasks.filter(t => !(t.is_mit && !t.completed) && !t.completed)
  const completedTasks = tasks.filter(t => t.completed)
  const displayTasks = [...activeTasks, ...completedTasks]

  const activeCount = tasks.filter(t => !t.completed).length

  return (
    <div className="tasks-root">
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

      <div className="tasks-header">
        <div className="tasks-header-left">
          <h1 className="tasks-heading">Tarefas</h1>
          {activeCount > 0 && (
            <span className="tasks-count">{activeCount}</span>
          )}
        </div>
        <div className="tasks-header-actions">
          <button className="btn-review" onClick={() => setShowReview(true)} data-tooltip="Revisão diária">
            ◑
          </button>
          <button className="btn-add-task" onClick={openAddModal}>
            + Nova tarefa
          </button>
        </div>
      </div>

      {loading ? (
        <div className="tasks-loading">
          <div className="loading-dot" />
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="tasks-empty">Nenhuma tarefa criada ainda.</div>
      ) : (
        <ul className="tasks-list">
          {displayTasks.map((task, index) => (
            <li key={task.id} style={{ '--task-idx': index }}>
              {index === activeTasks.length && completedTasks.length > 0 && activeTasks.length > 0 && (
                <div className="tasks-divider">Concluídas</div>
              )}
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
