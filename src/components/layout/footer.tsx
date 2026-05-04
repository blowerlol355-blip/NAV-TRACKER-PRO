'use client'

import { useEffect, useState } from 'react'

export function Footer() {
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTimestamp(
        now.toLocaleString('es-VE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      )
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="flex items-center justify-center gap-2 px-4 py-2 border-t bg-background text-xs text-muted-foreground">
      <span>NavTrack Pro v2.0</span>
      <span>•</span>
      <span>© 2026 NavTrack Systems</span>
      <span>•</span>
      <span>Última actualización: {timestamp}</span>
    </footer>
  )
}
