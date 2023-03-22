export const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

export const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

export const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://fhvnykpsljhlmyjxphmn.supabase.co";
export const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZodm55a3BzbGpobG15anhwaG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg4NDYzMTIsImV4cCI6MTk5NDQyMjMxMn0.Iy-XAg7h3A5gg9-_SuV069STvrCdRdeoVt5QqkGFjHQ";