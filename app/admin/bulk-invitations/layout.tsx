import type { ReactNode } from 'react'

import './whatsapp.css'

export default function BulkInvitationsLayout({ children }: { children: ReactNode }) {
  return <div className="whatsapp-scope">{children}</div>
}
