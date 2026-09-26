import * as React from "react";

import { cn } from "../lib/utils";
import { FormError } from "./FormError";
import { FormHint } from "./FormHint";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> & {
  id?: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  wrapperClassName?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id: idProp,
      label,
      hint,
      error,
      required,
      disabled,
      wrapperClassName,
      className,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const id = idProp ?? generatedId;
    const hintId = hint && !error ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;

    return (
      <div
        data-slot="checkbox-field"
        className={cn("ui:flex ui:flex-col ui:gap-1.5", wrapperClassName)}
      >
        <label
          htmlFor={id}
          className="ui:flex ui:cursor-pointer ui:items-start ui:gap-2 ui:text-sm ui:font-medium ui:leading-none ui:select-none ui:has-disabled:cursor-not-allowed ui:has-disabled:opacity-50"
        >
          <input
            ref={ref}
            id={id}
            data-slot="checkbox"
            type="checkbox"
            required={required}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId ?? hintId}
            className={cn(
              "ui:mt-0.5 ui:h-4 ui:w-4 ui:shrink-0 ui:rounded ui:border ui:border-slate-300 ui:accent-primary ui:outline-none ui:transition-colors ui:focus-visible:ring-2 ui:focus-visible:ring-primary/30 ui:disabled:cursor-not-allowed ui:aria-invalid:border-red-700",
              className,
            )}
            {...props}
          />
          <span>
            {label}
            {required && (
              <span aria-hidden="true" className="ui:text-red-800">
                {" *"}
              </span>
            )}
          </span>
        </label>
        {error ? (
          <FormError id={errorId}>{error}</FormError>
        ) : hint ? (
          <FormHint id={hintId}>{hint}</FormHint>
        ) : null}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
