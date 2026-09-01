import 'server-only'

import { Boom } from '@hapi/boom'
import makeWASocket, {
  Browsers,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  type WASocket,
} from '@whiskeysockets/baileys'
import QRCode from 'qrcode'
import pino from 'pino'

import { SUPABASE_TABLES } from '@/lib/supabaseTables'
import { createSupabaseAuthState } from './authState'
import type { WhatsAppDbClient } from './serverSupabase'

type SessionStatus = 'disconnected' | 'connecting' | 'qr' | 'connected' | 'reconnecting' | 'logged_out' | 'error'

type SessionRuntime = {
  sessionId: string
  tamuFrom: string
  db: WhatsAppDbClient
  socket: WASocket | null
  status: SessionStatus
  qrDataUrl: string | null
  phoneNumber: string | null
  displayName: string | null
  lastError: string | null
  intentionalClose: boolean
  reconnectAttempts: number
  reconnectTimer: ReturnType<typeof setTimeout> | null
}

type WhatsAppGlobal = typeof globalThis & {
  __siramanWhatsAppSessions?: Map<string, SessionRuntime>
}

const runtimeGlobal = globalThis as WhatsAppGlobal
const runtimes = runtimeGlobal.__siramanWhatsAppSessions || new Map<string, SessionRuntime>()
runtimeGlobal.__siramanWhatsAppSessions = runtimes

const logger = pino({ level: process.env.WHATSAPP_LOG_LEVEL || 'silent' })

const sessionIdFor = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error || 'Unknown error')

async function saveSession(runtime: SessionRuntime) {
  const now = new Date().toISOString()
  const payload = {
    id: runtime.sessionId,
    tamu_from: runtime.tamuFrom,
    status: runtime.status,
    phone_number: runtime.phoneNumber,
    display_name: runtime.displayName,
    last_error: runtime.lastError,
    last_seen_at: now,
    updated_at: now,
    ...(runtime.status === 'connected' ? { connected_at: now } : {}),
  }
  const { error } = await runtime.db
    .from(SUPABASE_TABLES.whatsappSessions)
    .upsert(payload, { onConflict: 'id' })
  if (error) throw error
}

function publicRuntime(runtime: SessionRuntime) {
  return {
    id: runtime.sessionId,
    tamuFrom: runtime.tamuFrom,
    status: runtime.status,
    qrDataUrl: runtime.qrDataUrl,
    phoneNumber: runtime.phoneNumber,
    displayName: runtime.displayName,
    lastError: runtime.lastError,
    connected: runtime.status === 'connected',
  }
}

function runtimeForSource(tamuFrom: string) {
  const normalized = tamuFrom.trim().toLowerCase()
  return Array.from(runtimes.values()).find((runtime) => runtime.tamuFrom.toLowerCase() === normalized)
}

async function clearAuth(db: WhatsAppDbClient, sessionId: string) {
  const { error } = await db
    .from(SUPABASE_TABLES.whatsappAuth)
    .delete()
    .eq('session_id', sessionId)
  if (error) throw error
}

function scheduleReconnect(runtime: SessionRuntime) {
  if (runtime.intentionalClose || runtime.reconnectTimer) return
  const waitMs = Math.min(30_000, 1_500 * Math.max(1, runtime.reconnectAttempts + 1))
  runtime.reconnectAttempts += 1
  runtime.reconnectTimer = setTimeout(() => {
    runtime.reconnectTimer = null
    runtimes.delete(runtime.sessionId)
    void connectWhatsAppSession(runtime.db, runtime.tamuFrom).catch(async (error) => {
      runtime.status = 'error'
      runtime.lastError = errorMessage(error)
      await saveSession(runtime).catch(() => undefined)
    })
  }, waitMs)
}

