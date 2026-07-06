import { supabase, getHistory } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    let userId: string | undefined = undefined;
    
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    if (!userId) {
      return Response.json({ jobs: [] });
    }

    const history = await getHistory(10, userId);
    return Response.json({ jobs: history });
  } catch (err: any) {
    return Response.json({ jobs: [] });
  }
}
