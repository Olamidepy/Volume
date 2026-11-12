import { CircleHelp } from "lucide-react"

import { SectionHeading } from "@/components/section-heading"
import { Cta } from "@/components/sections/cta"
import { Facts } from "@/components/sections/facts"
import { Feature } from "@/components/sections/feature"
import { Ready } from "@/components/sections/ready"
import { Steps } from "@/components/sections/steps"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { coin, isLive, site } from "@/lib/site"

const questions = [
  [
    `What is ${site.name}?`,
    `${site.name} (${coin}) is a coin on ${site.network}, ${isLive ? "live" : "coming soon"} on ${site.launchpad}. It trades in a single Uniswap v4 pool against ETH.`,
  ],
  [
    `Why is it called ${coin}?`,
    `Uniswap is on v4, and ${coin} is a joke about skipping two versions ahead. ${site.name} is not made by, or affiliated with, Uniswap Labs.`,
  ],
  [
    "What are the fees?",
    `A fee is taken in ETH on every buy and sell, shared between the creator wallet and ${site.launchpad}. The exact rates are shown on ${site.launchpad} at launch.`,
  ],
  [
    "Is the price guaranteed to go up?",
    "No. Price depends on the market. Coins can lose some or all of their value.",
  ],
  [
    `How do I buy ${coin}?`,
    `Connect your wallet, then use the Trade page once ${site.name} is live. Check the contract address on this site before you sign anything.`,
  ],
  [
    "Which wallets work?",
    `Any ${site.network} wallet, such as MetaMask or Rabby. You need ETH for the trade and for gas.`,
  ],
]


export function Home() {
  return (
    <main>
      <section className="relative isolate overflow-hidden pt-28 pb-20 md:pt-44 md:pb-28">
        {/* The X cover artwork, behind the hero. */}
        <img
          src="/volume-cover.jpg"
          alt=""
          className="absolute inset-0 -z-20 size-full object-cover opacity-90 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
        />

        <div className="wrap">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge className="fade-in mb-6 py-1">
              <span className="size-1.5 rounded-full bg-white" />
              {isLive ? "Live" : "Coming soon"} on {site.launchpad}
            </Badge>
            <h1 className="font-display text-chrome fade-in text-[42px] leading-[1.02] font-medium tracking-[-0.035em] sm:text-6xl md:text-[76px]">
              Trade. Grow.
              <br />
              Generate volume.
            </h1>
            <p
              className="text-muted-foreground fade-in mt-6 max-w-[34rem] text-base leading-relaxed md:mt-7 md:text-[17px]"
              style={{ animationDelay: "150ms" }}
            >
              {site.name} ({coin}) is a coin on {site.network} built around one thing: trading. One Uniswap v4 pool,
              locked liquidity, fees fixed at launch.
            </p>
            <div
              className="fade-in mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center md:mt-9"
              style={{ animationDelay: "300ms" }}
            >
              <Button asChild size="lg" className="w-full sm:w-auto">
                <a href="#trade">Trade {coin}</a>
              </Button>
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
<a href="#docs">Read the docs</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Feature />
      <Steps />
      <Ready />
      <Facts />

      <section className="wrap grid gap-8 py-20 md:grid-cols-[1fr_1.4fr] md:gap-12 md:py-28">
        <SectionHeading
          icon={CircleHelp}
          label="FAQ"
          title={
            <>
              Questions,
              <br />
              answered.
            </>
          }
          description="Anything else? Ask us on X."
        />
        <Accordion type="single" collapsible defaultValue={questions[0][0]} className="rounded-2xl border border-white/10 px-5 md:px-6">
          {questions.map(([question, answer]) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <Cta />
    </main>
  )
}
