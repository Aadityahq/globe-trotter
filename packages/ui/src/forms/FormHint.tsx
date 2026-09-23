import * as React from "react";

import { cn } from "../lib/utils";

export type FormHintProps = React.HTMLAttributes<HTMLParagraphElement>;

export function FormHint({ className, ...props }: FormHintProps) {
  return (
    <p
      data-slot="form-hint"
      className={cn("ui:text-sm ui:text-slate-700", className)}
      {...props}
    />
  );
}

FormHint.displayName = "FormHint";
