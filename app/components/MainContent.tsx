"use client";

import { useState, useEffect, Fragment } from "react";
import { IoIosArrowUp } from "react-icons/io";
import { FaInstagram, FaCalendarAlt } from "react-icons/fa";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import CountdownTimer from "./Countdown";
import Form from "./Form";
import WishesList from "./WishesList";
import GallerySection from "./GallerySection";
import GiftsSection from "./GiftsSection";
import type { WeddingConfig } from "@/lib/config";
import MusicPlayer from "./MusicPlayer";

type WeddingScreenProps = {
  name?: string;
  config: WeddingConfig;
  onOpenInvitation?: () => void;
  isProceeded?: boolean;
};

const WeddingScreen = ({ name, config, onOpenInvitation, isProceeded = false }: WeddingScreenProps) => {
  const [fadeClass, setFadeClass] = useState("opacity-0");
  const [isOpen, setIsOpen] = useState(false);

  // Untuk fade-in pertama kali
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeClass("opacity-100");
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    if (config.gallery?.photos && config.gallery.photos.length > 1) {
      const interval = setInterval(() => {
        setBgIndex((prev) => (prev + 1) % config.gallery.photos!.length);
      }, 5000); // Ganti gambar setiap 5 detik
      return () => clearInterval(interval);
    }
  }, [config.gallery?.photos]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && onOpenInvitation) {
      onOpenInvitation();
    }
  };

  const { ref: mainRef, inView: isMainInView } = useInView({
    threshold: 0.5,
  });

  const { ref: main2Ref, inView: isMain2InView } = useInView({
    threshold: 0.5,
  });

  const { ref: slide1Ref, inView: isSlide1InView } = useInView({
    threshold: 0.5,
  });

  const { ref: slideBrideGroomRef, inView: isSlideBrideGroomInView } = useInView({
    threshold: 0.5,
  });

  const { ref: slide2Ref, inView: isSlide2InView } = useInView({
    threshold: 0.5,
  });

  const { ref: slide3Ref, inView: isSlide3InView } = useInView({
    threshold: 0.5,
  });

  const { ref: slide4Ref, inView: isSlide4InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide5Ref, inView: isSlide5InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide6Ref, inView: isSlide6InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide7Ref, inView: isSlide7InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide8Ref, inView: isSlide8InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide9Ref, inView: isSlide9InView } = useInView({
    threshold: 0.5,
  });
  const { ref: slide10Ref, inView: isSlide10InView } = useInView({
    threshold: 0.5,
  });
  const { ref: endRef, inView: isEndInView } = useInView({
    threshold: 0.5,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const video = document.querySelector("iframe");
    if (video) {
      if (isSlide8InView) {
        video.src += "&autoplay=1"; // Mulai video
      } else {
        video.src = video.src.replace("&autoplay=1", ""); // Hentikan video
      }
    }
  }, [isSlide8InView]);

  return (
    <div
      className={`h-screen w-screen flex flex-col md:flex-row ${fadeClass} transition-opacity duration-1000`}
    >
      {/* Gambar sisi kiri Wide Untuk Komputer */}
      <div
        className="md:flex justify-center hidden items-end pb-12 w-2/3 h-1/2 md:h-full"
        style={{
          backgroundImage: `url(${config.backgrounds?.bg_sidebar || "/foto_1_samping.jpg"})`, //refer to base 1st photo
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className={`bottom-10 left-20 font-ovo text-lg text-white tracking-[5px] uppercase`}
        >
          {config.coupleNames}
        </div>
      </div>

      {/* Konten teks sisi kanan bisa scroll untuk pc */}
      <div className=" md:w-1/3 h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth relative">
        <div
          id="backgroundWedding"
          className=" snap-start relative w-full h-screen flex items-center justify-center "
        >
          {/* Background Layer with Crossfade */}
          <div className="absolute inset-0 w-full h-full z-0 bg-black overflow-hidden">
            {(config.gallery?.photos && config.gallery.photos.length > 0) ? (
              config.gallery.photos.map((photo, index) => (
                <div
                  key={index}
                  className="absolute inset-0 w-full h-full transition-opacity ease-in-out"
                  style={{
                    transitionDuration: '2s',
                    backgroundImage: `url(${photo.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: bgIndex === index ? 0.6 : 0,
                  }}
                />
              ))
            ) : (
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  backgroundImage: `url(${config.backgrounds?.bg_welcome || "/foto_2.jpg"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  opacity: 0.6,
                }}
              />
            )}
          </div>

          <div className="text-center p-5 flex flex-col h-full justify-between py-20 relative z-10">
            <div className="gap-y-2 md:gap-y-4 flex flex-col">
              <h5
                className={`text-sm font-legan text-white uppercase tracking-wide fadeMain2 ${isMain2InView ? "active" : ""
                  } `}
                ref={main2Ref}
              >
                The Wedding Of
              </h5>
              <h1
                className={`text-2xl md:text-3xl font-ovo t text-white uppercase fadeMain ${isMainInView ? "active" : ""
                  } `}
                ref={mainRef}
              >
                {config.coupleNames}
              </h1>
              <h5
                className={`text-sm  font-legan text-white uppercase tracking-wide  fadeMain2 ${isMain2InView ? "active" : ""
                  } `}
                ref={main2Ref}
              >
                {new Date(config.eventDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h5>
            </div>
            <div>
              <p className="mt-5 text-sm md:text-base font-legan tracking-widest text-white">
                {isProceeded ? '#roMAnSAsatuhati' : `Dear, ${name || 'Tamu Undangan'}`}
              </p>
              {!isOpen ? (
                <button
                  className="animate-bounce  mt-5 px-5 py-1 uppercase text-xs border border-white hover:text-white hover:bg-transparent rounded-full bg-white text-black transition"
                  onClick={handleOpen}
                >
                  Open Invitation
                </button>
              ) : (
                <IoIosArrowUp
                  stroke="4"
                  className="mx-auto mt-20 animate-upDown text-white"
                />
              )}
            </div>
          </div>
        </div>
        {isOpen && (config.sectionOrder || ['ayat', 'timeline', 'pengantar', 'cpw', 'cpp', 'acara', 'countdown', 'galeri', 'rekening', 'rsvp', 'thankyou']).map(sectionKey => (
          <Fragment key={sectionKey}>
            {sectionKey === 'ayat' && (
              <>
                {/* Slide 1 */}
            <div
              className={`text-white h-screen flex pt-12 p-5 px-12 snap-start `}
              style={{
                backgroundImage: `url(${config.backgrounds?.slide_1 || "/slide_1.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide1Ref}
                className={` ${isSlide1InView ? "active" : ""}  fadeInMove`}
              >
                <h1 className="text-xl md:text-2xl font-ovo tracking-wide text-white uppercase">
                  {config.bibleVerse}
                </h1>
                <p className="text-sm mt-5 font-legan">
                  {config.bibleVerseContent}
                </p>
                <p className="text-6xl mt-5 font-wonder">{config.coupleNames}</p>
              </div>
            </div>
              </>
            )}
            {sectionKey === 'timeline' && (
              <>
                {/* Slide 4 */}
            <div
              className="snap-start  text-white h-screen pt-8 flex px-12 "
              style={{
                backgroundImage: `url(${config.backgrounds?.slide_4 || "/slide_4.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div>
                <h1
                  ref={slide4Ref}
                  className={`text-xl md:text-5xl  text-white font-ovo fadeInMove ${isSlide4InView ? " active" : ""
                    }`}
                >
                  A journey in love
                </h1>
                <h3
                  ref={slide4Ref}
                  className={`uppercase font-legan text-xl mt-5 mb-2 fadeInMoveSlow ${isSlide4InView ? " active" : ""
                    }`}
                >
                  {config.timeline_1}
                </h3>
                <p
                  ref={slide4Ref}
                  className={`text-xs font-legan text-white fadeInLeftSlow ${isSlide4InView ? "active" : ""
                    }`}
                >
                  {config.timeline_1_content}
                </p>
                <h3
                  ref={slide4Ref}
                  className={`uppercase font-legan text-xl mt-5 mb-2 fadeInMoveSlow ${isSlide4InView ? " active" : ""
                    }`}
                >
                  {config.timeline_2}
                </h3>
                <p
                  ref={slide4Ref}
                  className={`text-xs font-legan text-white fadeInLeftSlow ${isSlide4InView ? " active" : ""
                    }`}
                >
                  {config.timeline_2_content}
                </p>
                <h3
                  ref={slide4Ref}
                  className={`uppercase font-legan text-xl mt-5 mb-2 fadeInMoveSlow ${isSlide4InView ? " active" : ""
                    }`}
                >
                  {config.timeline_3}
                </h3>
                <p
                  ref={slide4Ref}
                  className={`text-xs font-legan text-white fadeInLeftSlow ${isSlide4InView ? " active" : ""
                    }`}
                >
                  {config.timeline_3_content}
                </p>
                <h3
                  ref={slide4Ref}
                  className={`uppercase font-legan text-xl mt-5 mb-2 fadeInMoveSlow ${isSlide4InView ? " active" : ""
                    }`}
                >
                  {config.timeline_4}
                </h3>
                <p
                  ref={slide4Ref}
                  className={`text-xs font-legan text-white fadeInLeftSlow ${isSlide4InView ? " active" : ""
                    }`}
                >
                  {config.timeline_4_content}
                </p>
                <div
                  ref={slide4Ref}
                  className={`relative flex items-center mt-5 fadeInLeft ${isSlide4InView ? " active" : ""
                    }`}
                >
                  <hr className="w-[120px] mx-2 border-t border-gray-300" />
                  <span className="px-2 font-thesignature text-3xl">
                    {config.coupleNames}
                  </span>
                </div>
              </div>
            </div>
              </>
            )}
            {sectionKey === 'pengantar' && (
              <>
                {/* Slide Bride & Groom (Slide 1.5) */}
            <div
              className={`text-white h-screen flex flex-col justify-center items-center p-5 px-12 snap-start `}
              style={{
                backgroundImage: `url(${config.backgrounds?.bg_bride_groom || "/foto_1_samping.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slideBrideGroomRef}
                className={` ${isSlideBrideGroomInView ? "active" : ""} fadeInMove text-center flex flex-col items-center justify-center`}
              >
                <p className="text-base md:text-lg font-legan text-white mb-4">
                  {config.brideGroomGreeting}
                </p>
                <p className="text-sm md:text-base font-legan text-[#CCCCCC]">
                  {config.brideGroomText}
                </p>
              </div>
            </div>
              </>
            )}
            {sectionKey === 'cpw' && (
              <>
                {/* Slide 2 */}
            <div
              className={`text-white h-screen flex items-end pb-16 px-12 snap-start `}
              style={{
                backgroundImage: `url(${config.backgrounds?.slide_2 || "/slide_2.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Display the content when the button is clicked */}
              <div
                ref={slide2Ref}
                className={`fadeInMove ${isSlide2InView ? "active" : ""}  `}
              >
                <p className="font-legan text-sm my-2">The Bride</p>
                <h1 className="text-xl md:text-3xl text-white  font-ovo">
                  {config.bride}
                </h1>
                <h3 className="font-thesignature text-2xl">About {config.brideNickName},</h3>
                <p className="text-sm mt-5 font-legan text-[#CCCCCC]">
                  {config.brideBio}
                </p>
                <Link
                  href={`https://www.instagram.com/${config.brideInstagram}`}
                  target="_blank"
                  className="cursor-pointer hover:bg-black text-sm rounded-full flex items-center gap-x-2 text-center font-legan mt-5 bg-[#4E4E4E] w-fit px-4 py-2 text-[#CCCCCC]"
                >
                  <FaInstagram /> {config.brideInstagram}
                </Link>
              </div>
            </div>
              </>
            )}
            {sectionKey === 'cpp' && (
              <>
                {/* Slide 3 */}
            <div
              className="snap-start  text-white h-screen flex items-end pb-16 px-12 "
              style={{
                backgroundImage: `url(${config.backgrounds?.slide_3 || "/slide_3.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide3Ref}
                className={`fadeInMove ${isSlide3InView ? "active" : ""}  `}
              >
                <p className="font-legan text-sm my-2">The Groom</p>
                <h1 className="text-xl md:text-3xl text-white  font-ovo">
                  {config.groom}
                </h1>
                <h3 className="font-thesignature text-2xl">About {config.groomNickName},</h3>
                <p className="text-sm mt-5 font-legan text-[#CCCCCC]">
                  {config.groomBio}
                </p>
                <Link
                  href={`https://www.instagram.com/${config.groomInstagram}`}
                  target="_blank"
                  className="cursor-pointer hover:bg-black text-sm rounded-full flex items-center gap-x-2 text-center font-legan mt-5 bg-[#4E4E4E] w-fit px-4 py-2 text-[#CCCCCC]"
                >
                  <FaInstagram /> {config.groomInstagram}
                </Link>
              </div>
            </div>
              </>
            )}
            {sectionKey === 'acara' && (
              <>
                {/* Slide 5 */}
            <div
              className="snap-start  text-white h-screen flex flex-col items-center px-12 "
              style={{
                backgroundImage: `url(${config.backgrounds?.slide_5 || "/slide_5.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide5Ref}
                className={` ${isSlide5InView ? "active" : ""
                  }  fadeInMove flex items-center flex-col pt-12 `}
              >
                <h3 className="uppercase font-legan text-xs tracking-wide mt-5 mb-2">
                  save our date
                </h3>
                <h1 className="text-2xl w-[200px] text-center text-white  font-ovo uppercase">
                  {new Date(config.eventDate).toLocaleDateString("en-US", {
                    weekday: "long",
                  })} <br />  {new Date(config.eventDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h1>
                {config.holyMatrimony.enabled && (
                  <div className="mt-5 mx-auto flex flex-col items-center">
                    <h3 className="uppercase font-ovo text-sm text-center mt-5 mb-2">
                      AKAD NIKAH <br /> {config.holyMatrimony.time}
                    </h3>
                    <p className="text-sm text-center  font-legan text-white">
                      {config.holyMatrimony.place} <br /> {config.holyMatrimony.place_details}
                    </p>
                    {/* Hanya tampil kalau lokasi BEDA dengan resepsi */}
                    {config.holyMatrimony.googleMapsLink !== config.weddingReception.googleMapsLink && (
                      <Link
                        href={config.holyMatrimony.googleMapsLink}
                        target="_blank"
                        className="cursor-pointer hover:text-white/20 text-sm rounded-full flex items-center gap-x-2 text-center font-legan mt-5 bg-[#808080] w-fit px-4 py-2 text-white"
                      >
                        Google Maps
                      </Link>
                    )}
                  </div>
                )}

                {config.weddingReception.enabled && (
                  <div className="mt-5 mx-auto flex  flex-col items-center">
                    <h3 className="uppercase font-ovo text-sm text-center mt-5 mb-2">
                      Wedding Reception <br /> {config.weddingReception.time}
                    </h3>
                    <p className="text-sm text-center  font-legan text-white">
                      {config.weddingReception.place} <br /> {config.weddingReception.place_details}
                    </p>
                    {/* Hanya tampil kalau lokasi BEDA dengan akad */}
                    {config.weddingReception.googleMapsLink !== config.holyMatrimony.googleMapsLink && (
                      <Link
                        href={config.weddingReception.googleMapsLink}
                        target="_blank"
                        className="cursor-pointer hover:text-white/20 text-sm rounded-full flex items-center gap-x-2 text-center font-legan mt-5 bg-[#808080] w-fit px-4 py-2 text-white"
                      >
                        Google Maps
                      </Link>
                    )}
                  </div>
                )}

                {/* 1 tombol Maps bersama kalau lokasi sama */}
                {config.holyMatrimony.enabled && config.weddingReception.enabled &&
                  config.holyMatrimony.googleMapsLink === config.weddingReception.googleMapsLink &&
                  config.holyMatrimony.googleMapsLink && (
                  <Link
                    href={config.holyMatrimony.googleMapsLink}
                    target="_blank"
                    className="cursor-pointer hover:text-white/20 text-sm rounded-full flex items-center gap-x-2 text-center font-legan mt-6 bg-[#808080] w-fit px-4 py-2 text-white"
                  >
                    Google Maps
                  </Link>
                )}
              </div>
            </div>
              </>
            )}
            {sectionKey === 'countdown' && (
              <>
                {/* Slide 6 */}
            <div
              className="snap-start  text-white h-screen flex flex-col items-center justify-end pb-16 px-12 "
              style={{
                backgroundImage: `url(${config.backgrounds?.slide_6 || "/slide_6.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide6Ref}
                className={` ${isSlide6InView ? "active" : ""
                  }  fadeInMove flex items-center flex-col`}
              >
                <h1 className="text-2xl text-center text-white  font-ovo">
                  ALMOST TIME FOR OURCELEBRATION
                </h1>
                {/* Countdown Timer */}
                <CountdownTimer eventDate={config.eventDate} />
                
                <Link
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Wedding+of+${encodeURIComponent(config.coupleNames)}&dates=${new Date(config.eventDate).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(new Date(config.eventDate).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent("Join us for our wedding celebration!")}`}
                  target="_blank"
                  className="cursor-pointer hover:bg-white/30 hover:scale-105 active:scale-95 text-sm rounded-full flex items-center gap-x-2 text-center font-legan mt-8 bg-white/20 border border-white/40 w-fit px-6 py-2.5 text-white transition-all backdrop-blur-sm shadow-lg"
                >
                  <FaCalendarAlt /> Save the Date
                </Link>
              </div>
            </div>
              </>
            )}
            {sectionKey === 'galeri' && (
              <>
                {/* Gallery Section */}
            <GallerySection config={config} />
              </>
            )}
            {sectionKey === 'rekening' && (
              <>
                {/* Gifts Section */}
            <GiftsSection config={config} />
              </>
            )}
            {sectionKey === 'rsvp' && (
              <>
                {/* SLIDE 9 */}
            {config.rsvp.enabled && (
            <div
              className="snap-start text-white h-screen flex flex-col justify-center pt-16 pb-16 px-8"
              style={{
                backgroundImage: `url(${config.backgrounds?.slide_9 || "/slide_9.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide9Ref}
                className={`${isSlide9InView ? "active" : ""} fadeInMove`}
              >
                <h1 className="text-3xl text-white font-ovo text-center uppercase">
                  RSVP AND WISHES
                </h1>
                <p className="text-sm font-legan text-white/80 text-center">
                {config.rsvp.detail}
                </p>

                <Form onSuccess={() => setRefreshTrigger(prev => prev + 1)} initialName={name} />
              </div>
            </div>
            )}

            {/* SLIDE 10 */}
            <div
              className="snap-start text-white h-screen flex flex-col justify-center pt-16 pb-16 px-8"
              style={{
                backgroundImage: `url(${config.backgrounds?.slide_10 || "/slide_9.jpg"})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={slide10Ref}
                className={`${isSlide10InView ? "active" : ""} fadeInMove`}
              >
                <h1 className="text-3xl text-white font-ovo text-center uppercase">
                  Wishes
                </h1>
                <WishesList refreshTrigger={refreshTrigger} />
              </div>
            </div>
              </>
            )}
            {sectionKey === 'thankyou' && (
              <>
                {/* SLIDE AKHIR */}
            <div
              className="snap-start text-white h-screen flex flex-col justify-end pt-16 pb-16 px-12 "
              style={{
                backgroundImage: `url(${config.backgrounds?.slide_1 || "/slide_7.jpg"})`, // or maybe a specific one for thank you
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                ref={endRef}
                className={` ${isEndInView ? "active" : ""} fadeInMove `}
              >
                <h1 className="text-3xl text-white  font-ovo text-center uppercase">
                  {config.thankyou}
                </h1>

                <div className="mt-5 mx-auto flex flex-col ">
                  <p className="text-sm font-legan text-white text-center">
                    {config.thankyouDetail}
                  </p>
                  <p className="text-sm rounded-full text-center font-ovo mt-5 px-6 py-2 text-white uppercase">
                    {config.coupleNames}
                  </p>
                </div>
              </div>

              <footer className="flex flex-col items-center mt-8">
                <p className="text-[0.5rem] text-center font-legan tracking-widest">
                  #roMAnSAsatuhati
                </p>
              </footer>
            </div>
          </>
        )}
          </Fragment>
        ))}
        {isOpen && config.livestreaming.enabled && (
          <>
            {/* Slide 7 - Livestreaming */}
            {/* Slide 7 */}
            {config.livestreaming.enabled && (
              <div
                className="snap-start  text-white h-screen flex flex-col justify-between pt-16 pb-32 px-12 "
                style={{
                  backgroundImage: `url(${config.backgrounds?.slide_7 || "/foto_1_samping.jpg"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <h1
                  ref={slide7Ref}
                  className={`text-2xl text-white  font-ovo fadeInMoveSlow ${isSlide7InView ? "active" : ""
                    }`}
                >
                  JOIN OUR EXCLUSIVE LIVE STREAMING EVENT
                </h1>

                <div
                  className={`mt-5 mx-auto flex flex-col fadeInMove ${isSlide7InView ? "active" : ""
                    }`}
                  ref={slide7Ref}
                >
                  <h3 className="uppercase font-ovo text-sm mt-5 mb-2">
                    {new Date(config.eventDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    <br /> {config.livestreaming.time}
                  </h3>
                  <p className="text-sm font-legan text-white">
                    {config.livestreaming.detail}
                  </p>
                  <Link
                    href={config.livestreaming.link}
                    target="_blank"
                    className="cursor-pointer hover:text-white/20 text-sm rounded-full flex items-center gap-x-2 text-center font-legan mt-5 bg-[#3B3B3B] w-fit px-6 py-2 text-white"
                  >
                    Join Live Streaming
                  </Link>
                </div>
              </div>)}
            {/* SLIDE 8 - Prewedding */}
            {/* SLIDE 8 */}
            {config.prewedding.enabled && (
              <div
                className="snap-start text-white h-screen flex flex-col justify-center pt-16 pb-16 px-8 "
                style={{
                  backgroundImage: `url(${config.backgrounds?.slide_8 || "/slide_8.jpg"})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div
                  ref={slide8Ref}
                  className={`${isSlide8InView ? "active" : ""} fadeInMove `}
                >
                  <h1 className="text-3xl text-white  font-ovo text-center uppercase">
                    Unveiling Our Prewedding Story
                  </h1>
                  <div
                    className="mt-10 mx-auto w-full max-w-2xl relative"
                    style={{ paddingBottom: "56.25%", height: 0 }}
                  >
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${config.prewedding.link}?autoplay=1&mute=1&loop=1`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    ></iframe>
                  </div>

                  <div className="-mt-12 w-72 transform skew-x-6 drop-shadow">
                    <p className="text-3xl font-thesignature text-white/80 ">
                      {config.prewedding.detail}
                    </p>
                  </div>
                </div>
              </div>)}
          </>
        )}

      </div>
      {/* Audio Element */}
      <MusicPlayer src={config.backgroundMusicUrl} isInvitationOpen={isOpen} />
    </div>
  );
};

export default WeddingScreen;
