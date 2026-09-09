import 'server-only'

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const fallbackAdminEmail = 'maulanamalikjb147@gmail.com'

export type WhatsAppDbClient = SupabaseClient

function requiredEnvironment() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Konfigurasi Supabase belum lengkap')
  }

  return { supabaseUrl, supabaseAnonKey }
}

function userClient(accessToken: string): WhatsAppDbClient {
  const env = requiredEnvironment()
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function whatsappDataClient(accessToken: string): WhatsAppDbClient {
  const env = requiredEnvironment()
  if (!serviceRoleKey) return userClient(accessToken)

  return createClient(env.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function authenticateWhatsAppAdmin(request: Request): Promise<{
  accessToken: string
  user: User
  db: WhatsAppDbClient
}> {
  const authorization = request.headers.get('authorization') || ''
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''
  if (!accessToken) throw new Error('Sesi admin tidak ditemukan')

  const authClient = userClient(accessToken)
  const { data, error } = await authClient.auth.getUser(accessToken)
  if (error || !data.user) throw new Error('Sesi admin sudah berakhir')

  const allowedEmails = (process.env.ADMIN_EMAILS || fallbackAdminEmail)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (!data.user.email || !allowedEmails.includes(data.user.email.toLowerCase())) {
    throw new Error('Akun ini tidak memiliki akses WhatsApp admin')
  }

  return { accessToken, user: data.user, db: whatsappDataClient(accessToken) }
}
