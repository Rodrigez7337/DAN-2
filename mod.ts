import { serve } from "https://deno.land/std@0.180.0/http/server.ts";
import { webhookCallback } from "https://deno.land/x/grammy@v1.15.3/mod.ts";
import bot from "./src/bot/bot.ts";

// The webhook handler function: Handles requests from the Telegram bot’s webhook.
const handleUpdate = webhookCallback(bot, "std/http");

serve(async (req) => {
  if (req.method === "POST") {
    const url = new URL(req.url);
    // We are using the bot token as the secret since it is a secret only revealed to the bot.
    if (url.searchParams.get("secret") === bot.token) {
      try {
        return await handleUpdate(req);
      } catch (err) {
        console.error(err);
      }
    }
  }
  // Handle any request that are not from the webhook:
  return new Response("not allowed", { status: 405 });
});

// Configure the bot’s webhook settings:
// https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=<PROJECT_URL>/tg-bot?secret=<BOT_TOKEN>