export async function connectWhatsAppSession(db: WhatsAppDbClient, requestedSource: string) {
  const { data: source, error: sourceError } = await db
    .from(SUPABASE_TABLES.configTamuDari)
    .select('name, whatsapp_session_id')
    .ilike('name', requestedSource.trim())
    .limit(1)
    .maybeSingle()

  if (sourceError) throw sourceError
  if (!source?.name) throw new Error(`Pengirim ${requestedSource} tidak ditemukan`)

  const existing = runtimeForSource(source.name)
  if (existing && ['connecting', 'qr', 'connected', 'reconnecting'].includes(existing.status)) {
    existing.db = db
    return publicRuntime(existing)
  }

  const sessionId = source.whatsapp_session_id || sessionIdFor(source.name)
  if (!sessionId) throw new Error('Nama pengirim tidak dapat dijadikan session ID')

  const runtime: SessionRuntime = {
    sessionId,
    tamuFrom: source.name,
    db,
    socket: null,
    status: 'connecting',
    qrDataUrl: null,
    phoneNumber: null,
    displayName: null,
    lastError: null,
    intentionalClose: false,
    reconnectAttempts: 0,
    reconnectTimer: null,
  }
  runtimes.set(sessionId, runtime)

  await db.from(SUPABASE_TABLES.whatsappSessions).upsert({
    id: sessionId,
    tamu_from: source.name,
    status: 'connecting',
    last_error: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  await db.from(SUPABASE_TABLES.configTamuDari).update({
    whatsapp_session_id: sessionId,
  }).eq('name', source.name)

  const { state, saveCreds } = await createSupabaseAuthState(db, sessionId)
  const socket = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: Browsers.macOS('Wedding Admin'),
    logger,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
  })
  runtime.socket = socket

  socket.ev.on('creds.update', () => {
    void saveCreds().catch(async (error) => {
      runtime.lastError = `Gagal menyimpan session: ${errorMessage(error)}`
      await saveSession(runtime).catch(() => undefined)
    })
  })

  socket.ev.on('connection.update', (update) => {
    void (async () => {
      if (update.qr) {
        runtime.qrDataUrl = await QRCode.toDataURL(update.qr, { width: 540, margin: 4, errorCorrectionLevel: 'M' })
        runtime.status = 'qr'
        runtime.lastError = null
        await saveSession(runtime)
      }

      if (update.connection === 'open') {
        const rawId = socket.user?.id || ''
        runtime.status = 'connected'
        runtime.qrDataUrl = null
        runtime.lastError = null
        runtime.reconnectAttempts = 0
        runtime.phoneNumber = rawId.split(':')[0].split('@')[0] || null
        runtime.displayName = socket.user?.name || source.name
        await saveSession(runtime)
        await db.from(SUPABASE_TABLES.configTamuDari).update({
          whatsapp_enabled: true,
          whatsapp_session_id: sessionId,
          whatsapp_phone: runtime.phoneNumber,
          whatsapp_connected_at: new Date().toISOString(),
        }).eq('name', source.name)
      }

      if (update.connection === 'close' && !runtime.intentionalClose) {
        const statusCode = (update.lastDisconnect?.error as Boom | undefined)?.output?.statusCode
        runtime.socket = null
        runtime.qrDataUrl = null

        if (statusCode === DisconnectReason.loggedOut) {
          runtime.status = 'logged_out'
          runtime.lastError = 'Perangkat keluar dari WhatsApp. Scan ulang untuk menyambungkan.'
          await clearAuth(db, sessionId)
          await db.from(SUPABASE_TABLES.configTamuDari).update({
            whatsapp_enabled: false,
            whatsapp_phone: null,
            whatsapp_connected_at: null,
          }).eq('name', source.name)
          await saveSession(runtime)
          return
        }

        runtime.status = 'reconnecting'
        runtime.lastError = statusCode === DisconnectReason.connectionReplaced
          ? 'Session digunakan oleh koneksi lain'
          : errorMessage(update.lastDisconnect?.error || 'Koneksi WhatsApp terputus')
        await saveSession(runtime)
        scheduleReconnect(runtime)
      }
    })().catch(async (error) => {
      runtime.status = 'error'
      runtime.lastError = errorMessage(error)
      await saveSession(runtime).catch(() => undefined)
    })
  })

  return publicRuntime(runtime)
}

export async function logoutWhatsAppSession(db: WhatsAppDbClient, requestedSource: string) {
  const runtime = runtimeForSource(requestedSource)
  const { data: source } = await db
    .from(SUPABASE_TABLES.configTamuDari)
    .select('name, whatsapp_session_id')
    .ilike('name', requestedSource.trim())
    .limit(1)
    .maybeSingle()

  if (!source?.name) throw new Error(`Pengirim ${requestedSource} tidak ditemukan`)
  const sessionId = runtime?.sessionId || source.whatsapp_session_id || sessionIdFor(source.name)

  if (runtime) {
    runtime.intentionalClose = true
    if (runtime.reconnectTimer) clearTimeout(runtime.reconnectTimer)
    await runtime.socket?.logout().catch(() => undefined)
    runtimes.delete(runtime.sessionId)
  }

  await clearAuth(db, sessionId)
  await db.from(SUPABASE_TABLES.whatsappSessions).upsert({
    id: sessionId,
    tamu_from: source.name,
    status: 'logged_out',
    phone_number: null,
    display_name: null,
    last_error: null,
    connected_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })
  await db.from(SUPABASE_TABLES.configTamuDari).update({
    whatsapp_enabled: false,
    whatsapp_phone: null,
    whatsapp_connected_at: null,
  }).eq('name', source.name)
}

