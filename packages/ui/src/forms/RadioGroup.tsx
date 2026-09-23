import * as React from "react";

import { cn } from "../lib/utils";
import { FormError } from "./FormError";
import { FormHint } from "./FormHint";

export type RadioOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  id?: string;
};

export type RadioGroupProps = Omit<
  React.FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "onChange"
> & {
  label?: React.ReactNode;
  name: string;
  options: ReadonlyArray<RadioOption>;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  orientation?: "vertical" | "horizontal";
  wrapperClassName?: string;
};

export function RadioGroup({
  label,
  name,
  options,
  value,
  defaultValue,
  onChange,
  required,
  disabled,
  hint,
  error,
  orientation = "vertical",
  wrapperClassName,
  className,
  ...props
}: RadioGroupProps) {
  const generatedId = React.useId();
  const groupId = props.id ?? generatedId;
  const hintId = hint && !error ? `${groupId}-hint` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;

  return (
    <div
      data-slot="radio-group-field"
      className={cn("ui:flex ui:flex-col ui:gap-1.5", wrapperClassName)}
    >
      <fieldset
        data-slot="radio-group"
        id={groupId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId ?? hintId}
        className={cn(
          "ui:flex ui:flex-col ui:gap-1.5 ui:disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {label && (
          <legend className="ui:mb-1 ui:text-sm ui:font-medium ui:leading-none">
            {label}
            {required && (
              <span aria-hidden="true" className="ui:text-red-800">
                {" *"}
              </span>
            )}
          </legend>
        )}
        <div
          className={cn(
            "ui:flex",
            orientation === "horizontal"
              ? "ui:flex-row ui:flex-wrap ui:gap-x-4 ui:gap-y-2"
              : "ui:flex-col ui:gap-2",
          )}
        >
          {options.map((option) => {
            const optionId = option.id ?? `${groupId}-${option.value}`;
            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className="ui:flex ui:cursor-pointer ui:items-center ui:gap-2 ui:text-sm ui:select-none ui:has-disabled:cursor-not-allowed ui:has-disabled:opacity-50"
              >
                <input
                  id={optionId}
                  type="radio"
                  name={name}
                  value={option.value}
                  required={required}
                  disabled={disabled ?? option.disabled}
                  checked={value !== undefined ? value === option.value : undefined}
                  defaultChecked={
                    value === undefined && defaultValue !== undefined
                      ? defaultValue === option.value
                      : undefined
                  }
                  onChange={(event) => onChange?.(event.target.value)}
                  className="ui:h-4 ui:w-4 ui:shrink-0 ui:border ui:border-slate-300 ui:accent-primary ui:outline-none ui:transition-colors ui:focus-visible:ring-2 ui:focus-visible:ring-primary/30 ui:disabled:cursor-not-allowed"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {error ? (
        <FormError id={errorId}>{error}</FormError>
      ) : hint ? (
        <FormHint id={hintId}>{hint}</FormHint>
      ) : null}
    </div>
  );
}

RadioGroup.displayName = "RadioGroup";
