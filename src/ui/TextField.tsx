import { useId } from "react";
import type { ComponentProps } from "react";

import { classNames } from "./class-names";
import styles from "./TextField.module.css";

type TextFieldProps = Omit<ComponentProps<"input">, "id" | "prefix"> & {
  label: string;
  /** Shown under the field, until there is an error. */
  hint?: string;
  error?: string;
  /** Fixed text shown before the value, such as the start of a URL. */
  prefix?: string;
  optional?: boolean;
  monospace?: boolean;
};

export function TextField({
  label,
  hint,
  error,
  prefix,
  optional = false,
  monospace = false,
  className,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const description = error ?? hint;

  return (
    <div className={classNames(styles.field, className)}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {optional && (
          <>
            {" "}
            <span className={styles.optional}>optional</span>
          </>
        )}
      </label>
      <div className={classNames(styles.control, error && styles.invalid)}>
        {prefix && (
          <span className={styles.prefix} aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          className={classNames(styles.input, monospace && styles.mono)}
          aria-invalid={error ? true : undefined}
          aria-describedby={description ? descriptionId : undefined}
          {...inputProps}
        />
      </div>
      {description && (
        <p id={descriptionId} className={error ? styles.error : styles.hint}>
          {description}
        </p>
      )}
    </div>
  );
}
