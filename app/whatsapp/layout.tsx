import type { ReactNode } from 'react'

import '../admin/index.css'
import '../admin/App.css'
import './whatsapp.css'

export default function WhatsAppLayout({ children }: { children: ReactNode }) {
  return <div className="admin-scope whatsapp-scope">{children}</div>
}
