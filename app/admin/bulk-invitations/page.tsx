import AdminGuard from '@/components/admin/AdminGuard'
import WhatsAppDashboard from '@/components/admin/WhatsAppDashboard'

export default function BulkInvitationsPage() {
  return (
    <AdminGuard>
      <WhatsAppDashboard />
    </AdminGuard>
  )
}
