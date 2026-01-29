import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const LoadingOverlay = React.forwardRef(({
  isOpen,
  message = "Authenticating...",
  className,
  ...props
}, ref) => {
  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      ref={ref}
      {...props}
    >
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm
                    data-[state=open]:animate-in data-[state=closed]:animate-out
                    data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                    transition-all duration-200"
        data-state={isOpen ? 'open' : 'closed'}
      />

      {/* Content: Spinner + Message */}
      <div
        className={cn(
          "relative z-50 flex flex-col items-center gap-4",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "duration-200",
          className
        )}
        data-state={isOpen ? 'open' : 'closed'}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-sm font-medium text-foreground">{message}</p>
        <span className="sr-only">{message}</span>
      </div>
    </div>,
    document.body
  )
})

LoadingOverlay.displayName = 'LoadingOverlay'

export { LoadingOverlay }
