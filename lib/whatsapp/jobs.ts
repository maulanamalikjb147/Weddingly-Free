import 'server-only'

import { randomUUID } from 'node:crypto'

import { SUPABASE_TABLES } from '@/lib/supabaseTables'
import { connectedWhatsAppSocket } from './manager'
import type { WhatsAppDbClient } from './serverSupabase'

type ActiveJob = { cancelled: boolean }
type JobsGlobal = typeof globalThis & { __siramanWhatsAppJobs?: Map<string, ActiveJob> }
type InvitationGuest = {
  id: number
  nama_tamu: string | null
  alamat_tamu: string | null
  contact_number: string | null
  tamu_from: string | null
  invitation_slug: string | null
}

const jobsGlobal = globalThis as JobsGlobal
const activeJobs = jobsGlobal.__siramanWhatsAppJobs || new Map<string, ActiveJob>()
jobsGlobal.__siramanWhatsAppJobs = activeJobs

const invitationBaseUrl = (process.env.NEXT_PUBLIC_INVITATION_BASE_URL || 'https://anisa.maulanamalik.my.id').replace(/\/$/, '')
const terminalStatuses = ['completed', 'failed', 'cancelled']

const messageFromError = (error: unknown) => error instanceof Error ? error.message : String(error || 'Unknown error')

