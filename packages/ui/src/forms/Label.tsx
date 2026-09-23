import * as React from "react";

import { cn } from "../lib/utils";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

function Label({ required, children, className, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      className={cn(
        "ui:flex ui:items-center ui:gap-2 ui:text-sm ui:leading-none ui:font-medium ui:select-none ui:group-data-[disabled=true]:pointer-events-none ui:group-data-[disabled=true]:opacity-50 ui:peer-disabled:cursor-not-allowed ui:peer-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="ui:text-red-800">
          *
        </span>
      )}
    </label>
  );
}

Label.displayName = "Label";

export { Label };
