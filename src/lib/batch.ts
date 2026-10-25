import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import type { PlanEntry } from './plan'

export type ResultStatus = 'applied' | 'unchanged' | 'noMatch' | 'skipped' | 'failed'

export interface BatchIO {
  remember: (item: BaseItemDto, audio: number | null, subtitle: number) => Promise<unknown>
  end: (item: BaseItemDto) => Promise<unknown>
  signal: AbortSignal
  onProgress: (done: number, total: number, results: Record<string, ResultStatus>) => void
}

const SKIPPED: Partial<Record<PlanEntry['status'], ResultStatus>> = { unchanged: 'unchanged', noMatch: 'noMatch', noRuntime: 'skipped' }

/**
 * Writes the planned tracks one item at a time, then clears the session's "now playing" entry once.
 * A failed item does not stop the batch; cancelling keeps what was already written.
 */
export async function runBatch(plan: PlanEntry[], io: BatchIO) {
  const results: Record<string, ResultStatus> = {}
  for (const p of plan) {
    const skipped = SKIPPED[p.status]
    if (skipped) results[p.item.Id!] = skipped
  }
  const todo = plan.filter((p) => p.status === 'apply')
  io.onProgress(0, todo.length, { ...results })

  let last: PlanEntry | undefined
  // Sequential on purpose: each check-in moves the session's "now playing" item.
  for (const [i, p] of todo.entries()) {
    if (io.signal.aborted) break
    try {
      await io.remember(p.item, p.audio, p.subtitle)
      results[p.item.Id!] = 'applied'
      last = p
    } catch {
      results[p.item.Id!] = 'failed'
    }
    io.onProgress(i + 1, todo.length, { ...results })
  }
  // Best effort: a stale "now playing" entry is harmless since every check-in carried a position.
  if (last) await io.end(last.item).catch(() => {})
  return results
}
