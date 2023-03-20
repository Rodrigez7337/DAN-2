import "https://deno.land/std@0.178.0/dotenv/load.ts";
import { fetchChatGPT } from "./openai.ts";

const completion = await fetchChatGPT([
  {
    role: "system",
    content: "You are Satoshi Nakamoto, the inventor of Bitcoin.",
  },
  { role: "user", content: "Hello" },
]);
console.log(completion);
