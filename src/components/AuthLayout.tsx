import type { ReactNode } from 'react'
import { MoonMark } from './MoonMark'
import { ThemeToggle } from './ThemeToggle'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <ThemeToggle />

      {/* 좌측 브랜드 패널 (태블릿 이상) */}
      <div className="hidden shrink-0 flex-col items-center justify-center gap-7 bg-background-alt px-12 py-10 text-center md:flex md:w-[42%] lg:w-1/2">
        <MoonMark className="h-20 w-20" />
        <div>
          <h2 className="font-serif-kr text-3xl font-bold text-foreground">하미담</h2>
          <p className="mt-1.5 text-base text-muted-foreground">영업/주문 관리</p>
        </div>
        <p className="max-w-xs font-serif-kr text-lg leading-relaxed text-foreground">
          달빛은 길을 비춰주는 따뜻한 위로의 빛입니다. 그 빛처럼 하미담은 소중한 기억과 마음을 정성으로 담아
          전합니다.
        </p>
      </div>

      {/* 우측 폼 패널 */}
      <div className="flex flex-1 items-center justify-center bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center md:hidden">
            <MoonMark className="mx-auto h-12 w-12" />
            <h1 className="mt-3 font-serif-kr text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-1.5 text-base text-muted-foreground">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-base">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
