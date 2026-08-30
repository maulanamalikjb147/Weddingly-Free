import React, { useState } from "react";
import { CheckCircle2, X } from "lucide-react";

type FormProps = {
  onSuccess?: () => void;
  initialName?: string;
};

const Form = ({ onSuccess, initialName }: FormProps) => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Membersihkan sapaan "Bapak/Ibu" dari nama awal
  const cleanName = (initialName || "")
    .replace(/^(Bapak\/Ibu|Bpk\/Ibu|Bapak|Ibu|Sdr\/i|Sdr|Saudara|Saudari)\s+/i, "")
    .trim();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    if (!form) {
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      attendance: formData.get("attendance"),
      guests: formData.get("guests"),
      message: formData.get("message"),
    };


    if (!data.name || !data.attendance || !data.guests || !data.message) {
      alert("All fields are required!");
      setLoading(false); 
      return;
    }

    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      // Reset the form if submission is successful
      form.reset();
      setShowModal(true);
      if (onSuccess) onSuccess();
    } else {
      alert("Failed to submit RSVP");
    }

    setLoading(false); // Set loading to false after response
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {/* Form fields */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white text-left font-legan">
            Nama
          </label>
          <input
            type="text"
            name="name"
            id="name"
            defaultValue={cleanName}
            className="block w-full p-2 mt-1 bg-white/10 text-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-legan"
            required
          />
        </div>

        <div>
          <label
            htmlFor="attendance"
            className="block text-sm font-medium text-white text-left font-legan"
          >
            Kehadiran
          </label>
          <select
            id="attendance"
            name="attendance"
            className="block w-full p-2 mt-1 bg-black/40 text-white border border-gray-300 rounded-md shadow-sm  sm:text-sm font-legan"
            required
          >
            <option value="">Pilih Kehadiran</option>
            <option value="Hadir">Hadir</option>
            <option value="Tidak Hadir">Tidak Hadir</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="guests"
            className="block text-sm font-medium text-white text-left font-legan"
          >
            Jumlah Tamu
          </label>
          <select
            id="guests"
            name="guests"
            className="block w-full p-2 mt-1  bg-black/40 text-white border border-gray-300 rounded-md shadow-sm  sm:text-sm font-legan"
            required
          >
            <option value="">Pilih Jumlah Tamu</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-white text-left font-legan"
          >
            Ucapan
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="block w-full p-2 mt-1 bg-white/10 text-white border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-legan"
            required
          />
        </div>

        <div>
          <button
            type="submit"
            className="block w-full p-2 text-sm font-medium text-center text-black bg-white border border-transparent rounded-md shadow-sm font-legan"
            disabled={loading} 
          >
            {loading ? "Submitting..." : "Submit"} 
          </button>
        </div>
      </form>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm p-6 bg-white rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 mb-4 text-green-500 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 font-ovo">Terima Kasih!</h3>
              <p className="mb-6 text-sm text-gray-500 font-legan">
                RSVP & Ucapan Anda telah berhasil dikirim. Kami tidak sabar menunggu kehadiran Anda!
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black font-legan"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Form;
