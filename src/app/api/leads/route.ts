import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, sessionId, messages } = await request.json();

    // Use service-level or anon client for public inserts
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Insert lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({ name, email, company })
      .select("id")
      .single();

    if (leadError) {
      console.error("Lead insert error:", leadError);
      return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
    }

    // Insert chat log
    const { error: chatError } = await supabase
      .from("chat_logs")
      .insert({
        lead_id: lead.id,
        session_id: sessionId,
        messages: messages,
        summary: `Beszélgetés ${name}-vel (${email})`,
      });

    if (chatError) {
      console.error("Chat log insert error:", chatError);
    }

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
