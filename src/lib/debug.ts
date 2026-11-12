// On-screen diagnostics for phones, where the browser console isn't reachable.
// Open the site with ?debug=1 to show a panel of errors and wallet events.
export const debugOn = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug")

let panel: HTMLPreElement | null = null
const lines: string[] = []

function show(kind: string, parts: unknown[]) {
  if (!debugOn) return
  const text = parts
    .map((p) => {
      if (p instanceof Error) return `${p.name}: ${p.message}`
      if (typeof p === "string") return p
      try { return JSON.stringify(p) } catch { return String(p) }
    })
    .join(" ")
    .slice(0, 400)
  lines.push(`${new Date().toISOString().slice(11, 19)} ${kind} ${text}`)
  if (lines.length > 40) lines.shift()
  if (!panel) {
    panel = document.createElement("pre")
    panel.style.cssText =
      "position:fixed;left:0;right:0;bottom:0;max-height:45vh;overflow:auto;margin:0;padding:8px;z-index:2147483647;background:rgba(0,0,0,.88);color:#ffffff;font:11px/1.35 ui-monospace,monospace;white-space:pre-wrap;word-break:break-all;pointer-events:auto"
    document.body.appendChild(panel)
  }
  panel.textContent = lines.join("\n")
  panel.scrollTop = panel.scrollHeight
}

export const debugLog = (kind: string, ...parts: unknown[]) => show(kind, parts)

if (debugOn) {
  for (const level of ["error", "warn"] as const) {
    const original = console[level].bind(console)
    console[level] = (...args: unknown[]) => { show(level.toUpperCase(), args); original(...args) }
  }
  window.addEventListener("error", (e) => show("ERROR", [e.message]))
  window.addEventListener("unhandledrejection", (e) => show("REJECT", [e.reason]))
  window.addEventListener("load", () => show("INFO", [`debug on · ${location.host} · ${navigator.userAgent}`]))
}
