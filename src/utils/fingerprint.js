let cachedFingerprint = null

/**
 * Generate a simple browser fingerprint using low-entropy signals
 * Privacy-friendly - uses only basic browser characteristics
 *
 * Collects:
 * - User-Agent string
 * - Screen resolution
 * - Color depth
 * - Timezone offset
 * - Language
 * - Platform
 *
 * Does NOT collect (privacy-invasive):
 * - Canvas fingerprint
 * - WebGL fingerprint
 * - Audio fingerprint
 * - Installed fonts
 * - Browser plugins
 */
function generateFingerprint() {
  const components = [
    navigator.userAgent || 'unknown',
    screen.width + 'x' + screen.height,
    screen.colorDepth || 'unknown',
    new Date().getTimezoneOffset(),
    navigator.language || 'unknown',
    navigator.platform || 'unknown',
    screen.availWidth + 'x' + screen.availHeight,
  ]

  // Create a simple hash from the components
  const fingerprint = components.join('|')

  // Simple hash function (FNV-1a)
  let hash = 2166136261
  for (let i = 0; i < fingerprint.length; i++) {
    hash ^= fingerprint.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }

  return (hash >>> 0).toString(36)
}

/**
 * Get device fingerprint (cached for performance)
 * Uses low-entropy signals for privacy-friendly rate limiting
 */
export async function getDeviceFingerprint() {
  if (cachedFingerprint) {
    return cachedFingerprint
  }

  try {
    cachedFingerprint = generateFingerprint()
    return cachedFingerprint
  } catch (error) {
    console.error('Fingerprint generation failed:', error)
    // Fallback to session-based ID
    cachedFingerprint = `session-${Date.now()}-${Math.random()}`
    return cachedFingerprint
  }
}
