import { ArrowRight, Check, Lightbulb } from "lucide-react"

import { Reveal } from "@/components/reveal"
import { SectionHeading } from "@/components/section-heading"
import { Button } from "@/components/ui/button"
import { coin, photos, site } from "@/lib/site"

const points = [
  `One Uniswap v4 pool on ${site.network}, paired with ETH.`,
  "The launch liquidity is locked for good. Nobody can pull it.",
  "Fee rates are fixed at launch and can't be changed afterwards.",
]

export function Feature() {
  return (
    <section className="wrap grid items-center gap-10 py-20 md:py-28 lg:grid-cols-2 lg:gap-16">
      <Reveal className="relative overflow-hidden rounded-3xl border border-white/10">
        <img
          src={photos.curves(1400)}
          alt=""
          loading="lazy"
          className="aspect-[4/5] w-full object-cover grayscale sm:aspect-[5/4] lg:aspect-[4/5]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
        <dl className="absolute inset-x-0 bottom-0 grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 backdrop-blur-md">
          {[
            ["Ticker", coin],
            ["Network", site.network],
          ].map(([label, value]) => (
            <div key={label} className="bg-black/70 p-5">
              <dt className="text-muted-foreground text-xs">{label}</dt>
              <dd className="font-display mt-1 text-2xl font-medium tracking-tight tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <div className="flex flex-col gap-7">
        <SectionHeading icon={Lightbulb} label="The definition" title={<>What {site.name} means.</>} />
        <figure className="panel rounded-2xl border border-white/10 p-6 md:p-7">
          <p className="font-display text-2xl font-medium tracking-tight md:text-3xl">
            {site.definition.term} <span className="text-graphite text-lg italic md:text-xl">({site.definition.kind})</span>
          </p>
          <p className="text-silver mt-3 text-lg leading-relaxed">{site.definition.meaning}</p>
          {site.definition.lines.map((line) => (
            <p key={line} className="text-muted-foreground mt-2 leading-relaxed">
              {line}
            </p>
          ))}
        </figure>
        <ul className="flex flex-col gap-4">
          {points.map((point) => (
            <li key={point} className="text-silver flex gap-3 text-[15px]">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white text-black">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
        <Button asChild size="lg" variant="secondary" className="group w-fit">
          <a href="#docs">
            Read how it works <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </a>
        </Button>
      </div>
    </section>
  )
}
