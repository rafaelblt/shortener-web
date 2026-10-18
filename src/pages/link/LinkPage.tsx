import { Link, redirect, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import type { ShortUrl } from "@/domain/short-url";
import { buttonClassName } from "@/ui/button-class-name";
import { CopyButton } from "@/ui/CopyButton";
import { formatCount, formatDate, formatDateTime, formatRelativeTime } from "@/ui/format";

import { formText } from "../shared/form-data";
import { withNotice } from "../shared/notices";
import { servicesContext } from "../shared/route-context";
import { shortLinkText, shortLinkUrl } from "../shared/short-link";
import { StatusBadge } from "../shared/StatusBadge";
import { INTENT } from "../shared/use-submitting";
import { shortLinkPath } from "../short-link/short-link-path";
import { DeleteLink } from "./DeleteLink";
import { EditLinkForm } from "./EditLinkForm";
import type { EditData } from "./edit-link";
import { editLink } from "./edit-link";
import { isLinkIntent } from "./link-intent";
import styles from "./LinkPage.module.css";
import { LinkStatus } from "./LinkStatus";

type LinkData = { found: true; shortUrl: ShortUrl; now: Date } | { found: false };

export async function loader({ params, context }: LoaderFunctionArgs): Promise<LinkData> {
  const result = await context.get(servicesContext).shortUrls.get(params.id ?? "");
  return result.ok ? { found: true, shortUrl: result.value, now: new Date() } : { found: false };
}

export async function action({ request, params, context }: ActionFunctionArgs) {
  const { shortUrls } = context.get(servicesContext);
  const id = params.id ?? "";
  const formData = await request.formData();
  const intent = formText(formData, INTENT);
  if (!isLinkIntent(intent)) throw new Error(`The page has no form for the intent "${intent}"`);
  switch (intent) {
    case "edit":
      return editLink(shortUrls, id, formData) satisfies Promise<EditData>;
    case "enable":
      await shortUrls.enable(id);
      return null;
    case "disable":
      await shortUrls.disable(id);
      return null;
    case "delete":
      await shortUrls.delete(id);
      throw redirect(withNotice("/", "link-deleted"));
  }
}

export function LinkPage() {
  const data = useLoaderData<LinkData>();
  if (!data.found) return <LinkNotFound />;
  const { shortUrl, now } = data;
  const { slug, targetUrl, resolutionCount, lastResolvedAt, createdAt } = shortUrl;

  return (
    <div className={styles.page}>
      <title>{`/${slug} · shortener`}</title>
      <Link to="/" className={styles.back}>
        ← Links
      </Link>

      <header className={styles.header}>
        <div className={styles.identity}>
          <h1 className={styles.shortLink}>{shortLinkText(slug)}</h1>
          <p className={styles.target}>
            <span aria-hidden="true">→ </span>
            <a href={targetUrl} target="_blank" rel="noopener noreferrer">
              {targetUrl}
            </a>
          </p>
        </div>
        <div className={styles.actions}>
          <StatusBadge status={shortUrl.status} />
          <CopyButton text={shortLinkUrl(slug)} size="default" aria-label="Copy the link" />
          <Link to={shortLinkPath(slug)} className={buttonClassName({ variant: "secondary" })}>
            Open
          </Link>
        </div>
      </header>

      <dl className={styles.stats}>
        <div>
          <dt>Resolved</dt>
          <dd className={styles.statNumber}>{formatCount(resolutionCount)}</dd>
        </div>
        <div>
          <dt>Last resolved</dt>
          <dd>
            {lastResolvedAt ? (
              <time dateTime={lastResolvedAt.toISOString()} title={formatDateTime(lastResolvedAt)}>
                {formatRelativeTime(lastResolvedAt, now)}
              </time>
            ) : (
              "Never"
            )}
          </dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>
            <time dateTime={createdAt.toISOString()} title={formatDateTime(createdAt)}>
              {formatDate(createdAt)}
            </time>
          </dd>
        </div>
      </dl>

      {/* A new key empties what was typed once the saved values change. */}
      <EditLinkForm key={`${targetUrl} ${slug}`} shortUrl={shortUrl} />
      <LinkStatus status={shortUrl.status} />
      <DeleteLink slug={slug} />
    </div>
  );
}

function LinkNotFound() {
  return (
    <div className={styles.page}>
      <title>Link not found · shortener</title>
      <Link to="/" className={styles.back}>
        ← Links
      </Link>
      <h1 className={styles.notFoundTitle}>This link doesn't exist.</h1>
      <p className={styles.notFoundText}>
        It may have been deleted, or it belongs to someone else.
      </p>
    </div>
  );
}
