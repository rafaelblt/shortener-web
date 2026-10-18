import type { ComponentProps } from "react";

import type { ButtonLook } from "./button-class-name";
import { buttonClassName } from "./button-class-name";
import { classNames } from "./class-names";

type ButtonProps = ComponentProps<"button"> & ButtonLook;

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={classNames(buttonClassName({ variant, size }), className)}
      {...props}
    />
  );
}
