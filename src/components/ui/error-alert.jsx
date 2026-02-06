import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorAlert({ error, title = "Error", showRetry = false, onRetry, className }) {
  const getMessage = () => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unexpected error occurred. Please try again.';
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {getMessage()}
        {showRetry && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
