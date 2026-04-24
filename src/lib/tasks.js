import { supabase } from './supabase'

export async function fetchTasks(userId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('is_mit', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createTask(userId, fields) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ user_id: userId, ...fields })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTask(id, fields) {
  const { data, error } = await supabase
    .from('tasks')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/** Ensure only one MIT at a time */
export async function setMIT(userId, taskId) {
  // Clear existing MIT
  await supabase
    .from('tasks')
    .update({ is_mit: false })
    .eq('user_id', userId)
    .eq('is_mit', true)

  const { data, error } = await supabase
    .from('tasks')
    .update({ is_mit: true })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}
