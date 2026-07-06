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
      return Response.json(
        { success: false, error: "Unauthorized access", statusCode: 401, jobs: [] },
        { status: 401 }
      );
    }

    const history = await getHistory(10, userId);
    return Response.json({
      success: true,
      data: history,
      jobs: history,
      statusCode: 200
    });
  } catch (err: any) {
    console.error("History API route error:", err.message);
    return Response.json(
      { success: false, error: err.message, statusCode: 500, jobs: [] },
      { status: 500 }
    );
  }
}
