import { useEffect, useRef, useState } from 'react'

export const useCustomScrollbar = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollInfo, setScrollInfo] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
    scrollPercentage: 0
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateScrollInfo = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const scrollPercentage = scrollHeight > clientHeight 
        ? (scrollTop / (scrollHeight - clientHeight)) * 100 
        : 0

      setScrollInfo({
        scrollTop,
        scrollHeight,
        clientHeight,
        scrollPercentage
      })
    }

    const handleScroll = () => {
      updateScrollInfo()
    }

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const scrollAmount = e.deltaY
      container.scrollTop += scrollAmount
    }

    // Event listeners
    container.addEventListener('scroll', handleScroll)
    container.addEventListener('wheel', handleWheel, { passive: false })

    // Initial calculation
    updateScrollInfo()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  return { containerRef, scrollInfo }
} 