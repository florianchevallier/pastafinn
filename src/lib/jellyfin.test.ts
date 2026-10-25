import { describe, expect, it } from 'vitest'
import { mayBeMixedContent } from './jellyfin'

describe('mayBeMixedContent', () => {
  it.each(['http://jellyfin.example.com', '192.168.1.10:8096', '10.0.0.5', '172.20.0.2:8096', 'localhost:8096', 'nas.local:8096'])(
    'flags %s from an https page',
    (address) => expect(mayBeMixedContent(address, 'https:')).toBe(true),
  )

  it.each(['https://192.168.1.10:8920', 'jellyfin.example.com', '172.32.0.1'])('does not flag %s', (address) =>
    expect(mayBeMixedContent(address, 'https:')).toBe(false),
  )

  it('never flags anything from an http page', () => {
    expect(mayBeMixedContent('http://192.168.1.10:8096', 'http:')).toBe(false)
  })
})
