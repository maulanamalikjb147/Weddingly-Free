"use client";

import { FaHome, FaHeart, FaCalendarAlt, FaImages, FaEnvelopeOpenText } from "react-icons/fa";

export default function BottomNav() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed bottom-0 w-full lg:w-5/12 xl:w-4/12 2xl:w-3/12 bg-black/80 backdrop-blur-md border-t border-white/20 z-50 rounded-t-2xl">
      <ul className="flex justify-around items-center py-2 px-1 text-white/70">
        <li className="flex flex-col items-center cursor-pointer hover:text-white" onClick={() => scrollTo("beranda")}>
          <FaHome size={20} />
          <span className="text-[0.6rem] mt-1 font-andika">Beranda</span>
        </li>
        <li className="flex flex-col items-center cursor-pointer hover:text-white" onClick={() => scrollTo("mempelai")}>
          <FaHeart size={20} />
          <span className="text-[0.6rem] mt-1 font-andika">Mempelai</span>
        </li>
        <li className="flex flex-col items-center cursor-pointer hover:text-white" onClick={() => scrollTo("waktu")}>
          <FaCalendarAlt size={20} />
          <span className="text-[0.6rem] mt-1 font-andika">Waktu</span>
        </li>
        <li className="flex flex-col items-center cursor-pointer hover:text-white" onClick={() => scrollTo("galeri")}>
          <FaImages size={20} />
          <span className="text-[0.6rem] mt-1 font-andika">Galeri</span>
        </li>
        <li className="flex flex-col items-center cursor-pointer hover:text-white" onClick={() => scrollTo("ucapan")}>
          <FaEnvelopeOpenText size={20} />
          <span className="text-[0.6rem] mt-1 font-andika">Ucapan</span>
        </li>
      </ul>
    </nav>
  );
}
