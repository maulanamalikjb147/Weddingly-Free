import { ImageResponse } from 'next/og'

import { fetchConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'

const invitationBaseUrl = (process.env.NEXT_PUBLIC_INVITATION_BASE_URL || 'https://anisa.maulanamalik.my.id').replace(/\/$/, '')

const absoluteUrl = (value: string) => {
  try {
    return new URL(value, `${invitationBaseUrl}/`).toString()
  } catch {
    return `${invitationBaseUrl}/foto_1_samping.jpg`
  }
}

export async function GET() {
  const config = await fetchConfig()
  const imageUrl = absoluteUrl(config.backgrounds?.bg_bride_groom || '/foto_1_samping.jpg')

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'stretch',
          background: '#171214',
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          width="1200"
          height="630"
          style={{ height: '100%', objectFit: 'cover', width: '100%' }}
        />
        <div
          style={{
            background: 'linear-gradient(180deg, transparent 42%, rgba(0, 0, 0, 0.84) 100%)',
            display: 'flex',
            inset: 0,
            position: 'absolute',
          }}
        />
        <div
          style={{
            alignItems: 'center',
            bottom: 46,
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            left: 70,
            position: 'absolute',
            right: 70,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 54, fontWeight: 600 }}>{config.coupleNames}</div>
          <div style={{ fontSize: 25, marginTop: 10, opacity: 0.9 }}>Wedding Invitation</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      },
    },
  )
}
