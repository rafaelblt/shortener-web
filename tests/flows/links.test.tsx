import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PAGE_SIZE } from "@/pages/links/LinksPage";
import { renderSignedIn } from "@tests/support/render-app";
import { createShortUrls } from "@tests/support/short-urls";
import { createTestServices } from "@tests/support/simulation";

function linkRows() {
  return within(screen.getByRole("list", { name: "Your links" })).getAllByRole("listitem");
}

/** Services whose clock moves a second at each call, so that each link is newer than the last. */
function servicesWithAMovingClock() {
  let time = Date.parse("2026-10-18T12:00:00Z");
  return createTestServices({ now: () => new Date((time += 1000)) });
}

describe("the links page", () => {
  it("says there are no links yet", async () => {
    await renderSignedIn("/");

    expect(await screen.findByText("No links yet.")).toBeInTheDocument();
  });

  it("lists the links newest first, a page at a time", async () => {
    const services = servicesWithAMovingClock();
    const { user } = await renderSignedIn("/", { services });
    const slugs = Array.from({ length: PAGE_SIZE + 2 }, (_, index) => `link-${index + 1}`);
    await createShortUrls(services, slugs);
    await user.click(await screen.findByRole("link", { name: "Links" }));

    await screen.findByRole("link", { name: `/link-${PAGE_SIZE + 2}` });
    expect(linkRows()).toHaveLength(PAGE_SIZE);
    expect(linkRows()[0]).toHaveTextContent(`/link-${PAGE_SIZE + 2}`);

    await user.click(screen.getByRole("link", { name: "Load more" }));

    expect(await screen.findByRole("link", { name: "/link-1" })).toBeInTheDocument();
    expect(linkRows()).toHaveLength(PAGE_SIZE + 2);
    expect(screen.queryByRole("link", { name: "Load more" })).not.toBeInTheDocument();
  });
});

describe("shortening a link", () => {
  it("creates it with the slug given, shows it first, and empties the form", async () => {
    const { user } = await renderSignedIn("/", { services: servicesWithAMovingClock() });

    await user.type(await screen.findByLabelText("Target URL"), "https://example.com/page");
    await user.type(screen.getByLabelText("Slug optional"), "my-page");
    await user.click(screen.getByRole("button", { name: "Shorten" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Shortened to");
    expect(screen.getByRole("status")).toHaveTextContent("/s/my-page");
    expect(linkRows()[0]).toHaveTextContent("/my-page");
    expect(linkRows()[0]).toHaveTextContent("example.com/page");
    expect(screen.getByLabelText("Target URL")).toHaveValue("");
    expect(screen.getByLabelText("Slug optional")).toHaveValue("");
  });

  it("generates the slug when none is given", async () => {
    const { user } = await renderSignedIn("/");

    await user.type(await screen.findByLabelText("Target URL"), "https://example.com/page");
    await user.click(screen.getByRole("button", { name: "Shorten" }));

    expect(await screen.findByRole("link", { name: "/gen001" })).toBeInTheDocument();
  });

  it("points out the values that break the rules, keeping them", async () => {
    const { user } = await renderSignedIn("/");

    await user.type(await screen.findByLabelText("Target URL"), "example.com");
    await user.type(screen.getByLabelText("Slug optional"), "a b");
    await user.click(screen.getByRole("button", { name: "Shorten" }));

    expect(await screen.findByLabelText("Target URL")).toHaveAccessibleDescription(
      "Enter a full https:// address, such as https://example.com/page.",
    );
    expect(screen.getByLabelText("Slug optional")).toHaveAccessibleDescription(
      "Use only letters, digits, dashes and underscores.",
    );
    expect(screen.getByLabelText("Target URL")).toHaveValue("example.com");
  });

  it("says that the slug is taken", async () => {
    const services = createTestServices();
    const { user } = await renderSignedIn("/", { services });
    await createShortUrls(services, ["taken"]);

    await user.type(await screen.findByLabelText("Target URL"), "https://example.com/page");
    await user.type(screen.getByLabelText("Slug optional"), "taken");
    await user.click(screen.getByRole("button", { name: "Shorten" }));

    expect(await screen.findByLabelText("Slug optional")).toHaveAccessibleDescription(
      "That slug is taken.",
    );
  });
});
