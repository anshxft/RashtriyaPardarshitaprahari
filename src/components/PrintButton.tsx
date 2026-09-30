'use client'

import { useEffect } from 'react'

export function PrintButton({ label, auto }: { label: string; auto?: boolean }) {
  useEffect(() => {
    if (auto) setTimeout(() => window.print(), 600)
  }, [auto])
  return (
    <button type="button" onClick={() => window.print()} className="no-print rounded-md bg-navy-900 px-5 py-2.5 font-bold text-white hover:bg-navy-700">
      🖨 {label}
    </button>
  )
}
