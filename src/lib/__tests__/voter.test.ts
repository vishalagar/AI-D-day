import { describe, expect, it } from "vitest";

import { VOTER_HEADER, deriveVoterKey } from "../voter";

function request(token?: string, ip = "203.0.113.5"): Request {
  const headers = new Headers({ "x-forwarded-for": ip });
  if (token) headers.set(VOTER_HEADER, token);
  return new Request("http://localhost/api/sites/x/vote", {
    method: "POST",
    headers,
  });
}

describe("deriveVoterKey", () => {
  it("is stable for the same token and IP", () => {
    expect(deriveVoterKey(request("voter-one"))).toBe(
      deriveVoterKey(request("voter-one")),
    );
  });

  it("differs between two browser tokens on the same IP", () => {
    expect(deriveVoterKey(request("voter-one"))).not.toBe(
      deriveVoterKey(request("voter-two")),
    );
  });

  it("differs for the same token from a different IP", () => {
    expect(deriveVoterKey(request("voter-one", "203.0.113.5"))).not.toBe(
      deriveVoterKey(request("voter-one", "198.51.100.9")),
    );
  });

  it("never returns the raw token or IP", () => {
    const key = deriveVoterKey(request("voter-one"));
    expect(key).not.toContain("voter-one");
    expect(key).not.toContain("203.0.113.5");
    expect(key).toMatch(/^[a-f0-9]{64}$/);
  });

  it("falls back to a usable key when the header is missing or malformed", () => {
    for (const token of [undefined, "short", "has spaces", "x".repeat(200)]) {
      expect(deriveVoterKey(request(token))).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("buckets every malformed token together rather than minting new voters", () => {
    expect(deriveVoterKey(request("short"))).toBe(
      deriveVoterKey(request("has spaces")),
    );
  });
});
