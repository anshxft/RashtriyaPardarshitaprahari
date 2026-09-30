'use client'

import Link from 'next/link'
import { useRef } from 'react'

type Opt = { value: string; label: string }
const box = 'w-full rounded-md border border-line bg-bg px-3 py-2 text-base'

/** State → District → Bureau → Designation. Changing a level resets the levels below it and re-filters at once. */
export function TeamFilters({
  base,
  values,
  options,
  labels,
}: {
  base: string
  values: { q: string; state: string; district: string; bureau: string; tier: string }
  options: { states: Opt[]; districts: Opt[]; bureaus: Opt[]; tiers: Opt[] }
  labels: Record<'all' | 'state' | 'district' | 'bureau' | 'designation' | 'search' | 'apply' | 'reset', string>
}) {
  const ref = useRef<HTMLFormElement>(null)
  const change = (reset: string[]) => () => {
    const f = ref.current
    if (!f) return
    for (const n of reset) (f.elements.namedItem(n) as HTMLSelectElement).value = ''
    f.requestSubmit()
  }
  const select = (name: string, label: string, opts: Opt[], value: string, reset: string[] = []) => (
    <label className="block text-sm font-semibold">
      {label}
      <select name={name} defaultValue={value} onChange={change(reset)} className={`${box} mt-1 font-normal`}>
        <option value="">{labels.all}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
  return (
    <form ref={ref} method="get" action={base} className="mb-8 grid gap-3 rounded-xl bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6">
      <label className="block text-sm font-semibold lg:col-span-2">
        {labels.search}
        <input name="q" defaultValue={values.q} type="search" className={`${box} mt-1 font-normal`} />
      </label>
      {select('state', labels.state, options.states, values.state, ['district', 'bureau'])}
      {select('district', labels.district, options.districts, values.district, ['bureau'])}
      {select('bureau', labels.bureau, options.bureaus, values.bureau)}
      {select('tier', labels.designation, options.tiers, values.tier)}
      <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
        <button className="rounded-md bg-navy-900 px-5 py-2 font-bold text-white hover:bg-navy-700">{labels.apply}</button>
        <Link href={base} className="rounded-md border border-line px-5 py-2 font-semibold hover:bg-bg">
          {labels.reset}
        </Link>
      </div>
    </form>
  )
}
