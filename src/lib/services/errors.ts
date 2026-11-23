import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export type ServiceErrorCode =
  | "VALIDATION"
  | "UNAVAILABLE"
  | "PAYMENT_UNAVAILABLE"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN";

const DEFAULT_STATUS: Record<ServiceErrorCode, number> = {
  VALIDATION: 400,
  UNAVAILABLE: 400,
  PAYMENT_UNAVAILABLE: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  FORBIDDEN: 403,
};

/**
 * Expected business-rule failures. Routes translate these into stable HTTP
 * responses; unexpected errors are logged and replaced with a generic message.
 */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ServiceErrorCode,
    message: string,
    options: { status?: number; details?: Record<string, unknown> } = {}
  ) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.status = options.status ?? DEFAULT_STATUS[code];
    this.details = options.details;
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}

export function serviceErrorResponse(
  error: unknown,
  fallbackMessage = "Something went wrong. Please try again."
): NextResponse {
  if (error instanceof ServiceError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      { status: error.status }
    );
  }

  console.error("Service operation failed", error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

/** Prisma P2002 target can be a string or an array of field names. */
export function isPrismaUniqueError(error: unknown, field?: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  if (!field) return true;
  const target = error.meta?.target;
  if (typeof target === "string") return target.includes(field);
  if (Array.isArray(target)) return target.map(String).includes(field);
  return false;
}
