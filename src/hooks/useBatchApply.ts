import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { type ResultStatus, runBatch } from '@/lib/batch'
import { endCheckIns, rememberTracks, useApi } from '@/lib/jellyfin'
import type { PlanEntry } from '@/lib/plan'

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
    const results = await runBatch(plan, {
      remember: (item, audio, subtitle) => rememberTracks(api, item, audio, subtitle),
      end: (item) => endCheckIns(api, item),
      signal: controller.signal,
      onProgress: (done, total, partial) => setState({ running: true, done, total, cancelled: false, results: partial }),
    })
    setState((s) => ({ ...s, running: false, cancelled: controller.signal.aborted, results }))
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
