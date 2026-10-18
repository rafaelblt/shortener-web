import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Notice } from "./Notice";

describe("Notice", () => {
  it.each([
    { tone: "info", role: "status" },
    { tone: "success", role: "status" },
    { tone: "error", role: "alert" },
  ] as const)("is a $role when its tone is $tone", ({ tone, role }) => {
    render(<Notice tone={tone}>Saved.</Notice>);

    expect(screen.getByRole(role)).toHaveTextContent("Saved.");
  });
});
