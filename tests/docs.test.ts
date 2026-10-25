// @vitest-environment node
/**
 * Checks that the links of the documents, and the references of the code to them, lead to a file
 * and a heading that exist. See CONTRIBUTING.md#every-change-covers-its-documents
 */
import { existsSync, globSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const DOCUMENTS = [
  ...globSync("*.md", { cwd: ROOT }),
  ...globSync("docs/**/*.md", { cwd: ROOT }),
].sort();

const CODE = [
  ...globSync("src/**/*.{ts,tsx,css}", { cwd: ROOT }),
  ...globSync("server/**/*.ts", { cwd: ROOT }),
  ...globSync("tests/**/*.{ts,tsx}", { cwd: ROOT }),
  ...globSync("*.{ts,js,cjs}", { cwd: ROOT }),
  ...globSync(".*.cjs", { cwd: ROOT }),
].sort();

const FENCED_BLOCK = /^```.*?^```/gms;
const INLINE_CODE = /`[^`\n]*`/g;
const MARKDOWN_LINK = /\[[^\]]*\]\(([^)\s]+)\)/g;
const HEADING = /^#{1,6} (.+)$/gm;
// A document the code names, as a comment does with "See docs/<file>#<heading>".
const CODE_REFERENCE = /\b((?:docs\/[\w./-]+|[A-Z]+)\.md(?:#[\w-]+)?)/g;

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

/** The anchors GitHub gives the headings of the document. */
function anchorsOf(document: string): Set<string> {
  const anchors = new Set<string>();
  for (const [, heading = ""] of read(document).replace(FENCED_BLOCK, "").matchAll(HEADING)) {
    const anchor = heading
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_\- ]/gu, "")
      .replaceAll(" ", "-");
    let unique = anchor;
    for (let count = 1; anchors.has(unique); count++) unique = `${anchor}-${count}`;
    anchors.add(unique);
  }
  return anchors;
}

/** Whether the target, a path from the root with an optional anchor, is missing. */
function isBroken(target: string): boolean {
  const [path = "", anchor = ""] = target.split("#");
  if (!existsSync(join(ROOT, path))) return true;
  return anchor !== "" && path.endsWith(".md") && !anchorsOf(path).has(anchor);
}

function linksOf(document: string): string[] {
  const text = read(document).replace(FENCED_BLOCK, "").replace(INLINE_CODE, "");
  return [...text.matchAll(MARKDOWN_LINK)]
    .map(([, link = ""]) => link)
    .filter((link) => !/^[a-z]+:/.test(link))
    .map((link) => {
      const [path = "", anchor] = link.split("#");
      const target = path === "" ? document : relative(ROOT, join(ROOT, dirname(document), path));
      return anchor === undefined ? target : `${target}#${anchor}`;
    });
}

describe("the documents", () => {
  it("are found", () => {
    expect(DOCUMENTS).toContain("README.md");
    expect(DOCUMENTS).toContain("docs/architecture/README.md");
  });

  it.each(DOCUMENTS)("%s links to files and headings that exist", (document) => {
    expect(linksOf(document).filter(isBroken)).toEqual([]);
  });
});

describe("the code", () => {
  it.each(CODE)("%s names documents and headings that exist", (file) => {
    const references = [...read(file).matchAll(CODE_REFERENCE)].map(
      ([, reference = ""]) => reference,
    );
    expect(references.filter(isBroken)).toEqual([]);
  });
});
