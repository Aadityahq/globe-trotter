import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "../lib/utils";
import { FormField } from "./FormField";

const selectBaseClasses =
  "ui:flex ui:h-9 ui:w-full ui:appearance-none ui:rounded-lg ui:border ui:border-slate-300 ui:bg-white ui:px-3 ui:py-2 ui:pr-8 ui:text-sm ui:text-slate-950 ui:shadow-sm ui:outline-none ui:transition-colors ui:focus-visible:border-primary ui:focus-visible:ring-2 ui:focus-visible:ring-primary/30 ui:disabled:cursor-not-allowed ui:disabled:bg-slate-100 ui:disabled:opacity-50 ui:aria-invalid:border-red-700 ui:aria-invalid:ring-2 ui:aria-invalid:ring-red-700/20";

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type SelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "children"
> & {
  id?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  wrapperClassName?: string;
  options?: ReadonlyArray<SelectOption>;
  placeholder?: string;
  children?: React.ReactNode;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
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
      options,
      placeholder,
      children,
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
        <div data-slot="select-wrapper" className="ui:relative">
          <select
            ref={ref}
            id={id}
            data-slot="select"
            required={required}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId ?? hintId}
            className={cn(selectBaseClasses, className)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="ui:pointer-events-none ui:absolute ui:right-2.5 ui:top-1/2 ui:h-4 ui:w-4 ui:-translate-y-1/2 ui:text-slate-700"
          />
        </div>
      </FormField>
    );
  },
);

Select.displayName = "Select";
