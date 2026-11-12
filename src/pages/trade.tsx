import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { ArrowDown, ArrowLeftRight, ArrowUpRight, Check, Clock, Loader2, RefreshCw } from "lucide-react"
import { parseUnits, type Address } from "viem"

import { EthereumIcon, EthereumMark } from "@/components/chain-icons"
import { ConnectWallet } from "@/components/connect-wallet"
import { LogoMark } from "@/components/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { coin, explorerUrl, isLive, site, uniswapUrl } from "@/lib/site"
import { balances, buildSwap, fmt, minOut, quote, reader, sellApprovals, simulate } from "@/lib/swap"
import { useWallet } from "@/lib/wallet"
import { cn } from "@/lib/utils"

type Side = "buy" | "sell"

function TokenChip({ token }: { token: "ETH" | "V6" }) {
  return (
    <span className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/6 py-1.5 pr-3.5 pl-1.5 text-sm font-medium">
      {token === "V6" ? (
        <span className="grid size-6 place-items-center rounded-full border border-white/15 bg-black">
          <LogoMark className="h-3" />
        </span>
      ) : (
        <span className="grid size-6 place-items-center rounded-full bg-[#627eea] text-white">
          <EthereumIcon className="size-3.5" />
        </span>
      )}
      {token}
    </span>
  )
}

function Field({ label, token, children }: { label: string; token: "ETH" | "V6"; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors focus-within:border-white/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="mt-2 flex items-center justify-between gap-4">
        {children}
        <TokenChip token={token} />
      </div>
    </div>
  )
}


const SLIPPAGES = [100, 300, 500, 1000] // basis points: 1%, 3%, 5%, 10%

type Stage = { kind: "idle" } | { kind: "busy"; label: string } | { kind: "done"; hash: string } | { kind: "error"; message: string }

