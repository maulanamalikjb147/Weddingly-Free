import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/lib/supabaseTables";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "5", 10);

  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch paginated wishes
    const { data: wishes, error, count } = await supabase
      .from(SUPABASE_TABLES.rsvps)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }
    
    // Map data to match what the frontend expects
    const formattedWishes = wishes.map((wish) => ({
      _id: wish.id,
      name: wish.name,
      attendance: wish.attendance,
      guests: wish.guests,
      message: wish.message,
      createdAt: wish.created_at,
    }));

    return NextResponse.json({
      wishes: formattedWishes,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching wishes:", error);
    return NextResponse.json(
      { message: "Error fetching wishes", error },
      { status: 500 }
    );
  }
}
