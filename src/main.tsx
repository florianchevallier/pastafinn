import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TooltipProvider } from '@/components/ui/tooltip'
import { setSession } from '@/lib/jellyfin'
import { router } from './router'
import './index.css'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err) => {
      // Token revoked or expired: back to the sign-in screen.
      if (isAxiosError(err) && err.response?.status === 401) {
        setSession(null)
        void router.navigate({ to: '/login', search: { expired: true } })
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (n, err) => !(isAxiosError(err) && err.response?.status === 401) && n < 2,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>,
)
