import { cn } from "@/lib/utils"
import { site } from "@/lib/site"

// The Volume mark: white on a transparent background (public/volume-mark.png).
export function LogoMark({ className }: { className?: string }) {
  return <img src="/volume-mark.png" alt="" draggable={false} className={cn("w-auto select-none", className)} />
}

// Mark + wordmark, as in the header and footer.
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-6" />
      <span className="font-display text-[17px] font-semibold tracking-tight">{site.name}</span>
    </span>
  )
}
