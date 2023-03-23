import "https://deno.land/std@0.178.0/dotenv/load.ts";
import bot from "./src/bot.ts";
import { run } from "https://deno.land/x/grammy_runner@v2.0.2/mod.ts";


console.log("Running bot...")
run(bot);