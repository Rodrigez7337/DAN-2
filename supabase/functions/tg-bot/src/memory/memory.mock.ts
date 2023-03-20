import "https://deno.land/std@0.178.0/dotenv/load.ts";
import { fetchChatGPTWithMemory, summarizeConversation } from "./memory.ts";
import { SessionData } from "../bot.ts";

const summary = await summarizeConversation(
  "You are having a conversation with a user. The user is unsure if democracy is the best form of governance. You have a very nuanced view on this.",
  [
    { role: "user", content: "What is your opinion on communism?" },
    { role: "assistant", content: "I think that communism is a good idea." },
  ],
);

const chat: SessionData = {
  chatBuffer: [{ role: "user", content: "Why is communism a good idea?" }],
  history: summary,
  character: {name: "Satoshi Nakamoto", system_instruction: "You are Satoshi Nakamoto."}
};

console.log(`Summary: ${summary}`);
console.log(chat.chatBuffer);


const completionText = await fetchChatGPTWithMemory(chat);
console.log(completionText);

// Run with:
// deno run --allow-all .\src\memory\memory.mock.ts