export async function refreshWhatsAppSessionQr(db: WhatsAppDbClient, requestedSource: string) {
  const runtime = runtimeForSource(requestedSource)
  const { data: source } = await db
    .from(SUPABASE_TABLES.configTamuDari)
    .select('name')
    .ilike('name', requestedSource.trim())
    .limit(1)
    .maybeSingle()

  if (!source?.name) throw new Error(`Pengirim ${requestedSource} tidak ditemukan`)

  if (runtime) {
    runtime.intentionalClose = true
    if (runtime.reconnectTimer) clearTimeout(runtime.reconnectTimer)
    await runtime.socket?.end(undefined).catch(() => undefined)
    runtimes.delete(runtime.sessionId)
  }

  return connectWhatsAppSession(db, source.name)
}

export async function listWhatsAppSessions(db: WhatsAppDbClient) {
  const [{ data: sources, error: sourceError }, { data: storedSessions, error: sessionError }, { data: authRows }] = await Promise.all([
    db.from(SUPABASE_TABLES.configTamuDari)
      .select('name, whatsapp_session_id, whatsapp_enabled, whatsapp_phone, whatsapp_connected_at, bulk_delay_seconds, bulk_randomize_delay')
      .order('name'),
    db.from(SUPABASE_TABLES.whatsappSessions).select('*'),
    db.from(SUPABASE_TABLES.whatsappAuth).select('session_id').eq('key', 'creds'),
  ])

  if (sourceError) throw sourceError
  if (sessionError) throw sessionError

  const { data: guests, error: guestError } = await db
    .from(SUPABASE_TABLES.dataTamu)
    .select('tamu_from, contact_number, invitation_status')
    .not('contact_number', 'is', null)
  if (guestError) throw guestError

  const savedSessions = new Set((authRows || []).map((row) => row.session_id))
  const sessionsBySource = new Map((storedSessions || []).map((session) => [session.tamu_from.toLowerCase(), session]))

  const result = (sources || []).map((source) => {
    const runtime = runtimeForSource(source.name)
    const stored = sessionsBySource.get(source.name.toLowerCase())
    const sessionId = source.whatsapp_session_id || stored?.id || sessionIdFor(source.name)
    const eligibleCount = (guests || []).filter((guest) => (
      guest.tamu_from?.toLowerCase() === source.name.toLowerCase()
      && ['not_sent', 'failed'].includes(guest.invitation_status)
    )).length

    if (!runtime && source.whatsapp_enabled && savedSessions.has(sessionId)) {
      void connectWhatsAppSession(db, source.name).catch(() => undefined)
    }

    return {
      id: sessionId,
      tamuFrom: source.name,
      status: runtime?.status || stored?.status || 'disconnected',
      qrDataUrl: runtime?.qrDataUrl || null,
      phoneNumber: runtime?.phoneNumber || stored?.phone_number || source.whatsapp_phone || null,
      displayName: runtime?.displayName || stored?.display_name || null,
      lastError: runtime?.lastError || stored?.last_error || null,
      connected: runtime?.status === 'connected',
      sessionSaved: savedSessions.has(sessionId),
      eligibleCount,
      delaySeconds: source.bulk_delay_seconds || 10,
      randomizeDelay: Boolean(source.bulk_randomize_delay),
      connectedAt: stored?.connected_at || source.whatsapp_connected_at || null,
    }
  })

  return result
}

export async function connectedWhatsAppSocket(db: WhatsAppDbClient, tamuFrom: string) {
  let runtime = runtimeForSource(tamuFrom)
  if (!runtime) {
    await connectWhatsAppSession(db, tamuFrom)
    runtime = runtimeForSource(tamuFrom)
  } else {
    runtime.db = db
  }

  const timeoutAt = Date.now() + 15_000
  while (runtime && runtime.status !== 'connected' && Date.now() < timeoutAt) {
    if (runtime.status === 'qr' || runtime.status === 'logged_out' || runtime.status === 'error') break
    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  if (!runtime?.socket || runtime.status !== 'connected') {
    throw new Error(runtime?.status === 'qr'
      ? `Session ${tamuFrom} belum discan`
      : `Session WhatsApp ${tamuFrom} belum tersambung`)
  }

  return { socket: runtime.socket, sessionId: runtime.sessionId }
}
