import { ArrowLeftRight, ArrowUpRight, Rocket, ShieldCheck, Wallet } from "lucide-react"

import { SectionHeading } from "@/components/section-heading"
import { coin, isLive, site } from "@/lib/site"

const cards = [
  {
    icon: Wallet,
    title: "Connect your wallet",
    text: `Use any wallet on ${site.network}, with some ETH for the trade and for gas.`,
    href: "#trade",
    cta: "Go to Trade",
  },
  {
    icon: ShieldCheck,
    title: "Check the contract",
    text: "Only trust the contract address shown on this site. Check the amount before you sign.",
    href: "#docs",
    cta: "Safety tips",
  },
  {
    icon: ArrowLeftRight,
    title: `Trade ${coin}`,
    text: isLive
      ? `Buy and sell on the Trade page, or on ${site.launchpad}.`
      : `Trading opens on the Trade page when ${site.name} launches on ${site.launchpad}.`,
    href: site.launchUrl,
    cta: `Open ${site.launchpad}`,
  },
]

export function Ready() {
  return (
    <section className="wrap py-20 md:py-28">
      <SectionHeading
        icon={Rocket}
        label={isLive ? "Get started" : "Before launch"}
        title={
          <>
            Three steps
            <br />
            to your first trade.
          </>
        }
      />
      <ol className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
        {cards.map((card, i) => {
          const external = card.href.startsWith("http")
          return (
            <li key={card.title}>
              <a
                href={card.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noreferrer" : undefined}
                className="panel group flex h-full flex-col rounded-2xl border border-white/10 p-6 transition-colors hover:border-white/25 md:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <card.icon className="size-[18px] text-white" />
                  </span>
                  <span className="font-display text-graphite text-sm tabular-nums">0{i + 1}</span>
                </div>
                <h3 className="font-display mt-8 text-xl font-medium tracking-tight">{card.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{card.text}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-8 text-sm font-medium">
                  {card.cta}
                  <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
              </a>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
