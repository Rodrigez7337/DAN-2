import "https://deno.land/std@0.178.0/dotenv/load.ts";


export const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

export const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

export const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
export const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
