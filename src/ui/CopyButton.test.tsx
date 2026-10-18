import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  it("copies the text, and says so for a moment", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<CopyButton text="https://example.com/s/abc" />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(await navigator.clipboard.readText()).toBe("https://example.com/s/abc");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("says when the clipboard refuses the text", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    render(<CopyButton text="https://example.com/s/abc" />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(screen.getByRole("button", { name: "Copy failed" })).toBeInTheDocument();
  });
});
