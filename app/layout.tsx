import type { Metadata } from "next";
import { Ovo, Andika, Dancing_Script, Courgette, Noto_Naskh_Arabic } from "next/font/google";
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

const andika = Andika({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-andika",
});

const dancingScript = Dancing_Script({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-dancing-script",
});

const courgette = Courgette({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-courgette",
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  weight: ["400", "700"],
  subsets: ["arabic"],
  variable: "--font-noto-naskh-arabic",
});

import { fetchConfig } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchConfig();
  return {
    title: `The Wedding of ${config.coupleNames}`,
    description: `Wedding Invitation of ${config.coupleNames}, made by Peter Shaan`,
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
        className={`bg-[#0a0a0a]  ${ovo.variable} ${thesignature.variable} ${wonder.variable} ${legan.variable} ${andika.variable} ${dancingScript.variable} ${courgette.variable} ${notoNaskhArabic.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
