import type { Metadata } from "next";
import { Ovo } from "@next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const legan = localFont({
  src: "./fonts/Legan.woff",
  variable: "--font-legan",
  weight: "100 900",
});

const thesignature = localFont({
  src: "./fonts/Thesignature.ttf",
  variable: "--font-thesignature",
  weight: "100 900",
});

const wonder = localFont({
  src: "./fonts/Wonder.woff",
  variable: "--font-wonder",
  weight: "100 900",
});

const ovo = Ovo({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-ovo",
});


import { fetchConfig } from "@/lib/config";

const invitationBaseUrl = (process.env.NEXT_PUBLIC_INVITATION_BASE_URL || "https://anisa.maulanamalik.my.id").replace(/\/$/, "");
const faviconUrl = "https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/favico.png";

const absoluteUrl = (value: string) => {
  try {
    return new URL(value, `${invitationBaseUrl}/`).toString();
  } catch {
    return `${invitationBaseUrl}/foto_1_samping.jpg`;
  }
};

const metadataVersion = (value: string) => {
  let hash = 0;
  for (const character of value) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  return Math.abs(hash).toString(36);
};

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchConfig();
  const title = `The Wedding of ${config.coupleNames}`;
  const description = `Wedding Invitation of ${config.coupleNames}`;
  const previewImage = absoluteUrl(config.backgrounds?.bg_bride_groom || "/foto_1_samping.jpg");
  const socialPreviewImage = `${invitationBaseUrl}/api/og?v=${metadataVersion(`${previewImage}:${title}`)}`;

  return {
    metadataBase: new URL(invitationBaseUrl),
    title,
    description,
    icons: {
      icon: [{ url: faviconUrl, type: "image/png" }],
      shortcut: [{ url: faviconUrl, type: "image/png" }],
      apple: [{ url: faviconUrl, type: "image/png" }],
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: invitationBaseUrl,
      siteName: title,
      title,
      description,
      images: [{
        url: socialPreviewImage,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: config.coupleNames,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialPreviewImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`bg-[#0a0a0a]  ${ovo.variable} ${thesignature.variable} ${wonder.variable} ${legan.variable}  antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
