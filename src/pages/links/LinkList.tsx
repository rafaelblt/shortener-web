import { Link } from "react-router";

import type { ShortUrl } from "@/domain/short-url";
import { classNames } from "@/ui/class-names";
import { CopyButton } from "@/ui/CopyButton";
import { formatCount, formatDateTime, formatRelativeTime } from "@/ui/format";

import { shortLinkUrl, withoutScheme } from "../shared/short-link";
import { StatusBadge } from "../shared/StatusBadge";
import styles from "./LinkList.module.css";

interface LinkListProps {
  shortUrls: ShortUrl[];
  highlightedId?: string | undefined;
  now: Date;
}

export function LinkList({ shortUrls, highlightedId, now }: LinkListProps) {
  if (shortUrls.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No links yet.</p>
        <p>Shorten an address above, and it shows up here.</p>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.columns} aria-hidden="true">
        <span>Link</span>
        <span className={styles.numeric}>Resolved</span>
        <span>Status</span>
        <span>Created</span>
      </div>
      <ol className={styles.list} aria-label="Your links">
        {shortUrls.map((shortUrl) => (
          <LinkRow
            key={shortUrl.id}
            shortUrl={shortUrl}
            highlighted={shortUrl.id === highlightedId}
            now={now}
          />
        ))}
      </ol>
    </div>
  );
}

interface LinkRowProps {
  shortUrl: ShortUrl;
  highlighted: boolean;
  now: Date;
}

function LinkRow({ shortUrl, highlighted, now }: LinkRowProps) {
  const { id, slug, targetUrl, status, resolutionCount, createdAt } = shortUrl;
  return (
    <li className={classNames(styles.row, highlighted && styles.highlighted)}>
      <div className={styles.link}>
        <div className={styles.slugLine}>
          {/* The link covers the whole row, so the row opens the short URL wherever it's clicked. */}
          <Link to={`/links/${id}`} className={styles.slug}>
            <span className={styles.slash}>/</span>
            {slug}
          </Link>
          <CopyButton
            text={shortLinkUrl(slug)}
            variant="quiet"
            className={styles.copy}
            aria-label={`Copy the link of ${slug}`}
          />
        </div>
        <p className={styles.target} title={targetUrl}>
          {withoutScheme(targetUrl)}
        </p>
      </div>
      <p className={classNames(styles.count, styles.numeric)}>
        {formatCount(resolutionCount)}
        <span className={styles.countLabel}> resolved</span>
      </p>
      <p className={styles.status}>
        <StatusBadge status={status} />
      </p>
      <p className={styles.created}>
        <time dateTime={createdAt.toISOString()} title={formatDateTime(createdAt)}>
          {formatRelativeTime(createdAt, now)}
        </time>
      </p>
    </li>
  );
}
