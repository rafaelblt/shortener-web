import { afterEach, describe, expect, it, vi } from "vitest";

import { NO_LATENCY, wait } from "./latency";

describe("wait", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves without a timer when there is no latency", async () => {
    vi.useFakeTimers();

    await wait(NO_LATENCY);

    expect(vi.getTimerCount()).toBe(0);
  });

  it("waits a time between the minimum and the maximum", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    let resolved = false;

    const waiting = wait({ minMs: 100, maxMs: 300 }).then(() => (resolved = true));
    await vi.advanceTimersByTimeAsync(199);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await waiting;

    expect(resolved).toBe(true);
  });
});
