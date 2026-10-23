import { DEMO_CREDENTIALS } from "@/simulation/demo-data";

import styles from "./SimulationBanner.module.css";

/** Says that nothing reaches a server, above every page of the simulation. */
export function SimulationBanner() {
  return (
    <p className={styles.banner}>
      <strong>Simulation.</strong> Nothing reaches a server: it all lives in this tab and resets on
      reload. Demo account: <code>{DEMO_CREDENTIALS.username}</code> /{" "}
      <code>{DEMO_CREDENTIALS.password}</code>
    </p>
  );
}
