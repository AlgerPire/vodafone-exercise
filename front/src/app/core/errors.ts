import { ProblemDetail } from './models';

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetail;

  constructor(status: number, problem: ProblemDetail) {
    super(problem.detail || problem.title || 'Request failed.');
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function readFieldErrors(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const entries = Object.entries(value).filter((entry): entry is [string, string] => {
    return typeof entry[1] === 'string';
  });
  return entries.length ? Object.fromEntries(entries) : undefined;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function errorFromResponse(response: Response): Promise<ApiError> {
  const body = await readBody(response);

  if (isRecord(body) && (stringField(body, 'title') || stringField(body, 'detail') || isRecord(body['fieldErrors']))) {
    return new ApiError(response.status, {
      type: stringField(body, 'type'),
      title: stringField(body, 'title'),
      status: typeof body['status'] === 'number' ? body['status'] : response.status,
      detail: stringField(body, 'detail'),
      timestamp: stringField(body, 'timestamp'),
      path: stringField(body, 'path'),
      fieldErrors: readFieldErrors(body['fieldErrors']),
    });
  }

  if (response.status === 403) {
    return new ApiError(403, {
      title: 'FORBIDDEN',
      status: 403,
      detail: 'This role cannot open the page.',
    });
  }

  if (isRecord(body) && typeof body['error'] === 'string') {
    return new ApiError(response.status, {
      title: body['error'],
      status: response.status,
      detail: stringField(body, 'error_description') || body['error'],
    });
  }

  if (response.status === 401) {
    return new ApiError(401, {
      title: 'UNAUTHORIZED',
      status: 401,
      detail: 'Sign in again.',
    });
  }

  return new ApiError(response.status, {
    title: 'REQUEST_FAILED',
    status: response.status,
    detail: 'The request failed.',
  });
}
