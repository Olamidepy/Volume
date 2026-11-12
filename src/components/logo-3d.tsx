import { cn } from "@/lib/utils"

const DEPTH = 16
const STEP_PX = 1.4

/**
 * The Volume mark, turned slowly in 3D. Stacked copies along the Z axis give it real
 * thickness, so the edge reads as solid when it turns side-on.
 * Stops turning when the visitor prefers reduced motion (see index.css).
 */
export function Logo3D({ className }: { className?: string }) {
  return (
    <div className={cn("relative [perspective:1600px]", className)} aria-hidden="true">
      <div className="animate-logo-spin relative size-full [transform-style:preserve-3d]">
        {Array.from({ length: DEPTH }, (_, i) => {
          const isFace = i === 0 || i === DEPTH - 1
          return (
            <img
              key={i}
              src="/volume-mark.png"
              alt=""
              draggable={false}
              className="absolute inset-0 size-full object-contain select-none"
              style={{
                transform: `translateZ(${(i - (DEPTH - 1) / 2) * STEP_PX}px)`,
                filter: isFace ? "drop-shadow(0 30px 60px rgb(0 0 0 / 0.6))" : "brightness(0.45) contrast(1.2)",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
