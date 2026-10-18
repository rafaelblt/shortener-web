import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

import { buttonClassName } from "@/ui/button-class-name";

import { servicesContext } from "../shared/route-context";
import { shortLinkText } from "../shared/short-link";
import styles from "./ShortLinkPage.module.css";

type ShortLinkData =
  | { slug: string; outcome: "found"; targetUrl: string }
  | { slug: string; outcome: "not_found" | "deactivated" };

export async function loader({ params, context }: LoaderFunctionArgs): Promise<ShortLinkData> {
  const slug = params.slug ?? "";
  const result = await context.get(servicesContext).shortUrls.resolve(slug);
  if (result.ok) return { slug, outcome: "found", targetUrl: result.value };
  return { slug, outcome: result.error.code };
}

/**
 * What following a short link shows. The real domain of short links will redirect at once; this
 * page stands in for it in the simulation, and shows where the link leads instead of leaving the
 * app, whose memory would be lost.
 */
export function ShortLinkPage() {
  const data = useLoaderData<ShortLinkData>();
  const link = <span className={styles.link}>{shortLinkText(data.slug)}</span>;

  return (
    <main className={styles.page}>
      <title>{`${shortLinkText(data.slug)} · shortener`}</title>
      {data.outcome === "found" && (
        <>
          <p className={styles.eyebrow}>{link} leads to</p>
          <h1 className={styles.target}>{data.targetUrl}</h1>
          <a
            href={data.targetUrl}
            rel="noopener noreferrer"
            className={buttonClassName({ variant: "primary" })}
          >
            Continue
          </a>
          <p className={styles.note}>
            Simulated: the real short link redirects straight away, and this visit was counted as a
            resolution.
          </p>
        </>
      )}
      {data.outcome === "not_found" && (
        <>
          <p className={styles.eyebrow}>{link}</p>
          <h1 className={styles.title}>There's no link here.</h1>
          <p className={styles.text}>Check the address: slugs tell uppercase from lowercase.</p>
        </>
      )}
      {data.outcome === "deactivated" && (
        <>
          <p className={styles.eyebrow}>{link}</p>
          <h1 className={styles.title}>This link is turned off.</h1>
          <p className={styles.text}>Its owner deactivated it. It may come back later.</p>
        </>
      )}
      <Link to="/" className={styles.home}>
        <span className={styles.slash}>/</span>shortener
      </Link>
    </main>
  );
}
