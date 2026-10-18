import styles from "./Button.module.css";
import { classNames } from "./class-names";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "default" | "small";

export interface ButtonLook {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** The classes of a button, for an element that looks like one, such as a link. */
export function buttonClassName({ variant = "secondary", size = "default" }: ButtonLook): string {
  return classNames(styles.button, styles[variant], size === "small" && styles.small);
}
