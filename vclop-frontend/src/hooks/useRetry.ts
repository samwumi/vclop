import { useState, useCallback } from 'react';

/**
 * Hook for handling retry logic with exponential backoff
 */
export function useRetry(maxRetries = 3) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = useCallback(async (fn: () => Promise<void>) => {
    if (retryCount >= maxRetries) {
      console.warn('Max retry attempts reached');
      return;
    }

    setIsRetrying(true);
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      await fn();
      setRetryCount(0); // Reset on success
    } catch (error) {
      setRetryCount(prev => prev + 1);
      throw error;
    } finally {
      setIsRetrying(false);
    }
  }, [retryCount, maxRetries]);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries,
  };
}
