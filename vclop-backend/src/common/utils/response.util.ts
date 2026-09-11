/**
 * Convenience helper used inside controller methods that need to return
 * a custom message alongside data — the TransformInterceptor will unwrap it.
 */
export function ok<T>(data: T, message = 'OK'): { message: string; data: T } {
  return { message, data };
}
