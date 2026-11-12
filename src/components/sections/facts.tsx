import { Reveal } from "@/components/reveal"
import { isLive, photos, site } from "@/lib/site"

const facts = [
  { label: "Ticker", value: site.ticker, note: "check the contract on the Trade page" },
  { label: "Supply", value: site.supply, note: "fixed at launch" },
  { label: "Pair", value: "ETH", note: "one Uniswap v4 pool" },
  { label: "Network", value: site.network, note: `launched through ${site.launchpad}` },
  { label: "Liquidity", value: "Locked", note: "the launch position can't be withdrawn" },
  { label: "Status", value: isLive ? "Live" : "Coming soon", note: isLive ? "trading is open" : "the contract appears at launch" },
]

export function Facts() {
  return (
    <section className="relative isolate overflow-hidden border-y border-white/10">
      <img src={photos.arc(2400)} alt="" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover opacity-55 grayscale" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black via-black/55 to-black" />

      <div className="wrap py-20 md:py-32">
        <Reveal>
          <h2 className="font-display text-chrome max-w-3xl text-[34px] leading-[1.05] font-medium tracking-[-0.03em] sm:text-4xl md:text-6xl">
            {site.name} at a glance.
          </h2>
        </Reveal>
        <dl className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-16 lg:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-white/12 bg-black/50 p-6 backdrop-blur-md">
              <dt className="text-muted-foreground text-sm">{fact.label}</dt>
              <dd className="font-display mt-4 text-3xl font-medium tracking-tight tabular-nums md:text-4xl">{fact.value}</dd>
              <dd className="text-silver/80 mt-2 text-sm">{fact.note}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
