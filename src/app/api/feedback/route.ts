import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { searchId, paperDoi, feedback } = await req.json();

    if (!["up", "down"].includes(feedback)) {
      return Response.json({ error: "Invalid feedback value" }, { status: 400 });
    }

    const { error } = await supabase
      .from("paper_feedback")
      .update({ feedback })
      .match({ search_id: searchId, paper_doi: paperDoi });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
