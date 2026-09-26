import * as React from "react";

import { cn } from "../lib/utils";
import { FormField } from "./FormField";

const textareaBaseClasses =
  "ui:flex ui:min-h-20 ui:w-full ui:rounded-lg ui:border ui:border-slate-300 ui:bg-white ui:px-3 ui:py-2 ui:text-sm ui:text-slate-950 ui:shadow-sm ui:outline-none ui:transition-colors ui:placeholder:text-slate-500 ui:focus-visible:border-primary ui:focus-visible:ring-2 ui:focus-visible:ring-primary/30 ui:disabled:cursor-not-allowed ui:disabled:bg-slate-100 ui:disabled:opacity-50 ui:aria-invalid:border-red-700 ui:aria-invalid:ring-2 ui:aria-invalid:ring-red-700/20";

export type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id"
> & {
  id?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  wrapperClassName?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
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
      <FormField
        label={label}
        htmlFor={id}
        required={required}
        hint={hint}
        error={error}
        hintId={hintId}
        errorId={errorId}
        className={wrapperClassName}
      >
        <textarea
          ref={ref}
          id={id}
          data-slot="textarea"
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId ?? hintId}
          className={cn(textareaBaseClasses, className)}
          {...props}
        />
      </FormField>
    );
  },
);

Textarea.displayName = "Textarea";
