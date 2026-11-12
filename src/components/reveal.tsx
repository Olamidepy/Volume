import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"

export function useReveal(): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el || el.getBoundingClientRect().top < window.innerHeight) return
    setInView(false)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const [ref, inView] = useReveal()
  return (
    <div ref={ref} data-in={inView} className={`rise ${className ?? ""}`}>
      {children}
    </div>
  )
}
