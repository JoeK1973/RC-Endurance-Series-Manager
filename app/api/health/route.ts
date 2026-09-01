import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from("rounds")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      supabase: "connected",
      rounds: count,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
