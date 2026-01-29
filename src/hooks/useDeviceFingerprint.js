import { useEffect, useState } from 'react'
import { getDeviceFingerprint } from '@/utils/fingerprint'

/**
 * React hook for device fingerprinting
 * Uses low-entropy signals (privacy-friendly)
 *
 * What it collects:
 * - User-Agent string
 * - Screen resolution
 * - Color depth
 * - Timezone offset
 * - Language
 * - Platform
 *
 * What it DOESN'T collect (privacy-invasive):
 * - Canvas fingerprint
 * - WebGL fingerprint
 * - Audio fingerprint
 * - Installed fonts
 * - Plugins
 */
export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState(null)

  useEffect(() => {
    getDeviceFingerprint().then(setFingerprint).catch((error) => {
      console.error('Failed to generate fingerprint:', error)
      setFingerprint(`session-${Date.now()}-${Math.random()}`)
    })
  }, [])

  return fingerprint
}
