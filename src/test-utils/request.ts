import { randomUUID } from "node:crypto";

/**
 * A fresh, unique key per call so integration tests get their own rate-limit
 * bucket in the shared dev Redis instance instead of colliding with each
 * other or with manual testing.
 */
export function uniqueTestIp(): string {
  return `test-${randomUUID()}`;
}

export function jsonRequest(
  url: string,
  method: string,
  body?: unknown,
  ip: string = uniqueTestIp(),
): Request {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
