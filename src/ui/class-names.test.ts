import { describe, expect, it } from "vitest";

import { classNames } from "./class-names";

describe("classNames", () => {
  it("joins the names that are set", () => {
    expect(classNames("a", undefined, false, null, "", "b")).toBe("a b");
  });
});
