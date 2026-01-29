import { useState, useEffect } from 'react'
import { AlertCircle, Clock } from 'lucide-react'

export function RateLimitCountdown({ retryAfter, onExpired }) {
  const [secondsRemaining, setSecondsRemaining] = useState(retryAfter)

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onExpired?.()
      return
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        const next = prev - 1
        if (next <= 0) {
          clearInterval(timer)
          onExpired?.()
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [secondsRemaining, onExpired])

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Too many login attempts
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Please wait before trying again
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span className="text-2xl font-mono font-bold text-amber-900 dark:text-amber-100 tabular-nums">
              {secondsRemaining}s
            </span>
          </div>
          <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-600 dark:bg-amber-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(secondsRemaining / retryAfter) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
