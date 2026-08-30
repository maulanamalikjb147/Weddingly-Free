export type WeddingGuest = {
  id: string;
  name: string;
  address: string;
  slug: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getWeddingGuest(slug: string): Promise<WeddingGuest | null> {
  if (slug === "preview" && process.env.NODE_ENV !== "production") {
    return {
      id: "00000000-0000-4000-8000-000000000001",
      name: "Bapak/Ibu Maulana Malik",
      address: "Jakarta",
      slug,
    };
  }

  if (!supabaseUrl || !supabaseKey) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_wedding_guest`, {
    method: "POST",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_slug: slug }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const rows = await response.json() as Array<Record<string, unknown>>;
  const guest = rows[0];
  if (!guest) return null;

  return {
    id: String(guest.id),
    name: String(guest.nama_tamu),
    address: String(guest.alamat_tamu ?? ""),
    slug: String(guest.invitation_slug),
  };
}
