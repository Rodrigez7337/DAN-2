import { Bot, session } from "https://deno.land/x/grammy@v1.15.3/mod.ts";
import { MyContext } from "../src/bot.ts";
import { SatoshiToken } from "../config.ts";
import { fetchChatGPT, messagesToText } from "../src/openai/openai.ts";
import { Character } from "../src/character.ts";
import { queue } from "../src/queue.ts";
import { SessionData } from "../src/session.ts";

const CHAT_CONTEXT_SIZE = 4; // Number of older messages to keep in the chat buffer

const character: Character = {
  name: "Satoshi Nakamoto",
  instruction: await Deno.readTextFile("./instruction.txt"),
};

// Define the initial session value.
export function createInitialSessionData(): SessionData {
  return {
    character: character,
    chatBuffer: [],
  };
}

const bot = new Bot<MyContext>(SatoshiToken);

// Use the session middleware to keep track of chats
bot.use(session({
  initial: createInitialSessionData,
}));

bot.command("start", async (ctx) => {
  ctx.session.chatBuffer = [];
  await ctx.reply(
    "I am Satoshi Nakamoto, the inventor of Bitcoin. Ask me anything!",
  );
});

bot.on("message", (ctx) => {
  const messageText = ctx.message?.text?.trim();
  const replyToMessageText = ctx.message?.reply_to_message?.text?.trim();
  if (
    messageText &&
    (ctx.chat?.type === "private" ||
      ctx.message?.text?.includes(`@${bot.botInfo.username}`) ||
      ctx.message?.reply_to_message?.from?.id === bot.botInfo.id)
  ) {
    const chatId = ctx.chat.id;
    // Update the chat buffer with the user's message
    ctx.session.chatBuffer.push({
      role: "user",
      content: replyToMessageText
        ? `${replyToMessageText}\n\n${messageText}`
        : messageText,
    });
    // Add async tasks to the queue
    queue.push(async () => {
      // Show the typing indicator as the bot is generating a response
      await bot.api.sendChatAction(chatId, "typing");
      // Call the ChatGPT API to generate a response
      const completionText = await fetchChatGPT(
        ctx.session.chatBuffer,
        ctx.session.character.instruction,
      );
      // Reply to the user
      await bot.api.sendMessage(chatId, completionText);
      // Add response to the chat buffer
      ctx.session.chatBuffer.push({
        role: "assistant",
        content: completionText,
      });
      // Log the conversation
      console.log(
        `****Conversation ID: ${chatId}****\n${
          messagesToText(ctx.session.chatBuffer)
        }`,
      );
      // Update the buffer for the next run:
      const bufferLength = ctx.session.chatBuffer.length;
      if (bufferLength > CHAT_CONTEXT_SIZE) {
        ctx.session.chatBuffer.splice(
          0,
          bufferLength - CHAT_CONTEXT_SIZE,
        );
      }
    });
  }
});

export default bot;
