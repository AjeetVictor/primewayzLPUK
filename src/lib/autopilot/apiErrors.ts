export type AutopilotErrorStatus = 400 | 401 | 403 | 404 | 409 | 500 | 502 | 503;

export const AUTOPILOT_ERROR_CODES = {
  VALIDATION_ERROR: 'AUTOPILOT_VALIDATION_ERROR',
  NOT_FOUND: 'AUTOPILOT_NOT_FOUND',
  FORBIDDEN: 'AUTOPILOT_FORBIDDEN',
  CONFLICT: 'AUTOPILOT_CONFLICT',
  ILLEGAL_TRANSITION: 'AUTOPILOT_ILLEGAL_TRANSITION',
  AUTO_PUBLISH_LOCKED: 'AUTOPILOT_AUTO_PUBLISH_LOCKED',
  RESEARCH_NOT_ENABLED: 'AUTOPILOT_RESEARCH_NOT_ENABLED',
  RESEARCH_SNAPSHOT_NOT_FOUND: 'AUTOPILOT_RESEARCH_SNAPSHOT_NOT_FOUND',
  RESEARCH_SNAPSHOT_IMMUTABLE: 'AUTOPILOT_RESEARCH_SNAPSHOT_IMMUTABLE',
  RESEARCH_SNAPSHOT_ALREADY_EXISTS: 'AUTOPILOT_RESEARCH_SNAPSHOT_ALREADY_EXISTS',
  RESEARCH_NOT_READY: 'AUTOPILOT_RESEARCH_NOT_READY',
  RESEARCH_COMPLETENESS_INSUFFICIENT: 'AUTOPILOT_RESEARCH_COMPLETENESS_INSUFFICIENT',
  OVERLAP_ANALYSIS_REQUIRED: 'AUTOPILOT_OVERLAP_ANALYSIS_REQUIRED',
  RESEARCH_ILLEGAL_TRANSITION: 'AUTOPILOT_RESEARCH_ILLEGAL_TRANSITION',
  RESEARCH_TOPIC_ARCHIVED: 'AUTOPILOT_RESEARCH_TOPIC_ARCHIVED',
  SCORE_DIMENSIONS_INCOMPLETE: 'AUTOPILOT_SCORE_DIMENSIONS_INCOMPLETE',
  GSC_CONFIGURATION_REQUIRED: 'GSC_CONFIGURATION_REQUIRED',
  GSC_REAUTHORISATION_REQUIRED: 'GSC_REAUTHORISATION_REQUIRED',
  GSC_SYNC_IN_PROGRESS: 'GSC_SYNC_IN_PROGRESS',
  INTERNAL_ERROR: 'AUTOPILOT_INTERNAL_ERROR',
} as const;

export type AutopilotErrorCode =
  (typeof AUTOPILOT_ERROR_CODES)[keyof typeof AUTOPILOT_ERROR_CODES];

export class AutopilotError extends Error {
  readonly code: string;
  readonly status: AutopilotErrorStatus;
  readonly details?: unknown;

  constructor(
    code: string,
    message: string,
    status: AutopilotErrorStatus,
    details?: unknown,
  ) {
    super(message);
    this.name = 'AutopilotError';
    this.code = code;
    this.status = status;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export function validationError(message: string, details?: unknown): AutopilotError {
  return new AutopilotError(
    AUTOPILOT_ERROR_CODES.VALIDATION_ERROR,
    message,
    400,
    details,
  );
}

export function notFound(message: string, details?: unknown): AutopilotError {
  return new AutopilotError(AUTOPILOT_ERROR_CODES.NOT_FOUND, message, 404, details);
}

export function forbidden(message: string, details?: unknown): AutopilotError {
  return new AutopilotError(AUTOPILOT_ERROR_CODES.FORBIDDEN, message, 403, details);
}

export function conflict(
  message: string,
  details?: unknown,
  code: string = AUTOPILOT_ERROR_CODES.CONFLICT,
): AutopilotError {
  return new AutopilotError(code, message, 409, details);
}

export function internal(message: string, details?: unknown): AutopilotError {
  return new AutopilotError(
    AUTOPILOT_ERROR_CODES.INTERNAL_ERROR,
    message,
    500,
    details,
  );
}

export type SerializedAutopilotError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  correlationId: string;
};

export function serializeAutopilotError(
  error: unknown,
  correlationId: string,
): SerializedAutopilotError {
  if (error instanceof AutopilotError) {
    const payload: SerializedAutopilotError = {
      error: {
        code: error.code,
        message: error.message,
      },
      correlationId,
    };
    if (error.details !== undefined) {
      payload.error.details = error.details;
    }
    return payload;
  }

  return {
    error: {
      code: AUTOPILOT_ERROR_CODES.INTERNAL_ERROR,
      message: 'An unexpected Autopilot error occurred.',
    },
    correlationId,
  };
}
