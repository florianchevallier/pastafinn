import { execFileSync } from 'node:child_process'

export default function globalTeardown() {
  if (!process.env.E2E_KEEP) execFileSync('bash', ['e2e/jellyfin.sh', 'down'], { stdio: 'inherit' })
}
