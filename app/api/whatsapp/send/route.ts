import { NextResponse } from 'next/server'

import { sendSingleWhatsAppInvitation } from '@/lib/whatsapp/jobs'
import { authenticateWhatsAppAdmin } from '@/lib/whatsapp/serverSupabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { db } = await authenticateWhatsAppAdmin(request)
    const body = await request.json()
    const guestId = Number(body.guestId)
    if (!Number.isInteger(guestId) || guestId <= 0) throw new Error('Guest ID tidak valid')
    return NextResponse.json(await sendSingleWhatsAppInvitation(db, guestId))
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error || 'Terjadi kesalahan'),
    }, { status: 400 })
  }
}
