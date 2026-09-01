import { NextResponse } from 'next/server'

import {
  cancelWhatsAppBulkJob,
  readWhatsAppJobs,
  startWhatsAppBulkJob,
} from '@/lib/whatsapp/jobs'
import { authenticateWhatsAppAdmin } from '@/lib/whatsapp/serverSupabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const errorResponse = (error: unknown) => NextResponse.json({
  error: error instanceof Error ? error.message : String(error || 'Terjadi kesalahan'),
}, { status: 400 })

export async function GET(request: Request) {
  try {
    const { db } = await authenticateWhatsAppAdmin(request)
    const batchId = new URL(request.url).searchParams.get('batchId')
    return NextResponse.json(await readWhatsAppJobs(db, batchId))
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const { db, user } = await authenticateWhatsAppAdmin(request)
    const body = await request.json()

    if (body.action === 'start') {
      const result = await startWhatsAppBulkJob(db, user.id, {
        tamuFrom: body.tamuFrom,
        delaySeconds: body.delaySeconds,
        randomizeDelay: body.randomizeDelay,
      })
      return NextResponse.json(result, { status: 202 })
    }

    if (body.action === 'cancel') {
      const batchId = String(body.batchId || '')
      if (!batchId) throw new Error('Batch ID wajib diisi')
      await cancelWhatsAppBulkJob(db, batchId)
      return NextResponse.json({ success: true })
    }

    throw new Error('Aksi job tidak didukung')
  } catch (error) {
    return errorResponse(error)
  }
}