function SideTabs({ side, setSide }: { side: Side; setSide: (s: Side) => void }) {
  return (
    <div className="flex rounded-full border p-1" role="tablist" aria-label="Trade side">
      {(["buy", "sell"] as const).map((s) => (
        <button
          key={s}
          role="tab"
          aria-selected={side === s}
          onClick={() => setSide(s)}
          className={cn(
            "rounded-full px-5 py-1.5 text-sm font-medium capitalize transition-colors",
            side === s ? "bg-white text-black" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

function NetworkPill() {
  return (
    <span className="flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm">
      <EthereumMark className="size-6" />
      {site.network}
    </span>
  )
}

function OutsideLinks() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {uniswapUrl && (
        <Button asChild size="sm" variant="outline">
          <a href={uniswapUrl} target="_blank" rel="noreferrer">
            Uniswap <ArrowUpRight />
          </a>
        </Button>
      )}
      <Button asChild size="sm" variant="outline">
        <a href={site.launchUrl} target="_blank" rel="noreferrer">
          {site.launchpad} <ArrowUpRight />
        </a>
      </Button>
    </div>
  )
}

// Live swap against the Volume pool. Every transaction is simulated from the
// trader's own address before the wallet is asked to sign it.
function SwapCard() {
  const wallet = useWallet()
  const owner = wallet.status === "connected" ? (wallet.address as Address) : null
  const [side, setSide] = useState<Side>("buy")
  const [amount, setAmount] = useState("")
  const [slippage, setSlippage] = useState(300)
  const [out, setOut] = useState<bigint | null>(null)
  const [quoteErr, setQuoteErr] = useState<string | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [bal, setBal] = useState<{ eth: bigint; token: bigint } | null>(null)
  const [stage, setStage] = useState<Stage>({ kind: "idle" })
  const seq = useRef(0)

  const pay = side === "buy" ? "ETH" : "V6"
  const get = side === "buy" ? "V6" : "ETH"
  let amountIn = 0n
  try {
    amountIn = amount ? parseUnits(amount as `${number}`, 18) : 0n
  } catch {
    amountIn = 0n
  }
  const have = bal ? (side === "buy" ? bal.eth : bal.token) : null
  const tooMuch = have !== null && amountIn > have

  const refreshBalances = useCallback(() => {
    if (!owner) return setBal(null)
    balances(owner).then(setBal).catch(() => {})
  }, [owner])
  useEffect(() => {
    refreshBalances()
    const id = setInterval(refreshBalances, 15000)
    return () => clearInterval(id)
  }, [refreshBalances])

  const refreshQuote = useCallback(() => {
    const my = ++seq.current
    if (amountIn <= 0n) {
      setOut(null)
      setQuoteErr(null)
      return
    }
    setQuoting(true)
    quote(side, amountIn)
      .then((v) => my === seq.current && (setOut(v), setQuoteErr(null)))
      .catch(() => my === seq.current && (setOut(null), setQuoteErr("No quote right now. The pool may still be opening. Try again shortly.")))
      .finally(() => my === seq.current && setQuoting(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side, amountIn.toString()])
  useEffect(() => {
    const t = setTimeout(refreshQuote, 350)
    const id = setInterval(refreshQuote, 12000)
    return () => (clearTimeout(t), clearInterval(id))
  }, [refreshQuote])

  const run = async () => {
    if (!owner) return wallet.connect()
    if (!out || amountIn <= 0n) return
    try {
      setStage({ kind: "busy", label: "Switching to Ethereum…" })
      await wallet.ensureChain()
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60)
      if (side === "sell") {
        for (const step of await sellApprovals(owner, amountIn, deadline)) {
          setStage({ kind: "busy", label: `${step.label}: confirm in your wallet…` })
          const h = await wallet.sendTransaction(step.tx)
          setStage({ kind: "busy", label: `${step.label}: waiting for confirmation…` })
          await reader.waitForTransactionReceipt({ hash: h })
        }
      }
      setStage({ kind: "busy", label: "Checking the trade…" })
      const fresh = await quote(side, amountIn)
      const tx = buildSwap(side, amountIn, minOut(fresh, slippage), deadline)
      await simulate(owner, tx)
      setStage({ kind: "busy", label: "Confirm the swap in your wallet…" })
      const hash = await wallet.sendTransaction(tx)
      setStage({ kind: "busy", label: "Swapping…" })
      const receipt = await reader.waitForTransactionReceipt({ hash })
      if (receipt.status !== "success") throw new Error("The swap reverted. No tokens moved except gas.")
      setStage({ kind: "done", hash })
      setAmount("")
      refreshBalances()
    } catch (err) {
      const e = err as { code?: number; shortMessage?: string; message?: string }
      const message = e.code === 4001 || /reject|denied|cancel/i.test(e.shortMessage ?? e.message ?? "")
        ? "Cancelled in your wallet."
        : (e.message ?? "Something went wrong.").slice(0, 160)
      setStage({ kind: "error", message })
    }
  }

  const busy = stage.kind === "busy"
  const label = !owner
    ? "Connect wallet"
    : amountIn <= 0n
      ? "Enter an amount"
      : tooMuch
        ? `Not enough ${pay}`
        : !out
          ? quoting ? "Getting quote…" : "No quote yet"
          : side === "buy" ? "Buy V6" : "Sell V6"
  const disabled = busy || (owner !== null && (amountIn <= 0n || tooMuch || !out))

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <SideTabs side={side} setSide={(s) => (setSide(s), setAmount(""), setOut(null), setStage({ kind: "idle" }))} />
          <NetworkPill />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Field label="You pay" token={pay}>
          <input
            aria-label={`Amount of ${pay}`}
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))}
            className="font-display w-full min-w-0 bg-transparent text-4xl tracking-tight tabular-nums outline-none placeholder:text-muted-foreground/50"
          />
        </Field>
        {have !== null && (
          <div className="-mt-1 flex justify-end gap-2 px-1 text-xs text-muted-foreground">
            Balance {fmt(have)} {side === "buy" ? "ETH" : "V6"}
            <button
              className="font-medium text-white hover:underline"
              onClick={() => {
                const reserve = side === "buy" ? parseUnits("0.003", 18) : 0n // leave ETH for gas
                const v = have > reserve ? have - reserve : 0n
                setAmount((Number(v) / 1e18).toString())
              }}
            >
              Max
            </button>
          </div>
        )}
        <div className="relative z-10 -my-4 flex justify-center">
          <button
            aria-label="Switch buy and sell"
            onClick={() => (setSide(side === "buy" ? "sell" : "buy"), setAmount(""), setOut(null))}
            className="grid size-10 place-items-center rounded-full border border-white/15 bg-black text-white transition-transform hover:rotate-180"
          >
            <ArrowDown className="size-4" />
          </button>
        </div>
        <Field label="You receive" token={get}>
          <span className={cn("font-display text-4xl tracking-tight tabular-nums", !out && "text-muted-foreground/50")}>
            {out ? fmt(out) : "—"}
          </span>
        </Field>

        <dl className="mt-3 flex flex-col text-sm">
          <div className="flex items-center justify-between gap-4 py-2">
            <dt className="text-muted-foreground">Slippage</dt>
            <dd className="flex gap-1">
              {SLIPPAGES.map((bps) => (
                <button
                  key={bps}
                  onClick={() => setSlippage(bps)}
                  className={cn("rounded-full border px-2.5 py-0.5 text-xs", slippage === bps ? "border-white bg-white text-black" : "text-muted-foreground")}
                >
                  {bps / 100}%
                </button>
              ))}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-muted-foreground">Minimum received</dt>
            <dd className="tabular-nums">{out ? `${fmt(minOut(out, slippage))} ${side === "buy" ? "V6" : "ETH"}` : "—"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-muted-foreground">Route</dt>
            <dd className="flex items-center gap-1.5">
              Uniswap v4 · <EthereumMark className="size-4" /> {site.network}
              <button aria-label="Refresh quote" onClick={refreshQuote} className="ml-1 text-muted-foreground hover:text-white">
                <RefreshCw className={cn("size-3.5", quoting && "animate-spin")} />
              </button>
            </dd>
          </div>
        </dl>
        {quoteErr && amountIn > 0n && <p className="text-sm text-destructive">{quoteErr}</p>}

        <Button size="lg" disabled={disabled} onClick={run} className="mt-2 h-14 w-full text-base">
          {busy ? <><Loader2 className="animate-spin" /> {stage.label}</> : label}
        </Button>
        {stage.kind === "done" && (
          <p className="flex items-center gap-2 text-sm text-white">
            <Check className="size-4" /> Done.{" "}
            <a className="underline underline-offset-4" href={`https://etherscan.io/tx/${stage.hash}`} target="_blank" rel="noreferrer">
              View transaction
            </a>
          </p>
        )}
        {stage.kind === "error" && <p className="text-sm text-destructive">{stage.message}</p>}
        <p className="pt-2 text-xs text-muted-foreground">Prefer another app? Trade the same pool on:</p>
        <OutsideLinks />
      </CardContent>
    </Card>
  )
}

// If anything in the live swap fails to load, fall back to the outside links.
class SwapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Trade {coin}</CardTitle>
          <CardDescription>The built-in swap couldn't load. Trade the same pool here:</CardDescription>
        </CardHeader>
        <CardContent>
          <OutsideLinks />
        </CardContent>
      </Card>
    )
  }
}

