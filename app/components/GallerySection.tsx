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
      className="relative w-full text-white flex flex-col bg-transparent py-6"
    >
      <div ref={ref} className={`${inView ? "active" : ""} fadeInMove flex flex-col w-full`}>
        {/* Title */}
        <div className="pt-8 pb-4 z-10 text-center">
          <h1 className="text-3xl font-ovo tracking-widest">Gallery</h1>
        </div>
        
        {/* Thumbnails Carousel */}
        <div className="flex px-4 gap-3 overflow-x-auto z-10 pb-3 no-scrollbar items-center justify-start md:justify-center w-full max-w-md mx-auto">
          {config.gallery.photos.map((photo, index) => (
            <div 
              key={index} 
              onClick={() => setSelectedIndex(index)}
              className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${index === selectedIndex ? 'border-white scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
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
        <div className="px-4 w-full flex justify-center">
          <div className="relative w-full max-w-md aspect-[4/5] overflow-hidden rounded-2xl border border-white/20 shadow-2xl my-2">
            <Image 
              key={selectedPhoto.src}
              src={selectedPhoto.src} 
              alt={selectedPhoto.alt || "Main gallery photo"}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 500px"
              className="object-cover transition-opacity duration-500"
            />
          </div>
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
