"use client";

import { useState, useEffect, Fragment } from "react";
import { FaInstagram, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";
import Link from "next/link";
import CountdownTimer from "./Countdown";
import Form from "./Form";
import WishesList from "./WishesList";
import GallerySection from "./GallerySection";
import GiftsSection from "./GiftsSection";
import type { WeddingConfig } from "@/lib/config";
import MusicPlayer from "./MusicPlayer";
import WaveSeparator from "./WaveSeparator";

type WeddingScreenProps = {
  name?: string;
  config: WeddingConfig;
  onOpenInvitation?: () => void;
  isProceeded?: boolean;
  isRoot?: boolean;
};

export default function WeddingScreen({ name, config, onOpenInvitation, isProceeded = false, isRoot = false }: WeddingScreenProps) {
  const [fadeClass, setFadeClass] = useState("opacity-0");
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeClass("opacity-100");
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    if (onOpenInvitation) {
      onOpenInvitation();
    }
  };

  const allSections = config.sectionOrder || ['ayat', 'pengantar', 'cpw', 'cpp', 'acara', 'countdown', 'timeline', 'galeri', 'rsvp', 'rekening', 'thankyou'];
  const sections = allSections.filter(sectionKey => {
    const isVisible = config.sectionVisibility?.[sectionKey as keyof typeof config.sectionVisibility] ?? true;
    if (!isVisible) return false;
    if (sectionKey === 'galeri' && (!config.gallery?.enabled || !config.gallery?.photos?.length)) return false;
    if (sectionKey === 'rekening' && (!config.gifts?.enabled || !config.gifts?.accounts?.length)) return false;
    if (sectionKey === 'rsvp' && config.rsvp?.enabled === false) return false;
    if (sectionKey === 'timeline') {
      const hasTimeline = Boolean(config.timeline_1 || config.timeline_2 || config.timeline_3 || config.timeline_4);
      if (!hasTimeline) return false;
    }
    return true;
  });
  const globalBg = config.backgrounds?.slide_8 || config.backgrounds?.bg_gifts || config.backgrounds?.bg_welcome || "/slide_8.jpg";

  return (
    <div className={`w-full ${fadeClass} transition-opacity duration-1000 relative text-white`}>
      {/* GLOBAL FIXED BACKGROUND LAYER */}
      <div className="fixed top-0 bottom-0 right-0 w-full lg:w-5/12 xl:w-4/12 2xl:w-3/12 pointer-events-none z-0 overflow-hidden">
        <img 
          src={globalBg} 
          alt="Global Background" 
          className="w-full h-full object-cover" 
        />
        {/* Dark overlay for optimal text contrast and rich ambient texture */}
        <div className="absolute inset-0 bg-black/80" />
      </div>

      <div className="relative z-10 w-full">
        {/* BERANDA - ALWAYS FIRST AND STATIC */}
        <div id="beranda" className="relative overflow-hidden w-full min-h-screen flex flex-col items-center justify-center pt-10 pb-10">
          <img 
            src={config.backgrounds?.bg_welcome || "/foto_2.jpg"} 
            alt="background" 
            className="absolute opacity-25 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover" 
            style={{ maskImage: "linear-gradient(0.5turn, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(0.5turn, transparent, black 10%, black 90%, transparent)" }}
          />
          <div className="relative text-center p-2 z-10 w-full">
            <h1 className="font-dancingscript my-4 pt-2 font-medium text-4xl">
              Siraman dan pengajian
            </h1>
            <img 
              src={config.gallery?.photos?.[0]?.src || "/foto_1_samping.jpg"} 
              alt="couple" 
              className="w-52 h-52 object-cover rounded-full border-4 border-white/80 shadow-lg my-4 mx-auto" 
            />
            <h2 className="font-dancingscript my-4 text-4xl">{config.coupleNames}</h2>
            <p className="my-2 text-xl">
              {new Date(config.eventDate).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="mt-8">
              <p className="mb-4 text-sm font-andika tracking-widest text-white/80">
                {isProceeded ? '#roMAnSAsatuhati' : `Dear, ${name || 'Tamu Undangan'}`}
              </p>
              {!isOpen ? (
                <button
                  className="animate-bounce mt-2 px-6 py-2 text-sm border border-white hover:text-black hover:bg-white rounded-full bg-transparent text-white transition"
                  onClick={handleOpen}
                >
                  Buka Undangan
                </button>
              ) : (
                <div className="flex justify-center items-center mt-6 mb-2 flex-col">
                  <div className="animate-bounce border-2 border-white/50 rounded-full px-2 py-1 h-8 w-5 flex justify-center items-start">
                    <div className="bg-white/50 w-1 h-2 rounded-full"></div>
                  </div>
                  <p className="m-0 mt-2 p-0 text-white/50 text-sm">Gulir ke Bawah</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="w-full">
            {sections.map((sectionKey, index) => {
              const isFullScreenSection = sectionKey === 'galeri' || sectionKey === 'rekening';
              return (
                <Fragment key={sectionKey}>
                  <section 
                    id={sectionKey} 
                    className={`${isFullScreenSection ? 'w-full' : 'py-12 w-full flex flex-col items-center justify-center'}`}
                  >
                  
                  {sectionKey === 'pengantar' && (
                    <div className="px-6 text-center w-full max-w-lg">
                      <h2 className="font-notonaskh py-4 text-3xl">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</h2>
                      <h2 className="font-courgette py-4 text-xl">{config.brideGroomGreeting}</h2>
                      <p className="pb-4 text-sm text-white/80 leading-relaxed">
                        {config.brideGroomText}
                      </p>
                    </div>
                  )}

                  {sectionKey === 'cpw' && (
                    <div className="px-6 text-center w-full max-w-lg">
                      <p className="font-dancingscript text-2xl text-white/50 mb-2">The Bride</p>
                      <img src={config.backgrounds?.slide_2 || "/foto_1_samping.jpg"} alt="Bride" className="w-48 h-48 object-cover rounded-full border-4 border-white/80 shadow-lg my-4 mx-auto" />
                      <h2 className="font-dancingscript text-4xl mt-2">{config.bride}</h2>
                      <p className="mt-3 text-lg font-andika text-white/90">Putri Pertama</p>
                      <p className="text-sm text-white/70 whitespace-pre-line mt-2">{config.brideBio}</p>
                      <Link
                        href={`https://www.instagram.com/${config.brideInstagram}`}
                        target="_blank"
                        className="inline-flex items-center gap-x-2 text-xs mt-4 bg-white/10 border border-white/20 px-4 py-2 rounded-full hover:bg-white hover:text-black transition"
                      >
                        <FaInstagram /> {config.brideInstagram}
                      </Link>
                    </div>
                  )}

                  {sectionKey === 'cpp' && (
                    <div className="px-6 text-center w-full max-w-lg">
                      <p className="font-dancingscript text-2xl text-white/50 mb-2">The Groom</p>
                      <img src={config.backgrounds?.slide_3 || "/foto_1_samping.jpg"} alt="Groom" className="w-48 h-48 object-cover rounded-full border-4 border-white/80 shadow-lg my-4 mx-auto" />
                      <h2 className="font-dancingscript text-4xl mt-2">{config.groom}</h2>
                      <p className="mt-3 text-lg font-andika text-white/90">Putra Pertama</p>
                      <p className="text-sm text-white/70 whitespace-pre-line mt-2">{config.groomBio}</p>
                      <Link
                        href={`https://www.instagram.com/${config.groomInstagram}`}
                        target="_blank"
                        className="inline-flex items-center gap-x-2 text-xs mt-4 bg-white/10 border border-white/20 px-4 py-2 rounded-full hover:bg-white hover:text-black transition"
                      >
                        <FaInstagram /> {config.groomInstagram}
                      </Link>
                    </div>
                  )}

                  {sectionKey === 'ayat' && (
                    <div className="px-6 text-center w-full max-w-lg">
                      <h2 className="font-dancingscript py-2 text-4xl mb-4">Firman Allah SWT</h2>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-lg">
                        <p className="text-sm mb-4 leading-relaxed text-white/90">{config.bibleVerseContent}</p>
                        <span className="text-sm font-bold text-white/70">{config.bibleVerse}</span>
                      </div>
                    </div>
                  )}

                  {sectionKey === 'acara' && (
                    <div className="px-6 text-center w-full max-w-lg">
                      <h2 className="font-dancingscript py-2 text-4xl mb-6">{config.acaraTitle}</h2>
                      <p className="py-2 text-sm text-white/80 leading-relaxed mb-8">
                        {config.acaraDescription}
                      </p>
                      {config.holyMatrimony?.enabled && (
                        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-lg">
                          <h3 className="font-dancingscript text-3xl mb-2">{config.holyMatrimony.title}</h3>
                          <p className="text-sm text-white/90 mb-2">Pukul {config.holyMatrimony.time} WIB - Selesai</p>
                          <p className="text-lg font-bold mb-1">{config.holyMatrimony.place}</p>
                          <p className="text-sm text-white/70 mb-4">{config.holyMatrimony.place_details}</p>
                          <a href={config.holyMatrimony.googleMapsLink} target="_blank" className="inline-flex items-center gap-x-2 text-xs border border-white hover:bg-white hover:text-black rounded-full px-4 py-2 transition">
                            <FaMapMarkerAlt /> Google Maps
                          </a>
                        </div>
                      )}
                      {config.weddingReception?.enabled && (
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-lg">
                          <h3 className="font-dancingscript text-3xl mb-2">{config.weddingReception.title}</h3>
                          <p className="text-sm text-white/90 mb-2">Pukul {config.weddingReception.time} WIB - Selesai</p>
                          <p className="text-lg font-bold mb-1">{config.weddingReception.place}</p>
                          <p className="text-sm text-white/70 mb-4">{config.weddingReception.place_details}</p>
                          <a href={config.weddingReception.googleMapsLink} target="_blank" className="inline-flex items-center gap-x-2 text-xs border border-white hover:bg-white hover:text-black rounded-full px-4 py-2 transition">
                            <FaMapMarkerAlt /> Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {sectionKey === 'countdown' && (
                    <div className="px-6 text-center w-full max-w-lg">
                      <h2 className="font-dancingscript py-2 text-4xl mb-6">Menuju Hari Bahagia</h2>
                      <div className="border border-white/20 rounded-full shadow-lg py-4 px-2 bg-white/5 backdrop-blur-sm mb-6">
                        <CountdownTimer eventDate={config.eventDate} />
                      </div>
                      <button className="border border-white/50 text-white hover:bg-white hover:text-black shadow rounded-full px-6 py-3 transition text-sm">
                        <FaCalendarAlt className="inline mr-2" /> Save the Date
                      </button>
                    </div>
                  )}

                  {sectionKey === 'galeri' && (
                    <div className="w-full">
                      <GallerySection config={config} />
                    </div>
                  )}

                  {sectionKey === 'rekening' && (
                    <div className="w-full">
                      <GiftsSection config={config} />
                    </div>
                  )}

                  {sectionKey === 'rsvp' && config.rsvp?.enabled && (
                    <div className="px-6 w-full max-w-lg">
                      <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm shadow-xl space-y-8">
                        <div>
                          <h2 className="font-dancingscript text-center text-4xl mb-3">RSVP & Ucapan</h2>
                          <p className="text-center text-sm text-white/70 mb-6">{config.rsvp.detail}</p>
                          <Form 
                            onSuccess={() => setRefreshTrigger(prev => prev + 1)} 
                            initialName={name} 
                          />
                        </div>
                        
                        <div className="pt-6 border-t border-white/10">
                          <h3 className="font-dancingscript text-center text-2xl mb-4 text-white/90">Doa & Ucapan Tamu</h3>
                          <WishesList refreshTrigger={refreshTrigger} />
                        </div>
                      </div>
                    </div>
                  )}

                  {sectionKey === 'thankyou' && (
                    <div className="px-6 text-center w-full max-w-lg py-12">
                      <p className="text-sm text-white/70">{config.thankyou}</p>
                      <h2 className="font-dancingscript text-5xl mt-6">{config.coupleNames}</h2>
                      <p className="text-xs text-white/50 mt-4">{config.thankyouDetail}</p>
                    </div>
                  )}

                  {sectionKey === 'timeline' && (
                    <div className="px-6 text-center w-full max-w-lg">
                      <h2 className="font-dancingscript py-2 text-4xl mb-8">Kisah Kami</h2>
                      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/20 before:to-transparent">
                        {[
                          { title: config.timeline_1, desc: config.timeline_1_content },
                          { title: config.timeline_2, desc: config.timeline_2_content },
                          { title: config.timeline_3, desc: config.timeline_3_content },
                          { title: config.timeline_4, desc: config.timeline_4_content },
                        ].map((item, i) => (
                          item.title && (
                            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/50 bg-black text-white/80 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                                <span className="font-dancingscript text-xl">{i + 1}</span>
                              </div>
                              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-white/10 bg-white/5 shadow text-left md:group-odd:text-right">
                                <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                <p className="text-sm text-white/70">{item.desc}</p>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                  
                </section>
              </Fragment>
            );
          })}
        </div>
      )}
      </div>
      
      <MusicPlayer src={config.backgroundMusicUrl} isInvitationOpen={isOpen} />
    </div>
  );
}
