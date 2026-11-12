import { XIcon } from "@/components/chain-icons"
import { ConnectWallet } from "@/components/connect-wallet"
import { Logo3D } from "@/components/logo-3d"
import { Button } from "@/components/ui/button"
import { coin, isLive, site } from "@/lib/site"

export function Cta() {
  return (
    <section className="wrap pb-20 md:pb-28">
      <div className="panel relative isolate grid items-center gap-8 overflow-hidden rounded-3xl border border-white/10 p-6 sm:p-10 md:grid-cols-[1.4fr_1fr] md:p-14">
        <div className="grid-lines absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_80%_50%,black,transparent_70%)]" />
        <div>
          <h2 className="font-display text-chrome text-[34px] leading-[1.05] font-medium tracking-[-0.03em] md:text-5xl">
            {isLive ? `Trade ${coin} now.` : "Be ready when it opens."}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-md">
            {isLive
              ? "Connect your wallet and trade on this site. Always check the contract address before you sign."
              : "Connect your wallet now and follow along on X for the launch. Always check the contract address on this site before you sign."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ConnectWallet size="lg" solid align="left" />
            {site.socials.X && (
              <Button asChild size="lg" variant="secondary">
                <a href={site.socials.X} target="_blank" rel="noreferrer">
                  <XIcon className="size-3.5" />
                  Follow @{site.socials.X.split("/").pop()}
                </a>
              </Button>
            )}
          </div>
        </div>
        <Logo3D className="mx-auto hidden aspect-square w-full max-w-[280px] md:block" />
      </div>
    </section>
  )
}
