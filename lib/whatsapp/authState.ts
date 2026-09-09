import 'server-only'

import {
  BufferJSON,
  initAuthCreds,
  proto,
  type AuthenticationState,
  type SignalDataSet,
  type SignalDataTypeMap,
} from '@whiskeysockets/baileys'

import { SUPABASE_TABLES } from '@/lib/supabaseTables'
import type { WhatsAppDbClient } from './serverSupabase'

const serialize = (value: unknown) => JSON.parse(JSON.stringify(value, BufferJSON.replacer))
const deserialize = <T>(value: unknown): T => JSON.parse(JSON.stringify(value), BufferJSON.reviver) as T
const storageKey = (type: string, id: string) => `${type}:${id}`

export async function createSupabaseAuthState(db: WhatsAppDbClient, sessionId: string) {
  const { data: storedCreds, error: credsError } = await db
    .from(SUPABASE_TABLES.whatsappAuth)
    .select('value')
    .eq('session_id', sessionId)
    .eq('key', 'creds')
    .maybeSingle()

  if (credsError) throw credsError

  const creds = storedCreds?.value
    ? deserialize<AuthenticationState['creds']>(storedCreds.value)
    : initAuthCreds()

  const state: AuthenticationState = {
    creds,
    keys: {
      async get<T extends keyof SignalDataTypeMap>(type: T, ids: string[]) {
        const result: { [id: string]: SignalDataTypeMap[T] } = {}
        if (ids.length === 0) return result

        const keys = ids.map((id) => storageKey(type, id))
        const { data, error } = await db
          .from(SUPABASE_TABLES.whatsappAuth)
          .select('key, value')
          .eq('session_id', sessionId)
          .in('key', keys)

        if (error) throw error

        const rows = new Map((data || []).map((row) => [row.key, row.value]))
        ids.forEach((id) => {
          const stored = rows.get(storageKey(type, id))
          if (stored === undefined) return

          let value = deserialize<SignalDataTypeMap[T]>(stored)
          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(
              value as unknown as Record<string, unknown>,
            ) as unknown as SignalDataTypeMap[T]
          }
          result[id] = value
        })

        return result
      },

      async set(data: SignalDataSet) {
        const upserts: Array<{ session_id: string; key: string; value: unknown; updated_at: string }> = []
        const deletes: string[] = []
        const now = new Date().toISOString()

        Object.entries(data).forEach(([type, entries]) => {
          Object.entries(entries || {}).forEach(([id, value]) => {
            const key = storageKey(type, id)
            if (value) {
              upserts.push({ session_id: sessionId, key, value: serialize(value), updated_at: now })
            } else {
              deletes.push(key)
            }
          })
        })

        if (upserts.length > 0) {
          const { error } = await db
            .from(SUPABASE_TABLES.whatsappAuth)
            .upsert(upserts, { onConflict: 'session_id,key' })
          if (error) throw error
        }

        if (deletes.length > 0) {
          const { error } = await db
            .from(SUPABASE_TABLES.whatsappAuth)
            .delete()
            .eq('session_id', sessionId)
            .in('key', deletes)
          if (error) throw error
        }
      },
    },
  }

  const saveCreds = async () => {
    const { error } = await db
      .from(SUPABASE_TABLES.whatsappAuth)
      .upsert({
        session_id: sessionId,
        key: 'creds',
        value: serialize(state.creds),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id,key' })

    if (error) throw error
  }

  return { state, saveCreds, hasStoredCredentials: Boolean(storedCreds?.value) }
}
