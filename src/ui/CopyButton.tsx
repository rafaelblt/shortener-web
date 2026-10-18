import { useEffect, useState } from "react";
import type { ComponentProps } from "react";

import { Button } from "./Button";

const FEEDBACK_MS = 2000;

type CopyState = "idle" | "copied" | "failed";

const LABELS: Record<CopyState, string> = { idle: "Copy", copied: "Copied", failed: "Copy failed" };

type CopyButtonProps = Omit<ComponentProps<typeof Button>, "onClick" | "children"> & {
  text: string;
};

/** Copies the text to the clipboard, and says so on the button for a moment. */
export function CopyButton({ text, size = "small", ...props }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timeout = setTimeout(() => {
      setState("idle");
    }, FEEDBACK_MS);
    return () => {
      clearTimeout(timeout);
    };
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <Button size={size} onClick={() => void copy()} {...props}>
      <span aria-live="polite">{LABELS[state]}</span>
    </Button>
  );
}
