import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

import { ConnectWallet } from "@/components/connect-wallet"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { XIcon } from "@/components/chain-icons"
import { coin, isLive, site } from "@/lib/site"
import { cn } from "@/lib/utils"

const links = [
  ["Home", "#"],
  ["Docs", "#docs"],
] as const

export function Header({ route }: { route: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => setMenuOpen(false), [route])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {!isLive && site.socials.X && (
        <a
          href={site.socials.X}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 border-b border-white/10 bg-white px-4 py-2 text-center text-[13px] font-medium text-black transition-colors hover:bg-white/90"
        >
          <XIcon className="size-3 shrink-0" />
          <span>
            The contract address will be revealed on X. Follow @{site.socials.X.split("/").pop()}
          </span>
        </a>
      )}
      <div className="mt-3 px-4">
      <nav
        aria-label="Main"
        className={cn(
          "mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-full border pr-2 pl-5 backdrop-blur-xl transition-colors duration-300",
          scrolled ? "border-white/12 bg-black/70" : "border-white/8 bg-black/40",
        )}
      >
        <a href="#" aria-label={`${site.name} home`}>
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map(([label, href]) => {
            const active = href.slice(1) === route
            return (
              <li key={label}>
                <a
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] transition-colors hover:text-white",
                    active ? "text-white" : "text-muted-foreground",
                  )}
                >
                  {label}
                </a>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-1.5">
          <ConnectWallet />
          <Button asChild size="sm" className="max-sm:hidden">
            <a href="#trade">Trade {coin}</a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="fade-in mx-auto mt-2 max-w-5xl rounded-3xl border border-white/10 bg-black/90 p-3 backdrop-blur-xl md:hidden"
        >
          <ul className="flex flex-col">
            {links.map(([label, href]) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block rounded-2xl px-4 py-3 text-[15px] hover:bg-white/6 hover:text-white",
                    href.slice(1) === route ? "text-white" : "text-silver",
                  )}
                >
                  {label}
                </a>
              </li>
            ))}
            <li className="mt-2 border-t border-white/10 px-1 pt-3">
              <Button asChild className="w-full">
                <a href="#trade" onClick={() => setMenuOpen(false)}>
                  Trade {coin}
                </a>
              </Button>
            </li>
          </ul>
        </div>
      )}
      </div>
    </header>
  )
}
