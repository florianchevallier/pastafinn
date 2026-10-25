import { createHashHistory, createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/AppShell'
import { RouteError } from '@/components/States'
import { getSession } from '@/lib/jellyfin'
import { LoginPage } from '@/routes/LoginPage'

const rootRoute = createRootRoute({ component: Outlet })

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (s: Record<string, unknown>): { expired?: boolean } => (s.expired ? { expired: true } : {}),
  beforeLoad: () => {
    if (getSession()) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: () => {
    if (!getSession()) throw redirect({ to: '/login' })
  },
  component: AppShell,
  errorComponent: RouteError,
})

const homeRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: lazyRouteComponent(() => import('@/routes/HomePage'), 'HomePage'),
})

const libraryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/library/$libraryId',
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s.q === 'string' && s.q ? { q: s.q } : {}),
  component: lazyRouteComponent(() => import('@/routes/LibraryPage'), 'LibraryPage'),
})

const titleRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/title/$itemId',
  component: lazyRouteComponent(() => import('@/routes/TitlePage'), 'TitlePage'),
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([loginRoute, appRoute.addChildren([homeRoute, libraryRoute, titleRoute])]),
  // Hash URLs work on GitHub Pages and any static host without rewrite rules.
  history: createHashHistory(),
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