const normalizePhone = (value: unknown) => {
  let phone = String(value || '').replace(/\D/g, '')
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`
  if (phone.startsWith('8')) phone = `62${phone}`
  if (!/^62\d{7,13}$/.test(phone)) throw new Error('Format nomor WhatsApp tidak valid')
  return phone
}

const renderTemplate = (template: string, guest: InvitationGuest, tamuFrom: string) => {
  const invitationUrl = guest.invitation_slug
    ? `${invitationBaseUrl}/${encodeURIComponent(guest.invitation_slug)}`
    : invitationBaseUrl

  return template
    .replaceAll('\\n', '\n')
    .replaceAll('{{nama_tamu}}', guest.nama_tamu || '')
    .replaceAll('{{alamat_tamu}}', guest.alamat_tamu || '')
    .replaceAll('{{tamu_from}}', tamuFrom)
    .replaceAll('{{invitation_url}}', invitationUrl)
}

async function addLog(
  db: WhatsAppDbClient,
  batchId: string,
  level: 'info' | 'success' | 'warning' | 'error',
  event: string,
  message: string,
  guestId?: number | null,
  metadata?: Record<string, unknown>,
) {
  const { error } = await db.from(SUPABASE_TABLES.whatsappLogs).insert({
    batch_id: batchId,
    level,
    event,
    message,
    guest_id: guestId || null,
    metadata: metadata || null,
  })
  if (error) console.error('Failed to write WhatsApp log:', error.message)
}

async function finishCancelledItems(db: WhatsAppDbClient, batchId: string) {
  const now = new Date().toISOString()
  const { data: pendingItems } = await db
    .from(SUPABASE_TABLES.invitationBulkBatchItems)
    .select('id, guest_id')
    .eq('batch_id', batchId)
    .in('status', ['pending', 'sending'])

  if (!pendingItems?.length) return 0

  await db.from(SUPABASE_TABLES.invitationBulkBatchItems).update({
    status: 'cancelled',
    error: 'Pengiriman dibatalkan admin',
    processed_at: now,
    updated_at: now,
  }).in('id', pendingItems.map((item) => item.id))

  const guestIds = pendingItems.map((item) => item.guest_id).filter(Boolean)
  if (guestIds.length > 0) {
    await db.from(SUPABASE_TABLES.dataTamu).update({
      invitation_status: 'not_sent',
      invitation_error: null,
      invitation_bulk_batch_id: null,
      invitation_delivery_method: null,
    }).in('id', guestIds)
  }

  return pendingItems.length
}

async function runBulkJob(db: WhatsAppDbClient, batchId: string) {
  if (activeJobs.has(batchId)) return
  const active: ActiveJob = { cancelled: false }
  activeJobs.set(batchId, active)

  try {
    const { data: batch, error: batchError } = await db
      .from(SUPABASE_TABLES.invitationBulkBatches)
      .select('*')
      .eq('id', batchId)
      .single()
    if (batchError || !batch) throw batchError || new Error('Batch tidak ditemukan')
    if (terminalStatuses.includes(batch.status)) return

    const [{ data: templateRow, error: templateError }, { data: items, error: itemsError }] = await Promise.all([
      db.from(SUPABASE_TABLES.invitationMessageTemplates)
        .select('message_template')
        .eq('tamu_from', batch.tamu_from)
        .eq('is_active', true)
        .maybeSingle(),
      db.from(SUPABASE_TABLES.invitationBulkBatchItems)
        .select('*')
        .eq('batch_id', batchId)
        .in('status', ['pending', 'sending'])
        .order('position'),
    ])
    if (templateError || !templateRow?.message_template) throw templateError || new Error('Template pesan tidak tersedia')
    if (itemsError) throw itemsError

    const guestIds = (items || []).map((item) => item.guest_id).filter(Boolean)
    const { data: guests, error: guestError } = guestIds.length > 0
      ? await db.from(SUPABASE_TABLES.dataTamu)
        .select('id, nama_tamu, alamat_tamu, contact_number, tamu_from, invitation_slug')
        .in('id', guestIds)
      : { data: [], error: null }
    if (guestError) throw guestError
    const guestsById = new Map((guests || []).map((guest) => [guest.id, guest]))

    const initialSent = Number(batch.sent_count || 0)
    const initialFailed = Number(batch.failed_count || 0)
    let sentCount = initialSent
    let failedCount = initialFailed
    let pendingCount = Number(batch.total_messages) - sentCount - failedCount
    const now = new Date().toISOString()

    await db.from(SUPABASE_TABLES.invitationBulkBatches).update({
      status: 'processing',
      started_at: batch.started_at || now,
      last_checked_at: now,
      error: null,
    }).eq('id', batchId)
    await addLog(db, batchId, 'info', 'job_started', `Pengiriman ${batch.tamu_from} dimulai untuk ${batch.total_messages} tamu`)

    for (let index = 0; index < (items || []).length; index += 1) {
      const item = items![index]
      const { data: latestBatch } = await db
        .from(SUPABASE_TABLES.invitationBulkBatches)
        .select('status')
        .eq('id', batchId)
        .single()

      if (active.cancelled || latestBatch?.status === 'cancelled') {
        active.cancelled = true
        break
      }

      const guest = guestsById.get(item.guest_id)
      const itemNow = new Date().toISOString()
      await db.from(SUPABASE_TABLES.invitationBulkBatchItems).update({
        status: 'sending',
        error: null,
        updated_at: itemNow,
      }).eq('id', item.id)
      await addLog(db, batchId, 'info', 'message_sending', `Mengirim ke ${item.guest_name} (${item.contact_number})`, item.guest_id)

      try {
        if (!guest) throw new Error('Data tamu tidak ditemukan')
        const { socket } = await connectedWhatsAppSocket(db, batch.tamu_from)
        const phone = normalizePhone(guest.contact_number)
        const text = renderTemplate(templateRow.message_template, guest, batch.tamu_from)
        const result = await socket.sendMessage(`${phone}@s.whatsapp.net`, { text })
        const processedAt = new Date().toISOString()

        sentCount += 1
        pendingCount = Math.max(0, pendingCount - 1)
        await db.from(SUPABASE_TABLES.invitationBulkBatchItems).update({
          status: 'sent',
          message_id: result?.key?.id || null,
          error: null,
          raw_result: { remoteJid: result?.key?.remoteJid || null },
          processed_at: processedAt,
          updated_at: processedAt,
        }).eq('id', item.id)
        await db.from(SUPABASE_TABLES.dataTamu).update({
          invitation_status: 'sent',
          invitation_sent_at: processedAt,
          invitation_message_id: result?.key?.id || null,
          invitation_error: null,
          invitation_bulk_batch_id: batchId,
          invitation_delivery_method: 'baileys_bulk',
        }).eq('id', item.guest_id)
        await addLog(db, batchId, 'success', 'message_sent', `Berhasil terkirim ke ${item.guest_name}`, item.guest_id, {
          messageId: result?.key?.id || null,
        })
      } catch (error) {
        const processedAt = new Date().toISOString()
        const failure = messageFromError(error)
        failedCount += 1
        pendingCount = Math.max(0, pendingCount - 1)
        await db.from(SUPABASE_TABLES.invitationBulkBatchItems).update({
          status: 'failed',
          message_id: null,
          error: failure,
          processed_at: processedAt,
          updated_at: processedAt,
        }).eq('id', item.id)
        await db.from(SUPABASE_TABLES.dataTamu).update({
          invitation_status: 'failed',
          invitation_error: failure,
          invitation_bulk_batch_id: batchId,
          invitation_delivery_method: 'baileys_bulk',
        }).eq('id', item.guest_id)
        await addLog(db, batchId, 'error', 'message_failed', `Gagal mengirim ke ${item.guest_name}: ${failure}`, item.guest_id)
      }

      await db.from(SUPABASE_TABLES.invitationBulkBatches).update({
        sent_count: sentCount,
        failed_count: failedCount,
        pending_count: pendingCount,
        last_checked_at: new Date().toISOString(),
      }).eq('id', batchId)

      const hasNext = index < items!.length - 1
      if (hasNext && !active.cancelled) {
        const baseDelay = Number(batch.delay_seconds) * 1000
        const delayMs = batch.randomize_delay
          ? Math.round(baseDelay * (0.85 + Math.random() * 0.3))
          : baseDelay
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    if (active.cancelled) {
      const cancelledCount = await finishCancelledItems(db, batchId)
      await db.from(SUPABASE_TABLES.invitationBulkBatches).update({
        status: 'cancelled',
        cancelled_count: cancelledCount,
        pending_count: 0,
        completed_at: new Date().toISOString(),
        last_checked_at: new Date().toISOString(),
      }).eq('id', batchId)
      await addLog(db, batchId, 'warning', 'job_cancelled', 'Pengiriman dibatalkan admin')
    } else {
      await db.from(SUPABASE_TABLES.invitationBulkBatches).update({
        status: 'completed',
        sent_count: sentCount,
        failed_count: failedCount,
        pending_count: 0,
        completed_at: new Date().toISOString(),
        last_checked_at: new Date().toISOString(),
      }).eq('id', batchId)
      await addLog(db, batchId, failedCount > 0 ? 'warning' : 'success', 'job_completed',
        `Pengiriman selesai: ${sentCount} terkirim, ${failedCount} gagal`)
    }
  } catch (error) {
    const failure = messageFromError(error)
    await db.from(SUPABASE_TABLES.invitationBulkBatches).update({
      status: 'failed',
      error: failure,
      completed_at: new Date().toISOString(),
      last_checked_at: new Date().toISOString(),
    }).eq('id', batchId)
    await addLog(db, batchId, 'error', 'job_failed', `Job berhenti: ${failure}`)
  } finally {
    activeJobs.delete(batchId)
  }
}

export async function startWhatsAppBulkJob(db: WhatsAppDbClient, userId: string, input: {
  tamuFrom?: string
  delaySeconds?: number
  randomizeDelay?: boolean
}) {
  const tamuFrom = String(input.tamuFrom || '').trim()
  const delaySeconds = Number(input.delaySeconds || 10)
  const randomizeDelay = Boolean(input.randomizeDelay)
  if (!tamuFrom) throw new Error('Pilih akun pengirim')
  if (!Number.isInteger(delaySeconds) || delaySeconds < 5 || delaySeconds > 60) {
    throw new Error('Jeda pengiriman harus 5 sampai 60 detik')
  }

  const { sessionId } = await connectedWhatsAppSocket(db, tamuFrom)
  const { data: activeBatch } = await db
    .from(SUPABASE_TABLES.invitationBulkBatches)
    .select('id')
    .eq('provider', 'baileys')
    .ilike('tamu_from', tamuFrom)
    .in('status', ['creating', 'pending', 'processing'])
    .limit(1)
    .maybeSingle()
  if (activeBatch) throw new Error(`Masih ada pengiriman ${tamuFrom} yang berjalan`)

  const [{ data: source, error: sourceError }, { data: template, error: templateError }, { data: candidates, error: candidateError }] = await Promise.all([
    db.from(SUPABASE_TABLES.configTamuDari).select('name').ilike('name', tamuFrom).limit(1).maybeSingle(),
    db.from(SUPABASE_TABLES.invitationMessageTemplates)
      .select('message_template')
      .eq('tamu_from', tamuFrom)
      .eq('is_active', true)
      .maybeSingle(),
    db.from(SUPABASE_TABLES.dataTamu)
      .select('id, nama_tamu, alamat_tamu, contact_number, tamu_from, invitation_slug')
      .ilike('tamu_from', tamuFrom)
      .in('invitation_status', ['not_sent', 'failed'])
      .not('contact_number', 'is', null)
      .order('id'),
  ])
  if (sourceError || !source) throw sourceError || new Error(`Pengirim ${tamuFrom} tidak ditemukan`)
  if (templateError || !template?.message_template) throw templateError || new Error(`Template pesan ${tamuFrom} belum aktif`)
  if (candidateError) throw candidateError

  const validGuests: InvitationGuest[] = []
  const skippedGuests: Array<{ name: string; reason: string }> = []
  ;(candidates || []).forEach((guest) => {
    try {
      normalizePhone(guest.contact_number)
      validGuests.push(guest)
    } catch (error) {
      skippedGuests.push({ name: guest.nama_tamu || `ID ${guest.id}`, reason: messageFromError(error) })
    }
  })
  if (validGuests.length === 0) throw new Error('Tidak ada nomor WhatsApp valid yang siap dikirim')

  const externalId = `baileys_${randomUUID().replaceAll('-', '')}`
  const { data: batch, error: batchError } = await db
    .from(SUPABASE_TABLES.invitationBulkBatches)
    .insert({
      external_batch_id: externalId,
      tamu_from: source.name,
      status: 'pending',
      guest_ids: validGuests.map((guest) => guest.id),
      total_messages: validGuests.length,
      pending_count: validGuests.length,
      delay_seconds: delaySeconds,
      randomize_delay: randomizeDelay,
      provider: 'baileys',
      session_id: sessionId,
      raw_status: { engine: 'baileys', skippedGuests },
      created_by: userId,
    })
    .select('id')
    .single()
  if (batchError || !batch) throw batchError || new Error('Gagal membuat job pengiriman')

  const { error: itemError } = await db.from(SUPABASE_TABLES.invitationBulkBatchItems).insert(
    validGuests.map((guest, position) => ({
      batch_id: batch.id,
      guest_id: guest.id,
      position,
      guest_name: guest.nama_tamu || `Tamu ${guest.id}`,
      contact_number: String(guest.contact_number),
      chat_id: `${normalizePhone(guest.contact_number)}@s.whatsapp.net`,
      status: 'pending',
    })),
  )
  if (itemError) {
    await db.from(SUPABASE_TABLES.invitationBulkBatches).update({
      status: 'failed',
      error: itemError.message,
      completed_at: new Date().toISOString(),
    }).eq('id', batch.id)
    throw itemError
  }

  await Promise.all([
    db.from(SUPABASE_TABLES.dataTamu).update({
      invitation_status: 'sending',
      invitation_error: null,
      invitation_bulk_batch_id: batch.id,
      invitation_delivery_method: 'baileys_bulk',
    }).in('id', validGuests.map((guest) => guest.id)),
    db.from(SUPABASE_TABLES.configTamuDari).update({
      bulk_delay_seconds: delaySeconds,
      bulk_randomize_delay: randomizeDelay,
    }).eq('name', source.name),
  ])

  await addLog(db, batch.id, 'info', 'job_queued', `${validGuests.length} pesan masuk antrean ${source.name}`, null, {
    delaySeconds,
    randomizeDelay,
    skippedGuests,
  })
  void runBulkJob(db, batch.id)

  return { batchId: batch.id, totalMessages: validGuests.length, skippedGuests }
}

export async function sendSingleWhatsAppInvitation(db: WhatsAppDbClient, guestId: number) {
  const { data: guest, error: guestError } = await db
    .from(SUPABASE_TABLES.dataTamu)
    .select('id, nama_tamu, alamat_tamu, contact_number, tamu_from, invitation_slug')
    .eq('id', guestId)
    .maybeSingle()
  if (guestError || !guest) throw guestError || new Error('Tamu tidak ditemukan')
  if (!guest.tamu_from) throw new Error('Asal tamu belum dipilih')

  const { data: template, error: templateError } = await db
    .from(SUPABASE_TABLES.invitationMessageTemplates)
    .select('message_template')
    .eq('tamu_from', guest.tamu_from)
    .eq('is_active', true)
    .maybeSingle()
  if (templateError || !template?.message_template) {
    throw templateError || new Error(`Template pesan ${guest.tamu_from} belum aktif`)
  }

  const phone = normalizePhone(guest.contact_number)
  const text = renderTemplate(template.message_template, guest, guest.tamu_from)
  await db.from(SUPABASE_TABLES.dataTamu).update({
    invitation_status: 'sending',
    invitation_error: null,
    invitation_bulk_batch_id: null,
    invitation_delivery_method: 'baileys',
  }).eq('id', guest.id)

  try {
    const { socket } = await connectedWhatsAppSocket(db, guest.tamu_from)
    const result = await socket.sendMessage(`${phone}@s.whatsapp.net`, { text })
    const sentAt = new Date().toISOString()
    await db.from(SUPABASE_TABLES.dataTamu).update({
      invitation_status: 'sent',
      invitation_sent_at: sentAt,
      invitation_message_id: result?.key?.id || null,
      invitation_error: null,
      invitation_bulk_batch_id: null,
      invitation_delivery_method: 'baileys',
    }).eq('id', guest.id)
    return { senderName: guest.tamu_from, messageId: result?.key?.id || null }
  } catch (error) {
    const failure = messageFromError(error)
    await db.from(SUPABASE_TABLES.dataTamu).update({
      invitation_status: 'failed',
      invitation_error: failure,
      invitation_bulk_batch_id: null,
      invitation_delivery_method: 'baileys',
    }).eq('id', guest.id)
    throw error
  }
}

export async function cancelWhatsAppBulkJob(db: WhatsAppDbClient, batchId: string) {
  const active = activeJobs.get(batchId)
  if (active) active.cancelled = true

  const { error } = await db.from(SUPABASE_TABLES.invitationBulkBatches).update({
    status: 'cancelled',
    completed_at: new Date().toISOString(),
    last_checked_at: new Date().toISOString(),
  }).eq('id', batchId).eq('provider', 'baileys').in('status', ['creating', 'pending', 'processing'])
  if (error) throw error

  if (!active) {
    const cancelledCount = await finishCancelledItems(db, batchId)
    await db.from(SUPABASE_TABLES.invitationBulkBatches).update({
      cancelled_count: cancelledCount,
      pending_count: 0,
    }).eq('id', batchId)
    await addLog(db, batchId, 'warning', 'job_cancelled', 'Pengiriman dibatalkan admin')
  }
}

export async function readWhatsAppJobs(db: WhatsAppDbClient, selectedBatchId?: string | null) {
  const { data: batches, error: batchError } = await db
    .from(SUPABASE_TABLES.invitationBulkBatches)
    .select('*')
    .eq('provider', 'baileys')
    .order('created_at', { ascending: false })
    .limit(30)
  if (batchError) throw batchError

  ;(batches || [])
    .filter((batch) => ['pending', 'processing'].includes(batch.status) && !activeJobs.has(batch.id))
    .forEach((batch) => { void runBulkJob(db, batch.id) })

  const batchId = selectedBatchId || batches?.[0]?.id || null
  if (!batchId) return { batches: batches || [], selectedBatch: null, items: [], logs: [] }

  const selectedBatch = (batches || []).find((batch) => batch.id === batchId)
    || (await db.from(SUPABASE_TABLES.invitationBulkBatches).select('*').eq('id', batchId).maybeSingle()).data
  if (!selectedBatch) return { batches: batches || [], selectedBatch: null, items: [], logs: [] }

  const [{ data: items, error: itemError }, { data: logs, error: logError }] = await Promise.all([
    db.from(SUPABASE_TABLES.invitationBulkBatchItems).select('*').eq('batch_id', batchId).order('position'),
    db.from(SUPABASE_TABLES.whatsappLogs).select('*').eq('batch_id', batchId).order('created_at'),
  ])
  if (itemError) throw itemError
  if (logError) throw logError

  return { batches: batches || [], selectedBatch, items: items || [], logs: logs || [] }
}
