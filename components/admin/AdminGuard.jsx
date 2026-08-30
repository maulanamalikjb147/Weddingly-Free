"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabaseClient'

export default function AdminGuard({ children }) {
  const router = useRouter()
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session || null)
      if (!data.session) router.replace('/admin')
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      if (!nextSession) router.replace('/admin')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router])

  if (session === undefined) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>Memeriksa sesi admin...</div>
  }

  return session ? children : null
}
