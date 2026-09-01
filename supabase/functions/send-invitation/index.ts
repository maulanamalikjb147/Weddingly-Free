/* global Deno */
import { createClient } from 'npm:@supabase/supabase-js@2'

const env = (name) => Deno.env.get(name)?.trim() || ''

const tables = {
  configTamuDari: '_siraman_config_tamu_dari',
  dataTamu: '_siraman_data_tamu',
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
    throw new Error('Nomor WhatsApp harus memakai format Indonesia yang valid, misalnya 6281234567890')
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
  const accessToken = authorization.replace(/^Bearer\s+/i, '')
  if (!accessToken) {
    return jsonResponse({ error: 'Login admin diperlukan' }, 401, responseOrigin)
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken)
  const userEmail = userData.user?.email?.toLowerCase()
  if (userError || !userEmail || !adminEmails.includes(userEmail)) {
    return jsonResponse({ error: 'Akun tidak memiliki akses admin' }, 403, responseOrigin)
  }

  let guestId = ''
  try {
    const body = await request.json()
    guestId = String(body.guestId || '').trim()
  } catch {
    return jsonResponse({ error: 'Body request harus berupa JSON' }, 400, responseOrigin)
  }

  if (!guestId) {
    return jsonResponse({ error: 'guestId wajib diisi' }, 400, responseOrigin)
  }

  const { data: guest, error: guestError } = await supabaseAdmin
    .from(tables.dataTamu)
    .select('id, nama_tamu, alamat_tamu, contact_number, tamu_from, invitation_slug')
    .eq('id', guestId)
    .single()

  if (guestError || !guest) {
    return jsonResponse({ error: 'Data tamu tidak ditemukan' }, 404, responseOrigin)
  }

  if (!guest.tamu_from) {
    return jsonResponse({ error: 'Kolom tamu_from belum diisi' }, 400, responseOrigin)
  }

  const { data: sender, error: senderError } = await supabaseAdmin
    .from(tables.configTamuDari)
    .select('name, openwa_session_id, openwa_enabled')
    .ilike('name', guest.tamu_from)
    .limit(1)
    .maybeSingle()

  if (senderError || !sender) {
    return jsonResponse({ error: `Konfigurasi OpenWA untuk ${guest.tamu_from} tidak ditemukan` }, 400, responseOrigin)
  }

  if (!sender.openwa_enabled || !sender.openwa_session_id) {
    return jsonResponse({ error: `Session OpenWA ${sender.name} belum aktif atau belum dikonfigurasi` }, 400, responseOrigin)
  }

  const { data: messageConfig, error: messageConfigError } = await supabaseAdmin
    .from(tables.invitationMessageTemplates)
    .select('message_template')
    .eq('tamu_from', sender.name)
    .eq('is_active', true)
    .maybeSingle()

  if (messageConfigError) {
    return jsonResponse({ error: 'Gagal membaca template pesan undangan' }, 500, responseOrigin)
  }

  if (!messageConfig?.message_template) {
    return jsonResponse({ error: `Template pesan untuk ${sender.name} belum aktif atau belum dikonfigurasi` }, 400, responseOrigin)
  }

  let phone
  try {
    phone = normalizePhone(guest.contact_number)
  } catch (error) {
    return jsonResponse({ error: error.message }, 400, responseOrigin)
  }

  const text = renderTemplate(messageConfig.message_template, guest, sender.name, invitationBaseUrl)

  const { error: sendingStatusError } = await supabaseAdmin
    .from(tables.dataTamu)
    .update({
      invitation_status: 'sending',
      invitation_error: null,
      invitation_bulk_batch_id: null,
      invitation_delivery_method: null
    })
    .eq('id', guest.id)

  if (sendingStatusError) {
    return jsonResponse({ error: 'Gagal memperbarui status pengiriman' }, 500, responseOrigin)
  }

  try {
    const controller = new AbortController()
    const timeoutMs = Number(env('OPENWA_REQUEST_TIMEOUT_MS') || 20000)
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    let openwaResponse

    try {
      openwaResponse = await fetch(
        `${openwaBaseUrl}/sessions/${encodeURIComponent(sender.openwa_session_id)}/messages/send-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': openwaApiKey
          },
          body: JSON.stringify({
            chatId: `${phone}@c.us`,
            text
          }),
          signal: controller.signal
        }
      )
    } finally {
      clearTimeout(timeout)
    }

    const responseText = await openwaResponse.text()
    let openwaResult = {}
    try {
      openwaResult = responseText ? JSON.parse(responseText) : {}
    } catch {
      openwaResult = { raw: responseText }
    }

    if (!openwaResponse.ok) {
      const openwaMessage = openwaResult.message || openwaResult.error || `OpenWA merespons ${openwaResponse.status}`
      throw new Error(String(openwaMessage))
    }

    const sentAt = new Date().toISOString()
    const { error: sentStatusError } = await supabaseAdmin
      .from(tables.dataTamu)
      .update({
        invitation_status: 'sent',
        invitation_sent_at: sentAt,
        invitation_message_id: openwaResult.messageId || openwaResult.id || null,
        invitation_error: null,
        invitation_delivery_method: 'openwa'
      })
      .eq('id', guest.id)

    if (sentStatusError) throw sentStatusError

    return jsonResponse({
      success: true,
      guestId: guest.id,
      senderName: sender.name,
      messageId: openwaResult.messageId || openwaResult.id || null,
      sentAt
    }, 200, responseOrigin)
  } catch (error) {
    const message = error.name === 'AbortError'
      ? 'OpenWA tidak merespons sebelum batas waktu'
      : String(error.message || 'Pengiriman gagal')

    await supabaseAdmin
      .from(tables.dataTamu)
      .update({
        invitation_status: 'failed',
        invitation_error: message.slice(0, 1000),
        invitation_delivery_method: 'openwa'
      })
      .eq('id', guest.id)

    return jsonResponse({ error: message }, 502, responseOrigin)
  }
})
