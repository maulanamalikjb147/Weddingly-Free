"use client";

import { useState, useRef, useEffect } from "react";

export default function MusicPlayer({ src, isInvitationOpen }: { src: string; isInvitationOpen: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-play when invitation opens
  useEffect(() => {
    if (isInvitationOpen && audioRef.current && src) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error("Autoplay prevented:", e);
      });
    }
  }, [isInvitationOpen, src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!src) return null;

  return (
    <>
      <audio ref={audioRef} src={src} preload="auto" loop />
      <div 
        className="fixed bottom-4 right-4 z-50 cursor-pointer p-2 bg-black/30 rounded-full backdrop-blur-sm"
        onClick={togglePlay}
      >
        <div 
          className={`w-12 h-12 rounded-full border-2 border-[#333] flex items-center justify-center bg-black relative shadow-lg ${isPlaying ? "animate-[spin_4s_linear_infinite]" : ""}`}
        >
          {/* Vinyl grooves */}
          <div className="absolute w-10 h-10 rounded-full border border-[#222]" />
          <div className="absolute w-8 h-8 rounded-full border border-[#222]" />
          <div className="absolute w-6 h-6 rounded-full border border-[#222]" />
          
          {/* Center label */}
          <div className="w-3 h-3 bg-red-800 rounded-full z-10 flex items-center justify-center">
            {/* Spindle hole */}
            <div className="w-1 h-1 bg-black rounded-full" />
          </div>
        </div>
      </div>
    </>
  );
}
