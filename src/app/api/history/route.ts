import { getHistory } from "@/lib/supabase";

export async function GET() {
  try {
    const history = await getHistory(10);
    return Response.json({ jobs: history });
  } catch (err: any) {
    return Response.json({ jobs: [] });
  }
}
