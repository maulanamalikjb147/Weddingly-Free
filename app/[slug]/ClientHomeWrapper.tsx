"use client";

import { useEffect, useState } from "react";
import ScreenStart from "../components/ScreenStart";
import MainContent from "../components/MainContent";
import { QrPrelude } from "../components/QrPrelude";
import type { WeddingGuest } from "@/lib/guest";
import type { WeddingConfig } from "@/lib/config";

type ClientHomeWrapperProps = {
  slug: string;
  guest: WeddingGuest | null;
  config: WeddingConfig;
};

export default function ClientHomeWrapper({ slug, guest: initialGuest, config }: ClientHomeWrapperProps) {
  const [showContent, setShowContent] = useState(false);
  const [guest, setGuest] = useState<WeddingGuest | null>(initialGuest);
  const [name, setName] = useState<string>("");
  const [qrOpen, setQrOpen] = useState(false);
  const [isProceeded, setIsProceeded] = useState(false);

  useEffect(() => {
    let extractedName = "";
    if (slug.startsWith("to%3A") || slug.startsWith("to:")) {
      extractedName = decodeURIComponent(slug.startsWith("to%3A") ? slug.slice(5) : slug.slice(3)).replace(
        /%20/g,
        " "
      );
      setName(extractedName);
    } else {
      extractedName = decodeURIComponent(slug).replace(/%20/g, " ");
      setName(extractedName);
    }

    if (initialGuest) {
        setName(initialGuest.name);
    } else {
        // Fallback to mock guest for QR if not found but we have a name
        setGuest({
          id: `mock-${Date.now()}`,
          name: extractedName,
          address: "-",
          slug: decodeURIComponent(slug),
        });
    }

    if (slug !== "") {
      const contentTimer = setTimeout(() => {
        setShowContent(true);
      }, 7000);
      return () => clearTimeout(contentTimer);
    }
  }, [slug, initialGuest]);

  const handleOpenInvitation = () => {
    if (process.env.NEXT_PUBLIC_QR_CODE === 'false') {
      setIsProceeded(true);
    } else {
      setQrOpen(true);
    }
  };

  const isRoot = slug === "";

  return (
    <div className="flex w-full h-screen overflow-hidden bg-black text-white font-sans">
      {/* Desktop mode - Static Background (Left side) */}
      <div className="hidden lg:block lg:w-7/12 xl:w-8/12 2xl:w-9/12 h-screen relative overflow-hidden m-0 p-0">
        <img 
          src={config.backgrounds?.bg_sidebar || "/foto_1_samping.jpg"} 
          alt="background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Smartphone mode - Scrollable Content (Right side on Desktop, Full on Mobile) */}
      <div className="w-full lg:w-5/12 xl:w-4/12 2xl:w-3/12 h-screen overflow-y-auto m-0 p-0 relative bg-black shadow-2xl overflow-x-hidden">
        <ScreenStart config={config} isRoot={isRoot} />
        {showContent && <MainContent name={name} config={config} onOpenInvitation={handleOpenInvitation} isProceeded={isProceeded} isRoot={isRoot} />}
        
        {guest && (
          <QrPrelude 
            guest={guest} 
            open={qrOpen} 
            onContinue={() => {
              setQrOpen(false);
              setIsProceeded(true);
            }} 
          />
        )}
      </div>
    </div>
  );
}
