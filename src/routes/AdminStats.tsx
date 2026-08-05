import { AdminShell } from '../components/AdminShell'
import OrderStats from './OrderStats'

export default function AdminStats() {
  return (
    <AdminShell title="주문/판매 통계" titleFont="sans">
      <OrderStats />
    </AdminShell>
  )
}