function ComingSoonCard() {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <SideTabs side="buy" setSide={() => {}} />
          <NetworkPill />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Field label="You pay" token="ETH">
          <span className="font-display text-4xl tracking-tight text-muted-foreground/50">0.0</span>
        </Field>
        <Field label="You receive" token="V6">
          <span className="font-display text-4xl tracking-tight text-muted-foreground/50">—</span>
        </Field>
        <Button size="lg" disabled className="mt-3 h-14 w-full text-base">
          <Clock /> Coming soon
        </Button>
      </CardContent>
    </Card>
  )
}

export function Trade() {
  return (
    <main className="wrap pt-40 pb-20 md:pt-48 md:pb-28">
      <Badge className="mb-5 py-1">
        <ArrowLeftRight />
        Trade
      </Badge>
      <h1 className="font-display text-chrome fade-in text-[42px] leading-[1.02] font-medium tracking-[-0.035em] sm:text-6xl md:text-[76px]">
        Trade {site.name}
      </h1>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <Badge variant="outline">{isLive ? "Live" : "Coming soon"}</Badge>
            <CardTitle className="mt-3 text-3xl">
              {isLive ? `${site.name} is trading` : `Opening on ${site.launchpad}`}
            </CardTitle>
            <CardDescription className="max-w-[46ch] text-base">
              {isLive
                ? "Check that the address below matches the one in your wallet before you sign."
                : `${site.name} is coming to ${site.network}. Trading opens here at launch.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <dl className="flex flex-col">
              <div className="flex items-baseline justify-between gap-4 border-t py-4">
                <dt className="text-sm text-muted-foreground">Contract address</dt>
                <dd className="min-w-0 text-right font-medium break-all">
                  {site.contract ? (
                    <a href={explorerUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-silver">
                      {site.contract}
                    </a>
                  ) : (
                    "Coming soon"
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-y py-4">
                <dt className="text-sm text-muted-foreground">Network</dt>
                <dd className="flex items-center gap-2 font-medium">
                  <EthereumMark className="size-6" />
                  {site.network}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3">
              <ConnectWallet size="lg" align="left" />
              <Button asChild size="lg" variant="outline">
                <a href={site.launchUrl} target="_blank" rel="noreferrer">
                  Open {site.launchpad} <ArrowUpRight />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLive ? (
          <SwapBoundary>
            <SwapCard />
          </SwapBoundary>
        ) : (
          <ComingSoonCard />
        )}
      </div>
    </main>
  )
}
