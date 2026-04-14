type LogMeta = Record<string, string | number | boolean | undefined | null>;

/**
 * Structured server logs for inserts, email, and API failures.
 * Swap for Sentry/Datadog later without changing call sites.
 */
export function logAppEvent(
  event: string,
  meta?: LogMeta,
  error?: unknown
): void {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...meta,
    error:
      error instanceof Error
        ? { message: error.message, name: error.name }
        : error != null
          ? String(error)
          : undefined,
  };
  console.error(JSON.stringify(payload));
}
