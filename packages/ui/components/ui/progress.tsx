import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "~~/utils/ui";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, children, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-10 w-full overflow-hidden border-[1px] border-white", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-green-400 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
    <div className="absolute flex flex-row w-full justify-center top-[7px]">{children}</div>
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
