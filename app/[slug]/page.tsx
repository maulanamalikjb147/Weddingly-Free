"use client";

import { useEffect, useState } from "react";
import ScreenStart from "../components/ScreenStart";
import MainContent from "../components/MainContent";
import { QrPrelude } from "../components/QrPrelude";
import { getWeddingGuest, type WeddingGuest } from "@/lib/guest";

type ParamsProps = {
  params: { slug: string };
};

export default function Home({ params: { slug } }: ParamsProps) {
  const [showContent, setShowContent] = useState(false);
  const [guest, setGuest] = useState<WeddingGuest | null>(null);
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

    // Attempt to fetch from Supabase
    getWeddingGuest(decodeURIComponent(slug)).then((fetchedGuest) => {
      if (fetchedGuest) {
        setGuest(fetchedGuest);
        setName(fetchedGuest.name);
      } else {
        // Fallback to mock guest for QR if not found but we have a name
        setGuest({
          id: `mock-${Date.now()}`,
          name: extractedName,
          address: "-",
          slug: decodeURIComponent(slug),
        });
      }
    });

    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 7000);

    return () => clearTimeout(contentTimer);
  }, [slug]);

  const handleOpenInvitation = () => {
    setQrOpen(true);
  };

  return (
    <div className="h-screen relative overflow-hidden">
      <ScreenStart />
      {showContent && <MainContent name={name} onOpenInvitation={handleOpenInvitation} />}
      
      {guest && (
        <QrPrelude 
          guest={guest} 
          open={qrOpen} 
          onContinue={() => {
            setQrOpen(false);
            // Optional: Scroll to top or specific section
          }} 
        />
      )}
    </div>
  );
}

