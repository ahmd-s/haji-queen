import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";

/**
 * Deterministic hash of a request payload. Object keys are sorted; array order
 * is preserved so the same logical checkout always produces the same value.
 */
export function stableHash(value: unknown): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

export type IdempotencyCheck<T> =
  | { kind: "replay"; response: T }
  | { kind: "fresh" }
  | { kind: "conflict" };

export type IdempotencyParams = {
  key: string;
  scope: string;
  requestHash: string;
  ttlMs: number;
};

/** Check a key inside the caller's transaction. */
export async function checkIdempotency<T>(
  tx: Prisma.TransactionClient,
  params: IdempotencyParams
): Promise<IdempotencyCheck<T>> {
  const row = await tx.idempotencyKey.findUnique({ where: { key: params.key } });
  if (!row) return { kind: "fresh" };

  if (row.scope !== params.scope) return { kind: "conflict" };

  if (row.expiresAt <= new Date()) {
    await tx.idempotencyKey.delete({ where: { key: params.key } });
    return { kind: "fresh" };
  }

  if (row.requestHash !== params.requestHash) return { kind: "conflict" };
  if (!row.responseJson) return { kind: "conflict" };

  try {
    return { kind: "replay", response: JSON.parse(row.responseJson) as T };
  } catch {
    await tx.idempotencyKey.delete({ where: { key: params.key } });
    return { kind: "fresh" };
  }
}

export async function storeIdempotency<T>(
  tx: Prisma.TransactionClient,
  params: IdempotencyParams,
  response: T
): Promise<void> {
  await tx.idempotencyKey.create({
    data: {
      key: params.key,
      scope: params.scope,
      requestHash: params.requestHash,
      responseJson: JSON.stringify(response),
      expiresAt: new Date(Date.now() + params.ttlMs),
    },
  });
}
