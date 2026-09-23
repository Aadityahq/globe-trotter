import * as React from "react";

import { cn } from "../lib/utils";
import { FormError } from "./FormError";
import { FormHint } from "./FormHint";
import { Label } from "./Label";

export type FormFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  hintId?: string;
  errorId?: string;
};

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  error,
  hintId,
  errorId,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div
      data-slot="form-field"
      className={cn("ui:flex ui:flex-col ui:gap-1.5", className)}
      {...props}
    >
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <FormError id={errorId}>{error}</FormError>
      ) : hint ? (
        <FormHint id={hintId}>{hint}</FormHint>
      ) : null}
    </div>
  );
}

FormField.displayName = "FormField";
