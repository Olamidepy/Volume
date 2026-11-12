import { useEffect, useState } from "react"

import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Docs } from "@/pages/docs"
import { Home } from "@/pages/home"
import { Trade } from "@/pages/trade"
import { AppKitProvider } from "@/lib/appkit"
import { WalletProvider } from "@/lib/wallet"

const readRoute = () => window.location.hash.slice(1)

export default function App() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onChange = () => {
      setRoute(readRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])

  return (
    <AppKitProvider>
    <WalletProvider>
      <Header route={route} />
      {route === "trade" ? <Trade /> : route === "docs" ? <Docs /> : <Home />}
      <Footer />
    </WalletProvider>
    </AppKitProvider>
  )
}
