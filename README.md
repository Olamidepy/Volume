# Volume (V6) — Decentralized Trading Interface

A high-performance, non-custodial decentralized exchange interface and web application designed for Volume (V6), an Ethereum mainnet asset launched via Programmable's Classic liquidity model. The platform features direct Uniswap v4 pool execution, Universal Router and Permit2 transaction routing, a multi-transport RPC fallback layer, dual-engine wallet connectivity (injected EIP-1193 and Reown AppKit), and a bespoke dark monochrome user interface built with React 19, TypeScript, and Tailwind CSS v4.

---

## Table of Contents

- [Architectural Overview](#architectural-overview)
- [System Architecture](#system-architecture)
- [Smart Contract & Protocol Integration](#smart-contract--protocol-integration)
  - [Uniswap v4 Pool Parameters](#uniswap-v4-pool-parameters)
  - [Programmable Classic Fee Hook](#programmable-classic-fee-hook)
  - [Universal Router & Permit2 Routing](#universal-router--permit2-routing)
  - [ABI Encoding & Action Sequences](#abi-encoding--action-sequences)
- [Frontend & UI Engineering](#frontend--ui-engineering)
  - [Design Language: The Synergy Palette](#design-language-the-synergy-palette)
  - [CSS 3D Volumetric Mark (Logo3D)](#css-3d-volumetric-mark-logo3d)
  - [Component Architecture & Radix UI Primitives](#component-architecture--radix-ui-primitives)
- [Wallet Abstraction Layer](#wallet-abstraction-layer)
  - [Unified Wallet Facade](#unified-wallet-facade)
  - [Injected EIP-1193 Provider Engine](#injected-eip-1193-provider-engine)
  - [Reown AppKit & Wagmi Mobile Pairing](#reown-appkit--wagmi-mobile-pairing)
  - [RPC Network Transport & Resiliency](#rpc-network-transport--resiliency)
- [Swap Pipeline & Execution Lifecycle](#swap-pipeline--execution-lifecycle)
  - [1. Quoting Engine](#1-quoting-engine)
  - [2. Slippage & BPS Math](#2-slippage--bps-math)
  - [3. Multi-Stage Permit2 Token Approvals](#3-multi-stage-permit2-token-approvals)
  - [4. Pre-Flight State Simulation](#4-pre-flight-state-simulation)
  - [5. Execution & On-Chain Settlement](#5-execution--on-chain-settlement)
- [Diagnostic Telemetry HUD](#diagnostic-telemetry-hud)
- [Repository Structure](#repository-structure)
- [Configuration & Launch Checklist](#configuration--launch-checklist)
  - [Primary Configuration File (`src/lib/site.ts`)](#primary-configuration-file-srclibsitets)
  - [Environment Variables](#environment-variables)
  - [Unlocking the Live Swap Interface](#unlocking-the-live-swap-interface)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
- [Security Considerations & On-Chain Verification](#security-considerations--on-chain-verification)
- [Attributions & Disclaimers](#attributions--disclaimers)

---

## Architectural Overview

The application serves as both the informational portal and execution client for the Volume (V6) token. Rather than relying on third-party swap widgets or centralized aggregators, Volume interfaces directly with Uniswap v4 core contracts on Ethereum mainnet using low-level Viem utilities, custom ABI parameter encoders, and pre-flight state simulation.

Key technical characteristics include:

- **Zero-Dependency Native Routing**: Constructs raw Uniswap v4 Universal Router calls directly using low-level ABI definitions without bloated external SDKs.
- **Direct Permit2 Integration**: Implements complete allowance checks and approvals across both the standard ERC-20 interface and Uniswap's Permit2 contract for secure token transfers.
- **Dual Connection Pipeline**: Seamlessly toggles between direct `window.ethereum` injected browser providers and Reown AppKit (formerly Web3Modal) for mobile QR code and deep-link connections.
- **RPC Failover Transport**: Employs a round-robin / fallback Viem public client bridging multiple public endpoints with optional WalletConnect RPC routing.
- **Pre-Flight Validation**: Executes `eth_call` simulations on every trade payload prior to requesting user signatures, shielding users from failed transactions and unnecessary gas waste.

---

## System Architecture

```
+-------------------------------------------------------------------------+
|                              Client Browser                             |
|                                                                         |
|  +-------------------+  +-------------------+  +---------------------+  |
|  |     Home Page     |  |    Trade Page     |  |      Docs Page      |  |
|  |  (Stats / Visual) |  |  (Swap Interface) |  | (Specs & Protocols) |  |
|  +---------+---------+  +---------+---------+  +----------+----------+  |
|            |                      |                       |             |
|            +----------------------+-----------------------+             |
|                                   |                                     |
|                       +-----------v-----------+                         |
|                       |  Wallet Provider API  |                         |
|                       |      (useWallet)      |                         |
|                       +-----+-----------+-----+                         |
|                             |           |                               |
|              +--------------+           +--------------+                |
|              |                                         |                |
|     +--------v--------+                       +--------v--------+       |
|     | Injected Provider|                      |   Reown AppKit  |       |
|     |   (window.eth)  |                       | (Wagmi Adapter) |       |
|     +--------+--------+                       +--------+--------+       |
+--------------|-----------------------------------------|----------------+
               |                                         |
               +--------------------+--------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                            Network Layer                                |
|                                                                         |
|   Viem Public Client (Fallback Transport)                               |
|   ├── Primary:    https://ethereum-rpc.publicnode.com                  |
|   ├── Secondary:  https://eth.llamarpc.com                              |
|   └── Optional:   https://rpc.walletconnect.org (Reown Gateway)         |
+-----------------------------------+-------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                        Ethereum Mainnet (Chain 1)                       |
|                                                                         |
|  +--------------------------+          +-----------------------------+  |
|  | Uniswap v4 Quoter        |          | Universal Router            |  |
|  | (0x52F0...1203)          |          | (0xd92A...446C)             |  |
|  +--------------------------+          +--------------+--------------+  |
|                                                       |                 |
|                                                       v                 |
|  +--------------------------+          +-----------------------------+  |
|  | Permit2 Contract         |          | Uniswap v4 PoolManager      |  |
|  | (0x0000...8BA3)          | <------+ | (0x0000...8A90)             |  |
|  +--------------------------+          +--------------+--------------+  |
|                                                       |                 |
|                                                       v                 |
|                                        +-----------------------------+  |
|                                        | Programmable Fee Hook       |  |
|                                        | (0x35Fe...20CC)             |  |
|                                        +-----------------------------+  |
+-------------------------------------------------------------------------+
```

---

## Smart Contract & Protocol Integration

### Uniswap v4 Pool Parameters

Trading occurs in a dedicated Uniswap v4 pool on Ethereum mainnet (Chain ID `1`). The pool configuration is strictly defined by its `PoolKey`:

```typescript
export const POOL_KEY = {
  currency0: "0x0000000000000000000000000000000000000000", // Native ETH
  currency1: TOKEN_ADDRESS,                                // Volume (V6) Contract
  fee: 0,                                                  // Hook charges trading fee dynamically
  tickSpacing: 200,                                        // Standard tick spacing for Classic launches
  hooks: "0x35Fe236EA82F7cF525c9719d7df8F49F94D720CC",   // Programmable Classic Fee Hook
} as const;
```

### Programmable Classic Fee Hook

The token launches through Programmable's Classic liquidity mechanism:
- **Hook Contract**: `0x35Fe236EA82F7cF525c9719d7df8F49F94D720CC` (Ethereum mainnet `classic-v3` deployment).
- **Fee Model**: The swap fee is collected exclusively from the ETH side of each swap and partitioned on-chain between the token creator wallet and the launchpad contract.
- **Liquidity Lock**: Initial token supply (1,000,000,000 V6) is deposited at deployment; the resulting liquidity position is permanently locked.
- **Transfer Neutrality**: Wallet-to-wallet transfers incur 0% transfer tax; fees only apply to liquidity pool interactions.

### Universal Router & Permit2 Routing

Direct execution is orchestrated through Uniswap's Universal Router:

| Contract | Address | Purpose |
| :--- | :--- | :--- |
| **Universal Router** | `0xd92A36B0000531EF3063dEd4De20A0783308446C` | Unified swap and transfer dispatcher |
| **Uniswap v4 Quoter** | `0x52F0E24D1c21C8A0cB1e5a5dD6198556BD9E1203` | Off-chain gasless swap quotation |
| **Permit2** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Token allowance manager & signature permit handler |
| **PoolManager** | `0x000000000004444c5dc75cB358380D2e3dE08A90` | Core Uniswap v4 accounting & lock state machine |

### ABI Encoding & Action Sequences

Swap instructions to the Universal Router require nested bytecode encoding:

1. **Top-Level Router Commands**:
   - **Buy (ETH -> V6)**: Command flags `0x1004` (Command `0x10` for Uniswap v4 Swap, followed by `0x04` for `SWEEP_ETH` to return unspent ETH to `0x0000000000000000000000000000000000000001` / sender).
   - **Sell (V6 -> ETH)**: Command flags `0x10` (Uniswap v4 Swap).

2. **Uniswap v4 Action Sequence (`0x060c0f`)**:
   - `0x06` (`SWAP_EXACT_IN_SINGLE`): Executes exact-input single hop trade against the specified `PoolKey`.
   - `0x0c` (`SETTLE_ALL`): Settles the required input currency (ETH or V6) from caller up to `amountIn`.
   - `0x0f` (`TAKE_ALL`): Collects the accumulated output currency ensuring the received balance meets or exceeds `amountOutMinimum`.

---

## Frontend & UI Engineering

### Design Language: The Synergy Palette

The frontend implements a strict, high-contrast dark aesthetic dubbed the **Synergy** style:
- **Canvas Base**: Pure `#000000` pitch black background.
- **Foreground Elements**: High-clarity `#ffffff` text, chrome silver `#c9c9c9`, and subtle graphite `#5c5c5c`.
- **Card Surfaces**: Translucent glass backgrounds (`bg-black/50`, `bg-white/[0.03]`) combined with fine hairline borders (`border-white/10` and `border-white/15`).
- **Typography**: Responsive typographic hierarchy using geometric sans-serif displays with tight tracking (`tracking-[-0.035em]`) and tabular numerals for financial data integrity.

### CSS 3D Volumetric Mark (Logo3D)

The centerpiece logo is rendered in true 3D without WebGL or Canvas overhead. Using CSS 3D perspective transforms:
- **Z-Axis Stacking**: 16 separate sliced planes of the mark are rendered along the Z-axis in CSS 3D space (`translateZ` spaced by 1.4px increments).
- **Volumetric Depth**: Creates realistic edge geometry and surface weight when the model rotates in perspective (`[perspective:1600px]`).
- **Surface Lighting**: Outer face planes receive deep dropshadow filters (`drop-shadow(0 30px 60px rgb(0 0 0 / 0.6))`), while inner slices receive luminance attenuation (`brightness(0.45) contrast(1.2)`).
- **Accessibility & Performance**: Rotation pauses automatically when the user's operating system requests `prefers-reduced-motion: reduce`.

### Component Architecture & Radix UI Primitives

All UI components adhere to accessibility standards (WAI-ARIA) built upon Radix UI unstyled primitives:
- `Accordion`: Smooth collapsing disclosures for FAQs and protocol documentation.
- `Card`, `Separator`, `Slot`, `Badge`: Styled via `class-variance-authority` (CVA) and `tailwind-merge` for deterministic Tailwind class resolution.
- `Reveal`: Lightweight intersection observer component applying staggered fade-up transforms as content scrolls into the viewport.

---

## Wallet Abstraction Layer

### Unified Wallet Facade

All consumer components interact with a standardized `useWallet()` interface defined in `src/lib/wallet.tsx`:

```typescript
export type Wallet = {
  address: string | null;
  status: "disconnected" | "connecting" | "connected";
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  ensureChain: () => Promise<void>;
  sendTransaction: (tx: { to: Address; data: Hex; value: bigint }) => Promise<Hex>;
};
```

This abstraction isolates UI components from the underlying connection driver.

### Injected EIP-1193 Provider Engine

When no external cloud relay is configured, the app operates through direct browser injection (`window.ethereum`):
- Handles account change events (`accountsChanged`) and chain migrations (`chainChanged`).
- Automates programmatic network switching to Ethereum Mainnet (`0x1`) using `wallet_switchEthereumChain`.
- Captures and sanitizes common wallet error codes (e.g., User Rejection `4001`).

### Reown AppKit & Wagmi Mobile Pairing

When a Reown Project ID is provided, the application activates Reown AppKit (`@reown/appkit`, `@reown/appkit-adapter-wagmi`, and `@tanstack/react-query`):
- Displays the modal for scanning QR codes with mobile devices.
- Enables deep-linking into mobile wallets (MetaMask, Rainbow, Trust Wallet, Zerion, Coinbase Wallet).
- Retains browser extension support concurrently.

### RPC Network Transport & Resiliency

To prevent rate-limiting and ensure continuous uptime during traffic spikes, the Viem public client configures a fallback transport:
1. `https://ethereum-rpc.publicnode.com`
2. `https://eth.llamarpc.com`
3. Optional authenticated WalletConnect RPC gateway (`rpc.walletconnect.org`)

---

## Swap Pipeline & Execution Lifecycle

```
[ User Input ]
      │
      ▼
1. Quoter.quoteExactInputSingle() ──► Returns expected output & gas estimate
      │
      ▼
2. minOut(quote, slippageBps)     ──► Enforces minimum received amount
      │
      ▼
3. Approval Check (Sells Only)
      ├─ Token.allowance(Owner, Permit2) < amountIn? ──► [ Approve Token -> Permit2 ]
      └─ Permit2.allowance(Owner, Token, Router)?    ──► [ Approve Permit2 -> Router ]
      │
      ▼
4. eth_call Simulation             ──► Pre-flight validation against node state
      │
      ▼
5. UniversalRouter.execute()       ──► User wallet signs & submits transaction
      │
      ▼
6. waitForTransactionReceipt()     ──► UI transitions to success; balances refresh
```

### 1. Quoting Engine

Quotes are queried off-chain via `quoteExactInputSingle` on the Uniswap v4 Quoter contract (`0x52F0...1203`):
- **Buy Side**: `zeroForOne = true` (Native ETH to V6).
- **Sell Side**: `zeroForOne = false` (V6 to Native ETH).
- Automatically debounced upon trade input changes.

### 2. Slippage & BPS Math

Slippage tolerance is computed in basis points (100 = 1.0%, 300 = 3.0%, 500 = 5.0%, 1000 = 10.0%):

$$\text{amountOutMinimum} = \frac{\text{amountOut} \times (10{,}000 - \text{slippageBps})}{10{,}000}$$

### 3. Multi-Stage Permit2 Token Approvals

When selling V6 tokens, the application verifies the two-tier Permit2 authorization model:
1. **ERC-20 Allowance**: Verifies whether `V6.allowance(user, Permit2) >= amountIn`. If insufficient, prompts the user to submit an approval transaction for the exact required amount.
2. **Permit2 Allowance**: Verifies whether `Permit2.allowance(user, V6, UniversalRouter)` has adequate amount and has not expired against the transaction deadline. If expired or insufficient, prompts an approval transaction to Permit2.

### 4. Pre-Flight State Simulation

Prior to submitting any transaction to the user's wallet, `simulate()` performs an `eth_call` from the trader's address:
- Traps custom reversion signatures such as `0x8b063d73` or `0x39d35496` (`V4TooLittleReceived`).
- Detects gas or balance shortages before gas is burned.
- Translates EVM error codes into user-friendly instructions (e.g. "Price moved. Refresh the quote or raise slippage.").

### 5. Execution & On-Chain Settlement

Once simulated, `wallet.sendTransaction` invokes the Universal Router. The frontend enters a busy stage, monitors transaction propagation, confirms block inclusion via `waitForTransactionReceipt`, and automatically triggers a balance refresh.

---

## Diagnostic Telemetry HUD

For testing and troubleshooting on mobile hardware where browser developer tools are unavailable, the application contains an on-screen telemetry console:

- **Activation**: Append `?debug=1` to any URL (e.g., `https://domain.com/#trade?debug=1`).
- **Capabilities**:
  - Overrides and captures `console.error`, `console.warn`, unhandled Promise rejections, and window error events.
  - Probes latency and availability across WalletConnect config and RPC endpoints.
  - Renders a floating, high-contrast monospace diagnostics terminal at the bottom of the viewport.

---

## Repository Structure

```
├── public/
│   ├── favicon.png               # Browser tab icon
│   ├── volume-cover.jpg          # X/Twitter cover artwork backdrop
│   ├── volume-logo.png           # Complete horizontal logo lockup
│   └── volume-mark.png           # Isolated Volume symbol for 3D mark
├── src/
│   ├── components/
│   │   ├── sections/
│   │   │   ├── cta.tsx           # Call-to-action transition section
│   │   │   ├── facts.tsx         # Tokenomics & contract metadata grid
│   │   │   ├── feature.tsx       # Core architectural feature showcase
│   │   │   ├── ready.tsx         # Liquidity lock and launchpad status
│   │   │   └── steps.tsx         # Step-by-step trading flow explanation
│   │   ├── ui/                   # Reusable accessible UI primitives
│   │   │   ├── accordion.tsx     # Radix accordion component
│   │   │   ├── badge.tsx         # Pill badge indicator
│   │   │   ├── button.tsx        # CVA-styled action button
│   │   │   ├── card.tsx          # Card container and headers
│   │   │   ├── input.tsx         # Numerical input component
│   │   │   ├── label.tsx         # Accessible label primitive
│   │   │   └── separator.tsx     # Hairline structural divider
│   │   ├── chain-icons.tsx       # Ethereum SVGs and brand badges
│   │   ├── connect-wallet.tsx    # Wallet connection button & account menu
│   │   ├── footer.tsx            # Global footer with social & contract links
│   │   ├── header.tsx            # Navigation header with responsive menu
│   │   ├── logo-3d.tsx           # Multi-plane CSS 3D rotating Volume mark
│   │   ├── logo.tsx              # Vector SVG logo components
│   │   ├── reveal.tsx            # Intersection observer animation wrapper
│   │   └── section-heading.tsx   # Standardized section title header
│   ├── lib/
│   │   ├── appkit.tsx            # Reown AppKit / Wagmi configuration
│   │   ├── debug.ts              # Mobile telemetry HUD & logger
│   │   ├── site.ts               # Central project metadata & config
│   │   ├── swap.ts               # Uniswap v4 routing, encoding, & simulation
│   │   ├── utils.ts              # Class name merging utility (clsx + twMerge)
│   │   └── wallet.tsx            # Injected EIP-1193 & unified wallet facade
│   ├── pages/
│   │   ├── docs.tsx              # Protocol specification & security disclosures
│   │   ├── home.tsx              # Landing page with interactive sections
│   │   └── trade.tsx             # Interactive swap terminal & coming-soon state
│   ├── App.tsx                   # Top-level hash router & provider wrapper
│   ├── index.css                 # Tailwind CSS v4 styling & color definitions
│   └── main.tsx                  # React 19 entry point
├── components.json               # Component library configuration
├── index.html                    # Document entry template
├── package.json                  # Dependencies and build scripts
├── tsconfig.json                 # TypeScript compiler configuration
└── vite.config.ts                # Vite bundler & plugin configuration
```

---

## Configuration & Launch Checklist

### Primary Configuration File (`src/lib/site.ts`)

All project parameters, social channels, and smart contract bindings are managed in `src/lib/site.ts`:

```typescript
export const site = {
  name: "Volume",
  ticker: "V6",
  tagline: "Trade. Grow. Generate volume.",
  network: "Ethereum",
  launchpad: "Programmable",
  
  // Set after launch transaction completes
  contract: "",
  
  // Programmable's Classic fee hook address on Ethereum Mainnet
  hook: "0x35Fe236EA82F7cF525c9719d7df8F49F94D720CC",
  launchUrl: "https://programmable.family",
  
  // Optional: Reown Project ID (https://dashboard.reown.com)
  walletConnectProjectId: "",
  
  // Social links displayed in header and footer
  socials: { 
    X: "https://x.com/volume_live", 
    Telegram: "" 
  } as Record<string, string>,
  
  supply: "1 billion",
};
```

### Environment Variables

You can supply sensitive or deployment-specific values through a `.env` file (ignored by Git):

```bash
# Reown (WalletConnect) Project ID for mobile wallet connectivity
VITE_REOWN_PROJECT_ID="your_reown_project_id_here"
```

### Unlocking the Live Swap Interface

1. Deploy the token via Programmable.
2. Confirm the hook address matching the deployment manifest.
3. Paste the deployed token address into `contract` in `src/lib/site.ts`:
   ```typescript
   contract: "0xYourTokenContractAddressHere"
   ```
4. The Trade page automatically flips from "Coming soon" state to the live interactive Uniswap v4 swap interface.
5. Links to Etherscan and Uniswap are automatically generated throughout the application.

---

## Getting Started

### Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **Package Manager**: `npm` (v10+), `pnpm`, or `bun`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Olamidepy/Volume.git
cd Volume
npm install
```

### Development Server

Start the Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### Production Build

Compile the application for production deployment:

```bash
npm run build
```

The compiled static assets will be output to the `dist/` directory, ready for deployment to any static hosting service (Cloudflare Pages, Vercel, Netlify, AWS S3, etc.).

Preview the production build locally:

```bash
npm run preview
```

---

## Security Considerations & On-Chain Verification

- **Direct Execution**: All trades are signed directly by the user's connected wallet and routed through canonical Uniswap v4 and Universal Router contracts. The site holds no custodial keys.
- **Contract Verification**: Always verify that the contract address displayed on the site matches the official Programmable launch transaction before signing approvals or trades.
- **Pre-Execution Simulation**: Pre-flight `eth_call` checks ensure that transactions which would fail due to slippage, liquidity shifts, or gas limits are caught before broadcasting.
- **Independent Audit Notice**: Programmable's launch contracts and Uniswap v4 core contracts are public and verified on Etherscan, but users must exercise discretion and review transactions in their wallet prior to signing.

---

## Attributions & Disclaimers

- **Photography**: Section photography by Andrew Kliatskyi on Unsplash, licensed under the Unsplash License.
- **Independent Project**: Volume (V6) is an independent project. It is not created by, affiliated with, or endorsed by Uniswap Labs or Programmable.
- **Financial Disclaimer**: Cryptocurrency assets are subject to high market volatility. Content in this repository and website does not constitute financial or investment advice.
