import { describe, expect, it } from "vitest";

import { settingsFromEnvironment } from "./settings.ts";

const KEY = Buffer.alloc(32, 3).toString("base64");
const REQUIRED = {
  GO_AUTH_URL: "http://go-auth.internal:8080",
  SHORTENER_URL: "http://shortener.internal:8000",
  SESSION_KEY: KEY,
};

describe("the settings", () => {
  it("are read from the environment", () => {
    const settings = settingsFromEnvironment({
      ...REQUIRED,
      PORT: "8080",
      CLIENT_ADDRESS_HEADER: " X-Real-IP ",
    });

    expect(settings).toEqual({
      port: 8080,
      goAuthUrl: "http://go-auth.internal:8080",
      shortenerUrl: "http://shortener.internal:8000",
      sessionKey: Buffer.alloc(32, 3),
      clientAddressHeader: "x-real-ip",
    });
  });

  it("listen on port 3000, and take the client's address from the peer, by default", () => {
    const settings = settingsFromEnvironment({ ...REQUIRED, PORT: "", CLIENT_ADDRESS_HEADER: "" });

    expect(settings.port).toBe(3000);
    expect(settings.clientAddressHeader).toBeUndefined();
  });

  it("drop the slashes at the end of a URL", () => {
    const settings = settingsFromEnvironment({ ...REQUIRED, GO_AUTH_URL: "https://go-auth.test/" });

    expect(settings.goAuthUrl).toBe("https://go-auth.test");
  });

  it.each([
    { case: "a port that isn't a number", change: { PORT: "http" }, error: /PORT must be/ },
    { case: "a port out of range", change: { PORT: "70000" }, error: /PORT must be/ },
    { case: "no URL of go-auth", change: { GO_AUTH_URL: undefined }, error: /GO_AUTH_URL is/ },
    {
      case: "a URL of the shortener that isn't one",
      change: { SHORTENER_URL: "shortener" },
      error: /SHORTENER_URL must be an http or https URL/,
    },
    {
      case: "a URL of another scheme",
      change: { SHORTENER_URL: "ftp://shortener.test" },
      error: /SHORTENER_URL must be an http or https URL/,
    },
    { case: "no session key", change: { SESSION_KEY: undefined }, error: /SESSION_KEY must be/ },
    {
      case: "a session key of 16 bytes",
      change: { SESSION_KEY: Buffer.alloc(16).toString("base64") },
      error: /SESSION_KEY must be 32 random bytes in base64.*not 16 bytes/,
    },
  ])("refuse $case", ({ change, error }) => {
    expect(() => settingsFromEnvironment({ ...REQUIRED, ...change })).toThrow(error);
  });
});
