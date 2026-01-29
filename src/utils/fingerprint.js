import ClientJS from 'clientjs'

let cachedFingerprint = null

/**
 * Get device fingerprint (cached for performance)
 * Uses low-entropy signals for privacy-friendly rate limiting
 */
export async function getDeviceFingerprint() {
  if (cachedFingerprint) {
    return cachedFingerprint
  }

  try {
    const client = new ClientJS()
    cachedFingerprint = client.getFingerprint().toString()
    return cachedFingerprint
  } catch (error) {
    console.error('Fingerprint generation failed:', error)
    // Fallback to session-based ID
    cachedFingerprint = `session-${Date.now()}-${Math.random()}`
    return cachedFingerprint
  }
}
