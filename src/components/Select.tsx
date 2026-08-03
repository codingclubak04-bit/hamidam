import type { ChangeEvent, ReactNode } from 'react'

interface SelectProps {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  children: ReactNode
}

export function Select({ label, value, onChange, children }: SelectProps) {
  return (
    <div>
      <label className="block text-base font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="mt-1.5 w-full rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {children}
      </select>
    </div>
  )
}
