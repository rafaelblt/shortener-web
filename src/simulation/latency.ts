/** How long each simulated request takes, picked at random between the two. */
export interface Latency {
  minMs: number;
  maxMs: number;
}

export const NO_LATENCY: Latency = { minMs: 0, maxMs: 0 };

export async function wait(latency: Latency): Promise<void> {
  const ms = latency.minMs + Math.random() * (latency.maxMs - latency.minMs);
  if (ms === 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}
