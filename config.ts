export const openaiKey = Deno.env.get("OPENAI_API_KEY")!;
export const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
export const redisPassword = Deno.env.get("REDIS_PASSWORD")!;
export const redisHostname = Deno.env.get("REDIS_HOSTNAME")!;