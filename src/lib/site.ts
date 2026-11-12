// Everything the site says about the coin comes from here. Change a value once
// and it updates on every page.
export const site = {
  name: "Volume",
  ticker: "V6",
  tagline: "Trade. Grow. Generate volume.",
  // The brand definition, shown on the home page and in the docs.
  definition: {
    term: "Volume",
    kind: "n.",
    meaning: "the space a thing occupies.",
    lines: ["A token with no trades takes up no space.", "V6 measures itself by the room it takes up in the market, one trade at a time."],
  },
  url: "https://www.volumeprogrammable.xyz",
  network: "Ethereum",
  launchpad: "Programmable",
  // Add these after launch. The Trade page unlocks when `contract` is set.
  contract: "",
  // Volume's own pool hook. Paste it with `contract` after launch (both are in contracts/launch/out/summary.json).
  hook: "",
  launchUrl: "https://programmable.family",
  // WalletConnect project ID from https://dashboard.reown.com (enables phone wallets).
  // Leave empty to use browser wallets only.
  walletConnectProjectId: "",
  // Empty links are hidden.
  socials: { X: "https://x.com/volume_live", Telegram: "" } as Record<string, string>,
  supply: "1 billion",
}

export const coin = site.ticker || site.name

export const isLive = Boolean(site.contract && site.hook)

export const explorerUrl = site.contract ? `https://etherscan.io/token/${site.contract}` : ""
export const uniswapUrl = site.contract
  ? `https://app.uniswap.org/swap?chain=mainnet&inputCurrency=NATIVE&outputCurrency=${site.contract}`
  : ""

// Photos: Andrew Kliatskyi on Unsplash (https://unsplash.com/@kirp), free under the Unsplash License.
const unsplash = (id: string) => (width: number) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`
export const photos = {
  curves: unsplash("photo-1761998066468-011109c1df1f"),
  waves: unsplash("photo-1761998066484-daa29b9ad605"),
  lines: unsplash("photo-1761998066512-180aac759a3e"),
  cylinders: unsplash("photo-1762258344642-ac1a2476d275"),
  arc: unsplash("photo-1762081512213-2acee44ffcdb"),
}
export const photoCredit = { name: "Andrew Kliatskyi", url: "https://unsplash.com/@kirp" }
