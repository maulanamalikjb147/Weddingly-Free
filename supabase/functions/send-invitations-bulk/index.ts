/* global Deno */
import { createClient } from 'npm:@supabase/supabase-js@2'

const env = (name) => Deno.env.get(name)?.trim() || ''
const terminalBatchStatuses = new Set(['completed', 'cancelled', 'failed'])

const tables = {
  configTamuDari: '_siraman_config_tamu_dari',
  dataTamu: '_siraman_data_tamu',
  invitationBulkBatchItems: '_siraman_invitation_bulk_batch_items',
  invitationBulkBatches: '_siraman_invitation_bulk_batches',
  invitationMessageTemplates: '_siraman_invitation_message_templates'
}

const allowedOrigins = env('ALLOWED_ORIGINS')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

const responseHeaders = (origin) => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
})

const jsonResponse = (body, status, origin) => new Response(JSON.stringify(body), {
  status,
  headers: responseHeaders(origin)
})

const normalizePhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`
  if (digits.startsWith('8')) digits = `62${digits}`

  if (!/^62\d{7,15}$/.test(digits)) {
    throw new Error('Nomor WhatsApp tidak valid')
  }

  return digits
}

const invitationUrl = (guest, baseUrl) => guest.invitation_slug
  ? `${baseUrl}/${encodeURIComponent(guest.invitation_slug)}`
  : baseUrl

const renderTemplate = (template, guest, senderName, baseUrl) => template
  .replaceAll('\\n', '\n')
  .replaceAll('{{nama_tamu}}', guest.nama_tamu || '')
  .replaceAll('{{alamat_tamu}}', guest.alamat_tamu || '')
  .replaceAll('{{tamu_from}}', senderName || guest.tamu_from || '')
  .replaceAll('{{invitation_url}}', invitationUrl(guest, baseUrl))

const parseOpenwaResponse = async (response) => {
  const responseText = await response.text()
  try {
    return responseText ? JSON.parse(responseText) : {}
  } catch {
    return { raw: responseText }
  }
}

const openwaErrorMessage = (result, status) => String(
  result.message || result.error || `OpenWA merespons ${status}`
)

const normalizeBatchStatus = (value, fallback = 'pending') => {
  const status = String(value || '').trim().toLowerCase()
  if (['creating', 'queued', 'pending'].includes(status)) return 'pending'
  if (['processing', 'in_progress', 'running'].includes(status)) return 'processing'
  if (['completed', 'complete', 'done', 'success', 'succeeded'].includes(status)) return 'completed'
  if (['cancelled', 'canceled'].includes(status)) return 'cancelled'
  if (['failed', 'error'].includes(status)) return 'failed'
  return fallback
}

const normalizeItemStatus = (result) => {
  const payload = result?.result || result
  const status = String(result?.status || result?.state || payload?.status || payload?.state || '').trim().toLowerCase()
  if (result?.success === true || payload?.success === true || ['sent', 'success', 'succeeded', 'completed', 'done'].includes(status)) return 'sent'
  if (result?.success === false || payload?.success === false || ['failed', 'error'].includes(status)) return 'failed'
  if (['cancelled', 'canceled'].includes(status)) return 'cancelled'
  if (['processing', 'sending', 'in_progress', 'running'].includes(status)) return 'processing'
  return 'pending'
}

const resultChatId = (result) => String(
  result?.chatId || result?.to || result?.recipient || result?.result?.chatId ||
  result?.result?.to || result?.message?.to || result?.result?.message?.to || ''
).trim()

const resultMessageId = (result) => String(
  result?.messageId || result?.result?.messageId || result?.result?.id || result?.message?.id ||
  result?.result?.message?.id || ''
).trim() || null

const resultError = (result) => {
  const error = result?.error || result?.result?.error
  if (!error) return null
  if (typeof error === 'string') return error
  return String(error.message || error.code || JSON.stringify(error))
}

Deno.serve(async (request) => {
  const requestOrigin = request.headers.get('Origin') || ''
  const fallbackOrigin = allowedOrigins[0] || 'http://localhost:3000'
  const responseOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : fallbackOrigin

  if (request.method === 'OPTIONS') {
    if (requestOrigin && allowedOrigins.length > 0 && !allowedOrigins.includes(requestOrigin)) {
      return jsonResponse({ error: 'Origin tidak diizinkan' }, 403, fallbackOrigin)
    }
    return new Response('ok', { headers: responseHeaders(responseOrigin) })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method tidak didukung' }, 405, responseOrigin)
  }

  if (requestOrigin && allowedOrigins.length > 0 && !allowedOrigins.includes(requestOrigin)) {
    return jsonResponse({ error: 'Origin tidak diizinkan' }, 403, fallbackOrigin)
  }

  const supabaseUrl = env('SUPABASE_URL')
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY')
  const openwaBaseUrl = env('OPENWA_BASE_URL').replace(/\/$/, '')
  const openwaApiKey = env('OPENWA_API_KEY')
  const invitationBaseUrl = (env('INVITATION_BASE_URL') || 'https://anisa.maulanamalik.my.id').replace(/\/$/, '')
  const adminEmails = env('ADMIN_EMAILS')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)

  if (!supabaseUrl || !serviceRoleKey || !openwaBaseUrl || !openwaApiKey || adminEmails.length === 0) {
    return jsonResponse({ error: 'Konfigurasi server belum lengkap' }, 500, responseOrigin)
  }

  const authorization = request.headers.get('Authorization') || ''
  const accessToken = authorization.replace(/^Bearer\s+/i, '').trim()
  if (!accessToken) {
    return jsonResponse({ error: 'Token login wajib diisi' }, 401, responseOrigin)
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
  const userEmail = userData.user?.email?.toLowerCase()
  if (userError || !userEmail || !adminEmails.includes(userEmail)) {
    return jsonResponse({ error: 'Akun tidak memiliki akses admin' }, 403, responseOrigin)
  }

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Body request harus berupa JSON' }, 400, responseOrigin)
  }

  const action = String(body.action || 'start').trim().toLowerCase()

  if (action === 'status') {
    const batchId = String(body.batchId || '').trim()
    if (!batchId) {
      return jsonResponse({ error: 'batchId wajib diisi' }, 400, responseOrigin)
    }

    const { data: batch, error: batchError } = await supabaseAdmin
      .from(tables.invitationBulkBatches)
      .select('*')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return jsonResponse({ error: 'Batch undangan tidak ditemukan' }, 404, responseOrigin)
    }

    const { data: sender, error: senderError } = await supabaseAdmin
      .from(tables.configTamuDari)
      .select('openwa_session_id')
      .eq('name', batch.tamu_from)
      .single()

    if (senderError || !sender?.openwa_session_id) {
      return jsonResponse({ error: `Session OpenWA ${batch.tamu_from} tidak ditemukan` }, 400, responseOrigin)
    }

    const openwaResponse = await fetch(
      `${openwaBaseUrl}/sessions/${encodeURIComponent(sender.openwa_session_id)}/messages/batch/${encodeURIComponent(batch.openwa_batch_id)}`,
      { headers: { 'X-API-Key': openwaApiKey } }
    )
    const openwaResult = await parseOpenwaResponse(openwaResponse)

    if (!openwaResponse.ok) {
      return jsonResponse({ error: openwaErrorMessage(openwaResult, openwaResponse.status) }, 502, responseOrigin)
    }

    const batchStatus = normalizeBatchStatus(openwaResult.status, batch.status)
    const progress = openwaResult.progress || {}
    const results = Array.isArray(openwaResult.results) ? openwaResult.results : []
    const now = new Date().toISOString()
    const { data: storedItems, error: itemsError } = await supabaseAdmin
      .from(tables.invitationBulkBatchItems)
      .select('*')
      .eq('batch_id', batch.id)
      .order('position', { ascending: true })

    if (itemsError) {
      return jsonResponse({ error: 'Gagal membaca log penerima batch' }, 500, responseOrigin)
    }

    const items = storedItems || []
    const itemsByChatId = new Map(items.map(item => [item.chat_id, item]))
    const itemUpdates = new Map()

    results.forEach((result, resultIndex) => {
      const explicitIndex = Number.isInteger(result?.index) ? result.index : resultIndex
      const chatId = resultChatId(result)
      const item = (chatId && itemsByChatId.get(chatId)) || items[explicitIndex]
      if (!item) return

      const status = normalizeItemStatus(result)
      if (['sent', 'failed', 'cancelled'].includes(item.status) && ['pending', 'processing'].includes(status)) return
      itemUpdates.set(item.id, {
        status,
        message_id: resultMessageId(result),
        error: resultError(result),
        raw_result: result,
        processed_at: ['sent', 'failed', 'cancelled'].includes(status) ? now : null,
        updated_at: now
      })
    })

    const sentCount = Number(progress.sent || 0)
    const failedCount = Number(progress.failed || 0)
    const cancelledCount = Number(progress.cancelled || 0)

    // Some OpenWA adapters return progress counters before detailed results.
    // When there are no failures, sequential order lets us safely reconcile
    // the first N recipients as sent instead of leaving them stuck in sending.
    if (failedCount === 0 && cancelledCount === 0 && sentCount > 0) {
      items.slice(0, sentCount).forEach(item => {
        const currentUpdate = itemUpdates.get(item.id)
        if (!currentUpdate || currentUpdate.status === 'pending') {
          itemUpdates.set(item.id, {
            status: 'sent',
            message_id: currentUpdate?.message_id || null,
            error: null,
            raw_result: currentUpdate?.raw_result || null,
            processed_at: currentUpdate?.processed_at || now,
            updated_at: now
          })
        }
      })
    }

    if (batchStatus === 'completed' && failedCount === 0) {
      items.forEach(item => {
        const currentUpdate = itemUpdates.get(item.id)
        itemUpdates.set(item.id, {
          status: 'sent',
          message_id: currentUpdate?.message_id || item.message_id || null,
          error: null,
          raw_result: currentUpdate?.raw_result || item.raw_result || null,
          processed_at: currentUpdate?.processed_at || item.processed_at || now,
          updated_at: now
        })
      })
    }

    if (batchStatus === 'failed' || batchStatus === 'cancelled') {
      items.forEach(item => {
        const currentStatus = itemUpdates.get(item.id)?.status || item.status
        if (['sent', 'failed', 'cancelled'].includes(currentStatus)) return
        itemUpdates.set(item.id, {
          status: batchStatus === 'cancelled' ? 'cancelled' : 'failed',
          message_id: null,
          error: batchStatus === 'cancelled'
            ? 'Batch pengiriman dibatalkan'
            : 'Batch pengiriman gagal sebelum pesan diproses',
          raw_result: null,
          processed_at: now,
          updated_at: now
        })
      })
    }

    await Promise.all([...itemUpdates.entries()].map(([itemId, update]) => (
      supabaseAdmin
        .from(tables.invitationBulkBatchItems)
        .update(update)
        .eq('id', itemId)
    )))

    const { data: refreshedItems } = await supabaseAdmin
      .from(tables.invitationBulkBatchItems)
      .select('guest_id, status, message_id, error, processed_at')
      .eq('batch_id', batch.id)

    const finalItems = refreshedItems || []
    const sentItems = finalItems.filter(item => item.status === 'sent' && item.guest_id)
    const failedItems = finalItems.filter(item => ['failed', 'cancelled'].includes(item.status) && item.guest_id)
    const effectiveTotal = Number(progress.total || batch.total_messages)
    const effectiveSent = Math.max(Number(progress.sent || 0), finalItems.filter(item => item.status === 'sent').length)
    const effectiveFailed = Math.max(Number(progress.failed || 0), finalItems.filter(item => item.status === 'failed').length)
    const effectiveCancelled = Math.max(Number(progress.cancelled || 0), finalItems.filter(item => item.status === 'cancelled').length)
    const effectivePending = Math.max(0, effectiveTotal - effectiveSent - effectiveFailed - effectiveCancelled)
    const finalBatchStatus = !terminalBatchStatuses.has(batchStatus) && effectivePending === 0
      ? 'completed'
      : batchStatus

    await Promise.all(sentItems.map(item => (
      supabaseAdmin
        .from(tables.dataTamu)
        .update({
          invitation_status: 'sent',
          invitation_sent_at: item.processed_at || now,
          invitation_message_id: item.message_id || `batch:${batch.openwa_batch_id}`,
          invitation_error: null,
          invitation_delivery_method: 'openwa_bulk'
        })
        .eq('id', item.guest_id)
        .eq('invitation_bulk_batch_id', batch.id)
    )))

    await Promise.all(failedItems.map(item => (
      supabaseAdmin
        .from(tables.dataTamu)
        .update({
          invitation_status: 'failed',
          invitation_error: item.error || `Gagal dalam batch ${batch.openwa_batch_id}`,
          invitation_delivery_method: 'openwa_bulk'
        })
        .eq('id', item.guest_id)
        .eq('invitation_bulk_batch_id', batch.id)
    )))

    const batchUpdate = {
      status: finalBatchStatus,
      sent_count: effectiveSent,
      failed_count: effectiveFailed,
      pending_count: effectivePending,
      cancelled_count: effectiveCancelled,
      raw_status: openwaResult,
      last_checked_at: now,
      completed_at: terminalBatchStatuses.has(finalBatchStatus)
        ? (openwaResult.completedAt || now)
        : null
    }

    await supabaseAdmin
      .from(tables.invitationBulkBatches)
      .update(batchUpdate)
      .eq('id', batch.id)

    return jsonResponse({
      success: true,
      batchId: batch.id,
      openwaBatchId: batch.openwa_batch_id,
      tamuFrom: batch.tamu_from,
      status: finalBatchStatus,
      progress: {
        total: effectiveTotal,
        sent: effectiveSent,
        failed: effectiveFailed,
        pending: effectivePending,
        cancelled: effectiveCancelled
      },
      terminal: terminalBatchStatuses.has(finalBatchStatus)
    }, 200, responseOrigin)
  }

  if (action !== 'start') {
    return jsonResponse({ error: 'Action tidak didukung' }, 400, responseOrigin)
  }

  const requestedSender = String(body.tamuFrom || '').trim()
  if (!requestedSender) {
    return jsonResponse({ error: 'tamuFrom wajib dipilih' }, 400, responseOrigin)
  }

  const { data: sender, error: senderError } = await supabaseAdmin
    .from(tables.configTamuDari)
    .select('name, openwa_session_id, openwa_enabled, bulk_delay_seconds, bulk_randomize_delay')
    .ilike('name', requestedSender)
    .limit(1)
    .maybeSingle()

  if (senderError || !sender) {
    return jsonResponse({ error: `Konfigurasi ${requestedSender} tidak ditemukan` }, 400, responseOrigin)
  }

  if (!sender.openwa_enabled || !sender.openwa_session_id) {
    return jsonResponse({ error: `Session OpenWA ${sender.name} belum aktif atau belum dikonfigurasi` }, 400, responseOrigin)
  }

  const delaySeconds = Number(body.delaySeconds ?? sender.bulk_delay_seconds ?? 20)
  const randomizeDelay = body.randomizeDelay === undefined
    ? Boolean(sender.bulk_randomize_delay)
    : Boolean(body.randomizeDelay)

  if (!Number.isInteger(delaySeconds) || delaySeconds < 5 || delaySeconds > 60) {
    return jsonResponse({ error: 'Delay bulk harus berupa 5 sampai 60 detik' }, 400, responseOrigin)
  }

  const { data: activeBatch } = await supabaseAdmin
    .from(tables.invitationBulkBatches)
    .select('id')
    .eq('tamu_from', sender.name)
    .in('status', ['creating', 'pending', 'processing'])
    .limit(1)
    .maybeSingle()

  if (activeBatch) {
    return jsonResponse({ error: `Masih ada batch ${sender.name} yang sedang berjalan` }, 409, responseOrigin)
  }

  const { data: messageConfig, error: messageConfigError } = await supabaseAdmin
    .from(tables.invitationMessageTemplates)
    .select('message_template')
    .eq('tamu_from', sender.name)
    .eq('is_active', true)
    .maybeSingle()

  if (messageConfigError || !messageConfig?.message_template) {
    return jsonResponse({ error: `Template pesan ${sender.name} belum aktif atau belum dikonfigurasi` }, 400, responseOrigin)
  }

  const { data: candidates, error: guestsError } = await supabaseAdmin
    .from(tables.dataTamu)
    .select('id, nama_tamu, alamat_tamu, contact_number, tamu_from, invitation_slug')
    .ilike('tamu_from', sender.name)
    .in('invitation_status', ['not_sent', 'failed'])
    .not('contact_number', 'is', null)
    .order('id', { ascending: true })

  if (guestsError) {
    return jsonResponse({ error: 'Gagal membaca daftar tamu untuk bulk' }, 500, responseOrigin)
  }

  if (!candidates || candidates.length === 0) {
    return jsonResponse({ error: `Tidak ada undangan ${sender.name} yang siap dikirim` }, 400, responseOrigin)
  }

  if (candidates.length > 100) {
    return jsonResponse({ error: 'OpenWA membatasi satu batch maksimal 100 pesan' }, 400, responseOrigin)
  }

  const validGuests = []
  const skippedGuests = []
  const messages = []

  candidates.forEach(guest => {
    try {
      const phone = normalizePhone(guest.contact_number)
      const text = renderTemplate(messageConfig.message_template, guest, sender.name, invitationBaseUrl)
      validGuests.push(guest)
      messages.push({
        chatId: `${phone}@c.us`,
        type: 'text',
        content: {
          text
        }
      })
    } catch (error) {
      skippedGuests.push({
        id: guest.id,
        namaTamu: guest.nama_tamu,
        error: String(error.message || error)
      })
    }
  })

  if (validGuests.length === 0) {
    return jsonResponse({ error: 'Tidak ada nomor WhatsApp valid untuk dikirim' }, 400, responseOrigin)
  }

  const openwaBatchId = `wedding_${crypto.randomUUID().replaceAll('-', '').slice(0, 20)}`
  const guestIds = validGuests.map(guest => guest.id)
  const { data: localBatch, error: insertBatchError } = await supabaseAdmin
    .from(tables.invitationBulkBatches)
    .insert({
      openwa_batch_id: openwaBatchId,
      tamu_from: sender.name,
      status: 'creating',
      guest_ids: guestIds,
      total_messages: guestIds.length,
      pending_count: guestIds.length,
      delay_seconds: delaySeconds,
      randomize_delay: randomizeDelay,
      created_by: userData.user.id
    })
    .select('id')
    .single()

  if (insertBatchError || !localBatch) {
    return jsonResponse({ error: 'Gagal membuat pencatatan batch undangan' }, 500, responseOrigin)
  }

  const batchItemRows = validGuests.map((guest, position) => ({
    batch_id: localBatch.id,
    guest_id: guest.id,
    position,
    guest_name: guest.nama_tamu,
    contact_number: String(guest.contact_number),
    chat_id: messages[position].chatId,
    status: 'pending'
  }))

  const { error: insertItemsError } = await supabaseAdmin
    .from(tables.invitationBulkBatchItems)
    .insert(batchItemRows)

  if (insertItemsError) {
    await supabaseAdmin
      .from(tables.invitationBulkBatches)
      .update({
        status: 'failed',
        error: 'Gagal membuat log penerima batch',
        completed_at: new Date().toISOString()
      })
      .eq('id', localBatch.id)
    return jsonResponse({ error: 'Gagal membuat log penerima batch' }, 500, responseOrigin)
  }

  await supabaseAdmin
    .from(tables.configTamuDari)
    .update({
      bulk_delay_seconds: delaySeconds,
      bulk_randomize_delay: randomizeDelay
    })
    .eq('name', sender.name)

  const controller = new AbortController()
  const timeoutMs = Number(env('OPENWA_REQUEST_TIMEOUT_MS') || 20000)
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let openwaResponse

  try {
    openwaResponse = await fetch(
      `${openwaBaseUrl}/sessions/${encodeURIComponent(sender.openwa_session_id)}/messages/send-bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': openwaApiKey
        },
        body: JSON.stringify({
          batchId: openwaBatchId,
          messages,
          options: {
            delayBetweenMessages: delaySeconds * 1000,
            randomizeDelay,
            stopOnError: false
          }
        }),
        signal: controller.signal
      }
    )
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'OpenWA tidak merespons sebelum batas waktu'
      : String(error.message || 'Gagal membuat batch OpenWA')
    await supabaseAdmin
      .from(tables.invitationBulkBatches)
      .update({ status: 'failed', error: message, completed_at: new Date().toISOString() })
      .eq('id', localBatch.id)
    return jsonResponse({ error: message }, 502, responseOrigin)
  } finally {
    clearTimeout(timeout)
  }

  const openwaResult = await parseOpenwaResponse(openwaResponse)
  if (!openwaResponse.ok) {
    const message = openwaErrorMessage(openwaResult, openwaResponse.status)
    await supabaseAdmin
      .from(tables.invitationBulkBatches)
      .update({ status: 'failed', error: message, raw_status: openwaResult, completed_at: new Date().toISOString() })
      .eq('id', localBatch.id)
    return jsonResponse({ error: message }, 502, responseOrigin)
  }

  const acceptedStatus = normalizeBatchStatus(openwaResult.status, 'pending')

  await supabaseAdmin
    .from(tables.invitationBulkBatches)
    .update({
      status: acceptedStatus,
      raw_status: openwaResult,
      started_at: new Date().toISOString()
    })
    .eq('id', localBatch.id)

  const { error: queueGuestsError } = await supabaseAdmin
    .from(tables.dataTamu)
    .update({
      invitation_status: 'sending',
      invitation_error: null,
      invitation_bulk_batch_id: localBatch.id,
      invitation_delivery_method: null
    })
    .in('id', guestIds)

  return jsonResponse({
    success: true,
    batchId: localBatch.id,
    openwaBatchId,
    tamuFrom: sender.name,
    status: acceptedStatus,
    totalMessages: guestIds.length,
    delaySeconds,
    randomizeDelay,
    skippedGuests,
    trackingWarning: queueGuestsError ? 'Batch berjalan, tetapi status tamu gagal ditandai sebagai antrean' : null
  }, 202, responseOrigin)
})
