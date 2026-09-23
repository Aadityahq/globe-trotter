import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "../lib/utils";

export type FormErrorProps = React.HTMLAttributes<HTMLParagraphElement> & {
  icon?: React.ReactNode;
};

export function FormError({ icon, children, className, ...props }: FormErrorProps) {
  return (
    <p
      data-slot="form-error"
      role="alert"
      className={cn(
        "ui:flex ui:items-start ui:gap-1.5 ui:text-sm ui:text-red-800",
        className,
      )}
      {...props}
    >
      {icon ?? (
        <AlertCircle
          aria-hidden="true"
          className="ui:mt-0.5 ui:h-4 ui:w-4 ui:shrink-0"
        />
      )}
      <span>{children}</span>
    </p>
  );
}

FormError.displayName = "FormError";
