import { ArrowLeftRight, BarChart3, Percent, Workflow } from "lucide-react"

import { SectionHeading } from "@/components/section-heading"
import { coin, photos, site } from "@/lib/site"

const steps = [
  {
    icon: ArrowLeftRight,
    photo: photos.waves,
    title: `You trade ${coin}`,
    text: `Every buy and sell goes through one Uniswap v4 pool on ${site.network}, priced against ETH.`,
  },
  {
    icon: Percent,
    photo: photos.lines,
    title: "The pool takes its fee",
    text: `A fee is taken in ETH on each trade, shared between the creator wallet and ${site.launchpad}.`,
  },
  {
    icon: BarChart3,
    photo: photos.cylinders,
    title: "The volume adds up",
    text: "Each trade is recorded on-chain, so anyone can check the volume for themselves.",
  },
]

export function Steps() {
  return (
    <section className="wrap py-20 md:py-28">
      <SectionHeading
        icon={Workflow}
        label="How it works"
        title={
          <>
            Trade. Grow.
            <br />
            Generate volume.
          </>
        }
        description={`What happens each time someone trades ${coin}.`}
      />
      <div className="relative mt-12 h-px bg-white/10 max-md:hidden" aria-hidden="true">
        <span className="flow absolute -top-[3px] block size-[7px] -translate-x-1/2 rounded-full bg-white" />
      </div>
      <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.title} className="group flex flex-col bg-black">
            <div className="relative overflow-hidden">
              <img
                src={step.photo(900)}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full object-cover grayscale transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            </div>
            <div className="flex flex-1 flex-col p-6 md:p-7">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <step.icon className="size-[18px] text-white" />
                </span>
                <span className="font-display text-graphite text-sm tabular-nums">
                  {i + 1}/{steps.length}
                </span>
              </div>
              <h3 className="font-display mt-6 text-lg font-medium tracking-tight">{step.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
