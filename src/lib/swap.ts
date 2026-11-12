import {
  createPublicClient,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  fallback,
  formatUnits,
  http,
  parseAbi,
  parseAbiParameters,
  type Address,
  type Hex,
} from "viem"

import { site } from "@/lib/site"

// ─────────────────────────────────────────────────────────────────────────────
// Direct swaps on the Volume Uniswap v4 pool (ETH / V6) on Ethereum mainnet.
//
// Addresses and encoding follow Programmable's own Classic mainnet fork test
// (classic-v3: test/ClassicV3MainnetFork.t.sol and releases/classic-v3/mainnet-manifest.json).
// ExactInputSingleParams has minHopPriceX36, as on that Universal Router.
// ─────────────────────────────────────────────────────────────────────────────

export const CHAIN_ID = 1
// Public read-only endpoints. Swap in your own (Alchemy, Infura) for heavier traffic.
const RPCS = ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com"]

export const CONTRACTS = {
  universalRouter: "0xd92A36B0000531EF3063dEd4De20A0783308446C",
  v4Quoter: "0x52F0E24D1c21C8A0cB1e5a5dD6198556BD9E1203",
  permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  poolManager: "0x000000000004444c5dc75cB358380D2e3dE08A90",
} as const satisfies Record<string, Address>

const ZERO: Address = "0x0000000000000000000000000000000000000000"
const MSG_SENDER: Address = "0x0000000000000000000000000000000000000001"

export const TOKEN = (site.contract || ZERO) as Address
export const HOOK = site.hook as Address

export const POOL_KEY = {
  currency0: ZERO, // native ETH
  currency1: TOKEN,
  fee: 0, // the hook charges the trading fee
  tickSpacing: 200, // Classic launches use 200
  hooks: HOOK,
} as const

const SWAP = parseAbiParameters(
  "((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bool zeroForOne,uint128 amountIn,uint128 amountOutMinimum,uint256 minHopPriceX36,bytes hookData)",
)
const ACTIONS = parseAbiParameters("bytes actions,bytes[] params")
const PAYMENT = parseAbiParameters("address currency,uint256 amount")
const SWEEP = parseAbiParameters("address token,address recipient,uint256 amountMin")

const ROUTER_ABI = parseAbi(["function execute(bytes commands, bytes[] inputs, uint256 deadline) payable"])
const QUOTER_ABI = parseAbi([
  "function quoteExactInputSingle(((address currency0,address currency1,uint24 fee,int24 tickSpacing,address hooks) poolKey,bool zeroForOne,uint128 exactAmount,bytes hookData) params) returns (uint256 amountOut, uint256 gasEstimate)",
])
export const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
])
const PERMIT2_ABI = parseAbi([
  "function allowance(address owner, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)",
  "function approve(address token, address spender, uint160 amount, uint48 expiration)",
])

// Reads go to public Ethereum RPCs, then WalletConnect's as a fallback.
const wcRpc = site.walletConnectProjectId
  ? [http(`https://rpc.walletconnect.org/v1/?chainId=eip155:${CHAIN_ID}&projectId=${site.walletConnectProjectId}`)]
  : []
export const reader = createPublicClient({ transport: fallback([...RPCS.map((url) => http(url)), ...wcRpc]) })

export type Tx = { to: Address; data: Hex; value: bigint }
export type Side = "buy" | "sell"

export const minOut = (amountOut: bigint, slippageBps: number) => (amountOut * BigInt(10_000 - slippageBps)) / 10_000n

/** Quote an exact-input swap. Buy = ETH → V6 (zeroForOne), sell = V6 → ETH. */
export async function quote(side: Side, amountIn: bigint): Promise<bigint> {
  const data = encodeFunctionData({
    abi: QUOTER_ABI,
    functionName: "quoteExactInputSingle",
    args: [{ poolKey: POOL_KEY, zeroForOne: side === "buy", exactAmount: amountIn, hookData: "0x" }],
  })
  const res = await reader.call({ to: CONTRACTS.v4Quoter, data })
  if (!res.data) throw new Error("Empty quote")
  const [amountOut] = decodeFunctionResult({ abi: QUOTER_ABI, functionName: "quoteExactInputSingle", data: res.data })
  return amountOut
}

