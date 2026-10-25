import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { endCheckIns, rememberTracks, useApi } from '@/lib/jellyfin'
import type { PlanEntry } from '@/lib/plan'

export type ResultStatus = 'applied' | 'unchanged' | 'noMatch' | 'skipped' | 'failed'

export interface BatchState {
  running: boolean
  done: number
  total: number
  cancelled: boolean
  results: Record<string, ResultStatus>
}

const idle: BatchState = { running: false, done: 0, total: 0, cancelled: false, results: {} }

export function useBatchApply() {
  const { api } = useApi()
  const queryClient = useQueryClient()
  const [state, setState] = useState<BatchState>(idle)
  const abort = useRef<AbortController | null>(null)

  async function run(plan: PlanEntry[]) {
    const controller = new AbortController()
    abort.current = controller
    const results: Record<string, ResultStatus> = {}
    for (const p of plan) {
      if (p.status === 'unchanged') results[p.item.Id!] = 'unchanged'
      if (p.status === 'noMatch') results[p.item.Id!] = 'noMatch'
      if (p.status === 'noRuntime') results[p.item.Id!] = 'skipped'
    }
    const todo = plan.filter((p) => p.status === 'apply')
    setState({ running: true, done: 0, total: todo.length, cancelled: false, results: { ...results } })

    let last: PlanEntry | undefined
    // Sequential on purpose: each check-in moves the session's "now playing" item.
    for (const [i, p] of todo.entries()) {
      if (controller.signal.aborted) break
      try {
        await rememberTracks(api, p.item, p.audio, p.subtitle)
        results[p.item.Id!] = 'applied'
        last = p
      } catch {
        results[p.item.Id!] = 'failed'
      }
      setState((s) => ({ ...s, done: i + 1, results: { ...results } }))
    }
    if (last) await endCheckIns(api, last.item).catch(() => {})

    setState((s) => ({ ...s, running: false, cancelled: controller.signal.aborted, results: { ...results } }))
    await queryClient.invalidateQueries({ queryKey: ['episodes'] })
    await queryClient.invalidateQueries({ queryKey: ['item'] })
  }

  return {
    state,
    run,
    cancel: () => abort.current?.abort(),
    reset: () => setState(idle),
  }
}
