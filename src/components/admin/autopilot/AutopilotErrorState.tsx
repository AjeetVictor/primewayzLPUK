import { AlertTriangle } from 'lucide-react';
import type { AutopilotClientError } from '../../../lib/autopilot/adminAutopilotService';

type AutopilotErrorStateProps = {
  error: AutopilotClientError | Error | string | null;
  onRetry?: () => void;
  title?: string;
};

function resolveMessage(error: AutopilotErrorStateProps['error']): {
  title: string;
  message: string;
  correlationId: string | null;
} {
  if (!error) {
    return {
      title: 'Something went wrong',
      message: 'An unexpected Autopilot error occurred.',
      correlationId: null,
    };
  }

  if (typeof error === 'string') {
    return { title: 'Unable to load Autopilot', message: error, correlationId: null };
  }

  if ('kind' in error && 'correlationId' in error) {
    const clientError = error as AutopilotClientError;
    const title =
      clientError.kind === 'unavailable'
        ? 'Autopilot unavailable'
        : clientError.kind === 'forbidden'
          ? 'Access denied'
          : clientError.kind === 'not_found'
            ? 'Not found'
            : 'Unable to load Autopilot';

    return {
      title,
      message: clientError.message,
      correlationId: clientError.correlationId,
    };
  }

  return {
    title: 'Unable to load Autopilot',
    message: error.message || 'An unexpected Autopilot error occurred.',
    correlationId: null,
  };
}

export function AutopilotErrorState({
  error,
  onRetry,
  title: titleOverride,
}: AutopilotErrorStateProps) {
  const resolved = resolveMessage(error);
  const title = titleOverride || resolved.title;

  return (
    <div
      className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 shadow-sm"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-rose-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-rose-800">{resolved.message}</p>
          {resolved.correlationId ? (
            <p className="mt-3 font-mono text-xs text-rose-700/80">
              Correlation ID: {resolved.correlationId}
            </p>
          ) : null}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
