import { cn } from "@workspace/ui";

import { Icons } from "#components/icons";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Icons.Loader2
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
