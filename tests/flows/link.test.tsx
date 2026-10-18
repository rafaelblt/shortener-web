import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { err } from "@/services/result";
import { renderSignedIn } from "@tests/support/render-app";
import { createShortUrls } from "@tests/support/short-urls";
import { createTestServices, unwrap } from "@tests/support/simulation";

async function renderLinkPage() {
  const services = createTestServices();
  const rendered = await renderSignedIn("/", { services });
  const [shortUrl] = await createShortUrls(services, ["my-link", "other-link"]);
  if (!shortUrl) throw new Error("no short URL was created");
  await rendered.router.navigate(`/links/${shortUrl.id}`);
  await screen.findByRole("heading", { name: /\/s\/my-link$/ });
  return { ...rendered, shortUrl };
}

describe("the page of a link", () => {
  it("opens from the list, and shows the link with its numbers", async () => {
    const services = createTestServices();
    const { user } = await renderSignedIn("/", { services });
    await createShortUrls(services, ["my-link"]);
    unwrap(await services.shortUrls.resolve("my-link"));
    await user.click(await screen.findByRole("link", { name: "Links" }));

    await user.click(await screen.findByRole("link", { name: "/my-link" }));

    expect(await screen.findByRole("heading", { name: /\/s\/my-link$/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.com/my-link" })).toBeInTheDocument();
    expect(screen.getByText("Resolved").nextElementSibling).toHaveTextContent("1");
  });

  it("says when the link doesn't exist", async () => {
    await renderSignedIn("/links/unknown");

    expect(
      await screen.findByRole("heading", { name: "This link doesn't exist." }),
    ).toBeInTheDocument();
  });
});

describe("editing a link", () => {
  it("saves a new target URL and slug", async () => {
    const { user } = await renderLinkPage();
    const save = screen.getByRole("button", { name: "Save changes" });
    expect(save).toBeDisabled();

    await user.clear(screen.getByLabelText("Target URL"));
    await user.type(screen.getByLabelText("Target URL"), "https://example.com/new");
    await user.clear(screen.getByLabelText("Slug"));
    await user.type(screen.getByLabelText("Slug"), "new-slug");
    await user.click(save);

    expect(await screen.findByText("Saved.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /\/s\/new-slug$/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.com/new" })).toBeInTheDocument();
  });

  it("says that the slug is taken, and keeps the link as it was", async () => {
    const { user } = await renderLinkPage();

    await user.clear(screen.getByLabelText("Slug"));
    await user.type(screen.getByLabelText("Slug"), "other-link");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByLabelText("Slug")).toHaveAccessibleDescription("That slug is taken.");
    expect(screen.getByRole("heading", { name: /\/s\/my-link$/ })).toBeInTheDocument();
  });

  it("points out a target URL that breaks the rules", async () => {
    const { user } = await renderLinkPage();

    await user.clear(screen.getByLabelText("Target URL"));
    await user.type(screen.getByLabelText("Target URL"), "http://example.com");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByLabelText("Target URL")).toHaveAccessibleDescription(
      "Enter a full https:// address, such as https://example.com/page.",
    );
  });
});

describe("editing a link that changed elsewhere", () => {
  it("says that nothing changed when only spaces around the values were added", async () => {
    const { user } = await renderLinkPage();

    await user.type(screen.getByLabelText("Slug"), " ");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nothing changed");
  });

  it("says that nothing changed when the back end finds nothing to update", async () => {
    const { user, services } = await renderLinkPage();
    services.shortUrls.update = () => Promise.resolve(err({ code: "nothing_to_update" }));

    await user.type(screen.getByLabelText("Slug"), "-2");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nothing changed");
  });

  it("shows that the link doesn't exist anymore when it was deleted meanwhile", async () => {
    const { user, services, shortUrl } = await renderLinkPage();
    unwrap(await services.shortUrls.delete(shortUrl.id));

    await user.type(screen.getByLabelText("Slug"), "-2");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(
      await screen.findByRole("heading", { name: "This link doesn't exist." }),
    ).toBeInTheDocument();
  });
});

describe("the status of a link", () => {
  it("deactivates the link, and activates it again", async () => {
    const { user } = await renderLinkPage();
    expect(screen.getByText("Active")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(await screen.findByText("Deactivated")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Activate" }));
    expect(await screen.findByText("Active")).toBeInTheDocument();
  });
});

describe("a form the page doesn't have", () => {
  it("shows the error page", async () => {
    const { router, shortUrl } = await renderLinkPage();
    const formData = new FormData();
    formData.set("intent", "rename");

    await router.navigate(`/links/${shortUrl.id}`, { formMethod: "post", formData });

    expect(
      await screen.findByRole("heading", { name: "Something went wrong." }),
    ).toBeInTheDocument();
  });
});

describe("deleting a link", () => {
  it("asks first, deletes it, and goes back to the list", async () => {
    const { user, router } = await renderLinkPage();

    await user.click(screen.getByRole("button", { name: "Delete link" }));
    await user.click(screen.getByRole("button", { name: "Delete for good" }));

    expect(await screen.findByRole("status")).toHaveTextContent("The link was deleted");
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByRole("link", { name: "/my-link" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "/other-link" })).toBeInTheDocument();
  });

  it("keeps the link when the person changes their mind", async () => {
    const { user } = await renderLinkPage();

    await user.click(screen.getByRole("button", { name: "Delete link" }));
    await user.click(screen.getByRole("button", { name: "Keep it" }));

    expect(screen.getByRole("button", { name: "Delete link" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /\/s\/my-link$/ })).toBeInTheDocument();
  });
});
