"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import type { WeddingConfig } from "@/lib/config";
import Image from "next/image";

type Props = {
  config: WeddingConfig;
};

export default function GallerySection({ config }: Props) {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!config.gallery || !config.gallery.enabled || !config.gallery.photos || config.gallery.photos.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setSelectedIndex((prevIndex) => (prevIndex + 1) % config.gallery.photos.length);
    }, 4000); // 4 seconds interval

    return () => clearInterval(interval);
  }, [config.gallery]);

  if (!config.gallery || !config.gallery.enabled || !config.gallery.photos || config.gallery.photos.length === 0) {
    return null;
  }

  const selectedPhoto = config.gallery.photos[selectedIndex];

  return (
    <div
      className="snap-start relative w-full h-screen bg-[#111] text-white flex flex-col"
    >
      <div ref={ref} className={`${inView ? "active" : ""} fadeInMove flex flex-col w-full h-full`}>
        {/* Title */}
        <div className="pt-8 pb-4 z-10 text-center">
          <h1 className="text-3xl font-ovo tracking-widest">Gallery</h1>
        </div>
        
        {/* Thumbnails Carousel */}
        <div className="flex px-4 gap-3 overflow-x-auto z-10 pb-4 no-scrollbar items-center justify-center">
          {config.gallery.photos.map((photo, index) => (
            <div 
              key={index} 
              onClick={() => setSelectedIndex(index)}
              className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${index === selectedIndex ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <Image 
                src={photo.src} 
                alt={photo.alt || `Gallery thumbnail ${index + 1}`} 
                fill 
                sizes="80px" 
                className="object-cover" 
              />
            </div>
          ))}
        </div>

        {/* Main Image */}
        <div className="relative flex-1 w-full overflow-hidden">
          <Image 
            src={selectedPhoto.src} 
            alt={selectedPhoto.alt || "Main gallery photo"}
            fill
            priority
            sizes="100vw"
            className="object-cover md:object-contain bg-black"
          />
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
