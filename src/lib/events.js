import { supabase } from './supabase'

/**
 * Fetch all events for a user within a date range.
 * Also expands recurring events into occurrences within the range.
 */
export async function fetchEvents(userId, rangeStart, rangeEnd) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .or(
      `and(start_at.gte.${rangeStart.toISOString()},start_at.lte.${rangeEnd.toISOString()}),recurrence.neq.none`
    )
    .order('start_at', { ascending: true })

  if (error) throw error

  // Expand recurring events into virtual occurrences within the range
  const expanded = []
  for (const ev of data) {
    if (ev.recurrence === 'none') {
      expanded.push(ev)
    } else {
      const occurrences = expandRecurring(ev, rangeStart, rangeEnd)
      expanded.push(...occurrences)
    }
  }
  return expanded
}

function expandRecurring(ev, rangeStart, rangeEnd) {
  const results = []
  const duration = new Date(ev.end_at) - new Date(ev.start_at)
  let cursor = new Date(ev.start_at)
  const until = ev.recur_until ? new Date(ev.recur_until + 'T23:59:59') : rangeEnd

  while (cursor <= rangeEnd && cursor <= until) {
    if (cursor >= rangeStart) {
      results.push({
        ...ev,
        id: `${ev.id}_${cursor.toISOString()}`, // virtual id for recurring occurrences
        _original_id: ev.id,
        _is_occurrence: true,
        start_at: cursor.toISOString(),
        end_at: new Date(cursor.getTime() + duration).toISOString(),
      })
    }
    cursor = addInterval(cursor, ev.recurrence)
  }
  return results
}

function addInterval(date, recurrence) {
  const d = new Date(date)
  if (recurrence === 'daily')   d.setDate(d.getDate() + 1)
  if (recurrence === 'weekly')  d.setDate(d.getDate() + 7)
  if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1)
  return d
}

export async function createEvent(userId, fields) {
  const { data, error } = await supabase
    .from('events')
    .insert({ user_id: userId, ...fields })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEvent(id, fields) {
  const { data, error } = await supabase
    .from('events')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(id) {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)

  if (error) throw error
}
