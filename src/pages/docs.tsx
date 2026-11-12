import { BookOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { coin, isLive, site } from "@/lib/site"

const sections = [
  {
    id: "overview",
    title: "Overview",
    body: [
      `${site.definition.term} (${site.definition.kind}): ${site.definition.meaning} ${site.definition.lines.join(" ")}`,
      `${site.name} (${coin}) is a coin on ${site.network}, ${isLive ? "live" : "coming soon"} on ${site.launchpad}.`,
      `It has a fixed supply of ${site.supply} and trades against ETH in a single Uniswap v4 pool.`,
    ],
  },
  {
    id: "trading",
    title: "How trading works",
    body: [
      `Every buy and sell of ${coin} goes through the same pool. You pay or receive ETH, and the fee is taken from the ETH side of the trade.`,
      "Each trade is recorded on-chain, so the trading volume can be checked by anyone on Etherscan.",
    ],
  },
  {
    id: "fees",
    title: "Fees",
    body: [
      `A fee is taken on every buy and sell, shared between the creator wallet and ${site.launchpad}. The exact rates are shown on ${site.launchpad} at launch.`,
      "The creator share is paid in ETH to the creator's wallet. Fee rates are set at launch and can't be changed afterwards. There is no tax on transfers between wallets.",
    ],
  },
  {
    id: "launch",
    title: "Launch details",
    body: [
      `${site.name} launches through ${site.launchpad} with its protected launch contracts. The whole supply goes into the pool at launch, and that liquidity position is locked permanently.`,
      "Launch protection applies at the start. For the first 5 minutes, each wallet can buy at most 2% of the supply. For the first 30 seconds, the buy fee starts very high and falls to normal, which makes sniping the launch expensive.",
      "Launch details are confirmed when the launch transaction is signed. The contract address on the Trade page is the one to trust.",
    ],
  },
  {
    id: "name",
    title: "About the name",
    body: [
      `Uniswap's current version is v4. ${coin} is a joke about being two versions ahead.`,
      `${site.name} is an independent coin. It is not made by, endorsed by, or affiliated with Uniswap Labs or ${site.launchpad}.`,
    ],
  },
  {
    id: "safety",
    title: "Stay safe",
    body: [
      "Only use the contract address shown on this site. Check the network and the amount in your wallet before you sign.",
      `${site.launchpad}'s launch contracts are public and verified, but they have not had an independent audit.`,
      "Coins can lose some or all of their value. Nothing on this site is financial advice.",
    ],
  },
]

export function Docs() {
  return (
    <main className="wrap pt-40 pb-20 md:pt-48 md:pb-28">
      <Badge className="mb-5 py-1">
        <BookOpen />
        Docs
      </Badge>
      <h1 className="font-display text-chrome fade-in text-[42px] leading-[1.02] font-medium tracking-[-0.035em] sm:text-6xl md:text-[76px]">
        How {site.name} works
      </h1>

      <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        <nav className="flex flex-wrap gap-1 self-start lg:sticky lg:top-28 lg:flex-col" aria-label="Docs sections">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => document.getElementById(section.id)?.scrollIntoView()}
              className="text-muted-foreground cursor-pointer rounded-full px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-white/6 hover:text-white"
            >
              {section.title}
            </button>
          ))}
        </nav>

        <div className="flex max-w-[68ch] min-w-0 flex-col rounded-2xl border border-white/10 px-6 md:px-8">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28 border-b border-white/10 py-8 last:border-b-0 md:py-10">
              <h2 className="font-display text-2xl font-medium tracking-tight md:text-3xl">{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-muted-foreground mt-4 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
