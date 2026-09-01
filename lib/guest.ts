import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/lib/supabaseTables";

export type WeddingGuest = {
  id: string;
  name: string;
  address: string;
  slug: string;
};

export async function getWeddingGuest(slug: string): Promise<WeddingGuest | null> {
  if (slug === "preview" && process.env.NODE_ENV !== "production") {
    return {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Bapak/Ibu Maulana Malik",
      address: "Jakarta",
      slug,
    };
  }

  const { data: guest, error } = await supabase
    .from(SUPABASE_TABLES.dataTamu)
    .select("id,nama_tamu,alamat_tamu,invitation_slug")
    .eq("invitation_slug", slug)
    .maybeSingle();

  if (error || !guest) return null;

  return {
    id: String(guest.id),
    name: String(guest.nama_tamu),
    address: String(guest.alamat_tamu ?? ""),
    slug: String(guest.invitation_slug),
  };
}
