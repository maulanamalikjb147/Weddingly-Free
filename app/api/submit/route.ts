import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/lib/supabaseTables";

export async function POST(req: Request) {
  try {
    const { name, attendance, guests, message } = await req.json();
    
    const { error } = await supabase.from(SUPABASE_TABLES.rsvps).insert({
      name,
      attendance: attendance === "Hadir" ? "hadir" : "tidak",
      guests: Number(guests) || 1,
      message,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        message: "RSVP submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new NextResponse("Failed to submit RSVP", { status: 500 });
  }
}

export async function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}
