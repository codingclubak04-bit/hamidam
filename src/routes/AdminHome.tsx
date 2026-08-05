import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AdminShell } from '../components/AdminShell'
import { IconBox, IconBuilding, IconChart, IconChevronRight, IconKey, IconUsers } from '../components/DashboardIcons'

export default function AdminHome() {
  return (
    <AdminShell title="슈퍼관리자 콘솔">
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/70 backdrop-blur">
        <ConsoleRow to="/admin/accounts" icon={<IconKey className="h-[18px] w-[18px]" />} title="관리자 계정 관리">
          슈퍼관리자·조직관리자 등록 및 권한 관리
        </ConsoleRow>
        <ConsoleRow to="/admin/products" icon={<IconBox className="h-[18px] w-[18px]" />} title="상품 관리">
          상품 등록·수정 및 판매 활성화 여부 관리
        </ConsoleRow>
        <ConsoleRow to="/admin/partners" icon={<IconBuilding className="h-[18px] w-[18px]" />} title="파트너사 관리">
          파트너사 등록 및 담당자 계정 발급
        </ConsoleRow>
        <ConsoleRow to="/admin/sales-reps" icon={<IconUsers className="h-[18px] w-[18px]" />} title="팀장 관리">
          팀장 전체 판매 현황 열람 권한 관리
        </ConsoleRow>
        <ConsoleRow to="/admin/stats" icon={<IconChart className="h-[18px] w-[18px]" />} title="주문/판매 통계">
          주문 현황, 매출, 조직·팀장·상품별 판매 통계
        </ConsoleRow>
      </div>
    </AdminShell>
  )
}

function ConsoleRow({ to, icon, title, children }: { to: string; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <Link to={to} className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-input">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-base font-semibold text-foreground">{title}</span>
        <span className="block text-sm text-muted-foreground">{children}</span>
      </span>
      <IconChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent" />
    </Link>
  )
}
