"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Download, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { WeddingGuest } from "@/lib/guest";

export function QrPrelude({
  guest,
  open,
  onContinue,
}: {
  guest: WeddingGuest;
  open: boolean;
  onContinue: () => void;
}) {
  const [qrCode, setQrCode] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(JSON.stringify({
      id: guest.id,
      nama_tamu: guest.name,
      alamat_tamu: guest.address,
    }), {
      width: 720,
      margin: 2,
      color: { dark: "#131410", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then((value) => {
      if (active) setQrCode(value);
    });

    return () => { active = false; };
  }, [guest]);

  const saveQr = () => {
    if (!qrCode) return;
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `qr-checkin-${guest.slug}.png`;
    link.click();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="invitation-panel-overlay fixed inset-0 z-[1000] h-screen h-[100dvh] max-h-[100dvh] overflow-hidden bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: .65 }}
          role="dialog"
          aria-modal="true"
          aria-label="QR check-in tamu"
        >
          <Image
            src="/slide_1.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover object-[50%_54%] opacity-30 blur-xl"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,.1),rgba(0,0,0,.9)_72%)]" />

          <div className="relative z-10 flex h-full min-h-0 items-center justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-center">
            <motion.div
              className="flex max-h-full w-full max-w-sm flex-col items-center overflow-hidden rounded-xl border border-white/20 bg-black/80 px-[clamp(1rem,4vw,1.5rem)] py-[clamp(0.75rem,2dvh,1.75rem)] shadow-2xl shadow-black backdrop-blur-md"
              initial={{ y: 28, opacity: 0, scale: .96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: .12, duration: .65 }}
            >
              <div className="font-legan flex shrink-0 items-center justify-center gap-3 text-[clamp(0.625rem,1.5dvh,0.75rem)] uppercase tracking-widest text-white/80">
                <span className="h-px w-8 bg-white/40" /> Check-in <span className="h-px w-8 bg-white/40" />
              </div>
              <h1 className="font-ovo mt-[clamp(0.35rem,1.2dvh,1rem)] shrink-0 text-[clamp(1.5rem,4dvh,1.875rem)] leading-tight text-white">Simpan QR Tamu</h1>
              <p className="font-legan mt-[clamp(0.25rem,0.8dvh,0.5rem)] max-w-xs shrink-0 text-[clamp(0.7rem,1.8dvh,0.875rem)] leading-snug text-[#CCCCCC]">Tunjukkan QR ini kepada petugas saat tiba di lokasi.</p>

              <div className="mx-auto my-[clamp(0.6rem,1.8dvh,1.5rem)] flex aspect-square w-[min(68vw,32dvh,270px)] shrink-0 items-center justify-center rounded-lg bg-white p-[clamp(0.4rem,1.4dvh,0.75rem)] shadow-lg">
                {qrCode ? (
                  <Image src={qrCode} alt={`QR check-in ${guest.name}`} width={720} height={720} unoptimized className="h-full w-full" />
                ) : (
                  <QrCode className="h-16 w-16 animate-pulse text-black" />
                )}
              </div>

              <p className="font-ovo w-full shrink-0 truncate text-[clamp(1.2rem,3dvh,1.5rem)] leading-tight text-white">{guest.name}</p>
              {guest.address && <p className="font-legan mt-[clamp(0.1rem,0.4dvh,0.25rem)] w-full shrink-0 truncate text-[clamp(0.625rem,1.5dvh,0.75rem)] text-[#CCCCCC]">{guest.address}</p>}

              <button
                type="button"
                onClick={saveQr}
                disabled={!qrCode}
                className="font-legan mt-[clamp(0.5rem,1.4dvh,1.5rem)] inline-flex min-h-[clamp(2.25rem,5dvh,2.75rem)] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white px-4 text-[clamp(0.6rem,1.5dvh,0.75rem)] font-semibold uppercase tracking-widest text-white transition hover:bg-white/10 disabled:opacity-40"
              >
                <Download size={16} /> Save QR untuk check-in
              </button>
              <button
                type="button"
                onClick={onContinue}
                className="font-legan mt-[clamp(0.4rem,1dvh,0.75rem)] min-h-[clamp(2.25rem,5dvh,2.75rem)] w-full shrink-0 whitespace-nowrap rounded-full bg-white px-4 text-[clamp(0.6rem,1.5dvh,0.75rem)] font-semibold uppercase tracking-widest text-black transition hover:bg-gray-200"
              >
                Tap untuk lanjut <span aria-hidden="true">→</span>
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
