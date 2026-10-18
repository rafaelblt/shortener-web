import { Link, useActionData, useLoaderData, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { hasIssues } from "@/domain/issue";
import type { ShortUrl } from "@/domain/short-url";
import { slugIssue, targetUrlIssue } from "@/domain/short-url";
import { buttonClassName } from "@/ui/button-class-name";
import { CopyButton } from "@/ui/CopyButton";
import { Notice } from "@/ui/Notice";
import { PageHeader } from "@/ui/PageHeader";

import { fieldMessages } from "../shared/field-messages";
import { formText } from "../shared/form-data";
import { useNotice } from "../shared/notices";
import { servicesContext } from "../shared/route-context";
import { shortLinkText, shortLinkUrl } from "../shared/short-link";
import { CreateLinkForm } from "./CreateLinkForm";
import type { CreateLinkFields } from "./CreateLinkForm";
import { LinkList } from "./LinkList";
import styles from "./LinksPage.module.css";

export const PAGE_SIZE = 10;
const MAX_PAGES = 50;

interface LinksData {
  shortUrls: ShortUrl[];
  hasMore: boolean;
  /** How many pages are shown; "Load more" asks for one more in the URL, as ?pages=2. */
  pages: number;
  now: Date;
}

interface CreateData {
  created?: ShortUrl;
  fields?: CreateLinkFields;
}

export async function loader({ request, context }: LoaderFunctionArgs): Promise<LinksData> {
  const { shortUrls } = context.get(servicesContext);
  const pages = pagesToShow(request.url);
  const shown: ShortUrl[] = [];
  let cursor: string | undefined;
  let hasMore = false;
  for (let page = 0; page < pages; page++) {
    const result = await shortUrls.list({ limit: PAGE_SIZE, cursor });
    shown.push(...result.items);
    hasMore = result.nextCursor !== null;
    if (result.nextCursor === null) break;
    cursor = result.nextCursor;
  }
  return { shortUrls: shown, hasMore, pages, now: new Date() };
}

function pagesToShow(requestUrl: string): number {
  const pages = Number(new URL(requestUrl).searchParams.get("pages"));
  return Number.isInteger(pages) ? Math.min(Math.max(pages, 1), MAX_PAGES) : 1;
}

export async function action({ request, context }: ActionFunctionArgs): Promise<CreateData> {
  const formData = await request.formData();
  const targetUrl = formText(formData, "targetUrl").trim();
  const slug = formText(formData, "slug").trim() || undefined;
  const issues = {
    targetUrl: targetUrlIssue(targetUrl),
    slug: slug === undefined ? undefined : slugIssue(slug),
  };
  if (hasIssues(issues)) return { fields: fieldMessages(issues) };

  const result = await context.get(servicesContext).shortUrls.create({ targetUrl, slug });
  if (result.ok) return { created: result.value };
  if (result.error.code === "slug_taken") return { fields: { slug: "That slug is taken." } };
  return { fields: fieldMessages(result.error.fields) };
}

export function LinksPage() {
  const { shortUrls, hasMore, pages, now } = useLoaderData<LinksData>();
  const data = useActionData<CreateData>();
  const notice = useNotice();
  const navigation = useNavigation();
  const moreSearch = `?pages=${pages + 1}`;
  const loadingMore = navigation.state === "loading" && navigation.location.search === moreSearch;
  const created = data?.created;

  return (
    <div className={styles.page}>
      <title>Links · shortener</title>
      <PageHeader title="Links" description="Your short links, newest first." />

      {notice && !data && <Notice tone="success">{notice}</Notice>}

      <CreateLinkForm fields={data?.fields} createdId={created?.id} />

      {created && (
        <Notice
          tone="success"
          actions={<CopyButton text={shortLinkUrl(created.slug)} aria-label="Copy the new link" />}
        >
          Shortened to <strong className={styles.createdLink}>{shortLinkText(created.slug)}</strong>
        </Notice>
      )}

      <LinkList shortUrls={shortUrls} highlightedId={created?.id} now={now} />

      {hasMore && (
        <Link to={moreSearch} preventScrollReset className={buttonClassName({})}>
          {loadingMore ? "Loading…" : "Load more"}
        </Link>
      )}
    </div>
  );
}
