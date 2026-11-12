import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { Reveal } from "@/components/reveal"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function SectionHeading({
  icon: Icon,
  label,
  title,
  description,
  className,
}: {
  icon: LucideIcon
  label: string
  title: ReactNode
  description?: string
  className?: string
}) {
  return (
    <Reveal className={cn("max-w-2xl", className)}>
      <Badge className="mb-5 py-1">
        <Icon />
        {label}
      </Badge>
      <h2 className="font-display text-chrome text-[34px] leading-[1.05] font-medium tracking-[-0.03em] sm:text-4xl md:text-[52px]">
        {title}
      </h2>
      {description && <p className="text-muted-foreground mt-5 max-w-xl text-base leading-relaxed">{description}</p>}
    </Reveal>
  )
}
