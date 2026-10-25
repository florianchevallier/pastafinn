import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { describe, expect, it, vi } from 'vitest'
import { type BatchIO, runBatch } from './batch'
import type { PlanEntry } from './plan'

const entry = (Id: string, status: PlanEntry['status'] = 'apply'): PlanEntry => ({
  item: { Id } as BaseItemDto,
  status,
  audio: 2,
  subtitle: 4,
  audioMissing: false,
  subtitleMissing: false,
})

function io(overrides: Partial<BatchIO> = {}) {
  const deps = {
    remember: vi.fn<BatchIO['remember']>(async () => {}),
    end: vi.fn<BatchIO['end']>(async () => {}),
    signal: new AbortController().signal,
    onProgress: vi.fn<BatchIO['onProgress']>(),
  }
  // overrides are vi.fn mocks too, so the mock-typed shape still holds
  return { ...deps, ...overrides } as typeof deps
}

describe('runBatch', () => {
  it('writes only the entries to apply, in order, and reports the others', async () => {
    const deps = io()
    const results = await runBatch([entry('a'), entry('b', 'unchanged'), entry('c', 'noMatch'), entry('d', 'noRuntime'), entry('e')], deps)

    expect(deps.remember.mock.calls.map(([item]) => item.Id)).toEqual(['a', 'e'])
    expect(deps.remember).toHaveBeenCalledWith(expect.objectContaining({ Id: 'a' }), 2, 4)
    expect(results).toEqual({ a: 'applied', b: 'unchanged', c: 'noMatch', d: 'skipped', e: 'applied' })
  })

  it('clears the session once, on the last item written', async () => {
    const deps = io()
    await runBatch([entry('a'), entry('b')], deps)
    expect(deps.end).toHaveBeenCalledTimes(1)
    expect(deps.end).toHaveBeenCalledWith(expect.objectContaining({ Id: 'b' }))
  })

  it('keeps going after a failure and does not end on the failed item', async () => {
    const deps = io({
      remember: vi.fn(async (item: BaseItemDto) => {
        if (item.Id === 'b') throw new Error('boom')
      }),
    })
    const results = await runBatch([entry('a'), entry('b')], deps)
    expect(results).toEqual({ a: 'applied', b: 'failed' })
    expect(deps.end).toHaveBeenCalledWith(expect.objectContaining({ Id: 'a' }))
  })

  it('stops on cancel and keeps what was already written', async () => {
    const controller = new AbortController()
    const deps = io({
      signal: controller.signal,
      remember: vi.fn(async () => controller.abort()),
    })
    const results = await runBatch([entry('a'), entry('b'), entry('c')], deps)
    expect(deps.remember).toHaveBeenCalledTimes(1)
    expect(results).toEqual({ a: 'applied' })
    expect(deps.end).toHaveBeenCalledWith(expect.objectContaining({ Id: 'a' }))
  })

  it('never touches the session when nothing was written', async () => {
    const deps = io({ remember: vi.fn(async () => Promise.reject(new Error('down'))) })
    await runBatch([entry('a', 'unchanged'), entry('b')], deps)
    expect(deps.end).not.toHaveBeenCalled()
  })

  it('reports progress after each item', async () => {
    const deps = io()
    await runBatch([entry('a'), entry('b')], deps)
    expect(deps.onProgress.mock.calls.map(([done, total]) => [done, total])).toEqual([
      [0, 2],
      [1, 2],
      [2, 2],
    ])
  })

  it('survives a failing end-of-batch call', async () => {
    const deps = io({ end: vi.fn(async () => Promise.reject(new Error('gone'))) })
    await expect(runBatch([entry('a')], deps)).resolves.toEqual({ a: 'applied' })
  })
})
