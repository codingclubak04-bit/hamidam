import { useState, type ChangeEvent } from 'react'

interface FieldProps {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  type?: string
}

export function Field({ label, value, onChange, type = 'text' }: FieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label className="block text-base font-medium text-muted-foreground">{label}</label>
      <div className="relative mt-1.5">
        <input
          type={isPassword && visible ? 'text' : type}
          required
          value={value}
          onChange={onChange}
          className={
            'w-full rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent ' +
            (isPassword ? 'pr-11' : '')
          }
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition hover:text-accent"
          >
            {visible ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.58 10.58a2 2 0 0 0 2.83 2.83M9.36 5.32A9.77 9.77 0 0 1 12 5c5 0 9 4 10 7a12.3 12.3 0 0 1-2.16 3.19M6.6 6.6C4.2 8.1 2.4 10.4 2 12c.6 1.9 2.1 3.7 4.15 5.11A9.77 9.77 0 0 0 12 19c1.02 0 2-.15 2.9-.42"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 12c1-3 5-7 10-7s9 4 10 7c-1 3-5 7-10 7s-9-4-10-7Z"
                />
                <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
