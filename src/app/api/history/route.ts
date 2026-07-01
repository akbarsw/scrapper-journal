// In-memory history — replace with Supabase later
interface HistoryEntry {
  id: string;
  vars: string;
  total: number;
  status: string;
  created: string;
}

const history: HistoryEntry[] = [];
const MAX = 50;

export function addHistory(entry: HistoryEntry) {
  history.unshift(entry);
  if (history.length > MAX) history.pop();
}

export async function GET() {
  return Response.json({ jobs: history });
}
