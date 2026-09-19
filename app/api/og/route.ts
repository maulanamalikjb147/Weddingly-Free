import sharp from 'sharp'

import { fetchConfig } from '@/lib/config'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const width = 1200
const height = 630
const invitationBaseUrl = (process.env.NEXT_PUBLIC_INVITATION_BASE_URL || 'https://anisa.maulanamalik.my.id').replace(/\/$/, '')

const absoluteUrl = (value: string) => {
  try {
    return new URL(value, `${invitationBaseUrl}/`).toString()
  } catch {
    return `${invitationBaseUrl}/foto_1_samping.jpg`
  }
}

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

export async function GET() {
  const config = await fetchConfig()
  const imageUrl = absoluteUrl(config.backgrounds?.bg_bride_groom || '/foto_1_samping.jpg')
  const imageResponse = await fetch(imageUrl)

  if (!imageResponse.ok) {
    return new Response('Preview image could not be loaded', { status: 502 })
  }

  const coupleNames = escapeXml(config.coupleNames)
  const overlay = Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="42%" stop-color="#000" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.84"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#shade)"/>
      <text x="600" y="520" fill="#fff" font-family="Arial, sans-serif" font-size="54" font-weight="600" text-anchor="middle">${coupleNames}</text>
      <text x="600" y="578" fill="#fff" fill-opacity="0.9" font-family="Arial, sans-serif" font-size="25" text-anchor="middle">Wedding Invitation</text>
    </svg>
  `)

  const preview = await sharp(Buffer.from(await imageResponse.arrayBuffer()))
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .composite([{ input: overlay }])
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toBuffer()

  return new Response(new Uint8Array(preview), {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      'Content-Length': String(preview.byteLength),
      'Content-Type': 'image/jpeg',
    },
  })
}
