export const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
export const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
export const REDIS_URL = Deno.env.get("REDIS_URL") || "redis://127.0.0.1:6379";
