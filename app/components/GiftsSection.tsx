"use client";

import { useInView } from "react-intersection-observer";
import type { WeddingConfig } from "@/lib/config";
import { Copy, Check, Wifi } from "lucide-react";
import { useState } from "react";

type Props = {
  config: WeddingConfig;
};

export default function GiftsSection({ config }: Props) {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!config.gifts || !config.gifts.enabled || !config.gifts.accounts || config.gifts.accounts.length === 0) {
    return null;
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div
      className="snap-start text-white min-h-screen flex flex-col justify-center py-16 px-8 relative"
      style={{
        backgroundImage: `url(${config.backgrounds?.bg_gifts || "/slide_8.jpg"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>
      <div
        ref={ref}
        className={`${inView ? "active" : ""} fadeInMove w-full max-w-md mx-auto flex flex-col items-center relative z-10`}
      >
        <h1 className="text-3xl text-white font-ovo text-center uppercase mb-4">
          Wedding Gift
        </h1>
        <p className="text-sm font-legan text-white/90 text-center mb-8 drop-shadow-md">
          Tanpa mengurangi rasa hormat, bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih dapat melalui:
        </p>
        
        <div className="w-full space-y-6 flex flex-col items-center">
          {config.gifts.accounts.map((account, index) => (
            <div 
              key={index} 
              className="relative w-full max-w-[340px] aspect-[1.586/1] rounded-2xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #2a2a2a 0%, #111 100%)",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              {/* Glossy overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-30 pointer-events-none"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="font-ovo text-2xl font-bold tracking-widest text-white/90 drop-shadow-md">
                  {account.bank}
                </div>
                <div className="text-white/70">
                  <Wifi size={28} className="rotate-90" />
                </div>
              </div>
              
              <div className="relative z-10 space-y-4">
                <div className="w-10 h-8 rounded-md shadow-inner relative overflow-hidden flex items-center justify-center border border-black/10" style={{ background: "linear-gradient(135deg, #ebd197 0%, #d4a74a 50%, #b48834 100%)" }}>
                  <svg viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 opacity-40 mix-blend-multiply">
                    <path d="M12 0V32M28 0V32" stroke="#4A3410" strokeWidth="1" />
                    <path d="M0 10H12M28 10H40" stroke="#4A3410" strokeWidth="1" />
                    <path d="M0 22H12M28 22H40" stroke="#4A3410" strokeWidth="1" />
                    <rect x="14" y="10" width="12" height="12" rx="3" stroke="#4A3410" strokeWidth="1" />
                  </svg>
                </div>
                <div className="font-mono text-xl tracking-[0.12em] text-white/90 drop-shadow-md">
                  {account.number}
                </div>
              </div>
              
              <div className="flex justify-between items-end relative z-10">
                <div className="text-sm font-legan text-white/70 uppercase truncate max-w-[150px]">
                  {account.owner}
                </div>
                <div className="flex gap-1 items-center">
                  <button
                    onClick={() => handleCopy(account.number, index)}
                    className="flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95"
                  >
                    {copiedIndex === index ? (
                      <><Check size={14} className="mr-1 text-green-400" /> Disalin</>
                    ) : (
                      <><Copy size={14} className="mr-1" /> Copy</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
