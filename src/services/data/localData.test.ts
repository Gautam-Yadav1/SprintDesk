import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NewTaskInput } from '@/types'

/**
 * The service loads its dataset once, at module scope. Re-importing it is the
 * closest thing to a page refresh: it re-runs that load against whatever is in
 * localStorage, which is exactly what these cases need to exercise.
 */
async function reload() {
  vi.resetModules()
  return import('./localData')
}

const NEW_TASK: NewTaskInput = {
  title: 'Wire up the export button',
  description: 'Serialise each chart and compose them onto a canvas.',
  priority: 'high',
  assigneeId: null,
  dueDate: '2026-09-01',
  sprintId: 1,
}

describe('local data service', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('seeds the board with the first 30 tasks from the mock data', async () => {
    const service = await reload()
    await expect(service.listTasks()).resolves.toHaveLength(30)
  })

  it('still returns a created task after a reload', async () => {
    const before = await reload()
    const created = await before.createTask(NEW_TASK)
    await expect(before.listTasks()).resolves.toHaveLength(31)

    const after = await reload()
    const tasks = await after.listTasks()

    expect(tasks.map((task) => task.id)).toContain(created.id)
    expect(tasks.find((task) => task.id === created.id)?.title).toBe(NEW_TASK.title)
  })

  it('still reflects an edit and a deletion after a reload', async () => {
    const before = await reload()
    await before.updateTask(1, { title: 'Renamed in a previous session' })
    await before.deleteTask(2)

    const after = await reload()
    const tasks = await after.listTasks()

    expect(tasks.find((task) => task.id === 1)?.title).toBe('Renamed in a previous session')
    expect(tasks.some((task) => task.id === 2)).toBe(false)
  })
})
