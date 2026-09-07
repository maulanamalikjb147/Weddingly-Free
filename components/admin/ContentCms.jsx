"use client"
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, RefreshCw, Save, X, ImagePlus, Trash2, Upload, GripVertical, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from './supabaseClient'
import { defaultConfig } from '@/lib/config'
import { SUPABASE_TABLES } from '@/lib/supabaseTables'

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
  const [musicAssets, setMusicAssets] = useState([])
  const [uploading, setUploading] = useState(false)
  const [mediaTarget, setMediaTarget] = useState('galeri') // 'galeri' or background keys
  const [sameAsAkad, setSameAsAkad] = useState(false)
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
      const { data, error } = await supabase.from(SUPABASE_TABLES.weddingCmsSettings).select('content').eq('id', 'default').maybeSingle()
      if (error) throw error
      if (data && data.content) {
        let loadedOrder = data.content.sectionOrder ? [...data.content.sectionOrder] : ['ayat', 'pengantar', 'cpw', 'cpp', 'acara', 'countdown', 'timeline', 'galeri', 'rsvp', 'rekening', 'thankyou'];
        const galeriIdx = loadedOrder.indexOf('galeri');
        const rsvpIdx = loadedOrder.indexOf('rsvp');
        const rekeningIdx = loadedOrder.indexOf('rekening');
        if (galeriIdx !== -1 && rsvpIdx !== -1 && rekeningIdx !== -1 && rekeningIdx < rsvpIdx) {
          loadedOrder = loadedOrder.filter(s => s !== 'rsvp');
          const newGaleriIdx = loadedOrder.indexOf('galeri');
          loadedOrder.splice(newGaleriIdx + 1, 0, 'rsvp');
        }

        setContent({ 
          ...defaultConfig, 
          ...data.content,
          sectionOrder: loadedOrder,
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
      const { data, error } = await supabase.storage.from('wedding-assets').list('cms/imported/images-siraman', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } })
      if (error) throw error
      
      const files = data.filter((file) => file.name !== '.emptyFolderPlaceholder')
      const assets = files.map((file) => {
        const { data: { publicUrl } } = supabase.storage.from('wedding-assets').getPublicUrl(`cms/imported/images-siraman/${file.name}`)
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

  const loadMusicAssets = async () => {
    try {
      const { data, error } = await supabase.storage.from('wedding-assets').list('cms/imported/music', { limit: 50, sortBy: { column: 'created_at', order: 'desc' } })
      if (error) throw error
      
      const files = data.filter((file) => file.name !== '.emptyFolderPlaceholder')
      const assets = files.map((file) => {
        const { data: { publicUrl } } = supabase.storage.from('wedding-assets').getPublicUrl(`cms/imported/music/${file.name}`)
        return {
          id: file.id,
          file_name: file.name,
          public_url: publicUrl,
          created_at: file.created_at
        }
      })
      setMusicAssets(assets)
    } catch (error) {
      console.error('Failed to load music assets', error)
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
      const { error } = await supabase.from(SUPABASE_TABLES.weddingCmsSettings).upsert({ 
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
        
        const { error: uploadError } = await supabase.storage.from('wedding-assets').upload(`cms/imported/images-siraman/${fileName}`, file, { upsert: false })
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
      const { error } = await supabase.storage.from('wedding-assets').remove([`cms/imported/images-siraman/${asset.file_name}`])
      if (error) throw error
      await loadAssets()
    } catch (error) {
      alert(`Gagal menghapus: ${error.message}`)
    }
  }

  const uploadMusicFiles = async (event) => {
    try {
      setUploading(true)
      const files = Array.from(event.target.files)
      if (!files.length) return

      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage.from('wedding-assets').upload(`cms/imported/music/${fileName}`, file, { upsert: false })
        if (uploadError) throw uploadError
      }
      await loadMusicAssets()
    } catch (error) {
      alert(`Gagal mengupload musik: ${error.message}`)
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const deleteMusicAsset = async (asset) => {
    if (!confirm('Yakin ingin menghapus musik ini?')) return
    try {
      const { error } = await supabase.storage.from('wedding-assets').remove([`cms/imported/music/${asset.file_name}`])
      if (error) throw error
      if (content.backgroundMusicUrl === asset.public_url) {
        update('backgroundMusicUrl', '')
      }
      await loadMusicAssets()
    } catch (error) {
      alert(`Gagal menghapus musik: ${error.message}`)
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
      if (mediaTarget === 'slide_2') {
        setActiveTab('cpw')
      } else if (mediaTarget === 'slide_3') {
        setActiveTab('cpp')
      } else {
        setActiveTab('latar-belakang')
      }
    }
    setView('form')
  }

  const SECTION_NAMES = {
    'ayat': 'Ayat Alkitab',
    'timeline': 'Timeline Cerita',
    'pengantar': 'Pengantar Mempelai',
    'cpw': 'Data CPW',
    'cpp': 'Data CPP',
    'acara': 'Detail Acara',
    'countdown': 'Countdown',
    'galeri': 'Galeri Foto',
    'rsvp': 'Input RSVP & Ucapan',
    'rekening': 'Rekening (Gift)',
    'thankyou': 'Pesan Penutup',
  };
  
  const SETTING_TABS = [
    { id: 'general', name: 'Umum & Tanggal' },
    { id: 'lainnya', name: 'Fitur Lainnya' },
    { id: 'latar-belakang', name: 'Latar Belakang' },
    { id: 'musik', name: 'Musik Latar' },
  ];

  const [draggedIndex, setDraggedIndex] = useState(null);
  
  const handleDragStart = (e, index) => { 
    setDraggedIndex(index); 
    e.dataTransfer.effectAllowed = "move"; 
  };
  
  const handleDragOver = (e) => { 
    e.preventDefault(); 
    e.dataTransfer.dropEffect = "move"; 
  };
  
  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const currentOrder = content?.sectionOrder || ['ayat', 'pengantar', 'cpw', 'cpp', 'acara', 'countdown', 'timeline', 'galeri', 'rsvp', 'rekening', 'thankyou'];
    const newOrder = [...currentOrder];
    const item = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, item);
    update('sectionOrder', newOrder);
    setDraggedIndex(null);
  };

  const moveSection = (fromIndex, toIndex) => {
    const currentOrder = content?.sectionOrder ? [...content.sectionOrder] : ['ayat', 'pengantar', 'cpw', 'cpp', 'acara', 'countdown', 'timeline', 'galeri', 'rsvp', 'rekening', 'thankyou'];
    if (toIndex < 0 || toIndex >= currentOrder.length) return;
    const item = currentOrder.splice(fromIndex, 1)[0];
    currentOrder.splice(toIndex, 0, item);
    update('sectionOrder', currentOrder);
  };

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

    if (activeTab === 'pengantar') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Sesi Pengantar Mempelai</strong>
            <Toggle label="Aktifkan" checked={content.sectionVisibility?.pengantar ?? true} onChange={(v) => updateNested('sectionVisibility', 'pengantar', v)} />
          </div>
          {(content.sectionVisibility?.pengantar ?? true) && (
            <div className="cms-fields-grid">
            <Field label="Judul" value={content.brideGroomTitle} onChange={(v) => update('brideGroomTitle', v)} />
            <Field label="Salam" value={content.brideGroomGreeting} onChange={(v) => update('brideGroomGreeting', v)} />
            <TextArea label="Teks Doa / Pengantar" value={content.brideGroomText} onChange={(v) => update('brideGroomText', v)} rows={3} />
            </div>
          )}
        </article>
      </div>
    )

    if (activeTab === 'cpw') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Mempelai Wanita (CPW)</strong>
            <Toggle label="Aktifkan" checked={content.sectionVisibility?.cpw ?? true} onChange={(v) => updateNested('sectionVisibility', 'cpw', v)} />
          </div>
          {(content.sectionVisibility?.cpw ?? true) && (
            <div className="cms-fields-grid">
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', background: '#ccc', border: '2px solid #ddd', flexShrink: 0 }}>
                  <img src={content.backgrounds?.slide_2 || "/foto_1_samping.jpg"} alt="CPW" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setMediaTarget('slide_2')
                      setView('media')
                    }}
                  >
                    <ImagePlus size={14} /> Ganti Foto Mempelai Wanita
                  </button>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>Foto lingkaran profil mempelai wanita</p>
                </div>
              </div>
              <Field label="Nama Lengkap" value={content.bride} onChange={(v) => update('bride', v)} />
              <Field label="Nama Panggilan" value={content.brideNickName} onChange={(v) => update('brideNickName', v)} />
              <Field label="Instagram" value={content.brideInstagram} onChange={(v) => update('brideInstagram', v)} />
              <TextArea label="Bio / Detail Orang Tua" value={content.brideBio} onChange={(v) => update('brideBio', v)} />
            </div>
          )}
        </article>
      </div>
    )

    if (activeTab === 'cpp') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Mempelai Pria (CPP)</strong>
            <Toggle label="Aktifkan" checked={content.sectionVisibility?.cpp ?? true} onChange={(v) => updateNested('sectionVisibility', 'cpp', v)} />
          </div>
          {(content.sectionVisibility?.cpp ?? true) && (
            <div className="cms-fields-grid">
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ width: '70px', height: '70px', borderRadius: '50%', overflow: 'hidden', background: '#ccc', border: '2px solid #ddd', flexShrink: 0 }}>
                  <img src={content.backgrounds?.slide_3 || "/foto_1_samping.jpg"} alt="CPP" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    style={{ padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setMediaTarget('slide_3')
                      setView('media')
                    }}
                  >
                    <ImagePlus size={14} /> Ganti Foto Mempelai Pria
                  </button>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>Foto lingkaran profil mempelai pria</p>
                </div>
              </div>
              <Field label="Nama Lengkap" value={content.groom} onChange={(v) => update('groom', v)} />
              <Field label="Nama Panggilan" value={content.groomNickName} onChange={(v) => update('groomNickName', v)} />
              <Field label="Instagram" value={content.groomInstagram} onChange={(v) => update('groomInstagram', v)} />
              <TextArea label="Bio / Detail Orang Tua" value={content.groomBio} onChange={(v) => update('groomBio', v)} />
            </div>
          )}
        </article>
      </div>
    )

    if (activeTab === 'ayat') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Ayat Alkitab / Kutipan Suci</strong>
            <Toggle label="Aktifkan" checked={content.sectionVisibility?.ayat ?? true} onChange={(v) => updateNested('sectionVisibility', 'ayat', v)} />
          </div>
          {(content.sectionVisibility?.ayat ?? true) && (
            <div className="cms-fields-grid">
            <Field label="Sumber Ayat" value={content.bibleVerse} onChange={(v) => update('bibleVerse', v)} placeholder="Misal: 1 Korintus 13:4-7" />
            <TextArea label="Isi Kutipan" value={content.bibleVerseContent} onChange={(v) => update('bibleVerseContent', v)} />
            </div>
          )}
        </article>
      </div>
    )

    if (activeTab === 'timeline') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Timeline Cerita</strong>
            <Toggle label="Aktifkan" checked={content.sectionVisibility?.timeline ?? true} onChange={(v) => updateNested('sectionVisibility', 'timeline', v)} />
          </div>
          {(content.sectionVisibility?.timeline ?? true) && (
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
          )}
        </article>
      </div>
    )

    if (activeTab === 'acara') {
      // When sameAsAkad is toggled on, auto-sync place and googleMapsLink from holyMatrimony
      const handleSameAsAkad = (checked) => {
        setSameAsAkad(checked)
        if (checked) {
          updateNested('weddingReception', 'place', content.holyMatrimony.place || '')
          updateNested('weddingReception', 'googleMapsLink', content.holyMatrimony.googleMapsLink || '')
        }
      }

      const mapsLink = sameAsAkad
        ? content.holyMatrimony.googleMapsLink
        : content.weddingReception.googleMapsLink

      return (
        <div className="cms-repeat-list">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#111827' }}>Seksi Detail Acara (Keseluruhan)</span>
            <Toggle label="Tampilkan Seksi Acara" checked={content.sectionVisibility?.acara ?? true} onChange={(v) => updateNested('sectionVisibility', 'acara', v)} />
          </div>
          <div className="cms-fields-grid mb-6">
            <Field label="Judul Utama Acara" value={content.acaraTitle} onChange={(v) => update('acaraTitle', v)} placeholder="Detail Acara" />
            <TextArea label="Teks Pengantar Acara" value={content.acaraDescription} onChange={(v) => update('acaraDescription', v)} rows={3} placeholder="Dengan segala hormat..." />
          </div>

          {/* Pengajian */}
          <article className="cms-repeat-item">
            <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Pemberkatan / Pengajian</strong>
              <Toggle label="Aktifkan" checked={content.holyMatrimony.enabled} onChange={(v) => updateNested('holyMatrimony', 'enabled', v)} />
            </div>
            {content.holyMatrimony.enabled && (
              <div className="cms-fields-grid">
                <Field label="Judul Acara 1" value={content.holyMatrimony.title} onChange={(v) => updateNested('holyMatrimony', 'title', v)} placeholder="Pengajian" />
                <Field label="Waktu" value={content.holyMatrimony.time} onChange={(v) => updateNested('holyMatrimony', 'time', v)} />
                <Field label="Nama Tempat" value={content.holyMatrimony.place} onChange={(v) => updateNested('holyMatrimony', 'place', v)} />
                <TextArea label="Alamat Detail" value={content.holyMatrimony.place_details} onChange={(v) => updateNested('holyMatrimony', 'place_details', v)} rows={2} />
                <Field label="Link Google Maps" value={content.holyMatrimony.googleMapsLink} onChange={(v) => updateNested('holyMatrimony', 'googleMapsLink', v)} />
              </div>
            )}
          </article>

          {/* Siraman Pernikahan */}
          <article className="cms-repeat-item mt-4">
            <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Siraman Pernikahan</strong>
              <Toggle label="Aktifkan" checked={content.weddingReception.enabled} onChange={(v) => updateNested('weddingReception', 'enabled', v)} />
            </div>
            {content.weddingReception.enabled && (
              <div className="cms-fields-grid">
                <Field label="Judul Acara 2" value={content.weddingReception.title} onChange={(v) => updateNested('weddingReception', 'title', v)} placeholder="Siraman" />
                <Field label="Waktu" value={content.weddingReception.time} onChange={(v) => updateNested('weddingReception', 'time', v)} />

                {/* Checkbox Samakan dengan Akad */}
                {content.holyMatrimony.enabled && (
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: sameAsAkad ? '#f0fdf4' : '#f9fafb', border: `1px solid ${sameAsAkad ? '#86efac' : '#e5e7eb'}`, borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => handleSameAsAkad(!sameAsAkad)}
                  >
                    <input
                      type="checkbox"
                      id="sameAsAkad"
                      checked={sameAsAkad}
                      onChange={(e) => handleSameAsAkad(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#22c55e' }}
                    />
                    <label htmlFor="sameAsAkad" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 500, color: sameAsAkad ? '#15803d' : '#374151', userSelect: 'none' }}>
                      Lokasi sama dengan Pengajian
                    </label>
                    {sameAsAkad && <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#16a34a' }}>✓ Terhubung otomatis</span>}
                  </div>
                )}

                {/* Nama Tempat - disabled kalau sameAsAkad */}
                <div style={{ opacity: sameAsAkad ? 0.5 : 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>Nama Tempat</label>
                  <input
                    type="text"
                    value={sameAsAkad ? content.holyMatrimony.place : content.weddingReception.place}
                    onChange={(e) => !sameAsAkad && updateNested('weddingReception', 'place', e.target.value)}
                    disabled={sameAsAkad}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', background: sameAsAkad ? '#f3f4f6' : '#fff', color: '#111827', boxSizing: 'border-box' }}
                  />
                </div>

                <TextArea label="Alamat Detail" value={content.weddingReception.place_details} onChange={(v) => updateNested('weddingReception', 'place_details', v)} rows={2} />

                {/* Link Maps - hanya tampil kalau BUKAN sameAsAkad */}
                {!sameAsAkad && (
                  <Field label="Link Google Maps" value={content.weddingReception.googleMapsLink} onChange={(v) => updateNested('weddingReception', 'googleMapsLink', v)} />
                )}

                {/* Satu tombol Maps di bawah */}
                {mapsLink && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '4px' }}>
                    <a
                      href={mapsLink}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1a73e8', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
                    >
                      🗺️ Buka Google Maps
                      {sameAsAkad && <span style={{ opacity: 0.8, fontWeight: 400 }}>(lokasi pengajian)</span>}
                    </a>
                  </div>
                )}
              </div>
            )}
          </article>
        </div>
      )
    }

    if (activeTab === 'countdown') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Countdown & Tanggal Acara</strong>
            <Toggle label="Aktifkan" checked={content.sectionVisibility?.countdown ?? true} onChange={(v) => updateNested('sectionVisibility', 'countdown', v)} />
          </div>
          {(content.sectionVisibility?.countdown ?? true) && (
            <p className="cms-helper-text" style={{ marginTop: '8px', color: '#666', fontSize: '13px' }}>Tanggal acara diatur di tab <strong>Umum &amp; Tanggal</strong>. Section ini akan otomatis menampilkan countdown dan tombol Save the Date ke Google Calendar.</p>
          )}
          <div className="cms-fields-grid" style={{ marginTop: '12px' }}>
            <Field label="Nama Pasangan (untuk Google Calendar)" value={content.coupleNames} onChange={(v) => update('coupleNames', v)} />
          </div>
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
      </div>
    )

    if (activeTab === 'rsvp') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Ucapan & Konfirmasi Kehadiran</strong>
            <div style={{ display: 'flex', gap: '20px' }}>
              <Toggle label="Tampilkan Seksi" checked={content.sectionVisibility?.rsvp ?? true} onChange={(v) => updateNested('sectionVisibility', 'rsvp', v)} />
              <Toggle label="Aktifkan Form" checked={content.rsvp.enabled} onChange={(v) => updateNested('rsvp', 'enabled', v)} />
            </div>
          </div>
          {(content.sectionVisibility?.rsvp ?? true) && content.rsvp.enabled && (
            <div className="cms-fields-grid">
              <TextArea label="Pesan Detail RSVP" value={content.rsvp.detail} onChange={(v) => updateNested('rsvp', 'detail', v)} rows={2} />
            </div>
          )}
        </article>
      </div>
    )

    if (activeTab === 'thankyou') return (
      <div className="cms-repeat-list">
        <article className="cms-repeat-item">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Penutup & Terima Kasih</strong>
            <Toggle label="Aktifkan" checked={content.sectionVisibility?.thankyou ?? true} onChange={(v) => updateNested('sectionVisibility', 'thankyou', v)} />
          </div>
          {(content.sectionVisibility?.thankyou ?? true) && (
            <div className="cms-fields-grid">
              <Field label="Judul" value={content.thankyou} onChange={(v) => update('thankyou', v)} />
              <TextArea label="Isi Pesan" value={content.thankyouDetail} onChange={(v) => update('thankyouDetail', v)} />
            </div>
          )}
        </article>
      </div>
    )

    if (activeTab === 'galeri') return (
      <div className="cms-repeat-list">
          <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#111827' }}>Seksi Galeri (Keseluruhan)</span>
            <Toggle label="Tampilkan Seksi Galeri" checked={content.sectionVisibility?.galeri ?? true} onChange={(v) => updateNested('sectionVisibility', 'galeri', v)} />
          </div>
          {(content.sectionVisibility?.galeri ?? true) && (
            <article className="cms-repeat-item">
              <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>Koleksi Foto</strong>
                <Toggle label="Aktifkan Galeri" checked={content.gallery?.enabled} onChange={(v) => updateNested('gallery', 'enabled', v)} />
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
          )}
      </div>
    )

    if (activeTab === 'rekening') return (
      <div className="cms-repeat-list">
        <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#111827' }}>Seksi Rekening (Keseluruhan)</span>
          <Toggle label="Tampilkan Seksi Rekening" checked={content.sectionVisibility?.rekening ?? true} onChange={(v) => updateNested('sectionVisibility', 'rekening', v)} />
        </div>
        {(content.sectionVisibility?.rekening ?? true) && (
          <article className="cms-repeat-item">
            <div className="cms-repeat-head" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Daftar Rekening & Hadiah</strong>
              <Toggle label="Aktifkan Rekening" checked={content.gifts?.enabled} onChange={(v) => updateNested('gifts', 'enabled', v)} />
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
        )}
      </div>
    )
    if (activeTab === 'latar-belakang') {
      const bgSections = [
        { key: 'slide_8', label: 'Background Utama Undangan (Global Background)', desc: 'Latar belakang utama bertekstur yang tampil di seluruh bagian undangan dengan overlay gelap.' },
        { key: 'bg_welcome', label: 'Latar Halaman Pembuka / Cover', desc: 'Gambar latar belakang khusus saat pertama kali undangan dibuka (sebelum tombol Buka Undangan diklik).' },
        { key: 'bg_sidebar', label: 'Latar Sisi Kiri Desktop (Sidebar)', desc: 'Gambar statis besar yang muncul di sebelah kiri pada layar monitor / desktop.' },
      ]

      return (
        <div className="cms-repeat-list">
          <div className="cms-block-title mb-4">
            <h3>Pilih Latar Belakang Undangan</h3>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
              Undangan kini menggunakan sistem 1 latar belakang utama yang konsisten dan elegan agar tidak belang-belang atau acak-acakan.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {bgSections.map((sec) => (
              <div key={sec.key} style={{ border: '1px solid #eee', padding: '16px', borderRadius: '8px', background: '#fafafa' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>{sec.label}</p>
                {sec.desc && <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#666', lineHeight: 1.4 }}>{sec.desc}</p>}
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

    if (activeTab === 'musik') {
      return (
        <div className="cms-repeat-list">
          <article className="cms-repeat-item">
            <div className="cms-repeat-head">
              <strong>Pilih Musik Latar</strong>
              <label className="btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '4px', background: '#000', color: '#fff', fontSize: '14px' }}>
                <Upload size={14} />
                {uploading ? 'Mengupload...' : 'Upload Musik'}
                <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={uploadMusicFiles} disabled={uploading} />
              </label>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {musicAssets.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>Belum ada musik yang diunggah.</p>
              ) : (
                musicAssets.map((music) => {
                  const isSelected = content.backgroundMusicUrl === music.public_url;
                  return (
                    <div key={music.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: isSelected ? '#f0fdf4' : '#f9fafb', border: `1px solid ${isSelected ? '#22c55e' : '#e5e7eb'}`, borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: '20px' }}>🎵</span>
                        </div>
                        <div>
                          <strong style={{ display: 'block', color: '#111827' }}>{music.file_name}</strong>
                          <audio src={music.public_url} controls style={{ height: '30px', marginTop: '8px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          onClick={() => update('backgroundMusicUrl', music.public_url)}
                          style={{ padding: '8px 16px', background: isSelected ? '#22c55e' : '#000', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}
                        >
                          {isSelected ? <><Check size={16} /> Terpilih</> : 'Pilih'}
                        </button>
                        <button 
                          onClick={() => deleteMusicAsset(music)}
                          style={{ padding: '8px', background: '#fee', color: '#e00', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                          title="Hapus Musik"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {content.backgroundMusicUrl && (
              <button 
                onClick={() => update('backgroundMusicUrl', '')}
                style={{ marginTop: '16px', padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <Trash2 size={16} /> Hapus Musik Terpilih
              </button>
            )}
          </article>
        </div>
      )
    }

    return null
  }

  useEffect(() => {
    if (activeTab === 'galeri' || activeTab === 'latar-belakang') {
      // Actually we just use `media` view for images now, but if we need, we can trigger it.
      // We will trigger loadMusicAssets for 'musik' tab.
    }
    if (activeTab === 'musik') {
      void loadMusicAssets()
    }
  }, [activeTab])

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
              {(content?.sectionOrder || ['ayat', 'pengantar', 'cpw', 'cpp', 'acara', 'countdown', 'timeline', 'galeri', 'rsvp', 'rekening', 'thankyou']).map((tabId, index) => (
                <button 
                  type="button" 
                  key={tabId} 
                  data-active={tabId === activeTab} 
                  onClick={() => setActiveTab(tabId)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: draggedIndex === index ? 0.5 : 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="cms-section-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="cms-section-name">
                      <strong>{SECTION_NAMES[tabId]}</strong>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span 
                      role="button"
                      title="Pindah ke atas"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (index > 0) moveSection(index, index - 1);
                      }}
                      style={{ cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.2 : 0.7, padding: '2px', display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronUp size={14} />
                    </span>
                    <span 
                      role="button"
                      title="Pindah ke bawah"
                      onClick={(e) => {
                        e.stopPropagation();
                        const listLen = (content?.sectionOrder || []).length || 11;
                        if (index < listLen - 1) moveSection(index, index + 1);
                      }}
                      style={{ cursor: index === ((content?.sectionOrder || []).length || 11) - 1 ? 'default' : 'pointer', opacity: index === ((content?.sectionOrder || []).length || 11) - 1 ? 0.2 : 0.7, padding: '2px', display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronDown size={14} />
                    </span>
                    <GripVertical size={14} style={{ color: '#aaa', cursor: 'grab', marginLeft: '4px' }} />
                  </div>
                </button>
              ))}
              
              <hr style={{ margin: '15px 0', border: 'none', borderTop: '1px dashed #ccc' }} />
              
              {SETTING_TABS.map((tab) => (
                <button 
                  type="button" 
                  key={tab.id} 
                  data-active={tab.id === activeTab} 
                  onClick={() => setActiveTab(tab.id)}
                  style={{ display: 'block', textAlign: 'left' }}
                >
                  <span className="cms-section-name" style={{ display: 'inline-block', width: '100%' }}>
                    <strong>{tab.name}</strong>
                  </span>
                </button>
              ))}
            </aside>
            
            <section className="cms-editor-panel">
              <div className="cms-editor-heading">
                <div>
                  <span>PENGATURAN KONTEN</span>
                  <h2>{SECTION_NAMES[activeTab] || SETTING_TABS.find(t => t.id === activeTab)?.name}</h2>
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
