// Official brand marks from Simple Icons (simpleicons.org), used to show the network.
type IconProps = { className?: string }

export function EthereumIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" role="img" aria-label="Ethereum">
      <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
    </svg>
  )
}

// Ethereum mark on its brand colour, for network labels.
export function EthereumMark({ className }: IconProps) {
  return (
    <span className={`inline-grid shrink-0 place-items-center rounded-full bg-[#627eea] text-white ${className ?? ""}`}>
      <EthereumIcon className="size-[58%]" />
    </span>
  )
}

// The X logo (lucide no longer ships brand marks).
export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
