import { NextResponse } from 'next/server'

import {
  connectWhatsAppSession,
  listWhatsAppSessions,
  logoutWhatsAppSession,
  refreshWhatsAppSessionQr,
} from '@/lib/whatsapp/manager'
import { authenticateWhatsAppAdmin } from '@/lib/whatsapp/serverSupabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const errorResponse = (error: unknown) => NextResponse.json({
  error: error instanceof Error ? error.message : String(error || 'Terjadi kesalahan'),
}, { status: 400 })

export async function GET(request: Request) {
  try {
    const { db } = await authenticateWhatsAppAdmin(request)
    return NextResponse.json({ sessions: await listWhatsAppSessions(db) })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await authenticateWhatsAppAdmin(request)
    const body = await request.json()
    const tamuFrom = String(body.tamuFrom || '').trim()
    if (!tamuFrom) throw new Error('Nama pengirim wajib diisi')

    if (body.action === 'connect') {
      return NextResponse.json({ session: await connectWhatsAppSession(db, tamuFrom) }, { status: 202 })
    }

    if (body.action === 'refresh') {
      return NextResponse.json({ session: await refreshWhatsAppSessionQr(db, tamuFrom) }, { status: 202 })
    }

    if (body.action === 'logout') {
      await logoutWhatsAppSession(db, tamuFrom)
      return NextResponse.json({ success: true })
    }

    throw new Error('Aksi session tidak didukung')
  } catch (error) {
    return errorResponse(error)
  }
}
