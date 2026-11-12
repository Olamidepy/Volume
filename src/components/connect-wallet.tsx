import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Copy, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { shortAddress, useWallet } from "@/lib/wallet"
import { cn } from "@/lib/utils"

type Props = {
  size?: "sm" | "lg"
  solid?: boolean
  align?: "left" | "right"
  className?: string
}

export function ConnectWallet({ size = "sm", solid = false, align = "right", className }: Props) {
  const { address, status, error, connect, disconnect } = useWallet()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  // Close the error popover once connected, so the account menu starts closed.
  useEffect(() => {
    if (status === "connected") setOpen(false)
  }, [status])

  const connected = status === "connected" && address
  const panel = cn(
    "absolute top-full z-40 mt-2 w-64 rounded-2xl border border-white/10 bg-popover p-1.5 text-sm shadow-2xl shadow-black/60",
    align === "right" ? "right-0" : "left-0",
  )
  const item =
    "flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground"

  if (!connected) {
    return (
      <div ref={ref} className="relative">
        <Button
          size={size}
          variant={solid ? "default" : "secondary"}
          disabled={status === "connecting"}
          onClick={() => {
            setOpen(true) // shows the error popover if connecting fails
            connect()
          }}
          className={className}
        >
          {status === "connecting" ? (
            "Connecting…"
          ) : size === "sm" ? (
            <>
              <span className="sm:hidden">Connect</span>
              <span className="max-sm:hidden">Connect wallet</span>
            </>
          ) : (
            "Connect wallet"
          )}
        </Button>
        {open && error && (
          <div role="alert" className={cn(panel, "p-3 text-muted-foreground")}>
            {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <Button
        size={size}
        variant="secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn("tabular-nums", className)}
      >
        <span className="size-2 rounded-full bg-white shadow-[0_0_10px_rgb(255_255_255/0.8)]" />
        {shortAddress(address)}
        <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
      </Button>
      {open && (
        <div role="menu" className={panel}>
          <p className="px-2.5 pt-1.5 pb-1 text-xs text-muted-foreground">Connected</p>
          <p className="px-2.5 pb-2 font-medium break-all">{address}</p>
          <div className="my-1 h-px bg-border" />
          <button
            role="menuitem"
            className={item}
            onClick={() => {
              navigator.clipboard?.writeText(address).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1400)
              })
            }}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy address"}
          </button>
          <button
            role="menuitem"
            className={item}
            onClick={() => {
              disconnect()
              setOpen(false)
            }}
          >
            <LogOut />
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}
