"use client"
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, RefreshCw, Save, X, ImagePlus, Trash2, Upload } from 'lucide-react'
import { supabase } from './supabaseClient'
import { defaultConfig } from '@/lib/config'

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="cms-field">
      <span>{label}</span>
      <input type={type} className="input-field" value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function TextArea({ label, value, onChange, rows = 4 }) {
  return (
    <label className="cms-field cms-field-wide">
      <span>{label}</span>
      <textarea className="input-field cms-textarea" value={value ?? ''} rows={rows} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="cms-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
      <div 
        onClick={() => onChange(!checked)}
        style={{ 
          width: '40px', height: '22px', borderRadius: '11px', 
          background: checked ? 'var(--color-ink, #000)' : '#ccc', 
          position: 'relative', transition: 'background 0.3s'
        }}
      >
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
          position: 'absolute', top: '2px', left: checked ? '20px' : '2px', transition: 'left 0.3s'
        }} />
      </div>
      <span style={{ margin: 0, fontWeight: 500 }}>{label}</span>
    </label>
  )
}

export default function ContentCms() {
  const [content, setContent] = useState(defaultConfig)
  const [activeTab, setActiveTab] = useState('general')
  const [view, setView] = useState('form') // 'form' or 'media'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Media State
  const [imageAssets, setImageAssets] = useState([])
  const [uploading, setUploading] = useState(false)
  const [mediaTarget, setMediaTarget] = useState('galeri') // 'galeri' or background keys
  const update = (key, value) => {
    setContent((current) => ({ ...current, [key]: value }))
  }

  const updateNested = (parent, key, value) => {
    setContent((current) => ({
      ...current,
      [parent]: { ...current[parent], [key]: value }
    }))
  }

  const updateGiftsArray = (index, key, value) => {
    setContent((current) => {
      const newAccounts = [...current.gifts.accounts]
      newAccounts[index] = { ...newAccounts[index], [key]: value }
      return { ...current, gifts: { ...current.gifts, accounts: newAccounts } }
    })
  }

  const loadContent = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    try {
      const { data, error } = await supabase.from('wedding_cms_settings').select('content').eq('id', 'default').maybeSingle()
      if (error) throw error
      if (data && data.content) {
        setContent({ 
          ...defaultConfig, 
          ...data.content,
          backgrounds: { ...defaultConfig.backgrounds, ...(data.content.backgrounds || {}) },
          gallery: { ...defaultConfig.gallery, ...(data.content.gallery || {}) },
          gifts: { ...defaultConfig.gifts, ...(data.content.gifts || {}) },
          holyMatrimony: { ...defaultConfig.holyMatrimony, ...(data.content.holyMatrimony || {}) },
          weddingReception: { ...defaultConfig.weddingReception, ...(data.content.weddingReception || {}) },
          livestreaming: { ...defaultConfig.livestreaming, ...(data.content.livestreaming || {}) }
        })
      } else {
        setContent(defaultConfig)
      }
    } catch (error) {
      console.error('CMS load failed:', error)
      setContent(defaultConfig)
      setMessage({ type: 'error', text: 'Gagal memuat konfigurasi dari database.' })
    } finally { setLoading(false) }
  }, [])

  const loadAssets = async () => {
    try {
      const { data, error } = await supabase.storage.from('wedding-assets').list('cms/imported/images-v2', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
      if (error) throw error
      
      const files = data.filter((file) => file.name !== '.emptyFolderPlaceholder')
      const assets = files.map((file) => {
        const { data: { publicUrl } } = supabase.storage.from('wedding-assets').getPublicUrl(`cms/imported/images-v2/${file.name}`)
        return {
          id: file.id,
          file_name: file.name,
          public_url: publicUrl,
          created_at: file.created_at
        }
      })
      setImageAssets(assets)
    } catch (error) {
      console.error('Failed to load assets', error)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadContent() }, 0)
    return () => window.clearTimeout(timer)
  }, [loadContent])

  useEffect(() => {
    if (view === 'media') {
      void loadAssets()
    }
  }, [view])

  const saveContent = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const { error } = await supabase.from('wedding_cms_settings').upsert({ 
        id: 'default', 
        content: content, 
        updated_at: new Date().toISOString(), 
        updated_by: userData.user?.id || null 
      })
      if (error) throw error
      setMessage({ type: 'success', text: 'Semua perubahan berhasil disimpan.' })
    } catch (error) {
      console.error('CMS save failed:', error)
      setMessage({ type: 'error', text: `Gagal menyimpan: ${error.message}` })
    } finally { setSaving(false) }
  }

  const uploadFiles = async (event) => {
    try {
      setUploading(true)
      const files = Array.from(event.target.files)
      if (!files.length) return

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage.from('wedding-assets').upload(`cms/imported/images-v2/${fileName}`, file, { upsert: false })
        if (uploadError) throw uploadError
      }
      await loadAssets()
    } catch (error) {
      alert(`Gagal mengupload: ${error.message}`)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const deleteAsset = async (asset) => {
    if (!confirm('Yakin ingin menghapus foto ini?')) return
    try {
      const { error } = await supabase.storage.from('wedding-assets').remove([`cms/imported/images-v2/${asset.file_name}`])
      if (error) throw error
      await loadAssets()
    } catch (error) {
      alert(`Gagal menghapus: ${error.message}`)
    }
  }

  const handleSelectMedia = (asset) => {
    if (mediaTarget === 'galeri') {
      if (!content.gallery.photos.some((photo) => photo.src === asset.public_url)) {
        updateNested('gallery', 'photos', [...content.gallery.photos, { src: asset.public_url, alt: asset.label || 'Foto galeri' }])
      }
      setActiveTab('galeri')
    } else {
      updateNested('backgrounds', mediaTarget, asset.public_url)
      setActiveTab('latar-belakang')
    }
    setView('form')
  }

  const tabs = [
    { id: 'general', name: 'Umum & Tanggal' },
    { id: 'mempelai', name: 'Data Mempelai' },
    { id: 'cerita', name: 'Ayat & Timeline' },
    { id: 'acara', name: 'Detail Acara' },
    { id: 'galeri', name: 'Galeri Foto' },
    { id: 'rekening', name: 'Rekening (Gift)' },
    { id: 'lainnya', name: 'Fitur Lainnya' },
    { id: 'latar-belakang', name: 'Latar Belakang' },
  ]

  const renderTabContent = () => {
    if (activeTab === 'general') return (
      <div className="cms-block">
        <div className="cms-block-title"><h3>Informasi Dasar</h3></div>
        <div className="cms-fields-grid">
          <Field label="Nama Pasangan (Singkat)" value={content.coupleNames} onChange={(v) => update('coupleNames', v)} placeholder="Misal: Mikha & Clara" />
          <Field label="Tanggal Acara (Format ISO)" value={content.eventDate} onChange={(v) => update('eventDate', v)} placeholder="2025-12-21T08:00:00" />
        </div>
      </div>
    )

    if (activeTab === 'mempelai') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head"><strong>Sesi Pengantar Mempelai</strong></div>
          <div className="cms-fields-grid">
            <Field label="Judul" value={content.brideGroomTitle} onChange={(v) => update('brideGroomTitle', v)} />
            <Field label="Salam" value={content.brideGroomGreeting} onChange={(v) => update('brideGroomGreeting', v)} />
            <TextArea label="Teks Doa / Pengantar" value={content.brideGroomText} onChange={(v) => update('brideGroomText', v)} rows={3} />
          </div>
        </article>
        <article className="cms-repeat-item mt-4">
          <div className="cms-repeat-head"><strong>Mempelai Pria</strong></div>
          <div className="cms-fields-grid">
            <Field label="Nama Lengkap" value={content.groom} onChange={(v) => update('groom', v)} />
            <Field label="Nama Panggilan" value={content.groomNickName} onChange={(v) => update('groomNickName', v)} />
            <Field label="Instagram" value={content.groomInstagram} onChange={(v) => update('groomInstagram', v)} />
            <TextArea label="Bio / Detail Orang Tua" value={content.groomBio} onChange={(v) => update('groomBio', v)} />
          </div>
        </article>
        <article className="cms-repeat-item mt-4">
          <div className="cms-repeat-head"><strong>Mempelai Wanita</strong></div>
          <div className="cms-fields-grid">
            <Field label="Nama Lengkap" value={content.bride} onChange={(v) => update('bride', v)} />
            <Field label="Nama Panggilan" value={content.brideNickName} onChange={(v) => update('brideNickName', v)} />
            <Field label="Instagram" value={content.brideInstagram} onChange={(v) => update('brideInstagram', v)} />
            <TextArea label="Bio / Detail Orang Tua" value={content.brideBio} onChange={(v) => update('brideBio', v)} />
          </div>
        </article>
      </div>
    )

    if (activeTab === 'cerita') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head"><strong>Ayat Alkitab / Kutipan Suci</strong></div>
          <div className="cms-fields-grid">
            <Field label="Sumber Ayat" value={content.bibleVerse} onChange={(v) => update('bibleVerse', v)} placeholder="Misal: 1 Korintus 13:4-7" />
            <TextArea label="Isi Kutipan" value={content.bibleVerseContent} onChange={(v) => update('bibleVerseContent', v)} />
          </div>
        </article>
        <article className="cms-repeat-item mt-4">
          <div className="cms-repeat-head"><strong>Timeline Cerita</strong></div>
          <div className="cms-fields-grid">
            <Field label="Tahun/Judul 1" value={content.timeline_1} onChange={(v) => update('timeline_1', v)} />
            <TextArea label="Cerita 1" value={content.timeline_1_content} onChange={(v) => update('timeline_1_content', v)} rows={2} />
            <Field label="Tahun/Judul 2" value={content.timeline_2} onChange={(v) => update('timeline_2', v)} />
            <TextArea label="Cerita 2" value={content.timeline_2_content} onChange={(v) => update('timeline_2_content', v)} rows={2} />
            <Field label="Tahun/Judul 3" value={content.timeline_3} onChange={(v) => update('timeline_3', v)} />
            <TextArea label="Cerita 3" value={content.timeline_3_content} onChange={(v) => update('timeline_3_content', v)} rows={2} />
            <Field label="Tahun/Judul 4" value={content.timeline_4} onChange={(v) => update('timeline_4', v)} />
            <TextArea label="Cerita 4" value={content.timeline_4_content} onChange={(v) => update('timeline_4_content', v)} rows={2} />
          </div>
        </article>
      </div>
    )

    if (activeTab === 'acara') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Pemberkatan / Akad (Holy Matrimony)</strong>
            <Toggle label="Aktifkan" checked={content.holyMatrimony.enabled} onChange={(v) => updateNested('holyMatrimony', 'enabled', v)} />
          </div>
          {content.holyMatrimony.enabled && (
            <div className="cms-fields-grid">
              <Field label="Waktu" value={content.holyMatrimony.time} onChange={(v) => updateNested('holyMatrimony', 'time', v)} />
              <Field label="Nama Tempat/Gereja" value={content.holyMatrimony.place} onChange={(v) => updateNested('holyMatrimony', 'place', v)} />
              <TextArea label="Alamat Detail" value={content.holyMatrimony.place_details} onChange={(v) => updateNested('holyMatrimony', 'place_details', v)} rows={2} />
              <Field label="Link Google Maps" value={content.holyMatrimony.googleMapsLink} onChange={(v) => updateNested('holyMatrimony', 'googleMapsLink', v)} />
            </div>
          )}
        </article>
        <article className="cms-repeat-item mt-4">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Resepsi Pernikahan</strong>
            <Toggle label="Aktifkan" checked={content.weddingReception.enabled} onChange={(v) => updateNested('weddingReception', 'enabled', v)} />
          </div>
          {content.weddingReception.enabled && (
            <div className="cms-fields-grid">
              <Field label="Waktu" value={content.weddingReception.time} onChange={(v) => updateNested('weddingReception', 'time', v)} />
              <Field label="Nama Tempat" value={content.weddingReception.place} onChange={(v) => updateNested('weddingReception', 'place', v)} />
              <TextArea label="Alamat Detail" value={content.weddingReception.place_details} onChange={(v) => updateNested('weddingReception', 'place_details', v)} rows={2} />
              <Field label="Link Google Maps" value={content.weddingReception.googleMapsLink} onChange={(v) => updateNested('weddingReception', 'googleMapsLink', v)} />
            </div>
          )}
        </article>
      </div>
    )

    if (activeTab === 'lainnya') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Live Streaming</strong>
            <Toggle label="Aktifkan" checked={content.livestreaming.enabled} onChange={(v) => updateNested('livestreaming', 'enabled', v)} />
          </div>
          {content.livestreaming.enabled && (
            <div className="cms-fields-grid">
              <Field label="Waktu" value={content.livestreaming.time} onChange={(v) => updateNested('livestreaming', 'time', v)} />
              <Field label="Link Livestream" value={content.livestreaming.link} onChange={(v) => updateNested('livestreaming', 'link', v)} />
              <TextArea label="Detail Tambahan" value={content.livestreaming.detail} onChange={(v) => updateNested('livestreaming', 'detail', v)} rows={2} />
            </div>
          )}
        </article>

        <article className="cms-repeat-item mt-4">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Video Prewedding (Embed)</strong>
            <Toggle label="Aktifkan" checked={content.prewedding.enabled} onChange={(v) => updateNested('prewedding', 'enabled', v)} />
          </div>
          {content.prewedding.enabled && (
            <div className="cms-fields-grid">
              <Field label="Link Embed (Youtube)" value={content.prewedding.link} onChange={(v) => updateNested('prewedding', 'link', v)} />
              <TextArea label="Detail Tambahan" value={content.prewedding.detail} onChange={(v) => updateNested('prewedding', 'detail', v)} rows={2} />
            </div>
          )}
        </article>

        <article className="cms-repeat-item mt-4">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Fitur RSVP</strong>
            <Toggle label="Aktifkan" checked={content.rsvp.enabled} onChange={(v) => updateNested('rsvp', 'enabled', v)} />
          </div>
          {content.rsvp.enabled && (
            <div className="cms-fields-grid">
              <TextArea label="Pesan Detail RSVP" value={content.rsvp.detail} onChange={(v) => updateNested('rsvp', 'detail', v)} rows={2} />
            </div>
          )}
        </article>

        <article className="cms-repeat-item mt-4">
          <div className="cms-repeat-head"><strong>Pesan Penutup (Thank You)</strong></div>
          <div className="cms-fields-grid">
            <Field label="Judul" value={content.thankyou} onChange={(v) => update('thankyou', v)} />
            <TextArea label="Isi Pesan" value={content.thankyouDetail} onChange={(v) => update('thankyouDetail', v)} />
          </div>
        </article>
      </div>
    )

    if (activeTab === 'galeri') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Galeri Foto</strong>
            <Toggle label="Aktifkan" checked={content.gallery?.enabled} onChange={(v) => updateNested('gallery', 'enabled', v)} />
          </div>
          {content.gallery?.enabled && (
            <div className="mt-4">
              <button 
                type="button" 
                className="btn-primary mb-4 w-full flex justify-center items-center gap-2" 
                style={{ padding: '10px' }}
                onClick={() => {
                  setMediaTarget('galeri')
                  setView('media')
                }}
              >
                <ImagePlus size={16} /> Tambah Foto dari Media
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {content.gallery.photos?.map((photo, i) => (
                  <div key={i} style={{ position: 'relative', aspectRatio: '1', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={photo.src} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button 
                      type="button"
                      onClick={() => {
                        const newPhotos = [...content.gallery.photos]
                        newPhotos.splice(i, 1)
                        updateNested('gallery', 'photos', newPhotos)
                      }}
                      style={{
                        position: 'absolute', top: '8px', right: '8px', background: 'red', color: 'white',
                        border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    )

    if (activeTab === 'rekening') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Wedding Gift</strong>
            <Toggle label="Aktifkan" checked={content.gifts?.enabled} onChange={(v) => updateNested('gifts', 'enabled', v)} />
          </div>
          {content.gifts?.enabled && (
            <div className="mt-4">
              {content.gifts.accounts?.map((acc, i) => (
                <div key={i} style={{ border: '1px solid #ddd', padding: '16px', borderRadius: '8px', marginBottom: '16px', background: '#fcfcfc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <strong style={{ fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>Rekening {i + 1}</strong>
                    <button 
                      type="button"
                      onClick={() => {
                        const newAccs = [...content.gifts.accounts]
                        newAccs.splice(i, 1)
                        updateNested('gifts', 'accounts', newAccs)
                      }}
                      style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="cms-fields-grid">
                    <Field label="Bank / E-Wallet" value={acc.bank} onChange={(v) => updateGiftsArray(i, 'bank', v)} placeholder="BCA / Mandiri / Dana" />
                    <Field label="No. Rekening" value={acc.number} onChange={(v) => updateGiftsArray(i, 'number', v)} placeholder="123456789" />
                    <Field label="Atas Nama" value={acc.owner} onChange={(v) => updateGiftsArray(i, 'owner', v)} placeholder="Nama Pemilik" />
                  </div>
                </div>
              ))}
              <button 
                type="button" 
                style={{ width: '100%', padding: '12px', border: '1px dashed #ccc', borderRadius: '8px', background: 'transparent', cursor: 'pointer' }}
                onClick={() => {
                  const newAccs = [...(content.gifts?.accounts || []), { bank: '', number: '', owner: '' }]
                  updateNested('gifts', 'accounts', newAccs)
                }}
              >
                + Tambah Rekening
              </button>
            </div>
          )}
        </article>
      </div>
    )
    if (activeTab === 'latar-belakang') {
      const bgSections = [
        { key: 'bg_sidebar', label: 'Sidebar / Sisi Kiri (Desktop)' },
        { key: 'bg_welcome', label: 'Halaman Welcome (Utama)' },
        { key: 'bg_bride_groom', label: 'Slide Pengantar Mempelai' },
        { key: 'slide_1', label: 'Slide 1 (Ayat Alkitab)' },
        { key: 'slide_2', label: 'Slide 2 (Mempelai Pria)' },
        { key: 'slide_3', label: 'Slide 3 (Mempelai Wanita)' },
        { key: 'slide_4', label: 'Slide 4 (Timeline)' },
        { key: 'slide_5', label: 'Slide 5 (Detail Acara)' },
        { key: 'slide_6', label: 'Slide 6 (Countdown)' },
        { key: 'slide_7', label: 'Slide 7 (Live Streaming)' },
        { key: 'slide_8', label: 'Slide 8 (Prewedding)' },
        { key: 'slide_9', label: 'Slide 9 (RSVP / Form)' },
        { key: 'slide_10', label: 'Slide 10 (Wishes)' },
        { key: 'bg_gifts', label: 'Halaman Wedding Gift' },
      ]

      return (
        <div className="cms-repeat-list">
          <div className="cms-block-title mb-4"><h3>Pilih Latar Belakang per Halaman</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {bgSections.map((sec) => (
              <div key={sec.key} style={{ border: '1px solid #eee', padding: '12px', borderRadius: '8px', background: '#fafafa' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 'bold' }}>{sec.label}</p>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#ccc', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                  {content.backgrounds?.[sec.key] ? (
                    <img src={content.backgrounds[sec.key]} alt={sec.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888', fontSize: '12px' }}>
                      Pilih gambar dari galeri
                    </div>
                  )}
                </div>
                <button 
                  type="button" 
                  className="btn-primary w-full"
                  style={{ padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  onClick={() => {
                    setMediaTarget(sec.key)
                    setView('media')
                  }}
                >
                  <ImagePlus size={14} /> Ganti Gambar
                </button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="admin-page cms-page">
      <nav className="cms-topbar">
        <span>Wedding Admin</span>
        {view === 'media' ? (
          <button type="button" onClick={() => setView('form')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#000', cursor: 'pointer' }}>
            <ArrowLeft size={15} /> Kembali ke Form
          </button>
        ) : (
          <Link href="/admin"><ArrowLeft size={15} /> Dashboard</Link>
        )}
      </nav>

      {view === 'media' ? (
        <main className="cms-main">
          <header className="cms-page-header">
            <div>
              <h1>Penyimpanan Media</h1>
              <p>Kelola foto-foto untuk galeri atau latar belakang undangan.</p>
            </div>
            <div className="cms-header-actions">
              <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={16} />
                {uploading ? 'Mengupload...' : 'Upload Foto'}
                <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={uploadFiles} disabled={uploading} />
              </label>
            </div>
          </header>

          <div className="cms-layout" style={{ display: 'block' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {imageAssets.map((asset) => (
                <div key={asset.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '8px', background: '#fff' }}>
                  <div style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px', background: '#f5f5f5' }}>
                    <img src={asset.public_url} alt="Media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => handleSelectMedia(asset)}
                      style={{ flex: 1, padding: '6px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                      Gunakan
                    </button>
                    <button 
                      type="button" 
                      onClick={() => deleteAsset(asset)}
                      style={{ padding: '6px', background: '#fee', color: '#e00', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {imageAssets.length === 0 && !uploading && (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#666', border: '1px dashed #ccc', borderRadius: '8px' }}>
                  Belum ada foto yang diupload. Silakan upload foto baru.
                </div>
              )}
            </div>
          </div>
        </main>
      ) : (
        <main className="cms-main">
          <header className="cms-page-header">
            <div>
              <h1>Pengaturan Undangan</h1>
              <p>Ubah nama, tanggal, acara, dan cerita undangan secara langsung.</p>
            </div>
            <div className="cms-header-actions">
              <button type="button" onClick={() => void loadContent()} disabled={loading}>
                <RefreshCw size={16} /> Muat ulang
              </button>
              <button type="button" className="btn-primary" onClick={() => void saveContent()} disabled={saving || loading}>
                <Save size={16} />{saving ? 'Menyimpan...' : 'Simpan perubahan'}
              </button>
            </div>
          </header>
          
          {message && (
            <div className={`cms-message cms-message-${message.type}`}>
              {message.type === 'success' ? <Check size={17} /> : <X size={17} />}
              {message.text}
            </div>
          )}

          <div className="cms-layout">
            <aside className="cms-section-list">
              <div className="cms-section-list-head">
                <strong>Kategori Konten</strong>
              </div>
              {tabs.map((tab, index) => (
                <button 
                  type="button" 
                  key={tab.id} 
                  data-active={tab.id === activeTab} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="cms-section-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="cms-section-name">
                    <strong>{tab.name}</strong>
                  </span>
                </button>
              ))}
            </aside>
            
            <section className="cms-editor-panel">
              <div className="cms-editor-heading">
                <div>
                  <span>PENGATURAN KONTEN</span>
                  <h2>{tabs.find(t => t.id === activeTab)?.name}</h2>
                </div>
              </div>
              {renderTabContent()}
            </section>
          </div>
        </main>
      )}
    </div>
  )
}
