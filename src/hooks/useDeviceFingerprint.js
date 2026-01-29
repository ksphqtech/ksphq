import { useEffect, useState } from 'react'
import ClientJS from 'clientjs'

/**
 * Generate stable device fingerprint for rate limiting
 * Uses low-entropy signals (privacy-friendly)
 *
 * What it collects:
 * - User-Agent string
 * - Screen resolution
 * - Color depth
 * - Timezone
 * - Language
 * - Available screen size
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
    try {
      // ClientJS needs to be instantiated differently - check if it's a constructor or a class
      const ClientJSConstructor = ClientJS.default || ClientJS
      const client = new ClientJSConstructor()
      const fp = client.getFingerprint()
      setFingerprint(fp.toString())
    } catch (error) {
      console.error('Failed to generate fingerprint:', error)
      // Fallback to random session ID
      setFingerprint(`session-${Date.now()}-${Math.random()}`)
    }
  }, [])

  return fingerprint
}
