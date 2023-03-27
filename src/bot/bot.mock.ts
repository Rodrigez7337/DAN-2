import "https://deno.land/std@0.178.0/dotenv/load.ts";
import bot from "./bot.ts";
import { run } from "https://deno.land/x/grammy_runner@v2.0.2/mod.ts";


// Delete webhook first: https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook

console.log("Running bot...");
run(bot);


