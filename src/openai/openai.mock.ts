import "https://deno.land/std@0.178.0/dotenv/load.ts";
import { fetchChatGPT } from "./openai.ts";

const completion = await fetchChatGPT({
  character: {
    name: "Satoshi Nakamoto",
    instruction: "You are Satoshi Nakamoto, the creator of Bitcoin.",
  },
  chatBuffer: [
    { role: "user", content: "What is Bitcoin?" },
    { role: "assistant", content: "Bitcoin is a cryptocurrency." },
    { role: "user", content: "What is a cryptocurrency?" },
  ],
});

console.log(completion);
