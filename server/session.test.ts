import { describe, expect, it } from "vitest";

import type { Session } from "./session.ts";
import { sealSession, unsealSession } from "./session.ts";

const KEY = Buffer.alloc(32, 1);
const SESSION: Session = {
  id: "session-1",
  user: { id: "user-1", username: "alice" },
  accessToken: { value: "access-1", expiresAt: 1_000 },
  refreshToken: { value: "refresh-1", expiresAt: 2_000 },
};

describe("a sealed session", () => {
  it("unseals to the session it sealed", () => {
    expect(unsealSession(sealSession(SESSION, KEY), KEY)).toEqual(SESSION);
  });

  it("reveals none of the tokens", () => {
    const sealed = sealSession(SESSION, KEY);

    expect(sealed).not.toContain("access-1");
    expect(Buffer.from(sealed.replaceAll(".", ""), "base64url").toString()).not.toContain(
      "refresh-1",
    );
  });

  it("is a new text every time, for the same session", () => {
    expect(sealSession(SESSION, KEY)).not.toBe(sealSession(SESSION, KEY));
  });

  it("isn't unsealed once a character changed", () => {
    const sealed = sealSession(SESSION, KEY);
    const middle = Math.floor(sealed.length / 2);
    const changed = `${sealed.slice(0, middle)}${sealed[middle] === "A" ? "B" : "A"}${sealed.slice(middle + 1)}`;

    expect(unsealSession(changed, KEY)).toBeNull();
  });

  it("isn't unsealed with another key", () => {
    expect(unsealSession(sealSession(SESSION, KEY), Buffer.alloc(32, 2))).toBeNull();
  });

  it("isn't unsealed with its tag cut short", () => {
    const [iv, encrypted, tag = ""] = sealSession(SESSION, KEY).split(".");

    expect(unsealSession([iv, encrypted, tag.slice(0, 8)].join("."), KEY)).toBeNull();
  });

  it.each([
    { case: "an empty text", sealed: "" },
    { case: "a text without its parts", sealed: "not-a-session" },
    { case: "a text with a part too many", sealed: `${sealSession(SESSION, KEY)}.more` },
  ])("isn't unsealed from $case", ({ sealed }) => {
    expect(unsealSession(sealed, KEY)).toBeNull();
  });

  it.each([
    { case: "isn't an object", value: "a text" },
    { case: "has no user", value: { ...SESSION, user: null } },
    { case: "has a token without its expiry", value: { ...SESSION, accessToken: { value: "a" } } },
  ])("isn't unsealed when what it seals $case", ({ value }) => {
    expect(unsealSession(sealSession(value as Session, KEY), KEY)).toBeNull();
  });
});
