'use client'
/* eslint-disable @next/next/no-img-element */

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  LoaderCircle,
  LogOut,
  MessageSquareText,
  Phone,
  QrCode,
  RefreshCw,
  Send,
  Smartphone,
  Users,
  X,
  XCircle,
} from 'lucide-react'

import { supabase } from './supabaseClient'

type SessionStatus = {
  id: string
  tamuFrom: string
  status: string
  qrDataUrl: string | null
  phoneNumber: string | null
  displayName: string | null
  lastError: string | null
  connected: boolean
  sessionSaved: boolean
  eligibleCount: number
  delaySeconds: number
  randomizeDelay: boolean
  connectedAt: string | null
}

type Batch = {
  id: string
  tamu_from: string
  status: string
  total_messages: number
  sent_count: number
  failed_count: number
  pending_count: number
  cancelled_count: number
  delay_seconds: number
  randomize_delay: boolean
  error: string | null
  created_at: string
  completed_at: string | null
}

type BatchItem = {
  id: string
  guest_name: string
  contact_number: string
  status: string
  error: string | null
  processed_at: string | null
}

type JobLog = {
  id: number
  level: string
  event: string
  message: string
  created_at: string
}

type JobsPayload = {
  batches: Batch[]
  selectedBatch: Batch | null
  items: BatchItem[]
  logs: JobLog[]
}

const emptyJobs: JobsPayload = { batches: [], selectedBatch: null, items: [], logs: [] }
const activeStatuses = ['creating', 'pending', 'processing']

const statusCopy: Record<string, string> = {
  disconnected: 'Belum tersambung',
  connecting: 'Menghubungkan',
  qr: 'Menunggu scan',
  connected: 'Tersambung',
  reconnecting: 'Menghubungkan ulang',
  logged_out: 'Session keluar',
  error: 'Bermasalah',
  creating: 'Menyiapkan',
  pending: 'Dalam antrean',
  processing: 'Sedang dikirim',
  completed: 'Selesai',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
  sending: 'Mengirim',
  sent: 'Terkirim',
}

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '-'

const formatTime = (value: string) => new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
}).format(new Date(value))

const authTimeout = () => new Promise<{ data: { session: null } }>((resolve) => {
  window.setTimeout(() => resolve({ data: { session: null } }), 4500)
})

function StatusIcon({ status, size = 16 }: { status: string; size?: number }) {
  if (['connecting', 'reconnecting', 'creating', 'pending', 'processing', 'sending'].includes(status)) {
    return <LoaderCircle size={size} className="wa-spin" />
  }
  if (['connected', 'completed', 'sent'].includes(status)) return <CheckCircle2 size={size} />
  if (['error', 'failed'].includes(status)) return <XCircle size={size} />
  if (status === 'cancelled') return <CircleAlert size={size} />
  return <Clock3 size={size} />
}

