import "https://deno.land/std@0.178.0/dotenv/load.ts";
import bot from "./src/bot.ts";

console.log("Starting bot...")
bot.catch((err) => console.error(err));
bot.start();


