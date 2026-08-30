"use client"

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from './supabaseClient'
import Icon from './Icon'

function Scanner() {
  const [scanning, setScanning] = useState(false)
  const [welcomeData, setWelcomeData] = useState(null)
  const [error, setError] = useState(null)
  const html5QrCodeRef = useRef(null)

  const startScanner = async () => {
    try {
      setScanning(true)
      setError(null)
      
      html5QrCodeRef.current = new Html5Qrcode("qr-reader")
      
      await html5QrCodeRef.current.start(
        { 
          facingMode: "environment",
          aspectRatio: 1.0
        },
        {
          fps: 30,
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            let minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            let qrboxSize = Math.floor(minEdge * 0.8);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: {
            advanced: [{ zoom: 1.0 }]
          }
        },
        onScanSuccess,
        onScanError
      )
    } catch (err) {
      console.error("Failed to start scanner:", err)
      setError("Gagal memulai scanner. Pastikan kamera diizinkan.")
      setScanning(false)
    }
  }

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.error("Error stopping scanner:", err)
      }
    }
    setScanning(false)
  }

  const onScanSuccess = async (decodedText) => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.pause()
      }
      
      const guestData = JSON.parse(decodedText)
      const { id, nama_tamu, alamat_tamu } = guestData

      const { error: updateError } = await supabase
        .from('data_tamu')
        .update({ 
          hadir: true, 
          checkin: new Date().toISOString(),
          signed_by: 'USER'
        })
        .eq('id', id)

      if (updateError) {
        throw updateError
      }

      setWelcomeData({
        nama: nama_tamu,
        alamat: alamat_tamu
      })

      setTimeout(() => {
        setWelcomeData(null)
        if (html5QrCodeRef.current && scanning) {
          html5QrCodeRef.current.resume()
        }
      }, 5000)
    } catch (err) {
      console.error("Error processing QR code:", err)
      setError("QR code tidak valid atau terjadi kesalahan")
      setTimeout(() => {
        setError(null)
        if (html5QrCodeRef.current && scanning) {
          html5QrCodeRef.current.resume()
        }
      }, 3000)
    }
  }

  const onScanError = () => {
    // Ignore continuous scan errors
  }

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        stopScanner()
      }
    }
  }, [])

  return (
    <div className="product-tile-parchment" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      padding: 'var(--spacing-lg)',
      background: 'var(--color-canvas-parchment)'
    }}>
      <div style={{ 
        maxWidth: '480px', 
        width: '100%', 
        textAlign: 'center' 
      }}>
        {/* Logo / Brand */}
        <div style={{ marginBottom: 'var(--spacing-xxl)' }}>
          <div style={{ 
            marginBottom: 'var(--spacing-md)',
            color: 'var(--color-ink)'
          }}>
            <Icon name="rings" size={56} />
          </div>
          <h1 className="text-display-lg" style={{ 
            color: 'var(--color-ink)',
            marginBottom: 'var(--spacing-sm)'
          }}>
            Wedding Check-in
          </h1>
          <p className="text-body" style={{ 
            color: 'var(--color-ink-muted-48)',
            maxWidth: '320px',
            margin: '0 auto'
          }}>
            Scan QR code untuk check-in tamu undangan
          </p>
        </div>

        {/* Scanner Area */}
        <div style={{ 
          marginBottom: 'var(--spacing-lg)',
          position: 'relative'
        }}>
          <div id="qr-reader" style={{ 
            borderRadius: 'var(--rounded-lg)', 
            overflow: 'hidden',
            display: scanning ? 'block' : 'none',
            border: '1px solid var(--color-hairline)',
            background: 'var(--color-canvas)'
          }}></div>

          {scanning && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-xs)',
              padding: 'var(--spacing-sm)',
              marginTop: 'var(--spacing-sm)',
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: 1.43,
              letterSpacing: '-0.224px'
            }}>
              <span style={{ 
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: 'var(--rounded-full)',
                background: 'var(--color-primary)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}></span>
              Arahkan kamera ke QR code
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!scanning && !welcomeData && (
          <button 
            className="btn-primary" 
            onClick={startScanner}
            style={{ 
              width: '100%', 
              padding: '14px 28px',
              fontSize: '18px',
              fontWeight: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-xs)'
            }}
          >
            <Icon name="camera" size={20} />
            Mulai Scan QR Code
          </button>
        )}

        {scanning && (
          <button 
            className="btn-secondary" 
            onClick={stopScanner}
            style={{ 
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--spacing-xs)'
            }}
          >
            <Icon name="x" size={18} />
            Berhenti Scan
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="toast toast-error" style={{ 
            marginTop: 'var(--spacing-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)'
          }}>
            <Icon name="alertCircle" size={16} />
            {error}
          </div>
        )}

        {/* Footer */}
        <p className="text-fine-print" style={{ 
          color: 'var(--color-ink-muted-48)',
          marginTop: 'var(--spacing-xxl)'
        }}>
          Pastikan kamera diizinkan untuk menggunakan scanner
        </p>
      </div>

      {/* Welcome Modal */}
      {welcomeData && (
        <div className="modal-overlay" onClick={() => {
          setWelcomeData(null)
          if (html5QrCodeRef.current && scanning) {
            html5QrCodeRef.current.resume()
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ 
            textAlign: 'center',
            padding: 'var(--spacing-xxl) var(--spacing-xl)'
          }}>
            {/* Success Icon */}
            <div style={{ 
              width: '64px',
              height: '64px',
              borderRadius: 'var(--rounded-full)',
              background: '#d4edda',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--spacing-lg)',
              color: '#155724'
            }}>
              <Icon name="checkCircle" size={32} />
            </div>

            <h2 className="text-tagline" style={{ 
              color: 'var(--color-ink)',
              marginBottom: 'var(--spacing-xs)'
            }}>
              Welcome!
            </h2>

            <h3 className="text-display-md" style={{ 
              color: 'var(--color-ink)',
              marginBottom: 'var(--spacing-sm)',
              fontSize: '28px'
            }}>
              {welcomeData.nama}
            </h3>

            <p className="text-caption" style={{ 
              color: 'var(--color-ink-muted-48)',
              marginBottom: 'var(--spacing-xl)'
            }}>
              {welcomeData.alamat}
            </p>

            <div style={{ 
              background: 'var(--color-canvas-parchment)',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderRadius: 'var(--rounded-sm)',
              marginBottom: 'var(--spacing-xl)'
            }}>
              <p className="text-body-strong" style={{ color: 'var(--color-ink)' }}>
                Enjoy with our wedding!
              </p>
            </div>

            <button 
              className="btn-primary" 
              onClick={() => {
                setWelcomeData(null)
                if (html5QrCodeRef.current && scanning) {
                  html5QrCodeRef.current.resume()
                }
              }}
              style={{ width: '100%' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}

export default Scanner
