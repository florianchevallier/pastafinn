import { execFileSync } from 'node:child_process'

export default function globalSetup() {
  execFileSync('bash', ['e2e/jellyfin.sh', 'up'], { stdio: 'inherit' })
}
