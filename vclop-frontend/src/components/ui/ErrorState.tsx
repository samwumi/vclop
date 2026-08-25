import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}

export function ErrorState({
  title = 'Failed to load data',
  description = 'An error occurred while fetching the data. Please try again.',
  error,
  onRetry,
  showHomeButton = false,
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      
      {errorMessage && (
        <details className="text-left mb-4 p-3 bg-red-50 rounded-lg text-xs max-w-md w-full">
          <summary className="cursor-pointer font-medium text-red-700 mb-2">
            Error details
          </summary>
          <pre className="text-red-600 overflow-x-auto whitespace-pre-wrap break-words">
            {errorMessage}
          </pre>
        </details>
      )}

      <div className="flex gap-2">
        {onRetry && (
          <button onClick={onRetry} className="btn-primary btn-sm gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        {showHomeButton && (
          <button
            onClick={() => window.location.href = '/'}
            className="btn-secondary btn-sm gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline error message for forms and small components
 */
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <p>{message}</p>
    </div>
  );
}