export default function WhatsAppDashboard() {
  const [sessions, setSessions] = useState<SessionStatus[]>([])
  const [jobs, setJobs] = useState<JobsPayload>(emptyJobs)
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null)
  const [selectedSender, setSelectedSender] = useState('')
  const [delaySeconds, setDelaySeconds] = useState(10)
  const [randomizeDelay, setRandomizeDelay] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [qrSender, setQrSender] = useState<string | null>(null)
  const [confirmSend, setConfirmSend] = useState(false)

  const apiRequest = useCallback(async (path: string, init?: RequestInit) => {
    const { data } = await Promise.race([supabase.auth.getSession(), authTimeout()])
    const token = data.session?.access_token
    if (!token) throw new Error('Sesi admin sudah berakhir')

    const response = await fetch(path, {
      ...init,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Permintaan gagal')
    return payload
  }, [])

  const loadDashboard = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true)
    try {
      const batchQuery = selectedBatchId ? `?batchId=${encodeURIComponent(selectedBatchId)}` : ''
      const [sessionPayload, jobsPayload] = await Promise.all([
        apiRequest('/api/whatsapp/sessions'),
        apiRequest(`/api/whatsapp/jobs${batchQuery}`),
      ])
      setSessions(sessionPayload.sessions || [])
      setJobs(jobsPayload)
      if (!selectedBatchId && jobsPayload.selectedBatch?.id) setSelectedBatchId(jobsPayload.selectedBatch.id)
      setError(null)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError))
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [apiRequest, selectedBatchId])

  useEffect(() => {
    void loadDashboard(true)
    const timer = window.setInterval(() => { void loadDashboard(false) }, 2500)
    return () => window.clearInterval(timer)
  }, [loadDashboard])

  const selectedSession = useMemo(
    () => sessions.find((session) => session.tamuFrom === selectedSender) || null,
    [selectedSender, sessions],
  )
  const qrSession = useMemo(
    () => sessions.find((session) => session.tamuFrom === qrSender) || null,
    [qrSender, sessions],
  )

  useEffect(() => {
    if (selectedSender || sessions.length === 0) return
    const firstConnected = sessions.find((session) => session.connected) || sessions[0]
    setSelectedSender(firstConnected.tamuFrom)
    setDelaySeconds([5, 10, 15].includes(firstConnected.delaySeconds) ? firstConnected.delaySeconds : 10)
    setRandomizeDelay(firstConnected.randomizeDelay)
  }, [selectedSender, sessions])

  const runSessionAction = useCallback(async (action: 'connect' | 'logout' | 'refresh', tamuFrom: string) => {
    setBusyAction(`${action}:${tamuFrom}`)
    setError(null)
    try {
      await apiRequest('/api/whatsapp/sessions', {
        method: 'POST',
        body: JSON.stringify({ action, tamuFrom }),
      })
      if (action === 'connect') {
        setQrSender(tamuFrom)
        setSuccess(`Session ${tamuFrom} sedang disiapkan`)
      } else if (action === 'refresh') {
        setQrSender(tamuFrom)
        setSuccess(`QR ${tamuFrom} diperbarui`)
      } else {
        setQrSender(null)
        setSuccess(`Session ${tamuFrom} sudah dikeluarkan`)
      }
      await loadDashboard(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError))
    } finally {
      setBusyAction(null)
    }
  }, [apiRequest, loadDashboard])

  useEffect(() => {
    if (!qrSender || qrSession?.connected || qrSession?.status !== 'qr') return
    const refreshTimer = window.setTimeout(() => {
      void runSessionAction('refresh', qrSender)
    }, 35000)
    return () => window.clearTimeout(refreshTimer)
  }, [qrSender, qrSession?.connected, qrSession?.status, runSessionAction])

  const startBulk = async () => {
    setBusyAction('start-job')
    setError(null)
    try {
      const result = await apiRequest('/api/whatsapp/jobs', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          tamuFrom: selectedSender,
          delaySeconds,
          randomizeDelay,
        }),
      })
      setSelectedBatchId(result.batchId)
      setConfirmSend(false)
      setSuccess(`${result.totalMessages} pesan masuk antrean ${selectedSender}`)
      await loadDashboard(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError))
    } finally {
      setBusyAction(null)
    }
  }

  const cancelJob = async (batchId: string) => {
    setBusyAction(`cancel:${batchId}`)
    setError(null)
    try {
      await apiRequest('/api/whatsapp/jobs', {
        method: 'POST',
        body: JSON.stringify({ action: 'cancel', batchId }),
      })
      setSuccess('Pengiriman dibatalkan')
      await loadDashboard(false)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError))
    } finally {
      setBusyAction(null)
    }
  }

  const progress = jobs.selectedBatch
    ? Math.round(((jobs.selectedBatch.sent_count + jobs.selectedBatch.failed_count + jobs.selectedBatch.cancelled_count)
      / Math.max(1, jobs.selectedBatch.total_messages)) * 100)
    : 0

  return (
    <main className="wa-page">
      <header className="wa-topbar">
        <Link href="/admin" className="wa-brand">Wedding Admin</Link>
        <nav className="wa-topnav" aria-label="Navigasi admin">
          <Link href="/admin">Tamu</Link>
          <Link href="/admin/content">Konten</Link>
          <Link href="/admin/scan">Scan</Link>
          <span>WhatsApp</span>
        </nav>
      </header>

      <div className="wa-shell">
        <div className="wa-page-heading">
          <div>
            <Link href="/admin" className="wa-back-link"><ArrowLeft size={15} /> Dashboard</Link>
            <h1>WhatsApp</h1>
            <p>{sessions.filter((session) => session.connected).length} akun aktif · {sessions.reduce((sum, session) => sum + session.eligibleCount, 0)} undangan siap</p>
          </div>
          <button className="wa-icon-button" onClick={() => void loadDashboard(true)} aria-label="Refresh" title="Refresh">
            <RefreshCw size={18} className={loading ? 'wa-spin' : ''} />
          </button>
        </div>

        {error && <div className="wa-alert wa-alert-error"><CircleAlert size={17} /><span>{error}</span><button onClick={() => setError(null)} aria-label="Tutup"><X size={16} /></button></div>}
        {success && <div className="wa-alert wa-alert-success"><Check size={17} /><span>{success}</span><button onClick={() => setSuccess(null)} aria-label="Tutup"><X size={16} /></button></div>}

        <section className="wa-section" aria-labelledby="sessions-heading">
          <div className="wa-section-heading">
            <div>
              <span className="wa-eyebrow">SESSIONS</span>
              <h2 id="sessions-heading">Akun pengirim</h2>
            </div>
            <span className="wa-section-count">{sessions.length} akun</span>
          </div>

          <div className="wa-session-grid">
            {sessions.map((session) => {
              const waiting = busyAction?.endsWith(`:${session.tamuFrom}`)
              return (
                <article className="wa-session-card" key={session.id}>
                  <div className="wa-session-main">
                    <div className="wa-phone-mark"><Smartphone size={22} /></div>
                    <div className="wa-session-copy">
                      <div className="wa-session-name-row">
                        <h3>{session.tamuFrom}</h3>
                        <span className={`wa-status wa-status-${session.status}`}>
                          <StatusIcon status={session.status} size={14} />
                          {statusCopy[session.status] || session.status}
                        </span>
                      </div>
                      <p>{session.phoneNumber ? `+${session.phoneNumber}` : 'Nomor belum ditautkan'}</p>
                      <div className="wa-session-checks">
                        <span className={session.sessionSaved ? 'is-ok' : ''}>
                          {session.sessionSaved ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
                          Session {session.sessionSaved ? 'tersimpan' : 'belum tersimpan'}
                        </span>
                        <span><Users size={15} /> {session.eligibleCount} siap dikirim</span>
                      </div>
                      {session.lastError && <p className="wa-session-error">{session.lastError}</p>}
                    </div>
                  </div>
                  <div className="wa-session-actions">
                    {session.connected ? (
                      <>
                        <button className="wa-button wa-button-secondary" onClick={() => void runSessionAction('connect', session.tamuFrom)} disabled={waiting}>
                          <RefreshCw size={16} className={waiting ? 'wa-spin' : ''} /> Hubungkan ulang
                        </button>
                        <button className="wa-icon-button wa-icon-danger" onClick={() => void runSessionAction('logout', session.tamuFrom)} disabled={waiting} aria-label={`Logout ${session.tamuFrom}`} title="Logout session">
                          <LogOut size={17} />
                        </button>
                      </>
                    ) : (
                      <button className="wa-button wa-button-primary" onClick={() => void runSessionAction('connect', session.tamuFrom)} disabled={waiting}>
                        {waiting ? <LoaderCircle size={17} className="wa-spin" /> : <QrCode size={17} />}
                        Add session
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
            {!loading && sessions.length === 0 && <div className="wa-empty"><Smartphone size={28} /><span>Belum ada pengirim di config siraman</span></div>}
          </div>
        </section>

        <section className="wa-workspace" aria-labelledby="bulk-heading">
          <div className="wa-composer">
            <div className="wa-section-heading">
              <div>
                <span className="wa-eyebrow">BULK SEND</span>
                <h2 id="bulk-heading">Pengiriman baru</h2>
              </div>
              <Send size={20} />
            </div>

            <label className="wa-field">
              <span>Akun pengirim</span>
              <div className="wa-select-wrap">
                <select value={selectedSender} onChange={(event) => {
                  const session = sessions.find((item) => item.tamuFrom === event.target.value)
                  setSelectedSender(event.target.value)
                  if (session) {
                    setDelaySeconds([5, 10, 15].includes(session.delaySeconds) ? session.delaySeconds : 10)
                    setRandomizeDelay(session.randomizeDelay)
                  }
                }}>
                  {sessions.map((session) => <option key={session.id} value={session.tamuFrom}>{session.tamuFrom}</option>)}
                </select>
                <ChevronDown size={16} />
              </div>
            </label>

            <fieldset className="wa-field">
              <legend>Jeda per pesan</legend>
              <div className="wa-segmented">
                {[5, 10, 15].map((delay) => (
                  <button type="button" key={delay} className={delaySeconds === delay ? 'is-active' : ''} onClick={() => setDelaySeconds(delay)}>
                    {delay} detik
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="wa-toggle-row">
              <input type="checkbox" checked={randomizeDelay} onChange={(event) => setRandomizeDelay(event.target.checked)} />
              <span className="wa-toggle" aria-hidden="true" />
              <span>Acak jeda ±15%</span>
            </label>

            <div className="wa-send-summary">
              <div><Users size={17} /><span>Penerima</span><strong>{selectedSession?.eligibleCount || 0}</strong></div>
              <div><Clock3 size={17} /><span>Estimasi</span><strong>{Math.ceil(((selectedSession?.eligibleCount || 0) * delaySeconds) / 60)} mnt</strong></div>
            </div>

            <button
              className="wa-button wa-button-primary wa-send-button"
              disabled={!selectedSession?.connected || !selectedSession.eligibleCount || busyAction === 'start-job'}
              onClick={() => setConfirmSend(true)}
            >
              <Send size={17} /> Kirim bulk
            </button>
            {!selectedSession?.connected && selectedSession && <p className="wa-inline-warning"><CircleAlert size={14} /> Session {selectedSession.tamuFrom} belum tersambung</p>}
          </div>

          <div className="wa-jobs-panel">
            <div className="wa-section-heading">
              <div>
                <span className="wa-eyebrow">ACTIVITY</span>
                <h2>Riwayat pengiriman</h2>
              </div>
              <span className="wa-section-count">{jobs.batches.length} job</span>
            </div>

            <div className="wa-job-list">
              {jobs.batches.map((batch) => {
                const isSelected = jobs.selectedBatch?.id === batch.id
                const isActive = activeStatuses.includes(batch.status)
                const batchProgress = Math.round(((batch.sent_count + batch.failed_count + batch.cancelled_count) / Math.max(1, batch.total_messages)) * 100)
                return (
                  <button
                    key={batch.id}
                    className={`wa-job-row ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedBatchId(batch.id)}
                  >
                    <span className={`wa-job-state wa-job-state-${batch.status}`}><StatusIcon status={batch.status} /></span>
                    <span className="wa-job-copy">
                      <strong>{batch.tamu_from}</strong>
                      <small>{formatDate(batch.created_at)} · {batch.delay_seconds} dtk/pesan</small>
                      {isActive && <span className="wa-mini-progress"><i style={{ width: `${batchProgress}%` }} /></span>}
                    </span>
                    <span className="wa-job-numbers"><strong>{batch.sent_count}/{batch.total_messages}</strong><small>{statusCopy[batch.status] || batch.status}</small></span>
                    <ChevronRight size={17} />
                  </button>
                )
              })}
              {!loading && jobs.batches.length === 0 && <div className="wa-empty"><MessageSquareText size={28} /><span>Belum ada pengiriman</span></div>}
            </div>
          </div>
        </section>

        {jobs.selectedBatch && (
          <section className="wa-job-detail" aria-live="polite">
            <div className="wa-detail-heading">
              <div>
                <span className={`wa-status wa-status-${jobs.selectedBatch.status}`}><StatusIcon status={jobs.selectedBatch.status} /> {statusCopy[jobs.selectedBatch.status] || jobs.selectedBatch.status}</span>
                <h2>{jobs.selectedBatch.tamu_from} · {jobs.selectedBatch.total_messages} pesan</h2>
                <p>{formatDate(jobs.selectedBatch.created_at)}</p>
              </div>
              {activeStatuses.includes(jobs.selectedBatch.status) && (
                <button className="wa-button wa-button-danger" onClick={() => void cancelJob(jobs.selectedBatch!.id)} disabled={busyAction === `cancel:${jobs.selectedBatch.id}`}>
                  <X size={16} /> Batalkan
                </button>
              )}
            </div>

            <div className="wa-progress-summary">
              <div><span>Progress</span><strong>{progress}%</strong></div>
              <div><span>Terkirim</span><strong className="is-success">{jobs.selectedBatch.sent_count}</strong></div>
              <div><span>Gagal</span><strong className="is-danger">{jobs.selectedBatch.failed_count}</strong></div>
              <div><span>Menunggu</span><strong>{jobs.selectedBatch.pending_count}</strong></div>
            </div>
            <div className="wa-progress-track"><span style={{ width: `${progress}%` }} /></div>

            <div className="wa-detail-grid">
              <div className="wa-console">
                <div className="wa-console-header"><span><MessageSquareText size={15} /> Console output</span><span className={activeStatuses.includes(jobs.selectedBatch.status) ? 'is-live' : ''}>{activeStatuses.includes(jobs.selectedBatch.status) ? 'LIVE' : 'FINISH'}</span></div>
                <div className="wa-console-body">
                  {jobs.logs.map((log) => (
                    <div key={log.id} className={`wa-log wa-log-${log.level}`}>
                      <time>{formatTime(log.created_at)}</time><span>{log.message}</span>
                    </div>
                  ))}
                  {jobs.logs.length === 0 && <div className="wa-log"><time>--:--:--</time><span>Menunggu output...</span></div>}
                </div>
              </div>

              <div className="wa-recipient-list">
                <div className="wa-recipient-header"><span>Penerima</span><span>{jobs.items.length}</span></div>
                <div className="wa-recipient-scroll">
                  {jobs.items.map((item) => (
                    <div className="wa-recipient-row" key={item.id}>
                      <span className={`wa-recipient-icon wa-job-state-${item.status}`}><StatusIcon status={item.status} size={14} /></span>
                      <span><strong>{item.guest_name}</strong><small>{item.contact_number}{item.error ? ` · ${item.error}` : ''}</small></span>
                      <small>{statusCopy[item.status] || item.status}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {qrSender && (
        <div className="wa-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setQrSender(null)
        }}>
          <div className="wa-modal" role="dialog" aria-modal="true" aria-labelledby="qr-title">
            <button className="wa-modal-close" onClick={() => setQrSender(null)} aria-label="Tutup"><X size={19} /></button>
            <div className="wa-modal-icon"><QrCode size={24} /></div>
            <h2 id="qr-title">Tautkan {qrSender}</h2>
            <p>WhatsApp · Perangkat tertaut · Tautkan perangkat</p>
            <div className="wa-qr-frame">
              {qrSession?.qrDataUrl ? <img src={qrSession.qrDataUrl} alt={`QR session ${qrSender}`} /> : <LoaderCircle size={30} className="wa-spin" />}
            </div>
            <span className={`wa-status wa-status-${qrSession?.status || 'connecting'}`}><StatusIcon status={qrSession?.status || 'connecting'} /> {statusCopy[qrSession?.status || 'connecting']}</span>
            {!qrSession?.connected && (
              <button
                className="wa-button wa-button-secondary wa-refresh-qr"
                onClick={() => void runSessionAction('refresh', qrSender)}
                disabled={busyAction === `refresh:${qrSender}`}
              >
                {busyAction === `refresh:${qrSender}` ? <LoaderCircle size={17} className="wa-spin" /> : <RefreshCw size={17} />}
                Refresh QR
              </button>
            )}
            {qrSession?.connected && <button className="wa-button wa-button-primary" onClick={() => setQrSender(null)}><Check size={17} /> Selesai</button>}
          </div>
        </div>
      )}

      {confirmSend && selectedSession && (
        <div className="wa-modal-backdrop">
          <div className="wa-modal wa-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <button className="wa-modal-close" onClick={() => setConfirmSend(false)} aria-label="Tutup"><X size={19} /></button>
            <div className="wa-modal-icon"><Send size={24} /></div>
            <h2 id="confirm-title">Kirim {selectedSession.eligibleCount} undangan?</h2>
            <p>{selectedSession.tamuFrom} · {delaySeconds} detik per pesan</p>
            <div className="wa-confirm-stats">
              <span><Phone size={17} />+{selectedSession.phoneNumber || '-'}</span>
              <span><Clock3 size={17} />±{Math.ceil((selectedSession.eligibleCount * delaySeconds) / 60)} menit</span>
            </div>
            <div className="wa-confirm-actions">
              <button className="wa-button wa-button-secondary" onClick={() => setConfirmSend(false)}>Batal</button>
              <button className="wa-button wa-button-primary" onClick={() => void startBulk()} disabled={busyAction === 'start-job'}>
                {busyAction === 'start-job' ? <LoaderCircle size={17} className="wa-spin" /> : <Send size={17} />} Kirim sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
