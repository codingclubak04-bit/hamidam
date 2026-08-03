import type { ChangeEvent } from 'react'

interface FieldProps {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  type?: string
}

export function Field({ label, value, onChange, type = 'text' }: FieldProps) {
  return (
    <div>
      <label className="block text-base font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        required
        value={value}
        onChange={onChange}
        className="mt-1.5 w-full rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  )
}
