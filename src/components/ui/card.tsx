import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn("panel bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border border-white/10 py-6", className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("grid auto-rows-min items-start gap-2 px-6", className)} {...props} />
}

export function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("font-display text-lg font-medium leading-snug tracking-tight", className)} {...props} />
}

export function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm leading-relaxed", className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />
}
