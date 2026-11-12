import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react"
import { useSendTransaction, useSwitchChain } from "wagmi"

import { walletConnectEnabled } from "@/lib/appkit"

// ─────────────────────────────────────────────────────────────────────────────
// Wallet connection
//
// Every component on the site uses `useWallet()` and only needs these fields:
//   address     the connected address, or null
//   status      "disconnected" | "connecting" | "connected"
//   error       a message to show when connecting fails, or null
//   connect()   start connecting
//   disconnect()
//
// TO USE YOUR OWN HOOK: replace `useInjectedWallet()` inside `WalletProvider`
// below with your hook, mapping its values onto the `Wallet` shape. Nothing
// else on the site needs to change.
//
// With a WalletConnect project ID set (see src/lib/appkit.tsx), `useWalletConnect`
// opens the Reown modal: phone wallets by deep link or QR code, plus browser
// wallets. Without one, `useInjectedWallet` connects browser wallets (MetaMask,
// Rabby, Coinbase Wallet and similar) through window.ethereum.
// ─────────────────────────────────────────────────────────────────────────────

export type WalletStatus = "disconnected" | "connecting" | "connected"

export type Wallet = {
  address: string | null
  status: WalletStatus
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  /** Ask the wallet to switch to Ethereum mainnet. */
  ensureChain: () => Promise<void>
  /** Send a transaction from the connected wallet; resolves with its hash. */
  sendTransaction: (tx: { to: `0x${string}`; data: `0x${string}`; value: bigint }) => Promise<`0x${string}`>
}

type Eip1193Provider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
  on?(event: string, listener: (...args: any[]) => void): void
  removeListener?(event: string, listener: (...args: any[]) => void): void
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

function useInjectedWallet(): Wallet {
  const [address, setAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<WalletStatus>("disconnected")
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback((accounts: unknown) => {
    const first = Array.isArray(accounts) && typeof accounts[0] === "string" ? accounts[0] : null
    setAddress(first)
    setStatus(first ? "connected" : "disconnected")
  }, [])

  useEffect(() => {
    const provider = window.ethereum
    if (!provider) return
    // Restore an existing connection without prompting.
    provider.request({ method: "eth_accounts" }).then(apply).catch(() => {})
    provider.on?.("accountsChanged", apply)
    return () => provider.removeListener?.("accountsChanged", apply)
  }, [apply])

  const connect = useCallback(async () => {
    setError(null)
    const provider = window.ethereum
    if (!provider) {
      setError("No wallet found. Install a browser wallet such as MetaMask, then try again.")
      return
    }
    setStatus("connecting")
    try {
      apply(await provider.request({ method: "eth_requestAccounts" }))
    } catch (err) {
      setStatus("disconnected")
      const code = (err as { code?: number })?.code
      setError(code === 4001 ? "Connection cancelled in your wallet." : "Couldn't connect. Please try again.")
    }
  }, [apply])

  const disconnect = useCallback(() => {
    setAddress(null)
    setStatus("disconnected")
    setError(null)
    window.ethereum
      ?.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] })
      .catch(() => {})
  }, [])

  const ensureChain = useCallback(async () => {
    const provider = window.ethereum
    if (!provider) throw new Error("No wallet found.")
    const current = (await provider.request({ method: "eth_chainId" })) as string
    if (parseInt(current, 16) === 1) return
    // Every wallet already knows Ethereum mainnet, so there is nothing to add.
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x1" }] })
  }, [])

  const sendTransaction = useCallback<Wallet["sendTransaction"]>(async (tx) => {
    const provider = window.ethereum
    if (!provider || !address) throw new Error("Connect your wallet first.")
    return (await provider.request({
      method: "eth_sendTransaction",
      params: [{ from: address, to: tx.to, data: tx.data, value: `0x${tx.value.toString(16)}` }],
    })) as `0x${string}`
  }, [address])

  return { address, status, error, connect, disconnect, ensureChain, sendTransaction }
}

function useWalletConnect(): Wallet {
  const { open } = useAppKit()
  const { address, isConnected } = useAppKitAccount()
  const { disconnect } = useDisconnect()
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()

  const connect = useCallback(async () => {
    await open({ view: "Connect" })
  }, [open])

  const ensureChain = useCallback(async () => {
    await switchChainAsync({ chainId: 1 })
  }, [switchChainAsync])

  const sendTransaction = useCallback<Wallet["sendTransaction"]>(
    (tx) => sendTransactionAsync({ chainId: 1, to: tx.to, data: tx.data, value: tx.value }),
    [sendTransactionAsync],
  )

  return {
    address: isConnected && address ? address : null,
    status: isConnected && address ? "connected" : "disconnected",
    error: null,
    connect,
    disconnect: () => {
      disconnect().catch(() => {})
    },
    ensureChain,
    sendTransaction,
  }
}

// Chosen once at load, so the hook order never changes between renders.
const useActiveWallet = walletConnectEnabled ? useWalletConnect : useInjectedWallet

const WalletContext = createContext<Wallet | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useActiveWallet() // ← swap in your custom hook here
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const wallet = useContext(WalletContext)
  if (!wallet) throw new Error("useWallet must be used inside <WalletProvider>")
  return wallet
}

export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`
