export async function GET() {
  // Test env vars without exposing full values
  const checks = {
    OPENALEX_API_KEY: process.env.OPENALEX_API_KEY ? "✅ set (" + process.env.OPENALEX_API_KEY.length + " chars)" : "❌ NOT SET",
    SCOPUS_API_KEY: process.env.SCOPUS_API_KEY ? "✅ set" : "❌ NOT SET",
    S2_API_KEY: process.env.S2_API_KEY ? "✅ set" : "❌ NOT SET",
  };

  return Response.json(checks);
}
