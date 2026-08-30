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
    setQrOpen(true);
  };

  return (
    <div className="h-screen relative overflow-hidden">
      <ScreenStart config={config} isRoot={slug === ""} />
      {showContent && <MainContent name={name} config={config} onOpenInvitation={handleOpenInvitation} />}
      
      {guest && (
        <QrPrelude 
          guest={guest} 
          open={qrOpen} 
          onContinue={() => {
            setQrOpen(false);
          }} 
        />
      )}
    </div>
  );
}
