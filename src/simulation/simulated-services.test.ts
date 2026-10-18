import { describe, expect, it } from "vitest";

import { DEMO_CREDENTIALS } from "./demo-data";
import { createSimulatedServices } from "./simulated-services";

describe("createSimulatedServices", () => {
  it("starts with no accounts", async () => {
    const { auth } = createSimulatedServices();

    expect((await auth.signIn(DEMO_CREDENTIALS)).ok).toBe(false);
  });

  it("adds the demo account, with short URLs of each status, when asked to", async () => {
    const { auth, shortUrls } = createSimulatedServices({ withDemoData: true });

    expect((await auth.signIn(DEMO_CREDENTIALS)).ok).toBe(true);
    const { items } = await shortUrls.list({ limit: 100 });
    expect(new Set(items.map((shortUrl) => shortUrl.status))).toEqual(
      new Set(["active", "deactivated"]),
    );
  });
});
