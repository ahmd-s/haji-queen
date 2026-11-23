/** Thin client-side transport for authenticated admin APIs. */

export type FieldIssues = Record<string, string[] | undefined>;

export class AdminApiError extends Error {
  readonly status: number;
  readonly issues?: FieldIssues;

  constructor(message: string, status: number, issues?: FieldIssues) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.issues = issues;
  }
}

type JsonRecord = {
  error?: unknown;
  issues?: unknown;
  [key: string]: unknown;
};

function normaliseIssues(value: unknown): FieldIssues | undefined {
  if (!value || typeof value !== "object") return undefined;
  const result: FieldIssues = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (Array.isArray(entry)) {
      result[key] = entry.map(String);
    } else if (typeof entry === "string") {
      result[key] = [entry];
    }
  }
  return result;
}

export async function adminFetch<T = unknown>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  const body = init.body;
  if (body !== undefined && body !== null && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new AdminApiError("Could not reach the server. Check your connection and try again.", 0);
  }

  let data: JsonRecord = {};
  try {
    data = (await response.json()) as JsonRecord;
  } catch {
    data = response.ok ? {} : { error: "The server returned an unexpected response." };
  }

  if (!response.ok) {
    const message =
      typeof data.error === "string" && data.error.trim()
        ? data.error
        : response.status === 401
          ? "Your session expired. Please sign in again."
          : response.status === 403
            ? "You do not have permission for this action."
            : "Something went wrong. Please try again.";
    throw new AdminApiError(message, response.status, normaliseIssues(data.issues));
  }
  return data as T;
}

export function firstIssue(issues: FieldIssues | undefined, field: string): string | undefined {
  return issues?.[field]?.[0];
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof AdminApiError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export function toFormData(files: File[]): FormData {
  const fd = new FormData();
  for (const file of files) fd.append("files", file);
  return fd;
}
