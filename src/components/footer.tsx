import { Logo } from "@/components/logo"
import { isLive, photoCredit, site } from "@/lib/site"

const pages = [
  ["Home", "#"],
  ["Trade", "#trade"],
  ["Docs", "#docs"],
]

export function Footer() {
  const socials = Object.entries(site.socials).filter(([, url]) => url)
  const link = "text-muted-foreground text-sm transition-colors hover:text-white"

  return (
    <footer className="overflow-hidden border-t border-white/10">
      <div className="wrap grid grid-cols-2 gap-10 pt-16 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="text-muted-foreground mt-4 max-w-xs text-sm leading-relaxed">
            {site.tagline} A coin on {site.network}, {isLive ? "live" : "coming soon"} on {site.launchpad}.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium">Site</p>
          <ul className="mt-4 space-y-2.5">
            {pages.map(([label, href]) => (
              <li key={label}>
                <a href={href} className={link}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium">Community</p>
          <ul className="mt-4 space-y-2.5">
            {socials.map(([name, url]) => (
              <li key={name}>
                <a href={url} target="_blank" rel="noreferrer" className={link}>
                  {name}
                </a>
              </li>
            ))}
            <li>
              <a href={site.launchUrl} target="_blank" rel="noreferrer" className={link}>
                {site.launchpad}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="wrap">
        <div className="text-graphite mt-14 flex flex-wrap justify-between gap-x-8 gap-y-2 border-t border-white/10 py-6 text-xs">
          <span>
            &copy; {new Date().getFullYear()} {site.name}. Not affiliated with Uniswap Labs or {site.launchpad}.
          </span>
          <span>Coins can lose value. Nothing here is financial advice.</span>
          <span>
            Photos by{" "}
            <a href={photoCredit.url} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-white hover:underline">
              {photoCredit.name}
            </a>{" "}
            on Unsplash.
          </span>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="font-display pointer-events-none -mb-[0.22em] text-center text-[25vw] leading-none font-semibold tracking-[-0.06em] select-none"
        style={{
          background: "linear-gradient(180deg, rgb(255 255 255 / 0.22), rgb(255 255 255 / 0) 85%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {site.name}
      </p>
    </footer>
  )
}