/** The Universal Router transaction for a swap with a hard minimum output. */
export function buildSwap(side: Side, amountIn: bigint, amountOutMinimum: bigint, deadline: bigint): Tx {
  const buy = side === "buy"
  const input = buy ? ZERO : TOKEN
  const output = buy ? TOKEN : ZERO
  const params = [
    encodeAbiParameters(SWAP, [
      { poolKey: POOL_KEY, zeroForOne: buy, amountIn, amountOutMinimum, minHopPriceX36: 0n, hookData: "0x" },
    ]),
    encodeAbiParameters(PAYMENT, [input, amountIn]), // SETTLE_ALL: pay at most amountIn
    encodeAbiParameters(PAYMENT, [output, amountOutMinimum]), // TAKE_ALL: receive at least the minimum
  ]
  const inputs: Hex[] = [encodeAbiParameters(ACTIONS, ["0x060c0f", params])]
  if (buy) inputs.push(encodeAbiParameters(SWEEP, [ZERO, MSG_SENDER, 0n])) // return any unused ETH
  return {
    to: CONTRACTS.universalRouter,
    data: encodeFunctionData({ abi: ROUTER_ABI, functionName: "execute", args: [buy ? "0x1004" : "0x10", inputs, deadline] }),
    value: buy ? amountIn : 0n,
  }
}

/** What a seller still has to approve before the swap: [] when nothing is needed. */
export async function sellApprovals(owner: Address, amountIn: bigint, deadline: bigint): Promise<{ label: string; tx: Tx }[]> {
  const steps: { label: string; tx: Tx }[] = []
  const erc20 = await reader.readContract({ address: TOKEN, abi: ERC20_ABI, functionName: "allowance", args: [owner, CONTRACTS.permit2] })
  if (erc20 < amountIn) {
    steps.push({
      label: "Approve V6",
      tx: {
        to: TOKEN,
        value: 0n,
        data: encodeFunctionData({ abi: ERC20_ABI, functionName: "approve", args: [CONTRACTS.permit2, amountIn] }),
      },
    })
  }
  const [amount, expiration] = await reader.readContract({
    address: CONTRACTS.permit2,
    abi: PERMIT2_ABI,
    functionName: "allowance",
    args: [owner, TOKEN, CONTRACTS.universalRouter],
  })
  if (amount < amountIn || BigInt(expiration) < deadline) {
    steps.push({
      label: "Allow the swap",
      tx: {
        to: CONTRACTS.permit2,
        value: 0n,
        data: encodeFunctionData({
          abi: PERMIT2_ABI,
          functionName: "approve",
          args: [TOKEN, CONTRACTS.universalRouter, amountIn, Number(deadline)],
        }),
      },
    })
  }
  return steps
}

/** Run the exact transaction from the trader's address without sending it. Throws with a readable reason. */
export async function simulate(from: Address, tx: Tx) {
  try {
    await reader.call({ account: from, to: tx.to, data: tx.data, value: tx.value })
  } catch (err) {
    const msg = (err as { shortMessage?: string; message?: string }).shortMessage ?? String(err)
    if (/insufficient funds/i.test(msg)) throw new Error("Not enough ETH for this trade plus gas.")
    if (/V4TooLittleReceived|TooLittleReceived|0x8b063d73|0x39d35496/i.test(msg)) throw new Error("Price moved. Refresh the quote or raise slippage.")
    throw new Error("This trade would fail right now. Try a smaller amount or use Uniswap.")
  }
}

export async function balances(owner: Address) {
  const [eth, token] = await Promise.all([
    reader.getBalance({ address: owner }),
    reader.readContract({ address: TOKEN, abi: ERC20_ABI, functionName: "balanceOf", args: [owner] }),
  ])
  return { eth, token }
}

export const fmt = (v: bigint, max = 6) => {
  const n = Number(formatUnits(v, 18))
  return n === 0 ? "0" : n < 1 / 10 ** max ? `<${(1 / 10 ** max).toFixed(max)}` : n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 0 : max })
}
