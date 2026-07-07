import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { searchId, paperDoi, feedback } = await req.json();

    if (!searchId || !paperDoi) {
      return Response.json(
        { success: false, error: "Missing required fields", statusCode: 400 },
        { status: 400 }
      );
    }

    if (!["up", "down"].includes(feedback)) {
      return Response.json(
        { success: false, error: "Invalid feedback value", statusCode: 400 },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("paper_feedback")
      .upsert(
        {
          search_id: searchId,
          paper_doi: paperDoi,
          feedback,
        },
        { onConflict: "search_id,paper_doi" }
      );

    if (error) {
      console.error("Supabase feedback upsert error:", error.message);
      return Response.json(
        { success: false, error: error.message, statusCode: 500 },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data: { ok: true }, statusCode: 200 });
  } catch (err: any) {
    console.error("Feedback route error:", err.message);
    return Response.json(
      { success: false, error: err.message, statusCode: 500 },
      { status: 500 }
    );
  }
}
