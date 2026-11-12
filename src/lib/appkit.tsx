import type { ReactNode } from "react"
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { mainnet, type AppKitNetwork } from "@reown/appkit/networks"
import { createAppKit } from "@reown/appkit/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"

import { debugLog, debugOn } from "@/lib/debug"
import { site } from "@/lib/site"

// ─────────────────────────────────────────────────────────────────────────────
// WalletConnect (Reown AppKit)
//
// Lets people connect from a phone: mobile wallets open by deep link, desktop
// visitors scan a QR code, and browser wallets still work as before.
//
// Needs a free project ID from https://dashboard.reown.com. Paste it into
// `walletConnectProjectId` in src/lib/site.ts (or set VITE_REOWN_PROJECT_ID).
// Without one, the site falls back to browser wallets only.
// ─────────────────────────────────────────────────────────────────────────────

export const projectId: string = import.meta.env.VITE_REOWN_PROJECT_ID || site.walletConnectProjectId

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet]

// Wallets pinned to the top of the list (WalletConnect Explorer IDs).
const featuredWalletIds = [
  "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
  "ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18", // Zerion
  "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
  "1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369", // Rainbow
  "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
]

// Debug only: test each WalletConnect service directly and report what answers.
function probe(id: string) {
  const timed = (label: string, run: () => Promise<string>) => {
    const t0 = Date.now()
    Promise.race([run(), new Promise<string>((_, no) => setTimeout(() => no(new Error("no answer in 12s")), 12000))])
      .then((r) => debugLog("PROBE", label, r, `${Date.now() - t0}ms`))
      .catch((err) => debugLog("PROBE-FAIL", label, err))
  }
  timed("config api", async () => {
    const r = await fetch(`https://api.web3modal.org/appkit/v1/config?projectId=${id}&st=appkit&sv=html-wagmi`)
    return `HTTP ${r.status} ${(await r.text()).slice(0, 120)}`
  })
  timed("rpc", async () => {
    const r = await fetch(`https://rpc.walletconnect.org/v1/?chainId=eip155:1&projectId=${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
    })
    return `HTTP ${r.status} ${(await r.text()).slice(0, 120)}`
  })
  const socket = (label: string, url: string) =>
    timed(label, () =>
      new Promise<string>((ok, no) => {
        const ws = new WebSocket(url)
        ws.onopen = () => { ok("opened"); ws.close() }
        ws.onclose = (e) => ok(`closed code ${e.code} ${e.reason}`)
        ws.onerror = () => no(new Error("socket error (blocked or unreachable)"))
      }),
    )
  socket("relay .org", `wss://relay.walletconnect.org?projectId=${id}`)
  socket("relay .com", `wss://relay.walletconnect.com?projectId=${id}`)
  socket("echo test", "wss://ws.postman-echo.com/raw")
}

function setup(): WagmiAdapter | null {
  if (!projectId) return null
  try {
    const wagmi = new WagmiAdapter({ networks, projectId, ssr: false })
    const modal = createAppKit({
      adapters: [wagmi],
      networks,
      defaultNetwork: mainnet,
      featuredWalletIds,
      allWallets: "SHOW",
      projectId,
      metadata: {
        name: site.name,
        description: "Trade, grow, generate volume. A coin on Ethereum.",
        url: window.location.origin,
        icons: [`${window.location.origin}/volume-logo.png`],
      },
      themeMode: "dark",
      themeVariables: {
        "--w3m-font-family": "Geist, ui-sans-serif, system-ui, sans-serif",
        "--w3m-color-mix": "#000000",
        "--w3m-color-mix-strength": 35,
        "--w3m-border-radius-master": "3px",
        "--w3m-z-index": 100,
      },
      features: { analytics: true, email: false, socials: false, swaps: false, onramp: false },
    })
    if (debugOn) {
      debugLog("INFO", `appkit ready · project ${projectId.slice(0, 6)}…`)
      const quiet = new Set(["INITIALIZE", "MODAL_OPEN"])
      modal.subscribeEvents((e) => {
        const name = (e.data as { event?: string }).event ?? ""
        if (!quiet.has(name)) debugLog("EVENT", e.data)
      })
      modal.subscribeState((s) => debugLog("STATE", s))
      for (const c of wagmi.wagmiConfig.connectors) {
        c.emitter.on("message", (m) => debugLog("MSG", c.id, m.type, m.type === "display_uri" ? "(link ready)" : m))
        c.emitter.on("error", (err) => debugLog("CONN-ERR", c.id, err.error))
      }
      const started = Date.now()
      const slow = setTimeout(() => debugLog("WARN", "WalletConnect provider still not ready after 15s"), 15000)
      modal
        .getUniversalProvider()
        .then(() => { clearTimeout(slow); debugLog("OK", `WalletConnect provider ready in ${Date.now() - started}ms`) })
        .catch((err) => { clearTimeout(slow); debugLog("ERROR", "provider init failed", err) })
      probe(projectId)
    }
    return wagmi
  } catch (err) {
    // If WalletConnect can't start, keep the site working with browser wallets.
    console.error("WalletConnect setup failed; using browser wallets only.", err)
    return null
  }
}

const adapter = setup()

export const walletConnectEnabled = adapter !== null

const queryClient = new QueryClient()

export function AppKitProvider({ children }: { children: ReactNode }) {
  if (!adapter) return <>{children}</>
  return (
    <WagmiProvider config={adapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
