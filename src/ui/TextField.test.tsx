import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextField } from "./TextField";

describe("TextField", () => {
  it("labels the input, and describes it with the hint", () => {
    render(<TextField label="Username" hint="3 to 32 characters." name="username" />);

    const input = screen.getByRole("textbox", { name: "Username" });
    expect(input).toHaveAccessibleDescription("3 to 32 characters.");
    expect(input).not.toBeInvalid();
  });

  it("marks the input invalid, and shows the error instead of the hint", () => {
    render(<TextField label="Username" hint="3 to 32 characters." error="Enter a username." />);

    const input = screen.getByRole("textbox", { name: "Username" });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Enter a username.");
    expect(screen.queryByText("3 to 32 characters.")).not.toBeInTheDocument();
  });

  it("says when the field is optional", () => {
    render(<TextField label="Slug" optional />);

    expect(screen.getByRole("textbox", { name: "Slug optional" })).toBeInTheDocument();
  });

  it("shows the prefix without making it part of the name", () => {
    render(<TextField label="Slug" prefix="example.com/s/" />);

    expect(screen.getByText("example.com/s/")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Slug" })).toBeInTheDocument();
  });
});
