import type { ComponentProps } from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

export function Separator({ className, ...props }: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      className={cn("bg-border h-px w-full shrink-0", className)}
      {...props}
    />
  )
}
